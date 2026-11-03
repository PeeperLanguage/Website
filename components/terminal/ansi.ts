// The terminal colors the compiler's printer uses (crates/base/diagnostics/src/colors.rs).
const colors: Record<string, string> = {
  '1;31': 'font-semibold text-red-600 dark:text-red-400',
  '31': 'text-red-600 dark:text-red-400',
  '1;33': 'font-semibold text-amber-600 dark:text-amber-400',
  '1;36': 'font-semibold text-cyan-700 dark:text-cyan-400',
  '32': 'text-green-700 dark:text-green-400',
  '33': 'text-amber-600 dark:text-amber-400',
  '34': 'text-sky-600 dark:text-sky-400',
  '35': 'text-violet-600 dark:text-violet-400',
  '36': 'text-cyan-600 dark:text-cyan-400',
  '37': 'text-fd-foreground',
  '90': 'text-fd-muted-foreground/60',
  '38;5;208': 'text-orange-600 dark:text-orange-400',
  '38;5;215': 'text-orange-600 dark:text-orange-300',
  '38;5;120': 'text-green-700 dark:text-green-400',
  // the text a fix adds
  '38;5;22;48;5;114':
    'rounded-sm bg-green-200 text-green-950 dark:bg-green-400/25 dark:text-green-200',
};

// A terminal color code, ESC [ <numbers> m, with the numbers captured.
const colorCode = new RegExp(`${String.fromCharCode(27)}\\[([\\d;]*)m`);

/** A stretch of terminal text in one color. */
export type TerminalPiece = { text: string; className?: string };

/** Each line of terminal `text`, as its pieces. A newline at the very end starts no new line. */
export function terminalLines(text: string) {
  return text
    .replace(/\n$/, '')
    .split('\n')
    .map((line) => {
      const pieces: TerminalPiece[] = [];
      let className: string | undefined;
      // split puts each color code at an odd place, between the texts
      line.split(colorCode).forEach((part, at) => {
        if (at % 2 === 1) {
          className = colors[part];
        } else if (part !== '') {
          pieces.push({ text: part, className });
        }
      });
      return pieces;
    });
}

/** Terminal `text` without its colors. */
export function plainTerminalText(text: string) {
  return terminalLines(text)
    .map((pieces) => pieces.map((piece) => piece.text).join(''))
    .join('\n');
}
