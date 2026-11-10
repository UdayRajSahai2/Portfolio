import test from 'node:test';
import assert from 'node:assert/strict';
import { raDecToVec, CONSTELLATIONS, POLARIS } from '../src/scene/sky.js';

test('star positions are unit vectors', () => {
  for (const c of CONSTELLATIONS)
    for (const [, ra, dec] of c.stars) {
      const v = raDecToVec(ra, dec);
      assert.ok(Math.abs(Math.hypot(v.x, v.y, v.z) - 1) < 1e-9);
    }
});

test('Polaris sits almost exactly at the north pole', () => {
  assert.ok(raDecToVec(POLARIS[1], POLARIS[2]).y > 0.999);
});

test('every constellation line joins two of its own stars', () => {
  for (const c of CONSTELLATIONS)
    for (const [a, b] of c.lines) assert.ok(c.stars[a] && c.stars[b], `${c.name} ${a}-${b}`);
});
