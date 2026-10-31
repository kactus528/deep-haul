// Virtual Boy-style staging, in full 16-bit color.
//
// Every view of a room is a diorama floating in a black void:
//   - one big background PAINTING at 6 m, with the whole room drawn into it
//     in one-point perspective (floor, walls, ceiling, back wall), and
//   - a handful of flat cut-out LAYERS (props, characters) standing at real
//     depths in front of it, all facing you, for stereo pop.
// No surrounding geometry. Each room has a front view and a back view.

import * as THREE from 'three';
import { pixelTexture, RAMPS as R, LIGHT, fbm } from './pixelart.js?v=19';
import { cardMaker } from './roomkit.js?v=19';

export const EYE = 1.6; // eye height the paintings are drawn for (m)
export const DP = 6; // painting distance (m)
export const PPM = 40; // painting pixels per meter at the painting plane

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const hexRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rampCache = new Map();
const rgbRamp = (ramp) => {
  if (!rampCache.has(ramp)) rampCache.set(ramp, ramp.map(hexRgb));
  return rampCache.get(ramp);
};

// A view: its own group, card maker and hit list.
export function makeView(parent) {
  const group = new THREE.Group();
  group.visible = false;
  parent.add(group);
  const maker = cardMaker(group);
  return { group, card: maker.card, hitMeshes: maker.hitMeshes, layers: maker.quads };
}

// ---------------------------------------------------------------------
// The painting.
// room: { halfW, height, depth } of the space being painted (m).
// surfaces.floor(x, z, px, py) / ceil(x, z, ...) / wall(side, z, y, ...)
//   return [ramp, index] (index may be fractional; it gets dithered).
// back(p, rect, proj) paints the back wall inside rect.
// after(p, proj, rect) adds light, grime, details anywhere.
// ---------------------------------------------------------------------
export function painting({ W = 448, H = 352, vy = 120, room, seed = 1, surfaces, back, after }) {
  const vx = W / 2;
  const k = (PPM * DP) / room.depth; // px per meter on the back wall
  const L = room.halfW * k;
  const T = (room.height - EYE) * k;
  const B = EYE * k;
  const rect = { x0: Math.round(vx - L), x1: Math.round(vx + L), y0: Math.round(vy - T), y1: Math.round(vy + B) };
  const proj = (x, y, z) => [vx + (x * PPM * DP) / z, vy - ((y - EYE) * PPM * DP) / z];

  const tex = pixelTexture(W, H, (p) => {
    p.edit((d) => {
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const dx = x - vx + 0.5, dy = y - vy + 0.5;
          const sR = dx / L, sL = -dx / L, sB = dy / B, sT = -dy / T;
          const s = Math.max(sR, sL, sB, sT);
          if (s <= 1) continue; // back wall, painted later
          const z = room.depth / s;
          const toWorld = z / (PPM * DP);
          let res;
          if (s === sB) res = surfaces.floor(dx * toWorld, z, x, y);
          else if (s === sT) res = surfaces.ceil(dx * toWorld, z, x, y);
          else res = surfaces.wall(s === sL ? -1 : 1, z, EYE - dy * toWorld, x, y);
          let [ramp, f] = res;
          // darken where two surfaces meet (corner shading)
          const second = [sR, sL, sB, sT].sort((a, b) => b - a)[1];
          if (s - second < 0.035 * s) f -= 1.3;
          // things nearer the viewer fall into shadow a little (stage lighting)
          f -= Math.max(0, (s - 2.2) * 0.25);
          const rgb = rgbRamp(ramp);
          const base = Math.floor(f), frac = f - base;
          const idx = Math.max(0, Math.min(rgb.length - 1, frac * 16 > BAYER[y & 3][x & 3] ? base + 1 : base));
          const c = rgb[idx], o = (y * W + x) * 4;
          d[o] = c[0];
          d[o + 1] = c[1];
          d[o + 2] = c[2];
          d[o + 3] = 255;
        }
    });
    back(p, rect, proj);
    if (after) after(p, proj, rect);
    // Melt the edges into the void with an ordered-dither fade.
    p.edit((d) => {
      const edge = 16;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const e = Math.min(x, W - 1 - x, y, H - 1 - y);
          if (e < edge && BAYER[y & 3][x & 3] >= (e / edge) * 16) d[(y * W + x) * 4 + 3] = 0;
        }
    });
    p.quantize();
  }, { seed });

  const size = [W / PPM, H / PPM];
  const center = [0, EYE - (H / 2 - vy) / PPM];
  // A world-space box (x0..x1, y0..y1, z0..z1 in meters, z = distance ahead)
  // as a uv rectangle on this painting, for hotspots.
  const region = (x0, x1, y0, y1, z0, z1) => {
    const pts = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(proj(x, y, z));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return [Math.min(...xs) / W, 1 - Math.max(...ys) / H, Math.max(...xs) / W, 1 - Math.min(...ys) / H];
  };
  // A rectangle in back-wall pixel space (fractions of rect) as a uv rect.
  const backRegion = (fx0, fy0, fx1, fy1) => {
    const x0 = rect.x0 + (rect.x1 - rect.x0) * fx0, x1 = rect.x0 + (rect.x1 - rect.x0) * fx1;
    const y0 = rect.y0 + (rect.y1 - rect.y0) * fy0, y1 = rect.y0 + (rect.y1 - rect.y0) * fy1;
    return [x0 / W, 1 - y1 / H, x1 / W, 1 - y0 / H];
  };
  return { tex, size, center, proj, rect, region, backRegion };
}

