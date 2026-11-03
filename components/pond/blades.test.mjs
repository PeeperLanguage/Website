import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bladePath, pointOn } from './blades.ts';

const blade = { x: 100, base: 500, height: 300, lean: 60, width: 10 };

test('a blade stands on its base, narrower than its widest part', () => {
  const path = bladePath(blade);
  assert.ok(path.startsWith('M96.5 500C'), path);
  assert.ok(path.endsWith(' 103.5 500Z'), path);
});

test('a blade comes to a point at its tip', () => {
  assert.ok(bladePath(blade).includes('160 200C'), bladePath(blade));
});

test('the points along a blade run from its foot to its tip', () => {
  const foot = pointOn(blade, 0);
  const tip = pointOn(blade, 1);
  assert.deepEqual([foot.x, foot.y], [100, 500]);
  assert.deepEqual([tip.x, tip.y], [160, 200]);
});

test('a blade tilts the way it leans, more toward its tip', () => {
  const low = pointOn(blade, 0.2).tilt;
  const high = pointOn(blade, 0.9).tilt;
  assert.ok(low > 0 && high > low, `${low} then ${high}`);
  const mirrored = pointOn({ ...blade, lean: -60 }, 0.9).tilt;
  assert.equal(mirrored, -high);
});

test('a drooping leaf ends below the top of its curve', () => {
  const leaf = { ...blade, droop: 60 };
  const top = Math.min(...[0.6, 0.7, 0.8, 0.9].map((along) => pointOn(leaf, along).y));
  assert.ok(pointOn(leaf, 1).y > top);
  assert.ok(
    pointOn(leaf, 0.95).tilt > pointOn(blade, 0.95).tilt,
    'its tip bends over more than a straight one',
  );
});
