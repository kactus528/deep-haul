// Cryo Bay 3 — placeholder room for the VERTEX test.
// Every card is generated pixel art in the 512-color palette, stood up at a
// real depth around the player's spot (the origin). Replace textures with
// hand-drawn art later; positions and sizes can stay.

import * as THREE from 'three';
import { cardMaterial, settings, FOG, MAX_QUADS } from './vertex.js';

// Palette helper: 0-7 per channel, i.e. the VERTEX's 3-3-3 master palette.
const L = (v) => Math.round((v * 255) / 7);
const P = (r, g, b) => `rgb(${L(r)},${L(g)},${L(b)})`;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pixelTexture(w, h, draw, { repeatX = false } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const R = (x, y, ww, hh, col) => {
    g.fillStyle = col;
    g.fillRect(x | 0, y | 0, ww, hh);
  };
  const text = (s, x, y, col) => {
    g.font = '8px monospace';
    g.textBaseline = 'top';
    g.fillStyle = col;
    g.fillText(s, x, y);
  };
  draw(R, w, h, text);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  if (repeatX) t.wrapS = THREE.RepeatWrapping;
  t.userData.redraw = () => {
    g.clearRect(0, 0, w, h);
    draw(R, w, h, text);
    t.needsUpdate = true;
  };
  return t;
}

