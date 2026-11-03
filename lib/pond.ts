// The shapes of the reeds at the water's edge: leaves and stems that taper, and what sits on them.

const short = (value: number) => Math.round(value * 10) / 10;

/** A leaf or stem: it stands at `x` on the `base` line and leans, tapering to its tip. */
export type Blade = {
  x: number;
  base: number;
  height: number;
  lean: number;
  width: number;
  /** How far the tip falls back from the top of its curve, so a long leaf bends over. */
  droop?: number;
};

/** The middle line of `blade`, as a curve's four points. */
function middleLine({ x, base, height, lean, droop = 0 }: Blade) {
  return [
    [x, base],
    [x + lean * 0.06, base - height * 0.55],
    [x + lean * 0.46, base - height * (droop ? 0.99 : 0.86)],
    [x + lean, base - height + droop],
  ];
}

/** An SVG path of `blade`: narrow at its foot, widest low down, then tapering to a point. */
export function bladePath(blade: Blade) {
  const half = blade.width / 2;
  const [foot, low, high, tip] = middleLine(blade);
  const left = [low[0] - half, low[1], high[0] - half * 0.5, high[1], tip[0], tip[1]];
  const right = [
    high[0] + half * 0.5,
    high[1],
    low[0] + half,
    low[1],
    foot[0] + half * 0.7,
    foot[1],
  ];
  return `M${short(foot[0] - half * 0.7)} ${foot[1]}C${left.map(short).join(' ')}C${right.map(short).join(' ')}Z`;
}

/** The point `along` the middle line of `blade`, from 0 at its foot to 1 at its tip, and its tilt in degrees from upright. */
export function pointOn(blade: Blade, along: number) {
  const [a, b, c, d] = middleLine(blade);
  const rest = 1 - along;
  const at = (axis: 0 | 1) =>
    rest ** 3 * a[axis] +
    3 * rest ** 2 * along * b[axis] +
    3 * rest * along ** 2 * c[axis] +
    along ** 3 * d[axis];
  const slope = (axis: 0 | 1) =>
    3 * rest ** 2 * (b[axis] - a[axis]) +
    6 * rest * along * (c[axis] - b[axis]) +
    3 * along ** 2 * (d[axis] - c[axis]);
  return {
    x: short(at(0)),
    y: short(at(1)),
    tilt: short((Math.atan2(slope(0), -slope(1)) * 180) / Math.PI),
  };
}
