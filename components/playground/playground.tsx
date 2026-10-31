'use client';
import {
  Check,
  Copy,
  Download,
  FolderTree,
  type LucideIcon,
  Play,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Window } from '@/components/home/window';
import { Editor } from '@/components/playground/editor';
import { FileTree } from '@/components/playground/file-tree';
import { TerminalText } from '@/components/playground/terminal-text';
import type { CheckReply, CheckRequest, RunReply } from '@/lib/checker';
import { cn } from '@/lib/cn';
import { allFolders, baseName, isInside, MAIN } from '@/lib/file-paths';

const QUIET_MS = 200; // after the last key, so typing never waits on a check
const LIMIT_MS = 10_000; // a run past this is ended, as a loop may never finish
const COPIED_MS = 1500; // how long a button says it copied
const VERSION = '0.2.0'; // shortcut: set by hand, update it with `peeper-check.wasm`

const STARTING_CODE = `// Edit this, then press Run.
fn square(x: i64) -> i64 {
    return x * x;
}

fn main() {
    let total = square(4);
    println("total:", total);
}
`;

function newWorker() {
  return new Worker(new URL('../../lib/check-worker.ts', import.meta.url));
}

/** What came of pressing Run: nothing yet, a run going, or how it ended. */
type Run = { state: 'idle' | 'running' | 'stopped' } | RunReply;

/** The output side of the editor: its heading, how the run stands, and what it showed. */
function OutputPane({
  status,
  dot,
  children,
}: {
  status: string;
  dot: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label="Output"
      className="flex h-2/5 min-h-0 flex-col border-t md:h-auto md:min-w-0 md:flex-1 md:border-t-0"
    >
      <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-xs">
        <h2 className="font-semibold tracking-wider text-fd-muted-foreground">OUTPUT</h2>
        <span className="flex items-center gap-2 text-fd-muted-foreground">
          <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
          {status}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px]" aria-live="polite">
        {children}
      </div>
    </section>
  );
}

/** What a run found and printed, then its exit code, in the order a terminal shows them. */
function Output({ run }: { run: Run }) {
  if ('state' in run) {
    if (run.state === 'running') {
      return (
        <OutputPane status="Running" dot="animate-pulse bg-amber-500">
          <p className="text-fd-muted-foreground">Running…</p>
        </OutputPane>
      );
    }
    if (run.state === 'stopped') {
      return (
        <OutputPane status="Stopped" dot="bg-amber-500">
          <p className="text-amber-500">
            Stopped after {LIMIT_MS / 1000} seconds, and what it printed is lost. A program runs
            more slowly here than when compiled.
          </p>
        </OutputPane>
      );
    }
    return (
      <OutputPane status="Ready" dot="bg-emerald-500">
        <div className="space-y-2 text-fd-muted-foreground">
          <p>Your code runs in this page. Nothing is sent anywhere.</p>
          <p>
            Press <kbd className="rounded border px-1.5 py-0.5 text-xs">Ctrl</kbd> +{' '}
            <kbd className="rounded border px-1.5 py-0.5 text-xs">Enter</kbd> to run
          </p>
        </div>
      </OutputPane>
    );
  }
  if (run.failure !== undefined) {
    return (
      <OutputPane status="Failed" dot="bg-red-500">
        <p className="text-amber-500">Could not run: {run.failure}.</p>
      </OutputPane>
    );
  }
  const passed = run.run?.exit_code === 0;
  return (
    <OutputPane status={passed ? 'Done' : 'Failed'} dot={passed ? 'bg-emerald-500' : 'bg-red-500'}>
      {/* Not wrapped: a mark under the source must stay under what it marks. */}
      {run.diagnostics && (
        <pre className="mb-3">
          <TerminalText text={run.diagnostics} />
        </pre>
      )}
      {run.run && (
        <>
          <pre className="whitespace-pre-wrap">
            {run.run.output.map(({ stream, text }, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: each run replaces them all
              <span key={index} className={cn(stream === 'stderr' && 'text-red-500')}>
                {text}
              </span>
            ))}
          </pre>
          <p className="mt-2 text-fd-muted-foreground">Exited with code {run.run.exit_code}.</p>
        </>
      )}
    </OutputPane>
  );
}

