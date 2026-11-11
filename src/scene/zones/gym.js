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
  // a matched pair in each slot, one on each shelf, lightest first
  const slots = [0.92, 0.52].map((y) =>
    [0, 1, 2].map((k) => {
      const d = new THREE.Group();
      const hnd = at(cyl(0.025, 0.025, 0.36, P.metal, 8), 0, 0, 0);
      hnd.rotation.z = Math.PI / 2;
      d.add(hnd);
      const r = 0.075 + k * 0.015;
      for (const s of [-1, 1]) {
        const end = at(cyl(r, r, 0.1, P.rubber, 6), s * 0.16, 0, 0);
        end.rotation.z = Math.PI / 2;
        d.add(end);
      }
      at(d, 0, y + r, -0.45 + k * 0.45);
      d.userData.home = d.position.clone();
      db.add(d);
      return d;
    }),
  );
  at(db, -7.55, 0, 3.4);
  g.add(db);
  root.add(g);

  const rack = bar.position.clone();
  const hands = new THREE.Vector3();
  let lastPress = 0;

  // biceps curls: he takes the middle pair and curls them standing on the mat
  const pair = [slots[0][1], slots[1][1]];
  const handAt = new THREE.Vector3();
  const handTurn = new THREE.Quaternion();
  const shelfTurn = new THREE.Quaternion();
  const upright = new THREE.Quaternion();
  const putBack = []; // the tweens carrying the pair home
  let holding = false;
  let mode = 'bench'; // 'bench' | 'curl'; every visit starts with the press (ACT-04)
  const within = (obj, group) => {
    for (let o = obj; o; o = o.parent) if (o === group) return true;
    return false;
  };

  // lie on the bench and press; the bar follows his hands
  function pressBar(me, dt, t) {
    const press = D < 1 ? 1 : (Math.sin(t * 2.6) + 1) / 2;
    me.press = press;
    me.handsCenter(hands);
    const k = Math.min(1, dt * 12);
    bar.position.x += (hands.x - bar.position.x) * k;
    bar.position.y += (hands.y - bar.position.y) * k;
    if (press > 0.97 && lastPress <= 0.97) sound.knock();
    lastPress = press;
  }

  // alternate arms: one curls up and down while the other hangs; each dumbbell rides its hand
  function curlPair(me, dt, t) {
    if (!holding) {
      holding = true;
      putBack.splice(0).forEach((tw) => tw.kill());
    }
    const s = Math.sin(t * 2.4);
    if (D < 1) me.curl(0, 1);
    else me.curl(Math.max(0, s) ** 1.5, Math.max(0, -s) ** 1.5);
    const k = Math.min(1, dt * 12);
    pair.forEach((d, i) => {
      me.handPose(i, handAt, handTurn);
      d.position.lerp(db.worldToLocal(handAt), k);
      d.quaternion.slerp(db.getWorldQuaternion(shelfTurn).invert().multiply(handTurn), k);
    });
  }

  return {
    group: g,
    extra: [rubberFloor], // the mat is the gym too: a tap on it opens it
    stand: { x: -4.4, z: 2.2, look: [-7, 1.0] },
    view: { pos: [-2.4, 3.4, 4.2], target: [-6.1, 1.3, 1.6] },
    activity: {
      get seat() {
        return mode === 'curl' ? { x: -6.2, z: 2.8, yaw: 1.9, y: 0 } : { x: -4.5, z: 1.0, yaw: Math.PI / 2, y: 0.94 };
      },
      get pose() {
        return mode;
      },
      update(me, dt, t) {
        if (mode === 'curl') curlPair(me, dt, t);
        else pressBar(me, dt, t);
      },
      // the bar back on its hooks, the pair back in its slot
      release() {
        gsap.to(bar.position, { x: rack.x, y: rack.y, z: rack.z, duration: 0.5 * D, ease: 'power2.inOut' });
        if (!holding) return;
        holding = false;
        for (const d of pair) {
          const from = d.quaternion.clone();
          const turn = { k: 0 };
          const { x, y, z } = d.userData.home;
          putBack.push(
            gsap.to(d.position, { x, y, z, duration: 0.5 * D, ease: 'power2.inOut' }),
            gsap.to(turn, { k: 1, duration: 0.5 * D, onUpdate: () => d.quaternion.slerpQuaternions(from, upright, turn.k) }),
          );
        }
      },
    },
    onBlur() {
      mode = 'bench';
    },
    // the dumbbells switch him to curls; the bench or the bar back to the press (ACT-09)
    interact(obj, { again }) {
      const want = within(obj, db) ? 'curl' : within(obj, bar) || within(obj, bench) ? 'bench' : null;
      if (!want || want === mode) return sound.knock();
      mode = want;
      again();
    },
  };
}
