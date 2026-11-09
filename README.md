# Uday's Room

A 3D portfolio built with three.js. Visitors explore a late-evening room where each object stands for an interest, and clicking an object opens the projects behind it.

| Object | Section |
|---|---|
| Chessboard | Chess (Caissa) |
| Monitor | Code |
| Turntable | Music |
| Bookshelf | Books |
| Corkboard | About |
| Envelope | Contact |
| Desk lamp | Turns the light on and off |

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Edit your content

Everything you'd edit lives in `src/data/content.js`. That includes your name, intro, interests, projects (with links), contact links and the code typed on the monitor. Lines that need your details are marked `TODO`.

If you give a project a `url`, it becomes a link. Without one, it shows "Link coming soon".

## The character

A character walks you around the room:
- Clicking an object, or a section in the dock, makes it walk over, turn and say a line. Then the camera moves in close and the section opens.
- Clicking the floor makes it walk to that spot.
- Clicking the character makes it wave.

To make it look like you, edit `avatar` in `content.js`: skin and hair colors, `hairStyle` (short, curly, long, bun, buzz or spiky), `facialHair`, `glasses`, clothes and the symbol on the shirt. You can change each interest's speech line with its `say` field.

## Add a new interest

1. Add an entry to `interests` in `content.js`. It shows up in the dock and opens a panel right away.
2. To give it an object in the room, build a group in `src/scene/room.js` and register it as `hotspots.<id>`. The group needs a `group`, a `view` (camera `pos` and `target`), and a `stand` spot (where the character walks to and what it faces). It can optionally have `onFocus`, `onBlur` and `interact` handlers. Then add the new object's footprint to `obstacles` so the character walks around it. The existing hotspots are good examples to copy.

## Files

- `src/main.js`: renderer, camera, controls, picking and the camera flights
- `src/scene/room.js`: every object, built from primitives (there are no model files)
- `src/ui.js`: dock, panel, tooltip and loader
- `src/sound.js`: synthesised WebAudio sound effects and the lo-fi loop
- `src/style.css`: styles; the panel turns into a bottom sheet on phones

The site respects reduced-motion settings. Without WebGL, it falls back to the dock and panels.
