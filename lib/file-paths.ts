export const EXTENSION = '.peep';

/** The project file, which names the package that imports start with. */
export const MANIFEST = 'peeper.toml';

/** The folder of a project that holds its modules: nothing outside it can be imported. */
export const SOURCE = 'src';

/** Where a program starts. */
export const MAIN = `${SOURCE}/main${EXTENSION}`;

export const STARTING_MANIFEST = 'name = "playground"\n';

export const STARTING_CODE = `// Edit this, then press Run.
fn square(x: i64) -> i64 {
    return x * x;
}

fn main() {
    let total = square(4);
    println("total:", total);
}
`;

/** The language of a project's `file`, by its highlighter's name. */
export function languageOf(file: string) {
  return file === MANIFEST ? 'toml' : 'peeper';
}

/** Whether `path` is what makes a project one: it cannot be renamed, moved or deleted. */
export function isFixed(path: string) {
  return path === '' || path === MANIFEST || path === SOURCE || path === MAIN;
}

/** Icons by folder name until the full list comes: every project has this folder. */
export const STARTING_FOLDER_ICONS = new Map([[SOURCE, 'folder-src']]);

/** The icon of the folder at `path`, given the `icons` of each folder name. */
export function folderIcon(path: string, shut: boolean, icons: Map<string, string>) {
  const icon = icons.get(baseName(path).toLowerCase()) ?? 'folder';
  return `/file-icons/${icon}${shut ? '' : '-open'}.svg`;
}

/**
 * The name the project folder shows. The compiler judges `manifest` and reports what is wrong
 * with it; this only labels the folder, so anything it cannot read gets a plain word.
 */
export function projectName(manifest: string) {
  return manifest.match(/^[ \t]*name[ \t]*=[ \t]*["']([^"'\n]+)["']/m)?.[1] ?? 'project';
}

export const MODULE_PATH = /^[A-Za-z_]\w*(\/[A-Za-z_]\w*)*$/; // what an import can name

/**
 * The files of a share link's `hash`, or nothing if it has no `MAIN`. A link can be edited by
 * hand, so any name the file tree could not make itself is left out. A link from before projects
 * has no `MANIFEST` and its modules at the top: they go in `SOURCE`, and the starting name is the
 * package they already import.
 */
export function sharedFiles(hash: string) {
  const pairs = [...new URLSearchParams(hash)];
  const manifest = pairs.find(([name]) => name === MANIFEST)?.[1];
  const inProject = pairs.map(([name, text]): [string, string] => [
    manifest === undefined ? `${SOURCE}/${name}` : name,
    text,
  ]);
  const usable = ([name]: [string, string]) =>
    isInside(name, SOURCE) &&
    name.endsWith(EXTENSION) &&
    MODULE_PATH.test(name.slice(0, -EXTENSION.length));
  const files = Object.fromEntries(inProject.filter(usable));
  return MAIN in files ? { [MANIFEST]: manifest ?? STARTING_MANIFEST, ...files } : undefined;
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
    if (isFixed(from)) return `${from} stays where it is: every project has it.`;
    if (isInside(to, from)) return `${from} cannot go inside itself.`;
    if (!isInside(to, SOURCE)) return `Only what is in ${SOURCE} can be imported.`;
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
