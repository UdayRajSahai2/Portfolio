import * as THREE from 'three';
import { X1, H } from '../scene/layout.js';
import { SHEET_QUERY } from '../ui/media.js';

// Where the camera stands, worked out from the window size. Pure functions:
// they read the viewport and the panel, and return positions.

export const FOV = 40;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const aspect = () => window.innerWidth / window.innerHeight;

// Outside the door: wide enough to hold the door and the character.
export function introView(doorZ) {
  const d = THREE.MathUtils.clamp(3.4 / (TAN * aspect()), 9.5, 24);
  return {
    pos: new THREE.Vector3(1.3, 3.1, doorZ + 0.6 + d),
    target: new THREE.Vector3(1.3, 2.3, doorZ + 0.6),
  };
}

// Inside: far enough back that the front edge of the room fills the width.
export function homeView() {
  const camZ = THREE.MathUtils.clamp(4.6 + 7.6 / (TAN * aspect()), 13, 20);
  const camY = 8 + (camZ - 16) * 0.4;
  return { pos: new THREE.Vector3(0, camY, camZ), target: new THREE.Vector3(0, 1.4, -0.6) };
}

// On the intro, the scene moves aside for the text: right on wide screens and on phones
// held sideways (short landscape), up on narrow ones. Matches the media queries in intro.css.
export function introShift() {
  const wide = aspect() > 1.1 && (window.innerWidth >= 900 || window.innerHeight <= 500);
  return wide ? { x: -window.innerWidth * 0.17, y: 0 } : { x: 0, y: window.innerHeight * 0.17 };
}

// With a panel open, the scene centres in the space the panel leaves.
export function panelShift(rect) {
  if (!rect) return { x: 0, y: 0 };
  return rect.sheet ? { x: 0, y: rect.height / 2 } : { x: rect.width / 2, y: 0 };
}

// How much further back a close-up must sit so the same things fit in the part
// of the screen the panel leaves free. Close-ups were framed for a view about as
// wide as it is tall (a desktop with the side panel open).
export function fitFactor() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const sheet = window.matchMedia(SHEET_QUERY).matches;
  const panel = document.getElementById('panel');
  const vw = sheet ? w : Math.max(200, w - panel.offsetWidth);
  const vh = sheet ? Math.max(160, h - panel.offsetHeight) : h;
  return THREE.MathUtils.clamp(Math.max(h / vh, (0.94 * h) / vw), 1, 3.2);
}

// Keep a pulled-back camera inside the walls (the front is open).
export const clampToRoom = (p) => p.set(THREE.MathUtils.clamp(p.x, -(X1 - 0.6), X1 - 0.6), Math.min(p.y, H - 0.4), Math.min(p.z, 16));
