// Snatcher-style interface for the VERTEX: a pointer, a command menu
// (LOOK / TALK / CHECK / USE), hover labels, and a floating CRT dialogue
// window with typed text, DORIS's portrait and voice blips.
//
// Headset: point with the right controller, pull the trigger. The command
// menu rides on your left hand (flick the thumbstick toward a command,
// or point + trigger). Desktop: click things; L/T/C/U pick a command; Space advances.

import * as THREE from 'three';
import { cardMaterial } from './vertex.js?v=13';
import { pixelTexture, RAMPS as R } from './pixelart.js?v=13';
import { HOTSPOTS, OPENING, DORIS_TALK, DEFAULTS } from './script.js?v=13';
import { initAudio, blip, click, confirm, fanfare } from './voice.js?v=13';

// The command pad: one command per thumbstick direction.
// USE also walks through doors (the old MOVE command).
const COMMANDS = ['LOOK', 'CHECK', 'USE', 'TALK']; // up, right, down, left
const PAD = [
  [28, 5], // up
  [53, 41], // right
  [28, 77], // down
  [3, 41], // left
];
const BOX_W = 40, BOX_H = 14;
const CPS = 40; // typed characters per second
const ROWS = 4;

function uiCard(tex, w, h, order) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), cardMaterial(tex, { noSnap: true }));
  m.renderOrder = order;
  m.frustumCulled = false;
  return m;
}

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? cur + ' ' + word : word;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function opaqueAt(mesh, uv) {
  const map = mesh.material.uniforms && mesh.material.uniforms.map && mesh.material.uniforms.map.value;
  const img = map && map.image;
  if (!img || !img.getContext || !uv) return true;
  const x = Math.min(img.width - 1, Math.max(0, Math.floor(uv.x * img.width)));
  const y = Math.min(img.height - 1, Math.max(0, Math.floor((1 - uv.y) * img.height)));
  return img.getContext('2d').getImageData(x, y, 1, 1).data[3] > 127;
}

