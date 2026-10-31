// Hydroponics: four hundred years of unchecked growth. The grow lamp is
// dead, the ship's hamsters have evolved a little (with "help"), and they
// built a shrine under the lamp. Fix the lamp and Pockets shows himself.

import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=17';
import { cardMaker, H, wallTex, floorTex, ceilingTex, endWallTex } from './roomkit.js?v=17';

export function buildHydro(group) {
  const { card, hitMeshes, quads } = cardMaker(group);
  const Z = -2.5; // room runs from z +1 (mess door) to z -6

  // Walls overgrown with vines
  const vinyWall = (seed) =>
    pixelTexture(256, 112, (p, w, h) => {
      p.vgrad(0, 0, w, h, R.steel, 3, 1.2);
      for (let x = 0; x < w; x += 64) {
        p.rect(x, 0, 1, h, R.steel[0]);
        p.rect(x + 1, 0, 1, h, R.steel[4]);
      }
      p.hcyl(0, 4, w, 8, R.steel, 1, 6);
      for (let v = 0; v < 18; v++) {
        let x = Math.floor(p.rand() * w);
        for (let y = 8; y < h; y++) {
          x += Math.round((p.rand() - 0.5) * 2);
          p.px(x, y, R.phosphor[2]);
          p.px(x + 1, y, R.phosphor[1]);
          if (p.rand() < 0.22) {
            p.disc(x + (p.rand() < 0.5 ? -3 : 3), y, 2, R.phosphor[3 + Math.floor(p.rand() * 3)]);
          }
        }
      }
      p.grime(0, 0, w, h, { scale: 14, amount: 0.45, color: '#06140c', seed: seed + 1 });
      p.light(w / 2, 6, 120, LIGHT.green, 0.2, 0.5);
      p.ao(0, h - 26, w, 26, 'down', 0.6);
      p.quantize();
    }, { seed });

  const floor = pixelTexture(256, 256, (p, w, h) => {
    for (let y = 0; y < h; y += 32)
      for (let x = 0; x < w; x += 32) {
        p.bevel(x, y, 32, 32, R.dark, 3);
        for (let k = 4; k < 30; k += 4) p.rect(x + 2, y + k, 28, 1, R.dark[1]);
      }
    p.grime(0, 0, w, h, { scale: 20, amount: 0.7, thresh: 0.35, color: '#2a1608', seed: 702 });
    for (let k = 0; k < 160; k++) {
      const x = Math.floor(p.rand() * w), y = Math.floor(p.rand() * h);
      p.disc(x, y, 1 + Math.floor(p.rand() * 2), R.phosphor[1 + Math.floor(p.rand() * 4)]);
    }
    p.ao(0, 0, 24, h, 'left', 0.7);
    p.ao(w - 24, 0, 24, h, 'right', 0.7);
    p.quantize();
  }, { seed: 701 });

  const ceiling = ceilingTex(256, 256, { seed: 711, lamps: [] });
  const exit = endWallTex(256, 112, { label: 'MESS HALL', seed: 721, open: true, arrow: false });

  // A rack of trays and plants, seen from the front.
  const rack = (seed) =>
    pixelTexture(96, 128, (p) => {
      for (const x of [2, 90]) p.vcyl(x, 0, 4, 128, R.steel, 1, 6);
      for (let y = 22; y < 128; y += 34) {
        p.bevel(0, y, 96, 5, R.steel, 4);
        p.rect(4, y - 6, 88, 6, R.rust[2]);
        for (let k = 0; k < 9; k++) {
          const x = 6 + k * 10 + Math.floor(p.rand() * 4);
          const top = y - 10 - Math.floor(p.rand() * 22);
          p.line(x, y - 6, x + (p.rand() < 0.5 ? -2 : 2), top, R.phosphor[2]);
          for (let l = 0; l < 4; l++) p.disc(x + Math.round((p.rand() - 0.5) * 8), top + l * 4, 2, R.phosphor[3 + Math.floor(p.rand() * 4)]);
          if (p.rand() < 0.4) p.disc(x, top + 6, 2, R.red[4 + Math.floor(p.rand() * 2)]);
        }
      }
      p.outline('#06140c');
      p.quantize();
    }, { seed });

  // Hamsters perched on a shelf: a little colony row.
  const colony = (seed) =>
    pixelTexture(128, 40, (p) => {
      p.bevel(0, 32, 128, 6, R.steel, 4);
      for (let k = 0; k < 7; k++) {
        const x = 8 + k * 17 + Math.floor(p.rand() * 4), y = 22;
        p.disc(x, y, 7, R.hazard[3]);
        p.disc(x - 1, y - 1, 5, R.hazard[4]);
        p.disc(x, y + 3, 4, R.beige[6]);
        p.disc(x - 5, y - 6, 2, R.hazard[4]);
        p.disc(x + 5, y - 6, 2, R.hazard[4]);
        p.px(x - 3, y - 2, R.black[0]);
        p.px(x + 3, y - 2, R.black[0]);
        p.px(x - 3, y - 3, R.phosphor[7]);
        p.px(x + 3, y - 3, R.phosphor[7]);
        p.px(x, y + 1, R.red[5]);
      }
      p.outline('#1f0f0a');
      p.quantize();
    }, { seed });

  // The shrine: trays stacked into an altar, offerings piled on top.
  const shrine = pixelTexture(96, 80, (p) => {
    for (let k = 0; k < 6; k++) p.bevel(10 + k * 2, 70 - k * 9, 76 - k * 4, 8, R.steel, 4 + (k % 2));
    const loot = [R.hazard, R.cryo, R.red, R.beige, R.phosphor];
    for (let k = 0; k < 22; k++) {
      const x = 24 + Math.floor(p.rand() * 48), y = 12 + Math.floor(p.rand() * 14);
      p.disc(x, y, 2, loot[k % 5][5 + (k % 2)]);
    }
    p.bevel(40, 8, 16, 8, R.cryo, 5);
    p.text('N.S', 42, 9, R.dark[0], 5);
    for (const x of [14, 80]) {
      p.rect(x, 48, 3, 14, R.beige[6]);
      p.disc(x + 1, 46, 2, R.hazard[6]);
    }
    p.outline('#100c22');
    p.quantize();
  }, { seed: 731 });

  // The grow lamp hangs overhead: dead, or blazing.
  const lampState = { on: false };
  const growLamp = pixelTexture(128, 48, (p) => {
    p.rect(30, 0, 2, 10, R.dark[3]);
    p.rect(96, 0, 2, 10, R.dark[3]);
    p.bevel(8, 10, 112, 20, R.steel, 4);
    p.inset(14, 26, 100, 14, R.dark, 1);
    if (lampState.on) {
      p.vgrad(15, 27, 98, 12, R.beige, 7.4, 6);
      p.rect(15, 27, 98, 2, R.beige[7]);
    } else {
      p.vgrad(15, 27, 98, 12, R.dark, 2, 1);
      p.text('F-7', 56, 14, R.red[4], 7);
    }
    p.outline('#100c22');
    p.quantize();
  }, { seed: 741 });

  const glow = pixelTexture(96, 160, (p, w, h) => {
    for (let j = 0; j < h; j++) {
      const half = (0.4 + 0.6 * (j / h)) * (w / 2);
      for (let i = 0; i < w; i++) {
        const u = Math.abs(i - w / 2) / half;
        if (u > 1) continue;
        if ((i + j) % 2 === 0 && p.rand() < (1 - u * u) * (0.9 - 0.65 * (j / h))) p.px(i, j, j < h * 0.35 ? R.beige[7] : R.phosphor[7]);
      }
    }
  }, { seed: 751 });

  // Pockets, full figure: a person-sized hamster in a tablecloth cape.
  const pockets = pixelTexture(64, 112, (p) => {
    // cape
    for (let y = 40; y < 108; y++) {
      const hw = 12 + (y - 40) * 0.28;
      for (let x = Math.floor(32 - hw); x <= 32 + hw; x++) {
        const check = (Math.floor(x / 4) + Math.floor(y / 4)) % 2;
        p.px(x, y, R.red[3 + check]);
      }
    }
    // body
    p.disc(32, 66, 16, R.hazard[4]);
    p.disc(30, 64, 12, R.hazard[5]);
    p.disc(32, 72, 10, R.beige[6]);
    // feet
    p.disc(24, 106, 4, R.red[6]);
    p.disc(40, 106, 4, R.red[6]);
    // head
    p.disc(32, 32, 16, R.hazard[4]);
    p.disc(30, 30, 12, R.hazard[5]);
    p.disc(21, 37, 7, R.hazard[5]);
    p.disc(43, 37, 7, R.hazard[4]);
    p.disc(32, 39, 7, R.beige[6]);
    p.disc(20, 18, 4, R.hazard[4]);
    p.disc(44, 18, 4, R.hazard[4]);
    p.disc(20, 18, 2, R.red[6]);
    p.disc(44, 18, 2, R.red[6]);
    for (const ex of [26, 38]) {
      p.disc(ex, 29, 2, R.black[0]);
      p.rect(ex - 2, 26, 5, 2, R.hazard[4]);
      p.px(ex - 1, 28, R.beige[7]);
    }
    p.rect(31, 34, 3, 2, R.red[5]);
    // bottle-cap crown and medallion
    p.bevel(34, 13, 12, 4, R.hazard, 6);
    for (let k = 0; k < 3; k++) p.rect(35 + k * 4, 10, 2, 3, R.hazard[6]);
    p.disc(32, 50, 3, R.hazard[6]);
    // paws holding an upside-down manual
    p.bevel(18, 70, 14, 10, R.cryo, 4);
    p.text('MNL', 19, 72, R.dark[0], 5);
    p.outline('#1f0f0a');
    p.quantize();
  }, { seed: 761 });

  // ---- layout ----
  card(floor, 7, 7, [0, 0, Z], { rot: [-H, 0, 0], order: -1, segs: 2 });
  card(ceiling, 7, 7, [0, 3, Z], { rot: [H, 0, 0], order: -1, segs: 2 });
  card(vinyWall(771), 7, 3, [0, 1.5, -6], { order: -1, segs: 2 });
  card(vinyWall(781), 7, 3, [-3.5, 1.5, Z], { rot: [0, H, 0], order: -1, segs: 2 });
  card(vinyWall(791), 7, 3, [3.5, 1.5, Z], { rot: [0, -H, 0], order: -1, segs: 2 });
  card(exit, 7, 3, [0, 1.5, 1], { rot: [0, Math.PI, 0], order: -1, spot: 'hydroexit', region: [0.29, 0, 0.71, 0.72] });

  card(rack(801), 1.6, 2.1, [-2.2, 1.05, -2.0], { face: [0, 1.05, 0], spot: 'racks' });
  card(rack(811), 1.6, 2.1, [2.2, 1.05, -2.0], { face: [0, 1.05, 0], spot: 'racks' });
  card(rack(821), 1.6, 2.1, [-2.4, 1.05, -4.4], { face: [0, 1.05, 0], spot: 'racks' });
  card(rack(831), 1.6, 2.1, [2.4, 1.05, -4.4], { face: [0, 1.05, 0], spot: 'racks' });
  card(colony(841), 1.5, 0.47, [-2.2, 2.25, -2.0], { face: [0, 2.25, 0], spot: 'colony' });
  card(colony(851), 1.5, 0.47, [2.2, 2.25, -2.0], { face: [0, 2.25, 0], spot: 'colony' });
  card(colony(861), 1.5, 0.47, [0.9, 0.2, -4.6], { face: [0, 0.2, 0], spot: 'colony' });
  card(shrine, 1.3, 1.08, [0, 0.54, -5.2], { spot: 'shrine' });
  const lampCard = card(growLamp, 2.2, 0.82, [0, 2.6, -4.6], { spot: 'lamp' });
  const glowCard = card(glow, 2.0, 2.6, [0, 1.35, -4.75], { noHit: true });
  const pocketsCard = card(pockets, 0.85, 1.5, [-1.0, 0.75, -3.6], { face: [0, 0.75, 0], spot: 'pockets' });
  glowCard.visible = false;
  pocketsCard.visible = false;

  const all = group.children;
  const setLight = (on) => {
    lampState.on = on;
    growLamp.userData.redraw();
    glowCard.visible = on;
    pocketsCard.visible = on;
    for (const m of all) if (m !== lampCard) m.material.uniforms.uTint.value = on ? 1 : 0.5;
  };
  setLight(false);

  let t = 0;
  return {
    name: 'HYDROPONICS',
    quads: quads(),
    hitMeshes,
    fog: [3, 9],
    update(dt) {
      t += dt;
      if (lampState.on) lampCard.material.uniforms.uTint.value = 1.1 + 0.08 * Math.sin(t * 9);
      else lampCard.material.uniforms.uTint.value = Math.sin(t * 13) > 0.97 ? 0.9 : 0.45;
    },
    onAction(name, arg) {
      if (name === 'lamp') setLight(arg === 'on');
    },
  };
}
