import type { Token } from '@/lib/highlight/highlight';

const types = 'i32|i64|i1|u32|bool|ptr|void';
const registers = '[er](?:ax|cx|dx|di|si|sp|ip)';
const controlFlow = 'call|ret|return|br|branch|goto|jle';
const keywords =
  'fn|if|define|entry|alloca|label|load|store|icmp|sgt|sext|to|unreachable|scope|end|mov|cmp|push|pop|cdqe|lea';
const address = '^[\\da-f]{4} {2}';
const instructionBytes = `${address}(?:[\\da-f]{2}(?: +|$))*`;

// The parts of a line of compiler text that get their own color.
const textPart = new RegExp(
  `(^> |${instructionBytes}|^[\\da-f]{16}|<[\\w.]+>:?|peeper_rt_\\w+|%[\\w.]+|@"[^"]*"|c?"[^"]*"|\\b[a-z]\\w*\\.\\d+\\b|\\bbb\\d+:?|\\b(?:${types})\\b|\\b${registers}\\b|\\b(?:${controlFlow})\\b|\\b(?:${keywords})\\b|\\b0x[\\da-f]+\\b|\\b\\d+\\b)`,
);
const isAddress = new RegExp(address);
const isType = new RegExp(`^(?:${types})$`);
const isControlFlow = new RegExp(`^(?:${controlFlow})$`);
const isNumber = /^(?:0x[\da-f]+|\d+)$/;

const plain = { light: 'inherit', dark: 'inherit' };
const strong = { light: 'var(--color-fd-foreground)', dark: 'var(--color-fd-foreground)' };
const faint = { light: '#9ca3af', dark: '#5b6470' };
const nameColors = { light: '#0f766e', dark: '#3fb8af' };
const numberColors = { light: '#2563eb', dark: '#79b8ff' };
const typeColors = { light: '#b45309', dark: '#e8933d' };
const symbolColors = { light: '#7c3aed', dark: '#d2a8ff' };
const controlColors = { light: '#dc2626', dark: '#f87171' };
const promptColors = { light: 'var(--color-brand)', dark: 'var(--color-brand)' };

/** The color of one colored part of a line of compiler text. */
function partColors(part: string) {
  if (part === '> ') return promptColors;
  if (/^[\da-f]{16}$/.test(part)) return plain;
  if (part === '<main.max>:') return nameColors;
  if (part.endsWith('>:')) return typeColors;
  if (part.startsWith('<') || part.startsWith('peeper_rt_')) return symbolColors;
  if (part.startsWith('@') || part.includes('"')) return symbolColors;
  if (part.startsWith('%') || /\.\d+$/.test(part)) return nameColors;
  if (isType.test(part)) return typeColors;
  if (isNumber.test(part)) return numberColors;
  if (isControlFlow.test(part)) return controlColors;
  return strong;
}

/** `line` of compiler text, as tokens: values, names, types and keywords colored. */
export function compilerTokens(line: string): Token[] {
  return line.split(textPart).flatMap((content, index) => {
    if (index % 2 === 0) return [{ content, ...plain }];
    if (!isAddress.test(content)) return [{ content, ...partColors(content) }];
    // Alone on its row, the bytes are the point; beside an instruction they are faint.
    const bytes = { content: content.slice(6), ...(content === line ? strong : faint) };
    return [{ content: content.slice(0, 6), ...plain }, bytes];
  });
}
