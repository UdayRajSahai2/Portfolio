import test from 'node:test';
import assert from 'node:assert/strict';
import { createNav } from '../src/scene/nav.js';

const bounds = [-5, 5, -5, 5];

test('finds a straight path across an empty floor', () => {
  const nav = createNav({ bounds });
  const path = nav.find({ x: -3, z: 0 }, { x: 3, z: 0 });
  assert.ok(path.length >= 1);
  assert.deepEqual(path.at(-1), { x: 3, z: 0 });
});

test('walks around a blocking wall instead of through it', () => {
  const wall = { x0: -0.5, x1: 0.5, z0: -4, z1: 4 };
  const nav = createNav({ rects: [wall], bounds });
  const path = nav.find({ x: -3, z: 0 }, { x: 3, z: 0 });
  assert.ok(path, 'a path exists');
  // every corner of the path stays clear of the wall plus the walker's radius
  for (const p of path) assert.ok(nav.isFreeAt(p.x, p.z), `point ${p.x},${p.z} is free`);
  assert.ok(path.length >= 2, 'the path turns at least once');
});

test('a target inside furniture snaps to the nearest free floor', () => {
  const table = { x: 0, z: 0, r: 1 };
  const nav = createNav({ circles: [table], bounds });
  const path = nav.find({ x: -4, z: -4 }, { x: 0, z: 0 });
  const end = path.at(-1);
  assert.ok(nav.isFreeAt(end.x, end.z));
});

test('points outside the bounds are never free', () => {
  const nav = createNav({ bounds });
  assert.equal(nav.isFreeAt(6, 0), false);
  assert.equal(nav.isFreeAt(0, 0), true);
});
