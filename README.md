# Uday's Room

The portfolio of Uday Raj Sahai, full stack developer. It is a full-width 3D room built with three.js.

You start outside a red door. Uday's character waves and says hello. Press **Enter**, and he opens the door and walks you in. Each corner of the room is one part of his life:

| Zone | Opens | Try in close-up |
|---|---|---|
| Desk and monitor | Code (projects, stack, GitHub languages) | He sits and types; click the screen to switch files |
| Bookshelf and reading chair | Books: reading now, book club, philosophy, psychology | He takes *Tuesdays with Morrie* to the chair and reads |
| TV and sofa | Films, TV series and anime | He sits with the remote; click the TV and he changes channel (One Piece, Breaking Bad, Interstellar) |
| Rack and bench | Gym | He lies down and bench presses |
| Telescope at the window | Stars (astronomy) | He leans to the eyepiece; click it to look through: drag, arrow keys and zoom around real constellations |
| Chess table | Chess (Caissa) | He sits at the board; click a piece to make it hop |
| Envelope on the desk | Say hello | |
| The character | About me | He introduces himself first |

The desk lamp switches on and off.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # node --test, no extra dependencies
npm run build    # outputs to dist/
```

## Edit your content

Every word, link and project lives in `src/data/content.js`. The `favourites` lists under Books and Films are empty on purpose. Add your own titles and they will show up. Empty lists don't render.

## Working on it

Read [`AGENTS.md`](AGENTS.md) first. Then read the role guide in [`docs/`](docs/README.md) that fits the task. Requirements and the design system live in [`portfolio-spec.md`](portfolio-spec.md).

The look comes from Hallmark's **Hum** theme: cream paper, blue-black ink, pear for the main action, blue for links and coral for one loud moment. All colours are tokens in `src/styles/tokens.css`, and the 3D room reads the same tokens through `src/scene/palette.js`.

## Files

- `src/main.js`: boot
- `src/world/`: the 3D side wired together (camera, picking, walking, activities, the door, the telescope view)
- `src/scene/`: the room, built from primitives; one file per zone in `scene/zones/`, the avatar in `scene/character/`
- `src/ui/`: the page around the scene (intro, dock, panel, bubble)
- `src/styles/`: tokens, base rules and one stylesheet per component, imported by `src/style.css`
- `src/sound.js`: synthesised sound effects and the lo-fi loop

The full map, and which module may import which, is in [`AGENTS.md`](AGENTS.md).

It respects reduced-motion settings. Without WebGL, the dock and panels still work. With JavaScript off, a short profile with links is shown.
