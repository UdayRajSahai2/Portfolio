# Uday's Room: product and design spec

The single source of truth for what the portfolio does and how it looks. Every change traces to an ID below. To change behaviour, change this file first.

---

## 1. Purpose

Show who Uday Raj Sahai is, as a developer and as a person, in a way a visitor remembers. A recruiter should reach his projects and contact links in two clicks. A curious visitor should be able to wander.

Audience: recruiters and engineering leads hiring full stack or frontend developers, freelance clients, and friends.

The one action: open a project or get in touch.

---

## 2. Requirements

### Intro (the door)

| ID | Requirement |
| --- | --- |
| INTRO-01 | The first screen shows the outside of the room: a closed door in a front wall and Uday's character beside it, waving, with a speech bubble saying hello. |
| INTRO-02 | Beside the scene: a headline (his name), one sentence (what he is) and an **Enter** button. Nothing else. All of it is visible at 1280 x 800 and at 375 x 667 without scrolling. |
| INTRO-03 | Enter is disabled with a plain status line ("Setting up the room") until the scene and fonts are ready. |
| INTRO-04 | On Enter, the character turns, walks to the door and opens it, then walks through. The front wall fades away and the full room is revealed. The sequence takes about four seconds. |
| INTRO-05 | With reduced motion the door opens and the room appears without the walk or the camera move. |
| INTRO-06 | There is no chess imagery on the intro: no knight icon, no chess favicon, no chess print on the character. |

### Room

| ID | Requirement |
| --- | --- |
| ROOM-01 | The room fills the full width of the viewport at every size from 320 to 1920 px. No floating diorama in the middle of an empty background. |
| ROOM-02 | The room has one zone per interest: **Code** (desk and monitor), **Chess** (table and board), **Books** (bookshelf and reading chair; covers the book club, philosophy and psychology), **Screen** (TV and sofa; films, TV series and anime), **Gym** (rack, bench, barbell, dumbbells), **Stars** (telescope at the window; astronomy) and **Contact** (envelope on the desk). |
| ROOM-03 | Hovering a zone highlights it and shows its name. Clicking or tapping the object itself in the 3D scene (not only the dock) walks the character there, he says a short line, the camera moves in and the zone's panel opens. |
| ROOM-04 | Clicking the floor walks the character to that spot around furniture. Dragging rotates the view all the way round the room (the tilt stays limited); a wall between the camera and the room steps aside. |
| ROOM-05 | Each zone has one small interaction in close-up: the monitor switches files, a chess piece hops, a book slides out, the TV changes channel, the barbell lifts, the window turns to night and shows the stars. |
| ROOM-06 | The desk lamp toggles on and off. |
| ROOM-07 | Day and night: the room opens in day from 06:00 to 18:00 on the visitor's clock and in night otherwise. At night the sky outside is dark, the window shows the night sky, moonlight replaces the sun and the room is lit warm from inside. A Night toggle in the top row switches between them for the visit. The page's paper cards look the same in both. Without WebGL the toggle is hidden. |
| ROOM-08 | Nothing in the room flickers as the camera moves: surfaces that lie on others (rug, screens, posters, window, paper) sit far enough off them, or draw with a polygon offset. |

### Activities (the character does each interest)

The panel opens as soon as the character arrives; the activity plays alongside it and never delays the panel.

