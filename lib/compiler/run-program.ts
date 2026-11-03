import type { CheckRequest, RunReply } from './checker';

const COMPILER_FAILED = 'the compiler could not start';

let worker: Worker | undefined;
let lastId = 0;
const waiting = new Map<number, (reply: RunReply) => void>();
// A program gives the same answer each time, so a page showing it twice runs it once.
const runs = new Map<string, Promise<RunReply>>();

function runningWorker() {
  if (worker) return worker;
  const started = new Worker(new URL('./check-worker.ts', import.meta.url));
  started.addEventListener('message', ({ data }: MessageEvent<RunReply>) => {
    waiting.get(data.id)?.(data);
    waiting.delete(data.id);
  });
  started.addEventListener('error', () => {
    started.terminate();
    worker = undefined;
    for (const [id, answer] of waiting) answer({ id, failure: COMPILER_FAILED });
    waiting.clear();
    runs.clear();
  });
  worker = started;
  return started;
}

/** What the compiler in this page says for the project `files`, and what the program printed. */
export function runProgram(files: Record<string, string>): Promise<RunReply> {
  const key = JSON.stringify(files);
  const known = runs.get(key);
  if (known) return known;
  const id = ++lastId;
  const reply = new Promise<RunReply>((answer) => {
    waiting.set(id, answer);
    runningWorker().postMessage({ id, files, run: true } satisfies CheckRequest);
  });
  runs.set(key, reply);
  // A failure says nothing about the program, so the next page to ask tries again.
  reply.then(({ failure }) => {
    if (failure !== undefined) runs.delete(key);
  });
  return reply;
}
