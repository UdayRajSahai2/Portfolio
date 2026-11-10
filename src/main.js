import './style.css';
import * as content from './data/content.js';
import { createUI } from './ui/ui.js';
import { createWorld } from './world/world.js';
import { sound } from './sound.js';

// Boot: build the page UI, wait for the font, then start the 3D room
// (or, without WebGL, let the dock and panels work on their own).

const FONT = 'Chillax';
const { profile, contact, about, interests, avatar, languages, uiCopy } = content;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const sections = [{ id: 'about', ...about }, ...interests, { id: 'contact', ...contact }];
const sectionOf = (id) => sections.find((s) => s.id === id);
const labelOf = (id) => ({ lamp: uiCopy.lamp, me: uiCopy.me })[id] ?? sectionOf(id)?.label ?? id;
const lineFor = (id) => sectionOf(id)?.say;

let world = null; // set once the 3D room exists

const ui = createUI({
  profile,
  contact,
  interests,
  languages,
  sections,
  avatar,
  copy: uiCopy,
  sound,
  onSelect: select,
  onClose: closeSection,
  onAction: (action) => world?.action(action),
});

function select(id) {
  ui.dismissHint();
  if (world) return world.goTo(id);
  // no WebGL: the panel opens straight away
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

// Wait for Chillax so text drawn into the room uses it, but never for long.
function fontsReady() {
  const load = document.fonts ? Promise.all([document.fonts.load(`600 64px ${FONT}`), document.fonts.load(`500 16px ${FONT}`)]) : Promise.resolve();
  return Promise.race([load, new Promise((r) => setTimeout(r, 3000))]).catch(() => {});
}

ui.loading(profile.hello.loading);
if (webglAvailable()) {
  fontsReady().then(() => {
    world = createWorld({ ui, content, font: FONT, reduceMotion, select, labelOf, lineFor });
  });
} else {
  document.body.classList.add('no-webgl');
  fontsReady().then(() => ui.ready(() => ui.leaveIntro()));
}
