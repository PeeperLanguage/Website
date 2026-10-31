import type { Token } from './highlight';

/** Where a character goes in the text beside its own, and whether its match is there. */
export type Path = { row: number; column: number; matched: boolean };

/** One character of a text, for a FLIP between two texts. Spaces have none. */
export type Glyph = {
  char: string;
  token: Token;
  group: number;
  row: number;
  column: number;
  previous: Path;
  next: Path;
};

/**
 * The characters of row `row`, all in `group`. Until `matchGlyphs` finds them a partner, they go
 * to the same column of the rows `previous` and `next`.
 */
export function glyphsOf(
  tokens: Token[],
  { group, row, previous, next }: { group: number; row: number; previous: number; next: number },
): Glyph[] {
  let column = -1;
  return tokens.flatMap((token) =>
    Array.from(token.content).flatMap((char) => {
      column++;
      if (char === ' ') return [];
      const stay = { column, matched: false };
      return {
        char,
        token,
        group,
        row,
        column,
        previous: { ...stay, row: previous },
        next: { ...stay, row: next },
      };
    }),
  );
}

/**
 * Pairs the characters of two texts so they can fly from one to the other: in each group, the
 * longest run of characters both have in the same order, so no two paths cross.
 */
export function matchGlyphs(from: Glyph[], to: Glyph[]) {
  for (const group of new Set(from.map((glyph) => glyph.group))) {
    const left = from.filter((glyph) => glyph.group === group);
    const right = to.filter((glyph) => glyph.group === group);
    const longest = Array.from(
      { length: left.length + 1 },
      () => new Uint16Array(right.length + 1),
    );
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        longest[i][j] =
          left[i].char === right[j].char
            ? longest[i + 1][j + 1] + 1
            : Math.max(longest[i + 1][j], longest[i][j + 1]);
      }
    }
    for (let i = 0, j = 0; i < left.length && j < right.length; ) {
      if (left[i].char === right[j].char) {
        left[i].next = { row: right[j].row, column: right[j].column, matched: true };
        right[j].previous = { row: left[i].row, column: left[i].column, matched: true };
        i++;
        j++;
      } else if (longest[i + 1][j] >= longest[i][j + 1]) i++;
      else j++;
    }
  }
}
