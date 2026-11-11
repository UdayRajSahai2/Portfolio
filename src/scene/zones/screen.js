import * as THREE from 'three';
import { sound } from '../../sound.js';
import { mat, box, cyl, at, canvasTex } from '../build.js';
import { X1 } from '../layout.js';
import { makeTV } from '../screens/tv.js';

// SCREEN: the TV, its console, the sofa and two posters.
export function buildScreen({ root, P, tickers, font, channels }) {
  const tv = makeTV(P, font, channels);
  const g = new THREE.Group();
  g.add(at(box(0.1, 1.95, 3.3, P.screen, { roughness: 0.4 }), 0, 0, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.75), new THREE.MeshBasicMaterial({ map: tv.tex, toneMapped: false }));
  scr.rotation.y = -Math.PI / 2;
  scr.userData.noGlow = true;
  at(scr, -0.065, 0, 0); // 1.5 cm off the set, so the two never flicker
  g.add(scr);
  at(g, X1 - 0.1, 3.3, -0.6);
  root.add(g);
  tickers.push((dt) => tv.tick(dt));

  const console_ = new THREE.Group();
  console_.add(at(box(0.7, 0.6, 2.8, P.wood), 0, 0.42, 0));
  for (const z of [-1.2, 1.2]) console_.add(at(cyl(0.03, 0.03, 0.12, P.woodDark, 8), 0, 0.06, z));
  console_.add(at(box(0.02, 0.4, 1.2, P.woodDark), -0.36, 0.42, -0.65), at(box(0.02, 0.4, 1.2, P.woodDark), -0.36, 0.42, 0.65));
  at(console_, X1 - 0.4, 0, -0.6);
  root.add(console_);

  const sofa = new THREE.Group();
  sofa.add(at(box(2.9, 0.5, 1.15, P.fabric), 0, 0.4, 0));
  sofa.add(at(box(2.9, 1.0, 0.3, P.fabric), 0, 0.95, -0.45));
  for (const s of [-1, 1]) sofa.add(at(box(0.26, 0.75, 1.15, P.fabric), s * 1.42, 0.62, 0));
  for (const s of [-1, 1]) sofa.add(at(box(1.2, 0.16, 0.85, P.sugar), s * 0.62, 0.72, 0.1));
  const pillow = at(box(0.5, 0.45, 0.14, P.cushion), -0.9, 1.0, -0.22);
  pillow.rotation.z = 0.2;
  sofa.add(pillow);
  for (const [x, z] of [[-1.3, -0.45], [1.3, -0.45], [-1.3, 0.45], [1.3, 0.45]]) sofa.add(at(cyl(0.04, 0.03, 0.15, P.woodDark, 8), x, 0.075, z));
  at(sofa, 4.5, 0, -0.6);
  sofa.rotation.y = Math.PI / 2;
  root.add(sofa);

  // two framed posters (abstract, no real artwork)
  const posters = [
    (ctx, w, h) => {
      ctx.fillStyle = P.ink;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = P.accent3;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.45, w * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = P.accent;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
    },
    (ctx, w, h) => {
      ctx.fillStyle = P.accent;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = P.accent2;
      ctx.lineWidth = 6;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(-20, h * 0.15 + i * 34);
        ctx.lineTo(w + 20, h * 0.05 + i * 34 + 40);
        ctx.stroke();
      }
      ctx.fillStyle = P.ink;
      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.78, w * 0.12, 0, Math.PI * 2);
      ctx.fill();
    },
  ];
  posters.forEach((draw, i) => {
    const t = canvasTex(256, 360, draw);
    const pg = new THREE.Group();
    pg.add(at(box(0.06, 1.62, 1.18, P.paper), 0, 0, 0));
    const art = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.42), mat(P.paper, { map: t.tex, roughness: 0.9 }));
    art.rotation.y = -Math.PI / 2;
    at(art, -0.045, 0, 0); // 1.5 cm off the board
    pg.add(art);
    at(pg, X1 - 0.04, 3.6, i === 0 ? 2.5 : -3.5);
    pg.traverse((o) => (o.userData.wall = true));
    root.add(pg);
  });

  return {
    group: g,
    extra: [sofa, console_],
    stand: { x: 3.4, z: 0.4, look: [X1, -0.6] },
    view: { pos: [2.4, 4.4, 3.8], target: [6.0, 2.0, -0.9] },
    activity: { seat: { x: 4.45, z: -1.22, yaw: Math.PI / 2, y: -0.02 }, pose: 'remote', hold: 'remote' },
    onFocus() {
      tv.active = true;
      sound.music(true);
    },
    onBlur() {
      tv.active = false;
      sound.music(false);
    },
    interact(obj, ctx) {
      if (obj === scr) {
        ctx?.me?.click();
        tv.next();
        sound.toggle();
      }
    },
  };
}
