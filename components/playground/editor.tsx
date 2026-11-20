'use client';
import { shikiToMonaco } from '@shikijs/monaco';
import type * as Monaco from 'monaco-editor';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';
import { CodeTokens } from '@/components/code/code-card';
import type { CheckRequest, Entry, PlaceReply } from '@/lib/compiler/checker';
import { languageOf } from '@/lib/compiler/project';
import { SHIKI_THEMES, shownCodeTheme } from '@/lib/highlight/code-theme';
import { codeTokens, highlighter, type Token } from '@/lib/highlight/highlight';
import type { ViewOptions } from './view-options';

const LANGUAGE = 'peeper';

// A problem's color where a theme gives none: its Tailwind 500 color mixed 60% with the text color,
// softer than the pure one Monaco would draw.
const SOFT_PROBLEM_COLORS = {
  light: { error: '#953030', warning: '#956218', info: '#006895' },
  dark: { error: '#fe8b84', warning: '#f9be78', info: '#76c4f5' },
};

/** The `SHIKI_THEMES` theme `key`, and the color it gives a problem of each kind. */
function themeOf(shiki: HighlighterCore, key: string) {
  const input = SHIKI_THEMES[key];
  const theme = shiki.getTheme(typeof input === 'string' ? input : (input.name ?? key));
  const soft = SOFT_PROBLEM_COLORS[key.endsWith('-dark') ? 'dark' : 'light'];
  const own = theme.colors ?? {};
  const problems = {
    error: own['editorError.foreground'] ?? soft.error,
    warning: own['editorWarning.foreground'] ?? soft.warning,
    info: own['editorInfo.foreground'] ?? soft.info,
  };
  return { theme, problems };
}

/**
 * The colors of the theme `key` for the whole playground window: the site's own color names,
 * which all of it is drawn in, and `--editor-<name>` for the editor's background and each kind of
 * problem. A color a theme lacks is mixed from its text and its panels.
 */
function windowColors(shiki: HighlighterCore, key: string) {
  const { theme, problems } = themeOf(shiki, key);
  const own = theme.colors ?? {};
  const panel = own['sideBar.background'] ?? theme.bg;
  const text = own.foreground ?? theme.fg;
  const mixed = (percent: number) => `color-mix(in oklab, ${text} ${percent}%, ${panel})`;
  return {
    '--color-fd-background': theme.bg,
    '--color-fd-foreground': text,
    '--color-fd-card': panel,
    '--color-fd-popover': panel,
    '--color-fd-popover-foreground': text,
    '--color-fd-muted': own['editorGroupHeader.tabsBackground'] ?? panel,
    '--color-fd-muted-foreground': own.descriptionForeground ?? mixed(65),
    '--color-fd-border': mixed(15),
    '--color-fd-accent': own['list.hoverBackground'] ?? mixed(8),
    '--color-fd-accent-foreground': text,
    '--editor-background': theme.bg,
    '--editor-error': problems.error,
    '--editor-warning': problems.warning,
    '--editor-info': problems.info,
  } as CSSProperties;
}

/** The shown code theme's colors for the playground window (`windowColors`), as it changes. */
export function useWindowColors() {
  const [colors, setColors] = useState<CSSProperties>();
  useEffect(() => {
    let ended = false;
    let watching: MutationObserver | undefined;
    highlighter.then((shiki) => {
      if (ended) return;
      const show = () => setColors(windowColors(shiki, shownCodeTheme()));
      show();
      watching = new MutationObserver(show);
      watching.observe(document.documentElement, { attributeFilter: ['class', 'data-code-theme'] });
    });
    return () => {
      ended = true;
      watching?.disconnect();
    };
  }, []);
  return colors;
}

const SEVERITIES = { error: 'Error', warning: 'Warning', info: 'Info', hint: 'Hint' } as const;
const SEVERITY_ORDER = Object.keys(SEVERITIES);

/** Monaco with Peeper in it: heavy, so loaded once, and only when a page has an editor. */
let monaco: Promise<typeof Monaco> | undefined;

