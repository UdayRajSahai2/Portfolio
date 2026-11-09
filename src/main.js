import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import './style.css';
import { profile, contact, about, interests, avatar, monitorFiles, languages } from './data/content.js';
import { buildRoom } from './scene/room.js';
import { createCharacter } from './scene/character.js';
import { createNav } from './scene/nav.js';
import { createUI } from './ui.js';
import { sound } from './sound.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const M = reduceMotion ? 0.01 : 1;

const sections = [...interests, { id: 'about', ...about }, { id: 'contact', ...contact }];
const labelOf = (id) => {
  if (id === 'about') return 'About me';
  if (id === 'contact') return 'Say hello';
  if (id === 'lamp') return 'Desk lamp, click to switch';
  if (id === 'me') return "That's me";
  return sections.find((s) => s.id === id)?.label ?? id;
};
const lineFor = (id) => sections.find((s) => s.id === id)?.say;

let world = null; // set once the 3D scene exists

const ui = createUI({
  profile,
  contact,
  interests,
  languages,
  sections,
  sound,
  onSelect: (id) => select(id),
  onClose: () => closeSection(),
});

// Dock, 3D clicks and the About chips all come through here.
function select(id) {
  ui.dismissHint();
  if (world) return world.goTo(id);
  if (ui.current !== id) {
    ui.open(id);
    sound.open();
  }
}
function closeSection() {
  if (!ui.current) return;
  ui.close();
  sound.close();
  world?.leaveFocus();
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

if (!webglAvailable()) {
  document.body.classList.add('no-webgl');
  ui.loading(1, 'Your browser can’t show the 3D room, so here is the short version.');
  ui.ready(() => {});
} else {
  init();
}

function init() {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);

  ui.loading(0.3, 'Setting up the room');
  const room = buildRoom(scene, {
    monitorFiles,
    languages,
    noteLabels: interests.map((i) => i.label.toLowerCase()).concat(['hi!', 'ship it']),
    reduceMotion,
  });
  const nav = createNav(room.obstacles);

  ui.loading(0.6, 'Getting dressed');
  const me = createCharacter(avatar, { reduceMotion });
  me.group.userData.hotspot = 'me';
  me.place(-1.0, 0.2, Math.PI * 0.25);
  scene.add(me.group);

  // rings on the floor: where you're pointing, and where the character is heading
  const ringGeo = new THREE.RingGeometry(0.2, 0.28, 40);
  const makeRing = (opacity) => {
    const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#FFB547', transparent: true, opacity, depthWrite: false }));
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.025;
    r.raycast = () => {};
    r.visible = false;
    scene.add(r);
    return r;
  };
  const hoverRing = makeRing(0.35);
  const destRing = makeRing(0.9);

  // ── camera + controls ───────────────────────────────────
  const HOME_TARGET = new THREE.Vector3(-0.4, 1.7, -0.6);
  const homePos = () => {
    const portrait = window.innerWidth / window.innerHeight < 0.9;
    return new THREE.Vector3(9.6, 7.2, 9.6).multiplyScalar(portrait ? 1.55 : 1);
  };
  camera.position.copy(homePos()).multiplyScalar(1.7).add(new THREE.Vector3(0, 6, 0));

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 7;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.55;
  controls.maxPolarAngle = 1.35;
  controls.minAzimuthAngle = 0.05;
  controls.maxAzimuthAngle = 1.5;
  controls.rotateSpeed = 0.55;
  controls.enabled = false;

  const look = HOME_TARGET.clone(); // what the camera looks at while we drive it
  let roomCamPos = null; // where the visitor was before a close-up
  let focusedId = null;

  const viewShift = { x: 0, y: 0 };
  function updateViewShift(animate = true) {
    const rect = ui.panelRect();
    let x = 0;
    let y = 0;
    if (rect) {
      if (rect.sheet) y = rect.height / 2;
      else x = rect.width / 2;
    }
    gsap.to(viewShift, { x, y, duration: animate ? 0.9 * M : 0, ease: 'power3.inOut' });
  }

  function flyTo(pos, target, { duration = 1.4, onComplete } = {}) {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(look);
    gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: duration * M, ease: 'power3.inOut' });
    gsap.to(look, { x: target.x, y: target.y, z: target.z, duration: duration * M, ease: 'power3.inOut', onComplete });
  }

  // ── hover glow ──────────────────────────────────────────
  const glowCache = new WeakMap();
  function setGlow(obj, on, color) {
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.noGlow) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.emissive) continue;
        if (!glowCache.has(m)) glowCache.set(m, { c: m.emissive.clone(), i: m.emissiveIntensity });
        const base = glowCache.get(m);
        if (on) {
          m.emissive.set(color);
          m.emissiveIntensity = 0.28;
        } else {
          m.emissive.copy(base.c);
          m.emissiveIntensity = base.i;
        }
      }
    });
  }

  for (const [id, h] of Object.entries(room.hotspots)) for (const g of [h.group, ...(h.extra || [])]) g.userData.hotspot = id;
  room.lamp.group.userData.hotspot = 'lamp';

  const groupsFor = (id) => {
    if (id === 'lamp') return [room.lamp.group];
    if (id === 'me') return [me.group];
    const h = room.hotspots[id];
    return h ? [h.group, ...(h.extra || [])] : [];
  };
  const accentOf = (id) => (id === 'lamp' || id === 'me' ? '#FFB547' : sections.find((s) => s.id === id)?.accent);

  // ── picking ─────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function hotspotOf(obj) {
    let o = obj;
    while (o && !o.userData.hotspot) o = o.parent;
    return o ? o.userData.hotspot : null;
  }
  function pick() {
    raycaster.setFromCamera(pointer, camera);
    if (focusedId) {
      const hit = raycaster.intersectObjects([...groupsFor(focusedId), room.lamp.group], true)[0];
      return hit ? { id: hotspotOf(hit.object), object: hit.object } : null;
    }
    const hit = raycaster.intersectObjects([room.root, me.group], true)[0];
    if (!hit) return null;
    const id = hotspotOf(hit.object);
    if (id) return { id, object: hit.object };
    if (hit.object.userData.wall) return null;
    // floor or furniture: walk to that spot (nav snaps it to free floor)
    return { id: 'floor', point: hit.point, onFloor: !!hit.object.userData.floor };
  }

  function setHovered(next, clientX, clientY) {
    const prevId = hovered?.id;
    const nextId = next?.id;
    const glowable = (id) => id && id !== 'floor' && id !== focusedId;
    if (prevId !== nextId) {
      if (glowable(prevId)) groupsFor(prevId).forEach((g) => setGlow(g, false));
      if (glowable(nextId)) {
        groupsFor(nextId).forEach((g) => setGlow(g, true, accentOf(nextId)));
        sound.hover();
      }
    }
    hovered = next;

    if (nextId === 'floor' && next.onFloor && nav.isFreeAt(next.point.x, next.point.z)) {
      hoverRing.position.x = next.point.x;
      hoverRing.position.z = next.point.z;
      hoverRing.visible = true;
    } else hoverRing.visible = false;

    const clickable = next && nextId !== 'floor' && (nextId !== focusedId || room.hotspots[nextId]?.interact);
    canvas.style.cursor = clickable ? 'pointer' : focusedId ? 'default' : nextId === 'floor' ? 'crosshair' : 'grab';
    ui.tip(glowable(nextId) ? labelOf(nextId) : null, clientX, clientY);
  }

  const setPointer = (e) => pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (e.pointerType === 'mouse' && !(down && e.buttons)) setHovered(pick(), e.clientX, e.clientY);
    if (down && e.buttons && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
      canvas.style.cursor = 'grabbing';
      hoverRing.visible = false;
    }
  });
  canvas.addEventListener('pointerleave', () => setHovered(null));
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return;
    setPointer(e);
    const hit = pick();
    if (!hit) {
      if (focusedId) closeSection();
      return;
    }
    if (hit.id === 'lamp') return room.lamp.toggle();
    if (focusedId) {
      if (hit.id === focusedId) room.hotspots[hit.id].interact?.(hit.object);
      return;
    }
    if (hit.id === 'me') {
      me.wave();
      sound.open();
      const pokes = avatar.pokes || [];
      if (pokes.length) ui.say(pokes[Math.floor(Math.random() * pokes.length)]);
      return;
    }
    if (hit.id === 'floor') {
      ui.dismissHint();
      return world.walkFree(hit.point);
    }
    select(hit.id);
  });

  // ── walking + close-ups ─────────────────────────────────
  let token = 0; // bumps whenever a new walk replaces the old one
  let pending = null;

  function walkTo(x, z, onArrive) {
    const path = nav.find(me.position, { x, z });
    if (!path || !path.length) {
      destRing.visible = false;
      onArrive?.();
      return;
    }
    const end = path[path.length - 1];
    destRing.position.x = end.x;
    destRing.position.z = end.z;
    destRing.visible = true;
    me.followPath(path, () => {
      destRing.visible = false;
      onArrive?.();
    });
  }

  function enterFocus(id) {
    ui.open(id);
    sound.open();
    if (hovered) setHovered(null);
    if (controls.enabled) roomCamPos = camera.position.clone();
    controls.enabled = false;
    focusedId = id;
    updateViewShift();
    const h = room.hotspots[id];
    if (!h) return;
    const target = new THREE.Vector3(...h.view.target);
    const pos = new THREE.Vector3(...h.view.pos);
    // tall screens see less sideways, so step back a little
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect < 1) pos.sub(target).multiplyScalar(THREE.MathUtils.clamp(1.15 / aspect, 1, 2)).add(target);
    flyTo(pos, target, { duration: 1.5 });
    h.onFocus?.();
  }

  function leaveFocus() {
    const h = focusedId && room.hotspots[focusedId];
    h?.onBlur?.();
    focusedId = null;
    updateViewShift();
    flyTo(roomCamPos || homePos(), controls.target, {
      duration: 1.3,
      onComplete: () => {
        controls.enabled = true;
      },
    });
  }

  world = {
    goTo(id) {
      if (ui.current === id || pending === id) return;
      const my = ++token;
      if (ui.current) {
        ui.close({ restoreFocus: false });
        sound.close();
        leaveFocus();
      }
      const h = room.hotspots[id];
      if (!h?.stand) return enterFocus(id);
      pending = id;
      ui.setPending(id);
      walkTo(h.stand.x, h.stand.z, () => {
        if (my !== token) return;
        pending = null;
        ui.setPending(null);
        me.faceTowards(...h.stand.look);
        const line = lineFor(id);
        if (line) ui.say(line, 2400);
        setTimeout(() => {
          if (my === token) enterFocus(id);
        }, 550 * M);
      });
    },
    walkFree(point) {
      token++;
      pending = null;
      ui.setPending(null);
      walkTo(point.x, point.z);
    },
    leaveFocus,
  };

  // ── resize ──────────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateViewShift(false);
  });

  // ── loop ────────────────────────────────────────────────
  const clock = new THREE.Clock();
  const follow = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const head = new THREE.Vector3();
  let appliedShift = { x: -1, y: -1 };

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    room.tick(dt, t);
    me.update(dt, t);

    if (controls.enabled) {
      // drift the view a little towards the character
      if (!down) {
        const p = me.position;
        follow.set(HOME_TARGET.x + (p.x - HOME_TARGET.x) * 0.35, HOME_TARGET.y, HOME_TARGET.z + (p.z - HOME_TARGET.z) * 0.35);
        delta.subVectors(follow, controls.target).multiplyScalar(Math.min(1, dt * 1.5));
        controls.target.add(delta);
        camera.position.add(delta);
      }
      controls.update();
      look.copy(controls.target);
    } else {
      camera.lookAt(look);
    }

    if (destRing.visible) destRing.scale.setScalar(1 + Math.sin(t * 6) * 0.12);

    if (viewShift.x !== appliedShift.x || viewShift.y !== appliedShift.y) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (viewShift.x < 0.5 && viewShift.y < 0.5) camera.clearViewOffset();
      else camera.setViewOffset(w, h, viewShift.x, viewShift.y, w, h);
      appliedShift = { ...viewShift };
    }

    renderer.render(scene, camera);

    if (ui.bubbleVisible) {
      head.copy(me.headTop()).project(camera);
      ui.placeBubble(((head.x + 1) / 2) * window.innerWidth, ((1 - head.y) / 2) * window.innerHeight);
    }
    requestAnimationFrame(frame);
  }

  renderer.compile(scene, camera);
  document.fonts?.ready.then(() => {
    ui.loading(1, 'Ready when you are');
    ui.ready(intro);
  });
  frame();

  // The single orchestrated moment: sweep down into the room, then say hi.
  function intro() {
    flyTo(homePos(), HOME_TARGET, {
      duration: 2.6,
      onComplete: () => {
        controls.enabled = true;
        me.faceTowards(camera.position.x, camera.position.z);
        me.wave();
        if (avatar.greeting) ui.say(avatar.greeting, 3800);
      },
    });
  }
}
