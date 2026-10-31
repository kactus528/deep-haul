#!/usr/bin/env python3
"""Crush a generated image to Deep Haul's 1992 spec and drop it into art/.

  python3 tools/crush.py INPUT KEY [--colors 64] [--fit cover|contain]

KEY decides the target: backdrops become 448x352 paintings that fade into
the void; sprites are cut out of a magenta background, trimmed, fitted and
bottom-aligned. Both get a palette of COLORS (snapped to 15-bit color) with
4x4 ordered dithering, then art/manifest.json is updated.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "art")

# key: (kind, width, height)
TARGETS = {
    # backdrops keep their own aspect ratio; height follows from width
    "cryo-front": ("backdrop", 512, None),
    "cryo-back": ("backdrop", 512, None),
    "pod-closed": ("sprite", 96, 192),
    "pod-open": ("sprite", 96, 192),
    "suit": ("sprite", 64, 128),
    "desk": ("sprite", 64, 96),
    "crate": ("sprite", 64, 64),
    "doris-eye": ("sprite", 48, 48),
    "mop": ("sprite", 48, 96),
}

BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=np.float32) / 16.0 - 0.47


def key_out_magenta(rgb):
    """Alpha mask: transparent where the pixel is (close to) flat magenta."""
    r, g, b = rgb[..., 0].astype(np.int32), rgb[..., 1].astype(np.int32), rgb[..., 2].astype(np.int32)
    magenta = (r > 150) & (b > 150) & (g < 110) & (np.abs(r - b) < 90) & ((r + b) / 2 - g > 90)
    alpha = np.where(magenta, 0, 255).astype(np.uint8)
    # despill: pull pinkish fringe pixels toward neutral
    fringe = (~magenta) & (r > g + 40) & (b > g + 40)
    avg = ((r + b) // 2).astype(np.int32)
    rgb = rgb.copy()
    rgb[fringe, 0] = np.clip((rgb[fringe, 0].astype(np.int32) + g[fringe]) // 2, 0, 255)
    rgb[fringe, 2] = np.clip((rgb[fringe, 2].astype(np.int32) + g[fringe]) // 2, 0, 255)
    del avg
    return rgb, alpha


def fit_sprite(img_rgba, w, h):
    """Trim to the object, fit inside w x h keeping aspect, bottom-aligned."""
    a = np.array(img_rgba)[..., 3]
    ys, xs = np.nonzero(a > 0)
    if len(xs):
        img_rgba = img_rgba.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = min(w / img_rgba.width, h / img_rgba.height)
    nw, nh = max(1, round(img_rgba.width * s)), max(1, round(img_rgba.height * s))
    small = img_rgba.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(small, ((w - nw) // 2, h - nh))
    return out


def fit_backdrop(img, w, h):
    """Scale to width w (keeping aspect), or center-crop to w x h if h is set."""
    if h is None:
        h = round(img.height * w / img.width)
        return img.resize((w, h), Image.LANCZOS).convert("RGBA")
    ar = w / h
    if img.width / img.height > ar:
        nw = round(img.height * ar)
        img = img.crop(((img.width - nw) // 2, 0, (img.width - nw) // 2 + nw, img.height))
    else:
        nh = round(img.width / ar)
        img = img.crop((0, (img.height - nh) // 2, img.width, (img.height - nh) // 2 + nh))
    return img.resize((w, h), Image.LANCZOS).convert("RGBA")


def crush_colors(rgba, colors):
    """Palette of `colors`, snapped to 15-bit, applied with ordered dither."""
    arr = np.array(rgba).astype(np.float32)
    rgb, alpha = arr[..., :3], arr[..., 3]
    opaque = alpha > 127
    sample = Image.fromarray(rgb[opaque].reshape(-1, 1, 3).astype(np.uint8)) if opaque.any() else Image.fromarray(rgb.astype(np.uint8))
    pal = np.array(sample.quantize(colors=colors, method=Image.Quantize.MEDIANCUT).getpalette()[: colors * 3], dtype=np.float32).reshape(-1, 3)
    pal = np.round(pal / 255 * 31) * (255 / 31)  # 15-bit color
    pal = np.unique(pal, axis=0)
    h, w = alpha.shape
    th = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w][..., None] * 28.0
    src = (rgb + th).reshape(-1, 3)
    out = np.empty_like(src)
    for i in range(0, len(src), 20000):
        chunk = src[i : i + 20000]
        d = ((chunk[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
        out[i : i + 20000] = pal[d.argmin(1)]
    res = np.dstack([out.reshape(h, w, 3), np.where(opaque, 255, 0)]).astype(np.uint8)
    return Image.fromarray(res, "RGBA")


def void_fade(rgba):
    """Same oval fade into the void that code-drawn paintings use."""
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    e = np.hypot((xx - w / 2) / (w * 0.5), (yy - h * 0.55) / (h * 0.56))
    fade = (e - 0.8) / 0.3
    bay = (np.tile(BAYER + 0.47, (h // 4 + 1, w // 4 + 1))[:h, :w])
    arr[..., 3] = np.where((fade > 0) & (bay < fade), 0, arr[..., 3])
    # near-black pixels at the rim melt into the void too
    dark = arr[..., :3].max(-1) < 18
    arr[..., 3] = np.where(dark & (e > 0.45), 0, arr[..., 3])
    return Image.fromarray(arr, "RGBA")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("key", choices=sorted(TARGETS))
    ap.add_argument("--colors", type=int, default=64)
    ap.add_argument("--preview", help="also save a 4x preview PNG here")
    ap.add_argument("--horizon", type=float, default=None, help="backdrops: eye-level line as a fraction of height")
    args = ap.parse_args()

    kind, w, h = TARGETS[args.key]
    src = Image.open(args.input).convert("RGB")
    if kind == "sprite":
        rgb, alpha = key_out_magenta(np.array(src))
        img = Image.fromarray(np.dstack([rgb, alpha]), "RGBA")
        img = fit_sprite(img, w, h)
        a = np.array(img)
        a[..., 3] = np.where(a[..., 3] > 127, 255, 0)
        img = Image.fromarray(a, "RGBA")
    else:
        img = fit_backdrop(src, w, h)
    img = crush_colors(img, args.colors)
    if kind == "backdrop":
        img = void_fade(img)

    os.makedirs(ART, exist_ok=True)
    out = os.path.join(ART, args.key + ".png")
    img.save(out)
    man_path = os.path.join(ART, "manifest.json")
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}
    entry = {"file": args.key + ".png"}
    if args.horizon is not None:
        entry["horizon"] = args.horizon
    manifest[args.key] = entry
    json.dump(manifest, open(man_path, "w"), indent=2, sort_keys=True)
    if args.preview:
        bg = Image.new("RGBA", img.size, (0, 0, 0, 255))
        bg.alpha_composite(img)
        bg.resize((img.width * 4, img.height * 4), Image.NEAREST).save(args.preview)
    n_colors = len(np.unique(np.array(img)[..., :3][np.array(img)[..., 3] > 0].reshape(-1, 3), axis=0))
    print(f"{args.key}: {kind} {img.width}x{img.height}, {n_colors} colors -> {out}")


if __name__ == "__main__":
    main()
