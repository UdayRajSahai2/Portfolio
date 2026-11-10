import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, renderSection } from '../src/ui/sections.js';
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
