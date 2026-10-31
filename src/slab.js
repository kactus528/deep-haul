// Solid backing for interface cards and portraits: a flat-shaded block
// behind the card, so frames have real thickness and edges catch the
// "light" (top bright, bottom dark), like a chunky early-90s 3D panel.

import * as THREE from 'three';
import { FOG, fade } from './vertex.js?v=31';

export function slab(card, w, h, depth, edge, { round = false } = {}) {
  const geo = round ? new THREE.CylinderGeometry(w / 2, w / 2, depth, 20, 1).rotateX(Math.PI / 2) : new THREE.BoxGeometry(w, h, depth);
  // box faces: +x, -x, +y (top), -y (bottom), +z (front), -z (back)
  const shades = round ? [0.8, 0.3, 0.3] : [0.6, 0.85, 1.1, 0.4, 0.3, 0.25];
  const base = shades.map((k) => new THREE.Color(edge).multiplyScalar(k));
  const mats = base.map((c) => new THREE.MeshBasicMaterial({ color: c.clone(), transparent: true, depthTest: false, depthWrite: false, fog: false }));
  const s = new THREE.Mesh(geo, mats);
  s.position.z = -depth / 2 - 0.001;
  s.renderOrder = card.renderOrder - 1;
  s.frustumCulled = false;
  // fade with the rest of the scene during room changes
  s.onBeforeRender = () => mats.forEach((m, i) => m.color.copy(base[i]).lerp(FOG, fade.value));
  card.add(s);
  return s;
}
