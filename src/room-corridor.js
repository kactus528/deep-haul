// Deck 2 corridor: between Cryo Bay 3 (behind you) and the mess hall (far
// end). Crew cabins line the walls: Pike, Shay, the captain, and Q. Leeks.

import { makeView, painting, hangPainting, layer, blitBack, treadFloor, panelWall, lampCeiling } from './stagekit.js?v=22';
import { pixelTexture, RAMPS as R, LIGHT } from './pixelart.js?v=22';
import { cardMaker, H, wallTex, floorTex, ceilingTex, doorTex, endWallTex, lampTex } from './roomkit.js?v=22';

export function buildCorridor(world) {
  const Z = -4; // corridor runs from z +1.5 (cryo) to z -9.5 (mess)
  const lampZ = [-0.5, -4, -7.5];
  const floorY = (z) => ((z + 9.5) / 11) * 512;
  const ceilY = (z) => ((1.5 - z) / 11) * 512;

  const toMess = endWallTex(128, 144, { label: 'MESS HALL', seed: 241, open: true });
  const toCryo = endWallTex(128, 144, { label: 'CRYO BAY 3', seed: 251, open: true, arrow: false });




  const lamp = lampTex(307);

  // A bulkhead frame in the foreground: the corridor's stereo "pop" layer.
  const arch = pixelTexture(128, 144, (p, w, h) => {
    p.bevel(0, 0, w, h, R.steel, 4);
    p.stripes(4, 4, w - 8, 8, R.hazard[5], R.black[2], 8);
    p.clear(16, 16, w - 32, h - 16);
    for (const x of [6, w - 14]) for (let y = 20; y < h; y += 26) p.rivet(x + 3, y, R.steel);
    p.grime(0, 0, w, h, { scale: 10, amount: 0.4, seed: 311 });
    p.outline('#100c22');
    p.quantize();
  }, { seed: 313 });

  // Doors, a window and a notice board, painted into the side walls.
  const fr = (v) => v - Math.floor(v);
  const doorAt = (doors) => (side, z, y) => {
    for (const d of doors) {
      if (d.side !== side || z < d.z0 || z > d.z1) continue;
      const u = (z - d.z0) / (d.z1 - d.z0);
      if (d.kind === 'window') {
        if (y < d.y0 || y > d.y1) continue;
        if (u < 0.05 || u > 0.95 || y < d.y0 + 0.05 || y > d.y1 - 0.05) return [R.steel, 5.6];
        const star = fr(Math.sin(Math.floor(z * 60) * 12.9898 + Math.floor(y * 60) * 78.233) * 43758.5);
        return star > 0.985 ? [R.beige, 7] : star > 0.96 ? [R.cryo, 5] : [R.black, 0.6 + (star > 0.5 ? 0.6 : 0)];
      }
      if (d.kind === 'notice') {
        if (y < d.y0 || y > d.y1) continue;
        if (u < 0.06 || u > 0.94 || y < d.y0 + 0.04 || y > d.y1 - 0.04) return [R.rust, 2];
        if (y > d.y1 - 0.2 && u > 0.12 && u < 0.88) return [R.beige, 6.4];
        return [R.rust, 4.2 + (fr(z * 13 + y * 7) > 0.8 ? 1.6 : 0)];
      }
      if (y > 2.15) continue;
      if (u < 0.08 || u > 0.92 || y > 2.08) return [R.steel, 5.4];
      if (y > 1.62 && y < 1.84 && u > 0.2 && u < 0.8) return [R.beige, 6.4];
      if (Math.abs(u - 0.5) < 0.02) return [R.dark, 1];
      if (u > 0.8 && u < 0.86 && y > 0.98 && y < 1.12) return [d.accent || R.cryo, 6.2];
      return [R.steel, 3 + y * 0.6];
    }
    return null;
  };
  const corridorWalls = (doors, pools) => ({
    floor: treadFloor({ walkway: 0.35, tile: 0.65, pools }),
    ceil: lampCeiling({ lamps: pools.map((q) => ({ x: 0, z: q.z, w: 0.35, d: 0.4 })) }),
    wall: panelWall({ paint: R.cryo, feature: doorAt(doors) }),
  });

  // ---- front view: down the corridor toward the mess hall ----
  const doors = [
    { side: -1, z0: 1.6, z1: 2.6, accent: R.red, spot: 'door_pike' },
    { side: 1, z0: 2.6, z1: 3.6, spot: 'door_shay' },
    { side: -1, z0: 4.0, z1: 4.7, kind: 'notice', y0: 1.15, y1: 1.85, spot: 'notice' },
    { side: 1, z0: 4.4, z1: 5.9, kind: 'window', y0: 1.2, y1: 2.0, spot: 'window' },
    { side: -1, z0: 6.2, z1: 7.2, accent: R.hazard, spot: 'door_thorne' },
    { side: 1, z0: 7.2, z1: 8.2, spot: 'door_leeks' },
  ];
  const front = makeView(world);
  const frontP = painting({
    room: { halfW: 1.3, height: 3, depth: 10 }, seed: 1101,
    surfaces: corridorWalls(doors, [{ x: 0, z: 2.6, r: 1.2 }, { x: 0, z: 6, r: 1.2 }]),
    back: (p, rect) => blitBack(p, toMess, rect),
  });
  hangPainting(front, frontP, [
    ['messdoor', frontP.backRegion(0.27, 0.26, 0.73, 1)],
    ...doors.map((d) => [d.spot, frontP.region(d.side * 1.3, d.side * 1.3, d.y0 ?? 0, d.y1 ?? 2.15, d.z0, d.z1)]),
  ]);
  layer(front, lamp, 0.42, 0.32, 0, 2.66, 6, { noHit: true });
  layer(front, lamp, 0.42, 0.32, 0, 2.66, 2.6, { noHit: true });
  layer(front, arch, 2.6, 2.92, 0, 0, 1.7, { noHit: true });

  // ---- back view: toward Cryo Bay 3, the library door on the right ----
  const backDoors = [{ side: 1, z0: 1.7, z1: 2.7, accent: R.hazard, spot: 'librarydoor' }];
  const back = makeView(world);
  const backP = painting({
    room: { halfW: 1.3, height: 3, depth: 3.4 }, seed: 1111,
    surfaces: corridorWalls(backDoors, [{ x: 0, z: 2.2, r: 1.1 }]),
    back: (p, rect) => blitBack(p, toCryo, rect),
  });
  hangPainting(back, backP, [
    ['cryodoor', backP.backRegion(0.27, 0.26, 0.73, 1)],
    ['librarydoor', backP.region(1.3, 1.3, 0, 2.15, 1.7, 2.7)],
  ]);
  layer(back, arch, 2.6, 2.92, 0, 0, 1.4, { noHit: true });

  return { name: 'CORRIDOR', fog: [8, 20], views: [front, back], update() {} };
}
