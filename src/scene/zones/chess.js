import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '../../sound.js';
import { mat, mesh, cyl, at, canvasTex } from '../build.js';
import { PIECE_Y, HEIGHT, squarePos, squareAt, piece } from '../chess/pieces.js';
import { parse, movesFrom, apply, inCheck, outcome, chooseMove } from '../chess/rules.js';

// CHESS: a game against the character (spec CHESS-01..06). The visitor plays
// white from the camera side; he plays black from the far stool.

const SETUP = {
  w: 'Ra1 Nb1 Bc1 Qd1 Rf1 Kg1 Bc4 Nf3 Pa2 Pb2 Pc2 Pd3 Pe4 Pf2 Pg2 Ph2',
  b: 'Ra8 Bc8 Qd8 Rf8 Kg8 Bc5 Nc6 Nf6 Pa7 Pb7 Pc7 Pd6 Pe5 Pf7 Pg7 Ph7',
};
const LIFT = 0.1; // how far a selected piece rises
const THINK = 600; // ms he takes before answering
const HIS_STOOL = 1.25; // his stool's distance from the table's centre: as close as his chest allows
const GRIP = 0.06; // his hand's centre sits this far above the top of a piece it holds
const RESET_AFTER = 2600; // ms between the end of a game and the fresh board