// Place a painting in a view, with any number of region hotspots.
export function hangPainting(view, pnt, regions = []) {
  const m = view.card(pnt.tex, pnt.size[0], pnt.size[1], [pnt.center[0], pnt.center[1], -DP], { order: -1 });
  m.userData.regions = regions.map(([spot, region]) => ({ spot, region }));
  return m;
}

// Stand a flat cut-out layer at distance z (m), x across, bottom at y0.
export function layer(view, tex, w, h, x, y0, z, opts = {}) {
  return view.card(tex, w, h, [x, y0 + h / 2, -z], opts);
}

// Draw an existing texture's image into the painting's back wall.
export function blitBack(p, tex, rect, fx0 = 0, fy0 = 0, fx1 = 1, fy1 = 1) {
  const g = p.g;
  g.imageSmoothingEnabled = false;
  const w = rect.x1 - rect.x0, h = rect.y1 - rect.y0;
  g.drawImage(tex.image, Math.round(rect.x0 + w * fx0), Math.round(rect.y0 + h * fy0), Math.round(w * (fx1 - fx0)), Math.round(h * (fy1 - fy0)));
}

// ---------------------------------------------------------------------
// Surface makers (patterns computed in world meters, so they stay put in
// perspective).
// ---------------------------------------------------------------------
const fr = (v) => v - Math.floor(v);

export function treadFloor({ ramp = R.dark, tile = 0.6, walkway = 0.4, pools = [], seed = 3 } = {}) {
  return (x, z) => {
    let f = 3.6;
    const u = fr(x / tile), w = fr(z / tile);
    if (u < 0.05 || w < 0.05) f = 1.6;
    else if (u > 0.95 || w > 0.95) f = 5;
    else if (fr(x / 0.1 + (Math.floor(z / 0.1) % 2) * 0.5) < 0.3 && fr(z / 0.1) < 0.3) f = 5.4;
    f -= (fbm(x * 1.4, z * 1.4, seed) - 0.5) * 2.2;
    for (const pl of pools) {
      const d = Math.hypot(x - pl.x, z - pl.z) / pl.r;
      if (d < 1) f += (pl.s || 1.6) * (1 - d) * (1 - d);
    }
    if (walkway && Math.abs(x) < walkway) {
      const stripe = fr((x + z) / 0.3) < 0.5;
      return [stripe ? R.hazard : R.black, stripe ? Math.min(f + 1, 6) : 2];
    }
    return [ramp, f];
  };
}

export function panelWall({ ramp = R.steel, paint = null, seam = 1.5, pipeY = 2.55, feature = null, seed = 5 } = {}) {
  return (side, z, y, px, py) => {
    if (feature) {
      const r = feature(side, z, y, px, py);
      if (r) return r;
    }
    let f = 3.4 + (y / 3) * 1.2;
    let rp = ramp;
    if (paint && y < 1.3) {
      rp = paint;
      f = 3.4 + y;
      if (y > 1.24) f = 6;
    }
    if (fr(z / seam) < 0.03) f = 1.2;
    if (Math.abs(y - pipeY) < 0.09) {
      rp = R.steel;
      f = 2 + 4.6 * Math.cos(((y - pipeY) / 0.09) * 1.4);
    }
    if (y < 0.12) f = 1;
    f -= (fbm(z * 1.6, y * 1.6, seed + (side > 0 ? 7 : 0)) - 0.5) * 2;
    return [rp, f];
  };
}

export function lampCeiling({ ramp = R.dark, lamps = [], seed = 7 } = {}) {
  return (x, z) => {
    for (const l of lamps) if (Math.abs(x - l.x) < (l.w || 0.6) && Math.abs(z - l.z) < (l.d || 0.3)) return [R.beige, 6.8];
    let f = 2.2;
    if (fr(z / 1.2) < 0.04) f = 0.8;
    if (Math.abs(Math.abs(x) - 1.0) < 0.12) return [R.steel, 3 + 2 * Math.cos(((Math.abs(x) - 1) / 0.12) * 1.4)];
    f -= (fbm(x, z, seed) - 0.5) * 1.6;
    return [ramp, f];
  };
}
