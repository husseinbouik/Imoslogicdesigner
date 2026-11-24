# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Article Designer** is a full-stack 3D modeling and visualization application for designing article layouts (shelving, compartments, etc.). The frontend is a React + Three.js application for 3D rendering and UI, and the backend is an Express API with PostgreSQL/Prisma for data management.

## Development Commands

### Frontend (React + Vite)
```bash
npm run dev        # Start development server (runs on http://localhost:5173)
npm run build      # Build for production (TypeScript + Vite)
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend (Express + Prisma)
```bash
cd server
npm run dev        # Start development server (runs on http://localhost:3001)
npm run build      # Compile TypeScript
npm run start      # Run compiled server

# Database
npm run db:migrate # Create/apply database migrations
npm run db:studio  # Open Prisma Studio (GUI for database)
npm run db:generate # Regenerate Prisma client
```

### Full Development Setup
To run both frontend and backend simultaneously, open two terminals:
- Terminal 1: `npm run dev` (from root)
- Terminal 2: `cd server && npm run dev`

The frontend proxies API calls to `http://localhost:3001` (configured in `vite.config.ts`).

## Architecture

### Frontend Structure (`src/`)

**Core App:**
- `App.tsx` - Main application component that orchestrates the 3D viewport and UI panels
- `index.css` - Global Tailwind CSS styles

**Lib Organization:**
- **`components/`** - React components organized by domain:
  - `ui/` - UI panels and controls (LayersInterface, JsonInterface, CPManager, PDManager, etc.)
  - `zoning/` - 3D zone/compartment components (Zone, DivisionFace, etc.)
  - `configurator/` - Configuration controls for the selected zone
  - `wrapper/` - Wrapper components for context providers

- **`hooks/`** - Custom React hooks managing business logic:
  - `useZoningLogic` - Core zone structure and selection state
  - `useZoneEditActions` - Zone manipulation operations (add/remove divisions, change styles, etc.)
  - `useConfiguratorLogic` - Configurator panel state
  - `useCPs` - Custom Part definitions data fetching
  - `useTheme` - Light/dark theme state
  - `useZoneMaterials` - Material/color management for faces

- **`context/`** - React Context providers:
  - `ZoneContext` - Zone state provider

- **`api/`** - API client functions for backend communication (CPs, Part Definitions, Folders)
- **`types/`** - TypeScript type definitions
- **`constants/`** - Application constants
- **`utils/`** - Utility functions

**Key Dependencies:**
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful React Three Fiber helpers (OrbitControls, etc.)
- `r3f-glb-exporter` - GLB/GLTF export functionality for 3D models
- `react-resizable-panels` - Resizable panel layout for UI
- `tailwindcss` - Styling framework
- `door_models`, `cloisant_models` - 3D model packages for parts

### Backend Structure (`server/`)

**Entry Point:**
- `src/index.ts` - Express app initialization with middleware and route setup

**Routes (`src/routes/`):**
- `cp.ts` - API endpoints for Custom Parts (CPs): GET, POST, PUT, DELETE
- `partDefinition.ts` - API endpoints for Part Definitions: CRUD operations, GLB file uploads, file serving
- `folder.ts` - API endpoints for folder management (hierarchical organization of CPs and Part Definitions)

**Database:**
- `prisma/schema.prisma` - Data schema defining models: Folder, PartDefinition, CP
- Models support hierarchical folder structures with automatic cascading deletes

**Key Dependencies:**
- `express` - HTTP server framework
- `@prisma/client` - ORM for database access
- `multer` - File upload middleware
- `cors` - CORS middleware for frontend communication

### Data Flow

**Zone Editing (Frontend):**
1. User interacts with 3D viewport or configurator
2. `useZoningLogic` hook updates zone tree state
3. `useZoneEditActions` hook provides mutation functions
4. UI components re-render based on new state
5. Changes persist in local state (no automatic server sync for design data)

**Part Definitions & CPs (Frontend ↔ Backend):**
1. `useCPs` hook fetches CP list from `/api/cps`
2. `api/index.ts` calls provide CRUD operations
3. Part Definitions can have GLB files uploaded to `/api/part-definitions`
4. GLB files served via `/uploads` directory
5. Folders organize both CPs and Part Definitions hierarchically

**GLB Export:**
1. User clicks export button
2. `SceneCapture` and `ExportButton` from r3f-glb-exporter handle the export
3. Generated GLB file downloaded to user's machine

## Key Technical Notes

### 3D Rendering
- Zone structure is a recursive tree of compartments and divisions
- Faces can have different styles (solid colors, patterns)
- Materials and colors are managed through `useZoneMaterials` and Tailwind/CSS
- Three.js meshes are dynamically generated based on zone tree structure

### State Management
- **Local UI state**: Managed with React `useState` (wireframe visibility, panel collapse, modal open states)
- **Zone editing state**: Centralized in `useZoningLogic` (tree structure, selection)
- **Server data**: Fetched via API and cached in component-level state (CPs, Part Definitions, Folders)

### Database Schema
- **Folder**: Hierarchical organization with self-referential parent-child relationship
- **PartDefinition**: Named definitions with optional GLB files, organized in folders
- **CP**: Custom parts linked to optional PartDefinitions, organized in folders
- Unique constraints prevent duplicate names within same parent and type

### Port Configuration
- Frontend dev server: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Vite proxy: Frontend routes `/api` and `/uploads` requests to backend

## Development Workflow

### Adding a New Feature
1. **UI**: Create component in appropriate `components/` subdirectory
2. **Logic**: If complex, create a custom hook in `hooks/`
3. **Data**: If server data needed, add API function in `api/index.ts` and backend route
4. **Types**: Update `types/` as needed
5. **Styling**: Use Tailwind CSS classes

### Debugging
- **3D Issues**: Check materials, mesh positioning, and camera controls in `useZoningLogic`
- **API Issues**: Check Express routes and Prisma queries in `server/src/routes/`
- **State Issues**: Check hook dependencies and React Context setup
- Use `r3f-perf` (already imported in App.tsx) for performance monitoring

### Database Changes
1. Update `server/prisma/schema.prisma`
2. Run `npm run db:generate` to regenerate Prisma client
3. Run `npm run db:migrate` to apply changes
4. Commit both migration files and updated schema

## Common Tasks

**Run tests**: Currently no test suite configured. Consider adding Jest/Vitest setup if needed.

**Type checking**: TypeScript configured in `tsconfig.json` and `tsconfig.app.json`. Run `tsc -b` to check types.

**Linting**: ESLint configured. Run `npm run lint` to check code quality.
