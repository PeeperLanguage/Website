import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The example program at `content/<name>.peep`. Programs are content, so the code holds none. */
export function readProgram(name: string) {
  return readFile(join(process.cwd(), 'content', `${name}.peep`), 'utf8');
}