export function createUI({ renderer, scene, camera, hitMeshes: initialHits, getHead, onAction = () => {} }) {
  let hitMeshes = initialHits;
  const state = { cmd: 0, counts: {}, dorisTalk: 0, openingDone: false, openingTimer: -1, flags: {}, locked: false, pendingEnd: false };

  // =====================================================================
  // Dialogue window
  // =====================================================================
  const dlg = { open: false, speaker: '', lines: [], flat: '', shown: 0, queue: [], acc: 0, blinkT: 0, blink: true, dirty: false, redrawT: 0 };

  const drawPortrait = (p, x, y) => {
    p.bevel(x, y, 48, 48, R.steel, 3);
    p.inset(x + 2, y + 2, 44, 44, R.black, 1);
    p.vgrad(x + 3, y + 3, 42, 42, R.dark, 2.2, 0.4);
    const cx = x + 24, cy = y + 25;
    for (let j = -17; j <= 17; j++)
      for (let i = -17; i <= 17; i++) {
        const d = Math.hypot(i, j);
        if (d < 10) p.px(cx + i, cy + j, R.red[Math.max(1, Math.min(7, Math.round(7.2 - d * 0.62)))]);
        else if (d < 15) p.px(cx + i, cy + j, R.steel[Math.max(1, Math.min(7, Math.round(4.2 - (i + j) / 7)))]);
      }
    p.rect(cx - 6, cy - 6, 3, 2, R.red[7]);
    p.px(cx - 6, cy - 4, R.red[7]);
    // eyelids give her a little expression
    p.rect(cx - 15, cy - 14, 30, 3, R.steel[5]);
    p.rect(cx - 15, cy - 12, 30, 1, R.steel[2]);
    for (let yy = y + 4; yy < y + 46; yy += 2) p.rect(x + 3, yy, 42, 1, 'rgba(0,0,0,0.22)');
  };

  const drawVendo = (p, x, y) => {
    p.bevel(x, y, 48, 48, R.suit, 4);
    p.inset(x + 4, y + 6, 40, 34, R.black, 1);
    p.vgrad(x + 5, y + 7, 38, 32, R.cryo, 4.6, 3);
    p.rect(x + 13, y + 14, 5, 7, R.dark[0]);
    p.rect(x + 30, y + 14, 5, 7, R.dark[0]);
    p.rect(x + 14, y + 15, 1, 1, R.cryo[7]);
    p.rect(x + 31, y + 15, 1, 1, R.cryo[7]);
    p.rect(x + 12, y + 28, 24, 2, R.dark[0]);
    p.rect(x + 10, y + 26, 2, 2, R.dark[0]);
    p.rect(x + 36, y + 26, 2, 2, R.dark[0]);
    p.text('V-9', x + 15, y + 40, R.beige[7], 6);
    for (let yy = y + 7; yy < y + 39; yy += 2) p.rect(x + 5, yy, 38, 1, 'rgba(0,0,0,0.2)');
  };
  const STYLE = {
    DORIS: { tag: 'DORIS', ramp: R.red, ink: R.beige[7], portrait: drawPortrait },
    VENDO: { tag: 'VENDO-9', ramp: R.suit, ink: R.hazard[7], portrait: drawVendo },
    CASE: { tag: 'CASE FILE', ramp: R.hazard, ink: R.hazard[6], portrait: null },
    GUS: { tag: 'GUS', ramp: R.cryo, ink: R.cryo[6], portrait: null },
  };

  const dlgTex = pixelTexture(256, 72, (p, w, h) => {
    p.bevel(0, 0, w, h, R.beige, 4);
    p.rect(1, 1, w - 2, 1, R.beige[7]);
    p.inset(4, 4, w - 8, h - 8, R.black, 1);
    p.vgrad(6, 6, w - 12, h - 12, R.dark, 1.6, 0.3);
    let tx = 12;
    const st = STYLE[dlg.speaker] || STYLE.GUS;
    if (st.portrait) {
      st.portrait(p, 8, 10);
      tx = 64;
    }
    p.bevel(tx - 2, 8, st.tag.length * 5 + 8, 10, st.ramp, 4);
    p.text(st.tag, tx + 2, 9, R.black[0], 7);
    let left = dlg.shown;
    dlg.lines.forEach((ln, i) => {
      const s = ln.slice(0, Math.max(0, left));
      left -= ln.length;
      if (s) p.text(s, tx, 22 + i * 11, st.ink, 8);
    });
    if (dlg.shown >= dlg.flat.length && dlg.blink) {
      for (let k = 0; k < 4; k++) p.rect(w - 18 + k, h - 15 + k, 7 - k * 2, 1, R.hazard[6]);
    }
    for (let y = 6; y < h - 6; y += 2) p.rect(6, y, w - 12, 1, 'rgba(0,0,0,0.18)');
  });
  const dlgCard = uiCard(dlgTex, 0.72, 0.2025, 30);
  dlgCard.visible = false;
  scene.add(dlgCard);

  const PREFIX = { 'D:': 'DORIS', 'V:': 'VENDO', 'C:': 'CASE', 'G:': 'GUS' };
  function pagesFor(rawLines) {
    const pages = [];
    for (const raw of rawLines) {
      if (raw.startsWith('@')) {
        const [name, ...args] = raw.slice(1).split(':');
        pages.push({ action: name, args });
        continue;
      }
      const speaker = PREFIX[raw.slice(0, 2)] || 'GUS';
      const text = PREFIX[raw.slice(0, 2)] ? raw.slice(2) : raw;
      const lines = wrap(text, STYLE[speaker].portrait ? 34 : 44);
      for (let i = 0; i < lines.length; i += ROWS) pages.push({ speaker, lines: lines.slice(i, i + ROWS) });
    }
    return pages;
  }

  function runAction({ action, args }) {
    if (action === 'set') state.flags[args[0]] = true;
    else if (action === 'end') state.pendingEnd = true;
    else onAction(action, ...args);
  }

  // Run any actions at the front of the queue; return the next text page.
  function nextTextPage() {
    while (dlg.queue.length) {
      const page = dlg.queue.shift();
      if (page.action) runAction(page);
      else return page;
    }
    return null;
  }

  function closeDialogue() {
    dlg.open = false;
    dlgCard.visible = false;
    if (state.pendingEnd) {
      state.pendingEnd = false;
      showEndCard();
    }
  }

  function placeDialogue() {
    const { pos, yaw } = getHead();
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    dlgCard.position.set(pos.x + fx * 0.85, pos.y - 0.3, pos.z + fz * 0.85);
    dlgCard.lookAt(pos.x, pos.y - 0.05, pos.z);
  }

  function showPage(page) {
    dlg.speaker = page.speaker;
    dlg.lines = page.lines;
    dlg.flat = page.lines.join('');
    dlg.shown = 0;
    dlg.acc = 0;
    dlg.dirty = true;
  }

  function say(rawLines) {
    dlg.queue = pagesFor(rawLines);
    const first = nextTextPage();
    if (!first) {
      if (state.pendingEnd) closeDialogue();
      return;
    }
    placeDialogue();
    dlg.open = true;
    dlgCard.visible = true;
    showPage(first);
    dlgTex.userData.redraw();
  }

  function advance() {
    if (!dlg.open) return;
    click();
    if (dlg.shown < dlg.flat.length) {
      dlg.shown = dlg.flat.length;
      dlg.dirty = true;
      return;
    }
    const next = nextTextPage();
    if (next) showPage(next);
    else closeDialogue();
  }

  // =====================================================================
  // Chapter end card
  // =====================================================================
  const endTex = pixelTexture(256, 144, (p, w, h) => {
    p.bevel(0, 0, w, h, R.hazard, 4);
    p.inset(5, 5, w - 10, h - 10, R.black, 1);
    p.vgrad(7, 7, w - 14, h - 14, R.dark, 2.2, 0.3);
    p.text('END OF CHAPTER 1', 40, 18, R.hazard[6], 14);
    p.text('T H A W', 92, 42, R.cryo[6], 12);
    p.rect(30, 64, w - 60, 1, R.hazard[3]);
    p.text('PASSWORD', 98, 74, R.beige[5], 8);
    p.text('PELL-0312-HAUL', 66, 86, R.beige[7], 10);
    p.text('THE INVESTIGATION CONTINUES...', 46, 110, R.steel[5], 8);
    p.text('PULL TRIGGER / CLICK', 72, 124, R.dark[6], 7);
    for (let y = 7; y < h - 7; y += 2) p.rect(7, y, w - 14, 1, 'rgba(0,0,0,0.2)');
  });
  const endCard = uiCard(endTex, 1.0, 0.5625, 35);
  endCard.visible = false;
  scene.add(endCard);
  function showEndCard() {
    const { pos, yaw } = getHead();
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    endCard.position.set(pos.x + fx * 1.2, pos.y - 0.05, pos.z + fz * 1.2);
    endCard.lookAt(pos.x, pos.y, pos.z);
    endCard.visible = true;
    fanfare();
  }

  // =====================================================================
  // Command menu
  // =====================================================================
  const menuTex = pixelTexture(96, 96, (p, w, h) => {
    p.disc(48, 48, 46, R.beige[2]);
    p.disc(48, 48, 44, R.dark[1]);
    p.disc(48, 48, 42, R.dark[2]);
    // d-pad in the middle, the selected arm lit
    p.bevel(44, 30, 8, 36, R.steel, 3);
    p.bevel(30, 44, 36, 8, R.steel, 3);
    const arm = [[45, 31, 6, 12], [53, 45, 12, 6], [45, 53, 6, 12], [31, 45, 12, 6]][state.cmd];
    p.rect(arm[0], arm[1], arm[2], arm[3], R.cryo[5]);
    COMMANDS.forEach((c, i) => {
      const [x, y] = PAD[i];
      const sel = i === state.cmd;
      p.bevel(x, y, BOX_W, BOX_H, sel ? R.cryo : R.beige, sel ? 4 : 3);
      p.text(c, x + Math.floor((BOX_W - c.length * 5) / 2), y + 3, sel ? R.black[0] : R.beige[7], 8);
    });
    p.outline('#100c22');
  });
  const menuCard = uiCard(menuTex, 0.17, 0.17, 30);
  function setCmd(i) {
    if (i === state.cmd) return;
    state.cmd = i;
    menuTex.userData.redraw();
    click();
  }

  // =====================================================================
  // Cursor and hover label
  // =====================================================================
  const cursorTex = pixelTexture(16, 16, (p) => {
    for (const [x, y, w, h] of [[7, 0, 2, 6], [7, 10, 2, 6], [0, 7, 6, 2], [10, 7, 6, 2]]) p.rect(x, y, w, h, R.beige[7]);
    p.rect(7, 7, 2, 2, R.hazard[6]);
    p.outline('#100c22');
  });
  const cursor = uiCard(cursorTex, 1, 1, 40);
  scene.add(cursor);

  let labelText = '';
  const labelTex = pixelTexture(112, 14, (p, w, h) => {
    if (!labelText) return;
    const lw = Math.min(w, labelText.length * 5 + 10);
    const x0 = Math.floor((w - lw) / 2);
    p.bevel(x0, 0, lw, h, R.dark, 4);
    p.text(labelText, x0 + 5, 3, R.hazard[6], 8);
  });
  const label = uiCard(labelTex, 1, 0.125, 40);
  label.visible = false;
  scene.add(label);

  // =====================================================================
  // Pointing
  // =====================================================================
  const raycaster = new THREE.Raycaster();
  raycaster.far = 25;
  const tmpMat = new THREE.Matrix4();
  const tmpO = new THREE.Vector3();
  const tmpD = new THREE.Vector3();

  function hitTest(origin, dir) {
    raycaster.set(origin, dir);
    const targets = menuCard.parent ? [menuCard, ...hitMeshes] : hitMeshes;
    for (const h of raycaster.intersectObjects(targets, false)) {
      if (h.object === menuCard) {
        const dx = h.uv.x - 0.5, dy = 0.5 - h.uv.y; // +dy = down
        let idx = -1;
        if (Math.hypot(dx, dy) > 0.08) idx = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy < 0 ? 0 : 2;
        return { menu: true, index: idx, point: h.point, dist: h.distance };
      }
      if (!opaqueAt(h.object, h.uv)) continue;
      const ud = h.object.userData;
      let spot = ud.spot || null;
      if (spot && ud.region) {
        const [u0, v0, u1, v1] = ud.region;
        if (h.uv.x < u0 || h.uv.x > u1 || h.uv.y < v0 || h.uv.y > v1) spot = null;
      }
      return { mesh: h.object, spot, point: h.point, dist: h.distance };
    }
    return null;
  }

  // ---- headset controllers ----
  const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const laserMat = new THREE.LineBasicMaterial({ color: 0x7fd8cf, transparent: true, opacity: 0.45 });
  const ctrls = [0, 1].map((i) => {
    const ray = renderer.xr.getController(i);
    const grip = renderer.xr.getControllerGrip(i);
    scene.add(ray);
    scene.add(grip);
    const laser = new THREE.Line(laserGeo, laserMat);
    laser.visible = false;
    laser.frustumCulled = false;
    ray.add(laser);
    const c = { ray, grip, laser, hand: null, gamepad: null, latch: false };
    ray.addEventListener('connected', (e) => {
      c.hand = e.data.handedness;
      c.gamepad = e.data.gamepad || null;
      attachMenu();
    });
    ray.addEventListener('disconnected', () => {
      c.hand = null;
      c.gamepad = null;
      attachMenu();
    });
    ray.addEventListener('selectstart', () => onSelect(c));
    return c;
  });
  const pointerCtrl = () => ctrls.find((c) => c.hand === 'right') || ctrls.find((c) => c.hand);
  const leftCtrl = () => ctrls.find((c) => c.hand === 'left');

  function ctrlRay(c) {
    c.ray.updateMatrixWorld(true);
    tmpO.setFromMatrixPosition(c.ray.matrixWorld);
    tmpMat.identity().extractRotation(c.ray.matrixWorld);
    tmpD.set(0, 0, -1).applyMatrix4(tmpMat).normalize();
    return { origin: tmpO.clone(), dir: tmpD.clone() };
  }

  function attachMenu() {
    if (menuCard.parent) menuCard.parent.remove(menuCard);
    if (renderer.xr.isPresenting) {
      const left = leftCtrl();
      if (!left) return;
      left.grip.add(menuCard);
      menuCard.position.set(0, 0.09, -0.03);
      menuCard.rotation.set(-0.7, 0, 0);
    } else {
      camera.add(menuCard);
      menuCard.position.set(-0.32, -0.21, -0.65);
      menuCard.rotation.set(0, 0, 0);
    }
  }
  attachMenu();

  // ---- desktop mouse ----
  const mouse = new THREE.Vector2();
  let mouseInside = false;
  let downAt = null;
  const el = renderer.domElement;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    mouseInside = true;
  });
  el.addEventListener('pointerleave', () => (mouseInside = false));
  el.addEventListener('pointerdown', (e) => (downAt = [e.clientX, e.clientY]));
  el.addEventListener('pointerup', (e) => {
    if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) < 5) onSelect(null);
    downAt = null;
  });
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const idx = { l: 0, c: 1, u: 2, t: 3 }[k];
    if (idx !== undefined) setCmd(idx);
    if (k === ' ' || k === 'enter') {
      initAudio();
      if (!state.openingDone) startOpening();
      else if (endCard.visible) {
        endCard.visible = false;
        click();
      } else advance();
      e.preventDefault();
    }
  });
  function mouseRay() {
    if (!mouseInside) return null;
    raycaster.setFromCamera(mouse, camera);
    return { origin: raycaster.ray.origin.clone(), dir: raycaster.ray.direction.clone() };
  }

  // =====================================================================
  // Actions
  // =====================================================================
  function runCommand(spotId) {
    const cmd = COMMANDS[state.cmd].toLowerCase();
    const spot = HOTSPOTS[spotId];
    if (!spot) return;
    const key = `${spotId}.${cmd}`;
    const n = state.counts[key] || 0;
    state.counts[key] = n + 1;
    // USE on a door walks through it (scripts may still say "move").
    const val = cmd === 'use' && !spot.use ? spot.move : spot[cmd];
    let lines;
    if (cmd === 'talk' && val === 'DORIS') {
      lines = DORIS_TALK[state.dorisTalk % DORIS_TALK.length];
      state.dorisTalk++;
    } else if (typeof val === 'function') {
      lines = val(state.flags, n);
    } else if (!val || !val.length) {
      lines = [DEFAULTS[cmd]];
    } else {
      const v = val[Math.min(n, val.length - 1)];
      lines = Array.isArray(v) ? v : [v];
    }
    confirm();
    say(lines);
  }

  function onSelect(source) {
    initAudio();
    if (state.locked) return;
    if (endCard.visible) {
      endCard.visible = false;
      click();
      return;
    }
    if (dlg.open) return advance();
    if (!state.openingDone && !renderer.xr.isPresenting) return startOpening();
    const ray = source ? ctrlRay(source) : mouseRay();
    if (!ray) return;
    const hit = hitTest(ray.origin, ray.dir);
    if (!hit) return;
    if (hit.menu) {
      if (hit.index >= 0) setCmd(hit.index);
      return;
    }
    if (hit.spot) runCommand(hit.spot);
  }

  function startOpening() {
    if (state.openingDone) return;
    state.openingDone = true;
    say(OPENING);
  }

  // =====================================================================
  // Per-frame
  // =====================================================================
  let hovered = null;
  function setHover(mesh, spot) {
    // Highlight small props; big walls (region hotspots) and DORIS's
    // animated eye only get the label and the bigger cursor.
    const glows = (m) => m && m.userData.spot !== 'doris' && !m.userData.region;
    if (hovered && hovered !== mesh && glows(hovered)) hovered.material.uniforms.uTint.value = 1;
    hovered = mesh;
    if (glows(mesh)) mesh.material.uniforms.uTint.value = 1.3;
    const text = spot ? HOTSPOTS[spot].name : '';
    if (text !== labelText) {
      labelText = text;
      labelTex.userData.redraw();
    }
  }

  const headTmp = new THREE.Vector3();
  function update(dt) {
    const xr = renderer.xr.isPresenting;

    // Opening scene timer (headset)
    if (state.openingTimer > 0) {
      state.openingTimer -= dt;
      if (state.openingTimer <= 0) startOpening();
    }

    // Typewriter
    if (dlg.open) {
      if (dlg.shown < dlg.flat.length) {
        dlg.acc += dt * CPS;
        while (dlg.acc >= 1 && dlg.shown < dlg.flat.length) {
          dlg.acc -= 1;
          dlg.shown++;
          if (dlg.shown % 2 && /[A-Za-z0-9]/.test(dlg.flat[dlg.shown - 1])) blip(dlg.speaker);
          dlg.dirty = true;
        }
      }
      dlg.blinkT += dt;
      if (dlg.blinkT > 0.4) {
        dlg.blinkT = 0;
        dlg.blink = !dlg.blink;
        if (dlg.shown >= dlg.flat.length) dlg.dirty = true;
      }
      dlg.redrawT += dt;
      if (dlg.dirty && dlg.redrawT >= 0.05) {
        dlg.redrawT = 0;
        dlg.dirty = false;
        dlgTex.userData.redraw();
      }
    }

    // Left thumbstick moves through the command menu
    const left = xr && leftCtrl();
    if (left && left.gamepad) {
      // Flick the stick toward a command to pick it.
      const x = left.gamepad.axes[2] || 0, y = left.gamepad.axes[3] || 0;
      const mag = Math.hypot(x, y);
      if (!left.latch && mag > 0.6) {
        left.latch = true;
        setCmd(Math.abs(x) > Math.abs(y) ? (x > 0 ? 1 : 3) : y < 0 ? 0 : 2);
      } else if (mag < 0.3) left.latch = false;
    }

    // Pointer, cursor, hover
    const pc = xr ? pointerCtrl() : null;
    for (const c of ctrls) c.laser.visible = xr && c === pc;
    const ray = xr ? (pc ? ctrlRay(pc) : null) : mouseRay();
    if (!ray) {
      cursor.visible = false;
      label.visible = false;
      setHover(null, null);
      return;
    }
    const hit = hitTest(ray.origin, ray.dir);
    const dist = hit ? hit.dist : 3;
    const point = hit ? hit.point : ray.origin.clone().addScaledVector(ray.dir, dist);
    if (pc) pc.laser.scale.z = dist;

    const { pos } = getHead();
    headTmp.copy(pos);
    cursor.visible = true;
    cursor.position.copy(point);
    const s = 0.028 * Math.max(0.35, dist) * (hit && (hit.spot || hit.menu) ? 1.25 : 1);
    cursor.scale.set(s, s, 1);
    cursor.lookAt(headTmp);
    cursor.material.uniforms.uTint.value = hit && (hit.spot || hit.menu) ? 1.25 : 0.7;

    const spot = !dlg.open && hit && hit.spot ? hit.spot : null;
    setHover(spot ? hit.mesh : null, spot);
    label.visible = !!spot;
    if (spot) {
      const ls = 0.16 * Math.max(0.35, dist) / 1.0;
      label.scale.set(ls, ls, 1);
      label.position.copy(point);
      label.position.y += 0.05 * Math.max(0.35, dist);
      label.lookAt(headTmp);
    }
  }

  return {
    update,
    say,
    flags: state.flags,
    setHitMeshes(list) {
      hitMeshes = list;
      setHover(null, null);
    },
    setLocked(v) {
      state.locked = v;
    },
    onSessionStart() {
      attachMenu();
      if (!state.openingDone) state.openingTimer = 1.5;
    },
    onSessionEnd() {
      attachMenu();
      for (const c of ctrls) c.laser.visible = false;
    },
  };
}
