import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { buildRoom } from '../scene/room.js';
import { createCharacter } from '../scene/character/character.js';
import { createNav } from '../scene/nav.js';
import { token } from '../scene/palette.js';
import { sound } from '../sound.js';
import { FOV, introView, homeView, introShift, panelShift, fitFactor, clampToRoom } from './framing.js';
import { ownMaterials, createGlow, hotspotOf } from './glow.js';
import { createActivities } from './activities.js';
import { createSkyView } from './skyView.js';

// The 3D side of the site: renderer, room, character, camera, picking,
// walking, close-ups, the door sequence and the frame loop.
// `select`, `labelOf` and `lineFor` come from main.js, which owns the list of sections.
export function createWorld({ ui, content, font, reduceMotion, select, labelOf, lineFor }) {
  const { profile, interests, avatar, monitorFiles, languages } = content;
  const books = interests.find((i) => i.reading);
  const M = reduceMotion ? 0.01 : 1; // tween duration scale

  // ── renderer and scene ──────────────────────────────────
  const canvas = document.getElementById('scene');
  // logarithmic depth: surfaces that lie close together (the rug, the doormat, screens,
  // posters) stay apart at any distance, even on phones with little depth precision (ROOM-08)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  // a near plane of 0.3 (not 0.1) triples depth precision; no view comes closer than that
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.3, 200);

  const room = buildRoom(scene, {
    monitorFiles,
    languages,
    labels: { sign: profile.hello.sign, mat: profile.hello.mat },
    channels: interests.find((i) => i.channels)?.channels || [],
    game: interests.find((i) => i.game)?.game || {},
    reading: books?.reading,
    shelf: books?.shelf,
    font,
    reduceMotion,
  });
  const { entrance, hotspots, lamp } = room;
  const nav = createNav({ ...room.obstacles, bounds: room.bounds });

  const me = createCharacter(avatar, {
    reduceMotion,
    font,
    book: books?.reading,
    colors: { paper: token('--room-paper'), ink: token('--color-ink'), muted: token('--color-muted'), cover: token('--color-accent-2') },
  });
  me.group.userData.hotspot = 'me';
  scene.add(me.group);

  const activities = createActivities({ hotspots, me });

  // ROOM-07: day or night by the visitor's clock; the Night toggle switches it for the visit
  const hour = new Date().getHours();
  let night = hour < 6 || hour >= 18;
  room.setNight(night, false);
  ui.syncTime(night);

  // rings on the floor: where you point, and where he is heading
  const ACCENT = token('--color-accent');
  const ringGeo = new THREE.RingGeometry(0.2, 0.28, 40);
  const makeRing = (opacity) => {
    const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity, depthWrite: false }));
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.05; // clear of the rug, which lies just above the floor
    r.raycast = () => {};
    r.visible = false;
    scene.add(r);
    return r;
  };
  const hoverRing = makeRing(0.5);
  const destRing = makeRing(0.95);

  // ── camera ──────────────────────────────────────────────
  // phase: 'intro' (outside the door), 'entering', 'room'
  let phase = 'intro';
  let focusedId = null;
  let roomCamPos = null;
  let roomTarget = null; // what the room view looked at before a close-up
  let homeTarget = homeView().target;

  const start = introView(entrance.door.z);
  camera.position.copy(start.pos);
  const look = start.target.clone(); // what the camera looks at while a tween drives it

  const controls = new OrbitControls(camera, canvas);
  // the view glides to a stop, unless motion is reduced (A11Y-03): then it stops where you let go
  Object.assign(controls, { enableDamping: !reduceMotion, dampingFactor: 0.07, enablePan: false, rotateSpeed: 0.5, zoomSpeed: 0.8, enabled: false });

  // In the room the view goes all the way round (ROOM-04). In a close-up it stays on
  // what the close-up frames: pinch or scroll to zoom, drag to look a little either side (UI-07).
  function orbitRoom() {
    Object.assign(controls, { minDistance: 7, maxDistance: 32, minPolarAngle: 0.95, maxPolarAngle: 1.42, minAzimuthAngle: -Infinity, maxAzimuthAngle: Infinity });
    controls.target.copy(look);
    controls.enabled = true;
  }
  const around = new THREE.Spherical();
  function orbitCloseUp() {
    around.setFromVector3(camera.position.clone().sub(look));
    Object.assign(controls, {
      minDistance: around.radius * 0.4,
      maxDistance: around.radius * 1.2,
      minPolarAngle: Math.max(0.2, around.phi - 0.35),
      maxPolarAngle: Math.min(1.45, around.phi + 0.2),
      minAzimuthAngle: around.theta - 0.45,
      maxAzimuthAngle: around.theta + 0.45,
    });
    controls.target.copy(look);
    controls.enabled = true;
  }

  // the scene slides aside for the intro text or an open panel
  const viewShift = { x: 0, y: 0 };
  function updateViewShift(animate = true) {
    const s = phase === 'intro' ? introShift() : panelShift(ui.panelRect());
    gsap.to(viewShift, { x: s.x, y: s.y, duration: animate ? 0.9 * M : 0, ease: 'power3.inOut' });
  }

  function flyTo(pos, target, { duration = 1.4, onComplete } = {}) {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(look);
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: duration * M, ease: 'power3.inOut' });
    gsap.to(look, { x: target.x, y: target.y, z: target.z, duration: duration * M, ease: 'power3.inOut', onComplete });
  }

  // ── hotspots and hover glow ─────────────────────────────
  const setGlow = createGlow(ACCENT);
  const groupsOf = (h) => [h.group, ...(h.extra || [])];
  for (const [id, h] of Object.entries(hotspots)) {
    ownMaterials(groupsOf(h));
    for (const g of groupsOf(h)) g.userData.hotspot = id;
  }
  ownMaterials([lamp.group]);
  lamp.group.userData.hotspot = 'lamp';

  const groupsFor = (id) => {
    if (id === 'lamp') return [lamp.group];
    if (id === 'me') return [me.group];
    return hotspots[id] ? groupsOf(hotspots[id]) : [];
  };

  // ── picking ─────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    if (phase !== 'room') {
      const hit = phase === 'intro' && raycaster.intersectObject(me.group, true)[0];
      return hit ? { id: 'me', object: hit.object } : null;
    }
    if (focusedId) {
      const near = raycaster.intersectObjects([...groupsFor(focusedId), lamp.group], true)[0];
      if (near) return { id: hotspotOf(near.object), object: near.object, point: near.point };
    }
    const hit = raycaster.intersectObjects([room.root, me.group], true)[0];
    if (!hit) return null;
    const id = hotspotOf(hit.object);
    if (id) return { id, object: hit.object };
    if (focusedId) return null; // in a close-up, empty space closes it
    if (hit.object.userData.wall) return null;
    return { id: 'floor', point: hit.point, onFloor: !!hit.object.userData.floor };
  }

  function setHovered(next, clientX, clientY) {
    const prevId = hovered?.id;
    const nextId = next?.id;
    const glowable = (id) => id && id !== 'floor' && id !== focusedId;
    if (prevId !== nextId) {
      if (glowable(prevId)) groupsFor(prevId).forEach((g) => setGlow(g, false));
      if (glowable(nextId)) {
        groupsFor(nextId).forEach((g) => setGlow(g, true));
        sound.hover();
      }
    }
    hovered = next;

    const onFreeFloor = nextId === 'floor' && next.onFloor && nav.isFreeAt(next.point.x, next.point.z);
    hoverRing.visible = onFreeFloor;
    if (onFreeFloor) hoverRing.position.set(next.point.x, hoverRing.position.y, next.point.z);

    const clickable = next && nextId !== 'floor' && (nextId !== focusedId || hotspots[nextId]?.interact);
    canvas.style.cursor = clickable ? 'pointer' : phase !== 'room' ? 'default' : nextId === 'floor' && !focusedId ? 'crosshair' : 'grab';
    // in a close-up, a part with its own name (a book on the shelf) shows that name
    const named = focusedId && next?.object?.userData.label;
    ui.tip(phase === 'room' ? named || (glowable(nextId) ? labelOf(nextId) : null) : null, clientX, clientY);
  }

  const setPointer = (e) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  // px a press may move and still count as a click; a fingertip wanders more than a mouse
  const dragLimit = (e) => (e.pointerType === 'mouse' ? 6 : 14);
  let down = null;
  const touching = new Set(); // pointers on the canvas now; two or more is a pinch, never a click
  let pinched = false;

  canvas.addEventListener('pointerdown', (e) => {
    touching.add(e.pointerId);
    if (touching.size > 1) pinched = true;
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointercancel', (e) => {
    touching.delete(e.pointerId);
    down = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    if (skyView.isOpen) return;
    setPointer(e);
    if (e.pointerType === 'mouse' && !(down && e.buttons)) setHovered(pick(), e.clientX, e.clientY);
    if (down && e.buttons && Math.hypot(e.clientX - down.x, e.clientY - down.y) > dragLimit(e)) {
      if (controls.enabled) canvas.style.cursor = 'grabbing';
      hoverRing.visible = false;
    }
  });
  canvas.addEventListener('pointerleave', () => setHovered(null));
  canvas.addEventListener('pointerup', (e) => {
    touching.delete(e.pointerId);
    const wasPinch = pinched;
    if (!touching.size) pinched = false;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (wasPinch || moved > dragLimit(e) || skyView.isOpen) return;
    setPointer(e);
    onClick(pick(), e.pointerType !== 'mouse');
  });

  // a touch has no hover, so what was tapped lights up for a moment: the tap is felt at once
  function flash(id) {
    const groups = groupsFor(id);
    groups.forEach((g) => setGlow(g, true));
    setTimeout(() => {
      if (hovered?.id !== id) groups.forEach((g) => setGlow(g, false));
    }, 280);
  }

  function onClick(hit, touch = false) {
    if (phase === 'intro') {
      if (hit?.id === 'me') {
        me.waveLoop();
        sound.open();
      }
      return;
    }
    if (phase !== 'room') return;
    if (!hit) {
      if (focusedId) ui.requestClose();
      return;
    }
    if (hit.id === 'lamp') return lamp.toggle();
    if (focusedId && hit.id === focusedId) return hotspots[hit.id]?.interact?.(hit.object, closeUp(hit));
    if (focusedId) return select(hit.id === 'me' ? 'about' : hit.id); // another zone: go straight there
    if (hit.id === 'me') return introduce();
    if (hit.id === 'floor') {
      ui.dismissHint();
      return walkFree(hit.point);
    }
    if (touch) flash(hit.id);
    select(hit.id);
  }

  // what a zone's close-up click may ask of the world
  function closeUp(hit) {
    const id = focusedId;
    return {
      me,
      point: hit.point,
      openSky: skyView.open,
      say: (line, ms = 2400) => line && ui.say(line, ms),
      // play the zone's activity again from the top; `onSeated` runs once he has sat down
      again(onSeated) {
        const mine = walk;
        activities.again(id, () => mine === walk, onSeated);
      },
      showBook: (book) => ui.showReading(book),
    };
  }

  // ── walking and close-ups ───────────────────────────────
  // `walk` bumps whenever a new walk or a close replaces the old plan, so
  // callbacks from the old plan can tell they are stale.
  let walk = 0;
  let pending = null;
  let skipTalk = null;

  function walkTo(x, z, onArrive) {
    const path = nav.find(me.position, { x, z });
    if (!path?.length) {
      destRing.visible = false;
      onArrive?.();
      return;
    }
    const end = path[path.length - 1];
    destRing.position.set(end.x, destRing.position.y, end.z);
    destRing.visible = true;
    me.followPath(path, () => {
      destRing.visible = false;
      onArrive?.();
    });
  }

  // a close-up of the character himself, for About
  function viewOfMe() {
    const p = me.position;
    const dir = new THREE.Vector3(camera.position.x - p.x, 0, camera.position.z - p.z).normalize();
    const target = new THREE.Vector3(p.x, 2.1, p.z);
    const f = fitFactor();
    return { pos: clampToRoom(target.clone().addScaledVector(dir, 6.5 * f).add(new THREE.Vector3(0, 1.2 * f, 0))), target };
  }

  function enterFocus(id) {
    ui.open(id);
    sound.open();
    if (hovered) setHovered(null);
    if (controls.enabled && !focusedId) {
      roomCamPos = camera.position.clone();
      roomTarget = controls.target.clone();
    }
    controls.enabled = false;
    focusedId = id;
    updateViewShift();
    // once the camera has arrived, the close-up can be zoomed and turned a little
    const settle = () => focusedId === id && orbitCloseUp();
    if (id === 'about') {
      const v = viewOfMe();
      me.faceTowards(v.pos.x, v.pos.z);
      flyTo(v.pos, v.target, { duration: 1.0, onComplete: settle });
      return;
    }
    const h = hotspots[id];
    if (!h) return;
    const target = new THREE.Vector3(...h.view.target);
    const pos = new THREE.Vector3(...h.view.pos);
    clampToRoom(pos.sub(target).multiplyScalar(fitFactor()).add(target));
    flyTo(pos, target, { duration: 1.1, onComplete: settle });
    h.onFocus?.();
    const mine = walk;
    activities.start(id, () => mine === walk);
  }

  function leaveFocus() {
    walk++; // a walk to a seat still under way must not sit him down
    skyView.close();
    controls.enabled = false;
    activities.leave(focusedId);
    hotspots[focusedId]?.onBlur?.();
    focusedId = null;
    updateViewShift();
    flyTo(roomCamPos || homeView().pos, roomTarget || homeTarget, { duration: 1.0, onComplete: orbitRoom });
  }

  function goTo(id) {
    if (ui.current === id || pending === id) return;
    skipTalk = null;
    if (ui.current) {
      ui.close({ restoreFocus: false });
      sound.close();
      leaveFocus();
    }
    const mine = ++walk;
    const h = hotspots[id];
    if (!h?.stand) return enterFocus(id);
    pending = id;
    ui.setPending(id);
    walkTo(h.stand.x, h.stand.z, () => {
      if (mine !== walk) return;
      pending = null;
      ui.setPending(null);
      me.faceTowards(...h.stand.look);
      const line = lineFor(id);
      if (line) ui.say(line, 2000);
      setTimeout(() => {
        if (mine === walk) enterFocus(id);
      }, 250 * M);
    });
  }

  function walkFree(point) {
    walk++;
    if (activities.current) activities.stop();
    pending = null;
    ui.setPending(null);
    walkTo(point.x, point.z);
  }

  // clicking the character: a few lines about himself, then About
  function introduce() {
    if (skipTalk) return skipTalk();
    walk++;
    if (activities.current) activities.stop();
    me.stop();
    destRing.visible = false;
    me.faceTowards(camera.position.x, camera.position.z);
    me.wave(2.2);
    sound.open();
    skipTalk = ui.sayLines(avatar.introLines, () => {
      skipTalk = null;
      select('about');
    });
  }

  // ── the telescope ───────────────────────────────────────
  let skyPaused = false;
  const skyView = createSkyView({
    ui,
    sound,
    canvas,
    font,
    reduceMotion,
    colors: {
      night: token('--room-sky-night'),
      star: token('--room-star'),
      bright: token('--color-paper'),
      line: token('--color-accent'),
      label: token('--color-accent'),
    },
    // the sky shares the canvas, so the room's controls rest while it is open
    onOpen: () => {
      if (hovered) setHovered(null);
      skyPaused = controls.enabled;
      controls.enabled = false;
    },
    onClose: () => {
      if (skyPaused && focusedId) controls.enabled = true;
      skyPaused = false;
    },
  });

  // ── the door ────────────────────────────────────────────
  function welcome() {
    me.faceTowards(camera.position.x, camera.position.z);
    me.wave();
    ui.say(avatar.welcome, 3600);
  }
  function finishEntry() {
    phase = 'room';
    ui.leaveIntro();
    look.copy(homeTarget);
    orbitRoom();
  }

  // ── leaving (INTRO-07): he walks you out, the wall rises, the door closes, he says goodbye ──
  let helloAgain = null;
  function leaveRoom() {
    if (phase !== 'room') return;
    if (ui.current) {
      ui.close({ restoreFocus: false });
      sound.close();
      leaveFocus();
    }
    phase = 'leaving';
    walk++;
    pending = null;
    skipTalk = null;
    ui.setPending(null);
    ui.hideBubble();
    if (hovered) setHovered(null);
    controls.enabled = false;
    destRing.visible = hoverRing.visible = false;
    if (activities.current) activities.stop();
    me.stop();
    ui.startLeavingRoom();
    updateViewShift();
    const out = introView(entrance.door.z);

    if (reduceMotion) {
      entrance.raise(0);
      entrance.close();
      me.place(entrance.stepOutside.x, entrance.stepOutside.z, 0);
      camera.position.copy(out.pos);
      look.copy(out.target);
      return goodbye();
    }

    // the camera goes back outside while he crosses the room; once both are there,
    // he walks out through the door and it closes behind him
    let waiting = 2;
    const through = () => {
      if (--waiting) return;
      me.followPath([{ x: entrance.door.x, z: entrance.door.z - 0.8 }, entrance.threshold], () => {
        entrance.close();
        me.followPath([entrance.stepOutside], goodbye);
      });
    };
    entrance.raise(1.1);
    flyTo(out.pos, out.target, { duration: 2.2, onComplete: through });
    const toDoor = nav.find(me.position, entrance.inside);
    if (toDoor?.length) me.followPath(toDoor, through);
    else through(); // already there
  }

  function goodbye() {
    phase = 'intro';
    updateViewShift();
    me.faceTowards(camera.position.x, camera.position.z);
    me.wave(2.4);
    sound.open();
    ui.say(avatar.goodbye, 4200);
    ui.returnToIntro();
    ui.ready(enterRoom);
    clearTimeout(helloAgain);
    // after a while he is back at the door, ready to say hello to whoever comes next
    helloAgain = setTimeout(() => {
      if (phase !== 'intro') return;
      me.waveLoop();
      ui.say(profile.hello.bubble, Infinity);
    }, 5200); // time to read the goodbye: not motion, so reduced motion does not shorten it
  }

  function enterRoom() {
    clearTimeout(helloAgain);
    phase = 'entering';
    if (hovered) setHovered(null);
    ui.startLeavingIntro();
    ui.hideBubble();
    me.stopWave();
    homeTarget = homeView().target;
    updateViewShift();

    if (reduceMotion) {
      entrance.open();
      entrance.lower(0);
      me.place(entrance.inside.x, entrance.inside.z, 0);
      const v = homeView();
      camera.position.copy(v.pos);
      look.copy(v.target);
      viewShift.x = viewShift.y = 0;
      finishEntry();
      welcome();
      return;
    }

    me.followPath([entrance.threshold], () => {
      me.faceTowards(entrance.door.x, entrance.door.z - 2);
      entrance.open().then(() => {
        me.followPath([{ x: entrance.door.x, z: entrance.door.z - 0.8 }, entrance.inside], welcome);
        setTimeout(() => entrance.lower(1.0), 450);
        const v = homeView();
        flyTo(v.pos, v.target, { duration: 2.6, onComplete: finishEntry });
      });
    });
  }

  // ── resize ──────────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    skyView.resize(w, h);
    if (phase === 'intro') {
      const v = introView(entrance.door.z);
      camera.position.copy(v.pos);
      look.copy(v.target);
    }
    updateViewShift(false);
  });

  // ── loop ────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const follow = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const head = new THREE.Vector3();
  let appliedShift = { x: NaN, y: NaN };

  // If frames run long (under about 45 a second), draw fewer pixels: smooth beats sharp.
  const PIXEL_RATIOS = [Math.min(window.devicePixelRatio, 1.5), 1, 0.8];
  let quality = 0;
  let slowFor = 0;
  function holdFrameRate(raw) {
    slowFor = raw > 1 / 45 ? slowFor + Math.min(raw, 0.1) : Math.max(0, slowFor - raw); // one long frame (a shader compiling) is not a slow phone
    if (slowFor < 2 || quality >= PIXEL_RATIOS.length - 1) return;
    if (me.moving || gsap.isTweening(camera.position)) return; // never mid-motion, where the change would show
    quality++;
    slowFor = 0;
    if (PIXEL_RATIOS[quality] < renderer.getPixelRatio()) renderer.setPixelRatio(PIXEL_RATIOS[quality]);
  }

  // in the room, the view drifts a little towards wherever he is
  function driftTowardsCharacter(dt) {
    const p = me.position;
    follow.set(homeTarget.x + (p.x - homeTarget.x) * 0.3, homeTarget.y, homeTarget.z + (p.z - homeTarget.z) * 0.2);
    delta.subVectors(follow, controls.target).multiplyScalar(Math.min(1, dt * 1.5));
    controls.target.add(delta);
    camera.position.add(delta);
  }

  function applyViewShift() {
    if (viewShift.x === appliedShift.x && viewShift.y === appliedShift.y) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Math.abs(viewShift.x) < 0.5 && Math.abs(viewShift.y) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(w, h, viewShift.x, viewShift.y, w, h);
    appliedShift = { ...viewShift };
  }

  function frame() {
    requestAnimationFrame(frame);
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    if (!document.hidden) holdFrameRate(raw);
    const t = clock.elapsedTime;
    if (skyView.isOpen) return skyView.render(renderer, dt); // the room is not drawn behind the sky

    room.tick(dt, t);
    me.update(dt, t);
    activities.update(dt, t);

    if (controls.enabled) {
      if (!down && !focusedId) driftTowardsCharacter(dt);
      controls.update();
      look.copy(controls.target);
    } else {
      camera.lookAt(look);
    }
    if (destRing.visible) destRing.scale.setScalar(1 + Math.sin(t * 6) * 0.12);
    applyViewShift();
    room.faceWalls(camera.position);
    renderer.render(scene, camera);

    if (ui.bubbleVisible) {
      head.copy(me.headTop()).project(camera);
      ui.placeBubble(((head.x + 1) / 2) * window.innerWidth, ((1 - head.y) / 2) * window.innerHeight);
    }
  }

  // ── start: outside the door, waving ─────────────────────
  me.place(entrance.stepOutside.x, entrance.stepOutside.z, 0);
  me.faceTowards(camera.position.x, camera.position.z);
  updateViewShift(false);
  renderer.compile(scene, camera);
  frame();
  me.waveLoop();
  ui.say(profile.hello.bubble, Infinity);
  ui.ready(enterRoom);

  return {
    goTo,
    leaveFocus,
    action(name) {
      if (name === 'sky') skyView.open();
      if (name === 'leave') leaveRoom();
      if (name === 'time') {
        night = !night;
        room.setNight(night);
        ui.syncTime(night);
        sound.toggle();
      }
    },
  };
}
