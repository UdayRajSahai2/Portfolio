import * as THREE from 'three';
import { sound } from '../../sound.js';
import { mat, box, at } from '../build.js';
import { makeScreen } from '../screens/monitor.js';

// CODE: the monitor typing real code and a keyboard whose keys dip as he types.
export function buildCode({ root, P, rand, tickers, monitorFiles, languages }) {
  const g = new THREE.Group();
  const screen = makeScreen(monitorFiles, languages);
  g.add(at(box(0.5, 0.04, 0.35, P.screen), 0, 1.58, -4.5));
  g.add(at(box(0.08, 0.55, 0.06, P.screen), 0, 1.85, -4.6));
  g.add(at(box(1.64, 1.02, 0.08, P.screen, { roughness: 0.5 }), 0, 2.32, -4.55));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  scr.userData.noGlow = true;
  at(scr, 0, 2.33, -4.495); // 1.5 cm off the bezel, so the two never flicker
  g.add(scr);
  g.add(at(box(1.1, 0.05, 0.36, P.steel), 0, 1.585, -3.5));
  const KEYS = 56;
  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), mat(P.paper), KEYS);
  const m4 = new THREE.Matrix4();
  const keyAt = (i, down) => keys.setMatrixAt(i, m4.makeTranslation(-0.49 + (i % 14) * 0.075, down ? 1.607 : 1.62, -3.62 + Math.floor(i / 14) * 0.08));
  for (let i = 0; i < KEYS; i++) keyAt(i, false);
  g.add(keys);
  g.add(at(box(0.12, 0.04, 0.2, P.paper), 0.75, 1.58, -3.5));
  // each key stays down for a moment after it is hit
  const downFor = new Float32Array(KEYS);
  let typed = 0;
  const hitKey = () => {
    if (typed++ % 2) return;
    // left hand on the left half, right hand on the right, alternating
    const half = typed % 4 === 0 ? 0 : 7;
    const i = Math.floor(rand() * 4) * 14 + half + Math.floor(rand() * 7);
    downFor[i] = 0.09;
    keyAt(i, true);
    keys.instanceMatrix.needsUpdate = true;
  };
  tickers.push((dt) => {
    let changed = false;
    for (let i = 0; i < KEYS; i++) {
      if (downFor[i] <= 0) continue;
      downFor[i] -= dt;
      if (downFor[i] <= 0) {
        keyAt(i, false);
        changed = true;
      }
    }
    if (changed) keys.instanceMatrix.needsUpdate = true;
  });
  root.add(g);
  tickers.push((dt) => screen.tick(dt));

  return {
    group: g,
    stand: { x: -1.2, z: -2.55, look: [-0.2, -4.4] },
    // over his right shoulder and close, so the code on the screen can be read
    view: { pos: [0.75, 3.1, -2.4], target: [0, 2.3, -4.5] },
    activity: { seat: { x: 0, z: -2.88, yaw: Math.PI, y: 0.01 }, pose: 'type' },
    onFocus() {
      screen.restart();
      screen.active = true;
      screen.onChar = () => {
        sound.key();
        hitKey();
      };
    },
    onBlur() {
      screen.onChar = null;
      screen.active = false;
    },
    interact(obj) {
      if (obj === scr) {
        screen.next();
        sound.toggle();
      }
    },
  };
}
