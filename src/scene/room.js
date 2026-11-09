import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../sound.js';

// The whole room is built from primitives, so there are no model files to load.
// Room footprint: floor spans x/z from -5 to 5; walls stand at z=-5 (back) and x=-5 (left).

const C = {
  wall: '#3A416B',
  wallTrim: '#2A2F52',
  wood: '#8B5E3C',
  woodDark: '#5C3B26',
  walnut: '#6B4430',
  maple: '#E9D8A6',
  metal: '#B9BCC7',
  dark: '#23263A',
  paper: '#EFE6D2',
  cork: '#B98A5B',
  leaf: '#4E9F6D',
  ceramic: '#4F8A8B',
};

// ── tiny helpers ─────────────────────────────────────────────
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.02, ...o });
function mesh(geo, color, o) {
  const material = Array.isArray(color) || color instanceof THREE.Material ? color : mat(color, o);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const box = (w, h, d, c, o) => mesh(new THREE.BoxGeometry(w, h, d), c, o);
const cyl = (rt, rb, h, c, seg = 32, o) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), c, o);
const sphere = (r, c, o, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), c, o);
function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, canvas: c, ctx };
}

// ── monitor screen: a tiny code editor that types real-ish code ──
const SYN = {
  text: '#D5E0E6',
  comment: '#5E8C80',
  string: '#E9C46A',
  keyword: '#FF8FA3',
  type: '#7FD1B9',
  call: '#C3A6FF',
  number: '#9DB8FF',
};
const KEYWORDS = new Set(
  'const let var function return for of in if else continue break async await export import from new public private static class def type query mutation true false null None void foreach string int str bool'.split(' ')
);

