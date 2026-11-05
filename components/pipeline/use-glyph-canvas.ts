import { useEffect, useRef } from 'react';
import { drawGlyphs, fitCanvas, type TextMetrics } from './glyph-canvas';
import type { Glyph } from './glyphs';

/**
 * A canvas for `glyphs`, kept the right size. `rowHeight` gives a text's row height. `repaint` runs
 * once at the start, for a page opened part way down, and when the size, the font or the theme
 * changes. Put `canvas` on the canvas and `sizedBox` on the box its size follows.
 */
export function useGlyphCanvas(
  glyphs: Glyph[][],
  counts: number[],
  rowHeight: (text: number) => number,
  repaint: () => void,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sizedBox = useRef<HTMLDivElement>(null);
  const metrics = useRef<TextMetrics[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: once; the observers outlive a render
  useEffect(() => {
    const measure = () => {
      if (!canvas.current) return;
      metrics.current = fitCanvas(
        canvas.current,
        counts.map((_, text) => rowHeight(text)),
        counts,
      );
      repaint();
    };
    const resized = new ResizeObserver(measure);
    if (sizedBox.current) resized.observe(sizedBox.current);
    const themed = new MutationObserver(measure);
    themed.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-code-theme'],
    });
    document.fonts.ready.then(measure);
    return () => {
      resized.disconnect();
      themed.disconnect();
    };
  }, []);

  const draw = (from: number, sweep: number) => {
    if (!canvas.current || metrics.current.length === 0) return;
    drawGlyphs(canvas.current, glyphs, { counts, metrics: metrics.current }, from, sweep);
  };
  return { canvas, sizedBox, draw };
}
