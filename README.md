# Bahratal Bouldering Guide

A static, mobile-first bouldering guide for the Bahratal area in Saxon Switzerland (Elbsandstein, Germany), built from data scraped from [gulag-online.de](https://gulag-online.de/bahratal-1.html).

**Live site:** https://juanibiapina.dev/bahratal/

## What it does

The original site spreads route info across ~200 pages with no way to filter by grade or compare locations. This rebuild puts everything on one page with:

- **Global grade filter** — sectors and blocks re-rank by match count
- **Hierarchical browsing** — sectors → blocks → routes, expand inline
- **Map view** — 187 GPS markers, color-coded by sector, click to jump to routes
- **Locate me** — list of nearest blocks based on your GPS
- **Search** — across route, block, and sector names
- **Topo images** — full-res versions linked from thumbnails, lazy-loaded
- **Works offline** — service worker pre-caches the app shell + map tiles on first visit; topos are cached as you open them. Once visited online, the whole guide is usable at the crag with no signal.
- **One-tap full offline pack** — a "Download all topos for offline" button on the home screen pulls every thumbnail and full-res topo (~78 MB / 608 images) into a dedicated cache. Resumable, cancellable, with a live progress bar; "Clear" frees the space.
- **Installable** — PWA manifest + apple-touch-icon, so it can be added to the home screen and launched fullscreen.

## Stats

- 11 sectors
- 187 blocks
- 757 routes (grades 4 to 8c)
- 100% GPS coverage

## Tech

- [Astro](https://astro.build/) (static site, zero JS by default)
- [Tailwind CSS v4](https://tailwindcss.com/) (via Vite plugin)
- [Leaflet](https://leafletjs.com/) (self-hosted; map view)
- Pre-rendered OpenStreetMap raster tiles bundled at zoom 13–17 (~2.5 MB, 398 tiles)
- Service worker (hand-rolled, no Workbox) for offline support
- Web App Manifest for install-to-home-screen
- Vanilla JS for filter/expand logic — no framework

## Run locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to ./dist
```

## Project layout

```
src/
  data/
    bahratal.json     # extracted area data (320K)
    helpers.ts        # types + utilities
  layouts/
    Layout.astro      # html shell
  components/
    GradeBar.astro    # stacked color bar
    GradePill.astro   # colored grade badge
  pages/
    index.astro       # the unified explore page (only page)
public/
  images/             # 307 thumbnails (~_klein.jpg)
  files/              # 301 full-res topo images
  tiles/              # 398 pre-rendered OSM tiles (z13–17)
  tiles-manifest.json # list of tile paths for the service worker to pre-cache
  vendor/leaflet/     # self-hosted Leaflet (no CDN dependency)
  icons/              # PWA icons (180/192/512)
  manifest.webmanifest
  sw.js               # service worker (offline support)
scripts/
  fetch-tiles.py      # one-shot OSM tile pre-fetcher (rate-limited, polite UA)
PRD.md                # product requirements
DESIGN.md             # UX redesign rationale
```

## Data attribution

All route, block, sector, and topo data is from [gulag-online.de](https://gulag-online.de/bahratal-1.html).
This project is for personal use only — please respect the original authors.
