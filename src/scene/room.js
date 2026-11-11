import * as THREE from 'three';
import { roomPalette } from './palette.js';
import { mat, at, mulberry32 } from './build.js';
import { X0, X1, ZB, ZF } from './layout.js';
import { plant } from './props.js';
import { buildShell } from './shell.js';
import { buildEntrance } from './zones/entrance.js';
import { buildDesk } from './zones/desk.js';
import { buildCode } from './zones/code.js';
import { buildLamp } from './zones/lamp.js';
import { buildContact } from './zones/contact.js';
import { buildBooks } from './zones/books.js';
import { buildStars } from './zones/stars.js';
import { buildScreen } from './zones/screen.js';
import { buildGym } from './zones/gym.js';
import { buildChess } from './zones/chess.js';

// The whole room is built from primitives, so there are no model files to load.
// Each zone lives in scene/zones/ and returns its hotspot (see the contract in
// docs/SOFTWARE_ARCHITECT.md); this file assembles them and owns the floor plan.
export function buildRoom(scene, { monitorFiles, languages = [], labels = {}, channels = [], game = {}, reading = null, shelf = [], font = 'sans-serif', reduceMotion = false }) {
  const P = roomPalette();
  const rand = mulberry32(11);
  const tickers = [];
  const timeOfDay = []; // (night, duration) => {}: what changes between day and night
  const root = new THREE.Group();
  scene.add(root);
  const D = reduceMotion ? 0.01 : 1; // animation duration scale
  const ctx = { root, P, rand, tickers, timeOfDay, D, font, labels, channels, game, reading, shelf, monitorFiles, languages };

  const { faceWalls } = buildShell(scene, ctx);
  const { entrance, porchPlant } = buildEntrance(ctx);
  buildDesk(ctx);
  const lamp = buildLamp(ctx);
  // order matters: zones draw from the shared random sequence
  const hotspots = {};
  hotspots.code = buildCode(ctx);
  hotspots.contact = buildContact(ctx);
  hotspots.books = buildBooks(ctx);
  hotspots.stars = buildStars(ctx);
  hotspots.screen = buildScreen(ctx);
  hotspots.gym = buildGym(ctx);
  hotspots.chess = buildChess(ctx);

  // ── rug and plants ────────────────────────────────────────
  // the rug lies almost on the floor; the polygon offset keeps the depth test
  // from flickering between them as the camera moves (worst on mobile GPUs)
  const onFloor = (units) => ({ roughness: 1, polygonOffset: true, polygonOffsetFactor: units, polygonOffsetUnits: units });
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), mat(P.rug, onFloor(-2)));
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  at(rug, -0.6, 0.012, 0.6);
  const rugRing = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.05, 48), mat(P.rugEdge, onFloor(-4)));
  rugRing.rotation.x = -Math.PI / 2;
  at(rugRing, -0.6, 0.02, 0.6);
  root.add(rug, rugRing);
  rug.userData.floor = rugRing.userData.floor = true;

  const swaying = [porchPlant];
  for (const [x, z, s] of [[7.2, -4.3, 1.1], [-7.35, -4.4, 0.9]]) {
    const p = plant(P, rand, s);
    at(p.group, x, 0, z);
    root.add(p.group);
    swaying.push(p);
  }
  if (!reduceMotion) {
    tickers.push((dt, t) => swaying.forEach((p) => p.leaves.forEach((l, i) => (l.rotation.x = l.userData.tilt + Math.sin(t * 0.9 + i * 1.7) * 0.03))));
  }

  // footprints the character has to walk around (world x/z)
  const obstacles = {
    rects: [
      { x0: -2.05, x1: 2.05, z0: ZB, z1: -3.3 }, // desk
      { x0: -6.9, x1: -4.3, z0: ZB, z1: -4.35 }, // bookshelf
      { x0: X0, x1: -6.8, z0: -0.15, z1: 2.15 }, // rack
      { x0: -7.1, x1: -5.3, z0: 0.72, z1: 1.28 }, // bench
      { x0: X0, x1: -7.2, z0: 2.65, z1: 4.15 }, // dumbbells
      { x0: X1 - 0.8, x1: X1, z0: -2.05, z1: 0.85 }, // TV console
      { x0: 3.9, x1: 5.1, z0: -2.1, z1: 0.9 }, // sofa
    ],
    circles: [
      { x: -3.7, z: -3.3, r: 0.8 }, // reading chair
      { x: -2.4, z: -3.9, r: 0.4 }, // side table
      { x: 0, z: -2.95, r: 0.45 }, // desk chair
      { x: 3.0, z: -3.3, r: 0.5 }, // telescope
      { x: 3.6, z: 2.6, r: 0.95 }, // chess table
      { x: 3.6, z: 1.15, r: 0.33 }, // stools
      { x: 3.6, z: 4.05, r: 0.33 },
      { x: 7.2, z: -4.3, r: 0.45 }, // plants
      { x: -7.35, z: -4.4, r: 0.4 },
    ],
  };

  return {
    root,
    obstacles,
    bounds: [X0 + 0.35, X1 - 0.35, ZB + 0.35, ZF - 0.3],
    hotspots,
    lamp,
    entrance,
    faceWalls,
    // ROOM-07: day or night, eased over a second, or at once
    setNight(night, animate = true) {
      const duration = animate ? 1.2 * D : 0;
      for (const f of timeOfDay) f(night, duration);
    },
    tick(dt, t) {
      for (const f of tickers) f(dt, t);
    },
  };
}
