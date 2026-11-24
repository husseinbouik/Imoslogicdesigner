# Article Designer — iMOS-Style Logic

**Live demo:** https://husseinbouik.github.io/Imoslogicdesigner/

An interactive 3D **article designer** for made-to-measure furniture: build an
article (cabinet, shelving unit, wardrobe…) as a tree of zones, divide zones
with iMOS-style linear-division logic, style every panel face, drop in real 3D
parts (doors, drawers), and watch every dimension recalculate live in 3D.
Designs export to JSON and GLB.

> Created by **Hussein Bouik**; developed collaboratively with
> **Mohamed Alfakir** as a self-training side project on configurator logic.

![Stack](https://img.shields.io/badge/React_19-Three.js_/_R3F-TypeScript-9c6b34)

## Features

- **Zone-tree article model** — an article is a recursive tree of zones
  (root → divisions → end zones), edited through a layers panel.
- **Linear division engine** — split any zone horizontally/vertically using
  iMOS-style division formulas; a dimension calculator derives every zone's
  real size from the root dimensions, panel thicknesses and division ratios.
- **Per-face panel styling** — thickness, material/colour, trims and insets
  per face (front/back/left/right/top/bottom), with style inheritance from
  parent zones.
- **Construction Parts (CP) & Part Definitions (PD)** — a small library
  system: organise parts in folders, define a part once (PD), reuse it as a
  named construction part (CP), and attach a GLB model that renders inside
  any zone assigned that CP name (e.g. `door`, `drawer`).
- **Live 3D viewport** — React Three Fiber scene with orbit controls,
  wireframe toggle, zone highlighting and click-to-select.
- **Import / export** — save and reload whole designs as JSON; export the
  finished article as a GLB file.
- **Dark / light themes** — warm wood dark theme by default.

## Demo mode (static showcase)

The live demo runs **front-end-only** — no server needed. Building with
`VITE_DEMO_MODE=true` swaps the REST API layer for a localStorage-backed
store (`src/lib/api/localStore.ts`) seeded with the GLB models bundled in
`public/assets/`, so CP/PD/folder management works entirely in the browser.
Design data always lives locally (`src/lib/utils/data/`); only the CP/PD
library ever talked to the backend.

```bash
# Static showcase build (GitHub Pages)
VITE_DEMO_MODE=true VITE_BASE=/Imoslogicdesigner/ npm run build
```

`VITE_BASE` controls the Vite base path: it defaults to `/` for local dev and
the full-stack app, and is set to `/Imoslogicdesigner/` only for the Pages
deployment.

## Architecture

### Frontend (`src/`)

- `App.tsx` — orchestrates the 3D viewport, the collapsible control panel
  (root dimensions → layers → configurator) and the CP/PD managers.
- `lib/components/zoning/` — the 3D scene: zone renderer, divided/end zones,
  GLB model loader, selection highlighter.
- `lib/components/configurator/` — per-zone settings: divisions, partitions,
  drawers, panel-face style editor.
- `lib/components/ui/` — layers tree, JSON import/export interface, zone
  info readout, CP & PD managers, folder tree.
- `lib/hooks/` — business logic: `useZoningLogic` (tree + selection state),
  `useLinearDivision`, `useConfiguratorLogic`, `useZoneMaterials`, `useCPs`,
  `useTheme`.
- `lib/utils/` — the calculation core: `dimension-calculator.ts`,
  `zone-layout.ts`, `zone-generator.ts`, `style-calculator.ts`, tree helpers.
- `lib/api/` — the data layer: HTTP client for the backend, plus the
  demo-mode local store with the identical interface.

### Backend (`server/`)

Express + Prisma (PostgreSQL) API on port 3001:

- `routes/folder.ts`, `routes/cp.ts`, `routes/partDefinition.ts` — CRUD for
  folders, construction parts and part definitions, including GLB upload
  (`/uploads`) and serving.
- `prisma/schema.prisma` — `Folder` / `PartDefinition` / `CP` models.
- In development, Vite proxies `/api` and `/uploads` to the backend
  (see `vite.config.ts`).

## Tech stack

- **Frontend:** React 19, TypeScript, Vite (rolldown-vite), Three.js +
  React Three Fiber + drei, Tailwind CSS 4, react-resizable-panels,
  r3f-glb-exporter, `imos-linear-division`.
- **Backend:** Node.js, Express, Prisma, PostgreSQL (SQLite dev database
  included under `server/prisma/`).

## Run it locally

```bash
# Frontend only (designer works; CP/PD library needs the backend or demo mode)
npm install
npm run dev

# Full stack — second terminal:
cd server && npm install && npm run dev
```

## Credits

Created by **Hussein Bouik**; developed collaboratively with
**Mohamed Alfakir** as a self-training side project on configurator logic —
an exploration of the dimension/division mathematics behind iMOS-style
article construction, built from scratch for learning purposes.
