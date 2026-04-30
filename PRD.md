# Bahratal Bouldering Guide — PRD

## Problem

The [gulag-online.de](https://gulag-online.de/bahratal-1.html) website for the Bahratal bouldering area is hard to navigate. Route information is spread across ~200 separate pages. There is no way to filter by grade, see grade distributions per sector/block, or quickly find nearby boulders. The site is not mobile-friendly.

## Solution

A static Astro site that aggregates all data from gulag-online.de into a single, fast, mobile-first app with filtering, search, and a map view.

## Data

Extracted from gulag-online.de:

| Entity | Count |
|--------|-------|
| Sectors | 11 |
| Blocks | 187 |
| Routes | 757 |
| Topo images | 306 |
| GPS coordinates | 187 (100% coverage) |

Source: `src/data/bahratal.json`

## Features

### 1. Home / Overview

- Area description and quick stats (11 sectors, 187 blocks, 757 routes).
- Sector cards showing name, block count, route count, and a grade distribution bar.
- Quick-filter chips to highlight sectors with routes in a given grade range.

### 2. Sector View

- Sector header with parking GPS link, description, and stats.
- List of blocks with route count and dominant grade.
- Grade distribution chart for the sector.
- Click a block to expand its routes inline.

### 3. Block Detail (inline or full page)

- Block name, GPS link (opens in Google Maps), topo images.
- Route table: number, name, grade, description, first ascent.
- Sortable by grade.

### 4. Grade Filter (global)

- Sticky filter bar with grade-group chips: 4-5, 6a, 6b, 6c, 7a, 7b, 7c, 8a, 8b+.
- Selecting a grade filters all views (sectors, blocks, routes).
- Show count of matching routes per chip.

### 5. Map View

- Interactive Leaflet map with all 187 block markers colored by sector.
- Cluster markers at low zoom.
- Popup on tap: block name, sector, route count, grade range, GPS link.
- "Locate me" button to find nearest blocks.
- Filter syncs with grade filter.

### 6. Search

- Full-text search across route names, block names, sector names.
- Results link to the matching block/route.

## Non-goals

- User accounts, tick lists, or any server-side state.
- Editing or submitting new routes.

## Tech Stack

- **Astro** (static site generator, zero JS by default, islands for interactive parts).
- **Tailwind CSS** (utility-first, mobile-first).
- **Leaflet** (map, loaded as a client island).
- **Fuse.js** (client-side search).

## Tasks

1. ✅ Extract all data from gulag-online.de (sectors, blocks, routes, GPS, images).
2. ✅ Create PRD.
3. ✅ Scaffold Astro project with Tailwind.
4. ✅ Build data layer (`bahratal.json` + helper functions).
5. ✅ Build layout and navigation (mobile-first).
6. ✅ Build Home page with sector cards and grade distribution.
7. ✅ Build Sector page with block list and grade chart.
8. ✅ Build Block detail with route table and topo images.
9. ✅ Build grade filter (global, sticky).
10. ✅ Build map view with Leaflet.
11. ✅ Build search.
12. ✅ Test on mobile viewport.
