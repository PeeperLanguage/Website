export const EXTENSION = '.peep';

/** Where a program starts, so it stays at the top and cannot be moved or deleted. */
export const MAIN = `main${EXTENSION}`;

export const MODULE_PATH = /^[A-Za-z_]\w*(\/[A-Za-z_]\w*)*$/; // what an import can name

/**
 * The files of a share link's `hash`, or nothing if it has no `MAIN`. A link can be edited by
 * hand, so any name the file tree could not make itself is left out.
 */
export function sharedFiles(hash: string) {
  const usable = ([name]: [string, string]) =>
    name.endsWith(EXTENSION) && MODULE_PATH.test(name.slice(0, -EXTENSION.length));
  const files = Object.fromEntries([...new URLSearchParams(hash)].filter(usable));
  return MAIN in files ? files : undefined;
}

export function parentOf(path: string) {
  return path.split('/').slice(0, -1).join('/');
}

export function baseName(path: string) {
  return path.split('/').at(-1) ?? path;
}

/** `name` in `folder`; the empty folder is the top of the program. */
export function pathIn(folder: string, name: string) {
  return folder ? `${folder}/${name}` : name;
}

export function isInside(path: string, folder: string) {
  return path.startsWith(`${folder}/`);
}

/** `paths` without any that sit inside another of them: moving a folder takes those along. */
export function topMost(paths: string[]) {
  return paths.filter((path) => !paths.some((other) => isInside(path, other)));
}

/** All folders: those of `names`, those in `folders`, and every one above them. */
export function allFolders(names: string[], folders: string[]) {
  const found = new Set<string>();
  for (const start of [...names.map(parentOf), ...folders]) {
    for (let folder = start; folder; folder = parentOf(folder)) found.add(folder);
  }
  return [...found].sort();
}

/**
 * The new path of everything that `moves` (from, to) changes, or why they cannot be made.
 * `folders` must be all of them. Nothing merges or overwrites, so no file's text can be lost.
 */
export function plannedMoves(names: string[], folders: string[], moves: [string, string][]) {
  const entries = [...names, ...folders];
  const planned = new Map<string, string>();
  for (const [from, to] of moves) {
    if (from === to) continue;
    if (from === MAIN) return `${MAIN} stays where it is: a program starts there.`;
    if (isInside(to, from)) return `${from} cannot go inside itself.`;
    for (const entry of entries) {
      if (entry === from || isInside(entry, from))
        planned.set(entry, to + entry.slice(from.length));
    }
  }
  const taken = new Set(entries.filter((entry) => !planned.has(entry)));
  for (const to of planned.values()) {
    if (taken.has(to)) return `${to} already exists.`;
    taken.add(to);
  }
  return planned;
}
