import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, box, cyl, at, canvasTex } from '../build.js';
import { ZB } from '../layout.js';

// STARS: the window (day and night skies) and the telescope.
export function buildStars({ root, P, rand, D }) {
  const WX = 4.7;
  const WY = 4.3;
  const WW = 2.8;
  const WH = 3.0;
  const daySky = canvasTex(512, 560, (ctx, w, h) => {
    ctx.fillStyle = P.skyDay;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = P.skyCloud;
    for (let i = 0; i < 5; i++) {
      const cx = rand() * w;
      const cy = 60 + rand() * h * 0.6;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(cx + k * 34 - 50, cy + (k % 2) * 8, 46, 26, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = P.moon;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.22, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.leaf;
    for (let x = -20; x < w + 40; x += 46) {
      ctx.beginPath();
      ctx.arc(x, h + 10, 40 + rand() * 30, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // the night sky, with Orion
  const orion = [
    [0.38, 0.28], [0.62, 0.3], [0.46, 0.52], [0.5, 0.53], [0.54, 0.54], [0.36, 0.78], [0.66, 0.76], [0.5, 0.18],
  ];
  const nightSky = canvasTex(512, 560, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, P.skyNight);
    g.addColorStop(1, P.skyNight2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = P.star;
    for (let i = 0; i < 180; i++) {
      ctx.globalAlpha = 0.3 + rand() * 0.7;
      const s = rand() * 2.2 + 0.6;
      ctx.fillRect(rand() * w, rand() * h, s, s);
    }
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = P.star;
    ctx.lineWidth = 2;
    const pt = (i) => [orion[i][0] * w, orion[i][1] * h];
    for (const [a, b] of [[7, 0], [7, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]) {
      ctx.beginPath();
      ctx.moveTo(...pt(a));
      ctx.lineTo(...pt(b));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const [x, y] of orion) {
      ctx.beginPath();
      ctx.arc(x * w, y * h, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const win = new THREE.Group();
  at(win, WX, WY, ZB + 0.02);
  win.add(new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshBasicMaterial({ map: daySky.tex, toneMapped: false })));
  const nightMat = new THREE.MeshBasicMaterial({ map: nightSky.tex, toneMapped: false, transparent: true, opacity: 0 });
  win.add(at(new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), nightMat), 0, 0, 0.005));
  const shootMat = new THREE.MeshBasicMaterial({ color: P.star, transparent: true, opacity: 0, toneMapped: false });
  const shoot = at(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.025), shootMat), 0, 0, 0.01);
  shoot.rotation.z = -0.45;
  win.add(shoot);
  const fr = P.paper;
  win.add(at(box(WW + 0.2, 0.12, 0.12, fr), 0, WH / 2 + 0.05, 0.04), at(box(WW + 0.2, 0.12, 0.12, fr), 0, -WH / 2 - 0.05, 0.04));
  win.add(at(box(0.12, WH + 0.2, 0.12, fr), -WW / 2 - 0.05, 0, 0.04), at(box(0.12, WH + 0.2, 0.12, fr), WW / 2 + 0.05, 0, 0.04));
  win.add(at(box(0.06, WH, 0.06, fr), 0, 0, 0.04), at(box(WW, 0.06, 0.06, fr), 0, 0.3, 0.04));
  win.add(at(box(WW + 0.5, 0.1, 0.36, P.wood), 0, -WH / 2 - 0.12, 0.16));
  for (const s of [-1, 1]) win.add(at(box(0.5, WH + 0.6, 0.1, P.fabric), s * (WW / 2 + 0.4), 0.1, 0.12));
  win.add(at(cyl(0.04, 0.04, WW + 1.6, P.steel, 10), 0, WH / 2 + 0.45, 0.16));
  win.children[win.children.length - 1].rotation.z = Math.PI / 2;
  win.traverse((o) => (o.userData.wall = true));
  root.add(win);

  // telescope on a tripod, aimed at the window
  const scope = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.6, 8);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.3;
    const leg = at(mesh(legGeo, mat(P.woodDark)), Math.cos(a) * 0.35, 1.25, Math.sin(a) * 0.35);
    leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
    scope.add(leg);
  }
  scope.add(at(cyl(0.1, 0.1, 0.16, P.steel, 16), 0, 2.55, 0));
  const tube = new THREE.Group();
  at(tube, 0, 2.7, 0);
  tube.rotation.x = 0.5;
  tube.add(at(cyl(0.13, 0.11, 1.6, P.paper, 24), 0, 0, 0));
  tube.children[0].rotation.x = Math.PI / 2;
  tube.add(at(cyl(0.15, 0.15, 0.18, P.accent2, 24), 0, 0, -0.8));
  tube.children[1].rotation.x = Math.PI / 2;
  tube.add(at(cyl(0.035, 0.035, 0.2, P.steel, 12), 0, 0.08, 0.75));
  scope.add(tube);
  at(scope, 3.0, 0, -3.3);
  scope.rotation.y = -0.45; // towards the window
  root.add(scope);

  let night = false;
  const shootStar = () => {
    gsap.killTweensOf(shoot.position);
    gsap.killTweensOf(shootMat);
    shoot.position.set(-WW / 2 + 0.4, WH / 2 - 0.3, 0.01);
    gsap.to(shoot.position, { x: WW / 2 - 0.3, y: -0.2, duration: 0.9 * D, ease: 'power1.in' });
    gsap.fromTo(shootMat, { opacity: 0 }, { opacity: 1, duration: 0.45 * D, yoyo: true, repeat: 1 });
    sound.toggle();
  };
  return {
    group: scope,
    stand: { x: 2.2, z: -1.6, look: [WX, ZB] },
    view: { pos: [-0.8, 3.4, -1.0], target: [3.3, 2.5, -3.0] },
    activity: { seat: { x: 2.38, z: -2.0, yaw: Math.PI - 0.45, y: 0 }, pose: 'scope' },
    onFocus() {
      night = true;
      gsap.to(nightMat, { opacity: 1, duration: 1.2 * D });
      gsap.to(tube.rotation, { x: 0.72, duration: 0.8 * D, ease: 'power2.inOut' });
      setTimeout(shootStar, 1200 * D);
    },
    onBlur() {
      night = false;
      gsap.to(nightMat, { opacity: 0, duration: 0.8 * D });
      gsap.to(tube.rotation, { x: 0.5, duration: 0.6 * D });
    },
    interact(obj, ctx) {
      if (night) shootStar();
      ctx?.openSky?.();
    },
  };
}
