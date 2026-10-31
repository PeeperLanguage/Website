import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allFolders, MAIN, plannedMoves, topMost } from './file-paths.ts';

const names = [MAIN, 'lib/math.peep', 'lib/deep/more.peep', 'other.peep', 'tools/other.peep'];
const folders = allFolders(names, ['empty']);

test('every folder is known, with those above it', () => {
  assert.deepEqual(folders, ['empty', 'lib', 'lib/deep', 'tools']);
  assert.deepEqual(allFolders([], ['a/b/c']), ['a', 'a/b', 'a/b/c']);
});

test('a folder takes everything in it along', () => {
  const moved = plannedMoves(names, folders, [['lib', 'empty/lib']]);
  assert.deepEqual(Object.fromEntries(moved), {
    lib: 'empty/lib',
    'lib/deep': 'empty/lib/deep',
    'lib/deep/more.peep': 'empty/lib/deep/more.peep',
    'lib/math.peep': 'empty/lib/math.peep',
  });
});

test('a move onto what exists is refused whole, so no text is lost', () => {
  assert.match(
    plannedMoves(names, folders, [
      ['lib/math.peep', 'math.peep'],
      ['tools/other.peep', 'other.peep'],
    ]),
    /other.peep already exists/,
  );
});

test('two moves cannot land on the same path', () => {
  assert.match(
    plannedMoves(names, folders, [
      ['other.peep', 'empty/other.peep'],
      ['tools/other.peep', 'empty/other.peep'],
    ]),
    /already exists/,
  );
});

test('a folder cannot go inside itself', () => {
  assert.match(plannedMoves(names, folders, [['lib', 'lib/deep/lib']]), /inside itself/);
});

test('main stays, but a move that changes nothing is not an error', () => {
  assert.match(plannedMoves(names, folders, [[MAIN, 'lib/main.peep']]), /stays where it is/);
  assert.equal(plannedMoves(names, folders, [[MAIN, MAIN]]).size, 0);
});

test('a name can be swapped away when what held it moves too', () => {
  const moved = plannedMoves(names, folders, [
    ['other.peep', 'empty/other.peep'],
    ['tools/other.peep', 'other.peep'],
  ]);
  assert.equal(moved.get('tools/other.peep'), 'other.peep');
});

test('a file selected with its folder moves once, with the folder', () => {
  assert.deepEqual(topMost(['lib', 'lib/math.peep', 'other.peep']), ['lib', 'other.peep']);
  assert.deepEqual(topMost(['library', 'lib/math.peep']), ['library', 'lib/math.peep']);
});
