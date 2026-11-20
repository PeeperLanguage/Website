import type { ThemeRegistration } from 'shiki';

/*
 * Zed's built-in One Dark and One Light, the code colors of its `syntax` table and those of its
 * editor, from
 * https://github.com/zed-industries/zed/blob/main/assets/themes/one/one.json (MIT, Copyright (c)
 * 2014 GitHub Inc.). Zed colors by tree-sitter capture names, shiki by TextMate scopes, so each
 * capture lists the scopes that `lib/highlight/peeper.tmLanguage.json`, TOML and shell give the
 * same text. Fields and parameters stay plain: the TextMate grammar has no scope for them.
 */
const CAPTURE_SCOPES = {
  comment: ['comment'],
  'comment.doc': ['comment.line.documentation'],
  keyword: ['keyword', 'storage'],
  operator: ['keyword.operator'],
  type: [
    'entity.name.type',
    'support.type',
    'entity.name.section',
    'entity.other.attribute-name.table',
  ],
  function: ['entity.name.function', 'support.function', 'entity.name.command'],
  number: ['constant.numeric'],
  boolean: ['constant.language'],
  constant: ['constant', 'constant.character'],
  string: ['string', 'punctuation.definition.string'],
  'string.escape': ['constant.character.escape'],
  'variable.special': ['variable.language'],
  'variable.parameter': ['variable.parameter'],
  property: ['support.type.property-name', 'variable.other.member'],
  attribute: ['entity.other.attribute-name', 'meta.attribute'],
  punctuation: ['punctuation'],
} as const;

type Capture = keyof typeof CAPTURE_SCOPES;

/** Zed's editor colors that Monaco has a place for, by their names in Zed's theme. */
type EditorColors = {
  background: string;
  foreground: string;
  line_number: string;
  active_line: string; // `editor.active_line.background`
  surface: string; // `elevated_surface.background`, as of hover
  panel: string; // `panel.background`, as of the file tree and the tab bar
  text: string; // of what is not code
  text_muted: string; // `text.muted`
  hover: string; // `element.hover`
  border: string;
  error: string;
  warning: string;
  info: string;
  hint: string;
};

function zedTheme(
  name: string,
  type: 'light' | 'dark',
  editor: EditorColors,
  colors: Record<Capture, string>,
): ThemeRegistration {
  return {
    name,
    type,
    colors: {
      'editor.background': editor.background,
      'editor.foreground': editor.foreground,
      'editorLineNumber.foreground': editor.line_number,
      'editor.lineHighlightBackground': editor.active_line,
      'editorWidget.background': editor.surface,
      'editorWidget.border': editor.border,
      'editorHoverWidget.background': editor.surface,
      'editorHoverWidget.border': editor.border,
      'sideBar.background': editor.panel,
      'editorGroupHeader.tabsBackground': editor.panel,
      foreground: editor.text,
      descriptionForeground: editor.text_muted,
      'list.hoverBackground': editor.hover,
      'editorError.foreground': editor.error,
      'editorWarning.foreground': editor.warning,
      'editorInfo.foreground': editor.info,
      'editorHint.foreground': editor.hint,
    },
    tokenColors: [
      { settings: { foreground: editor.foreground, background: editor.background } },
      ...(Object.entries(CAPTURE_SCOPES) as [Capture, readonly string[]][]).map(
        ([capture, scope]) => ({ scope: [...scope], settings: { foreground: colors[capture] } }),
      ),
    ],
  };
}

export const zedOneDark = zedTheme(
  'zed-one-dark',
  'dark',
  {
    background: '#282c33',
    foreground: '#acb2be',
    line_number: '#4e5a5f',
    active_line: '#2f343ebf',
    surface: '#2f343e',
    panel: '#2f343e',
    text: '#dce0e5',
    text_muted: '#a9afbc',
    hover: '#363c46',
    border: '#464b57',
    error: '#d07277',
    warning: '#dec184',
    info: '#74ade8',
    hint: '#788ca6',
  },
  {
    comment: '#5d636f',
    'comment.doc': '#878e98',
    keyword: '#b477cf',
    operator: '#6eb4bf',
    type: '#6eb4bf',
    function: '#73ade9',
    number: '#bf956a',
    boolean: '#bf956a',
    constant: '#dfc184',
    string: '#a1c181',
    'string.escape': '#878e98',
    'variable.special': '#bf956a',
    'variable.parameter': '#d07277',
    property: '#d07277',
    attribute: '#74ade8',
    punctuation: '#b2b9c6',
  },
);

export const zedOneLight = zedTheme(
  'zed-one-light',
  'light',
  {
    background: '#fafafa',
    foreground: '#242529',
    line_number: '#b4b4bb',
    active_line: '#ebebecbf',
    surface: '#ebebec',
    panel: '#ebebec',
    text: '#242529',
    text_muted: '#58585a',
    hover: '#dfdfe0',
    border: '#c9c9ca',
    error: '#d36151',
    warning: '#a48819',
    info: '#5c78e2',
    hint: '#7274a7',
  },
  {
    comment: '#a2a3a7',
    'comment.doc': '#7c7e86',
    keyword: '#a449ab',
    operator: '#3882b7',
    type: '#3882b7',
    function: '#5b79e3',
    number: '#ad6e25',
    boolean: '#ad6e25',
    constant: '#c18401',
    string: '#649f57',
    'string.escape': '#7c7e86',
    'variable.special': '#ad6e25',
    'variable.parameter': '#d3604f',
    property: '#d3604f',
    attribute: '#5c78e2',
    punctuation: '#4d4f52',
  },
);
