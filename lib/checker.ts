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

export interface CheckRequest {
  id: number;
  files: Record<string, string>;
}

export type CheckReply =
  | { id: number; entries: Entry[]; failure?: undefined }
  | { id: number; failure: string; entries?: undefined };
