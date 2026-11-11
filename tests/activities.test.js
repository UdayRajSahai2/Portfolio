import test from 'node:test';
import assert from 'node:assert/strict';
import { createActivities } from '../src/world/activities.js';

// a stand-in for the character that records what it was asked to do
function fakeMe() {
  const log = [];
  let arrive = null;
  return {
    log,
    arrive: () => arrive?.(),
    followPath(points, cb) {
      log.push(['walk', points.at(-1)]);
      arrive = cb;
    },
    turnTo: (y) => log.push(['turn', y]),
    setPose: (p) => log.push(['pose', p]),
    hold: (item) => log.push(['hold', item]),
  };
}

const zone = (extra = {}) => ({
  stand: { x: 1, z: 1 },
  activity: { seat: { x: 2, z: 3, yaw: 0.5, y: 0.1 }, pose: 'sit', ...extra },
});

test('walks to the seat, then takes the pose (ACT-01)', () => {
  const me = fakeMe();
  const a = createActivities({ hotspots: { code: zone() }, me });
  a.start('code', () => true);
  assert.deepEqual(me.log[0], ['walk', { x: 2, z: 3 }]);
  assert.equal(a.current, null, 'not settled until he arrives');
  me.arrive();
  assert.ok(me.log.some(([k, v]) => k === 'pose' && v === 'sit'));
  assert.equal(a.current, 'code');
});

test('a walk the visitor has moved on from never sits him down', () => {
  const me = fakeMe();
  const a = createActivities({ hotspots: { code: zone() }, me });
  let wanted = true;
  a.start('code', () => wanted);
  wanted = false;
  me.arrive();
  assert.equal(a.current, null);
  assert.ok(!me.log.some(([k, v]) => k === 'pose' && v === 'sit'));
});

test('stop puts things back and walks him off the seat (ACT-07)', () => {
  const me = fakeMe();
  let released = 0;
  const a = createActivities({ hotspots: { books: zone({ hold: 'book', release: () => released++ }) }, me });
  a.start('books', () => true);
  me.arrive();
  a.stop();
  assert.equal(released, 1);
  assert.equal(a.current, null);
  assert.deepEqual(me.log.at(-1), ['walk', { x: 1, z: 1 }]);
  assert.ok(me.log.some(([k, v]) => k === 'hold' && v === null));
});

test('leaving before he settles still puts the prop back', () => {
  const me = fakeMe();
  let released = 0;
  const a = createActivities({ hotspots: { books: zone({ release: () => released++ }) }, me });
  a.start('books', () => true);
  a.leave('books');
  assert.equal(released, 1);
});

test('update runs only the settled zone, every frame', () => {
  const me = fakeMe();
  const calls = [];
  const a = createActivities({ hotspots: { gym: zone({ update: (m, dt) => calls.push(dt) }) }, me });
  a.update(0.016, 1);
  assert.equal(calls.length, 0);
  a.start('gym', () => true);
  me.arrive();
  a.update(0.016, 1);
  assert.deepEqual(calls, [0.016]);
});

test('he picks up the prop with what it shows (ACT-08)', () => {
  const me = fakeMe();
  const book = { title: 'The Alchemist', by: 'Paulo Coelho' };
  const a = createActivities({ hotspots: { books: zone({ hold: 'book', held: book }) }, me });
  const holds = [];
  me.hold = (item, detail) => holds.push([item, detail]);
  a.start('books', () => true);
  me.arrive();
  assert.deepEqual(holds.at(-1), ['book', book]);
});

test('again puts the prop back, steps to the stand point, then sits him down afresh (ACT-08)', () => {
  const me = fakeMe();
  let released = 0;
  let seated = 0;
  const a = createActivities({ hotspots: { books: zone({ hold: 'book', release: () => released++ }) }, me });
  a.start('books', () => true);
  me.arrive();
  a.again('books', () => true, () => seated++);
  assert.equal(released, 1);
  assert.equal(a.current, null);
  assert.deepEqual(me.log.at(-1), ['walk', { x: 1, z: 1 }], 'back to the shelf first');
  me.arrive(); // at the shelf: off to the seat
  assert.deepEqual(me.log.at(-1), ['walk', { x: 2, z: 3 }]);
  assert.equal(seated, 0);
  me.arrive(); // seated
  assert.equal(seated, 1);
  assert.equal(a.current, 'books');
});

test('again does nothing more once the visitor has moved on', () => {
  const me = fakeMe();
  let wanted = true;
  const a = createActivities({ hotspots: { books: zone() }, me });
  a.again('books', () => wanted);
  wanted = false;
  me.arrive();
  assert.equal(me.log.filter(([k]) => k === 'walk').length, 1, 'no walk to the seat');
});
