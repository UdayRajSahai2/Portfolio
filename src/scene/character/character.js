import * as THREE from 'three';
import { mat, part } from './parts.js';
import { buildHair } from './hair.js';
import { poseTargets } from './poses.js';
import { makeBook } from './book.js';

// A stylised, chunky character built from primitives.
// The `look` settings (in content.js) drive skin, hair, glasses and clothes.
// Local forward is +z. The feet stand at y = 0.
// Joints: hips and knees, shoulders and elbows, the head. A pose (poses.js)
// sets target angles, and the update loop eases every joint towards them.

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = (a, b, k) => a + (b - a) * k;

// colors: { paper, ink, muted, cover } for the book he reads, taken from the theme tokens
export function createCharacter(look, { reduceMotion = false, font = 'sans-serif', colors, book = { title: '', by: '' } } = {}) {
  const skin = mat(look.skin, { roughness: 0.6 });
  const hairMat = mat(look.hair, { roughness: 0.9, side: THREE.DoubleSide });
  const shirt = mat(look.shirt);
  const pants = mat(look.pants);
  const shoes = mat(look.shoes, { roughness: 0.5 });
  const dark = mat(look.eyes, { roughness: 0.3 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // legs: a hip, then a knee
  const knees = [];
  const legs = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.15 * s, 0.9, 0);
    p.add(part(new THREE.CapsuleGeometry(0.11, 0.22, 4, 12), pants, 0, -0.2, 0));
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    knee.add(part(new THREE.CapsuleGeometry(0.1, 0.2, 4, 12), pants, 0, -0.18, 0));
    knee.add(part(new THREE.BoxGeometry(0.21, 0.12, 0.33), shoes, 0, -0.41, 0.05));
    p.add(knee);
    knees.push(knee);
    body.add(p);
    return p;
  });

  // torso
  const torso = new THREE.Group();
  torso.position.y = 1.38;
  const chest = part(new THREE.CapsuleGeometry(0.32, 0.35, 6, 18), shirt);
  chest.scale.z = 0.78;
  torso.add(chest);
  if (look.shirtPrint) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = look.printColor || '#fff';
    ctx.font = `600 92px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(look.shirtPrint, 64, 70);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8 }));
    print.position.set(0, 0.04, 0.262);
    print.userData.noGlow = true;
    torso.add(print);
  }
  body.add(torso);
  body.add(part(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 12), skin, 0, 1.93, 0));

  // arms: a shoulder, then an elbow (index 0 = -x side, 1 = +x side; the +x arm waves)
  const elbows = [];
  const hands = [];
  const arms = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.4 * s, 1.75, 0);
    p.rotation.z = 0.1 * s;
    p.add(part(new THREE.CapsuleGeometry(0.085, 0.2, 4, 10), shirt, 0, -0.15, 0));
    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    elbow.add(part(new THREE.CapsuleGeometry(0.08, 0.16, 4, 10), shirt, 0, -0.12, 0));
    const hand = part(new THREE.SphereGeometry(0.1, 12, 10), skin, 0, -0.33, 0);
    elbow.add(hand);
    p.add(elbow);
    elbows.push(elbow);
    hands.push(hand);
    body.add(p);
    return p;
  });

  // things he can hold
  const remote = part(new THREE.BoxGeometry(0.07, 0.04, 0.24), dark, 0, -0.38, 0.08);
  remote.visible = false;
  elbows[1].add(remote);
  const heldBook = makeBook({
    font,
    book,
    colors, // paper, ink, muted, cover: from the theme tokens
  });
  heldBook.group.visible = false;
  body.add(heldBook.group);
  const handA = new THREE.Vector3();
  const handB = new THREE.Vector3();
  const eye = new THREE.Vector3();
  // the book rides between his hands, its face turned to his eyes
  function holdBookInHands() {
    body.updateMatrixWorld(true);
    body.worldToLocal(hands[0].getWorldPosition(handA));
    body.worldToLocal(hands[1].getWorldPosition(handB));
    const w = handA.distanceTo(handB);
    heldBook.group.scale.setScalar(THREE.MathUtils.clamp((w + 0.08) / 0.52, 0.7, 1.2));
    heldBook.group.position.copy(handA).add(handB).multiplyScalar(0.5);
    heldBook.group.position.y += 0.06;
    heldBook.group.lookAt(head.localToWorld(eye.set(0, -0.45, -0.6))); // pages to his face, cover to the room
  }

  // head
  const head = new THREE.Group();
  head.position.y = 2.38;
  const skull = part(new THREE.SphereGeometry(0.42, 32, 24), skin);
  skull.scale.set(1, 0.96, 0.98);
  head.add(skull);
  for (const s of [-1, 1]) {
    const ear = part(new THREE.SphereGeometry(0.09, 12, 10), skin, 0.41 * s, 0, 0);
    ear.scale.x = 0.6;
    head.add(ear);
  }
  const eyes = [-1, 1].map((s) => {
    const e = new THREE.Group();
    e.position.set(0.15 * s, 0.03, 0.375);
    const ball = part(new THREE.SphereGeometry(0.055, 14, 12), dark);
    ball.scale.z = 0.6;
    e.add(ball);
    e.add(part(new THREE.SphereGeometry(0.017, 8, 6), mat(look.eyeShine, { emissive: look.eyeShine, emissiveIntensity: 0.4 }), -0.015 * s + 0.012, 0.02, 0.03));
    head.add(e);
    return e;
  });
  for (const s of [-1, 1]) {
    const brow = part(new THREE.BoxGeometry(0.13, 0.028, 0.03), hairMat, 0.15 * s, 0.15, 0.385);
    brow.rotation.z = -0.08 * s;
    head.add(brow);
  }
  head.add(part(new THREE.SphereGeometry(0.045, 12, 10), skin, 0, -0.05, 0.415));
  const mouth = part(new THREE.TorusGeometry(0.07, 0.016, 6, 16, Math.PI), mat(look.mouth), 0, -0.15, 0.385);
  mouth.rotation.z = Math.PI;
  head.add(mouth);

  if (look.facialHair === 'stubble' || look.facialHair === 'beard') {
    const full = look.facialHair === 'beard';
    const beardMat = mat(look.hair, { roughness: 1, transparent: !full, opacity: full ? 1 : 0.45, side: THREE.DoubleSide });
    head.add(part(new THREE.SphereGeometry(full ? 0.45 : 0.425, 24, 16, Math.PI / 2 - 1.3, 2.6, full ? 1.75 : 1.9, 1.0), beardMat));
    if (full) head.add(part(new THREE.BoxGeometry(0.2, 0.04, 0.05), beardMat, 0, -0.105, 0.41));
  }

  if (look.glasses) {
    const frame = dark;
    for (const s of [-1, 1]) {
      head.add(part(new THREE.TorusGeometry(0.085, 0.013, 8, 24), frame, 0.15 * s, 0.03, 0.43));
      const arm = part(new THREE.BoxGeometry(0.012, 0.012, 0.3), frame, 0.24 * s, 0.05, 0.27);
      arm.rotation.y = 0.35 * s;
      head.add(arm);
    }
    head.add(part(new THREE.BoxGeometry(0.075, 0.012, 0.012), frame, 0, 0.05, 0.43));
  }

  buildHair(head, look, hairMat);
  body.add(head);

  // ── state ────────────────────────────────────────────────
  let path = [];
  let onArrive = null;
  let yaw = 0;
  let targetYaw = 0;
  let phase = 0;
  let walk = 0;
  let waveT = 0;
  let blinkT = 2;
  let poseName = 'stand';
  let target = poseTargets('stand');
  let seatY = 0;
  let press = 1;
  let flipT = 0;
  let clickT = 0;
  const speed = 4.4;
  // current joint values, eased towards `target`
  const cur = { bodyRX: 0, bodyY: 0, hip: 0, knee: 0, shoulder: [0, 0], shoulderZ: [-0.1, 0.1], elbow: [0, 0], head: 0 };

  const finish = () => {
    const cb = onArrive;
    onArrive = null;
    path = [];
    cb && cb();
  };

  return {
    group: root,
    get position() {
      return { x: root.position.x, z: root.position.z };
    },
    get moving() {
      return path.length > 0;
    },
    get pose() {
      return poseName;
    },
    place(x, z, facing = 0) {
      root.position.set(x, 0, z);
      yaw = targetYaw = facing;
      root.rotation.y = yaw;
    },
    followPath(points, cb) {
      this.setPose('stand');
      onArrive = cb || null;
      path = points.slice();
      if (reduceMotion && path.length) {
        const last = path[path.length - 1];
        const prev = path[path.length - 2] || this.position;
        targetYaw = Math.atan2(last.x - prev.x, last.z - prev.z);
        root.position.set(last.x, 0, last.z);
        finish();
      }
    },
    stop() {
      path = [];
      onArrive = null;
    },
    faceTowards(x, z) {
      targetYaw = Math.atan2(x - root.position.x, z - root.position.z);
    },
    turnTo(y) {
      targetYaw = y;
    },
    // 'stand' | 'sit' | 'type' | 'read' | 'remote' | 'play' | 'bench' | 'scope'; y lifts the body onto a seat
    setPose(name, { y = 0 } = {}) {
      poseName = name;
      target = poseTargets(name);
      seatY = y;
      if (name !== 'stand') waveT = 0;
    },
    // 'book' | 'remote' | null; `detail` is the book's { title, by } when he holds one
    hold(item, detail) {
      if (item === 'book') heldBook.show(detail);
      heldBook.group.visible = item === 'book';
      remote.visible = item === 'remote';
    },
    // bench press: 0 = bar at the chest, 1 = arms locked out
    set press(p) {
      press = p;
    },
    // a quick flick of the remote
    click() {
      clickT = 0.25;
    },
    handsCenter(out) {
      root.updateMatrixWorld(true);
      const a = hands[0].getWorldPosition(new THREE.Vector3());
      const b = hands[1].getWorldPosition(new THREE.Vector3());
      return out.copy(a).add(b).multiplyScalar(0.5);
    },
    wave(duration = 1.6) {
      if (poseName === 'stand') waveT = duration;
    },
    // keep waving until stopWave (the hello at the door)
    waveLoop() {
      waveT = Infinity;
    },
    stopWave() {
      waveT = 0;
    },
    headTop() {
      return head.localToWorld(new THREE.Vector3(0, 0.7, 0));
    },
    update(dt, t) {
      // follow the path
      if (path.length) {
        const p = path[0];
        const dx = p.x - root.position.x;
        const dz = p.z - root.position.z;
        const d = Math.hypot(dx, dz);
        const step = speed * dt;
        if (d <= step) {
          root.position.x = p.x;
          root.position.z = p.z;
          path.shift();
          if (!path.length) finish();
        } else {
          root.position.x += (dx / d) * step;
          root.position.z += (dz / d) * step;
          targetYaw = Math.atan2(dx, dz);
        }
      }
      yaw += wrap(targetYaw - yaw) * Math.min(1, dt * 10);
      root.rotation.y = yaw;

      walk += ((path.length ? 1 : 0) - walk) * Math.min(1, dt * 8);
      if (path.length) phase += dt * 15;
      const sw = Math.sin(phase);
      const still = 1 - walk;

      // ease every joint towards the pose
      const k = reduceMotion ? 1 : Math.min(1, dt * 7);
      cur.bodyRX = ease(cur.bodyRX, target.bodyRX, k);
      cur.bodyY = ease(cur.bodyY, seatY, k);
      cur.hip = ease(cur.hip, target.hip, k);
      cur.knee = ease(cur.knee, target.knee, k);
      cur.head = ease(cur.head, target.head, k);
      for (const i of [0, 1]) {
        cur.shoulder[i] = ease(cur.shoulder[i], target.shoulder[i], k);
        cur.shoulderZ[i] = ease(cur.shoulderZ[i], target.shoulderZ[i], k);
        cur.elbow[i] = ease(cur.elbow[i], target.elbow[i], k);
      }

      // activity motion on top of the pose
      const elbowAdd = [0, 0];
      const shoulderAdd = [0, 0];
      if (poseName === 'type' && !reduceMotion) {
        elbowAdd[0] = Math.sin(t * 22) * 0.12;
        elbowAdd[1] = Math.sin(t * 22 + 1.7) * 0.12;
      }
      if (poseName === 'bench') {
        const bend = (1 - press) * 1.35;
        elbowAdd[0] = elbowAdd[1] = -bend;
        shoulderAdd[0] = shoulderAdd[1] = bend * 0.45;
      }
      if (clickT > 0) {
        clickT -= dt;
        shoulderAdd[1] -= Math.sin((Math.max(0, clickT) / 0.25) * Math.PI) * 0.25;
      }
      if (poseName === 'read' && !reduceMotion) {
        flipT += dt;
        const cycle = flipT % 4;
        heldBook.flip.visible = cycle < 0.8;
        heldBook.flip.rotation.y = -(cycle / 0.8) * Math.PI;
      }

      body.rotation.x = cur.bodyRX;
      body.position.y = cur.bodyY + Math.abs(Math.cos(phase)) * 0.07 * walk;
      legs[0].rotation.x = cur.hip + sw * 0.7 * walk;
      legs[1].rotation.x = cur.hip - sw * 0.7 * walk;
      knees[0].rotation.x = cur.knee + Math.max(0, sw) * 0.5 * walk;
      knees[1].rotation.x = cur.knee + Math.max(0, -sw) * 0.5 * walk;
      torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015 * still;
      head.rotation.x = cur.head;
      head.rotation.y = poseName === 'stand' ? Math.sin(t * 0.5) * 0.22 * still : 0;
      head.rotation.z = sw * 0.04 * walk;

      arms[0].rotation.x = cur.shoulder[0] + shoulderAdd[0] - sw * 0.6 * walk;
      arms[0].rotation.z = cur.shoulderZ[0];
      elbows[0].rotation.x = cur.elbow[0] + elbowAdd[0] - 0.2 * walk;
      elbows[1].rotation.x = cur.elbow[1] + elbowAdd[1] - 0.2 * walk;

      // the +x arm waves when standing, otherwise it follows the pose
      let armZ = cur.shoulderZ[1];
      let armX = cur.shoulder[1] + shoulderAdd[1] + sw * 0.6 * walk;
      if (waveT > 0) {
        waveT -= dt;
        armZ = 2.6 + Math.sin(t * (reduceMotion ? 0 : 9)) * 0.3;
        armX = 0;
      }
      arms[1].rotation.z += (armZ - arms[1].rotation.z) * Math.min(1, dt * 12);
      arms[1].rotation.x += (armX - arms[1].rotation.x) * Math.min(1, dt * 12);

      if (heldBook.group.visible) holdBookInHands();

      // blink
      blinkT -= dt;
      const closed = blinkT < 0;
      eyes.forEach((e) => (e.scale.y = closed ? 0.1 : 1));
      if (blinkT < -0.12) blinkT = 2.5 + Math.random() * 3;
    },
  };
}
