import * as THREE from 'three';

// The view through the telescope: a night sky with real bright stars at their
// real positions (right ascension in hours, declination in degrees), joined
// into a few constellations everyone can find.

export const CONSTELLATIONS = [
  {
    name: 'Orion',
    stars: [
      ['Betelgeuse', 5.92, 7.41, 1],
      ['Bellatrix', 5.42, 6.35, 2],
      ['Alnitak', 5.68, -1.94, 2],
      ['Alnilam', 5.6, -1.2, 2],
      ['Mintaka', 5.53, -0.3, 2],
      ['Saiph', 5.8, -9.67, 2],
      ['Rigel', 5.24, -8.2, 1],
      ['Meissa', 5.59, 9.93, 3],
    ],
    lines: [[7, 0], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
  },
  {
    name: 'The Big Dipper',
    stars: [
      ['Dubhe', 11.06, 61.75, 1],
      ['Merak', 11.03, 56.38, 2],
      ['Phecda', 11.9, 53.69, 2],
      ['Megrez', 12.26, 57.03, 3],
      ['Alioth', 12.9, 55.96, 1],
      ['Mizar', 13.4, 54.93, 2],
      ['Alkaid', 13.79, 49.31, 2],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: 'Cassiopeia',
    stars: [
      ['Caph', 0.15, 59.15, 2],
      ['Schedar', 0.68, 56.54, 2],
      ['Navi', 0.95, 60.72, 2],
      ['Ruchbah', 1.43, 60.24, 2],
      ['Segin', 1.91, 63.67, 3],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'The Southern Cross',
    stars: [
      ['Acrux', 12.44, -63.1, 1],
      ['Mimosa', 12.8, -59.69, 1],
      ['Gacrux', 12.52, -57.11, 2],
      ['Imai', 12.25, -58.75, 3],
    ],
    lines: [[0, 2], [1, 3]],
  },
  {
    name: 'Canis Major',
    stars: [
      ['Sirius', 6.75, -16.72, 1],
      ['Mirzam', 6.38, -17.96, 2],
      ['Adhara', 6.98, -28.97, 2],
      ['Wezen', 7.14, -26.39, 2],
      ['Aludra', 7.4, -29.3, 2],
    ],
    lines: [[0, 1], [0, 3], [3, 2], [3, 4]],
  },
];
export const POLARIS = ['Polaris', 2.53, 89.26, 1];

// right ascension (hours) and declination (degrees) to a unit vector; +y is the north pole
export function raDecToVec(raHours, decDeg) {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = (decDeg * Math.PI) / 180;
  return { x: Math.cos(dec) * Math.cos(ra), y: Math.sin(dec), z: -Math.cos(dec) * Math.sin(ra) };
}

function label(text, font, color) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `600 40px ${font}`;
  c.width = Math.ceil(ctx.measureText(text).width) + 16;
  c.height = 56;
  ctx.font = `600 40px ${font}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 8, 30);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, sizeAttenuation: false }));
  s.scale.set((c.width / c.height) * 0.035, 0.035, 1);
  return s;
}

function rand(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSky({ font, colors, reduceMotion = false }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.night);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  const R = 100;

  // background stars, scattered evenly over the sphere
  const r = rand(42);
  const field = (n, size, opacity) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([s * Math.cos(th) * R, u * R, s * Math.sin(th) * R], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: colors.star, size, sizeAttenuation: false, transparent: true, opacity, depthWrite: false }));
  };
  scene.add(field(2600, 1.5, 0.55), field(500, 2.4, 0.85));

  // named stars, lines and labels
  const named = [];
  const segs = [];
  const centers = [];
  const vec = (ra, dec) => {
    const v = raDecToVec(ra, dec);
    return new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(R * 0.98);
  };
  for (const c of CONSTELLATIONS) {
    const pts = c.stars.map(([, ra, dec]) => vec(ra, dec));
    c.stars.forEach(([, , , mag], i) => named.push({ p: pts[i], mag }));
    for (const [a, b] of c.lines) segs.push(pts[a], pts[b]);
    const center = pts.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(pts.length);
    centers.push({ name: c.name, dir: center.clone().normalize() });
    const l = label(c.name, font, colors.label);
    l.position.copy(center.clone().normalize().multiplyScalar(R * 0.95)).add(new THREE.Vector3(0, -6, 0));
    scene.add(l);
  }
  const polaris = vec(POLARIS[1], POLARIS[2]);
  named.push({ p: polaris, mag: 1 });
  const pl = label('Polaris', font, colors.label);
  pl.position.copy(polaris).multiplyScalar(0.97).add(new THREE.Vector3(0, -4, 0));
  scene.add(pl);
  centers.push({ name: 'Polaris, the North Star', dir: polaris.clone().normalize() });

  for (const mag of [1, 2, 3]) {
    const list = named.filter((n) => n.mag === mag);
    const geo = new THREE.BufferGeometry().setFromPoints(list.map((n) => n.p));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: colors.bright, size: [7, 5, 3.5][mag - 1], sizeAttenuation: false, depthWrite: false })));
  }
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.55 })));

  // look direction as yaw (around the pole) and pitch; start on Orion
  const start = centers[0].dir;
  let yaw = Math.atan2(-start.z, start.x);
  let pitch = Math.asin(start.y);
  let fov = 60;
  const dir = new THREE.Vector3();
  const aim = () => {
    pitch = THREE.MathUtils.clamp(pitch, -1.5, 1.5);
    dir.set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
    camera.lookAt(dir);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  };
  aim();

  return {
    scene,
    camera,
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    // dx, dy in radians at the current zoom
    look(dx, dy) {
      yaw += dx;
      pitch += dy;
      aim();
    },
    zoom(f) {
      fov = THREE.MathUtils.clamp(fov * f, 18, 80);
      aim();
    },
    get fov() {
      return fov;
    },
    // the constellation nearest the middle of the view
    inView() {
      let best = null;
      let bestDot = Math.cos(THREE.MathUtils.degToRad(fov * 0.45));
      for (const c of centers) {
        const d = c.dir.dot(dir);
        if (d > bestDot) {
          bestDot = d;
          best = c.name;
        }
      }
      return best;
    },
    update(dt) {
      if (reduceMotion) return;
      scene.rotation.y += dt * 0.004; // the sky turns, slowly
    },
  };
}
