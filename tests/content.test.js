import test from 'node:test';
import assert from 'node:assert/strict';
import { profile, avatar, interests, contact } from '../src/data/content.js';

// The room has one zone per interest (portfolio-spec.md ROOM-02).
const ZONES = ['code', 'books', 'screen', 'gym', 'stars', 'chess'];

test('every room zone has an interest entry, and nothing else does', () => {
  assert.deepEqual(interests.map((i) => i.id).sort(), [...ZONES].sort());
});

test('every interest has a label, a line and a blurb', () => {
  for (const i of interests) {
    assert.ok(i.label, `${i.id} label`);
    assert.ok(i.say, `${i.id} say`);
    assert.ok(i.blurb, `${i.id} blurb`);
  }
});

test('chess is one interest, not the brand (INTRO-06)', () => {
  assert.ok(!avatar.shirtPrint.includes('♞'));
  assert.ok(!/chess/i.test(profile.hello.headline + profile.hello.sentence));
});

test('the intro has a headline, one sentence and an action (INTRO-02)', () => {
  const { headline, sentence, enter } = profile.hello;
  assert.ok(headline && sentence && enter);
  assert.ok(sentence.split(/[.!?]\s/).length <= 2, 'one or two short sentences at most');
});

test('the character introduces himself in a few lines (CHAR-01)', () => {
  assert.ok(avatar.introLines.length >= 2 && avatar.introLines.length <= 5);
  assert.ok(avatar.introLines.some((l) => l.includes(profile.name)));
});

test('project and contact links are https', () => {
  const urls = [...interests.flatMap((i) => (i.projects || []).map((p) => p.url)), ...contact.links.map((l) => l.url)].filter(Boolean);
  for (const u of urls) assert.match(u, /^https:\/\//);
});

test('copy avoids dashes that read as machine-made', () => {
  const text = JSON.stringify({ profile, avatar, interests, contact });
  assert.ok(!/[–—]/.test(text), 'no en or em dashes');
});

test('the book he is reading has a title, an author and his note (ACT-02)', () => {
  const r = interests.find((i) => i.id === 'books').reading;
  assert.equal(r.title, 'Tuesdays with Morrie');
  assert.ok(r.by && r.note);
});

test('the TV has one channel per kind, each with a title (ACT-03)', () => {
  const ch = interests.find((i) => i.id === 'screen').channels;
  assert.deepEqual(ch.map((c) => c.kind).sort(), ['anime', 'film', 'series']);
  for (const c of ch) assert.ok(c.title && c.label);
});

test('every book on the shelf has a title and an author, and none is listed twice (ACT-08)', () => {
  const books = interests.find((i) => i.id === 'books');
  const titles = [books.reading.title, ...books.shelf.map((b) => b.title)];
  for (const b of books.shelf) assert.ok(b.title && b.by, JSON.stringify(b));
  assert.equal(new Set(titles).size, titles.length);
});

test('a line about a book is short enough for the speech bubble', () => {
  const books = interests.find((i) => i.id === 'books');
  for (const b of [books.reading, ...books.shelf]) assert.ok(!b.about || b.about.split(' ').length <= 22, b.title);
});
