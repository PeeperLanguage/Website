// One page cursor can belong to only one avatar at a time.
type Point = { x: number; y: number };
type PupilId = 'pupil-l' | 'pupil-r';
type EyeId = 'eye-l' | 'eye-r';
type Geometry = { c: string; p: [number, number][] }[];
type Drawing = {
  role: string;
  fill: string;
  stroke?: string;
  d?: string;
  circle?: [number, number, number];
  gen?: 'mouth' | 'tongue' | 'queasy';
};

let activeMuncher: HTMLButtonElement | null = null;

/** Mount the supplied soft-body avatar; all effects share this component's lifetime. */
export function mountCursorMuncher(container: HTMLDivElement) {
  const id = container.id;
  const NS = 'http://www.w3.org/2000/svg';
  // Markup and drawing data must stay in sync; never silently skip missing shapes.
  function required<T>(value: T | null | undefined): T {
    if (value == null) throw new Error('Cursor Muncher drawing is incomplete or detached');
    return value;
  }

  const events = new AbortController();
  const frames = new Set<number>();
  const timers = new Set<number>();
  let disposed = false;
  // Track scheduled work so navigation and React Strict Mode leave no animations behind.
  function scheduleFrame(callback: FrameRequestCallback) {
    if (disposed) return;
    const id = window.requestAnimationFrame((now) => {
      frames.delete(id);
      callback(now);
    });
    frames.add(id);
  }
  function scheduleTimeout(callback: () => void, delay: number) {
    if (disposed) return;
    const id = window.setTimeout(() => {
      timers.delete(id);
      callback();
    }, delay);
    timers.add(id);
  }
  const svg = required(container.querySelector<SVGSVGElement>('svg'));
  const shapesG = required(container.querySelector<SVGGElement>('[data-shapes]'));
  const shadow = required(container.querySelector<SVGEllipseElement>('[data-shadow]'));
  const mouthHit = required(container.querySelector<SVGCircleElement>('[data-mouth-hit]'));
  const btn = required(container.querySelector<HTMLButtonElement>('button'));
  const status = required(container.querySelector<HTMLParagraphElement>('[role="status"]'));
  const fx = document.createElementNS(NS, 'svg');
  fx.setAttribute('aria-hidden', 'true');
  fx.setAttribute('data-muncher-effects', '');
  fx.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;overflow:visible';
  fx.innerHTML = `
	<defs>
		<!-- Goo: blurred blobs with a hard alpha edge melt into one liquid. -->
		<filter id="${id}-goo" x="-20%" y="-20%" width="140%" height="140%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
			<feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="goo" />
			<feComposite in="SourceGraphic" in2="goo" operator="atop" />
		</filter>
		<linearGradient id="${id}-goo-fill" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#eef5a3" />
			<stop offset="1" stop-color="#c0ca33" />
		</linearGradient>
	</defs>
	<g data-goo-layer="" filter="url(#${id}-goo)"></g>
	<path data-tongue="" fill="none" stroke="#e57373" stroke-linecap="round" />
	<circle data-tongue-tip="" r="0" fill="#ef9a9a" />
	<g data-morsel="" style="display: none"></g>
`;
  document.body.append(fx);
  const gooLayer = required(fx.querySelector<SVGGElement>('[data-goo-layer]'));
  const tongue = required(fx.querySelector<SVGPathElement>('[data-tongue]'));
  const tongueTip = required(fx.querySelector<SVGCircleElement>('[data-tongue-tip]'));
  const morselG = required(fx.querySelector<SVGGElement>('[data-morsel]'));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const say = (t: string) => (status.textContent = t);

  // ---------------------------------------------------------------------------------------------
  // The drawing, as data. Every point is redrawn each frame through the soft-body deformation.
  // role: which local motion a shape follows before the body's (eye-l, pupil-l, mouth...).
  // ---------------------------------------------------------------------------------------------
  const INK = '#263238';
  const SKIN = [77, 182, 172]; // #4db6ac
  const SICK = [156, 204, 101]; // #9ccc65
  const DRAWING: Drawing[] = [
    {
      role: 'body',
      fill: INK,
      d: 'M307.371 194.4C317.754 191.753 338.519 190.982 348.647 194.495C354.081 194.324 367.426 197.672 372.974 198.956C408.536 207.518 441.081 225.637 467.091 251.356C472.31 256.448 476.895 262.215 481.854 267.631L482.482 267.451C489.48 265.517 519.722 260.965 527.658 261.399C559.154 263.119 594.269 267.859 624.323 277.861C636.605 281.949 649.163 285.474 659.527 291.51C666.87 286.367 673.542 280.573 681.142 275.694C697.578 265.144 716.899 257.297 735.951 253.201C741.997 251.901 748.09 251.209 754.179 250.183C758.02 249.536 761.685 248.128 765.554 247.633C772.494 246.744 779.051 248.428 785.883 249.252C823.714 253.818 856.658 265.678 886.956 289.19C937.798 328.647 962.345 385.483 969.714 448.155C971.014 459.213 969.371 469.778 967.812 480.686C963.771 508.967 955.857 537.436 940.72 561.913C936.091 569.397 930.703 576.241 925.281 583.154C936.26 601.531 943.995 627.219 947.888 648.134C949.109 654.696 951.403 662.62 950.757 669.291C947.284 705.182 934.001 732.584 908.004 757.181C908.391 788.66 895.934 831.777 855.22 823.583C848.732 822.277 844.066 817.946 838.764 814.268C830.209 829.098 809.974 835.929 794.288 828.664C783.677 823.749 777.655 815.505 773.724 804.711C765.25 810.277 760.779 815.638 749.897 816.237C736.811 816.958 731.902 813.059 722.833 805.198C694.211 810.093 669.798 815.006 640.441 818.45C583.095 824.65 525.342 826.191 467.748 823.057L437.684 821.418C432.513 821.172 426.408 821.286 421.387 820.821C399.474 818.853 377.635 816.123 355.912 812.638C344.453 810.751 326.099 806.749 315.399 805.716L314.587 805.641C308.388 811.485 303.251 814.969 294.606 815.892C281.098 817.335 274.856 812.845 265.086 805.131C261.94 811.843 258.668 817.44 253.036 822.464C246.001 828.718 236.761 831.906 227.366 831.322C213.402 830.353 206.988 822.921 198.749 813.563C194.416 818.507 187.995 823.245 181.356 824.181C147.973 828.891 135.579 798.957 130.517 772.479C122.573 767.989 114.683 763.626 107.441 758.28C66.3217 727.922 47.5995 679.39 59.626 629.273C63.878 608.925 71.2813 589.791 80.3044 571.122C85.2998 560.787 91.9734 551.356 97.0591 541.304L97.3554 540.708C95.7537 534.574 90.5129 523.522 88.2354 516.335C82.2639 497.491 79.1889 479.58 78.4805 459.798C78.2469 453.274 75.7008 450.293 77.3627 444.686C78.8257 439.75 78.5224 434.657 78.9356 429.373C79.471 421.969 80.3586 414.594 81.5955 407.274C89.5409 362.506 108.971 320.567 137.985 285.559C179.901 235.218 241.658 200.12 307.371 194.4Z',
    },
    {
      role: 'body',
      fill: 'skin',
      d: 'M496.66 290.164C550.818 284.395 589.834 290.496 640.718 310.32C636.101 316.067 627.488 327.169 623.838 333.198C607.768 359.75 596.536 392.968 593.943 423.931C589.589 479.005 607.016 533.59 642.478 575.952C695.001 638.227 779.175 665.672 856.182 634.471C876.073 626.412 890.803 615.933 907.005 602.191C917.069 623.133 924.314 645.759 924.282 669.22C924.254 689.446 915.241 714.799 900.542 729.12C883.457 695.647 854.933 680.357 818.338 676.125C761.443 669.544 720.208 705.304 713.712 761.446C712.983 769.253 713.383 774.734 713.778 782.572C689.352 786.419 666.889 790.953 642.034 793.909C563.118 802.842 483.46 803.073 404.493 794.598C385.178 792.512 366.98 790.25 347.848 786.56C341.118 785.263 331.312 784.075 324.96 782.378C325.238 774.889 325.265 769.692 324.77 762.139C314.369 678.767 238.144 654.203 169.593 693.62C155.871 701.51 144.008 715.442 137.168 729.503C134.89 734.185 133.029 740.298 131.284 745.309C125.401 741.932 120.553 737.562 115.55 733.253C84.3089 706.344 73.0962 667.754 84.6183 628.245C91.4185 604.927 99.342 586.279 111.479 565.252C118.875 575.398 124.759 583.449 133.381 592.596C159.464 619.779 192.779 638.93 229.394 647.791C245.309 651.648 258.525 652.886 274.753 653.077C410.671 654.668 529.911 530.534 525.873 395.186C524.803 359.343 515.461 320.851 496.66 290.164Z',
    },
    {
      role: 'body',
      fill: '#f5f5f5',
      d: 'M324.77 762.139C326.059 756.158 348.902 743.032 355.202 739.384C405.591 710.202 465.939 698.652 523.673 698.361C586.361 698.046 653.501 714.875 704.444 752.431C707.249 754.497 711.164 758.831 713.712 761.446C712.983 769.253 713.383 774.734 713.778 782.572C689.352 786.419 666.889 790.953 642.034 793.909C563.118 802.842 483.46 803.073 404.493 794.598C385.178 792.512 366.98 790.25 347.848 786.56C341.118 785.263 331.312 784.075 324.96 782.378C325.238 774.889 325.265 769.692 324.77 762.139Z',
    },
    {
      role: 'body',
      fill: 'skin',
      d: 'M797.782 697.693C834.689 695.067 881.335 714.921 885.439 756.636C886.733 769.783 884.079 786.48 875.617 797.006C870.625 803.216 861.37 805.083 855.188 799.35C848.978 793.438 849.335 782.155 848.969 774.063C846.871 770.957 844.969 768.654 840.958 768.146C829.5 766.698 829.775 781.238 826.98 788.743C823.952 796.875 821.981 802.382 814.713 807.672C809.585 810.542 803.44 809.885 799.48 805.723C788.354 794.03 791.931 776.532 792.479 762.152C792.86 752.151 778.831 748.397 774.443 758.134C772.123 763.283 770.342 768.82 768.109 774.098C766.198 778.513 763.762 782.681 760.856 786.514C749.363 801.462 737.222 794.061 735.577 777.822C733.561 757.573 739.588 737.342 752.358 721.498C764.75 706.269 778.416 699.741 797.782 697.693Z',
    },
    {
      role: 'body',
      fill: 'skin',
      d: 'M226.275 697.701C230.145 697.174 234.578 697.409 238.491 697.592C279.87 699.524 305.366 737.102 302.789 776.477C302.402 782.392 300.647 788.512 295.661 792.351C283.639 801.608 271.087 779.811 267.744 770.706C265.993 767.569 263.819 757.962 261.524 755.656C254.405 748.322 245.556 754.838 245.606 763.744C245.693 779.006 249.906 795.826 236.416 807.15C234.947 807.831 233.573 808.435 231.947 808.634C209.664 811.368 211.411 775.191 203.55 769.58C201.087 767.821 197.994 767.555 195.089 768.145C183.336 770.529 190.238 789.199 183.699 798.064C181.961 800.421 179.069 802.384 176.123 802.761C172.754 803.192 169.278 801.607 166.696 799.559C157.515 792.279 153.955 778.646 152.938 767.507C151.589 752.74 155.665 737.694 165.257 726.223C180.099 708.473 203.791 699.749 226.275 697.701Z',
    },
    {
      role: 'eye-l',
      fill: '#f5f5f5',
      d: 'M319.895 219.216C363.581 217.563 406.286 232.44 439.487 260.881C476.322 292.495 497.103 337.504 500.291 385.921C506.9 486.316 439.456 581.481 346.006 615.499C324.901 623.182 307.643 626.286 285.215 627.936C230.06 629.397 182.02 610.936 145.449 568.046C78.5401 489.575 96.6277 369.729 162.473 295.677C202.44 249.94 259.237 222.354 319.895 219.216Z',
    },
    {
      role: 'pupil-l',
      fill: INK,
      d: 'M226.775 357.19C237.079 356.336 247.327 359.383 255.49 365.729C291.694 394.155 276.266 462.392 227.621 467.809C217.248 469.043 206.068 465.624 197.917 459.175C161.151 430.088 179.571 361.897 226.775 357.19Z',
    },
    { role: 'pupil-l', fill: '#f5f5f5', circle: [240, 385, 12] },
    {
      role: 'eye-r',
      fill: '#f5f5f5',
      d: 'M765.493 271.711C766.163 271.65 766.683 271.629 767.358 271.607C811.78 270.216 854.264 288.685 886.332 318.874C922.528 353.585 943.769 401.037 945.544 451.155C947.11 499.33 933.174 541.451 899.909 576.945C872.773 606.149 835.206 623.461 795.375 625.117C754.866 626.992 710.529 609.096 680.982 582.801C624.238 532.301 600.613 452.611 626.514 380.501C648.864 318.277 699.453 276.191 765.493 271.711Z',
    },
    {
      role: 'pupil-r',
      fill: INK,
      d: 'M841.574 358.12C896.462 354.371 906.855 437.805 853.728 448.912C797.878 452.786 789.6 367.941 841.574 358.12Z',
    },
    { role: 'pupil-r', fill: '#f5f5f5', circle: [862, 380, 11] },
    { role: 'lump', fill: INK, d: 'M0 0L0 78L21 58L35 88L49 82L35 52L64 52Z' },
    {
      role: 'smile',
      fill: INK,
      d: 'M520.011 559.99C538.209 557.711 518.31 604.343 550.238 599.883C561.539 598.305 563.277 589.182 564.654 579.212C565.647 572.015 563.8 552.206 577.503 562.383C580.43 564.656 579.521 575.057 579.367 579.119C578.963 582.497 578.567 585.675 577.872 589.004C574.381 605.733 561.152 616.579 543.781 614.493C535.289 613.423 527.583 608.987 522.392 602.182C515.256 592.991 513.603 579.304 514.799 567.923C515.215 563.964 517.026 562.184 520.011 559.99Z',
    },
    { role: 'mouth', fill: '#5a1f2b', stroke: INK, gen: 'mouth' },
    { role: 'mouth-tongue', fill: '#f28b9b', gen: 'tongue' },
    { role: 'queasy', fill: 'none', stroke: INK, gen: 'queasy' },
  ];

  // Parse each path into absolute commands with point pairs (the drawing uses M, C, L and Z only).
  function parse(d: string): Geometry {
    const out: Geometry = [];
    const re = /([MCLZ])|(-?\d*\.?\d+(?:e-?\d+)?)/gi;
    let cmd: string | null = null;
    let nums: number[] = [];
    const flush = () => {
      if (!cmd) return;
      const pts: [number, number][] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
      out.push({ c: cmd, p: pts });
    };
    for (const m of d.matchAll(re)) {
      if (m[1]) {
        flush();
        cmd = m[1].toUpperCase();
        nums = [];
      } else nums.push(parseFloat(m[2]));
    }
    flush();
    return out;
  }
  function ellipsePath(cx: number, cy: number, rx: number, ry: number, n = 32): Geometry {
    const p: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return [
      { c: 'M', p: [p[0]] },
      { c: 'L', p: p.slice(1) },
      { c: 'Z', p: [] },
    ];
  }

  // The mouth. Closed, it is the character's own small smile. Open, it grows out of that smile: a little opening
  // stays small (ready, panting), and a full open becomes a frog's wide grin, a crescent whose corners curve down
  // under the eyes, with a big tongue inside.
  const MOUTH = { x: 547, y: 574 };
  const easeMouth = (o: number) => 1 - (1 - Math.min(1, o)) ** 2;
  function mouthShape(o: number) {
    const w = (33 + 142 * easeMouth(o)) * (1 + 0.08 * Math.max(0, o - 1)); // half width
    const drop = 0.45 * w; // how far the corners curve down
    const depth = 18 + 120 * Math.min(o, 1.2);
    const top = (x: number) => {
      const u = (x - MOUTH.x) / w;
      return MOUTH.y - 6 * Math.min(1, o) + drop * u * u;
    };
    const bottom = (x: number) => {
      const u = (x - MOUTH.x) / w;
      return top(x) + depth * Math.max(0, 1 - u * u) ** 0.7;
    };
    return { w, depth, top, bottom };
  }
  function mouthPoints(o: number, kind: 'mouth' | 'tongue'): Geometry {
    const n = 24;
    const m = mouthShape(o);
    const pts: [number, number][] = [];
    const at = (t: number) => MOUTH.x - m.w + 2 * m.w * t;
    if (kind === 'mouth') {
      for (let i = 0; i <= n; i++) pts.push([at(i / n), m.top(at(i / n))]);
      for (let i = n; i >= 0; i--) pts.push([at(i / n), m.bottom(at(i / n))]);
      return [
        { c: 'M', p: [pts[0]] },
        { c: 'L', p: pts.slice(1) },
        { c: 'Z', p: [] },
      ];
    }
    // The tongue: a mound filling the bottom of the mouth (clipped to it).
    const ty = m.top(MOUTH.x) + m.depth * 0.9;
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      pts.push([MOUTH.x + Math.cos(a) * m.w * 0.55, ty + Math.sin(a) * (10 + m.depth * 0.32)]);
    }
    return [
      { c: 'M', p: [pts[0]] },
      { c: 'L', p: pts.slice(1) },
      { c: 'Z', p: [] },
    ];
  }
  // The queasy mouth: the smile's width, gone wavy and turned down at the ends.
  function queasyPoints(amount: number): Geometry {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const droop = -8 * Math.sin(Math.PI * t) + 6;
      pts.push([
        MOUTH.x - 44 + 88 * t,
        MOUTH.y + 16 + droop + Math.sin(t * Math.PI * 3 + state.t * 7) * 7 * amount,
      ]);
    }
    return [
      { c: 'M', p: [pts[0]] },
      { c: 'L', p: pts.slice(1) },
    ];
  }

  const shapes = DRAWING.map((s) => {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('fill', s.fill === 'skin' ? '#4db6ac' : s.fill);
    if (s.stroke) {
      el.setAttribute('stroke', s.stroke);
      el.setAttribute('stroke-width', '16');
      el.setAttribute('stroke-linejoin', 'round');
    }
    shapesG.append(el);
    if (s.role === 'mouth-tongue') el.setAttribute('clip-path', `url(#${id}-clip-mouth)`);
    const geom = s.d
      ? parse(s.d)
      : s.circle
        ? ellipsePath(s.circle[0], s.circle[1], s.circle[2], s.circle[2], 20)
        : [];
    return { ...s, el, geom };
  });

  // Lids: skin that comes down over each eye, clipped to the eye so it can never spill past it.
  const lids = (['l', 'r'] as const).map((k) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('clip-path', `url(#${id}-clip-eye-${k})`);
    const fill = document.createElementNS(NS, 'path');
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', INK);
    line.setAttribute('stroke-width', '16');
    line.setAttribute('stroke-linecap', 'round');
    g.append(fill, line);
    const lumpShape = required(shapes.find((s) => s.role === 'lump'));
    shapesG.insertBefore(g, lumpShape.el);
    const eyeShape = required(shapes.find((s) => s.role === `eye-${k}`));
    return {
      k,
      g,
      fill,
      line,
      eye: eyeShape,
      clip: required(container.querySelector<SVGPathElement>(`[data-clip="eye-${k}"] path`)),
    };
  });
  const LIDS = {
    l: { eye: 'eye-l', top: 214, bottom: 632, w: 215 },
    r: { eye: 'eye-r', top: 266, bottom: 630, w: 180 },
  } as const;

  // ---------------------------------------------------------------------------------------------
  // Springs: every soft motion is an underdamped spring, so the body overshoots and jiggles.
  // ---------------------------------------------------------------------------------------------
  class Spring {
    x: number;
    v: number;
    t: number;
    k: number;
    c: number;
    constructor(x: number, k: number, c: number) {
      this.x = x;
      this.v = 0;
      this.t = x;
      this.k = k;
      this.c = c;
    }
    step(dt: number) {
      const a = this.k * (this.t - this.x) - this.c * this.v;
      this.v += a * dt;
      this.x += this.v * dt;
    }
    kick(v: number) {
      this.v += v;
    }
  }
  const S = {
    squash: new Spring(1, 210, 9), // vertical scale of the body (1 = rest; <1 squashed, >1 stretched)
    lean: new Spring(0, 140, 10), // sideways shift of the top, in drawing units
    wave: new Spring(0, 260, 11), // sideways shift of the middle: lags the lean, so the body bends like jelly
    mouth: new Spring(0, 520, 30), // how open the mouth is
    eyes: new Spring(1, 300, 18), // pupil size (dilated in anticipation)
    blink: new Spring(1, 900, 40), // eyelids (1 open, 0 shut)
  };

  // Bumps that push the body out: cheeks, the swallowed lump, the heave, the tummy rumble.
  const bulges = new Set<ReturnType<typeof bulge>>();
  function bulge(x: number, y: number, r: number, amp: number) {
    const b = { x, y, r, amp, a: 0 };
    bulges.add(b);
    return b;
  }

  // State the act sets directly.
  const state = {
    sick: 0, // 0..1, skin colour toward green
    pupilOverride: null as ((id: PupilId, time: number) => [number, number]) | null, // function(t) -> {x, y} offsets while dizzy
    lump: { x: 547, y: 600, rot: 0, s: 0, op: 0 },
    chew: 0, // -1..1, the closed mouth munching
    queasy: 0, // 0..1, the wavy sick mouth
    t: 0,
  };

  // ---------------------------------------------------------------------------------------------
  // The soft-body deformation: rest point -> deformed point, in drawing units.
  // ---------------------------------------------------------------------------------------------
  const FEET = 826; // the floor line under the feet
  const TOP = 190;
  const H = FEET - TOP;
  const CX = 512;
  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  function deform(x: number, y: number): [number, number] {
    // 1. Bulges, in the rest shape: push points away from each bump's centre.
    for (const b of bulges) {
      if (b.a <= 0.001) continue;
      const dx = x - b.x;
      const dy = y - b.y;
      const f = b.a * Math.exp(-(dx * dx + dy * dy) / (b.r * b.r));
      x += dx * f;
      y += dy * f;
    }
    // 2. Height above the floor, 0 at the feet and 1 at the top. The feet stay planted.
    const h = Math.max(0, (FEET - y) / H);
    const grip = smooth(0, 0.28, h);
    // 3. Squash and stretch, keeping the volume: a squashed body bulges at the waist.
    const sy = S.squash.x;
    const waist = Math.sin(Math.PI * Math.min(1, h));
    const sx = 1 + (1 / Math.sqrt(sy) - 1) * (0.55 + 0.9 * waist);
    const ny = FEET - (FEET - y) * (1 + (sy - 1) * grip);
    let nx = CX + (x - CX) * (1 + (sx - 1) * grip);
    // 4. Lean and jelly wave: the top follows, the middle lags behind.
    nx += S.lean.x * h ** 1.6 + S.wave.x * Math.sin(Math.PI * h) * grip;
    return [nx, ny];
  }

  // Local motions, before the body's: eyes blink and widen, pupils look, the mouth opens.
  const EYE: Record<EyeId, [number, number]> = { 'eye-l': [297, 423], 'eye-r': [783, 448] };
  const PUPIL: Record<PupilId, { base: [number, number]; eye: EyeId; r: number }> = {
    'pupil-l': { base: [226, 412], eye: 'eye-l', r: 100 },
    'pupil-r': { base: [848, 403], eye: 'eye-r', r: 92 },
  };
  const pupilOffset = { 'pupil-l': [0, 0], 'pupil-r': [0, 0] };

  function local(role: string, x: number, y: number) {
    if (role === 'pupil-l' || role === 'pupil-r') {
      // Look, then dilate around the pupil's own centre.
      const o = pupilOffset[role];
      const [bx, by] = PUPIL[role].base;
      const s = S.eyes.x;
      x = bx + o[0] + (x - bx) * s;
      y = by + o[1] + (y - by) * s;
    } else if (role === 'smile') {
      // Chewing with the mouth shut: the smile squishes and bobs.
      const c = state.chew;
      x = 547 + (x - 547) * (1 + 0.3 * c);
      y = 588 + (y - 588) * (1 - 0.45 * c) - 4 * c;
    } else if (role === 'lump') {
      // The swallowed cursor, seen through the body: placed, turned and sized by the act.
      const L = state.lump;
      const a = (L.rot * Math.PI) / 180;
      const ux = (x - 24) * L.s;
      const uy = (y - 44) * L.s;
      x = L.x + ux * Math.cos(a) - uy * Math.sin(a);
      y = L.y + ux * Math.sin(a) + uy * Math.cos(a);
    }
    return deform(x, y);
  }

  function render() {
    const o = Math.max(0, S.mouth.x);
    const open = o > 0.12;
    for (const s of shapes) {
      let d = '';
      const geom =
        s.gen === 'mouth' || s.gen === 'tongue'
          ? mouthPoints(o, s.gen)
          : s.gen === 'queasy'
            ? queasyPoints(state.queasy)
            : s.geom;
      for (const seg of geom) {
        d += seg.c;
        for (const [x, y] of seg.p) {
          const [nx, ny] = local(s.role, x, y);
          d += `${nx.toFixed(1)} ${ny.toFixed(1)} `;
        }
      }
      s.el.setAttribute('d', d);
      if (s.fill === 'skin') {
        const c = SKIN.map((v, i) => Math.round(v + (SICK[i] - v) * state.sick));
        s.el.setAttribute('fill', `rgb(${c})`);
      }
      // Exactly one mouth shows: the smile, the queasy line, or the opening.
      if (s.role === 'smile') s.el.setAttribute('opacity', !open && state.queasy < 0.5 ? '1' : '0');
      if (s.role === 'queasy')
        s.el.setAttribute('opacity', !open && state.queasy >= 0.5 ? '1' : '0');
      if (s.role === 'mouth' || s.role === 'mouth-tongue')
        s.el.setAttribute('opacity', open ? '1' : '0');
      if (s.role === 'lump') s.el.setAttribute('opacity', String(state.lump.op));
      if (s.role === 'queasy' || s.role === 'mouth') {
        s.el.setAttribute('stroke-width', s.role === 'queasy' ? '13' : '14');
        s.el.setAttribute('stroke-linecap', 'round');
        s.el.setAttribute('stroke-linejoin', 'round');
      }
    }
    const mouthShape = required(shapes.find((x) => x.role === 'mouth'));
    required(container.querySelector<SVGPathElement>('[data-clip="mouth"] path')).setAttribute(
      'd',
      required(mouthShape.el.getAttribute('d')),
    );
    // Lids: a region above a bowed line, in the deformed shape, clipped to each eye.
    const shut = 1 - Math.max(0, Math.min(1, blinkSet ?? S.blink.x));
    for (const lid of lids) {
      lid.clip.setAttribute('d', required(lid.eye.el.getAttribute('d')));
      if (shut < 0.03) {
        lid.g.setAttribute('display', 'none');
        continue;
      }
      lid.g.removeAttribute('display');
      const L = LIDS[lid.k];
      const [ex] = EYE[L.eye];
      const y0 = L.top + (L.bottom - L.top) * shut;
      const pts: [number, number][] = [];
      for (let i = 0; i <= 12; i++) {
        const x = ex - L.w - 30 + ((L.w + 30) * 2 * i) / 12;
        const bow =
          38 * shut * Math.cos(Math.min(1, Math.abs(x - ex) / (L.w + 30)) * (Math.PI / 2));
        pts.push(deform(x, y0 + bow));
      }
      const [ax, ay] = deform(ex - L.w - 30, L.top - 120);
      const [bx, by] = deform(ex + L.w + 30, L.top - 120);
      const curve = pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
      lid.fill.setAttribute(
        'd',
        `M${ax} ${ay} L${bx} ${by} L${[...pts]
          .reverse()
          .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`)
          .join(' L')} Z`,
      );
      const c = SKIN.map((v, i) => Math.round(v + (SICK[i] - v) * state.sick));
      lid.fill.setAttribute('fill', `rgb(${c})`);
      lid.line.setAttribute('d', `M${curve}`);
    }
    // The shadow widens when the body squashes.
    const sq = S.squash.x;
    shadow.setAttribute('rx', String(380 * (1 + (1 / Math.sqrt(sq) - 1) * 1.2)));
    shadow.setAttribute('cx', String(512 + S.lean.x * 0.15));
    // The mouth's hover area follows the mouth.
    const [mx, my] = deform(547, 600);
    mouthHit.setAttribute('cx', mx.toFixed(1));
    mouthHit.setAttribute('cy', my.toFixed(1));
  }

  // Drawing units -> window pixels.
  function toScreen(x: number, y: number) {
    const m = required(svg.getScreenCTM());
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  }
  const scale = () => required(svg.getScreenCTM()).a; // pixels per drawing unit
  const mouthScreen = () => {
    const [x, y] = deform(547, 615);
    return toScreen(x, y);
  };

  // ---------------------------------------------------------------------------------------------
  // The frame loop.
  // ---------------------------------------------------------------------------------------------
  const mouse = { x: innerWidth / 2, y: innerHeight * 0.3, seen: false };
  let last = performance.now();
  const tickers = new Set<(dt: number, now: number) => void>();

  function frame(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000);
    last = now;
    state.t += dt;

    if (activeMuncher !== btn) {
      // Idle is a moving hold: the body keeps still; the eyes follow and blink.
      S.squash.t = 1;
      S.lean.t = 0;
      // Anticipation: close by, the pupils dilate; very close, the mouth opens, ready (with a margin, so it
      // does not flicker at the edge).
      const r = svg.getBoundingClientRect();
      const m = mouthScreen();
      const dist = Math.hypot(mouse.x - m.x, mouse.y - m.y) / r.width;
      const near = mouse.seen ? Math.max(0, 1 - dist / 0.45) : 0;
      S.eyes.t = 1 + near * 0.25;
      const ready = S.mouth.t > 0 ? dist < 0.3 : dist < 0.24;
      S.mouth.t = mouse.seen && ready ? 0.4 : 0;
    }
    // The middle of the body chases the top a little, so a lean ripples down like jelly.
    S.wave.t = -S.lean.x * 0.25;

    for (const spring of Object.values(S)) spring.step(dt);
    for (const b of bulges) b.a += (b.amp - b.a) * Math.min(1, dt * 14);
    for (const fn of tickers) fn(dt, now);

    // Pupils: look at the cursor, or spin while dizzy.
    for (const id of ['pupil-l', 'pupil-r'] as const) {
      const p = PUPIL[id];
      let tx: number;
      let ty: number;
      if (state.pupilOverride) {
        [tx, ty] = state.pupilOverride(id, state.t);
      } else {
        const [ex, ey] = EYE[p.eye];
        const e = toScreen(ex, ey);
        const dx = mouse.x - e.x;
        const dy = mouse.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(p.r, dist / scale() / 3);
        tx = ex + (dx / dist) * reach - p.base[0];
        ty = ey + (dy / dist) * reach - p.base[1];
      }
      const o = pupilOffset[id];
      const ease = state.pupilOverride ? 1 : Math.min(1, dt * 16);
      o[0] += (tx - o[0]) * ease;
      o[1] += (ty - o[1]) * ease;
    }
    render();
    scheduleFrame(frame);
  }
  scheduleFrame(frame);

  let lastMove = { x: 0, y: 0, t: 0 };
  window.addEventListener(
    'pointermove',
    (e) => {
      // A fast dart of the eyes nudges the body: a small jelly wobble that settles. Slow or still: no motion.
      const now = performance.now();
      const dt = Math.max(8, now - lastMove.t);
      const vx = (e.clientX - lastMove.x) / dt; // px per ms
      const vy = (e.clientY - lastMove.y) / dt;
      lastMove = { x: e.clientX, y: e.clientY, t: now };
      const speed = Math.hypot(vx, vy);
      if (activeMuncher !== btn && !reduce.matches && mouse.seen && speed > 1.2 && speed < 20) {
        const k = Math.min(1, (speed - 1.2) / 4);
        S.wave.kick(-Math.sign(vx) * 90 * k * Math.min(1, Math.abs(vx) / speed + 0.2));
        S.squash.kick(-0.25 * k);
      }
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.seen = true;
    },
    { signal: events.signal },
  );

  // Blinking: a quick close, a slower open, at random intervals, sometimes twice.
  let blinkSet: number | null = null; // when set, the lids follow this value instead of the spring
  async function blink() {
    await tween(60, (t) => (blinkSet = 1 - t), easeIn);
    await tween(130, (t) => (blinkSet = t), easeOut);
    blinkSet = null;
  }
  (function blinkLoop() {
    scheduleTimeout(
      async () => {
        if (activeMuncher !== btn) {
          await blink();
          if (Math.random() < 0.25) {
            await sleep(90);
            await blink();
          }
        }
        blinkLoop();
      },
      2400 + Math.random() * 3800,
    );
  })();

  // ---------------------------------------------------------------------------------------------
  // Tiny timeline helpers.
  // ---------------------------------------------------------------------------------------------
  const sleep = (ms: number) => new Promise<void>((r) => scheduleTimeout(r, ms));
  const easeOut = (t: number) => 1 - (1 - t) ** 3;
  const easeIn = (t: number) => t * t * t;
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  function tween(ms: number, fn: (t: number) => void, ease = (t: number) => t) {
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = () => {
        const t = Math.min(1, (performance.now() - start) / ms);
        fn(ease(t));
        if (t < 1) scheduleFrame(tick);
        else resolve();
      };
      scheduleFrame(tick);
    });
  }

  // ---------------------------------------------------------------------------------------------
  // The morsel: the cursor (or, on touch and keyboard, a dot) drawn on the effects layer.
  // ---------------------------------------------------------------------------------------------
  const morsel = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, gooey: 0 };
  function setMorselKind(kind: 'arrow' | 'dot') {
    morselG.innerHTML =
      kind === 'dot'
        ? '<circle r="11" fill="#4db6ac" stroke="#fff" stroke-width="3"/><circle class="slime" r="11" fill="#8bc34a" opacity="0"/>'
        : '<path d="M0 0v19.5l5.2-5 3.3 7.4 3.4-1.5-3.3-7.3h7.2z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path class="slime" d="M0 0v19.5l5.2-5 3.3 7.4 3.4-1.5-3.3-7.3h7.2z" fill="#8bc34a" opacity="0"/>';
  }
  function drawMorsel() {
    morselG.setAttribute(
      'transform',
      `translate(${morsel.x} ${morsel.y}) rotate(${morsel.rot}) scale(${morsel.sx} ${morsel.sy})`,
    );
    const slime = morselG.querySelector('.slime');
    if (slime) slime.setAttribute('opacity', String(morsel.gooey * 0.75));
  }

  // The tongue: a thick curve from the mouth to its tip, sagging a little as it goes.
  function drawTongue(from: Point, to: Point, width: number) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 + Math.hypot(to.x - from.x, to.y - from.y) * 0.12;
    tongue.setAttribute('d', `M${from.x} ${from.y} Q${mx} ${my} ${to.x} ${to.y}`);
    tongue.setAttribute('stroke-width', String(width));
    tongueTip.setAttribute('cx', String(to.x));
    tongueTip.setAttribute('cy', String(to.y));
    tongueTip.setAttribute('r', String(width * 1.05));
  }

  // ---------------------------------------------------------------------------------------------
  // Goo: blobs with gravity that melt together through the goo filter and pool on the floor.
  // ---------------------------------------------------------------------------------------------
  const blobs = new Set<ReturnType<typeof spawnBlob>>();
  let floorY = 0;
  function spawnBlob(x: number, y: number, vx: number, vy: number, r: number) {
    const el = document.createElementNS(NS, 'ellipse');
    el.setAttribute('fill', `url(#${id}-goo-fill)`);
    gooLayer.append(el);
    const b = {
      el,
      x,
      y,
      vx,
      vy,
      r,
      r0: r,
      flat: 0,
      landed: false,
      life: 0,
      small: false,
      dry: false,
    };
    blobs.add(b);
    return b;
  }
  function stepGoo(dt: number) {
    const g = 2600;
    for (const b of blobs) {
      b.life += dt;
      if (!b.landed) {
        b.vy += g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y + b.r * 0.4 >= floorY) {
          b.y = floorY - b.r * 0.4;
          b.landed = true;
          b.vx *= 0.35;
          // Now and then a drop splashes back up.
          if (!b.small && Math.random() < 0.12) {
            const sp = spawnBlob(
              b.x,
              b.y - 4,
              (Math.random() - 0.5) * 380,
              -260 - Math.random() * 260,
              b.r * 0.35,
            );
            sp.small = true;
          }
        }
      } else if (!b.dry) {
        // Splat: spread sideways into the puddle and flatten.
        b.x += b.vx * dt;
        b.vx *= 0.9;
        b.flat += (1 - b.flat) * Math.min(1, dt * 10);
      }
      if (b.dry) {
        // The puddle soaks away.
        b.r -= dt * b.r0 * 1.1;
        if (b.r <= 0.5) {
          b.el.remove();
          blobs.delete(b);
          continue;
        }
      }
      // In flight a blob stretches along its fall; on the floor it lies flat.
      const speed = Math.hypot(b.vx, b.vy);
      const stretch = b.landed ? 1 : 1 + Math.min(0.6, speed / 2500);
      const rx = (b.r * (1 + b.flat * 0.7)) / Math.sqrt(stretch);
      const ry = b.r * (1 - b.flat * 0.5) * Math.sqrt(stretch);
      b.el.setAttribute('cx', b.x.toFixed(1));
      b.el.setAttribute('cy', (b.y + b.flat * b.r * 0.35).toFixed(1));
      b.el.setAttribute('rx', Math.max(0, rx).toFixed(1));
      b.el.setAttribute('ry', Math.max(0, ry).toFixed(1));
    }
  }
  tickers.add(stepGoo);

  // ---------------------------------------------------------------------------------------------
  // The act.
  // ---------------------------------------------------------------------------------------------
  let cooldownUntil = 0;

  async function munch(from: Point, kind: 'arrow' | 'dot') {
    if (activeMuncher || performance.now() < cooldownUntil) return;
    if (reduce.matches) {
      say('Om nom… just kidding. Here, have it back.');
      blink();
      cooldownUntil = performance.now() + 800;
      return;
    }
    activeMuncher = btn;
    btn.setAttribute('aria-busy', 'true');
    const hide = kind === 'arrow';
    if (hide) root.classList.add('cursor-munched');
    setMorselKind(kind);
    Object.assign(morsel, { x: from.x, y: from.y, rot: 0, sx: 1, sy: 1, gooey: 0 });
    morselG.style.display = '';
    drawMorsel();
    const px = scale();
    const leanTo = (x: number) => Math.max(-1, Math.min(1, (x - mouthScreen().x) / 300));

    // 1. Wind up: eyes lock on, the body rears back and the mouth opens.
    say('Ooh!');
    S.eyes.t = 1.25;
    S.mouth.t = 1.2;
    S.lean.t = -leanTo(from.x) * 30;
    S.squash.t = 0.9;
    await sleep(130);

    // 2. The tongue snaps out and sticks to it.
    S.lean.t = leanTo(from.x) * 70;
    S.squash.t = 1.12;
    S.squash.kick(1.4);
    const tw = 26 * px;
    await tween(
      110,
      (t) => {
        const m = mouthScreen();
        drawTongue(m, { x: m.x + (from.x - m.x) * t, y: m.y + (from.y - m.y) * t }, tw);
      },
      easeOut,
    );
    say('NOM.');
    await tween(70, (t) => {
      // It sticks: the tip squishes on the target.
      const m = mouthScreen();
      drawTongue(m, from, tw * (1 + 0.25 * Math.sin(t * Math.PI)));
      morsel.sx = morsel.sy = 1 - 0.15 * Math.sin(t * Math.PI);
      drawMorsel();
    });

    // 3. Reel it in.
    S.lean.t = -leanTo(from.x) * 20;
    await tween(
      240,
      (t) => {
        const m = mouthScreen();
        const tip = { x: from.x + (m.x - from.x) * t, y: from.y + (m.y - from.y) * t };
        drawTongue(m, tip, tw * (1 - t * 0.3));
        morsel.x = tip.x;
        morsel.y = tip.y;
        morsel.rot = -40 * t;
        morsel.sx = morsel.sy = 1 - 0.55 * t;
        drawMorsel();
      },
      easeIn,
    );
    tongue.setAttribute('d', '');
    tongueTip.setAttribute('r', '0');
    morselG.style.display = 'none';
    // In the mouth now: seen through the body from here on.
    Object.assign(state.lump, { x: 547, y: 640, rot: -30, s: 0.9, op: 0 });

    // 4. Chomp: the mouth snaps shut, the body squashes, the cheeks puff.
    S.mouth.t = 0;
    S.mouth.x = 0;
    S.lean.t = 0;
    S.eyes.t = 1;
    S.squash.t = 1;
    S.squash.kick(-3.2);
    const cheekL = bulge(400, 615, 115, 0.3);
    const cheekR = bulge(700, 615, 115, 0.3);
    await sleep(220);

    // 5. Chew, three times, cheeks working side to side.
    for (let i = 0; i < 3; i++) {
      // Munch: the shut mouth squishes, one cheek puffs, the body gives a little.
      cheekL.amp = i % 2 ? 0.42 : 0.18;
      cheekR.amp = i % 2 ? 0.18 : 0.42;
      S.squash.kick(-1.2);
      await tween(110, (t) => (state.chew = Math.sin(t * Math.PI)), easeOut);
      S.squash.kick(0.7);
      await sleep(110);
    }
    state.chew = 0;
    cheekL.amp = cheekR.amp = 0;

    // 6. Gulp: a lump slides down into the belly.
    say('*gulp*');
    S.blink.t = 0.35;
    const lump = bulge(547, 680, 100, 0.22);
    S.squash.kick(1.2);
    await tween(
      560,
      (t) => {
        lump.y = 680 + t * 80;
        state.lump.op = Math.min(0.5, t * 1.6);
        state.lump.y = 640 + t * 110;
        state.lump.rot = -30 + t * 200;
      },
      easeInOut,
    );
    lump.amp = 0;
    S.squash.kick(-1.6);
    await sleep(150);
    bulges.delete(cheekL);
    bulges.delete(cheekR);
    say('Mmm… crunchy.');
    await sleep(420);
    S.blink.t = 1;
    await sleep(250);

    // 7. Uh oh: the tummy rumbles, the skin goes green, the eyes spin, the mouth goes wavy.
    say('Uh oh…');
    const rumble = [bulge(450, 740, 90, 0), bulge(650, 745, 90, 0)];
    tween(900, (t) => (state.sick = t), easeInOut);
    tween(300, (t) => (state.queasy = t), easeOut);
    state.pupilOverride = (id, t) => {
      const p = PUPIL[id];
      const [ex, ey] = EYE[p.eye];
      const dir = id === 'pupil-l' ? 1 : -1;
      const a = t * 9 * dir;
      return [ex + Math.cos(a) * p.r * 0.55 - p.base[0], ey + Math.sin(a) * p.r * 0.55 - p.base[1]];
    };
    const rumbleStart = performance.now();
    const rumbleTick = () => {
      const t = (performance.now() - rumbleStart) / 1000;
      // The cursor rattles around in the tummy.
      state.lump.x = 547 + Math.sin(t * 11) * 70;
      state.lump.y = 748 + Math.sin(t * 17 + 1) * 14;
      state.lump.rot = 170 + Math.sin(t * 9) * 60;
      rumble[0].amp = 0.18 + 0.18 * Math.sin(t * 17);
      rumble[1].amp = 0.18 + 0.18 * Math.sin(t * 13 + 2);
      S.lean.t = Math.sin(t * 6) * 26;
    };
    tickers.add(rumbleTick);
    await sleep(1250);
    tickers.delete(rumbleTick);
    for (const b of rumble) b.amp = 0;
    S.lean.t = 0;

    // 8. Heave, twice: squash down, a lump climbs, the cheeks balloon, the mouth clamps shut.
    say('hrrk…');
    state.pupilOverride = (id) => {
      // Eyes squeezed upward.
      const p = PUPIL[id];
      const [ex, ey] = EYE[p.eye];
      return [ex - p.base[0], ey - p.r * 0.7 - p.base[1]];
    };
    for (let i = 0; i < 2; i++) {
      S.blink.t = 0.45;
      S.squash.t = 0.84;
      const rise = bulge(547, 760, 120, 0.4);
      const top = i === 0 ? 720 : 680;
      await tween(
        380,
        (t) => {
          rise.y = 760 - t * 150;
          state.lump.x += (547 - state.lump.x) * 0.2;
          state.lump.y = 750 - t * (750 - top);
          state.lump.rot = 180 + t * 40;
        },
        easeIn,
      );
      cheekL.amp = cheekR.amp = 0.55;
      bulges.add(cheekL);
      bulges.add(cheekR);
      S.squash.t = 1.06;
      S.squash.kick(2.2);
      await sleep(200);
      rise.amp = 0;
      cheekL.amp = cheekR.amp = 0;
      S.squash.t = 1;
      if (i === 0) await tween(240, (t) => (state.lump.y = top + t * 80), easeOut);
      else await sleep(120);
      bulges.delete(rise);
    }

    // 9. BLEH: the body stretches up and lurches forward, and out it all comes.
    say('BLEEEEH!');
    const m0 = mouthScreen();
    const side = m0.x < innerWidth / 2 ? 1 : -1;
    const r = svg.getBoundingClientRect();
    // The goo lands in front of the feet, a little to one side, and pools there.
    floorY = toScreen(512, FEET).y + 22 * (r.width / 440);
    const land = {
      x: Math.max(
        30,
        Math.min(innerWidth - 30, m0.x + side * Math.min(r.width * 0.32, innerWidth * 0.25)),
      ),
      y: floorY,
    };
    S.blink.t = 0.55;
    S.eyes.t = 0.8;
    state.pupilOverride = (id) => {
      const p = PUPIL[id];
      const [ex, ey] = EYE[p.eye];
      return [ex - p.base[0], ey + p.r * 0.55 - p.base[1]];
    };
    S.mouth.t = 1.45;
    S.squash.t = 0.94;
    S.squash.kick(3);
    S.lean.t = side * 38;
    S.lean.kick(side * 260);

    state.lump.op = 0;
    // The stream: a gush of goo along an arc to the landing spot.
    const T = 0.34;
    const g = 2600;
    const emitFor = 620;
    const emitStart = performance.now();
    let launched = false;
    const emit = () => {
      const el = performance.now() - emitStart;
      if (el > emitFor) return;
      const m = mouthScreen();
      const k = el / emitFor;
      // The gush starts strong and far, then weakens and falls closer.
      const reach = 1 - k * 0.6;
      const tx = m.x + (land.x - m.x) * reach + (Math.random() - 0.5) * 24;
      const vx = (tx - m.x) / T;
      const vy = (land.y - m.y) / T - 0.5 * g * T;
      const n = 4;
      for (let i = 0; i < n; i++) {
        spawnBlob(
          m.x + (Math.random() - 0.5) * 40 * px,
          m.y + (Math.random() - 0.3) * 30 * px,
          vx * (0.9 + Math.random() * 0.2),
          vy * (0.9 + Math.random() * 0.2),
          (10 + Math.random() * 10) * (px * 2.4) * (k < 0.3 ? 1.35 : 1 - k * 0.45),
        );
      }
      // The cursor rides out in the middle of the gush.
      if (!launched && el > 120) {
        launched = true;
        launchMorsel(m, land, T * 1.05, g);
      }
    };
    tickers.add(emit);
    await sleep(emitFor);
    tickers.delete(emit);

    // 10. Relief.
    S.mouth.t = 0.2;
    S.lean.t = 0;
    S.squash.t = 0.95;
    S.eyes.t = 1;
    await morselLanded;
    say('…much better.');
    S.blink.t = 0.5;
    scheduleTimeout(() => (S.blink.t = 1), 650);
    tween(1000, (t) => (state.sick = 1 - t), easeInOut);
    state.queasy = 0;
    state.pupilOverride = null;
    S.mouth.t = 0;
    S.squash.t = 1;
    await sleep(300);

    // 11. The cursor shakes the goo off, and flies home.
    await tween(420, (t) => {
      morsel.rot = Math.sin(t * Math.PI * 6) * 18 * (1 - t);
      morsel.gooey = 1 - t;
      drawMorsel();
    });
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const b = spawnBlob(
        morsel.x + 6,
        morsel.y + 8,
        Math.cos(a) * 260,
        Math.sin(a) * 320 - 120,
        4 + Math.random() * 4,
      );
      b.small = true;
    }
    for (const b of blobs) b.dry = true;
    say('Here, have it back.');
    const home = hide && mouse.seen ? { x: mouse.x, y: mouse.y } : null;
    const start = { x: morsel.x, y: morsel.y };
    if (home) {
      await tween(
        380,
        (t) => {
          morsel.x = start.x + (home.x - start.x) * t;
          morsel.y = start.y + (home.y - start.y) * t - Math.sin(t * Math.PI) * 60;
          morsel.rot = 0;
          drawMorsel();
        },
        easeInOut,
      );
      // Follow the real mouse for the last instant, then hand it back.
      morsel.x = mouse.x;
      morsel.y = mouse.y;
      drawMorsel();
    } else {
      await tween(300, (t) => morselG.setAttribute('opacity', String(1 - t)));
      morselG.removeAttribute('opacity');
    }
    morselG.style.display = 'none';
    root.classList.remove('cursor-munched');
    blink();
    activeMuncher = null;
    btn.removeAttribute('aria-busy');
    cooldownUntil = performance.now() + 1400;
  }

  // The cursor in flight: a ballistic arc with spin, a splashdown, and a squashy bounce.
  let morselLanded = Promise.resolve();
  function launchMorsel(from: Point, land: Point, T: number, g: number) {
    let resolveLanded: () => void;
    morselLanded = new Promise<void>((r) => (resolveLanded = r));
    Object.assign(morsel, { x: from.x, y: from.y, rot: 0, sx: 0.4, sy: 0.4, gooey: 1 });
    morselG.style.display = '';
    let vx = (land.x - from.x) / T;
    let vy = (land.y - 14 - from.y) / T - 0.5 * g * T;
    let bounces = 0;
    const spin = (Math.random() < 0.5 ? -1 : 1) * 720;
    const fly = (dt: number) => {
      vy += g * dt;
      morsel.x += vx * dt;
      morsel.y += vy * dt;
      morsel.rot += spin * dt * (bounces ? 0.3 : 1);
      const grow = Math.min(1, morsel.sx + dt * 4);
      morsel.sx = morsel.sy = grow;
      const floor = land.y - 14;
      if (morsel.y >= floor && vy > 0) {
        morsel.y = floor;
        bounces++;
        // Splash on impact.
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
          spawnBlob(
            morsel.x,
            floor + 6,
            Math.cos(a) * 300,
            Math.sin(a) * 420,
            4 + Math.random() * 5,
          );
        }
        if (bounces > 2 || Math.abs(vy) < 200) {
          tickers.delete(fly);
          squish().then(resolveLanded);
          return;
        }
        vy = bounces === 1 ? -Math.max(520, Math.abs(vy) * 0.6) : -vy * 0.4;
        vx *= 0.5;
        morsel.sx = 1.35;
        morsel.sy = 0.6;
      }
      drawMorsel();
    };
    tickers.add(fly);
  }
  async function squish() {
    const r0 = morsel.rot % 360;
    await tween(
      420,
      (t) => {
        const w = Math.sin(t * Math.PI * 3) * (1 - t);
        morsel.sx = 1 + w * 0.35;
        morsel.sy = 1 - w * 0.35;
        morsel.rot = r0 * (1 - t);
        drawMorsel();
      },
      easeOut,
    );
  }

  // A poke: touching the body makes it wobble.
  function poke(strength = 1) {
    S.squash.kick(-2.2 * strength);
    S.wave.kick((Math.random() < 0.5 ? -1 : 1) * 260 * strength);
  }

  // ---------------------------------------------------------------------------------------------
  // Ways to start it.
  // ---------------------------------------------------------------------------------------------
  mouthHit.addEventListener(
    'pointerenter',
    (e) => {
      if (e.pointerType === 'mouse') munch({ x: e.clientX, y: e.clientY }, 'arrow');
    },
    { signal: events.signal },
  );
  btn.addEventListener(
    'pointerdown',
    (e) => {
      if (activeMuncher === btn) {
        poke(0.6);
        return;
      }
      poke();
      munch({ x: e.clientX, y: e.clientY }, e.pointerType === 'mouse' ? 'arrow' : 'dot');
    },
    { signal: events.signal },
  );
  btn.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      munch({ x: r.left - 30, y: r.top + r.height * 0.35 }, 'dot');
    },
    { signal: events.signal },
  );

  return () => {
    disposed = true;
    events.abort();
    for (const id of frames) window.cancelAnimationFrame(id);
    for (const id of timers) window.clearTimeout(id);
    if (activeMuncher === btn) {
      activeMuncher = null;
      root.classList.remove('cursor-munched');
    }
    btn.removeAttribute('aria-busy');
    shapesG.replaceChildren();
    fx.remove();
  };
}
