// Pure renderers for the panel: content in, escaped HTML out.
import { icon } from './icons.js';

export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// the first `limit` projects, then a link to every repository when there is one (CONTENT-04)
function renderProjects(projects = [], copy, { limit = projects.length, all = '' } = {}) {
  if (!projects.length) return '';
  const more = all ? `<p class="all-projects"><a href="${esc(all)}" target="_blank" rel="noopener noreferrer">${icon('github')}${esc(copy.allProjects)}</a></p>` : '';
  return `
    <h3>${esc(copy.built)}</h3>
    <ul class="projects">${projects
      .slice(0, limit)
      .map((p) => {
        const tags = (p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('');
        const inner = `
          <span class="p-name">${esc(p.name)}</span>
          <span class="p-desc">${esc(p.description)}</span>
          <span class="p-foot">
            <ul class="tags" aria-label="${esc(copy.builtWith)}">${tags}</ul>
            <span class="p-go">${esc(p.url ? copy.openProject : copy.soon)}</span>
          </span>`;
        return p.url
          ? `<li><a class="project" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${inner}</a></li>`
          : `<li><div class="project is-soon">${inner}</div></li>`;
      })
      .join('')}</ul>${more}`;
}

function renderLanguages(languages = [], copy) {
  if (!languages.length) return '';
  const bar = languages.map((l) => `<span style="flex:${Number(l.pct)};background:${esc(l.color)}"></span>`).join('');
  const legend = languages
    .filter((l) => l.pct >= 1)
    .map((l) => `<li><i style="background:${esc(l.color)}" aria-hidden="true"></i>${esc(l.name)} <b>${esc(l.pct)}%</b></li>`)
    .join('');
  return `
    <h3>${esc(copy.languages)}</h3>
    <div class="langbar" role="img" aria-label="${esc(languages.map((l) => `${l.name} ${l.pct}%`).join(', '))}">${bar}</div>
    <ul class="langs">${legend}</ul>`;
}

const list = (items = [], cls = 'points') => (items.length ? `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '');

function renderFavourites(favs = [], copy) {
  const real = favs.filter((f) => f && f.title);
  if (!real.length) return '';
  return `<h3>${esc(copy.favourites)}</h3><ul class="points">${real.map((f) => `<li>${esc(f.title)}${f.by ? `, ${esc(f.by)}` : ''}</li>`).join('')}</ul>`;
}

// what he is reading: his own note on it, or the one line on what it is about
export function renderReading(r, copy) {
  if (!r?.title) return '';
  const note = r.note || r.about;
  return `
    <h3>${esc(copy.reading)}</h3>
    <p class="reading"><span class="reading-title">${esc(r.title)}</span> <span class="reading-by">${esc(copy.by)} ${esc(r.by)}</span></p>
    ${note ? `<p class="reading-note">${esc(note)}</p>` : ''}`;
}

function renderShelf(books = [], copy) {
  const real = books.filter((b) => b && b.title);
  if (!real.length) return '';
  return `<h3>${esc(copy.shelf)}</h3><ul class="points shelf">${real.map((b) => `<li>${esc(b.title)}${b.by ? `, ${esc(b.by)}` : ''}</li>`).join('')}</ul>`;
}

// The panel body for one section, as an HTML string. Every value is escaped.
export function renderSection(s, { profile, contact, interests, languages, copy }) {
  if (s.id === 'about') {
    const exp = (profile.experience || [])
      .map((e) => `<li><span class="x-role">${esc(e.role)}</span><span class="x-org">${esc(e.org)}</span><span class="x-when">${esc(e.when)}</span></li>`)
      .join('');
    return `
      <h2 id="panel-title">${esc(profile.name)}</h2>
      <p class="blurb">${esc(profile.intro)}</p>
      <h3>${esc(copy.now)}</h3>
      ${list(profile.now)}
      ${exp ? `<h3>${esc(copy.been)}</h3><ul class="timeline">${exp}</ul>` : ''}
      <h3>${esc(copy.walkTo)}</h3>
      <div class="chips">${interests.map((i) => `<button type="button" class="chip" data-go="${esc(i.id)}">${esc(i.label)}</button>`).join('')}
        <button type="button" class="chip" data-go="contact">${esc(contact.label)}</button></div>`;
  }
  if (s.id === 'contact') {
    return `
      <h2 id="panel-title">${esc(contact.label)}</h2>
      <p class="blurb">${esc(contact.blurb)}</p>
      <a class="mail" href="mailto:${esc(contact.email)}">${icon('gmail')}<span>${esc(contact.email)}</span></a>
      <ul class="links">${contact.links
        .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${icon(l.icon)}${esc(l.label)}</a></li>`)
        .join('')}</ul>`;
  }
  return `
    <h2 id="panel-title">${esc(s.label)}</h2>
    <p class="blurb">${esc(s.blurb)}</p>
    ${s.tryIt ? `<p class="try">${esc(s.tryIt)}</p>` : ''}
    ${s.sky ? `<p class="panel-action"><button type="button" class="btn" data-action="sky">${esc(s.sky.open)}</button></p>` : ''}
    ${s.reading ? `<div class="reading-now" aria-live="polite">${renderReading(s.reading, copy)}</div>` : ''}
    ${list(s.points)}
    ${renderFavourites(s.favourites, copy)}
    ${renderShelf(s.shelf, copy)}
    ${renderProjects(s.projects, copy, { limit: s.projectLimit, all: s.allProjects })}
    ${s.showLanguages ? renderLanguages(languages, copy) : ''}
    ${s.stack ? `<h3>${esc(copy.stack)}</h3><ul class="tags stack">${s.stack.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}`;
}
