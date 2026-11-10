// Chess move rules for the game against the character (spec CHESS-03).
// Pure: no three.js, no DOM. A position is a plain object { square: { c, t } }
// with c = 'w' | 'b' and t = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'.
// Not supported, on purpose: castling and en passant.

const FILES = 'abcdefgh';
export const VALUE = { P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 };

const sq = (f, r) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? FILES[f] + (r + 1) : null);
const fileOf = (s) => FILES.indexOf(s[0]);
const rankOf = (s) => Number(s[1]) - 1;
export const other = (c) => (c === 'w' ? 'b' : 'w');

// 'Ra1 Nb1 Pa2' for each side into a position
export function parse({ w, b }) {
  const pos = {};
  for (const [c, list] of [['w', w], ['b', b]]) for (const tok of list.split(' ')) pos[tok.slice(1)] = { c, t: tok[0] };
  return pos;
}

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

// Squares a piece could move to, ignoring whether its own king is left in check.
function pseudoMoves(pos, from) {
  const p = pos[from];
  if (!p) return [];
  const f = fileOf(from);
  const r = rankOf(from);
  const out = [];
  const empty = (s) => s && !pos[s];
  const enemy = (s) => s && pos[s] && pos[s].c !== p.c;
  const steps = (dirs) => {
    for (const [df, dr] of dirs) {
      const s = sq(f + df, r + dr);
      if (empty(s) || enemy(s)) out.push(s);
    }
  };
  const slide = (dirs) => {
    for (const [df, dr] of dirs) {
      for (let k = 1; k < 8; k++) {
        const s = sq(f + df * k, r + dr * k);
        if (!s) break;
        if (empty(s)) out.push(s);
        else {
          if (enemy(s)) out.push(s);
          break;
        }
      }
    }
  };
  switch (p.t) {
    case 'P': {
      const dir = p.c === 'w' ? 1 : -1;
      const one = sq(f, r + dir);
      if (empty(one)) {
        out.push(one);
        const start = p.c === 'w' ? 1 : 6;
        const two = sq(f, r + 2 * dir);
        if (r === start && empty(two)) out.push(two);
      }
      for (const df of [-1, 1]) {
        const s = sq(f + df, r + dir);
        if (enemy(s)) out.push(s);
      }
      break;
    }
    case 'N':
      steps(KNIGHT);
      break;
    case 'K':
      steps(KING);
      break;
    case 'R':
      slide(ROOK);
      break;
    case 'B':
      slide(BISHOP);
      break;
    case 'Q':
      slide([...ROOK, ...BISHOP]);
      break;
  }
  return out;
}

// The position after a move; a pawn reaching the last rank becomes a queen.
export function apply(pos, from, to) {
  const next = { ...pos };
  const p = next[from];
  delete next[from];
  const last = p.c === 'w' ? 7 : 0;
  next[to] = p.t === 'P' && rankOf(to) === last ? { c: p.c, t: 'Q' } : p;
  return next;
}

export function inCheck(pos, c) {
  const king = Object.keys(pos).find((s) => pos[s].c === c && pos[s].t === 'K');
  if (!king) return true;
  return Object.keys(pos).some((s) => pos[s].c !== c && pseudoMoves(pos, s).includes(king));
}

// Legal targets for the piece on `from`: its own king is never left in check.
export function movesFrom(pos, from) {
  const p = pos[from];
  if (!p) return [];
  return pseudoMoves(pos, from).filter((to) => !inCheck(apply(pos, from, to), p.c));
}

export function allMoves(pos, c) {
  const out = [];
  for (const from of Object.keys(pos)) if (pos[from].c === c) for (const to of movesFrom(pos, from)) out.push({ from, to });
  return out;
}

// 'checkmate' | 'stalemate' | null, for the side to move
export function outcome(pos, toMove) {
  if (allMoves(pos, toMove).length) return null;
  return inCheck(pos, toMove) ? 'checkmate' : 'stalemate';
}

// The character's reply: greedy, with some variety. Captures score by value,
// checks are a bonus, and a move that drops the moved piece to a cheaper
// attacker is penalised. `random` is injectable so tests are deterministic.
export function chooseMove(pos, c, random = Math.random) {
  const moves = allMoves(pos, c);
  if (!moves.length) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    const mover = pos[m.from];
    const taken = pos[m.to];
    const next = apply(pos, m.from, m.to);
    let score = taken ? VALUE[taken.t] * 10 : 0;
    if (inCheck(next, other(c))) score += outcome(next, other(c)) === 'checkmate' ? 1000 : 4;
    const attacked = allMoves(next, other(c)).some((r) => r.to === m.to);
    if (attacked) score -= VALUE[mover.t] * 8;
    score += random() * 3;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
