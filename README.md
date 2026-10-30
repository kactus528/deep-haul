# Deep Haul — VERTEX test room

Milestone 1 of Deep Haul: one room (Cryo Bay 3) rendered the way a fictional 1990 3D add-on, the **Taiyo VERTEX**, would have drawn it. Runs in the Meta Quest 2 browser via WebXR, with a flat preview on desktop.

## What the "hardware" does

- 256 × 224 picture per eye, scaled up with hard pixel edges
- 32–64 textured quads per frame (the room uses 38; the HUD shows the count)
- No z-buffer: cards are drawn back to front (painter's algorithm)
- Affine texture mapping, so floors and walls swim slightly
- Vertices snap to the pixel grid, so things jitter as you move
- 512-color master palette (3 bits per channel) with 4×4 Bayer dithering
- World animation at 20 fps; head tracking always at full headset rate
- Leaning more than 30 cm from your spot fades the view out, so the flat edges of cards never show

## Run it

**On Quest 2:** WebXR needs HTTPS. Turn on GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main`, root), then open `https://<user>.github.io/deep-haul/` in the Quest browser and press **Enter VR**. Stand still in a clear space; the room is built around where you start.

**On desktop:** serve the folder (`npx serve .` or any static server) and open it in a browser.

## Controls

| Toggle | Desktop | Quest |
| --- | --- | --- |
| Low resolution | 1 | X |
| Palette + dither | 2 | A |
| Vertex snap | 3 | B (with affine) |
| Affine textures | 4 | B (with snap) |
| 20 fps animation | 5 | Y |
| Scanlines | 6 | — |

Desktop: drag to look, WASD to lean.

## Files

- `src/vertex.js` — the VERTEX pipeline: low-res per-eye targets, card shader (snap, affine, banded fog), palette/dither display pass
- `src/room-cryo.js` — placeholder pixel-art cards and their placement
- `src/main.js` — renderer, flat/VR loop, controls

All art is generated placeholder art in the VERTEX palette, meant to be replaced with hand-drawn cards.
