# Bahratal UX Redesign

## Problems with current design

### The two main questions don't combine

A climber deciding where to go asks two things at once:
1. **Where?** — which sector/block (location, shade, parking, proximity)
2. **What grade?** — what can I climb at my level

The current site splits these into separate pages that don't talk to each other:

- **Home** → shows sectors with grade distributions, but the grade chips link away to a flat route list. No way to say "show me sectors ranked by how many 7a routes they have."
- **Sector page** → shows blocks with routes, but no grade filter. To find 7a routes in Schlachthof (21 blocks, 151 routes) I must expand each block and scan manually.
- **Routes page** → flat list of 757 routes filtered by grade. Loses all spatial context. "CCR — Erbstoll'n › Patentwand" means nothing if I don't know where Patentwand is or what else is nearby.

### The routes page is the wrong abstraction

Nobody browses 757 routes in a flat list. The list has no grouping, no spatial context, no way to compare locations. Filtering to "7a" gives 156 results — still too many to scan without structure.

### Three pages, three mental models

Home = overview. Sector = hierarchy. Routes = search. Each has its own layout, its own interaction patterns. The user has to learn three interfaces and mentally stitch them together.

## User stories

1. **"I climb 6c. Where should I go?"** → See sectors ranked by 6c route count. Pick one. See its 6c blocks.
2. **"I'm at Schlachthof. What can I climb at 7a–7b?"** → Open Schlachthof, filter by grade, see matching blocks and routes.
3. **"Where is Gulag-Block and what's on it?"** → Search "gulag", find the block, see its routes, tap GPS.
4. **"I'm standing in the parking lot. What's closest to me in 6a–6c?"** → Map + grade filter + locate me.

In every story, **location and grade are needed simultaneously**.

## New design: one page, two dimensions

### Principle: the grade filter is global

One persistent grade filter sits at the top of every view. Selecting a grade doesn't navigate away — it transforms the current view in place.

### Structure

```
┌──────────────────────────────────────────────┐
│  🪨 Bahratal          [List]  [Map]  [Search]│  ← nav
├──────────────────────────────────────────────┤
│  [All] [4-5] [6a] [6b] [6c] [7a] [7b] ...  │  ← sticky grade filter
│  🔍 Search routes...                        │
├──────────────────────────────────────────────┤
│                                              │
│  LIST VIEW (default)                         │
│  ┌─ Schlachthof  ──── 35 of 151 routes ─┐   │  ← sector card
│  │  ████████░░░░  🅿️ Parking  📍 Map    │   │     counts update with filter
│  │                                       │   │
│  │  ▸ Schlachthof-Block    8 routes      │   │  ← block row
│  │  ▸ Schwarz & Weiss     5 routes      │   │     only shows matching count
│  │  ▸ Riesen-Block        4 routes      │   │     sorted by match count
│  │   · · ·                               │   │
│  │  ▸ Erbse-Block         0 routes  dim  │   │  ← 0 matches → dimmed
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌─ Fuck  ──────── 28 of 116 routes ────┐   │
│  │  ...                                  │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  MAP VIEW (toggle)                           │
│  Same filter applied to markers.             │
│  Markers sized/colored by match count.       │
│                                              │
└──────────────────────────────────────────────┘
```

### How the grade filter transforms the view

| State | Sector card | Block row | Route row |
|-------|------------|-----------|-----------|
| No filter | "151 routes", full grade bar | "23 routes", full grade bar | All visible |
| Grade = 7a | "35 of 151 routes", filtered bar | "8 of 23 routes" | Only 7a visible, others hidden |

- Sectors re-sort by matching route count (most matches first).
- Blocks within a sector re-sort by matching route count.
- Blocks with 0 matches collapse to a single dimmed line.
- Grade bar updates to show only the selected grade's portion.
- The "All" chip shows total; each grade chip shows its count.

### Three view modes, one filter

1. **List** (default): Sector → Block → Route hierarchy. Expandable blocks.
2. **Map**: Leaflet with block markers. Popup shows matching routes. "Find me" for proximity.
3. **Search**: Text search across route/block/sector names. Results grouped by sector → block.

The grade filter persists across all three. Switching view mode doesn't reset it.

### Expanded block detail

When a block is expanded (in list or map popup):
- Topo images (horizontal scroll)
- Route table with grade pills
- Non-matching routes dimmed (not hidden) so you still see context
- GPS link, route count

### Mobile layout

- Grade filter wraps naturally (chips flow to second line).
- Sector cards stack vertically.
- Block summaries are tap-to-expand.
- Map fills viewport below filter bar.
- Search is accessible from filter bar (combined input).

## Pages to remove

- `/routes` — absorbed into list view with grade filter
- `/sector/[slug]` — absorbed into list view (sectors expand in-place)

## Pages to keep

- `/` — the unified explore page (list + map + search)

## Implementation plan

1. Build the unified explore page with all data rendered server-side.
2. Add client-side JS for: grade filter, sector expand/collapse, block expand/collapse, view switching, search.
3. Map view as a toggle (lazy-load Leaflet only when switched to).
4. Remove old `/routes` and `/sector/[slug]` pages.
