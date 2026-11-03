import type { CSSProperties } from 'react';
import { eased, sweepTurn, unit } from '@/lib/easing';
import type { Token } from '@/lib/highlight/highlight';
import { compilerTokens } from './compiler-text';
import { type Glyph, glyphsOf, matchGlyphs } from './glyphs';
import { type StoryRow, stages } from './story';

// What the window takes of the height the board may grow to: title bar and margins.
const windowChrome = '4.5rem';

/** A row of a stage, with the rows it comes from and goes to in the stages beside it. */
export type PlacedRow = {
  stage: number;
  index: number;
  line: number;
  tokens: Token[];
  shaded: boolean;
  previous: number;
  next: number;
};

/** Which of `to`'s rows the row at `index` of `from` turns into: one of its source line's. */
function counterpart(from: { line: number }[], index: number, to: { line: number }[]) {
  const line = from[index].line;
  const own = to.flatMap((row, at) => (row.line === line ? [at] : []));
  if (line === 0 || own.length === 0) {
    return Math.min(Math.round((index / from.length) * to.length), to.length - 1);
  }
  const siblings = from.flatMap((row, at) => (row.line === line ? [at] : []));
  return own[Math.floor((siblings.indexOf(index) / siblings.length) * own.length)];
}

/** Whether each row takes the darker band: they swap with each source line, from the light one. */
function zebra(rows: { line: number }[]) {
  let shaded = true;
  return rows.map(({ line }, index) => {
    if (line === 0) shaded = true;
    else if (line !== rows[index - 1]?.line) shaded = !shaded;
    return shaded;
  });
}

/** Each stage's rows, and their characters paired with those of the next stage by source line. */
export function storyRows(source: Token[][]) {
  const byStage = stages.map(({ rows }, stage) =>
    stage === 0
      ? source.map((tokens, index) => ({ line: tokens.length > 0 ? index + 1 : 0, tokens }))
      : rows.map(([line, text]: StoryRow) => ({ line, tokens: compilerTokens(text) })),
  );
  const placed: PlacedRow[][] = byStage.map((rowsOfStage, stage) => {
    const shades = zebra(rowsOfStage);
    return rowsOfStage.map((row, index) => ({
      ...row,
      stage,
      index,
      shaded: shades[index],
      previous: counterpart(rowsOfStage, index, byStage[Math.max(stage - 1, 0)]),
      next: counterpart(rowsOfStage, index, byStage[Math.min(stage + 1, stages.length - 1)]),
    }));
  });
  const glyphs: Glyph[][] = placed.map((rowsOfStage) =>
    rowsOfStage.flatMap(({ tokens, line, index, previous, next }) =>
      glyphsOf(tokens, { group: line, row: index, previous, next }),
    ),
  );
  for (let stage = 1; stage < glyphs.length; stage++) matchGlyphs(glyphs[stage - 1], glyphs[stage]);
  return { rows: placed.flat(), counts: byStage.map((rows) => rows.length), glyphs };
}

/** Where the band of `row` is and how much of it shows, `sweep` from stage `from` to the next. */
export function bandStyle(
  { stage, index, previous, next }: PlacedRow,
  from: number,
  sweep: number,
  counts: number[],
) {
  const height = `var(--row-${stage})`;
  const leaving = stage === from;
  if (!leaving && stage !== from + 1) return { height, transform: 'none', opacity: 0 };
  const turn = sweepTurn(sweep, index / counts[stage]);
  const away = leaving ? eased(turn) : 1 - eased(turn);
  const otherStage = leaving ? stage + 1 : stage - 1;
  const here = `${index} * var(--row-${stage})`;
  const there = `${leaving ? next : previous} * var(--row-${otherStage})`;
  return {
    height,
    transform: `translateY(calc(${1 - away} * ${here} + ${away} * ${there}))`,
    opacity: 1,
    '--fade': leaving ? unit(1 - 2 * turn) : unit(2 * turn - 1),
  } as CSSProperties;
}

/** The height of the rows of stage `from`, or of the next one, `sweep` of the way between them. */
export function rowsHeight(from: number, sweep: number, counts: number[]) {
  const here = `${1 - sweep} * ${counts[from]} * var(--row-${from})`;
  return `calc(${here} + ${sweep} * ${counts[from + 1]} * var(--row-${from + 1}))`;
}

/** The CSS that sizes each stage's rows to fit the box the board may grow to. */
export function rowHeightsStyle(counts: number[]) {
  return Object.fromEntries(
    counts.map((count, index) => [
      `--row-${index}`,
      `min(var(--code-line), (100cqh - ${windowChrome}) / ${count})`,
    ]),
  ) as CSSProperties;
}
