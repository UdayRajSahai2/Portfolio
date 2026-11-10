import * as THREE from 'three';
import { createSky } from '../scene/sky.js';

// The telescope's sky view (spec SKY-01..03): open and close it, steer it with
// drag, wheel, keys or the on-screen buttons, and draw it instead of the room.

const STEP = 0.18; // radians per button press at the default zoom
const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '=': 'in', '-': 'out', Escape: 'close' };

export function createSkyView({ ui, sound, canvas, font, colors, reduceMotion, onOpen }) {
  const sky = createSky({ font, colors, reduceMotion });
  sky.resize(window.innerWidth, window.innerHeight);

  function control(c) {
    if (c === 'close') return close();
    if (c === 'in') return sky.zoom(0.8);
    if (c === 'out') return sky.zoom(1.25);
    const k = STEP * (sky.fov / 60);
    if (c === 'left') sky.look(k, 0);
    if (c === 'right') sky.look(-k, 0);
    if (c === 'up') sky.look(0, k);
    if (c === 'down') sky.look(0, -k);
  }
  function open() {
    if (ui.skyOpen) return;
    onOpen?.();
    ui.openSky({ control });
    sound.open();
  }
  function close() {
    if (!ui.skyOpen) return;
    ui.closeSky();
    sound.close();
  }

  // keys go to the sky first, so Escape closes it and not the panel underneath
  window.addEventListener(
    'keydown',
    (e) => {
      const c = ui.skyOpen && KEYS[e.key];
      if (!c) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      control(c);
    },
    { capture: true }
  );
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!ui.skyOpen) return;
      e.preventDefault();
      sky.zoom(e.deltaY > 0 ? 1.1 : 0.9);
    },
    { passive: false }
  );
  canvas.addEventListener('pointermove', (e) => {
    if (!ui.skyOpen || !e.buttons) return;
    const k = THREE.MathUtils.degToRad(sky.fov) / window.innerHeight;
    sky.look(e.movementX * k, e.movementY * k);
  });

  return {
    open,
    close,
    get isOpen() {
      return ui.skyOpen;
    },
    resize(w, h) {
      sky.resize(w, h);
    },
    render(renderer, dt) {
      sky.update(dt);
      ui.skyStatus(sky.inView());
      renderer.render(sky.scene, sky.camera);
    },
  };
}
