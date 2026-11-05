'use client';
import { motion } from 'motion/react';
import {
  createContext,
  type PointerEvent,
  type ReactNode,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';

const SPRING = { type: 'spring', stiffness: 500, damping: 40 } as const;
const LEAVE_MS = 120; // the pointer crosses the gap between two items in less, so nothing blinks

/** The look of an item a `HoverGroup` marks: the markers sit under its text. */
export const MARKED_ITEM_CLASS =
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground/80 data-[active=true]:text-fd-primary';

const Group = createContext<{
  markers: string;
  pointed?: string;
  enter: (item: string) => void;
  leave: () => void;
}>({ markers: '', enter() {}, leave() {} });

/**
 * A list whose items share one hover marker and one active marker, each sliding from item to item
 * instead of blinking off on one and on at the next. Each group has its own markers.
 */
export function HoverGroup({ children }: { children: ReactNode }) {
  const markers = useId();
  const [pointed, setPointed] = useState<string>();
  const leaving = useRef<ReturnType<typeof setTimeout>>(undefined);
  const enter = (item: string) => {
    clearTimeout(leaving.current);
    setPointed(item);
  };
  const leave = () => {
    leaving.current = setTimeout(() => setPointed(undefined), LEAVE_MS);
  };
  return <Group.Provider value={{ markers, pointed, enter, leave }}>{children}</Group.Provider>;
}

/** The pointer handlers for item `item` of the enclosing `HoverGroup`, and its markers. */
export function useMarkedItem(item: string, active: boolean) {
  const group = useContext(Group);
  return {
    pointer: {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse') group.enter(item);
      },
      onPointerLeave: group.leave,
    },
    markers: (
      <>
        {group.pointed === item && (
          <motion.span
            layoutId={`${group.markers}-hover`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-lg bg-fd-accent/50"
            transition={SPRING}
          />
        )}
        {active && (
          <motion.span
            layoutId={`${group.markers}-active`}
            className="absolute inset-0 rounded-lg bg-fd-primary/10 before:absolute before:inset-y-2.5 before:inset-s-2.5 before:w-px before:bg-fd-primary"
            transition={SPRING}
          />
        )}
      </>
    ),
  };
}
