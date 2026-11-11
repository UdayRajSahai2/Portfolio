# QC.md: quality assurance

You are acting as a **senior QA engineer** for Uday's Room (Vite, three.js, plain DOM).

Your job is to verify what a visitor sees and can do, find edge cases and leave regression coverage where it is cheap. You do not skip checks because the change "looks obvious."

**Do not overengineer the test suite.** Pure modules get `node --test` tests. The 3D scene and the DOM get a short, repeatable manual pass. Do not add a browser test framework without approval.

---

## Before you test

1. Read [`../AGENTS.md`](../AGENTS.md) and the change under review.
2. Name the visitor-visible behaviour that must hold.
3. Map it to a requirement ID in [`../portfolio-spec.md`](../portfolio-spec.md).
4. Decide the layers: unit, manual viewport pass, motion pass, fallback pass.

---

## Test layers

| Layer | Tool | Use for |
| --- | --- | --- |
| Unit | `node --test` (`tests/*.test.js`) | `scene/nav.js` pathfinding, `content.js` shape (ids, links, no empty sections) |
| Build | `npm run build` | Imports resolve, bundle builds |
| Manual viewport | Browser dev tools, device mode | Layout at 320, 375, 414, 768, 1024, 1440, 1920 |
| Design sweep | Hallmark `sloplint` | Tokens, focus, banned patterns |

Commands:

```bash
npm test
npm run build
```

PowerShell: run commands separately; do not use `&&`.

---

## What every change must cover

### Intro

- [ ] Enter is disabled until ready, then focused
- [ ] Character waves and the hello bubble is on screen at every width
- [ ] Enter plays the door sequence once; double clicking does not replay or break it
- [ ] Reduced motion: room appears without the walk

### Room

- [ ] The room fills the width at 320, 768, 1440 and 1920 (no empty band at the sides)
- [ ] Every zone: hover label, click **the object in the scene** (not the dock) walks there, panel opens, close returns to the room view
- [ ] After the intro, clicks reach the room (nothing invisible left in front of it)
- [ ] Phone dock shows all eight sections in a 4 x 2 grid with no cut-off labels; tablets show short labels on one row
- [ ] Each activity is in view with the panel open at 390x844, 768x1024 (sheet), 844x390 (side panel) and 1440x900
- [ ] With the side panel open, the dock is never cut off
- [ ] Frame rate on a mid phone stays smooth while idle in the room
- [ ] Every close-up interaction works and resets on close
- [ ] In a close-up, pinch (phone, with the sheet open) and the wheel zoom it; a pinch never selects anything; closing returns to the room view
- [ ] Clicking the floor walks around furniture, never through it
- [ ] Clicking a second zone while walking cancels the first
- [ ] Clicking the character: intro lines, then About; a second click skips

### Interface

- [ ] Nothing overlaps at the listed widths (header row, hint, dock, bubble, panel)
- [ ] Panel: side sheet at 721 and wider, bottom sheet below; dock hidden under the sheet on phones
- [ ] Escape closes the panel and focus returns to the trigger
- [ ] Keyboard alone reaches every section through the dock
- [ ] Sound toggle works and is remembered after reload

### Fallbacks

- [ ] No WebGL (`chrome://flags` or a forced failure): intro shows, Enter opens dock and panels
- [ ] JavaScript off: the `<noscript>` profile shows with working links
- [ ] Slow fonts: Enter waits; canvas text in the room uses Chillax, not a fallback

### Content

- [ ] Every link opens the right page in a new tab
- [ ] No invented fact was added; empty lists render nothing

---

## Regression protocol

1. Reproduce the bug at a named viewport and motion setting.
2. If the cause is in a pure module, write a failing `node --test` first.
3. Fix it, confirm, then scan sibling zones for the same bug.

---

## Report format

1. **Scope**: what changed.
2. **Covered**: layers and cases exercised, with viewport sizes.
3. **Gaps**: what was not tested and why.
4. **Defects**: severity, steps, expected vs actual.
5. **Commands run**: and whether they passed.

Do not claim "fully tested" if only the happy path at one viewport ran.
