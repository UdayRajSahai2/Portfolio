import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, movesFrom, allMoves, apply, inCheck, outcome, chooseMove } from '../src/scene/chess/rules.js';

const START = parse({
  w: 'Ra1 Nb1 Bc1 Qd1 Ke1 Bf1 Ng1 Rh1 Pa2 Pb2 Pc2 Pd2 Pe2 Pf2 Pg2 Ph2',
  b: 'Ra8 Nb8 Bc8 Qd8 Ke8 Bf8 Ng8 Rh8 Pa7 Pb7 Pc7 Pd7 Pe7 Pf7 Pg7 Ph7',
});
const sorted = (a) => [...a].sort();

test('the opening position has 20 moves for white (no castling)', () => {
  assert.equal(allMoves(START, 'w').length, 20);
});

test('a pawn moves one or two from its start, one after that', () => {
  assert.deepEqual(sorted(movesFrom(START, 'e2')), ['e3', 'e4']);
  const later = apply(START, 'e2', 'e4');
  assert.deepEqual(movesFrom(later, 'e4'), ['e5']);
});

test('a pawn captures diagonally and not straight ahead', () => {
  const pos = parse({ w: 'Ke1 Pe4', b: 'Ke8 Pe5 Pd5' });
  assert.deepEqual(movesFrom(pos, 'e4'), ['d5']);
});

test('a knight jumps; sliding pieces stop at the first piece in the way', () => {
  assert.deepEqual(sorted(movesFrom(START, 'g1')), ['f3', 'h3']);
  assert.deepEqual(movesFrom(START, 'a1'), []);
  const pos = parse({ w: 'Ke1 Ra1', b: 'Ke8 Pa5' });
  assert.ok(movesFrom(pos, 'a1').includes('a5'), 'captures the blocker');
  assert.ok(!movesFrom(pos, 'a1').includes('a6'), 'never passes it');
});

test('a pinned piece may not expose its king', () => {
  const pos = parse({ w: 'Ke1 Be2', b: 'Ke8 Re7' });
  assert.deepEqual(movesFrom(pos, 'e2'), []);
});

test('in check, only moves that answer the check are legal', () => {
  const pos = parse({ w: 'Ke1 Pa2', b: 'Ke8 Re7' });
  assert.ok(inCheck(pos, 'w'));
  assert.deepEqual(movesFrom(pos, 'a2'), []);
  for (const m of allMoves(pos, 'w')) assert.ok(!inCheck(apply(pos, m.from, m.to), 'w'));
});

test("fool's mate is checkmate; a boxed-in king with no check is stalemate", () => {
  let pos = START;
  for (const [f, t] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']]) pos = apply(pos, f, t);
  assert.equal(outcome(pos, 'w'), 'checkmate');
  const stale = parse({ w: 'Kf7 Qg6', b: 'Kh8' });
  assert.equal(outcome(stale, 'b'), 'stalemate');
});

test('a pawn on the last rank becomes a queen', () => {
  const pos = apply(parse({ w: 'Ke1 Pa7', b: 'Kh8' }), 'a7', 'a8');
  assert.deepEqual(pos.a8, { c: 'w', t: 'Q' });
});

test('the character takes a free queen, and finds mate in one', () => {
  const free = parse({ w: 'Ke1 Qd4', b: 'Kh8 Nb5' });
  assert.deepEqual(chooseMove(free, 'b', () => 0), { from: 'b5', to: 'd4' });
  const mate = parse({ w: 'Kh1 Ph2 Pg2', b: 'Kg8 Ra8' });
  assert.deepEqual(chooseMove(mate, 'b', () => 0.5), { from: 'a8', to: 'a1' });
});

test('with no legal move the character has nothing to play', () => {
  assert.equal(chooseMove(parse({ w: 'Kf7 Qg6', b: 'Kh8' }), 'b'), null);
});
