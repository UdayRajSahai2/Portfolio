const $ = (s) => document.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderProjects(projects = []) {
  if (!projects.length) return '<p class="empty">Nothing here yet. Projects will show up as I finish them.</p>';
  return `<ul class="projects">${projects
    .map((p) => {
      const tags = (p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('');
      const inner = `
        <span class="p-name">${esc(p.name)}</span>
        <span class="p-desc">${esc(p.description)}</span>
        <span class="p-foot">
          <ul class="tags" aria-label="Tags">${tags}</ul>
          <span class="p-go">${p.url ? 'Open project' : 'Link coming soon'}</span>
        </span>`;
      return p.url
        ? `<li><a class="project" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${inner}</a></li>`
        : `<li><div class="project is-soon">${inner}</div></li>`;
    })
    .join('')}</ul>`;
}

function renderLanguages(languages = []) {
  if (!languages.length) return '';
  const bar = languages
    .map((l) => `<span style="flex:${l.pct};background:${esc(l.color)}" title="${esc(l.name)} ${l.pct}%"></span>`)
    .join('');
  const legend = languages
    .filter((l) => l.pct >= 1)
    .map((l) => `<li><i style="background:${esc(l.color)}"></i>${esc(l.name)} <b>${l.pct}%</b></li>`)
    .join('');
  return `
    <h3>Languages on my GitHub</h3>
    <div class="langbar" role="img" aria-label="${esc(languages.map((l) => `${l.name} ${l.pct}%`).join(', '))}">${bar}</div>
    <ul class="langs">${legend}</ul>`;
}

function renderSection(s, { profile, contact, interests, languages }) {
  if (s.id === 'about') {
    const exp = (profile.experience || [])
      .map((e) => `<li><span class="x-role">${esc(e.role)}</span><span class="x-org">${esc(e.org)}</span><span class="x-when">${esc(e.when)}</span></li>`)
      .join('');
    return `
      <h2 id="panel-title">${esc(profile.name)}</h2>
      <p class="blurb">${esc(profile.intro)}</p>
      <h3>Right now</h3>
      <ul class="now">${profile.now.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
      ${exp ? `<h3>Where I've been</h3><ul class="timeline">${exp}</ul>` : ''}
      <h3>Things I'm into</h3>
      <div class="chips">${interests
        .map((i) => `<button type="button" class="chip" data-go="${esc(i.id)}" style="--chip:${esc(i.accent)}">${esc(i.label)}</button>`)
        .join('')}</div>`;
  }
  if (s.id === 'contact') {
    return `
      <h2 id="panel-title">Say hello</h2>
      <p class="blurb">${esc(contact.blurb)}</p>
      <a class="mail" href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>
      <ul class="links">${contact.links
        .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></li>`)
        .join('')}</ul>`;
  }
  return `
    <h2 id="panel-title">${esc(s.label)}</h2>
    <p class="blurb">${esc(s.blurb)}</p>
    ${s.tryIt ? `<p class="try"><span aria-hidden="true">✦</span> ${esc(s.tryIt)}</p>` : ''}
    ${renderProjects(s.projects)}
    ${s.showLanguages ? renderLanguages(languages) : ''}
    ${s.stack ? `<h3>What I work with</h3><ul class="tags stack">${s.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`;
}

export function createUI({ profile, contact, interests, languages, sections, onSelect, onClose, sound }) {
  $('#name').textContent = profile.name;
  $('#tagline').textContent = profile.tagline;

  const panel = $('#panel');
  const body = $('#panel-body');
  const closeBtn = $('#panel-close');
  const dock = $('#dock');
  const tip = $('#tip');
  const hint = $('#hint');
  const bubble = $('#bubble');
  let bubbleTimer = null;
  let current = null;
  let lastTrigger = null;

  // dock
  for (const s of sections) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dock-item';
    b.dataset.id = s.id;
    b.style.setProperty('--accent', s.accent);
    b.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${esc(s.label)}</span>`;
    b.addEventListener('click', () => {
      lastTrigger = b;
      onSelect(s.id);
    });
    dock.append(b);
  }

  body.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) onSelect(go.dataset.go);
  });
  closeBtn.addEventListener('click', () => onClose());
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) onClose();
  });

  // sound toggle
  const soundBtn = $('#sound');
  const syncSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.enabled));
    soundBtn.querySelector('.sound-label').textContent = sound.enabled ? 'Sound on' : 'Sound off';
    soundBtn.classList.toggle('is-off', !sound.enabled);
    const note = document.querySelector('.loader-note');
    if (note) note.textContent = sound.enabled ? 'Sound is on. You can mute it any time.' : 'Sound is off. Turn it on from the corner.';
  };
  soundBtn.addEventListener('click', () => {
    sound.setEnabled(!sound.enabled);
    syncSound();
  });
  syncSound();

  return {
    open(id) {
      const s = sections.find((x) => x.id === id);
      if (!s) return;
      current = id;
      panel.style.setProperty('--accent', s.accent);
      document.documentElement.style.setProperty('--focus-accent', s.accent);
      body.innerHTML = renderSection(s, { profile, contact, interests, languages });
      body.scrollTop = 0;
      panel.inert = false;
      panel.classList.add('open');
      document.body.classList.add('is-focused');
      dock.querySelectorAll('.dock-item').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
      // move focus into the panel without scrolling the page
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
    setPending(id) {
      dock.querySelectorAll('.dock-item').forEach((b) => b.classList.toggle('is-pending', b.dataset.id === id));
    },
    say(text, ms = 2600) {
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
    },
    get bubbleVisible() {
      return bubble.classList.contains('show');
    },
    placeBubble(x, y) {
      bubble.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    },
    get current() {
      return current;
    },
    panelRect() {
      // layout size (ignores the slide-in transform)
      if (!panel.classList.contains('open')) return null;
      return {
        width: panel.offsetWidth,
        height: panel.offsetHeight,
        sheet: window.matchMedia('(max-width: 720px)').matches,
      };
    },
    tip(label, x, y) {
      if (!label) {
        tip.classList.remove('show');
        return;
      }
      tip.textContent = label;
      tip.style.transform = `translate(${x + 16}px, ${y + 18}px)`;
      tip.classList.add('show');
    },
    dismissHint() {
      hint.classList.add('gone');
    },
    loading(pct, text) {
      $('#loader-fill').style.transform = `scaleX(${pct})`;
      if (text) $('#loader-text').textContent = text;
    },
    ready(onEnter) {
      const btn = $('#enter');
      btn.disabled = false;
      btn.focus({ preventScroll: true });
      btn.addEventListener(
        'click',
        () => {
          sound.unlock();
          $('#loader').classList.add('done');
          setTimeout(() => $('#loader').remove(), 900);
          onEnter();
        },
        { once: true }
      );
    },
  };
}
