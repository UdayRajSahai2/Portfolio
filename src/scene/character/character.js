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
// Everything above the hips hangs from `upper`, so he can lean in from the hips
// while sitting; `reach(point)` puts one hand on a point in the world (a chess piece).

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = (a, b, k) => a + (b - a) * k;
const clamp = THREE.MathUtils.clamp;

const HIP = 0.9; // hip height; `upper` pivots here
const SHOULDER = 0.85; // shoulders above the hips
const UPPER_ARM = 0.32;
const FOREARM = 0.33; // elbow to the centre of the hand
const REACH = 0.62; // what the arm reaches without stretching
const LEAN_MAX = 0.4; // radians he leans in from the hips, at most: further and his head hides the board
const STRETCH_MAX = 2.6; // a cartoon arm stretches for the far side of the board

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
  const upper = new THREE.Group(); // torso, arms and head, pivoting at the hips
  upper.position.y = HIP;
  body.add(upper);

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
  torso.position.y = 1.38 - HIP;
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
  upper.add(torso);
  upper.add(part(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 12), skin, 0, 1.93 - HIP, 0));

  // arms: a shoulder, then an elbow (index 0 = -x side, 1 = +x side; the +x arm waves)
  const elbows = [];
  const hands = [];
  const segments = []; // [upper arm, forearm] meshes, for the stretch
  const arms = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.4 * s, SHOULDER, 0);
    p.rotation.z = 0.1 * s;
    const upperArm = part(new THREE.CapsuleGeometry(0.085, 0.2, 4, 10), shirt, 0, -0.15, 0);
    p.add(upperArm);
    const elbow = new THREE.Group();
    elbow.position.y = -UPPER_ARM;
    const forearm = part(new THREE.CapsuleGeometry(0.08, 0.16, 4, 10), shirt, 0, -0.12, 0);
    elbow.add(forearm);
    const hand = part(new THREE.SphereGeometry(0.1, 12, 10), skin, 0, -FOREARM, 0);
    elbow.add(hand);
    p.add(elbow);
    elbows.push(elbow);
    hands.push(hand);
    segments.push([upperArm, forearm]);
    upper.add(p);
    return p;
  });
  // 1 is his own length; more is the cartoon stretch
  function setStretch(i, k) {
    const [u, f] = segments[i];
    u.scale.y = f.scale.y = k;
    u.position.y = -0.15 * k;
    f.position.y = -0.12 * k;
    elbows[i].position.y = -UPPER_ARM * k;
    hands[i].position.y = -FOREARM * k;
  }

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
  head.position.y = 2.38 - HIP;
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
  upper.add(head);

  // ── reaching ─────────────────────────────────────────────
  let reachAt = null; // the world point his hand goes to, or null
  let reachArm = 1;
  let reachW = 0; // 0 = his pose, 1 = the reach; eased, so the hand glides in and out
  let lean = 0;
  let leanGoal = 0;
  let stretch = 1;
  const ik = { a: 0, c: 0, e: 0 };
  const rp = new THREE.Vector3();

  // how far to lean, and how much to stretch, for the hand to arrive
  function planReach() {
    root.updateMatrixWorld(true);
    root.worldToLocal(rp.copy(reachAt));
    const sx = reachArm ? 0.4 : -0.4;
    const hip = cur.bodyY + HIP;
    let d = Infinity;
    let l = 0;
    for (; l <= LEAN_MAX; l += 0.05) {
      d = Math.hypot(rp.x - sx, rp.y - (hip + SHOULDER * Math.cos(l)), rp.z - SHOULDER * Math.sin(l));
      if (d <= REACH) break;
    }
    leanGoal = Math.min(l, LEAN_MAX);
    stretch = clamp(d / REACH, 1, STRETCH_MAX);
  }

  // two bones onto the point: the elbow bend from the distance, then the shoulder's swing
  function solveArm(i, k) {
    root.updateMatrixWorld(true);
    upper.worldToLocal(rp.copy(reachAt)).sub(arms[i].position);
    const l1 = UPPER_ARM * k;
    const l2 = FOREARM * k;
    const dist = Math.min(rp.length(), (l1 + l2) * 0.999);
    rp.setLength(dist);
    const e = -(Math.PI - Math.acos(clamp((l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2), -1, 1)));
    const hy = -l1 - l2 * Math.cos(e);
    const hz = -l2 * Math.sin(e);
    ik.c = Math.asin(clamp(-rp.x / hy, -1, 1));
    ik.a = Math.atan2(rp.z, rp.y) - Math.atan2(hz, hy * Math.cos(ik.c));
    ik.e = e;
  }

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
  const curls = [0, 0];
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
    // 'stand' | 'sit' | 'type' | 'read' | 'remote' | 'play' | 'bench' | 'curl' | 'scope'; y lifts the body onto a seat
    setPose(name, { y = 0 } = {}) {
      reachAt = null;
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
    // biceps curl, per arm [left, right]: 0 = arm hanging, 1 = dumbbell at the shoulder
    curl(left, right) {
      curls[0] = left;
      curls[1] = right;
    },
    // one hand's centre and turn in the world (i: 0 = -x side, 1 = +x side)
    handPose(i, pos, quat) {
      root.updateMatrixWorld(true);
      hands[i].getWorldPosition(pos);
      hands[i].getWorldQuaternion(quat);
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
    // one hand to a world point (null takes it back). `via` is where it goes next, if
    // anywhere, so the arm on the side of both is the one that reaches.
    reach(point, via = point) {
      if (!point) {
        reachAt = null;
        return;
      }
      if (!reachAt) {
        root.updateMatrixWorld(true);
        const a = root.worldToLocal(rp.copy(point)).x;
        const b = root.worldToLocal(rp.copy(via)).x;
        reachArm = a + b >= 0 ? 1 : 0;
      }
      reachAt = (reachAt || new THREE.Vector3()).copy(point);
    },
    // where the reaching hand is now, in the world
    reachHand(out) {
      root.updateMatrixWorld(true);
      return hands[reachArm].getWorldPosition(out);
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
      if (poseName === 'curl') {
        for (const i of [0, 1]) {
          elbowAdd[i] = -curls[i] * 1.95; // the forearm swings up
          shoulderAdd[i] = -curls[i] * 0.18; // and the elbow drifts forward a little at the top
        }
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

      // a reach: lean in from the hips, then lay the arm onto the point (over the pose)
      const kr = reduceMotion ? 1 : Math.min(1, dt * 6);
      reachW = ease(reachW, reachAt ? 1 : 0, kr);
      if (reachAt) planReach();
      lean = ease(lean, reachAt ? leanGoal : 0, kr);
      upper.rotation.x = lean;
      if (reachW > 0.002) {
        const i = reachArm;
        const k = 1 + (stretch - 1) * reachW;
        setStretch(i, k);
        if (reachAt) solveArm(i, k);
        arms[i].rotation.x = ease(arms[i].rotation.x, ik.a, reachW);
        arms[i].rotation.z = ease(arms[i].rotation.z, ik.c, reachW);
        elbows[i].rotation.x = ease(elbows[i].rotation.x, ik.e, reachW);
      } else if (segments[reachArm][0].scale.y !== 1) setStretch(reachArm, 1);

      if (heldBook.group.visible) holdBookInHands();

      // blink
      blinkT -= dt;
      const closed = blinkT < 0;
      eyes.forEach((e) => (e.scale.y = closed ? 0.1 : 1));
      if (blinkT < -0.12) blinkT = 2.5 + Math.random() * 3;
    },
  };
}