async function setUpMonaco() {
  globalThis.MonacoEnvironment = {
    getWorker: () =>
      new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
        type: 'module',
      }),
  };
  // The editor without the languages `monaco-editor` itself brings in. It has no types of its own.
  // @ts-expect-error
  const api: typeof Monaco = await import('monaco-editor/esm/vs/editor/edcore.main.js');
  const shiki = await highlighter;
  for (const key of Object.keys(SHIKI_THEMES)) {
    const { theme, problems } = themeOf(shiki, key);
    await shiki.loadTheme({
      ...theme,
      name: monacoTheme(key),
      colors: {
        ...theme.colors,
        'editorError.foreground': problems.error,
        'editorWarning.foreground': problems.warning,
        'editorInfo.foreground': problems.info,
        'editorHint.foreground': theme.colors?.['editorHint.foreground'] ?? problems.info,
      },
    });
  }
  api.languages.register({ id: LANGUAGE });
  api.languages.register({ id: 'toml' });
  api.languages.setLanguageConfiguration(LANGUAGE, {
    comments: { lineComment: '//', blockComment: ['/*', '*/'] },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    indentationRules: {
      increaseIndentPattern: /[{[(]\s*(\/\/.*)?$/,
      decreaseIndentPattern: /^\s*[}\])]/,
    },
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
  });
  shikiToMonaco(shiki, api as Parameters<typeof shikiToMonaco>[1]);
  return api;
}

/** The code a new project starts with, and its lines colored by the server for the first paint. */
export type StartingCode = { code: string; lines: Token[][] };

/** `text` just where Monaco will draw it, so that the editor arriving does not show. */
function CodePreview({
  file,
  text,
  starting,
}: {
  file: string;
  text: string;
  starting: StartingCode;
}) {
  const [shiki, setShiki] = useState<HighlighterCore>();
  useEffect(() => {
    highlighter.then(setShiki);
  }, []);
  const lines =
    text === starting.code
      ? starting.lines
      : shiki
        ? codeTokens(shiki, text, languageOf(file))
        : text.split('\n').map((content) => [{ content, style: {} }]);
  return (
    <pre className="w-max min-w-full font-mono text-sm leading-[19px] [font-feature-settings:'calt'_0,'liga'_0]">
      {lines.map((tokens, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a line has no identity but its place
        <div key={index} className="flex h-[19px]">
          <span
            aria-hidden
            className="w-[42px] shrink-0 select-none text-right text-fd-muted-foreground/50"
          >
            {index + 1}
          </span>
          <code className="ml-[26px]">
            <CodeTokens tokens={tokens} />
          </code>
        </div>
      ))}
    </pre>
  );
}

/** Monaco's name for the `SHIKI_THEMES` theme `key`, with a color for each kind of problem. */
function monacoTheme(key: string) {
  return `peeper-${key}`;
}

function siteTheme() {
  return monacoTheme(shownCodeTheme());
}

/**
 * What Monaco shows for `entry` in `model`: a wavy line, and all it said on hover. An empty place
 * at a line's end, as a missing `;`, is drawn under the last character: Monaco would draw it under
 * the next one, the inline diagnostic there.
 */
function marker(
  api: typeof Monaco,
  model: Monaco.editor.ITextModel,
  { severity, code, message, place, related }: Entry,
) {
  if (!place) return [];
  const { start, end } = place;
  const atLineEnd =
    start.line === end.line &&
    start.column === end.column &&
    start.line <= model.getLineCount() &&
    start.column > 1 &&
    start.column >= model.getLineMaxColumn(start.line);
  return {
    severity: api.MarkerSeverity[SEVERITIES[severity]],
    code,
    message: place.message ? `${message}\n${place.message}` : message,
    ...range(place),
    ...(atLineEnd && { startColumn: start.column - 1 }),
    relatedInformation: related.map(({ file, message, start, end }) => ({
      resource: api.Uri.file(file),
      message,
      ...range({ start, end }),
    })),
  };
}

/**
 * Hover and go to definition in Peeper files, from a checker of their own given the text of each
 * of `models` as it is now. A definition in another file is opened with `open`, which is told where
 * in it to land. Disposing ends them and the checker.
 */
