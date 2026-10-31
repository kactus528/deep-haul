// The VERTEX VISOR's narrow view: everything outside a ~60 x 46 degree
// window is black, like peering into a 1992 head-mounted display. The mask
// is placed in front of each eye as that eye is drawn, so it is exactly
// head-locked (no lag), like the frame of a real lens.

import * as THREE from 'three';

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

export function createVisorMask(scene, { fovX = 60, fovY = 46, dist = 2 } = {}) {
  const PLANE = 10; // meters across: far wider than any field of view
  const N = 512;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d');
  const img = g.createImageData(N, N);
  const halfW = (dist * Math.tan(THREE.MathUtils.degToRad(fovX / 2))) / PLANE; // in plane fractions
  const halfH = (dist * Math.tan(THREE.MathUtils.degToRad(fovY / 2))) / PLANE;
  const corner = Math.min(halfW, halfH) * 0.35;
  const edge = 0.012; // dithered fade at the window's rim
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = Math.abs(x / N - 0.5), v = Math.abs(y / N - 0.5);
      // signed distance to a rounded rectangle (in plane fractions)
      const qx = u - (halfW - corner), qy = v - (halfH - corner);
      const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - corner;
      let a = outside > 0 ? 1 : 0;
      if (outside > -edge && outside <= 0) a = BAYER[y & 3][x & 3] / 16 < 1 + outside / edge ? 1 : 0;
      const o = (y * N + x) * 4;
      img.data[o + 3] = a ? 255 : 0; // black where opaque
    }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;

  const mask = new THREE.Mesh(
    new THREE.PlaneGeometry(PLANE, PLANE),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthTest: false, depthWrite: false, color: 0x000000 })
  );
  mask.renderOrder = 1000; // drawn last, over everything
  mask.frustumCulled = false;
  mask.matrixAutoUpdate = false;
  mask.visible = false;
  const offset = new THREE.Matrix4().makeTranslation(0, 0, -dist);
  // Re-place the mask for each eye just before that eye draws it.
  mask.onBeforeRender = (renderer, _scene, cam) => {
    mask.matrixWorld.multiplyMatrices(cam.matrixWorld, offset);
  };
  scene.add(mask);
  return mask;
}
