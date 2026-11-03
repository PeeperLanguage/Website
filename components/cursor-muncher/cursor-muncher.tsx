'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn';
import { mountCursorMuncher } from './act';

// While it holds the pointer, the frog hides it everywhere, over links and buttons too.
const holdsPointer = 'html.cursor-munched,html.cursor-munched *{cursor:none!important}';

/**
 * The animated frog, whole: it brings its own drawing, motion and styles, and needs nothing from the
 * page. It peeps over the top edge of the nearest positioned parent; `className` says where along
 * that edge, and how wide.
 */
export function CursorMuncher({ className }: { className?: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) return mountCursorMuncher(ref.current);
  }, []);

  return (
    <div ref={ref} id={id} className={cn('absolute bottom-full z-10 translate-y-[8%]', className)}>
      <style href="cursor-muncher" precedence="default">
        {holdsPointer}
      </style>
      <button
        type="button"
        aria-label="Feed Peeper your cursor"
        title="Hover my mouth or click to feed me your cursor"
        className="block w-full touch-manipulation rounded-xl border-0 bg-transparent p-0 outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand"
      >
        <svg
          viewBox="52 190 920 650"
          aria-hidden="true"
          className="block h-auto w-full overflow-visible"
        >
          <ellipse
            data-shadow=""
            cx="512"
            cy="836"
            rx="380"
            ry="26"
            fill="#263238"
            opacity="0.12"
          />
          <defs>
            <clipPath id={`${id}-clip-eye-l`} data-clip="eye-l">
              <path />
            </clipPath>
            <clipPath id={`${id}-clip-eye-r`} data-clip="eye-r">
              <path />
            </clipPath>
            <clipPath id={`${id}-clip-mouth`} data-clip="mouth">
              <path />
            </clipPath>
          </defs>
          <g data-shapes="" />
          <circle data-mouth-hit="" cx="547" cy="600" r="90" fill="transparent" />
        </svg>
      </button>
      <p role="status" aria-live="polite" className="sr-only">
        Psst… feed me your cursor.
      </p>
    </div>
  );
}
