import * as THREE from 'three';
import { cyl, sphere, box, at } from '../build.js';

// The chess set, built from primitives, and where each square sits on the board.

export const SQ = 0.18; // one square, in world units
export const PIECE_Y = 1.1; // the board's surface, in the table's local space
const EDGE = 0.63; // centre of the a-file and of the first rank
// how tall each piece stands, so a hand can close over its top
export const HEIGHT = { P: 0.18, R: 0.205, N: 0.21, B: 0.27, Q: 0.27, K: 0.33 };

// board-local position of a square; white's first rank faces +z (the visitor)
export function squarePos(square) {
  const f = square.charCodeAt(0) - 97;
  const r = Number(square[1]) - 1;
  return { x: -EDGE + f * SQ, z: EDGE - r * SQ };
}

// the square under a board-local point, or null off the board
export function squareAt(local) {
  const f = Math.round((local.x + EDGE) / SQ);
  const r = Math.round((EDGE - local.z) / SQ);
  return f >= 0 && f < 8 && r >= 0 && r < 8 ? 'abcdefgh'[f] + (r + 1) : null;
}

// one piece: t = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
export function piece(t, white, P) {
  const c = white ? P.paper : P.ink;
  const o = { roughness: white ? 0.45 : 0.35 };
  const g = new THREE.Group();
  g.add(at(cyl(0.055, 0.065, 0.03, c, 20, o), 0, 0.015, 0));
  const dir = white ? -1 : 1; // knights face the other side
  switch (t) {
    case 'P':
      g.add(at(cyl(0.022, 0.042, 0.08, c, 16, o), 0, 0.07, 0));
      g.add(at(cyl(0.036, 0.036, 0.012, c, 16, o), 0, 0.112, 0));
      g.add(at(sphere(0.034, c, o), 0, 0.145, 0));
      break;
    case 'R':
      g.add(at(cyl(0.04, 0.048, 0.13, c, 16, o), 0, 0.095, 0));
      g.add(at(cyl(0.054, 0.05, 0.05, c, 16, o), 0, 0.18, 0));
      break;
    case 'N': {
      g.add(at(cyl(0.032, 0.05, 0.08, c, 16, o), 0, 0.07, 0));
      const head = at(box(0.045, 0.12, 0.07, c, o), 0, 0.155, 0);
      head.rotation.x = 0.35 * dir;
      g.add(head, at(box(0.04, 0.04, 0.08, c, o), 0, 0.19, 0.045 * dir));
      break;
    }
    case 'B': {
      g.add(at(cyl(0.022, 0.046, 0.14, c, 16, o), 0, 0.1, 0));
      const h = at(sphere(0.036, c, o), 0, 0.2, 0);
      h.scale.y = 1.35;
      g.add(h, at(sphere(0.012, c, o), 0, 0.258, 0));
      break;
    }
    case 'Q':
      g.add(at(cyl(0.026, 0.052, 0.17, c, 16, o), 0, 0.115, 0));
      g.add(at(cyl(0.054, 0.03, 0.045, c, 16, o), 0, 0.222, 0));
      g.add(at(sphere(0.02, c, o), 0, 0.262, 0));
      break;
    case 'K':
      g.add(at(cyl(0.028, 0.054, 0.19, c, 16, o), 0, 0.125, 0));
      g.add(at(cyl(0.05, 0.034, 0.045, c, 16, o), 0, 0.242, 0));
      g.add(at(box(0.016, 0.065, 0.016, c, o), 0, 0.295, 0));
      g.add(at(box(0.05, 0.016, 0.016, c, o), 0, 0.3, 0));
      break;
  }
  g.userData.piece = true;
  return g;
}
