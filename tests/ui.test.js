import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, renderSection, renderReading } from '../src/ui/sections.js';
import { hotspotOf } from '../src/world/glow.js';
import { profile, contact, interests, languages, uiCopy } from '../src/data/content.js';

const ctx = { profile, contact, interests, languages, copy: uiCopy };

test('esc neutralises every HTML special character', () => {
  assert.equal(esc(`<img src=x onerror="a('b')">&`), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;');
});

test('a hostile string in content renders as text, never as markup', () => {
  const evil = { id: 'x', label: '<script>alert(1)</script>', blurb: '<b onmouseover=x>', points: ['<i>'] };
  const html = renderSection(evil, ctx);
  assert.ok(!html.includes('<script>') && !html.includes('<b ') && !html.includes('<i>'));
});

test('every section renders, with its own title (UI-01)', () => {
  for (const s of [{ id: 'about' }, ...interests, { id: 'contact', ...contact }]) {
    const html = renderSection(s, ctx);
    assert.match(html, /id="panel-title"/, s.id);
  }
});

test('external project links open safely in a new tab', () => {
  const html = renderSection(interests.find((i) => i.id === 'code'), ctx);
  for (const a of html.match(/<a [^>]*target="_blank"[^>]*>/g) || []) assert.match(a, /rel="noopener noreferrer"/);
});

test('an empty favourites list renders nothing (CONTENT-02)', () => {
  const html = renderSection({ id: 'x', label: 'X', blurb: 'b', favourites: [] }, ctx);
  assert.ok(!html.includes(uiCopy.favourites));
});

test('hotspotOf finds the zone a mesh belongs to by walking up its parents', () => {
  const zoneGroup = { userData: { hotspot: 'books' }, parent: null };
  const shelf = { userData: {}, parent: zoneGroup };
  const book = { userData: {}, parent: shelf };
  assert.equal(hotspotOf(book), 'books');
  assert.equal(hotspotOf({ userData: {}, parent: null }), null);
});

test('the books panel lists the shelf and what he is reading (ACT-08)', () => {
  const books = interests.find((i) => i.id === 'books');
  const html = renderSection(books, ctx);
  assert.ok(html.includes(uiCopy.shelf));
  assert.ok(html.includes('class="reading-now"'));
  for (const b of books.shelf) assert.ok(html.includes(esc(b.title)), b.title);
});

test('reading now falls back to the one line about a book when there is no note', () => {
  const html = renderReading({ title: 'T', by: 'A', about: 'What it is about.' }, uiCopy);
  assert.ok(html.includes('What it is about.'));
});

test('the code panel shows five projects, then a link to every repository (CONTENT-04)', () => {
  const code = interests.find((i) => i.id === 'code');
  const html = renderSection(code, ctx);
  assert.equal((html.match(/class="p-name"/g) || []).length, Math.min(5, code.projects.length));
  assert.ok(html.includes(esc(code.allProjects)) && html.includes(uiCopy.allProjects));
  assert.match(html, /<a href="https:\/\/github\.com\/UdayRajSahai2\?tab=repositories" target="_blank" rel="noopener noreferrer"><svg class="logo"/);
});

test('contact links carry their logo, hidden from screen readers (CONTENT-05)', () => {
  const html = renderSection({ id: 'contact', ...contact }, ctx);
  assert.equal((html.match(/<svg class="logo" [^>]*aria-hidden="true"/g) || []).length, contact.links.length + 1);
});

test('a project list without a limit shows every project and no extra link', () => {
  const projects = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ name: `P${n}`, description: 'd', url: '' }));
  const html = renderSection({ id: 'x', label: 'X', blurb: 'b', projects }, ctx);
  assert.equal((html.match(/class="p-name"/g) || []).length, 7);
  assert.ok(!html.includes('all-projects'));
});
