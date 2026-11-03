import { type Blade, bladePath, pointOn } from './blades';

// The frog's surroundings, as silhouettes in the margins: solid shapes that merge where they cross,
// in the colors `.water-edge` mixes into the page. They stay faint, as the code comes first.

type Leaf = Omit<Blade, 'base'>;

/** A cattail's stem, and how long and wide its head is. */
type Cattail = Leaf & { head: number; headWidth: number };

type ReedBed = {
  width: number;
  height: number;
  far: Leaf[];
  farTails: Cattail[];
  leaves: Leaf[];
  tails: Cattail[];
};

const reedBeds = {
  tall: {
    width: 190,
    height: 360,
    far: [
      { x: 22, height: 214, lean: -8, width: 5 },
      { x: 158, height: 262, lean: 14, width: 5, droop: 13 },
      { x: 74, height: 150, lean: -40, width: 6, droop: 24 },
    ],
    farTails: [{ x: 44, height: 268, lean: -10, width: 3, head: 42, headWidth: 7.5 }],
    leaves: [
      { x: 84, height: 268, lean: -18, width: 7.5, droop: 9 },
      { x: 100, height: 218, lean: 62, width: 9, droop: 37 },
      { x: 88, height: 158, lean: -56, width: 8, droop: 32 },
      { x: 112, height: 150, lean: 30, width: 7, droop: 10 },
      { x: 76, height: 104, lean: -24, width: 6, droop: 9 },
    ],
    tails: [
      { x: 96, height: 346, lean: 12, width: 4.5, head: 56, headWidth: 10.5 },
      { x: 134, height: 196, lean: 16, width: 3.5, head: 42, headWidth: 8.5 },
    ],
  },
  low: {
    width: 170,
    height: 260,
    far: [
      { x: 124, height: 178, lean: 12, width: 4.5 },
      { x: 34, height: 120, lean: -26, width: 5, droop: 17 },
    ],
    farTails: [{ x: 108, height: 196, lean: 8, width: 2.8, head: 34, headWidth: 6.5 }],
    leaves: [
      { x: 74, height: 196, lean: 44, width: 7.5, droop: 30 },
      { x: 62, height: 156, lean: -38, width: 7.5, droop: 24 },
      { x: 82, height: 118, lean: 20, width: 6, droop: 7 },
      { x: 50, height: 86, lean: -22, width: 5, droop: 9 },
    ],
    tails: [{ x: 66, height: 244, lean: -8, width: 4, head: 48, headWidth: 9.5 }],
  },
} satisfies Record<string, ReedBed>;

/** A cattail's head on its stem: a slim cigar, following the stem's curve, with a thin spike above. */
function CattailHead({ stem, length, width }: { stem: Blade; length: number; width: number }) {
  const { x, y, tilt } = pointOn(stem, 0.84);
  const half = width / 2;
  const end = length / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path
        d={`M0 ${-end}C${half * 0.9} ${-end} ${half} ${-end * 0.6} ${half} 0C${half} ${end * 0.72} ${half * 0.7} ${end} 0 ${end}C${-half * 0.7} ${end} ${-half} ${end * 0.72} ${-half} 0C${-half} ${-end * 0.6} ${-half * 0.9} ${-end} 0 ${-end}Z`}
      />
      <path d={`M-0.9 ${-end + 2}L0 ${-end - length * 0.32}L0.9 ${-end + 2}Z`} />
    </g>
  );
}

/** One depth of a bed: its leaves and stems as one color, then the heads as another. */
function ReedLayer({
  leaves,
  tails,
  base,
  leafColor,
  headColor,
}: {
  leaves: Leaf[];
  tails: Cattail[];
  base: number;
  leafColor: string;
  headColor: string;
}) {
  const stems = tails.map((tail) => ({ ...tail, base }));
  return (
    <>
      <g fill={leafColor}>
        {[...leaves.map((leaf) => ({ ...leaf, base })), ...stems].map((blade) => (
          <path key={`${blade.x}-${blade.height}`} d={bladePath(blade)} />
        ))}
      </g>
      <g fill={headColor}>
        {stems.map((stem) => (
          <CattailHead key={stem.x} stem={stem} length={stem.head} width={stem.headWidth} />
        ))}
      </g>
    </>
  );
}

/** Cattails and leaves growing up from the bottom edge, the farther ones paler. */
function Reeds({ bed, className }: { bed: keyof typeof reedBeds; className: string }) {
  const { width, height, far, farTails, leaves, tails } = reedBeds[bed];
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className={className}>
      <ReedLayer
        leaves={far}
        tails={farTails}
        base={height}
        leafColor="var(--reed-far)"
        headColor="var(--cattail-far)"
      />
      <ReedLayer
        leaves={leaves}
        tails={tails}
        base={height}
        leafColor="var(--reed)"
        headColor="var(--cattail)"
      />
    </svg>
  );
}

/** A lily pad lying on the water, seen at a low angle, with one ring spreading from it. */
function FloatingPad({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 20" className={`overflow-visible ${className}`}>
      <ellipse
        cx={32}
        cy={10}
        rx={31}
        ry={9.5}
        fill="none"
        stroke="var(--reed-far)"
        strokeWidth={0.6}
      />
      {/* A disc with its notch, flattened. */}
      <path
        d="M12 12 21.6 8.7A10.2 10.2 0 1 0 22.2 12Z"
        fill="var(--reed)"
        transform="translate(32 10) scale(1.6 0.56) translate(-12 -12)"
      />
    </svg>
  );
}

/**
 * The water's edge along the bottom of the box `className` places: reeds and a pad in each margin
 * beside the page's content. It shows only where those margins have room, and never takes the pointer.
 */
export function WaterEdge({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`water-edge pointer-events-none overflow-hidden max-[90rem]:hidden ${className}`}
    >
      <Reeds bed="tall" className="pond-edge absolute bottom-0 left-[calc(50%-46.5rem)] h-84" />
      <Reeds
        bed="low"
        className="pond-edge absolute right-[calc(50%-46rem)] bottom-0 h-60 -scale-x-100"
      />
      <FloatingPad className="absolute bottom-9 left-[calc(50%-36rem)] w-16" />
      <FloatingPad className="absolute right-[calc(50%-37rem)] bottom-14 w-20" />
    </div>
  );
}
