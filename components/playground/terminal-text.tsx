// The compiler's terminal colors (`crates/base/diagnostics/src/colors.rs`), each
// made readable on the site's light and dark backgrounds.
const COLORS: Record<string, string> = {
  '31': 'text-red-600 dark:text-red-400',
  '32': 'text-green-700 dark:text-green-400',
  '33': 'text-amber-600 dark:text-amber-400',
  '34': 'text-blue-600 dark:text-blue-400',
  '35': 'text-purple-600 dark:text-purple-400',
  '36': 'text-cyan-700 dark:text-cyan-400',
  '37': 'text-fd-foreground',
  '90': 'text-fd-muted-foreground',
  '1;31': 'font-bold text-red-600 dark:text-red-400',
  '1;33': 'font-bold text-amber-600 dark:text-amber-400',
  '1;36': 'font-bold text-cyan-700 dark:text-cyan-400',
  '38;5;208': 'text-orange-600 dark:text-orange-400',
  '38;5;215': 'text-orange-600 dark:text-orange-300',
  '38;5;120': 'text-green-700 dark:text-green-300',
  '38;5;22;48;5;114': 'bg-green-300 text-green-950',
};

/** Text in terminal colors, as the compiler prints diagnostics. */
export function TerminalText({ text }: { text: string }) {
  // Splitting on a group gives text, code, text, code, and so on. A code stands
  // for all the text up to the next, which is `0` after each colored piece.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: the escape that starts a color
  const parts = text.split(/\u001b\[([\d;]*)m/);
  return parts.map(
    (part, index) =>
      index % 2 === 0 && (
        // biome-ignore lint/suspicious/noArrayIndexKey: a piece has no other identity
        <span key={index} className={COLORS[parts[index - 1]]}>
          {part}
        </span>
      ),
  );
}