function tokenize(line, lang) {
  const commentMark = lang === 'Python' || lang === 'GraphQL' ? '#' : '//';
  if (line.trim().startsWith(commentMark)) return [{ t: line, c: SYN.comment }];
  const out = [];
  const re = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|@\w+|\$\w+|\b\d+\b|[A-Za-z_]\w*|\s+|.)/g;
  let m;
  while ((m = re.exec(line))) {
    const t = m[0];
    let c = SYN.text;
    if (/^["'`]/.test(t)) c = SYN.string;
    else if (t[0] === '@') c = SYN.call;
    else if (t[0] === '$' || /^\d/.test(t)) c = SYN.number;
    else if (KEYWORDS.has(t)) c = SYN.keyword;
    else if (/^[A-Z]\w*/.test(t)) c = SYN.type;
    else if (/^[a-z_]\w*$/i.test(t) && /^\s*\(/.test(line.slice(m.index + t.length))) c = SYN.call;
    out.push({ t, c });
  }
  return out;
}

function makeScreen(files, languages) {
  const W = 1024;
  const H = 614;
  const { tex, ctx } = canvasTex(W, H, () => {});
  const parsed = files.map((f) => ({ ...f, lines: f.code.map((l) => tokenize(l, f.lang)), total: f.code.join('\n').length }));
  const MONO = 'Consolas, "Courier New", monospace';
  let idx = 0;
  let shown = 0;
  let acc = 0;
  let hold = 0;
  let blink = 0;
  let frame = 0;
  let onChar = null;

  function drawTabs() {
    ctx.fillStyle = '#081013';
    ctx.fillRect(0, 0, W, 56);
    ctx.font = `19px ${MONO}`;
    ctx.textBaseline = 'middle';
    let x = 0;
    parsed.forEach((f, i) => {
      const w = ctx.measureText(f.name).width + 44;
      const active = i === idx;
      ctx.fillStyle = active ? '#10222A' : '#0B171B';
      ctx.fillRect(x, 0, w, 56);
      if (active) {
        ctx.fillStyle = f.color;
        ctx.fillRect(x, 0, w, 4);
      }
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(x + 16, 30, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = active ? '#E6EEF2' : '#55707A';
      ctx.fillText(f.name, x + 28, 30);
      ctx.fillStyle = '#05090B';
      ctx.fillRect(x + w - 1, 0, 1, 56);
      x += w;
    });
  }

  function drawCode() {
    const f = parsed[idx];
    ctx.font = `25px ${MONO}`;
    ctx.textBaseline = 'top';
    let budget = shown;
    let cursor = null;
    const top = 80;
    const lh = 42;
    for (let i = 0; i < f.lines.length; i++) {
      const y = top + i * lh;
      ctx.fillStyle = '#34505A';
      ctx.textAlign = 'right';
      ctx.fillText(String(i + 1), 44, y);
      ctx.textAlign = 'left';
      if (budget < 0) continue;
      let x = 64;
      for (const tok of f.lines[i]) {
        if (budget <= 0) break;
        const t = tok.t.slice(0, budget);
        ctx.fillStyle = tok.c;
        ctx.fillText(t, x, y);
        x += ctx.measureText(t).width;
        budget -= t.length;
      }
      if (budget >= 0) cursor = { x, y };
      budget -= 1; // the newline
    }
    if (cursor && blink < 0.55) {
      ctx.fillStyle = '#7FD1B9';
      ctx.fillRect(cursor.x + 2, cursor.y + 1, 13, 28);
    }
  }

  function drawStatus() {
    const f = parsed[idx];
    const y = H - 52;
    ctx.fillStyle = '#081013';
    ctx.fillRect(0, y, W, 52);
    ctx.textBaseline = 'middle';
    ctx.font = `bold 18px ${MONO}`;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(26, y + 26, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D5E0E6';
    ctx.fillText(f.lang, 40, y + 26);

    // GitHub language split
    const barW = 330;
    const bx = W - barW - 24;
    ctx.font = `15px ${MONO}`;
    ctx.fillStyle = '#6F8C96';
    ctx.textAlign = 'right';
    ctx.fillText('my GitHub', bx - 14, y + 26);
    ctx.textAlign = 'left';
    let x = bx;
    for (const l of languages) {
      const w = (l.pct / 100) * barW;
      ctx.fillStyle = l.color;
      ctx.fillRect(x, y + 14, Math.max(1, w - 2), 10);
      if (l.pct >= 6) {
        ctx.fillStyle = '#9FB4BC';
        ctx.font = `13px ${MONO}`;
        ctx.fillText(`${l.name === 'JavaScript' ? 'JS' : l.name === 'TypeScript' ? 'TS' : l.name === 'Python' ? 'Py' : l.name} ${Math.round(l.pct)}%`, x, y + 38);
      }
      x += w;
    }
  }

  function draw() {
    const g = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, '#11232A');
    g.addColorStop(1, '#0A1518');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawTabs();
    drawCode();
    drawStatus();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    tex.needsUpdate = true;
  }
  draw();

  const next = () => {
    idx = (idx + 1) % parsed.length;
    shown = 0;
    hold = 0;
  };

  return {
    tex,
    restart() {
      shown = 0;
      hold = 0;
    },
    next,
    set onChar(fn) {
      onChar = fn;
    },
    tick(dt) {
      blink = (blink + dt) % 1.1;
      const total = parsed[idx].total;
      if (hold > 0) {
        hold -= dt;
        if (hold <= 0) next();
      } else {
        acc += dt * 34;
        const n = Math.floor(acc);
        if (n > 0) {
          acc -= n;
          shown = Math.min(total, shown + n);
          if (onChar) onChar();
          if (shown === total) hold = 3.5;
        }
      }
      // ~30fps redraw is plenty for a screen
      if (frame++ % 2 === 0) draw();
    },
  };
}

// ── chess pieces ─────────────────────────────────────────────
function piece(type, white) {
  const c = white ? '#F2E8D5' : '#2E2724';
  const o = { roughness: white ? 0.45 : 0.35 };
  const g = new THREE.Group();
  g.add(at(cyl(0.055, 0.065, 0.03, c, 20, o), 0, 0.015, 0));
  const dir = white ? -1 : 1;
  switch (type) {
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
      const snout = at(box(0.04, 0.04, 0.08, c, o), 0, 0.19, 0.045 * dir);
      g.add(head, snout);
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

const SQ = 0.18;
function squarePos(sq) {
  const f = sq.charCodeAt(0) - 97;
  const r = Number(sq[1]) - 1;
  return { x: -0.63 + f * SQ, z: 0.63 - r * SQ };
}

// ─────────────────────────────────────────────────────────────
export function buildRoom(scene, { monitorFiles, languages = [], noteLabels = [], reduceMotion = false }) {
  const rand = mulberry32(11);
  const hotspots = {};
  const tickers = [];
  const root = new THREE.Group();
  scene.add(root);
  const D = reduceMotion ? 0.01 : 1; // animation duration scale

  // ── lights ────────────────────────────────────────────────
  scene.add(new THREE.HemisphereLight('#8C96E8', '#3A2418', 1.15));

  const moon = new THREE.DirectionalLight('#A9B8FF', 1.3);
  moon.position.set(9, 12, 7);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  moon.shadow.bias = -0.0006;
  moon.shadow.normalBias = 0.02;
  scene.add(moon);

  // ── shell: floor + two walls ──────────────────────────────
  const floorTex = canvasTex(1024, 1024, (ctx, w, h) => {
    const rows = 12;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 300;
      while (x < w) {
        const len = 260 + rand() * 300;
        ctx.fillStyle = `hsl(${22 + rand() * 6}, ${32 + rand() * 8}%, ${30 + rand() * 7}%)`;
        ctx.fillRect(x, r * rh, len, rh);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(x, r * rh, 3, rh);
        x += len;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, r * rh, w, 3);
    }
  });
  const side = mat(C.woodDark);
  const floor = mesh(new THREE.BoxGeometry(10, 0.3, 10), [side, side, mat('#fff', { map: floorTex.tex, roughness: 0.7 }), side, side, side]);
  at(floor, 0, -0.15, 0);
  floor.userData.floor = true;
  root.add(floor);

  const wallMat = mat(C.wall, { roughness: 0.95 });
  const back = at(box(10.3, 6.3, 0.3, wallMat), -0.15, 2.85, -5.15);
  const left = at(box(0.3, 6.3, 10, wallMat), -5.15, 2.85, 0);
  back.userData.wall = left.userData.wall = true;
  root.add(back, left);
  // baseboards
  root.add(at(box(10, 0.18, 0.04, C.wallTrim), 0, 0.09, -4.98));
  root.add(at(box(0.04, 0.18, 10, C.wallTrim), -4.98, 0.09, 0));

  // ── window with a night sky ───────────────────────────────
  const sky = canvasTex(512, 640, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#141A3A');
    g.addColorStop(1, '#3B3F78');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
      const s = rand() * 2.2 + 0.6;
      ctx.fillRect(rand() * w, rand() * h * 0.8, s, s);
    }
    ctx.fillStyle = '#F6EFD8';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.25, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1B2148';
    ctx.beginPath();
    ctx.arc(w * 0.7 + 18, h * 0.25 - 10, 42, 0, Math.PI * 2);
    ctx.fill();
    // skyline
    ctx.fillStyle = '#0F1330';
    let x = 0;
    while (x < w) {
      const bw = 30 + rand() * 50;
      const bh = 60 + rand() * 120;
      ctx.fillRect(x, h - bh, bw, bh);
      ctx.fillStyle = '#FFC46B';
      for (let wy = h - bh + 12; wy < h - 10; wy += 18)
        for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (rand() < 0.18) ctx.fillRect(wx, wy, 4, 6);
      ctx.fillStyle = '#0F1330';
      x += bw + 4;
    }
  });
  const win = new THREE.Group();
  at(win, 3.2, 3.3, -4.98);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), new THREE.MeshBasicMaterial({ map: sky.tex, toneMapped: false }));
  win.add(pane);
  const fr = C.wallTrim;
  win.add(at(box(2.0, 0.1, 0.1, fr), 0, 1.15, 0.03), at(box(2.0, 0.1, 0.1, fr), 0, -1.15, 0.03));
  win.add(at(box(0.1, 2.4, 0.1, fr), -0.95, 0, 0.03), at(box(0.1, 2.4, 0.1, fr), 0.95, 0, 0.03));
  win.add(at(box(0.05, 2.2, 0.05, fr), 0, 0, 0.03), at(box(1.8, 0.05, 0.05, fr), 0, 0.2, 0.03));
  win.add(at(box(2.2, 0.08, 0.3, C.wood), 0, -1.22, 0.12));
  win.traverse((o) => (o.userData.wall = true));
  root.add(win);

  // ── desk ──────────────────────────────────────────────────
  const desk = new THREE.Group();
  desk.add(at(box(4, 0.12, 1.6, C.wood, { roughness: 0.6 }), 0, 1.5, -4.1));
  for (const [x, z] of [[-1.9, -4.8], [1.9, -4.8], [-1.9, -3.4], [1.9, -3.4]]) desk.add(at(box(0.1, 1.44, 0.1, C.woodDark), x, 0.72, z));
  desk.add(at(box(0.9, 0.9, 1.4, C.walnut), 1.35, 0.98, -4.1));
  desk.add(at(box(0.6, 0.04, 0.02, C.metal, { metalness: 0.6, roughness: 0.3 }), 1.35, 1.25, -3.39));
  desk.add(at(box(0.6, 0.04, 0.02, C.metal, { metalness: 0.6, roughness: 0.3 }), 1.35, 0.8, -3.39));
  root.add(desk);

  // chair
  const chair = new THREE.Group();
  chair.add(at(box(0.8, 0.1, 0.8, C.dark), 0, 0.9, 0));
  chair.add(at(box(0.8, 0.9, 0.1, C.dark), 0, 1.4, 0.42));
  chair.add(at(cyl(0.05, 0.05, 0.8, C.metal, 12, { metalness: 0.7, roughness: 0.3 }), 0, 0.45, 0));
  chair.add(at(cyl(0.4, 0.4, 0.05, C.dark, 5), 0, 0.06, 0));
  at(chair, 0.4, 0, -2.75);
  chair.rotation.y = -0.35;
  root.add(chair);

  // ── CODE: monitor + keyboard ──────────────────────────────
  {
    const g = new THREE.Group();
    const screen = makeScreen(monitorFiles, languages);
    g.add(at(box(0.5, 0.04, 0.35, C.dark), 0, 1.58, -4.5));
    g.add(at(box(0.08, 0.55, 0.06, C.dark), 0, 1.85, -4.6));
    g.add(at(box(1.64, 1.02, 0.08, C.dark, { roughness: 0.5 }), 0, 2.32, -4.55));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
    scr.userData.noGlow = true;
    at(scr, 0, 2.33, -4.505);
    g.add(scr);
    const kb = at(box(1.1, 0.05, 0.36, '#2E3350'), 0, 1.585, -3.75);
    g.add(kb);
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 14; k++) g.add(at(box(0.06, 0.02, 0.06, '#C9CDE0'), -0.49 + k * 0.075, 1.62, -3.87 + r * 0.08));
    g.add(at(box(0.12, 0.04, 0.2, '#C9CDE0'), 0.75, 1.58, -3.75));
    const glow = new THREE.PointLight('#7FD1B9', 2.2, 3.2, 2);
    glow.position.set(0, 2.3, -4.0);
    g.add(glow);
    root.add(g);
    tickers.push((dt) => screen.tick(dt));

    hotspots.code = {
      group: g,
      stand: { x: -1.6, z: -2.95, look: [-0.3, -4.4] },
      view: { pos: [0.35, 2.75, -0.75], target: [0, 2.1, -4.5] },
      onFocus() {
        screen.restart();
        screen.onChar = () => sound.key();
      },
      onBlur() {
        screen.onChar = null;
      },
      interact(obj) {
        if (obj === scr) {
          screen.next();
          sound.toggle();
        }
      },
    };
  }

  // mug
  const mug = new THREE.Group();
  mug.add(at(cyl(0.11, 0.1, 0.22, '#E9C46A', 20), 0, 0.11, 0));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), mat('#E9C46A'));
  at(handle, 0.12, 0.11, 0);
  mug.add(handle);
  at(mug, -0.95, 1.56, -3.6);
  root.add(mug);

  // ── LAMP (a toggle, not a section) ────────────────────────
  const lamp = (() => {
    const g = new THREE.Group();
    const shadeC = '#FFB547';
    g.add(at(cyl(0.2, 0.24, 0.06, C.dark), 0, 0.03, 0));
    g.add(at(cyl(0.025, 0.025, 0.75, C.dark, 10), 0, 0.42, 0));
    const arm = at(cyl(0.022, 0.022, 0.45, C.dark, 10), 0.16, 0.86, 0.05);
    arm.rotation.z = -1.0;
    g.add(arm);
    const head = new THREE.Group();
    at(head, 0.36, 0.95, 0.12);
    head.rotation.z = -0.55;
    const shade = mesh(new THREE.ConeGeometry(0.26, 0.32, 28, 1, true), mat(shadeC, { side: THREE.DoubleSide, roughness: 0.5 }));
    head.add(shade);
    const bulbMat = new THREE.MeshStandardMaterial({ color: '#FFE2A8', emissive: '#FFD28A', emissiveIntensity: 3 });
    const bulb = at(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), bulbMat), 0, -0.1, 0);
    bulb.userData.noGlow = true;
    head.add(bulb);
    g.add(head);
    at(g, -1.55, 1.56, -4.35);
    root.add(g);

    const light = new THREE.PointLight('#FFC46B', 9, 12, 1.6);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.002;
    head.add(light);
    light.position.set(0, -0.18, 0);

    let on = true;
    return {
      group: g,
      get on() {
        return on;
      },
      toggle() {
        on = !on;
        sound.toggle();
        gsap.to(light, { intensity: on ? 9 : 0, duration: 0.25 * D });
        gsap.to(bulbMat, { emissiveIntensity: on ? 3 : 0, duration: 0.25 * D });
      },
    };
  })();

  // ── CONTACT: envelope on the desk ─────────────────────────
  {
    const g = new THREE.Group();
    g.add(at(box(0.52, 0.016, 0.34, C.paper, { roughness: 0.9 }), 0, 0.008, 0));
    const letter = at(box(0.46, 0.006, 0.3, '#FFFFFF', { roughness: 0.9 }), 0, 0.012, 0);
    g.add(letter);
    g.add(at(box(0.08, 0.004, 0.1, '#C3A6FF'), 0.18, 0.018, 0.08));
    const shape = new THREE.Shape();
    shape.moveTo(-0.26, 0);
    shape.lineTo(0.26, 0);
    shape.lineTo(0, 0.2);
    shape.closePath();
    const flapPivot = new THREE.Group();
    at(flapPivot, 0, 0.018, -0.17);
    const flap = mesh(new THREE.ShapeGeometry(shape), mat('#E4D6BA', { side: THREE.DoubleSide, roughness: 0.9 }));
    flap.rotation.x = Math.PI / 2;
    flapPivot.add(flap);
    g.add(flapPivot);
    at(g, 1.2, 1.565, -3.55);
    g.rotation.y = -0.3;
    root.add(g);

    hotspots.contact = {
      group: g,
      stand: { x: 2.2, z: -2.85, look: [1.2, -3.55] },
      view: { pos: [0.55, 3.0, -1.85], target: [1.15, 1.57, -3.6] },
      onFocus() {
        sound.paper();
        gsap.to(flapPivot.rotation, { x: -2.6, duration: 0.6 * D, ease: 'power2.out' });
        gsap.to(letter.position, { z: -0.22, y: 0.05, duration: 0.6 * D, delay: 0.35 * D, ease: 'power2.out' });
      },
      onBlur() {
        gsap.to(letter.position, { z: 0, y: 0.012, duration: 0.4 * D });
        gsap.to(flapPivot.rotation, { x: 0, duration: 0.5 * D, delay: 0.25 * D });
      },
    };
  }

  // ── ABOUT: corkboard with notes ───────────────────────────
  {
    const g = new THREE.Group();
    g.add(at(box(2.5, 1.5, 0.08, C.woodDark), 0, 0, 0));
    g.add(at(box(2.32, 1.32, 0.06, C.cork, { roughness: 1 }), 0, 0, 0.03));
    const notes = [];
    const colors = ['#E9C46A', '#7FD1B9', '#FF8FA3', '#9DB8FF', '#F2E8D5'];
    const labels = [...noteLabels];
    const spots = [[-0.8, 0.3], [-0.2, 0.35], [0.45, 0.28], [-0.55, -0.32], [0.15, -0.3], [0.82, -0.25]];
    spots.forEach(([x, y], i) => {
      const label = labels[i] || '';
      const col = colors[i % colors.length];
      const t = canvasTex(256, 256, (ctx, w, h) => {
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, h - 30, w, 30);
        ctx.fillStyle = '#23263A';
        ctx.font = '700 46px "Bricolage Grotesque", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, w / 2, h / 2 + 6);
      });
      const n = new THREE.Group();
      const paper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.006), [0, 0, 0, 0, 0, 0].map((_, k) => (k === 4 ? mat('#fff', { map: t.tex }) : mat(col))));
      paper.castShadow = true;
      n.add(paper);
      n.add(at(sphere(0.025, '#D64550', { roughness: 0.3 }, 10), 0, 0.18, 0.02));
      at(n, x, y, 0.07);
      n.rotation.z = (rand() - 0.5) * 0.25;
      n.userData.baseRot = n.rotation.z;
      g.add(n);
      notes.push(n);
    });
    at(g, 0, 4.15, -4.94);
    root.add(g);

    hotspots.about = {
      group: g,
      stand: { x: -0.75, z: -2.35, look: [0, -4.9] },
      view: { pos: [0.25, 4.0, -1.55], target: [0, 4.1, -4.9] },
      onFocus() {
        notes.forEach((n, i) =>
          gsap.fromTo(n.rotation, { z: n.userData.baseRot }, { z: n.userData.baseRot + 0.12, duration: 0.18 * D, yoyo: true, repeat: 3, delay: i * 0.06 * D })
        );
        sound.paper();
      },
    };
  }

  // ── READING: bookshelf ────────────────────────────────────
  {
    const g = new THREE.Group();
    const W = 2.2;
    const H = 3.4;
    const Dp = 0.6;
    g.add(at(box(Dp, H, 0.06, C.walnut), 0, H / 2, -W / 2 - 0.03));
    g.add(at(box(Dp, H, 0.06, C.walnut), 0, H / 2, W / 2 + 0.03));
    g.add(at(box(0.04, H, W, C.woodDark), -Dp / 2 + 0.02, H / 2, 0));
    const levels = [0.03, 0.88, 1.73, 2.58, 3.37];
    levels.forEach((y) => g.add(at(box(Dp, 0.06, W, C.walnut), 0, y, 0)));
    const bookColors = ['#9DB8FF', '#E9C46A', '#FF8FA3', '#7FD1B9', '#C3A6FF', '#F2E8D5', '#5B6AA8', '#B4553C', '#3E7C6B'];
    const books = [];
    levels.slice(0, 4).forEach((y, li) => {
      let z = -W / 2 + 0.05;
      while (z < W / 2 - 0.15) {
        if (rand() < 0.06) {
          z += 0.2;
          continue;
        }
        const bw = 0.06 + rand() * 0.07;
        const bh = 0.5 + rand() * 0.25;
        const bd = 0.38 + rand() * 0.12;
        const b = box(bd, bh, bw, bookColors[Math.floor(rand() * bookColors.length)], { roughness: 0.85 });
        at(b, -Dp / 2 + 0.06 + bd / 2, y + 0.03 + bh / 2, z + bw / 2);
        b.userData.book = true;
        b.userData.home = b.position.clone();
        g.add(b);
        books.push(b);
        z += bw + 0.005;
      }
      // a small stack lying flat on some shelves
      if (li % 2 === 1) {
        for (let s = 0; s < 3; s++) g.add(at(box(0.36, 0.06, 0.26, bookColors[(s + li) % bookColors.length]), 0.0, y + 0.06 + s * 0.06, W / 2 - 0.17));
      }
    });
    at(g, -4.65, 0, -1.4);
    root.add(g);

    let pulled = null;
    const pull = (b) => {
      if (pulled && pulled !== b) gsap.to(pulled.position, { x: pulled.userData.home.x, duration: 0.35 * D });
      const out = pulled === b ? false : true;
      gsap.to(b.position, { x: b.userData.home.x + (out ? 0.32 : 0), duration: 0.4 * D, ease: 'power2.out' });
      pulled = out ? b : null;
      sound.paper();
    };
    hotspots.reading = {
      group: g,
      stand: { x: -3.9, z: 0.2, look: [-4.65, -1.0] },
      view: { pos: [1.2, 2.3, -0.4], target: [-4.65, 1.7, -1.4] },
      onFocus() {
        pull(books[Math.floor(books.length * 0.45)]);
      },
      onBlur() {
        if (pulled) pull(pulled);
      },
      interact(obj) {
        if (obj.userData.book) pull(obj);
      },
    };
  }

  // ── MUSIC: cabinet, turntable, speaker ────────────────────
  {
    const g = new THREE.Group();
    g.add(at(box(0.8, 0.9, 1.9, C.walnut), 0, 0.55, 0));
    for (const [x, z] of [[-0.3, -0.85], [0.3, -0.85], [-0.3, 0.85], [0.3, 0.85]]) g.add(at(cyl(0.03, 0.03, 0.1, C.dark, 8), x, 0.05, z));
    g.add(at(box(0.02, 0.7, 0.85, C.woodDark), 0.41, 0.55, -0.45), at(box(0.02, 0.7, 0.85, C.woodDark), 0.41, 0.55, 0.45));
    // turntable
    g.add(at(box(0.66, 0.12, 0.78, '#E8DCC4', { roughness: 0.5 }), 0, 1.06, 0));
    const platter = new THREE.Group();
    at(platter, 0, 1.135, -0.05);
    platter.add(at(cyl(0.29, 0.29, 0.03, C.metal, 40, { metalness: 0.6, roughness: 0.35 }), 0, 0, 0));
    const rec = at(cyl(0.275, 0.275, 0.012, '#141414', 48, { roughness: 0.25 }), 0, 0.02, 0);
    platter.add(rec);
    const label = at(cyl(0.085, 0.085, 0.014, '#FF8FA3', 32), 0, 0.022, 0);
    platter.add(label);
    platter.add(at(box(0.04, 0.016, 0.02, '#F2E8D5'), 0.05, 0.03, 0)); // marker so you can see it spin
    g.add(platter);
    const armPivot = new THREE.Group();
    at(armPivot, -0.22, 1.16, 0.28);
    armPivot.add(at(cyl(0.035, 0.035, 0.05, C.metal, 16), 0, 0, 0));
    const arm = at(cyl(0.008, 0.008, 0.42, C.metal, 8, { metalness: 0.7 }), 0, 0.035, -0.21);
    arm.rotation.x = Math.PI / 2;
    armPivot.add(arm, at(box(0.03, 0.02, 0.05, C.dark), 0, 0.03, -0.42));
    armPivot.rotation.y = 0.35;
    g.add(armPivot);
    // records leaning against the cabinet
    for (let i = 0; i < 4; i++) {
      const sleeve = at(box(0.02, 0.6, 0.6, ['#E9C46A', '#9DB8FF', '#FF8FA3', '#F2E8D5'][i]), 0.48 + i * 0.03, 0.3, -1.25);
      sleeve.rotation.z = -0.12;
      g.add(sleeve);
    }
    at(g, -4.55, 0, 2.3);
    root.add(g);

    // speaker on the floor
    const sp = new THREE.Group();
    sp.add(at(box(0.6, 1.1, 0.6, C.dark), 0, 0.55, 0));
    const woofer = at(cyl(0.2, 0.2, 0.04, '#3A3D52', 32), 0.31, 0.4, 0);
    woofer.rotation.z = Math.PI / 2;
    const tweeter = at(cyl(0.08, 0.08, 0.04, '#3A3D52', 24), 0.31, 0.85, 0);
    tweeter.rotation.z = Math.PI / 2;
    sp.add(woofer, tweeter);
    at(sp, -4.5, 0, 3.95);
    root.add(sp);

    // floating notes while playing
    const noteTex = canvasTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#FF8FA3';
      ctx.font = '700 100px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♪', w / 2, h / 2);
    });
    const notes = [0, 1, 2].map((i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex.tex, transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.22);
      s.userData.phase = i / 3;
      root.add(s);
      return s;
    });

    let playing = false;
    let spin = 0;
    const setPlaying = (on) => {
      if (on === playing) return;
      playing = on;
      gsap.to(armPivot.rotation, { y: on ? 0 : 0.35, duration: 0.7 * D, ease: 'power2.inOut' });
      sound.music(on);
    };
    tickers.push((dt, t) => {
      spin = THREE.MathUtils.lerp(spin, playing ? 3.5 : 0, dt * 2);
      platter.rotation.y -= spin * dt;
      woofer.scale.setScalar(playing ? 1 + Math.max(0, Math.sin(t * 16)) * 0.04 : 1);
      notes.forEach((s) => {
        const p = (t * 0.25 + s.userData.phase) % 1;
        s.position.set(-4.35 + Math.sin((p + s.userData.phase) * 6) * 0.15, 1.3 + p * 1.4, 2.3 + (s.userData.phase - 0.5) * 0.6);
        const target = playing ? Math.sin(p * Math.PI) : 0;
        s.material.opacity = THREE.MathUtils.lerp(s.material.opacity, target, dt * 4);
      });
    });

    notes.forEach((s) => (s.raycast = () => {}));

    hotspots.music = {
      group: g,
      extra: [sp],
      stand: { x: -3.3, z: 1.1, look: [-4.4, 2.0] },
      view: { pos: [-1.3, 2.9, 3.9], target: [-4.4, 1.05, 2.6] },
      onFocus() {
        setPlaying(true);
      },
      onBlur() {
        setPlaying(false);
      },
      interact(obj) {
        if ([rec, label, platter.children[0], arm].includes(obj)) setPlaying(!playing);
      },
    };
  }

  // ── CHESS: table, board, pieces ───────────────────────────
  {
    const g = new THREE.Group();
    g.add(at(cyl(1.0, 1.0, 0.08, C.wood, 48, { roughness: 0.55 }), 0, 1.0, 0));
    g.add(at(cyl(0.1, 0.14, 0.95, C.woodDark, 16), 0, 0.5, 0));
    g.add(at(cyl(0.5, 0.55, 0.06, C.woodDark, 32), 0, 0.03, 0));
    const boardTex = canvasTex(512, 512, (ctx, w) => {
      ctx.fillStyle = '#4A2E1E';
      ctx.fillRect(0, 0, w, w);
      const b = w * 0.05;
      const s = (w - 2 * b) / 8;
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
        ctx.fillStyle = (r + f) % 2 ? '#7A4B2E' : '#E9D8A6';
        ctx.fillRect(b + f * s, b + r * s, s, s);
      }
    });
    const bs = mat('#4A2E1E');
    const board = mesh(new THREE.BoxGeometry(1.6, 0.06, 1.6), [bs, bs, mat('#fff', { map: boardTex.tex, roughness: 0.5 }), bs, bs, bs]);
    at(board, 0, 1.07, 0);
    g.add(board);

    const setup = {
      w: 'Ra1 Nb1 Bc1 Qd1 Rf1 Kg1 Bc4 Nf3 Pa2 Pb2 Pc2 Pd3 Pe4 Pf2 Pg2 Ph2',
      b: 'Ra8 Bc8 Qd8 Rf8 Kg8 Bc5 Nc6 Nf6 Pa7 Pb7 Pc7 Pd6 Pe5 Pf7 Pg7 Ph7',
    };
    const pieces = {};
    for (const side of ['w', 'b']) {
      for (const tok of setup[side].split(' ')) {
        const p = piece(tok[0], side === 'w');
        const { x, z } = squarePos(tok.slice(1));
        at(p, x, 1.1, z);
        g.add(p);
        pieces[tok.slice(1)] = p;
      }
    }
    // stools
    for (const [x, z] of [[0, 1.55], [0, -1.55]]) {
      const st = new THREE.Group();
      st.add(at(cyl(0.32, 0.32, 0.08, C.dark, 24), 0, 0.75, 0));
      st.add(at(cyl(0.04, 0.04, 0.7, C.metal, 8, { metalness: 0.7 }), 0, 0.38, 0));
      st.add(at(cyl(0.28, 0.3, 0.04, C.dark, 24), 0, 0.02, 0));
      at(st, x, 0, z);
      g.add(st);
    }
    at(g, 1.9, 0, 1.3);
    root.add(g);

    // rug
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.1, 48), mat('#7B3F57', { roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.receiveShadow = true;
    at(rug, 1.9, 0.005, 1.3);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 1.85, 48), mat('#E9C46A', { roughness: 1 }));
    ring.rotation.x = -Math.PI / 2;
    at(ring, 1.9, 0.008, 1.3);
    root.add(rug, ring);

    const knight = pieces.f3;
    let knightOut = false;
    const hop = (p, to) => {
      if (p.userData.busy) return;
      p.userData.busy = true;
      const tl = gsap.timeline({ onComplete: () => (p.userData.busy = false) });
      const dur = 0.5 * D;
      if (to) tl.to(p.position, { x: to.x, z: to.z, duration: dur, ease: 'power1.inOut' }, 0);
      tl.to(p.position, { y: 1.42, duration: dur / 2, ease: 'power2.out' }, 0)
        .to(p.position, { y: 1.1, duration: dur / 2, ease: 'bounce.out' }, dur / 2)
        .to(p.rotation, { y: p.rotation.y + Math.PI * 2, duration: dur, ease: 'power1.inOut' }, 0)
        .call(() => sound.knock(), null, dur * 0.75);
    };
    const findPiece = (obj) => {
      let o = obj;
      while (o && !o.userData.piece) o = o.parent;
      return o;
    };

    hotspots.chess = {
      group: g,
      stand: { x: 0.5, z: 1.95, look: [1.9, 1.3] },
      view: { pos: [2.0, 3.45, 4.3], target: [1.9, 1.05, 1.15] },
      onFocus() {
        setTimeout(() => {
          knightOut = !knightOut;
          hop(knight, squarePos(knightOut ? 'g5' : 'f3'));
        }, 700 * D);
      },
      interact(obj) {
        const p = findPiece(obj);
        if (p) hop(p);
      },
    };
  }

  // ── plant in the corner ───────────────────────────────────
  {
    const g = new THREE.Group();
    g.add(at(cyl(0.34, 0.26, 0.6, C.ceramic, 24, { roughness: 0.4 }), 0, 0.3, 0));
    g.add(at(cyl(0.3, 0.3, 0.04, '#3A2418', 24), 0, 0.58, 0));
    const leaves = [];
    for (let i = 0; i < 9; i++) {
      const leaf = sphere(0.16, C.leaf, { roughness: 0.6 }, 10);
      leaf.scale.set(0.45, 1.6, 0.25);
      const a = (i / 9) * Math.PI * 2;
      const pivot = new THREE.Group();
      at(pivot, 0, 0.6, 0);
      pivot.rotation.set(Math.cos(a) * 0.55, a, Math.sin(a) * 0.55);
      at(leaf, 0, 0.3 + rand() * 0.15, 0);
      pivot.add(leaf);
      g.add(pivot);
      leaves.push(pivot);
    }
    at(g, 4.2, 0, -4.2);
    root.add(g);
    if (!reduceMotion) tickers.push((dt, t) => leaves.forEach((l, i) => (l.rotation.z += Math.sin(t * 0.8 + i) * 0.0006)));
  }

  // ── dust floating in the lamp light ───────────────────────
  if (!reduceMotion) {
    const N = 140;
    const pos = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = -3 + rand() * 6;
      pos[i * 3 + 1] = 1 + rand() * 3.5;
      pos[i * 3 + 2] = -4.5 + rand() * 6;
      seeds[i] = rand() * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: '#FFD9A0', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    dust.raycast = () => {};
    root.add(dust);
    tickers.push((dt, t) => {
      for (let i = 0; i < N; i++) {
        pos[i * 3 + 1] += Math.sin(t * 0.3 + seeds[i]) * 0.0015;
        pos[i * 3] += Math.cos(t * 0.2 + seeds[i]) * 0.0012;
      }
      geo.attributes.position.needsUpdate = true;
      dust.material.opacity = lamp.on ? 0.55 : 0.15;
    });
  }

  // footprints the character has to walk around (world x/z)
  const obstacles = {
    rects: [
      { x0: -2.05, x1: 2.05, z0: -5, z1: -3.3 }, // desk
      { x0: -5, x1: -4.3, z0: -2.55, z1: -0.25 }, // bookshelf
      { x0: -5, x1: -3.95, z0: 0.7, z1: 3.3 }, // music cabinet + records
      { x0: -4.85, x1: -4.15, z0: 3.6, z1: 4.3 }, // speaker
    ],
    circles: [
      { x: 1.9, z: 1.3, r: 1.0 }, // chess table
      { x: 1.9, z: 2.85, r: 0.33 }, // stools
      { x: 1.9, z: -0.25, r: 0.33 },
      { x: 0.4, z: -2.75, r: 0.45 }, // desk chair
      { x: 4.2, z: -4.2, r: 0.4 }, // plant
    ],
  };

  return {
    root,
    obstacles,
    hotspots,
    lamp,
    tick(dt, t) {
      for (const f of tickers) f(dt, t);
    },
  };
}
