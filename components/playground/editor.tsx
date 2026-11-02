'use client';
import { shikiToMonaco } from '@shikijs/monaco';
import type * as Monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import type { Entry } from '@/lib/checker';
import { highlighter } from '@/lib/highlight';

const LANGUAGE = 'peeper';
const THEMES = { light: 'peeper-light', dark: 'peeper-dark' };

// The site's code colors on `--color-fd-card`, as Monaco takes only hex.
const COLORS = {
  light: { base: 'github-light', background: '#edf3f1', lineHighlight: '#0000000a' },
  dark: { base: 'github-dark', background: '#0e1015', lineHighlight: '#ffffff0a' },
};

const SEVERITIES = { error: 'Error', warning: 'Warning', info: 'Info', hint: 'Hint' } as const;

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
  for (const [mode, name] of Object.entries(THEMES) as ['light' | 'dark', string][]) {
    const { base, background, lineHighlight } = COLORS[mode];
    const theme = shiki.getTheme(base);
    await shiki.loadTheme({
      ...theme,
      name,
      colors: {
        ...theme.colors,
        'editor.background': background,
        'editorGutter.background': background,
        'minimap.background': background,
        'editorStickyScroll.background': background,
        'editor.lineHighlightBackground': lineHighlight,
      },
    });
  }
  api.languages.register({ id: LANGUAGE });
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

function siteTheme() {
  return document.documentElement.classList.contains('dark') ? THEMES.dark : THEMES.light;
}

/** What Monaco shows for `entry`: a wavy line, and all it said on hover. */
function marker(api: typeof Monaco, { severity, code, message, place, related }: Entry) {
  if (!place) return [];
  return {
    severity: api.MarkerSeverity[SEVERITIES[severity]],
    code,
    message: place.message ? `${message}\n${place.message}` : message,
    startLineNumber: place.start.line,
    startColumn: place.start.column,
    endLineNumber: place.end.line,
    endColumn: place.end.column,
    relatedInformation: related.map(({ file, message, start, end }) => ({
      resource: api.Uri.file(file),
      message,
      startLineNumber: start.line,
      startColumn: start.column,
      endLineNumber: end.line,
      endColumn: end.column,
    })),
  };
}

/**
 * Monaco on the `active` one of `files`, each of which keeps its own undo, folds and scroll.
 * From here on a file's text is the editor's, as `files` can lag behind fast typing: to replace
 * it, give the editor a new `key`.
 */
export function Editor({
  files,
  active,
  entries,
  onEdit,
  onCaret,
}: {
  files: Record<string, string>;
  active: string;
  entries: Entry[];
  onEdit: (file: string, text: string) => void;
  onCaret: (line: number, column: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<{
    api: typeof Monaco;
    view: Monaco.editor.IStandaloneCodeEditor;
  }>();
  const models = useRef(new Map<string, Monaco.editor.ITextModel>());
  const viewStates = useRef(new Map<string, Monaco.editor.ICodeEditorViewState | null>());
  const [failed, setFailed] = useState(false); // Monaco did not load
  const shown = useRef<string>(undefined);
  // The latest callbacks: the editor outlives the render that made it.
  const report = useRef({ onEdit, onCaret });
  report.current = { onEdit, onCaret };

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
        themes.observe(document.documentElement, { attributeFilter: ['class'] });
        // A phone has no width to spare for the minimap.
        const wide = matchMedia('(min-width: 768px)');
        const fitMinimap = () => view.updateOptions({ minimap: { enabled: wide.matches } });
        fitMinimap();
        wide.addEventListener('change', fitMinimap);
        setEditor({ api, view });
        end = () => {
          wide.removeEventListener('change', fitMinimap);
          themes.disconnect();
          view.dispose();
          for (const model of models.current.values()) model.dispose();
          models.current.clear();
          viewStates.current.clear();
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
      const model = api.editor.createModel(text, LANGUAGE, api.Uri.file(file));
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
    shown.current = active;
    const caret = view.getPosition();
    if (caret) report.current.onCaret(caret.lineNumber, caret.column);
    if (before) view.focus();
  }, [editor, files, active]);

  useEffect(() => {
    if (!editor) return;
    const { api } = editor;
    for (const [file, model] of models.current) {
      const own = entries.filter((entry) => entry.place?.file === file);
      api.editor.setModelMarkers(
        model,
        LANGUAGE,
        own.flatMap((entry) => marker(api, entry)),
      );
    }
  }, [editor, entries]);

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
      {!editor && (
        <div className="absolute inset-0 overflow-auto bg-fd-card p-4 font-mono text-sm">
          <p role="status" className="mb-3 font-sans text-xs text-fd-muted-foreground">
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
          <pre>{files[active]}</pre>
        </div>
      )}
    </div>
  );
}
