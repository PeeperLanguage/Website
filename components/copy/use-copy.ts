import { useState } from 'react';

const COPIED_MS = 1500; // how long a button says how its copy went

/** Copies text; `copied` says how the last copy went, and is unset again soon after. */
export function useCopy() {
  const [copied, setCopied] = useState<boolean>();
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    setTimeout(() => setCopied(undefined), COPIED_MS);
  }
  return { copied, copy };
}
