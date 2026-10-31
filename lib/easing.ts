export const unit = (value: number) => Math.min(Math.max(value, 0), 1);

export const between = (from: number, to: number, share: number) => from + (to - from) * share;

export const eased = (turn: number) => turn * turn * (3 - 2 * turn);

// The share of a sweep by which the last item starts after the first.
const sweepDelay = 0.12;

/** How far through its own turn an item is, `sweep` of the way through, for an item `start` down. */
export const sweepTurn = (sweep: number, start: number) =>
  unit((sweep - start * sweepDelay) / (1 - sweepDelay));
