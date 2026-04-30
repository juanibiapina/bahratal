#!/usr/bin/env python3
"""Pre-fetch OSM raster tiles for the Bahratal area at zoom 13–17.

Polite: rate-limited, descriptive User-Agent. ~400 tiles total.
Writes to public/tiles/{z}/{x}/{y}.png and public/tiles-manifest.json.
"""
from __future__ import annotations
import json, math, os, time, urllib.request, urllib.error, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "src" / "data" / "bahratal.json").read_text())
TILES_DIR = ROOT / "public" / "tiles"
MANIFEST = ROOT / "public" / "tiles-manifest.json"

UA = "bahratal-bouldering-guide/1.0 (https://github.com/juanibiapina/bahratal; offline pre-cache)"
SUBDOMAINS = ["a", "b", "c"]
ZOOMS = range(13, 18)  # 13..17 inclusive
PAD_DEG = 0.005        # ~550m padding around bbox
RATE_S = 0.35          # ~3 req/s, well under OSM bulk limits


def deg2tile(lat: float, lng: float, z: int) -> tuple[int, int]:
    n = 2.0 ** z
    x = int((lng + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def collect_blocks_bbox() -> tuple[float, float, float, float]:
    lats, lngs = [], []
    for s in DATA["sectors"]:
        for b in s["blocks"]:
            if b.get("lat") and b.get("lng"):
                lats.append(b["lat"]); lngs.append(b["lng"])
    return (min(lats) - PAD_DEG, max(lats) + PAD_DEG,
            min(lngs) - PAD_DEG, max(lngs) + PAD_DEG)


def planned_tiles() -> list[tuple[int, int, int]]:
    minlat, maxlat, minlng, maxlng = collect_blocks_bbox()
    out = []
    for z in ZOOMS:
        x1, y1 = deg2tile(maxlat, minlng, z)
        x2, y2 = deg2tile(minlat, maxlng, z)
        xa, xb = sorted((x1, x2))
        ya, yb = sorted((y1, y2))
        for x in range(xa, xb + 1):
            for y in range(ya, yb + 1):
                out.append((z, x, y))
    return out


def fetch_tile(z: int, x: int, y: int) -> bool:
    dest = TILES_DIR / str(z) / str(x) / f"{y}.png"
    if dest.exists() and dest.stat().st_size > 0:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    s = SUBDOMAINS[(x + y) % len(SUBDOMAINS)]
    url = f"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            dest.write_bytes(r.read())
        return True
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {z}/{x}/{y}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  err {e!r} for {z}/{x}/{y}", file=sys.stderr)
        return False


def main() -> int:
    tiles = planned_tiles()
    print(f"Planned {len(tiles)} tiles across zooms {min(ZOOMS)}–{max(ZOOMS)}")
    ok = skipped = failed = 0
    manifest: list[str] = []
    for i, (z, x, y) in enumerate(tiles, 1):
        path = f"tiles/{z}/{x}/{y}.png"
        dest = TILES_DIR / str(z) / str(x) / f"{y}.png"
        if dest.exists() and dest.stat().st_size > 0:
            skipped += 1
        else:
            if fetch_tile(z, x, y):
                ok += 1; time.sleep(RATE_S)
            else:
                failed += 1; time.sleep(RATE_S)
                continue
        manifest.append(path)
        if i % 50 == 0:
            print(f"  {i}/{len(tiles)}  ok={ok} skipped={skipped} failed={failed}")
    MANIFEST.write_text(json.dumps(manifest, indent=0))
    total_bytes = sum((TILES_DIR / str(z) / str(x) / f"{y}.png").stat().st_size
                      for z, x, y in tiles
                      if (TILES_DIR / str(z) / str(x) / f"{y}.png").exists())
    print(f"Done. ok={ok} skipped={skipped} failed={failed}  total={total_bytes/1024/1024:.2f} MB")
    print(f"Wrote {MANIFEST}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