function answerPlaces(
  api: typeof Monaco,
  models: Map<string, Monaco.editor.ITextModel>,
  open: (file: string, at: Monaco.IRange | Monaco.IPosition | undefined) => void,
) {
  const checker = new Worker(new URL('../../lib/compiler/check-worker.ts', import.meta.url));
  const waiting = new Map<number, (reply: PlaceReply) => void>();
  let lastId = 0;
  checker.addEventListener('message', ({ data }: MessageEvent<PlaceReply>) => {
    waiting.get(data.id)?.(data);
    waiting.delete(data.id);
  });
  const fileOf = (uri: Monaco.Uri) =>
    [...models].find(([, model]) => model.uri.toString() === uri.toString())?.[0];
  function ask(model: Monaco.editor.ITextModel, position: Monaco.Position) {
    const file = fileOf(model.uri);
    if (!file) return undefined;
    const files = Object.fromEntries([...models].map(([name, each]) => [name, each.getValue()]));
    const place = { file, line: position.lineNumber, column: position.column };
    const id = ++lastId;
    return new Promise<PlaceReply>((answer) => {
      waiting.set(id, answer);
      checker.postMessage({ id, files, place } satisfies CheckRequest);
    });
  }
  const answers = [
    api.languages.registerHoverProvider(LANGUAGE, {
      async provideHover(model, position) {
        const hover = (await ask(model, position))?.hover;
        return hover ? { contents: [{ value: hover }] } : null;
      },
    }),
    api.languages.registerDefinitionProvider(LANGUAGE, {
      async provideDefinition(model, position) {
        const found = (await ask(model, position))?.definition;
        const declared = found && models.get(found.file);
        return declared ? { uri: declared.uri, range: range(found) } : null;
      },
    }),
    api.editor.registerEditorOpener({
      openCodeEditor(source, resource, at) {
        // The file shown moves its own cursor.
        if (source.getModel()?.uri.toString() === resource.toString()) return false;
        const file = fileOf(resource);
        if (file) open(file, at);
        return file !== undefined;
      },
    }),
  ];
  return {
    dispose() {
      for (const answer of answers) answer.dispose();
      checker.terminate();
    },
  };
}

/** Monaco's range of what the checker gave from `start` to `end`. */
function range({ start, end }: { start: { line: number; column: number }; end: typeof start }) {
  return {
    startLineNumber: start.line,
    startColumn: start.column,
    endLineNumber: end.line,
    endColumn: end.column,
  };
}

/**
 * Monaco on the `active` one of `files`, each of which keeps its own undo, folds and scroll.
 * From here on a file's text is the editor's, as `files` can lag behind fast typing: to replace
 * it, give the editor a new `key`. Hover and go to definition ask a checker of its own; a name
 * declared in another file opens it, with `onOpen`.
 */