export function buildCryoBay(scene) {
  scene.background = FOG;
  const r = rng(7);
  let quads = 0;

  const card = (tex, w, h, pos, { rot, face, order = 0, segs = 1, counted = true, tint = 1 } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, segs, segs), cardMaterial(tex, { tint }));
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (face) m.lookAt(face[0], face[1], face[2]);
    m.renderOrder = order; // structure (-1) always drawn before props (0)
    if (counted) {
      m.userData.card = true;
      quads += segs * segs;
    }
    scene.add(m);
    return m;
  };

  // ---------- textures ----------
  const wall = pixelTexture(128, 72, (R, w, h) => {
    R(0, 0, w, h, P(1, 1, 2));
    for (let y = 0; y < h; y += 12) R(0, y, w, 1, P(0, 0, 1));
    for (let x = 0; x < w; x += 16) {
      R(x, 0, 1, h, P(0, 0, 1));
      for (let y = 3; y < h; y += 12) R(x + 2, y, 1, 1, P(2, 2, 3));
    }
    R(0, 4, w, 2, P(4, 0, 0));
    R(40, 16, 48, 56, P(2, 2, 3)); // hatch
    R(44, 22, 40, 50, P(1, 1, 1));
    for (let i = 0; i < 12; i++) R(40 + i * 4, 16, 4, 4, i % 2 ? P(6, 5, 0) : P(0, 0, 0));
    R(62, 22, 4, 50, P(0, 0, 1));
    R(48, 40, 8, 4, P(0, 5, 1));
  });

  const floor = pixelTexture(64, 64, (R, w, h) => {
    R(0, 0, w, h, P(1, 1, 1));
    for (let i = 0; i < w; i += 8) {
      R(i, 0, 1, h, P(2, 2, 2));
      R(0, i, w, 1, P(2, 2, 2));
      R(i + 1, 0, 1, h, P(0, 0, 0));
    }
    for (let k = 0; k < 40; k++) R(r() * w, r() * h, 1, 1, P(0, 0, 1));
    R(28, 0, 8, h, P(3, 3, 0));
    for (let y = 0; y < h; y += 8) R(28, y, 8, 4, P(0, 0, 0));
  });

  const ceiling = pixelTexture(64, 64, (R, w, h) => {
    R(0, 0, w, h, P(0, 0, 1));
    R(0, 10, w, 4, P(2, 1, 1));
    R(0, 11, w, 1, P(4, 2, 2));
    R(0, 44, w, 3, P(1, 2, 2));
    for (const x of [8, 40]) {
      R(x, 24, 16, 8, P(6, 6, 5));
      R(x + 1, 25, 14, 6, P(7, 7, 6));
    }
  });

  const side = pixelTexture(96, 48, (R, w, h) => {
    R(0, 0, w, h, P(1, 1, 2));
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 24;
      R(x, 8, 18, 32, P(0, 0, 1));
      R(x + 3, 12, 12, 18, P(2, 4, 6));
      R(x + 5, 14, 3, 10, P(4, 6, 7));
      R(x + 3, 34, 12, 2, P(0, 5, 1));
    }
    R(0, 2, w, 2, P(6, 5, 0));
    R(0, 44, w, 4, P(1, 1, 1));
  });

  const pod = (open) =>
    pixelTexture(32, 64, (R) => {
      R(6, 2, 20, 2, P(1, 1, 2));
      R(4, 4, 24, 54, P(1, 1, 2));
      R(5, 4, 22, 54, P(3, 3, 4));
      R(8, 8, 16, 34, open ? P(0, 1, 2) : P(3, 5, 7));
      if (open) {
        R(8, 8, 16, 2, P(1, 2, 3));
      } else {
        for (let k = 0; k < 30; k++) R(8 + r() * 16, 8 + r() * 34, 1, 1, P(6, 7, 7));
        R(10, 10, 6, 3, P(6, 7, 7));
      }
      R(4, 58, 24, 6, P(2, 2, 2));
      R(14, 46, 4, 3, open ? P(6, 0, 0) : P(0, 6, 1));
      R(7, 50, 18, 1, P(2, 2, 3));
    });
  const podClosed = pod(false);
  const podOpen = pod(true);

  const crtLines = ['DORIS 3.1', 'CREW 0/212', 'ELAPSED', '400Y 2M 11D', 'NAV:LOCKED', 'MURDER? Y', 'SNACK? N', '*********'];
  const crtState = { scroll: 0, cursor: true };
  const crt = pixelTexture(64, 48, (R, w, h, text) => {
    R(0, 0, w, h, P(3, 3, 2));
    R(3, 3, w - 6, h - 10, P(0, 1, 0));
    for (let i = 0; i < 5; i++) text(crtLines[(crtState.scroll + i) % crtLines.length], 5, 4 + i * 7, P(1, 7, 2));
    if (crtState.cursor) R(52, 33, 4, 5, P(1, 7, 2));
    R(4, h - 5, 8, 2, P(6, 0, 0));
  });

  const desk = pixelTexture(32, 48, (R) => {
    R(4, 0, 24, 6, P(3, 3, 3));
    R(6, 6, 20, 42, P(2, 2, 3));
    R(8, 10, 16, 8, P(1, 1, 1));
    R(14, 13, 4, 2, P(4, 4, 4));
  });

  const pipe = pixelTexture(128, 12, (R, w) => {
    R(0, 3, w, 6, P(2, 2, 2));
    R(0, 4, w, 1, P(4, 4, 4));
    R(0, 8, w, 1, P(1, 1, 1));
    for (let x = 0; x < w; x += 32) R(x + 2, 0, 4, 12, P(3, 2, 1));
  });

  const cable = pixelTexture(8, 48, (R) => {
    for (let y = 0; y < 44; y++) R(3 + Math.round(Math.sin(y / 6)), y, 2, 1, P(1, 1, 1));
    R(1, 44, 6, 4, P(5, 0, 0));
  });

  const mist = pixelTexture(
    64,
    16,
    (R, w, h) => {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) if ((x + y) % 2 === 0 && r() < (y / h) * 0.9) R(x, y, 1, 1, P(5, 6, 7));
    },
    { repeatX: true }
  );

  const eyeTex = pixelTexture(16, 16, (R) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x - 7.5, y - 7.5);
        if (d < 2.5) R(x, y, 1, 1, P(7, 4, 4));
        else if (d < 5) R(x, y, 1, 1, P(5, 0, 0));
        else if (d < 7.5) R(x, y, 1, 1, P(2, 2, 2));
      }
  });

  const sign = pixelTexture(48, 12, (R, w, h, text) => {
    R(0, 0, w, h, P(6, 5, 0));
    R(1, 1, w - 2, h - 2, P(5, 4, 0));
    text('CRYO BAY 3', 3, 2, P(0, 0, 0));
  });

  const crate = pixelTexture(24, 24, (R) => {
    R(0, 0, 24, 24, P(3, 2, 1));
    R(1, 1, 22, 22, P(4, 3, 1));
    for (let i = 0; i < 21; i++) {
      R(1 + i, 1 + i, 2, 1, P(3, 2, 1));
      R(21 - i, 1 + i, 2, 1, P(3, 2, 1));
    }
    R(0, 11, 24, 2, P(2, 1, 0));
  });

  // ---------- layout (meters; player stands at the origin facing -z) ----------
  const H = Math.PI / 2;
  card(floor, 6, 6.2, [0, 0, -1.9], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 6, 6.2, [0, 3.2, -1.9], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(wall, 6, 3.2, [0, 1.6, -5], { order: -1, segs: 2 });
  card(wall, 6, 3.2, [0, 1.6, 1.2], { rot: [0, Math.PI, 0], order: -1, segs: 2 });
  card(side, 6.2, 3.2, [-3, 1.6, -1.9], { rot: [0, H, 0], order: -1, segs: 2 });
  card(side, 6.2, 3.2, [3, 1.6, -1.9], { rot: [0, -H, 0], order: -1, segs: 2 });

  for (const [x, z] of [[-1.7, -1.4], [-1.7, -3.2], [1.7, -1.4], [1.7, -3.2]]) {
    card(podClosed, 0.9, 1.8, [x, 0.9, z], { face: [0, 0.9, 0] });
  }
  card(podOpen, 0.9, 1.8, [0, 0.9, 0.8], { face: [0, 0.9, 0] }); // Gus's pod, behind you

  card(desk, 0.6, 0.9, [-0.8, 0.45, -1.1], { face: [0, 0.45, 0] });
  card(crt, 0.5, 0.375, [-0.8, 1.1, -1.08], { face: [0, 1.1, 0] });
  card(pipe, 4.5, 0.42, [0, 2.75, -1.3]);
  card(cable, 0.15, 0.9, [0.7, 2.35, -0.9]);
  const mistCard = card(mist, 6, 0.6, [0, 0.3, -3.6]);
  const eye = card(eyeTex, 0.4, 0.4, [0, 2.7, -3.4], { face: [0, 1.6, 0] });
  card(sign, 1.2, 0.3, [0, 2.75, -4.9]);
  card(crate, 0.9, 0.9, [-2.2, 0.45, -4.2], { face: [0, 0.45, 0] });
  card(crate, 0.9, 0.9, [2.3, 0.45, -4.4], { face: [0, 0.45, 0] });

  // ---------- debug HUD (not counted against the budget) ----------
  const hud = pixelTexture(96, 40, (R, w, h, text) => {
    R(0, 0, w, h, P(0, 0, 0));
    R(0, 0, w, 1, P(2, 2, 3));
    text('VERTEX TEST', 3, 2, P(1, 7, 2));
    text(`QUADS ${quads}/${MAX_QUADS}`, 3, 11, quads > MAX_QUADS ? P(7, 1, 1) : P(1, 7, 2));
    const items = [['LO', settings.lowres], ['PAL', settings.palette], ['SNP', settings.snap], ['AFF', settings.affine], ['20F', settings.steppedAnim]];
    let x = 3;
    for (const [s, on] of items) {
      text(s, x, 22, on ? P(1, 7, 2) : P(2, 2, 2));
      x += s.length * 5 + 4;
    }
    text('ABXY / 1-6', 3, 31, P(3, 3, 4));
  });
  card(hud, 0.4, 0.1667, [-0.42, 1.05, -0.75], { face: [0, 1.6, 0], counted: false });

  if (quads > MAX_QUADS) console.warn(`[VERTEX] ${quads} quads exceeds the ${MAX_QUADS} budget`);
  else console.info(`[VERTEX] ${quads}/${MAX_QUADS} quads`);

  let t = 0;
  return {
    quads,
    refreshHud: () => hud.userData.redraw(),
    update(dt) {
      t += dt;
      crtState.scroll = Math.floor(t / 1.2);
      crtState.cursor = Math.floor(t * 2) % 2 === 0;
      crt.userData.redraw();
      mistCard.material.uniforms.uUvOffset.value.x = (t * 0.05) % 1;
      eye.material.uniforms.uTint.value = 0.75 + 0.35 * Math.sin(t * 2.2);
    },
  };
}
