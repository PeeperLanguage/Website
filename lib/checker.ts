/** A line and a UTF-16 column in a file, both from 1. */
export interface Position {
  line: number;
  column: number;
}

/** A place in a file the checker points at, and what it says there. */
export interface Place {
  file: string;
  start: Position;
  end: Position;
  message: string;
}

/** One diagnostic, as `crates/driver/browser` in the compiler repo gives it. */
export interface Entry {
  severity: 'error' | 'warning' | 'info' | 'hint';
  code: string;
  message: string;
  place: Place | null;
  related: Place[];
}

/** What a program did when it ran. */
export interface Ran {
  output: { stream: 'stdout' | 'stderr'; text: string }[]; // as written, a panic's text last
  exit_code: number;
}

export interface CheckRequest {
  id: number;
  files: Record<string, string>;
  run?: boolean; // run the program too, if the check lets it start
}

export type CheckReply =
  | { id: number; entries: Entry[]; failure?: undefined }
  | { id: number; failure: string; entries?: undefined };

/** What pressing Run gave: `diagnostics` as a terminal shows them, and `run` if it started. */
export type RunReply =
  | { id: number; diagnostics: string; run: Ran | null; failure?: undefined }
  | { id: number; failure: string; diagnostics?: undefined };