export function Editor({
  files,
  active,
  starting,
  entries,
  view,
  onEdit,
  onCaret,
  onOpen,
}: {
  files: Record<string, string>;
  active: string;
  starting: StartingCode;
  entries: Entry[];
  view: ViewOptions;
  onEdit: (file: string, text: string) => void;
  onCaret: (line: number, column: number) => void;
  onOpen: (file: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<{
    api: typeof Monaco;
    view: Monaco.editor.IStandaloneCodeEditor;
  }>();
  const models = useRef(new Map<string, Monaco.editor.ITextModel>());
  const viewStates = useRef(new Map<string, Monaco.editor.ICodeEditorViewState | null>());
  // Each file's inline diagnostics, by Monaco's ids, to replace on the next check.
  const inline = useRef(new Map<string, string[]>());
  const [failed, setFailed] = useState(false); // Monaco did not load
  const [painted, setPainted] = useState(false); // Monaco has drawn the code
  const shown = useRef<string>(undefined);
  // Where go to definition lands in a file it opens, once that file is shown.
  const landing = useRef<Monaco.IRange | Monaco.IPosition>(undefined);
  // The latest callbacks: the editor outlives the render that made it.
  const report = useRef({ onEdit, onCaret, onOpen });
  report.current = { onEdit, onCaret, onOpen };

  useEffect(() => {
    let ended = false;
    let end = () => {
      ended = true;
    };
    monaco ??= setUpMonaco();
    monaco
      .then((api) => {
        if (ended || !host.current) return;
        const view = api.editor.create(host.current, {
          model: null,
          theme: siteTheme(),
          ariaLabel: 'Peeper code. Press Escape, then Tab, to leave the editor.',
          editContext: false, // a real textarea: the site's key shortcuts skip those, not Monaco's div
          automaticLayout: true,
          fixedOverflowWidgets: true, // the window around it clips
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
        });
        view.onDidBlurEditorWidget(() => view.updateOptions({ tabFocusMode: false }));
        view.onDidChangeCursorPosition(({ position }) => {
          view.updateOptions({ tabFocusMode: false });
          report.current.onCaret(position.lineNumber, position.column);
        });
        document.fonts.ready.then(() => api.editor.remeasureFonts());
        const themes = new MutationObserver(() => api.editor.setTheme(siteTheme()));
        themes.observe(document.documentElement, { attributeFilter: ['class', 'data-code-theme'] });
        const answers = answerPlaces(api, models.current, (file, at) => {
          landing.current = at;
          report.current.onOpen(file);
        });
        setEditor({ api, view });
        end = () => {
          answers.dispose();
          themes.disconnect();
          view.dispose();
          for (const model of models.current.values()) model.dispose();
          models.current.clear();
          viewStates.current.clear();
          inline.current.clear();
          shown.current = undefined;
        };
      })
      .catch(() => setFailed(true));
    return () => end();
  }, []);

  useEffect(() => {
    if (!editor) return;
    const { api, view } = editor;
    for (const [file, model] of models.current) {
      if (file in files) continue;
      model.dispose();
      models.current.delete(file);
      viewStates.current.delete(file);
    }
    for (const [file, text] of Object.entries(files)) {
      if (models.current.has(file)) continue;
      const model = api.editor.createModel(text, languageOf(file), api.Uri.file(file));
      model.updateOptions({ tabSize: 4, insertSpaces: true });
      model.onDidChangeContent(() => report.current.onEdit(file, model.getValue()));
      models.current.set(file, model);
    }
    if (shown.current === active) return;
    const before = shown.current;
    if (before) viewStates.current.set(before, view.saveViewState());
    view.setModel(models.current.get(active) ?? null);
    const kept = viewStates.current.get(active);
    if (kept) view.restoreViewState(kept);
    const at = landing.current;
    landing.current = undefined;
    if (at && 'startLineNumber' in at) {
      view.setSelection(at);
      view.revealRangeInCenter(at);
    } else if (at) {
      view.setPosition(at);
      view.revealPositionInCenter(at);
    }
    shown.current = active;
    requestAnimationFrame(() => setPainted(true)); // after Monaco's own frame for the new model
    const caret = view.getPosition();
    if (caret) report.current.onCaret(caret.lineNumber, caret.column);
    if (before) view.focus();
  }, [editor, files, active]);

  // A phone has no width to spare for the minimap.
  useEffect(() => {
    if (!editor) return;
    const wide = matchMedia('(min-width: 768px)');
    const fit = () =>
      editor.view.updateOptions({ minimap: { enabled: view.minimap && wide.matches } });
    fit();
    wide.addEventListener('change', fit);
    return () => wide.removeEventListener('change', fit);
  }, [editor, view.minimap]);

  useEffect(() => {
    if (!editor) return;
    const { api } = editor;
    for (const [file, model] of models.current) {
      const own = entries.filter((entry) => entry.place?.file === file);
      api.editor.setModelMarkers(
        model,
        LANGUAGE,
        own.flatMap((entry) => marker(api, model, entry)),
      );
      // After the end of each line with a problem, the first line of its worst one.
      const lines = new Map<number, Entry>();
      if (view.inlineDiagnostics) {
        const worstFirst = own.toSorted(
          (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
        );
        for (const entry of worstFirst) {
          const line = entry.place?.start.line;
          if (line && line <= model.getLineCount() && !lines.has(line)) lines.set(line, entry);
        }
      }
      const shown = [...lines].map(([line, { severity, message }]) => {
        const end = model.getLineMaxColumn(line);
        return {
          range: new api.Range(line, end, line, end),
          options: {
            showIfCollapsed: true,
            after: {
              content: `    ${message.split('\n')[0]}`,
              inlineClassName: `inline-diagnostic inline-diagnostic-${severity}`,
            },
          },
        };
      });
      inline.current.set(file, model.deltaDecorations(inline.current.get(file) ?? [], shown));
    }
  }, [editor, entries, view.inlineDiagnostics]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only hears keys the editor inside it let go
    <div
      // Tab indents here, so a keyboard needs a way out: the next Tab leaves after an Escape that
      // gets this far. One Monaco uses, to close a suggestion or a selection, stops inside it.
      onKeyDown={(event) => {
        if (event.key === 'Escape') editor?.view.updateOptions({ tabFocusMode: true });
      }}
      className="relative flex min-h-0 flex-1 flex-col"
    >
      <div ref={host} className="min-h-0 flex-1" />
      {/* Monaco is heavy, so until it comes the code shows as text, and stays if it never does. */}
      {!painted && (
        <div className="absolute inset-0 overflow-auto bg-(--editor-background,var(--color-fd-card))">
          <p
            role="status"
            className={failed ? 'p-4 font-sans text-xs text-fd-muted-foreground' : 'sr-only'}
          >
            {failed
              ? 'The editor could not load, so this code cannot be edited. '
              : 'Loading the editor…'}
            {failed && (
              <button
                type="button"
                onClick={() => location.reload()}
                className="underline underline-offset-4 hover:text-fd-foreground"
              >
                Reload
              </button>
            )}
          </p>
          <CodePreview file={active} text={files[active]} starting={starting} />
        </div>
      )}
    </div>
  );
}