/** A title bar button. On a narrow screen it shows only its icon. */
function Action({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-sans text-xs text-fd-muted-foreground transition hover:bg-fd-accent hover:text-fd-accent-foreground disabled:opacity-50"
    >
      <Icon aria-hidden className="size-3.5" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

/** A title bar button that copies `text()`, then says how that went. */
function CopyAction({
  icon,
  label,
  text,
}: {
  icon: LucideIcon;
  label: string;
  text: () => string;
}) {
  const [copied, setCopied] = useState<boolean>(); // unset until a copy ends

  async function copy() {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
    } catch {
      setCopied(false);
    }
    setTimeout(() => setCopied(undefined), COPIED_MS);
  }

  if (copied === undefined) return <Action icon={icon} label={label} onClick={copy} />;
  return (
    <Action icon={copied ? Check : X} label={copied ? 'Copied' : 'Could not copy'} onClick={copy} />
  );
}

/** One tab for each open file, along the top of the code as in an editor. */
function FileTabs({
  tabs,
  active,
  onOpen,
  onClose,
}: {
  tabs: string[];
  active: string;
  onOpen: (file: string) => void;
  onClose: (file: string) => void;
}) {
  return tabs.map((name) => (
    <span
      key={name}
      ref={(tab) => {
        if (name === active) tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }}
      className={cn(
        'group inline-flex shrink-0 items-center border-r border-b',
        name === active
          ? 'border-b-transparent bg-fd-card text-fd-foreground'
          : 'hover:bg-fd-accent',
      )}
    >
      <button
        type="button"
        aria-current={name === active}
        onClick={() => onOpen(name)}
        className={cn('py-2 pl-3', tabs.length === 1 ? 'pr-3' : 'pr-1.5')}
      >
        {name}
      </button>
      {tabs.length > 1 && (
        <button
          type="button"
          aria-label={`Close ${name}`}
          title="Close tab"
          onClick={() => onClose(name)}
          className={cn(
            'mr-1.5 rounded p-0.5 hover:bg-fd-accent focus-visible:opacity-100 max-md:opacity-100',
            name === active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <X aria-hidden className="size-3" />
        </button>
      )}
    </span>
  ));
}

/** Peeper's playground: edit files, with what the checker finds underlined, and run them. */
export function Playground() {
  const [files, setFiles] = useState<Record<string, string>>({ [MAIN]: STARTING_CODE });
  const [linksLoaded, setLinksLoaded] = useState(0);
  const [active, setActive] = useState(MAIN);
  const [tabs, setTabs] = useState([MAIN]); // the open files
  const [folders, setFolders] = useState<string[]>([]); // those with no file in them need this
  const [browsingFiles, setBrowsingFiles] = useState(false); // a phone's tree, over the code
  const [caret, setCaret] = useState({ line: 1, column: 1 });
  const [reply, setReply] = useState<CheckReply>();
  const [run, setRun] = useState<Run>({ state: 'idle' });
  const [split, setSplit] = useState(60); // the code's percent of the width
  const worker = useRef<Worker>(null);
  const latest = useRef(0); // the check whose reply is wanted; older ones are stale

  useEffect(() => {
    // The files of a shared link, here or pasted into this open tab. After
    // the first render, so the server's HTML and the page's agree.
    function loadLink() {
      const shared = Object.fromEntries(new URLSearchParams(location.hash.slice(1)));
      if (!(MAIN in shared)) return;
      setFiles(shared);
      setActive(MAIN);
      setTabs([MAIN]);
      setFolders([]);
      setLinksLoaded((count) => count + 1);
    }
    loadLink();
    addEventListener('hashchange', loadLink);
    const checker = newWorker();
    checker.addEventListener('message', ({ data }: MessageEvent<CheckReply>) => {
      if (data.id === latest.current) setReply(data);
    });
    worker.current = checker;
    return () => {
      removeEventListener('hashchange', loadLink);
      checker.terminate();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      latest.current += 1;
      const request: CheckRequest = { id: latest.current, files };
      worker.current?.postMessage(request);
    }, QUIET_MS);
    return () => clearTimeout(timer);
  }, [files]);

  const names = Object.keys(files).sort();
  const shownFolders = allFolders(names, folders);
  const entries = useMemo(() => reply?.entries ?? [], [reply]);
  const problems = entries.length === 1 ? '1 problem' : `${entries.length || 'No'} problems`;
  const running = 'state' in run && run.state === 'running';

  /** Runs the code in a worker of its own, so ending it cannot touch the checks. */
  function runCode() {
    setRun({ state: 'running' });
    const runner = newWorker();
    const limit = setTimeout(() => {
      runner.terminate();
      setRun({ state: 'stopped' });
    }, LIMIT_MS);
    runner.addEventListener('message', ({ data }: MessageEvent<RunReply>) => {
      clearTimeout(limit);
      runner.terminate();
      setRun(data);
    });
    const request: CheckRequest = { id: 0, files, run: true };
    runner.postMessage(request);
  }

  // Everywhere on the page, and before the editor, whose Ctrl+Enter adds a line.
  useEffect(() => {
    function runOnKey(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!running) runCode();
    }
    addEventListener('keydown', runOnKey, true);
    return () => removeEventListener('keydown', runOnKey, true);
  });

  function openFile(file: string) {
    if (!tabs.includes(file)) setTabs([...tabs, file]);
    setActive(file);
  }

  function closeTab(file: string) {
    const left = tabs.filter((tab) => tab !== file);
    setTabs(left);
    if (active === file) setActive(left[Math.min(tabs.indexOf(file), left.length - 1)]);
  }

  function moveEntries(moves: Map<string, string>) {
    const moved = (path: string) => moves.get(path) ?? path;
    setFiles(Object.fromEntries(Object.entries(files).map(([name, text]) => [moved(name), text])));
    setFolders(shownFolders.map(moved));
    setTabs(tabs.map(moved));
    setActive(moved(active));
  }

  function deleteEntries(paths: string[]) {
    const gone = (path: string) => paths.some((one) => path === one || isInside(path, one));
    setFiles(Object.fromEntries(Object.entries(files).filter(([name]) => !gone(name))));
    setFolders(shownFolders.filter((folder) => !gone(folder))); // a folder outlasts its last file
    const left = tabs.filter((tab) => !gone(tab));
    setTabs(left.length > 0 ? left : [MAIN]);
    if (gone(active)) setActive(left[0] ?? MAIN);
  }

  function exportCode() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([files[active]], { type: 'text/plain' }));
    link.download = baseName(active);
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function moveSplit(percent: number) {
    setSplit(Math.min(80, Math.max(20, percent)));
  }

  function dragSplit(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const { left, width } = (
      event.currentTarget.parentElement as HTMLElement
    ).getBoundingClientRect();
    moveSplit(((event.clientX - left) / width) * 100);
  }

  return (
    <Window
      className="flex h-full flex-col"
      title="Playground"
      actions={
        <>
          <CopyAction
            icon={Share2}
            label="Share"
            text={() => `${location.origin}${location.pathname}#${new URLSearchParams(files)}`}
          />
          <CopyAction icon={Copy} label="Copy" text={() => files[active]} />
          <Action icon={Download} label="Export" onClick={exportCode} />
          <Action
            icon={Trash2}
            label="Clear output"
            disabled={running}
            onClick={() => setRun({ state: 'idle' })}
          />
          <button
            type="button"
            onClick={runCode}
            disabled={running}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-fd-foreground px-3 py-1.5 font-sans text-xs font-semibold text-fd-background transition hover:opacity-85 disabled:opacity-50"
          >
            <Play aria-hidden className="size-3 fill-current" />
            Run
          </button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className="flex min-h-0 flex-1 flex-col md:w-(--split) md:min-w-0 md:flex-none"
          style={{ '--split': `${split}%` } as CSSProperties}
        >
          <div className="relative flex min-h-0 flex-1">
            <FileTree
              key={linksLoaded}
              names={names}
              folders={shownFolders}
              active={active}
              browsing={browsingFiles}
              onOpen={openFile}
              onCreateFile={(file) => {
                setFiles({ ...files, [file]: '' });
                openFile(file);
              }}
              onCreateFolder={(folder) => setFolders([...folders, folder])}
              onMove={moveEntries}
              onDelete={deleteEntries}
              onStopBrowsing={() => setBrowsingFiles(false)}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 font-mono text-xs text-fd-muted-foreground">
                <button
                  type="button"
                  aria-label="Files"
                  onClick={() => setBrowsingFiles(true)}
                  className="shrink-0 border-r border-b px-3 md:hidden"
                >
                  <FolderTree aria-hidden className="size-4" />
                </button>
                <div
                  onWheel={(event) => {
                    event.currentTarget.scrollLeft += event.deltaY;
                  }}
                  className="flex min-w-0 flex-1 overflow-x-auto bg-fd-muted/40 [scrollbar-width:none]"
                >
                  <FileTabs tabs={tabs} active={active} onOpen={setActive} onClose={closeTab} />
                  <span className="flex-1 border-b" />
                </div>
              </div>
              <Editor
                key={linksLoaded}
                files={files}
                active={active}
                entries={entries}
                onEdit={(file, text) => setFiles((now) => ({ ...now, [file]: text }))}
                onCaret={(line, column) => setCaret({ line, column })}
              />
            </div>
          </div>
          <div className="flex gap-4 border-t px-4 py-1.5 font-mono text-[11px] text-fd-muted-foreground">
            <span>
              Ln {caret.line}, Col {caret.column}
            </span>
            <span className="hidden sm:inline">UTF-8</span>
            <span>Peeper {VERSION}</span>
            <span className="ml-auto truncate">
              {!reply && 'Starting the checker…'}
              {reply?.failure && `Could not check: ${reply.failure}.`}
              {reply?.entries && `${problems} underlined`}
            </span>
          </div>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: an `hr` cannot be dragged or focused */}
        <div
          role="separator"
          aria-label="Resize the code and output"
          aria-orientation="vertical"
          aria-valuenow={Math.round(split)}
          aria-valuemin={20}
          aria-valuemax={80}
          tabIndex={0}
          onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={dragSplit}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') moveSplit(split - 2);
            if (event.key === 'ArrowRight') moveSplit(split + 2);
          }}
          className="group relative hidden w-2 shrink-0 cursor-col-resize touch-none border-x bg-fd-muted/50 outline-none transition hover:bg-brand/30 focus-visible:bg-brand/30 md:block"
        >
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 h-12 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fd-muted-foreground/50 transition group-hover:bg-brand"
          />
        </div>
        <Output run={run} />
      </div>
    </Window>
  );
}
