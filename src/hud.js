// Small debug panel near the player's lower left: build, mode, quad budget,
// toggles. Lives in the anchored world group so it follows every room.

import * as THREE from 'three';
import { cardMaterial, settings, MAX_QUADS } from './vertex.js?v=35';
import { pixelTexture, RAMPS as R } from './pixelart.js?v=35';
import { slab } from './slab.js?v=35';

export function createHud(parent, build) {
  let quads = 0;
  let roomName = '';
  let note = '';
  const tex = pixelTexture(128, 48, (p, w, h) => {
    p.rect(0, 0, w, h, R.black[1]);
    p.rect(0, 0, w, 1, R.steel[4]);
    p.text(`B${build} ${settings.comfort ? 'CD' : 'VISOR'}`, 3, 2, settings.comfort ? R.cryo[6] : R.hazard[6], 8);
    p.text(`${roomName} ${quads}/${MAX_QUADS}L`, 3, 13, quads > MAX_QUADS ? R.red[6] : R.phosphor[6], 8);
    const items = [['LO', settings.lowres], ['PAL', settings.palette], ['SNP', settings.snap], ['AFF', settings.affine], ['20F', settings.steppedAnim]];
    let x = 3;
    for (const [s, on] of items) {
      p.text(s, x, 24, on ? R.phosphor[6] : R.dark[5], 8);
      x += s.length * 5 + 5;
    }
    if (note) {
      p.rect(0, 33, w, 12, R.red[2]);
      p.text(note, 3, 35, R.beige[7], 8);
    } else p.text('STICK=MODE GRIP=CTR', 3, 35, R.steel[5], 8);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), cardMaterial(tex, { noSnap: true, noCell: true }));
  m.position.set(-0.42, 1.05, -0.75);
  m.lookAt(0, 1.6, 0);
  m.renderOrder = 15;
  slab(m, 0.4, 0.15, 0.02, R.steel[3]);
  parent.add(m);
  return {
    refresh: () => tex.userData.redraw(),
    notice(text) {
      note = text;
      tex.userData.redraw();
    },
    setRoom(name, q) {
      roomName = name;
      quads = q;
      tex.userData.redraw();
    },
  };
}
