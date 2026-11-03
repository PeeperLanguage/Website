import { between, eased, sweepTurn, unit } from '@/lib/easing';
import type { Token } from '@/lib/highlight/highlight';
import type { Glyph } from './glyphs';

/** The sizes of one text, in pixels. */
export type TextMetrics = { row: number; font: number; advance: number };

// Where a row's text starts, past the band's left border.
const textInset = 14;
// The largest font, and its share of a row that is too short for it.
const maxFont = 13;
const fontOfRow = 0.74;

/** Sizes `canvas` for the tallest text, and gives each text's sizes from its row height. */
export function fitCanvas(canvas: HTMLCanvasElement, rowHeights: number[], counts: number[]) {
  const context = canvas.getContext('2d');
  if (!context) return [];
  const { fontFamily } = getComputedStyle(canvas);
  const metrics = rowHeights.map((row) => {
    const font = Math.min(maxFont, fontOfRow * row);
    context.font = `${font}px ${fontFamily}`;
    return { row, font, advance: context.measureText('0').width };
  });
  const tallest = Math.max(...counts.map((count, text) => count * rowHeights[text]));
  canvas.style.height = `${tallest}px`;
  canvas.width = canvas.getBoundingClientRect().width * devicePixelRatio;
  canvas.height = tallest * devicePixelRatio;
  return metrics;
}

/** The color of a token in the site's theme, as a canvas takes it: `canvas`'s CSS resolves it. */
function themeInk(canvas: HTMLCanvasElement) {
  const style = getComputedStyle(canvas);
  const dark = document.documentElement.classList.contains('dark');
  const known = new Map<string, string>();
  return (token: Token) => {
    const color = dark ? token.dark : token.light;
    let ink = known.get(color);
    if (!ink) {
      const variable = color.match(/^var\((.+)\)$/)?.[1];
      const value = variable ? style.getPropertyValue(variable) : color;
      ink = value === 'inherit' ? style.color : value;
      known.set(color, ink);
    }
    return ink;
  };
}

/**
 * Draws text `text`, `sweep` of the way from text `from` to the next: FLIP on a canvas. A matched
 * character flies to its partner, which grows in over it, so a pair never dims; one without a
 * match fades and goes with its row. A pair keeps the leaving row's timing, so both halves stay
 * together. With reduced motion nothing flies.
 */
function drawText(
  context: CanvasRenderingContext2D,
  glyphs: Glyph[],
  { text, from, sweep }: { text: number; from: number; sweep: number },
  {
    counts,
    metrics,
    still,
    ink,
  }: {
    counts: number[];
    metrics: TextMetrics[];
    still: boolean;
    ink: (token: Token) => string;
  },
) {
  const leaving = text === from;
  const own = metrics[text];
  const other = metrics[leaving ? text + 1 : text - 1];
  for (const glyph of glyphs) {
    const path = leaving ? glyph.next : glyph.previous;
    const flies = path.matched && !still;
    const start = flies && !leaving ? path.row / counts[from] : glyph.row / counts[text];
    const turn = sweepTurn(sweep, start);
    if (leaving ? turn === 1 : turn === 0) continue;
    const smooth = eased(turn);
    const away = leaving ? smooth : 1 - smooth;
    const fade = leaving ? unit(1 - 2 * turn) : unit(2 * turn - 1);
    const shown = flies ? (leaving ? 1 : smooth) : fade;
    if (shown === 0) continue;
    const column = flies ? path.column : glyph.column;
    context.globalAlpha = shown;
    context.fillStyle = ink(glyph.token);
    context.fillText(
      glyph.char,
      textInset + between(glyph.column * own.advance, column * other.advance, away),
      between((glyph.row + 0.5) * own.row, (path.row + 0.5) * other.row, away),
    );
  }
}

/** Clears `canvas` and draws the two texts `from` and the next, `sweep` of the way between. */
export function drawGlyphs(
  canvas: HTMLCanvasElement,
  glyphs: Glyph[][],
  sizes: { counts: number[]; metrics: TextMetrics[] },
  from: number,
  sweep: number,
) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const look = {
    ...sizes,
    still: matchMedia('(prefers-reduced-motion: reduce)').matches,
    ink: themeInk(canvas),
  };
  const { fontFamily } = getComputedStyle(canvas);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  context.textBaseline = 'middle';
  for (const text of [from, from + 1]) {
    context.font = `${sizes.metrics[text].font}px ${fontFamily}`;
    drawText(context, glyphs[text], { text, from, sweep }, look);
  }
}
