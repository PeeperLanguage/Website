/// <reference lib="webworker" />
import type { CheckReply, CheckRequest } from './checker';

// The compiler's checker, `crates/driver/browser` in the compiler repo, is a
// program that reads the files from stdin and writes its findings to stdout.
// This gives it those two streams, and the few other calls Rust's standard
// library makes; it touches no disk here, so the rest report that none is there.
const checker = WebAssembly.compileStreaming(fetch('/peeper-check.wasm'));

const SUCCESS = 0;
const NO_SUCH_FILE_DESCRIPTOR = 8;
const NOT_SUPPORTED = 52;
const STDIN = 0;
const STDOUT = 1;

/** Thrown by `proc_exit`, the only way out of the middle of a program. */
class Exit {
  constructor(readonly code: number) {}
}

/** What the checker printed for `input`, and its exit code. */
async function run(input: string): Promise<{ code: number; output: string }> {
  // Read anew each time: when wasm's memory grows, an old view of it goes empty.
  let memory: () => DataView;
  let stdin = new TextEncoder().encode(input);
  const stdout: Uint8Array[] = [];
  const bytes = (at: number, length: number) => new Uint8Array(memory().buffer, at, length);

  const imports = {
    fd_read(fd: number, buffers: number, count: number, read: number) {
      if (fd !== STDIN) return NO_SUCH_FILE_DESCRIPTOR;
      let total = 0;
      for (let index = 0; index < count; index++) {
        const at = memory().getUint32(buffers + index * 8, true);
        const room = memory().getUint32(buffers + index * 8 + 4, true);
        const piece = stdin.subarray(0, room);
        bytes(at, piece.length).set(piece);
        stdin = stdin.subarray(piece.length);
        total += piece.length;
      }
      memory().setUint32(read, total, true);
      return SUCCESS;
    },
    fd_write(fd: number, buffers: number, count: number, written: number) {
      let total = 0;
      for (let index = 0; index < count; index++) {
        const at = memory().getUint32(buffers + index * 8, true);
        const length = memory().getUint32(buffers + index * 8 + 4, true);
        if (fd === STDOUT) stdout.push(bytes(at, length).slice());
        total += length;
      }
      memory().setUint32(written, total, true);
      return SUCCESS;
    },
    random_get(at: number, length: number) {
      crypto.getRandomValues(bytes(at, length));
      return SUCCESS;
    },
    clock_time_get(_clock: number, _precision: bigint, time: number) {
      memory().setBigUint64(time, BigInt(Date.now()) * 1_000_000n, true);
      return SUCCESS;
    },
    environ_sizes_get(count: number, size: number) {
      memory().setUint32(count, 0, true);
      memory().setUint32(size, 0, true);
      return SUCCESS;
    },
    environ_get: () => SUCCESS,
    sched_yield: () => SUCCESS,
    fd_close: () => SUCCESS,
    fd_prestat_get: () => NO_SUCH_FILE_DESCRIPTOR,
    fd_prestat_dir_name: () => NO_SUCH_FILE_DESCRIPTOR,
    fd_fdstat_get: () => NO_SUCH_FILE_DESCRIPTOR,
    fd_filestat_get: () => NO_SUCH_FILE_DESCRIPTOR,
    fd_readdir: () => NO_SUCH_FILE_DESCRIPTOR,
    path_filestat_get: () => NOT_SUPPORTED,
    path_open: () => NOT_SUPPORTED,
    proc_exit(code: number): never {
      throw new Exit(code);
    },
  };

  const instance = await WebAssembly.instantiate(await checker, {
    wasi_snapshot_preview1: imports,
  });
  const exports = instance.exports as { memory: WebAssembly.Memory; _start: () => void };
  memory = () => new DataView(exports.memory.buffer);
  let code = 0;
  try {
    exports._start();
  } catch (stopped) {
    if (!(stopped instanceof Exit)) throw stopped;
    code = stopped.code;
  }
  const output = new TextDecoder().decode(await new Blob(stdout as BlobPart[]).arrayBuffer());
  return { code, output };
}

// Very deep code can overflow wasm's stack, a trap, or the browser's own, a
// `RangeError`. That ends this one instance, and `run` starts a new one for
// each check, so the next check is not touched.
addEventListener('message', async ({ data }: MessageEvent<CheckRequest>) => {
  let reply: CheckReply;
  try {
    const { code, output } = await run(JSON.stringify(data.files));
    reply =
      code === 0
        ? { id: data.id, entries: JSON.parse(output) }
        : { id: data.id, failure: 'the checker could not read the code' };
  } catch (stopped) {
    const failure =
      stopped instanceof WebAssembly.RuntimeError || stopped instanceof RangeError
        ? 'this code is too deeply nested to check here'
        : 'the checker could not start';
    reply = { id: data.id, failure };
  }
  postMessage(reply);
});
