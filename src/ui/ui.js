import { esc, renderSection } from './sections.js';
import { SHEET_QUERY } from './media.js';

// Everything on the page that is not the 3D scene: the intro, the dock, the
// panel, the speech bubble, the tooltip, the sound toggle and the sky view's controls.

const $ = (s) => document.querySelector(s);
const EDGE = 12; // keep floating text this far from the viewport edge

export function createUI({ profile, contact, interests, languages, sections, avatar, copy, sound, onSelect, onClose, onAction }) {
  const panel = $('#panel');
  const body = $('#panel-body');
  const closeBtn = $('#panel-close');
  const dock = $('#dock');
  const tip = $('#tip');
  const hint = $('#hint');
  const bubble = $('#bubble');
  const enter = $('#enter');
  const status = $('#intro-status');
  let bubbleTimer = null;
  let lineTimer = null;
  let current = null;
  let lastTrigger = null;

  $('#intro-title').textContent = profile.hello.headline;
  $('#intro-sentence').textContent = profile.hello.sentence;
  enter.textContent = profile.hello.enter;
  $('#wordmark').textContent = profile.name;
  hint.textContent = avatar.walkHint;

  for (const s of sections) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-item';
    b.dataset.id = s.id;
    b.innerHTML = s.short
      ? `<span class="dock-full">${esc(s.label)}</span><span class="dock-short" aria-hidden="true">${esc(s.short)}</span>`
      : esc(s.label);
    if (s.short) b.setAttribute('aria-label', s.label);
    b.setAttribute('aria-current', 'false');
    b.addEventListener('click', () => {
      lastTrigger = b;
      onSelect(s.id);
    });
    dock.append(b);
  }

  body.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) onSelect(go.dataset.go);
    const action = e.target.closest('[data-action]');
    if (action) onAction?.(action.dataset.action);
  });

  // ── the sky view (telescope) ─────────────────────────────
  const skyEl = $('#sky');
  const skyStatus = $('#sky-status');
  const skyCopy = interests.find((i) => i.sky)?.sky;
  let skyHandlers = null;
  let skyReturn = null;
  if (skyCopy) {
    $('#sky-title').textContent = skyCopy.title;
    $('#sky-help').textContent = skyCopy.help;
    $('#sky-close').textContent = skyCopy.close;
  }
  skyEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sky]');
    if (b && skyHandlers) skyHandlers.control(b.dataset.sky);
  });
  closeBtn.addEventListener('click', () => onClose());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) onClose();
  });

  // sound toggle
  const soundBtn = $('#sound');
  const syncSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.enabled));
    soundBtn.querySelector('.sound-label').textContent = sound.enabled ? copy.soundOn : copy.soundOff;
    soundBtn.classList.toggle('is-off', !sound.enabled);
  };
  soundBtn.addEventListener('click', () => {
    sound.setEnabled(!sound.enabled);
    syncSound();
  });
  syncSound();

  function hideBubble() {
    clearTimeout(bubbleTimer);
    clearTimeout(lineTimer);
    bubble.classList.remove('show');
  }

  return {
    // ── intro ─────────────────────────────────────────────
    loading(text) {
      status.textContent = text;
    },
    ready(onEnter) {
      enter.disabled = false;
      status.textContent = profile.hello.ready;
      enter.focus({ preventScroll: true });
      enter.addEventListener(
        'click',
        () => {
          sound.unlock();
          enter.disabled = true;
          onEnter();
        },
        { once: true }
      );
    },
    leaveIntro() {
      document.body.classList.remove('is-intro');
      document.body.classList.add('is-inside');
      $('#intro').setAttribute('hidden', '');
    },
    startLeavingIntro() {
      document.body.classList.add('is-entering');
    },

    // ── panel ────────────────────────────────────────────
    open(id) {
      const s = sections.find((x) => x.id === id);
      if (!s) return;
      current = id;
      panel.dataset.section = id;
      body.innerHTML = renderSection(s, { profile, contact, interests, languages, copy });
      body.scrollTop = 0;
      panel.inert = false;
      panel.classList.add('open');
      document.body.classList.add('is-focused');
      dock.querySelectorAll('.dock-item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
      requestAnimationFrame(() => closeBtn.focus({ preventScroll: true }));
    },
    close({ restoreFocus = true } = {}) {
      if (!current) return;
      current = null;
      panel.classList.remove('open');
      panel.inert = true;
      document.body.classList.remove('is-focused');
      dock.querySelectorAll('.dock-item').forEach((b) => b.setAttribute('aria-current', 'false'));
      if (!restoreFocus) return;
      if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
      lastTrigger = null;
    },
    get current() {
      return current;
    },
    // a click on empty space in a close-up closes the panel, as the button would
    requestClose() {
      if (current) onClose();
    },
    panelRect() {
      if (!panel.classList.contains('open')) return null;
      return { width: panel.offsetWidth, height: panel.offsetHeight, sheet: window.matchMedia(SHEET_QUERY).matches };
    },
    setPending(id) {
      dock.querySelectorAll('.dock-item').forEach((b) => b.classList.toggle('is-pending', b.dataset.id === id));
    },

    // ── speech ───────────────────────────────────────────
    say(text, ms = 2600) {
      clearTimeout(lineTimer);
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      if (ms !== Infinity) bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
    },
    // say several lines in turn; returns a function that skips to the end
    sayLines(lines, onDone, ms = 1900) {
      let i = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        hideBubble();
        onDone?.();
      };
      const next = () => {
        if (done) return;
        if (i >= lines.length) return finish();
        this.say(lines[i++], Infinity);
        lineTimer = setTimeout(next, ms);
      };
      next();
      return finish;
    },
    hideBubble,
    get bubbleVisible() {
      return bubble.classList.contains('show');
    },
    // centred above (x, y), but never past the viewport edge
    placeBubble(x, y) {
      const w = bubble.offsetWidth;
      const h = bubble.offsetHeight;
      const left = Math.min(Math.max(x - w / 2, EDGE), window.innerWidth - w - EDGE);
      const top = Math.min(Math.max(y - h - 14, EDGE + 56), window.innerHeight - h - EDGE);
      bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      bubble.style.setProperty('--tail', `${Math.round(Math.min(Math.max(x - left, 20), w - 20))}px`);
    },

    // ── hover label ──────────────────────────────────────
    tip(label, x, y) {
      if (!label) {
        tip.classList.remove('show');
        return;
      }
      tip.textContent = label;
      const w = tip.offsetWidth;
      const left = Math.min(x + 16, window.innerWidth - w - EDGE);
      tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(y + 18)}px)`;
      tip.classList.add('show');
    },
    dismissHint() {
      hint.classList.add('gone');
    },

    // ── sky view ─────────────────────────────────────────
    openSky(handlers) {
      skyHandlers = handlers;
      skyReturn = document.activeElement;
      skyStatus.textContent = skyCopy?.start || '';
      skyEl.hidden = false;
      document.body.classList.add('is-sky');
      panel.inert = true;
      requestAnimationFrame(() => $('#sky-close').focus({ preventScroll: true }));
    },
    closeSky() {
      skyHandlers = null;
      skyEl.hidden = true;
      document.body.classList.remove('is-sky');
      if (current) panel.inert = false;
      if (skyReturn && document.body.contains(skyReturn)) skyReturn.focus({ preventScroll: true });
    },
    get skyOpen() {
      return !skyEl.hidden;
    },
    // the constellation in view, or the opening hint when none is
    skyStatus(text) {
      const next = text || skyCopy?.start || '';
      if (skyStatus.textContent !== next) skyStatus.textContent = next;
    },
  };
}