| ID | Requirement |
| --- | --- |
| ACT-01 | **Code:** he sits on the desk chair and types; his hands tap in time with the monitor. |
| ACT-02 | **Books:** he pulls a book off the shelf, carries it to the reading chair, sits and reads. The open book shows the title and author of what he is reading now (*Tuesdays with Morrie*, Mitch Albom) and its pages turn. No text from the book itself is reproduced. |
| ACT-08 | **His shelf:** the books listed in `shelf` in `content.js` stand on the shelf with their titles on the spines; filler books fill the gaps. In the Books close-up, hovering one names it. Clicking one makes him put his book back, take that one to the chair and read it, its cover the same colours as its spine; he says in one line what it is about, and "Reading now" in the panel shows it. Leaving the zone puts it back; the next visit starts with what he is reading now. The panel lists the shelf. |
| ACT-03 | **Films and anime:** he sits on the sofa with a remote. Clicking the TV makes him press the remote and the channel changes. Channels: One Piece (anime), Breaking Bad (series), Interstellar (film), each drawn in the room's own style with its title as text. No official artwork. |
| ACT-04 | **Gym:** he lies on the bench and presses the barbell; the bar follows his hands. |
| ACT-05 | **Stars:** he walks to the telescope and leans to the eyepiece. |
| ACT-06 | **Chess:** he sits on a stool across the board from the visitor and plays black (see CHESS). |
| ACT-07 | Leaving a zone ends the activity: he stands, puts back what he took (the book, the bar) and steps off. |

### Chess (a game against the character)

| ID | Requirement |
| --- | --- |
| CHESS-01 | The board faces the visitor, who plays white from the camera side; the character plays black from the far stool. The game starts from the position on the board, white to move. |
| CHESS-02 | In the chess close-up, clicking a white piece lifts it and marks every square it can move to. Clicking a marked square moves it there (capturing what stands there); clicking anywhere else puts it down. |
| CHESS-03 | Moves follow the rules of chess, except castling and en passant: a move that leaves your own king in check is not allowed, and a pawn reaching the last rank becomes a queen. |
| CHESS-04 | After each white move the character answers with a black move: his arm reaches for the board and the piece moves. He prefers captures and checks, with some variety. While he moves, the visitor cannot. |
| CHESS-05 | He says "Check." when he gives check. Checkmate or stalemate ends the game with a line from him, and the board resets a moment later. The game survives leaving and returning to the zone. |
| CHESS-06 | The move logic is a pure module with unit tests. No chess library is added. |

### Sky view (the telescope)

| ID | Requirement |
| --- | --- |
| SKY-01 | From the Stars panel (a button) or by clicking the telescope, a full-screen sky view opens: a night sky with real bright stars and labelled constellations (Orion, the Big Dipper, Cassiopeia, the Southern Cross) at their real positions. |
| SKY-02 | Controls: drag to look around, the mouse wheel or plus and minus buttons to zoom, arrow keys or on-screen buttons to look left, right, up and down. A status line names the constellation in view. |
| SKY-03 | Escape or "Back to the room" closes it and returns focus. While it is open the room is not rendered. |

### Character

| ID | Requirement |
| --- | --- |
| CHAR-01 | Clicking the character makes him wave and introduce himself in a few short speech lines, then the About panel opens. Clicking again while he talks skips to the panel. |
| CHAR-02 | His look (skin, hair, clothes) comes from `avatar` in `content.js`. |
| CHAR-03 | The speech bubble stays fully on screen at every viewport size. |

### Interface

| ID | Requirement |
| --- | --- |
| UI-01 | A dock lists every section (About, the six interests, Contact) and works by keyboard. It opens the same panels as the room. At 720 px and narrower it is a 4 x 2 grid of short labels, with every section visible at once and no horizontal scrolling. At 560 px and narrower its buttons are 36 px tall, so the two rows sit close (above the 24 px WCAG 2.2 AA minimum). |
| UI-02 | The panel is a side sheet on landscape screens 721 px and wider, and a bottom sheet on phones and any portrait screen (`SHEET_QUERY` in `ui.js`, the same media query in `style.css`). While it is open, the dock centres beside the side sheet at 1200 px and wider and steps aside below that. Escape and the close button both close it and return focus. |
| UI-06 | Close-ups fit the part of the screen the panel leaves free: the camera steps back by how much the panel narrows the view, and never leaves the room. The activity stays in view at every size. |
| UI-03 | Nothing overlaps at 320, 375, 414, 768, 1024, 1440 or 1920 px wide: the header (name and sound) is one row, and the hint sits above the dock in the same column. |
| UI-04 | A sound toggle, remembered across visits. All sound is synthesised. A Night toggle sits beside it (ROOM-07); on phones both show their icon only. |
| UI-05 | Without WebGL the intro still shows and Enter opens the dock and panels without the room. With JavaScript off a short static profile with links is shown. |

