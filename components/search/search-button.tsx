'use client';
import {
  FullSearchTrigger,
  type FullSearchTriggerProps,
  SearchTrigger,
} from 'fumadocs-ui/layouts/shared/slots/search-trigger';
import { cn } from '@/lib/cn';

/** Fumadocs' search button, round wherever it shows, as the home page's header makes it. */
function SearchButton({ className, ...props }: FullSearchTriggerProps) {
  return <FullSearchTrigger className={cn('rounded-full ps-2.5', className)} {...props} />;
}

/** The layouts' `searchTrigger` slot: the stock icon button on small screens, round otherwise. */
export const SEARCH_TRIGGER = { sm: SearchTrigger, full: SearchButton };
