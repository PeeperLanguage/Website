import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  allFolders,
  folderIcon,
  isFixed,
  languageOf,
  MAIN,
  MANIFEST,
  plannedMoves,
  projectName,
  STARTING_FOLDER_ICONS,
  STARTING_MANIFEST,
  sharedFiles,
  topMost,
} from './file-paths.ts';

const names = [
  MANIFEST,
  MAIN,
  'src/lib/math.peep',
  'src/lib/deep/more.peep',
  'src/other.peep',
  'src/tools/other.peep',
];
const folders = allFolders(names, ['src/empty']);

test('every folder is known, with those above it', () => {
  assert.deepEqual(folders, ['src', 'src/empty', 'src/lib', 'src/lib/deep', 'src/tools']);
  assert.deepEqual(allFolders([], ['a/b/c']), ['a', 'a/b', 'a/b/c']);
});

test('a folder takes everything in it along', () => {
  const moved = plannedMoves(names, folders, [['src/lib', 'src/empty/lib']]);
  assert.deepEqual(Object.fromEntries(moved), {
    'src/lib': 'src/empty/lib',
    'src/lib/deep': 'src/empty/lib/deep',
    'src/lib/deep/more.peep': 'src/empty/lib/deep/more.peep',
    'src/lib/math.peep': 'src/empty/lib/math.peep',
  });
});

test('a move onto what exists is refused whole, so no text is lost', () => {
  assert.match(
    plannedMoves(names, folders, [
      ['src/lib/math.peep', 'src/math.peep'],
      ['src/tools/other.peep', 'src/other.peep'],
    ]),
    /src\/other.peep already exists/,
  );
});

test('two moves cannot land on the same path', () => {
  assert.match(
    plannedMoves(names, folders, [
      ['src/other.peep', 'src/empty/other.peep'],
      ['src/tools/other.peep', 'src/empty/other.peep'],
    ]),
    /already exists/,
  );
});

test('a folder cannot go inside itself', () => {
  assert.match(plannedMoves(names, folders, [['src/lib', 'src/lib/deep/lib']]), /inside itself/);
});

test('what makes a project stays, but a move that changes nothing is not an error', () => {
  for (const path of [MAIN, MANIFEST, 'src']) {
    assert.match(plannedMoves(names, folders, [[path, 'src/lib/x']]), /stays where it is/);
    assert.equal(plannedMoves(names, folders, [[path, path]]).size, 0);
  }
});

test('nothing leaves src, where imports look', () => {
  assert.match(plannedMoves(names, folders, [['src/other.peep', 'other.peep']]), /Only what is in/);
  assert.match(plannedMoves(names, folders, [['src/lib', 'lib']]), /Only what is in/);
  assert.match(
    plannedMoves(names, folders, [['src/lib', 'srcish/lib']]),
    /Only what is in/,
    'a folder whose name only starts the same is outside',
  );
});

test('only the project folder and what a project needs are fixed', () => {
  for (const path of ['', MANIFEST, 'src', MAIN]) assert.ok(isFixed(path), path);
  for (const path of ['src/other.peep', 'src/lib', 'src/lib/main.peep']) {
    assert.ok(!isFixed(path), path);
  }
});

test('a project has two languages', () => {
  assert.equal(languageOf(MANIFEST), 'toml');
  assert.equal(languageOf(MAIN), 'peeper');
  assert.equal(languageOf('src/lib/peeper.toml.peep'), 'peeper');
});

test('a folder is known by its name, open or shut, at any depth', () => {
  const icons = new Map([...STARTING_FOLDER_ICONS, ['lib', 'folder-lib']]);
  assert.equal(folderIcon('src', false, icons), '/file-icons/folder-src-open.svg');
  assert.equal(folderIcon('src/lib/src', true, icons), '/file-icons/folder-src.svg');
  assert.equal(folderIcon('src/Lib', true, icons), '/file-icons/folder-lib.svg');
  assert.equal(folderIcon('', false, icons), '/file-icons/folder-open.svg');
  assert.equal(folderIcon('src/srcish', true, icons), '/file-icons/folder.svg');
  assert.equal(folderIcon('src/lib', true, STARTING_FOLDER_ICONS), '/file-icons/folder.svg');
});

test('a folder named like a property of every object is a plain folder', () => {
  for (const name of ['constructor', '__proto__', 'toString']) {
    assert.equal(folderIcon(`src/${name}`, true, new Map()), '/file-icons/folder.svg');
  }
});

test('the project folder shows the name in peeper.toml', () => {
  assert.equal(projectName(STARTING_MANIFEST), 'playground');
  assert.equal(projectName('# a note\n\n  name = "myapp"\n'), 'myapp');
  assert.equal(projectName("name='single'"), 'single');
  assert.equal(projectName('name_of = "no"\n'), 'project');
  assert.equal(projectName('name = \n"split"'), 'project');
  assert.equal(projectName(''), 'project');
});

test('a name can be swapped away when what held it moves too', () => {
  const moved = plannedMoves(names, folders, [
    ['src/other.peep', 'src/empty/other.peep'],
    ['src/tools/other.peep', 'src/other.peep'],
  ]);
  assert.equal(moved.get('src/tools/other.peep'), 'src/other.peep');
});

test('a file selected with its folder moves once, with the folder', () => {
  assert.deepEqual(topMost(['lib', 'lib/math.peep', 'other.peep']), ['lib', 'other.peep']);
  assert.deepEqual(topMost(['library', 'lib/math.peep']), ['library', 'lib/math.peep']);
});

test('a share link keeps only the names the file tree could make', () => {
  const link = new URLSearchParams({
    [MANIFEST]: 'name = "myapp"\n',
    [MAIN]: 'one',
    'src/lib/math.peep': 'two',
    'outside.peep': 'bad',
    'src/../../etc/x y.txt': 'bad',
    'src/a/': 'bad',
    'src/noextension': 'bad',
    'src/a.peep/b.peep': 'bad',
    'other.toml': 'bad',
  });
  assert.deepEqual(sharedFiles(link.toString()), {
    [MANIFEST]: 'name = "myapp"\n',
    [MAIN]: 'one',
    'src/lib/math.peep': 'two',
  });
});

test('a share link from before projects becomes one, and its imports stay right', () => {
  const link = new URLSearchParams({
    'main.peep': 'import "playground:lib/math";',
    'lib/math.peep': 'two',
    'a/': 'bad',
  });
  assert.deepEqual(sharedFiles(link.toString()), {
    [MANIFEST]: STARTING_MANIFEST,
    [MAIN]: 'import "playground:lib/math";',
    'src/lib/math.peep': 'two',
  });
});

test('a share link with no start file loads nothing', () => {
  assert.equal(sharedFiles(''), undefined);
  assert.equal(sharedFiles(new URLSearchParams({ 'other.peep': 'x' }).toString()), undefined);
  assert.equal(sharedFiles(new URLSearchParams({ [MANIFEST]: 'x' }).toString()), undefined);
});
