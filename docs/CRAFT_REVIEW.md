# CRAFT_REVIEW.md: craft standard review

You are a **senior product engineer** (craft and design systems focus) reviewing Uday's Room for **craft**: whether it feels finished and intentional, matches the design system, reads well on every screen and respects the visitor.

Craft is not decoration. It is whether a recruiter gets to the projects fast and a curious visitor wants to keep clicking.

**Do not overengineer.** Use the existing tokens, the card-stock controls and the paper surfaces before inventing anything.

---

## When to use this doc

- Any change to `style.css`, `index.html`, `ui.js` or the room's look
- Copy changes in `content.js`
- Accessibility or motion work

Read [`../portfolio-spec.md`](../portfolio-spec.md) § 3 (design system) and [`../AGENTS.md`](../AGENTS.md).

---

## Product craft

- [ ] Traces to a spec ID, or the gap was called out
- [ ] Projects and contact are two clicks from the room
- [ ] Chess is one zone among six, never the theme
- [ ] Copy is first person, plain, warm and specific; no buzzwords (seamless, robust, passionate, elevate)
- [ ] No invented facts: no metrics, quotes or titles Uday did not give
- [ ] No dead ends: every panel offers a way back and a next step

---

## Visual craft (Hallmark, theme Hum)

- [ ] Every colour is a token; no literal colour after the token block
- [ ] Pear marks the primary action and the hover highlight, blue the links and focus, coral one loud moment. No per-section rainbow
- [ ] Never a gradient between accents, never pure white or black
- [ ] Chillax only; heads 600, sentence case
- [ ] No eyebrow above a heading, no uppercase or letter-spaced labels
- [ ] No middle-dot joined meta, no arrow glued to link text, no decorative status dots, no emoji as icons
- [ ] Round corners everywhere (24 px panels, 16 px controls)
- [ ] Shadows fall down and right
- [ ] The room reads as daylight paper and wood, matching the UI

---

## Layout craft

- [ ] The room fills the viewport width; the intro scene sits beside (desktop) or above (phone) the text
- [ ] Header, hint, dock and bubble never overlap at 320 to 1920
- [ ] Touch targets at least 44 px; the one exception is the phone dock (36 px, UI-01), so its two rows sit close
- [ ] `overflow-x: clip` on `html` and `body`; nothing sized in `100vw`

---

## Motion craft

- [ ] Only `transform` and `opacity` animate in CSS; never `transition: all`
- [ ] `--ease-spring` on the primary button only
- [ ] Every animation has a reduced-motion path
- [ ] One orchestrated moment: the door. Everything else is a response to a click

---

## Accessibility craft

- [ ] Semantic elements; the panel is a labelled dialog
- [ ] `:focus-visible` on every control, shown at once
- [ ] Body contrast 4.5:1 or more, controls 3:1 or more
- [ ] State not shown by colour alone (`aria-current`, `aria-pressed`)
- [ ] Describe accessibility as "aligned with" WCAG 2.2 AA

---

## Anti-patterns

| Avoid | Why |
| --- | --- |
| Dark navy room floating in a void | The look Uday rejected; the room must fill the screen |
| A knight or chess motif on the intro | Chess is one interest, not the brand |
| Per-section accent colours | Breaks Hum's one-job-per-accent rule |
| Text blocks over 80 words on the intro | The intro is a name, one sentence and a door |
| Tooltips or bubbles running off screen | Clamp them to the viewport |
| Official posters, stills or a scanned page | Copyright risk on a public portfolio; draw the mood, set the title as text |
| An activity that delays the panel | The panel opens on arrival; the activity plays alongside |

---

## Review output

1. **Verdict**: ship / ship with nits / needs work.
2. **Craft wins**: what already meets the bar.
3. **Must-fix**: breaks the design system, accessibility or clarity.
4. **Nits**: optional polish.
5. **Spec gaps**: anything that needs a spec update first.
