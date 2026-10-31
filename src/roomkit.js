// Shared building blocks for rooms: a card maker (counts the VERTEX quad
// budget and tracks what the pointer can hit) and reusable 16-bit texture
// builders for walls, floors, ceilings and doors.

import * as THREE from 'three';
import { cardMaterial } from './vertex.js?v=31';
import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=31';

export function cardMaker(group) {
  let quads = 0;
  const hitMeshes = [];
  // segs: a number, or [across, down]
  // geo/proj/nQuads: a custom shape (the painted room box) instead of a plane.
  const card = (tex, w, h, pos, { rot, face, order = 0, segs = 1, counted = true, tint = 1, spot = null, region = null, noHit = false, geo = null, proj = null, nQuads = 0 } = {}) => {
    const [sx, sy] = Array.isArray(segs) ? segs : [segs, segs];
    const m = new THREE.Mesh(geo || new THREE.PlaneGeometry(w, h, sx, sy), cardMaterial(tex, { tint, proj }));
    m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    if (face) m.lookAt(face[0], face[1], face[2]);
    m.renderOrder = order;
    if (counted) quads += geo ? nQuads : sx * sy;
    if (spot) m.userData.spot = spot;
    if (region) m.userData.region = region;
    if (!noHit) hitMeshes.push(m);
    group.add(m);
    return m;
  };
  return { card, hitMeshes, quads: () => quads };
}

export const H = Math.PI / 2;

// ---------------------------------------------------------------------
// Painted metal wall with panel seams, rivets, a pipe run and wear.
// opts.paint: a ramp for a painted band along the lower wall.
// ---------------------------------------------------------------------
export function wallTex(w, h, { seed = 1, paint = null, pipes = true, panel = 48, lights = [], tint = LIGHT.warm } = {}) {
  return pixelTexture(w, h, (p) => {
    p.vgrad(0, 0, w, h, R.steel, 3.8, 1.6);
    if (paint) {
      const y0 = Math.floor(h * 0.55);
      p.vgrad(0, y0, w, h - y0, paint, 4.2, 2.2);
      p.rect(0, y0, w, 1, paint[6]);
      p.rect(0, y0 + 1, w, 1, paint[1]);
    }
    for (let x = 0; x < w; x += panel) {
      p.rect(x, 0, 1, h, R.steel[0]);
      p.rect(x + 1, 0, 1, h, R.steel[5]);
      for (let y = 8; y < h - 4; y += 28) {
        p.rivet(x + 4, y, R.steel);
        p.rivet(x + panel - 6, y, R.steel);
      }
    }
    if (pipes) {
      p.hcyl(0, 6, w, 9, R.steel, 1, 6.5);
      p.hcyl(0, 16, w, 5, R.rust, 1, 5.5);
      for (let x = 12; x < w; x += 56) p.bevel(x, 4, 6, 19, R.dark, 4);
    }
    p.rect(0, h - 6, w, 6, R.dark[1]);
    p.rect(0, h - 6, w, 1, R.dark[4]);
    p.grime(0, 0, w, h, { scale: 18, amount: 0.42, seed: seed + 3 });
    p.drips(0, 22, w, h - 22, { count: Math.floor(w / 5), len: 22 });
    for (const [lx, ly, lr] of lights) p.light(lx, ly, lr, tint, 0.3);
    p.ao(0, h - 30, w, 30, 'down', 0.6);
    p.ao(0, 0, w, 14, 'up', 0.35);
    p.quantize();
  }, { seed });
}

// Tread-plate floor. walkway: 'v' (along the texture's height) or null.
export function floorTex(w, h, { seed = 1, walkway = 'v', pools = [], tile = 32 } = {}) {
  return pixelTexture(w, h, (p) => {
    for (let y = 0; y < h; y += tile)
      for (let x = 0; x < w; x += tile) {
        p.bevel(x, y, tile, tile, R.dark, 4);
        for (let yy = 5, row = 0; yy < tile - 4; yy += 5, row++)
          for (let xx = 4 + (row % 2) * 3; xx < tile - 5; xx += 6) {
            p.px(x + xx, y + yy, R.dark[6]);
            p.px(x + xx + 1, y + yy, R.dark[5]);
            p.px(x + xx + 1, y + yy + 1, R.dark[2]);
          }
        p.rivet(x + 2, y + 2, R.steel);
        p.rivet(x + tile - 4, y + tile - 4, R.steel);
      }
    if (walkway === 'v') {
      const x0 = Math.floor(w / 2) - 12;
      p.stripes(x0, 0, 24, h, R.hazard[4], R.black[2], 8);
      p.rect(x0 - 1, 0, 1, h, R.black[0]);
      p.rect(x0 + 24, 0, 1, h, R.black[0]);
    }
    p.grime(0, 0, w, h, { scale: 22, amount: 0.5, thresh: 0.4, seed: seed + 5 });
    p.scratches(0, 0, w, h, Math.floor((w * h) / 900), R.dark[7]);
    for (const [x, y, r, c] of pools) p.light(x, y, r, c || LIGHT.warm, 0.26);
    p.ao(0, 0, 20, h, 'left', 0.7);
    p.ao(w - 20, 0, 20, h, 'right', 0.7);
    p.quantize();
  }, { seed });
}

