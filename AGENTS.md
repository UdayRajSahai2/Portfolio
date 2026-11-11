# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working in this repository.

**Read this file fully before writing or changing code.** Then open the matching guides under [`docs/`](docs/README.md). If a rule here conflicts with a request, tell the user before proceeding.

---

## Project overview

**Uday's Room** is the personal portfolio of Uday Raj Sahai, a full stack developer. It is a static site: one full-width 3D room built in three.js, with no backend.

1. A visitor lands outside a closed door. Uday's character stands beside it, waves and says hello.
2. **Enter** makes the character open the door and walk in. The front wall falls away and the whole room fills the screen.
3. Each corner of the room stands for one part of his life: code, chess, books (with his book club, philosophy and psychology), the screen (films, TV series, anime), the gym and the stars (astronomy). Clicking a corner walks the character there and opens a panel.
4. Clicking the character makes him introduce himself, then opens the About panel.

Chess is one interest among several, not the theme of the site. The product and design rules live in [`portfolio-spec.md`](portfolio-spec.md).

---

## Required reading before coding

Role guides live under [`docs/`](docs/README.md). Each one opens with **You are a …**. Adopt that persona for the task ([`docs/ROLES.md`](docs/ROLES.md)).

| When | Read |
| --- | --- |
| Every change | This file |
| New zone, new module, scene structure, "where does this live?" | [`docs/SOFTWARE_ARCHITECT.md`](docs/SOFTWARE_ARCHITECT.md), front end architect |
| Any feature or bugfix | [`docs/QC.md`](docs/QC.md), senior QA |
| After writing or reviewing code | [`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md), senior engineer (quality) |
| UI, copy, colour, type, motion, layout, 3D look | [`docs/CRAFT_REVIEW.md`](docs/CRAFT_REVIEW.md), senior product / craft engineer |
| Links, external scripts or fonts, deploy, dependencies | [`docs/SAFETY_REVIEW.md`](docs/SAFETY_REVIEW.md), senior security engineer |
| Requirement IDs, design system | [`portfolio-spec.md`](portfolio-spec.md) |

Do not invent product behaviour that is not in the spec. If a request has no requirement ID, say so and propose the spec change first.

---

## Tech stack

- Vite 5, plain ES modules, no framework
- three.js for the room, GSAP for camera and object tweens
- Plain CSS in `src/style.css`, built on the Hallmark tokens in `src/styles/tokens.css` and `src/styles/base.css`
- Chillax (Fontshare) for all text
- WebAudio synthesis for sound (`src/sound.js`); no audio files
- Node's built-in test runner (`node --test`) for pure modules
- GitHub Pages deploy through `.github/workflows/deploy.yml`

Do not swap stack pieces (React, Tailwind, a model loader, a physics engine) without updating `portfolio-spec.md` first and getting approval.

---

## Development philosophy

1. Understand the request and the surrounding code first.
2. Keep the implementation simple.
3. **Do not overengineer.** No state library, no component framework, no build plugins that this site does not need.
4. Build the smallest correct change. Do not refactor unrelated code.
5. Reuse what exists (helpers in `room.js`, the `hotspot` contract, the UI module) before creating something new.
6. Never guess three.js or GSAP behaviour. Check the version in `package.json` and its docs.
7. No dead code: no commented-out blocks, unused imports or leftover `console.log`.
8. Finish only when `npm test` and `npm run build` pass and the QC pass in [`docs/QC.md`](docs/QC.md) is done.

---

## Decision making

- If something is unclear, ask. A short question beats a wrong guess.
- If a new dependency would help a lot, recommend it, explain why and **wait for approval** before installing.
- Pin versions. Do not upgrade majors as a side effect.
- Never commit until the user asks. Never force-push. Never skip hooks unless asked.
- Name local plan docs with a `-plan.md` suffix so they stay out of git.

---

## Folder structure

```txt
index.html                  # shell: intro, top row, dock, panel, sky view, bubble, noscript profile
src/
  main.js                   # boot: build the UI, wait for the font, start the world (or the no-WebGL fallback)
  fresh.js                  # on load, reload once if a newer build is live (DEPLOY-01)
  sound.js                  # WebAudio effects and the lo-fi loop
  style.css                 # CSS entry: the Hallmark stamp, then @imports, page tokens, html/body/canvas
  styles/
    tokens.css              # Hum design tokens and the room's --room-* material colours
    base.css                # base rules (focus ring, reduced motion, headings)
    controls.css            # card-stock buttons
    intro.css               # the door screen
    chrome.css              # top row (name, sound) and bottom column (hint, dock)
    panel.css               # side panel and bottom sheet
    sky.css                 # the telescope view's overlay
    overlays.css            # hover label and speech bubble
    fallbacks.css           # no WebGL, no JavaScript
  data/
    content.js              # every word, link, project, the avatar look and the interface copy
  ui/
    ui.js                   # the DOM: intro, dock, panel, bubble, tooltip, sound toggle, sky controls
    sections.js             # pure renderers: a section in, escaped HTML out
    icons.js                # logos for links, as inline SVG in the text colour
    media.js                # SHEET_QUERY, shared by the UI, the camera and panel.css
  world/
    world.js                # renderer, camera, picking, walking, close-ups, the door, the frame loop
    framing.js              # camera positions from the window size (pure)
    glow.js                 # hover highlight and per-zone materials
    activities.js           # start, stop and update what the character does at a zone
    skyView.js              # open, steer and draw the telescope view
  scene/
    room.js                 # assembles the room and owns the floor plan (obstacles)
    layout.js               # the room's size constants
    build.js                # mesh helpers and the shared material cache
    palette.js              # CSS colour tokens for three.js
    shell.js                # lights, ground, floor, walls, bunting
    props.js                # the potted plant
    nav.js                  # A* over the floor (pure)
    sky.js                  # the night sky: real star positions, constellations
    chess/
      rules.js              # chess move rules and his move choice (pure, unit-tested)
      pieces.js             # the chess set and square positions
    screens/
      monitor.js            # the code editor on the monitor
      tv.js                 # the TV's channels
    zones/                  # one file per zone; each returns its hotspot
      entrance.js desk.js lamp.js code.js contact.js books.js stars.js screen.js gym.js chess.js
    character/
      character.js          # the avatar: walking, poses, holding things
      poses.js              # joint angles per pose
      hair.js               # hair styles
      book.js               # the open book he reads
      parts.js              # the character's mesh helpers
tests/                      # node --test files for pure modules
docs/                       # agent role guides
portfolio-spec.md           # requirements and design system
```

Dependency direction:

- `main.js` → `ui/*`, `world/*`, `sound.js`, `data/content.js`.
- `world/*` → `scene/*`, `ui/media.js`, `sound.js`. The world talks to the DOM only through the `ui` object it is given.
- `scene/*` never imports `ui/` or `world/`. Zones import only `scene/build.js`, `scene/layout.js`, `scene/props.js`, their screen module and `sound.js`.
- `content.js` imports nothing.
- CSS: `style.css` imports the partials in cascade order; a partial owns its component's rules, including that component's media queries.

---

## Front end rules

- **Words live in `src/data/content.js`.** No user-facing sentence or heading is hard-coded in `ui/` or `scene/`; panel headings and labels are in `uiCopy`. Fixed control labels in `index.html` are the only exception.
- **Colours live in tokens.** CSS uses `var(--color-*)`; a new colour is a token in `styles/tokens.css` first. Scene code gets colours from `scene/palette.js`, which reads the same CSS tokens. The only literal colours allowed in JS are GitHub language colours and the monitor's syntax colours, which describe real things.
- **Never invent facts.** No made-up metrics, testimonials, book titles, film titles or quotes. A list Uday has not filled stays empty and does not render.
- Each zone in `scene/zones/` returns one hotspot, registered in `room.js` as `hotspots.<id>`, with `group`, `stand`, `view` and optional `onFocus`, `onBlur`, `interact(object, { me, point, openSky, say, again, showBook })` and `activity` (`seat`, `pose`, `hold`, `held`, `prepare`, `release`, `update`). What changes at night goes onto `timeOfDay` in the build context. Add its footprint to `obstacles` in `room.js`.
- **No copyrighted media.** Shows and films appear as their titles over pictures drawn in the room's own style; a book appears as its title and author, never its text. Official posters, stills or pages need the owner's explicit decision first.
- **Hidden is not gone.** three.js raycasts hit objects with `visible = false`. Anything that should stop catching clicks (the front wall after the intro) must be removed from the scene with `removeFromParent()`.
- Keep the frame budget: share materials through `mat()`, instance repeated parts, add no new lights or shadow casters without a reason, and keep the pixel ratio cap.
- Every animation has a reduced-motion path (`reduceMotion` flag in JS, the media query in CSS), and the site still says who Uday is with JavaScript off (`<noscript>`) and without WebGL.
- Layout must not overlap at 320, 375, 768, 1024, 1440 and 1920 px wide. The header, hint and dock live in flow containers, not in independently positioned corners.
- Accessibility: semantic HTML, a visible `:focus-visible` on every control, keyboard access to every section through the dock, Escape closes the panel. Aim for WCAG 2.2 AA; do not claim certification.

---

## JavaScript

ES modules, `const` by default, early returns, small functions. No `var`. Escape any string placed into `innerHTML` with `esc()` from `ui/sections.js`. Prefer `textContent` when there is no markup.

---

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # node --test
npm run build      # outputs to dist/
npm run preview
```

On Windows PowerShell, do not chain with `&&`. Run commands separately.

Design sweep (Hallmark, expected after UI work; it follows the `@import`s in `style.css`):

```bash
node <hallmark-skill-dir>/scripts/sloplint.mjs src/style.css --scope app --genre playful
node <hallmark-skill-dir>/scripts/sloplint.mjs src/style.css --url http://localhost:5173/ --scope app --genre playful
```

---

## Definition of done

A change is done only when:

1. Behaviour matches the request and the relevant spec IDs.
2. `npm test` and `npm run build` pass.
3. The QC checklist that applies was walked ([`docs/QC.md`](docs/QC.md)), including narrow mobile and reduced motion.
4. Code quality and craft checks are clean ([`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md), [`docs/CRAFT_REVIEW.md`](docs/CRAFT_REVIEW.md)).
5. External links, fonts and scripts were checked ([`docs/SAFETY_REVIEW.md`](docs/SAFETY_REVIEW.md)).
6. No secrets or plan docs were staged.

---

## Communication

Be concise. Say what changed and how to verify it. Do not pad with process narration.

---

## Final reminder

Before every implementation:

1. Read this file.
2. Read the docs that apply.
3. Write simple, maintainable code. Do not overengineer.
4. Prefer reuse and the smallest correct change.
5. Leave the room easier to extend and pleasant to walk around.
