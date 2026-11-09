import * as THREE from 'three';

// A stylised, chunky character built from primitives.
// The `look` settings (in content.js) drive skin, hair, glasses, clothes, etc.
// Local forward is +z. The feet stand at y = 0.

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
function part(geo, m, x = 0, y = 0, z = 0) {
  const p = new THREE.Mesh(geo, m);
  p.position.set(x, y, z);
  p.castShadow = true;
  p.receiveShadow = true;
  return p;
}
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function buildHair(head, look, hairMat) {
  const cap = (r, theta, tilt = -0.3) => {
    const m = part(new THREE.SphereGeometry(r, 28, 18, 0, Math.PI * 2, 0, theta), hairMat);
    m.rotation.x = tilt;
    return m;
  };
  const backOf = (r, theta) => part(new THREE.SphereGeometry(r, 28, 18, Math.PI, Math.PI, 0, theta), hairMat);

  switch (look.hairStyle) {
    case 'buzz':
      head.add(cap(0.43, 1.2), backOf(0.43, 1.9));
      break;
    case 'curly': {
      head.add(cap(0.44, 1.25), backOf(0.44, 1.95));
      const g = new THREE.SphereGeometry(1, 10, 8);
      for (let i = 0; i < 34; i++) {
        const th = 0.15 + Math.random() * 1.15;
        const ph = Math.random() * Math.PI * 2;
        const r = 0.45;
        const v = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).multiplyScalar(r);
        v.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.3);
        const s = part(g, hairMat, v.x, v.y, v.z);
        s.scale.setScalar(0.08 + Math.random() * 0.05);
        head.add(s);
      }
      break;
    }
    case 'long':
      head.add(cap(0.45, 1.35), backOf(0.45, 2.4));
      head.add(part(new THREE.BoxGeometry(0.72, 0.75, 0.16), hairMat, 0, -0.4, -0.3));
      break;
    case 'bun':
      head.add(cap(0.45, 1.35), backOf(0.45, 2.0));
      head.add(part(new THREE.SphereGeometry(0.17, 16, 12), hairMat, 0, 0.42, -0.2));
      break;
    case 'spiky': {
      head.add(cap(0.44, 1.3), backOf(0.44, 1.95));
      const cone = new THREE.ConeGeometry(0.09, 0.26, 8);
      for (let i = 0; i < 12; i++) {
        const th = 0.2 + (i % 3) * 0.35;
        const ph = (i / 12) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
        dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), -0.35);
        const c = part(cone, hairMat, dir.x * 0.44, dir.y * 0.44, dir.z * 0.44);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        head.add(c);
      }
      break;
    }
    case 'short':
    default: {
      head.add(cap(0.45, 1.35), backOf(0.45, 2.0));
      // a soft fringe sweeping to one side
      const fringe = part(new THREE.SphereGeometry(0.2, 16, 10), hairMat, 0.1, 0.3, 0.3);
      fringe.scale.set(1.6, 0.55, 0.7);
      fringe.rotation.z = -0.25;
      head.add(fringe);
    }
  }
}

export function createCharacter(look, { reduceMotion = false } = {}) {
  const skin = mat(look.skin, { roughness: 0.6 });
  const hairMat = mat(look.hair, { roughness: 0.9, side: THREE.DoubleSide });
  const shirt = mat(look.shirt);
  const pants = mat(look.pants);
  const shoes = mat(look.shoes, { roughness: 0.5 });
  const dark = mat('#1A1A22', { roughness: 0.3 });

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // legs
  const legs = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.15 * s, 0.9, 0);
    p.add(part(new THREE.CapsuleGeometry(0.11, 0.55, 4, 12), pants, 0, -0.38, 0));
    p.add(part(new THREE.BoxGeometry(0.21, 0.12, 0.33), shoes, 0, -0.83, 0.05));
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
    ctx.font = '96px serif';
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

  // arms (index 0 = -x side, 1 = +x side; the +x arm waves)
  const arms = [-1, 1].map((s) => {
    const p = new THREE.Group();
    p.position.set(0.4 * s, 1.75, 0);
    p.rotation.z = 0.1 * s;
    p.add(part(new THREE.CapsuleGeometry(0.085, 0.42, 4, 10), shirt, 0, -0.3, 0));
    p.add(part(new THREE.SphereGeometry(0.1, 12, 10), skin, 0, -0.66, 0));
    body.add(p);
    return p;
  });

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
    e.add(part(new THREE.SphereGeometry(0.017, 8, 6), mat('#FFFFFF', { emissive: '#FFFFFF', emissiveIntensity: 0.4 }), -0.015 * s + 0.012, 0.02, 0.03));
    head.add(e);
    return e;
  });
  for (const s of [-1, 1]) {
    const brow = part(new THREE.BoxGeometry(0.13, 0.028, 0.03), hairMat, 0.15 * s, 0.15, 0.385);
    brow.rotation.z = -0.08 * s;
    head.add(brow);
  }
  head.add(part(new THREE.SphereGeometry(0.045, 12, 10), skin, 0, -0.05, 0.415));
  const mouth = part(new THREE.TorusGeometry(0.07, 0.016, 6, 16, Math.PI), mat('#5A2E2E'), 0, -0.15, 0.385);
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
  const speed = 2.7;

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
    place(x, z, facing = 0) {
      root.position.set(x, 0, z);
      yaw = targetYaw = facing;
      root.rotation.y = yaw;
    },
    followPath(points, cb) {
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
    wave(duration = 1.6) {
      waveT = duration;
    },
    headTop() {
      return root.localToWorld(new THREE.Vector3(0, 3.05, 0));
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

      // walk cycle
      walk += ((path.length ? 1 : 0) - walk) * Math.min(1, dt * 8);
      if (path.length) phase += dt * 10;
      const sw = Math.sin(phase);
      legs[0].rotation.x = sw * 0.7 * walk;
      legs[1].rotation.x = -sw * 0.7 * walk;
      arms[0].rotation.x = -sw * 0.6 * walk;
      body.position.y = Math.abs(Math.cos(phase)) * 0.07 * walk;
      torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015 * (1 - walk);
      head.rotation.y = Math.sin(t * 0.5) * 0.22 * (1 - walk);
      head.rotation.z = sw * 0.04 * walk;

      // wave with the +x arm, otherwise swing it
      let armZ = 0.1;
      let armX = sw * 0.6 * walk;
      if (waveT > 0) {
        waveT -= dt;
        armZ = 2.6 + Math.sin(t * 13) * 0.3;
        armX = 0;
      }
      arms[1].rotation.z += (armZ - arms[1].rotation.z) * Math.min(1, dt * 12);
      arms[1].rotation.x += (armX - arms[1].rotation.x) * Math.min(1, dt * 12);

      // blink
      blinkT -= dt;
      const closed = blinkT < 0;
      eyes.forEach((e) => (e.scale.y = closed ? 0.1 : 1));
      if (blinkT < -0.12) blinkT = 2.5 + Math.random() * 3;
    },
  };
}
