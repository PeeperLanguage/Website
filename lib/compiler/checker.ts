/** Why there is no reply when the checker never got going. */
export const CHECKER_FAILED = 'the checker could not start';

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
  code: string; // empty for a problem with peeper.toml
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
  place?: Position & { file: string }; // instead, answer hover and go to definition here
}

export type CheckReply =
  | { id: number; entries: Entry[]; failure?: undefined }
  | { id: number; failure: string; entries?: undefined };

/**
 * What hover shows at a `place`, in Markdown, and where the name there is declared: each null when
 * nothing is there, and a declaration in a bundled library, which the page does not have, too.
 */
export type PlaceReply =
  | {
      id: number;
      hover: string | null;
      definition: Omit<Place, 'message'> | null;
      failure?: undefined;
    }
  | { id: number; failure: string; hover?: undefined; definition?: undefined };

/** What pressing Run gave: `diagnostics` as a terminal shows them, and `run` if it started. */
export type RunReply =
  | { id: number; diagnostics: string; run: Ran | null; failure?: undefined }
  | { id: number; failure: string; diagnostics?: undefined };
