'use client';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Motion for the home page; a viewer who asks for less motion gets fades only. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
