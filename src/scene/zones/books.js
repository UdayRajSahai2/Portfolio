import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, box, cyl, at, canvasTex } from '../build.js';
import { ZB } from '../layout.js';

// BOOKS: the bookshelf, the reading chair and the book club stack.
// His books (`reading` and `shelf` from content.js) stand among plain fillers,
// each with its title on the spine (ACT-08).
export function buildBooks({ root, P, rand, D, font, reading, shelf = [] }) {
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
  // a titled spine's cloth and lettering, chosen so the title stays readable
  const spines = [[P.accent2, P.paper], [P.accent3, P.ink], [P.woodDark, P.paper], [P.accent, P.ink], [P.fabric, P.paper], [P.mint, P.ink], [P.kraft, P.ink], [P.sugar, P.ink]];
  const spineMat = (b, [cloth, ink], bw, bh) => {
    const w = 96;
    const h = Math.round((w * bh) / bw);
    const { tex } = canvasTex(w, h, (ctx) => {
      ctx.fillStyle = cloth;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, h * 0.05, w, 4);
      ctx.fillRect(0, h * 0.95 - 4, w, 4);
      ctx.globalAlpha = 1;
      // read top to bottom, as English spines are, shrunk to fit a long title
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 40px ${font}`;
      const fit = Math.min(1, (h * 0.8) / ctx.measureText(b.title).width);
      ctx.font = `600 ${Math.max(16, Math.floor(40 * fit))}px ${font}`;
      ctx.fillText(b.title, 0, 2);
    });
    const side = mat(cloth, { roughness: 0.85 });
    return [side, side, side, side, mat(P.paper, { map: tex, roughness: 0.85 }), side];
  };

  // his books, spread over the four shelves; the one he is reading now sits at eye height
  const perLevel = [[], [], [], []];
  shelf.filter((b) => b?.title).forEach((b, i) => perLevel[i % 4].push(b));
  if (reading?.title) perLevel[2].splice(2, 0, reading);
  let titled = 0;

  const books = [];
  levels.slice(0, 4).forEach((y, li) => {
    const mine = perLevel[li];
    const end = W / 2 - (li % 2 ? 0.32 : 0.15); // odd shelves end in a flat stack
    const slot = (end + W / 2 - 0.3) / Math.max(1, mine.length);
    let next = 0;
    let x = -W / 2 + 0.05;
    while (x < end) {
      const due = next < mine.length && x >= -W / 2 + 0.05 + (next + 0.3) * slot;
      if (!due && rand() < 0.06) {
        x += 0.2;
        continue;
      }
      const data = due ? mine[next++] : null;
      const bw = data ? 0.12 + rand() * 0.02 : 0.06 + rand() * 0.07;
      const bh = data ? 0.64 + rand() * 0.1 : 0.5 + rand() * 0.28;
      const bd = data ? 0.44 + rand() * 0.06 : 0.38 + rand() * 0.12;
      const look = data && spines[titled++ % spines.length];
      const b = data
        ? mesh(new THREE.BoxGeometry(bw, bh, bd), spineMat(data, look, bw, bh))
        : box(bw, bh, bd, bookColors[Math.floor(rand() * bookColors.length)], { roughness: 0.85 });
      at(b, x + bw / 2, y + 0.03 + bh / 2, -Dp / 2 + 0.06 + bd / 2);
      b.userData.book = true;
      b.userData.home = b.position.clone();
      if (data) {
        b.userData.read = data;
        // what the book in his hands shows: this one's title, and the cloth and lettering of its spine
        b.userData.held = { title: data.title, by: data.by, cloth: look[0], ink: look[1] };
        b.userData.label = `${data.title}, ${data.by}`; // the hover label in the close-up
      }
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

  // reading chair: a low lounge seat (cushion top at 0.42), as deep as his
  // thigh, so his knees sit at the front edge and his feet rest on the floor
  const ch = new THREE.Group();
  ch.add(at(box(1.3, 0.18, 0.77, P.fabric2), 0, 0.19, -0.165));
  ch.add(at(box(1.0, 0.14, 0.58, P.paper), 0, 0.35, -0.03));
  ch.add(at(box(1.3, 1.0, 0.26, P.fabric2), 0, 0.78, -0.45));
  for (const s of [-1, 1]) ch.add(at(box(0.2, 0.62, 0.81, P.fabric2), s * 0.6, 0.41, -0.145));
  for (const [x, z] of [[-0.55, -0.45], [0.55, -0.45], [-0.55, 0.15], [0.55, 0.15]]) ch.add(at(cyl(0.04, 0.03, 0.1, P.woodDark, 8), x, 0.05, z));
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
  let visit = 0; // bumps on each visit and each leave, so a late timer can tell it is stale
  const current = books.find((b) => b.userData.read === reading) || books[0];
  let chosen = current; // the book he reads on this visit
  let taken = null; // the book off the shelf, in his hands
  // what he says about a book: its one line, or else its name
  const lineFor = (b) => b.about || `${b.title}, ${b.by}`;
  return {
    group: g,
    extra: [ch, side],
    stand: { x: -5.3, z: -3.2, look: [-5.6, -5] },
    view: { pos: [-2.2, 3.4, 0.4], target: [-4.6, 1.5, -3.8] },
    activity: {
      // hips against the back cushion; y drops the hips to the low seat
      seat: { x: -3.717, z: -3.347, yaw: 0.35, y: -0.37 },
      pose: 'read',
      hold: 'book',
      get held() {
        return chosen.userData.held || reading;
      },
      // pull it out, then take it off the shelf (out of the scene, so it stops catching clicks)
      prepare(next) {
        const mine = ++visit;
        taken = chosen;
        pull(taken);
        setTimeout(() => {
          if (mine !== visit) return; // he left before taking it
          taken.removeFromParent();
          next();
        }, 600 * D);
      },
      release() {
        visit++;
        if (!taken) return;
        g.add(taken);
        gsap.killTweensOf(taken.position);
        taken.position.copy(taken.userData.home);
        if (pulled === taken) pulled = null;
        taken = null;
      },
    },
    onBlur() {
      if (pulled) pull(pulled);
      chosen = current; // the next visit starts with what he is reading now
    },
    // a filler only slides out; one of his books goes to the chair with him
    interact(obj, { again, say, showBook }) {
      if (!obj.userData.book) return;
      const data = obj.userData.read;
      if (!data) return pull(obj);
      if (obj === chosen) return;
      chosen = obj;
      again(() => {
        say(lineFor(data), 6000);
        showBook(data);
      });
    },
  };
}