### Content

| ID | Requirement |
| --- | --- |
| CONTENT-01 | Every word, link and project lives in `src/data/content.js`. |
| CONTENT-02 | No invented facts: no metrics, testimonials, quotes, book or film titles that Uday did not provide. Empty lists do not render. |
| CONTENT-03 | The About panel carries his introduction: full stack developer; lifts weights; reads; a film, TV and anime buff; in a book club; drawn to philosophy, psychology and astronomy; learns by experimenting. It also lists experience and links to each interest. |
| CONTENT-04 | The Code panel shows at most five projects (`projectLimit`), then a "View all repositories" link with the GitHub logo to his GitHub repositories tab. |
| CONTENT-05 | The Contact panel marks the email with the Gmail logo and each profile link with its own logo (GitHub, LinkedIn). Logos are inline SVG in the text colour (`currentColor`), never brand colours, and hidden from screen readers; the link text names the destination. |

### Quality

| ID | Requirement |
| --- | --- |
| A11Y-01 | Every control has a visible `:focus-visible` style that appears at once. |
| A11Y-02 | Body text contrast is at least 4.5:1, large text and controls at least 3:1. |
| A11Y-03 | Every animation respects `prefers-reduced-motion`. |
| PERF-01 | The first build of the scene runs once; no model or texture files are downloaded. Pixel ratio is capped at 1.5, the shadow map at 1024, and there is at most one point light. |
| PERF-02 | Materials are shared by colour; repeated small parts (keyboard keys) are instanced. Canvas screens redraw slowly unless their zone is in close-up. |
| PERF-03 | The character walks at about 4.4 units a second, and close-up camera moves take about a second. |

---

## 3. Design system

Built with Hallmark, theme **Hum** (dealt 3/3, playful genre): cut paper made by hand, cheerful without being childish.

### Colour

All colours are OKLCH tokens in `src/styles/tokens.css`. The 3D room reads the same tokens through `src/scene/palette.js`.

| Token | Job |
| --- | --- |
| `--color-paper`, `-2`, `-3` | Grounds: the page, panels, raised paper |
| `--color-ink`, `-2`, `--color-muted` | Text, from heads to captions |
| `--color-accent` (pear) | The primary action and the hover highlight in the room. One job. |
| `--color-accent-2` (blue) | Links and the focus ring |
| `--color-accent-3` (coral) | One loud moment per screen (the speech bubble's edge, the open door) |
| `--color-mint` | Growth and "on" states |
| `--room-*` | The room's materials: walls, floor, wood, fabric, metal, sky |

Never a gradient between two accents, never a rainbow of per-section colours, never pure white or pure black.

### Type

Chillax 500 and 600 for everything. Heads 600 with `-0.03em` tracking, sentence case. Labels are the body face a step smaller, sentence case, untracked. No uppercase labels.

### Surfaces and controls

- Round everywhere: 24 px panels, 16 px controls, pills for the dock.
- Controls are card stock: a solid edge below that rises on hover and presses on click.
- Light falls from the top left; shadows fall down and right.

### Motion

`--ease-snap` for UI, `--ease-spring` on the primary button only. GSAP drives the camera. Reduced motion jumps to the end state.

### Exception on record

Hum forbids a drawn character. This site is built around Uday's avatar by his request, so the character stays. It is built from 3D primitives, not an illustration.

---

## 4. Out of scope

- A backend, a contact form or analytics
- A CMS; content is edited in `content.js`
- Loading 3D models; everything is built from primitives