export function ceilingTex(w, h, { seed = 1, lamps = [] } = {}) {
  return pixelTexture(w, h, (p) => {
    p.vgrad(0, 0, w, h, R.dark, 2.8, 1.2);
    for (let y = 0; y < h; y += 48) {
      p.rect(0, y, w, 1, R.dark[0]);
      p.rect(0, y + 1, w, 1, R.dark[4]);
    }
    p.hcyl(4, 0, 10, h, R.steel, 1, 6.5);
    p.hcyl(w - 14, 0, 10, h, R.steel, 1, 6.5);
    for (const [x, y] of lamps) {
      p.bevel(x - 22, y - 10, 44, 20, R.steel, 3);
      p.vgrad(x - 19, y - 7, 38, 14, R.beige, 7.4, 5.8);
    }
    p.grime(0, 0, w, h, { scale: 20, amount: 0.4, seed: seed + 7 });
    for (const [x, y] of lamps) p.light(x, y, 50, LIGHT.warm, 0.3);
    p.quantize();
  }, { seed });
}

// A cabin door in its frame, with a name plate.
export function doorTex({ name = '', role = '', seed = 1, accent = R.cryo, extra = null } = {}) {
  return pixelTexture(64, 128, (p) => {
    p.bevel(0, 0, 64, 128, R.steel, 3);
    p.inset(4, 4, 56, 124, R.dark, 1);
    p.vgrad(6, 6, 52, 122, R.steel, 4.6, 2.6);
    p.rect(6, 6, 52, 1, R.steel[6]);
    p.rect(31, 6, 2, 122, R.dark[1]);
    for (let y = 30; y < 120; y += 18) {
      p.rect(9, y, 19, 1, R.steel[1]);
      p.rect(36, y, 19, 1, R.steel[1]);
      p.rect(9, y + 1, 19, 1, R.steel[5]);
      p.rect(36, y + 1, 19, 1, R.steel[5]);
    }
    p.bevel(8, 12, 48, 14, R.beige, 5);
    p.text(name, 11, 13, R.black[0], 6);
    p.text(role, 11, 19, R.dark[3], 5);
    p.rect(50, 64, 4, 10, accent[5]);
    p.rect(51, 65, 2, 2, accent[7]);
    if (extra) extra(p);
    p.grime(0, 0, 64, 128, { scale: 10, amount: 0.38, seed: seed + 11 });
    p.drips(4, 26, 56, 90, { count: 16, len: 20 });
    p.light(52, 69, 12, accent === R.red ? LIGHT.red : LIGHT.cyan, 0.3);
    p.ao(0, 100, 64, 28, 'down', 0.5);
    p.quantize();
  }, { seed });
}

// A big end-wall with a doorway and an overhead sign.
export function endWallTex(w, h, { label = '', seed = 1, open = true, arrow = true } = {}) {
  return pixelTexture(w, h, (p) => {
    p.vgrad(0, 0, w, h, R.steel, 3.6, 1.6);
    p.hcyl(0, 4, w, 8, R.steel, 1, 6.5);
    const dw = Math.floor(w * 0.42), dx = Math.floor((w - dw) / 2), dy = Math.floor(h * 0.28);
    p.bevel(dx - 6, dy - 6, dw + 12, h - dy + 6, R.steel, 4);
    p.stripes(dx - 4, dy - 4, dw + 8, 5, R.hazard[5], R.black[2], 6);
    if (open) {
      p.vgrad(dx, dy + 2, dw, h - dy - 2, R.dark, 0.4, 2.2);
      p.light(dx + dw / 2, h - 10, dw * 0.6, LIGHT.warm, 0.28, 0.6);
    } else {
      p.vgrad(dx, dy + 2, dw, h - dy - 2, R.steel, 4.2, 2.4);
      p.rect(dx + dw / 2 - 1, dy + 2, 2, h - dy - 2, R.dark[0]);
    }
    if (label) {
      const lw = label.length * 6 + (arrow ? 18 : 10);
      const lx = Math.floor((w - lw) / 2);
      p.bevel(lx, dy - 22, lw, 13, R.hazard, 5);
      p.text(label + (arrow ? ' >' : ''), lx + 5, dy - 21, R.black[0], 8);
    }
    p.grime(0, 0, w, h, { scale: 14, amount: 0.4, seed: seed + 13 });
    p.drips(0, 14, w, h - 14, { count: 24, len: 20 });
    p.ao(0, h - 20, w, 20, 'down', 0.6);
    p.quantize();
  }, { seed });
}

// A hanging lamp (noHit decoration).
export function lampTex(seed = 1) {
  return pixelTexture(32, 24, (p) => {
    p.rect(15, 0, 2, 8, R.dark[3]);
    p.bevel(4, 8, 24, 8, R.steel, 4);
    p.vgrad(6, 16, 20, 6, R.beige, 7.4, 6.2);
    p.outline('#100c22');
    p.quantize();
  }, { seed });
}
