import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sweepTurn } from '../../lib/easing.ts';
import { glyphsOf, matchGlyphs } from './glyphs.ts';

const token = (content) => ({ content, light: 'black', dark: 'white' });
const row = (text, group, index = 0) =>
  glyphsOf([token(text)], { group, row: index, previous: index, next: index });
const text = (glyphs) => glyphs.map(({ char }) => char).join('');

test('spaces take a column but no glyph', () => {
  const glyphs = row('a  b', 1);
  assert.equal(text(glyphs), 'ab');
  assert.deepEqual(
    glyphs.map(({ column }) => column),
    [0, 3],
  );
});

test('columns count on across the tokens of a row', () => {
  const glyphs = glyphsOf([token('ab'), token('c')], { group: 1, row: 0, previous: 0, next: 0 });
  assert.equal(glyphs[2].column, 2);
});

test('a pair knows each other from both sides', () => {
  const from = row('xay', 1);
  const to = row('bbab', 1, 4);
  matchGlyphs(from, to);
  assert.deepEqual(from[1].next, { row: 4, column: 2, matched: true });
  assert.deepEqual(to[2].previous, { row: 0, column: 1, matched: true });
});

test('all shared characters that keep their order pair, and none cross', () => {
  const from = row('abcd', 1);
  const to = row('xbxdxa', 1);
  matchGlyphs(from, to);
  const flown = from.filter(({ next }) => next.matched);
  assert.equal(text(flown), 'bd', 'the longest run in order, not the first letters found');
  const columns = flown.map(({ next }) => next.column);
  assert.deepEqual(
    columns,
    [...columns].sort((a, b) => a - b),
  );
});

test('a character without a partner stays in its column and goes with its row', () => {
  const from = glyphsOf([token('zq')], { group: 1, row: 2, previous: 0, next: 7 });
  matchGlyphs(from, row('z', 1));
  assert.deepEqual(from[1].next, { row: 7, column: 1, matched: false });
});

test('characters pair only inside their group', () => {
  const from = row('a', 1);
  const to = row('a', 2);
  matchGlyphs(from, to);
  assert.equal(from[0].next.matched, false);
  assert.equal(to[0].previous.matched, false);
});

test('a sweep starts the first item at once and ends every item at 1', () => {
  assert.equal(sweepTurn(0, 0), 0);
  assert.equal(sweepTurn(1, 0), 1);
  assert.equal(sweepTurn(1, 1), 1);
  assert.equal(sweepTurn(0.1, 1), 0, 'the last item waits for its turn');
  assert.ok(sweepTurn(0.5, 0) > sweepTurn(0.5, 1), 'the change sweeps down');
});
