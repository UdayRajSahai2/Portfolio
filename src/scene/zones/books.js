import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, box, cyl, at } from '../build.js';
import { ZB } from '../layout.js';

// BOOKS: the bookshelf, the reading chair and the book club stack.
export function buildBooks({ root, P, rand, D }) {
  const g = new THREE.Group();
  const W = 2.5;
  const SH = 3.6;
  const Dp = 0.6;
  const shelfMat = mat(P.wood);
  g.add(at(box(0.06, SH, Dp, shelfMat), -W / 2 - 0.03, SH / 2, 0));
  g.add(at(box(0.06, SH, Dp, shelfMat), W / 2 + 0.03, SH / 2, 0));
  g.add(at(box(W, SH, 0.04, P.woodDark), 0, SH / 2, -Dp / 2 + 0.02));
  const levels = [0.03, 0.92, 1.81, 2.7, 3.57];
  levels.forEach((y) => g.add(at(box(W, 0.06, Dp, shelfMat), 0, y, 0)));
  const bookColors = [P.accent, P.accent2, P.accent3, P.mint, P.fabric, P.kraft, P.sugar, P.woodDark, P.paper, P.rugEdge];
  const books = [];
  levels.slice(0, 4).forEach((y, li) => {
    let x = -W / 2 + 0.05;
    while (x < W / 2 - 0.15) {
      if (rand() < 0.06) {
        x += 0.2;
        continue;
      }
      const bw = 0.06 + rand() * 0.07;
      const bh = 0.5 + rand() * 0.28;
      const bd = 0.38 + rand() * 0.12;
      const b = box(bw, bh, bd, bookColors[Math.floor(rand() * bookColors.length)], { roughness: 0.85 });
      at(b, x + bw / 2, y + 0.03 + bh / 2, -Dp / 2 + 0.06 + bd / 2);
      b.userData.book = true;
      b.userData.home = b.position.clone();
      g.add(b);
      books.push(b);
      x += bw + 0.005;
    }
    if (li % 2 === 1) {
      for (let s = 0; s < 3; s++) g.add(at(box(0.26, 0.06, 0.36, bookColors[(s + li) % bookColors.length]), W / 2 - 0.17, y + 0.06 + s * 0.06, 0));
    }
  });
  at(g, -5.6, 0, ZB + Dp / 2);
  root.add(g);

  // reading chair
  const ch = new THREE.Group();
  ch.add(at(box(1.3, 0.5, 1.1, P.fabric2), 0, 0.35, 0));
  ch.add(at(box(1.0, 0.16, 0.85, P.paper), 0, 0.68, 0.08));
  ch.add(at(box(1.3, 1.0, 0.26, P.fabric2), 0, 1.0, -0.45));
  for (const s of [-1, 1]) ch.add(at(box(0.2, 0.42, 1.1, P.fabric2), s * 0.6, 0.78, 0));
  for (const [x, z] of [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.45], [0.55, 0.45]]) ch.add(at(cyl(0.04, 0.03, 0.12, P.woodDark, 8), x, 0.06, z));
  at(ch, -3.7, 0, -3.3);
  ch.rotation.y = 0.35;
  root.add(ch);

  // side table with the book club's current stack and a mug
  const side = new THREE.Group();
  side.add(at(cyl(0.38, 0.38, 0.06, P.wood, 28), 0, 1.0, 0));
  side.add(at(cyl(0.05, 0.05, 1.0, P.woodDark, 10), 0, 0.5, 0));
  side.add(at(cyl(0.25, 0.28, 0.04, P.woodDark, 20), 0, 0.02, 0));
  [P.accent2, P.accent, P.mint].forEach((c, i) => {
    const b = at(box(0.42, 0.07, 0.3, c), 0, 1.07 + i * 0.07, 0);
    b.rotation.y = (rand() - 0.5) * 0.5;
    side.add(b);
  });
  at(side, -2.4, 0, -3.9);
  root.add(side);

  let pulled = null;
  const pull = (b) => {
    if (pulled && pulled !== b) gsap.to(pulled.position, { z: pulled.userData.home.z, duration: 0.35 * D });
    const out = pulled !== b;
    gsap.to(b.position, { z: b.userData.home.z + (out ? 0.32 : 0), duration: 0.4 * D, ease: 'power2.out' });
    pulled = out ? b : null;
    sound.paper();
  };
  // the book he is reading now sits at eye height on the second shelf
  let visit = 0; // bumps on each visit and each leave, so a late timer can tell it is stale
  const reading = books.find((b) => b.position.y > 1.81 && b.position.y < 2.7) || books[0];
  return {
    group: g,
    extra: [ch, side],
    stand: { x: -5.3, z: -3.2, look: [-5.6, -5] },
    view: { pos: [-2.2, 3.4, 0.4], target: [-4.6, 1.5, -3.8] },
    activity: {
      seat: { x: -3.75, z: -3.44, yaw: 0.35, y: -0.05 },
      pose: 'read',
      hold: 'book',
      // pull it out, then take it off the shelf
      prepare(next) {
        const mine = ++visit;
        pull(reading);
        setTimeout(() => {
          if (mine !== visit) return; // he left before taking it
          reading.visible = false;
          next();
        }, 600 * D);
      },
      release() {
        visit++;
        reading.visible = true;
        reading.position.copy(reading.userData.home);
        if (pulled === reading) pulled = null;
      },
    },
    onBlur() {
      if (pulled) pull(pulled);
    },
    interact(obj) {
      if (obj.userData.book) pull(obj);
    },
  };
}
