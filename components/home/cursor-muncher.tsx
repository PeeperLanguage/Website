'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/cn';
import { mountCursorMuncher } from '@/lib/cursor-muncher';

/** Interactive homepage mascot; the drawing and timeline come from Cursor Muncher. */
export function CursorMuncher({ className }: { className?: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) return mountCursorMuncher(ref.current);
  }, []);

  return (
    <div ref={ref} id={id} className={cn('absolute bottom-full z-10 translate-y-[8%]', className)}>
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