export function buildChess({ root, P, D, game = {} }) {
  const CX = 3.6;
  const CZ = 2.6;
  const g = new THREE.Group();
  g.add(at(cyl(0.95, 0.95, 0.08, P.wood, 48, { roughness: 0.55 }), 0, 1.0, 0));
  g.add(at(cyl(0.1, 0.14, 0.95, P.woodDark, 16), 0, 0.5, 0));
  g.add(at(cyl(0.5, 0.55, 0.06, P.woodDark, 32), 0, 0.03, 0));
  const boardTex = canvasTex(512, 512, (ctx, w) => {
    ctx.fillStyle = P.woodDark;
    ctx.fillRect(0, 0, w, w);
    const b = w * 0.05;
    const s = (w - 2 * b) / 8;
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      ctx.fillStyle = (r + f) % 2 ? P.chessDark : P.chessLight;
      ctx.fillRect(b + f * s, b + r * s, s, s);
    }
  });
  const bs = mat(P.woodDark);
  const board = mesh(new THREE.BoxGeometry(1.6, 0.06, 1.6), [bs, bs, mat(P.paper, { map: boardTex.tex, roughness: 0.5 }), bs, bs, bs]);
  at(board, 0, 1.07, 0);
  g.add(board);

  // stools: the visitor's side (+z) and his side (-z), his pulled in so his hand reaches the board
  for (const z of [-HIS_STOOL, 1.45]) {
    const st = new THREE.Group();
    st.add(at(cyl(0.32, 0.32, 0.08, P.accent2, 24), 0, 0.75, 0));
    st.add(at(cyl(0.04, 0.04, 0.7, P.metal, 8, { metalness: 0.7 }), 0, 0.38, 0));
    st.add(at(cyl(0.28, 0.3, 0.04, P.steel, 24), 0, 0.02, 0));
    at(st, 0, 0, z);
    g.add(st);
  }
  at(g, CX, 0, CZ);
  root.add(g);

  // ── the pieces ──────────────────────────────────────────
  const start = parse(SETUP);
  const set = []; // every original piece, for the reset
  for (const [square, p] of Object.entries(start)) {
    const m = piece(p.t, p.c === 'w', P);
    const { x, z } = squarePos(square);
    at(m, x, PIECE_Y, z);
    m.userData.home = square;
    m.userData.type = p.t;
    g.add(m);
    set.push(m);
  }
  let pos = start;
  let onSquare = {}; // square → piece mesh
  const promoted = []; // queens made from pawns, removed on reset
  const place = () => {
    onSquare = {};
    for (const m of set) onSquare[m.userData.home] = m;
  };
  place();

  // markers on the squares a selected piece can reach
  const markerGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20);
  const markerMat = new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.85 });
  const markers = [];
  function showTargets(squares) {
    while (markers.length < squares.length) {
      const mk = new THREE.Mesh(markerGeo, markerMat);
      mk.userData.noGlow = true;
      g.add(mk);
      markers.push(mk);
    }
    markers.forEach((mk, i) => {
      mk.visible = i < squares.length;
      if (!mk.visible) return;
      const { x, z } = squarePos(squares[i]);
      mk.position.set(x, PIECE_Y + 0.012, z);
    });
  }

  // ── moving pieces ───────────────────────────────────────
  let selected = null;
  let targets = [];
  let busy = false; // his turn, an animation, or the reset
  let me = null; // the character and his speech, from the last interaction
  let say = () => {};

  function select(square) {
    deselect();
    selected = square;
    targets = movesFrom(pos, square);
    gsap.to(onSquare[square].position, { y: PIECE_Y + LIFT, duration: 0.15 * D });
    showTargets(targets);
    sound.hover();
  }
  function deselect() {
    if (selected && onSquare[selected]) gsap.to(onSquare[selected].position, { y: PIECE_Y, duration: 0.15 * D });
    selected = null;
    targets = [];
    showTargets([]);
  }

  // slide a piece in an arc to its new square; a capture leaves the board
  function animateMove(from, to, done) {
    const m = onSquare[from];
    const taken = onSquare[to];
    const dest = squarePos(to);
    const dur = 0.45 * D;
    const tl = gsap.timeline({ onComplete: done });
    tl.to(m.position, { x: dest.x, z: dest.z, duration: dur, ease: 'power1.inOut' }, 0)
      .to(m.position, { y: PIECE_Y + 0.22, duration: dur / 2, ease: 'power2.out' }, 0)
      .to(m.position, { y: PIECE_Y, duration: dur / 2, ease: 'power2.in' }, dur / 2)
      .call(() => sound.knock(), null, dur);
    if (taken) tl.to(taken.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.25 * D, onComplete: () => (taken.visible = false) }, dur * 0.8);
    delete onSquare[from];
    onSquare[to] = m;
  }

  // a pawn that reached the last rank is a queen in the rules; swap its piece to match
  function promoteIfNeeded(to) {
    const p = pos[to];
    const m = onSquare[to];
    if (p.t === m.userData.type) return;
    const q = piece(p.t, p.c === 'w', P);
    q.userData.type = p.t;
    q.position.copy(m.position);
    g.add(q);
    m.visible = false;
    onSquare[to] = q;
    promoted.push(q);
  }

  // his move, by hand (CHESS-04): reach to the piece, lift it, carry it over, set it down
  let carrying = null; // { m, h } while the piece rides in his hand
  let handMove = null; // the timeline of a move under way
  const at3 = new THREE.Vector3();
  function overSquare(square, h, lift) {
    const { x, z } = squarePos(square);
    return g.localToWorld(at3.set(x, PIECE_Y + h + GRIP + lift, z)).clone();
  }
  function moveByHand(from, to, done) {
    const m = onSquare[from];
    const taken = onSquare[to];
    const h = HEIGHT[m.userData.type] || 0.2;
    const dest = squarePos(to);
    delete onSquare[from];
    onSquare[to] = m;
    me.reach(overSquare(from, h, 0), overSquare(to, h, 0));
    handMove = gsap.timeline({ onComplete: () => ((handMove = null), done()) });
    handMove
      .call(() => {
        carrying = { m, h };
        me.reach(overSquare(to, h, 0.12));
      }, null, 0.6 * D)
      .call(() => {
        carrying = null;
        gsap.to(m.position, { x: dest.x, y: PIECE_Y, z: dest.z, duration: 0.12 * D, ease: 'power2.in' });
        sound.knock();
        me.reach(null);
      }, null, 1.35 * D)
      .to({}, { duration: 0.3 * D }); // the arm settles back before the visitor's turn
    if (taken) handMove.to(taken.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.25 * D, onComplete: () => (taken.visible = false) }, 1.3 * D);
  }

  // `byHand`: his moves, when he is in his seat to make them
  function play(from, to, next, byHand = false) {
    pos = apply(pos, from, to);
    const after = () => {
      promoteIfNeeded(to);
      next();
    };
    if (byHand && me?.pose === 'play') moveByHand(from, to, after);
    else animateMove(from, to, after);
  }

  // after white moves: game over, or his answer
  function afterWhite() {
    const end = outcome(pos, 'b');
    if (end) return finish(end === 'checkmate' ? game.youWin : game.draw);
    setTimeout(reply, THINK * D);
  }
  function reply() {
    const m = chooseMove(pos, 'b');
    if (!m) return finish(game.draw);
    play(
      m.from,
      m.to,
      () => {
        const end = outcome(pos, 'w');
        if (end) return finish(end === 'checkmate' ? game.iWin : game.draw);
        if (inCheck(pos, 'w')) say(game.check);
        busy = false;
      },
      true
    );
  }

  function finish(line) {
    say(line);
    setTimeout(reset, RESET_AFTER * D);
  }
  function reset() {
    for (const q of promoted) g.remove(q);
    promoted.length = 0;
    for (const m of set) {
      m.visible = true;
      m.scale.setScalar(1);
      const { x, z } = squarePos(m.userData.home);
      gsap.to(m.position, { x, y: PIECE_Y, z, duration: 0.6 * D, ease: 'power2.inOut' });
    }
    pos = start;
    place();
    busy = false;
  }

  const pieceOf = (obj) => {
    let o = obj;
    while (o && !o.userData.piece) o = o.parent;
    return o;
  };
  const squareOfMesh = (m) => Object.keys(onSquare).find((s) => onSquare[s] === m);
  const local = new THREE.Vector3();

  return {
    group: g,
    stand: { x: CX - 1.5, z: CZ - 1.2, look: [CX, CZ] },
    activity: {
      seat: { x: CX, z: CZ - HIS_STOOL, yaw: 0, y: -0.01 },
      pose: 'play',
      // the piece he carries rides under his hand
      update(who) {
        if (!carrying) return;
        g.worldToLocal(who.reachHand(at3));
        carrying.m.position.set(at3.x, at3.y - GRIP - carrying.h, at3.z);
      },
    },
    view: { pos: [CX, 4.1, CZ + 2.7], target: [CX, 1.3, CZ - 0.45] },
    onBlur() {
      deselect();
      handMove?.progress(1); // leaving mid-move: the piece lands at once
    },
    // a click in the close-up: pick up a white piece, or put it on a marked square
    interact(obj, ctx) {
      me = ctx.me;
      say = ctx.say;
      if (busy) return;
      const hitPiece = pieceOf(obj);
      let square = hitPiece ? squareOfMesh(hitPiece) : null;
      if (!square && ctx.point) square = squareAt(g.worldToLocal(local.copy(ctx.point)));
      if (!square) return deselect();
      if (selected && targets.includes(square)) {
        const from = selected;
        deselect();
        busy = true;
        return play(from, square, afterWhite);
      }
      if (pos[square]?.c === 'w' && square !== selected) return select(square);
      deselect();
    },
  };
}

