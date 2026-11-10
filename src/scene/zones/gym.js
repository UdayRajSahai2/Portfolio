import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, box, cyl, at } from '../build.js';

// GYM: the rack, the barbell, the bench and the dumbbells.
export function buildGym({ root, P, D }) {
  const g = new THREE.Group();
  const steel = mat(P.steel, { metalness: 0.5, roughness: 0.4 });
  const rubberFloor = at(box(2.6, 0.04, 4.6, P.rubber, { roughness: 1 }), -6.7, 0.02, 1.4);
  rubberFloor.receiveShadow = true;
  root.add(rubberFloor);

  // power rack: four uprights and a frame
  for (const x of [-7.75, -7.05]) for (const z of [0.0, 2.0]) g.add(at(box(0.1, 3.6, 0.1, steel), x, 1.8, z));
  for (const z of [0.0, 2.0]) g.add(at(box(0.8, 0.1, 0.1, steel), -7.4, 3.6, z));
  for (const x of [-7.75, -7.05]) g.add(at(box(0.1, 0.1, 2.1, steel), x, 3.6, 1.0));
  for (const z of [0.0, 2.0]) g.add(at(box(0.14, 0.08, 0.16, P.accent2), -6.96, 2.2, z));

  // barbell resting on the hooks
  const bar = new THREE.Group();
  const shaft = at(cyl(0.04, 0.04, 3.0, P.metal, 12, { metalness: 0.8, roughness: 0.25 }), 0, 0, 0);
  shaft.rotation.x = Math.PI / 2;
  bar.add(shaft);
  for (const s of [-1, 1]) {
    for (const [r, off, c] of [[0.5, 0, P.accent3], [0.38, 0.12, P.accent2]]) {
      const plate = at(cyl(r, r, 0.1, c, 32, { roughness: 0.6 }), 0, 0, s * (1.2 + off));
      plate.rotation.x = Math.PI / 2;
      bar.add(plate);
    }
  }
  at(bar, -6.9, 2.3, 1.0);
  g.add(bar);

  // flat bench under the bar
  const bench = new THREE.Group();
  bench.add(at(box(1.7, 0.14, 0.5, P.fabric), 0, 0.62, 0));
  for (const x of [-0.65, 0.65]) bench.add(at(box(0.08, 0.55, 0.4, steel), x, 0.28, 0));
  at(bench, -6.2, 0, 1.0);
  g.add(bench);

  // dumbbell rack
  const db = new THREE.Group();
  db.add(at(box(0.6, 0.06, 1.4, steel), 0, 0.85, 0), at(box(0.6, 0.06, 1.4, steel), 0, 0.45, 0));
  for (const z of [-0.65, 0.65]) db.add(at(box(0.06, 0.9, 0.06, steel), 0.25, 0.45, z), at(box(0.06, 0.9, 0.06, steel), -0.25, 0.45, z));
  [0.92, 0.52].forEach((y, row) => {
    for (let k = 0; k < 3; k++) {
      const d = new THREE.Group();
      const hnd = at(cyl(0.025, 0.025, 0.36, P.metal, 8), 0, 0, 0);
      hnd.rotation.z = Math.PI / 2;
      d.add(hnd);
      const r = 0.07 + row * 0.02 + k * 0.012;
      for (const s of [-1, 1]) {
        const end = at(cyl(r, r, 0.1, P.rubber, 6), s * 0.16, 0, 0);
        end.rotation.z = Math.PI / 2;
        d.add(end);
      }
      at(d, 0, y + r, -0.45 + k * 0.45);
      db.add(d);
    }
  });
  at(db, -7.55, 0, 3.4);
  g.add(db);
  root.add(g);

  const rack = bar.position.clone();
  const hands = new THREE.Vector3();
  let lastPress = 0;
  return {
    group: g,
    stand: { x: -4.4, z: 2.2, look: [-7, 1.0] },
    view: { pos: [-2.4, 3.4, 4.2], target: [-6.0, 1.2, 1.0] },
    activity: {
      seat: { x: -4.5, z: 1.0, yaw: Math.PI / 2, y: 0.94 },
      pose: 'bench',
      // every frame while he lies on the bench: press, and the bar follows his hands
      update(me, dt, t) {
        const press = D < 1 ? 1 : (Math.sin(t * 2.6) + 1) / 2;
        me.press = press;
        me.handsCenter(hands);
        const k = Math.min(1, dt * 12);
        bar.position.x += (hands.x - bar.position.x) * k;
        bar.position.y += (hands.y - bar.position.y) * k;
        if (press > 0.97 && lastPress <= 0.97) sound.knock();
        lastPress = press;
      },
      release() {
        gsap.to(bar.position, { x: rack.x, y: rack.y, z: rack.z, duration: 0.5 * D, ease: 'power2.inOut' });
      },
    },
    interact() {
      sound.knock();
    },
  };
}
