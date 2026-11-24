// ── Demo-mode local store ─────────────────────────────────────────────────────
// When the app is built with VITE_DEMO_MODE=true (e.g. the static GitHub
// Pages showcase), there is no Express/Prisma backend. This module implements
// the exact same API surface as the HTTP layer in ./index.ts, backed by
// localStorage and seeded with the GLB models bundled in public/assets/.
// All CP / PD / folder management keeps working — data simply lives in the
// visitor's browser instead of the server database.
//
// GLB uploads in demo mode are kept as in-memory object URLs, so an uploaded
// model renders for the current session only (it is not persisted).

import type { Folder, CP, PartDefinition } from "./index";

const STORAGE_KEY = "imos-designer-demo-store-v1";
const NOW = "2026-01-01T00:00:00.000Z";

interface Store {
  folders: Folder[];
  partDefinitions: PartDefinition[];
  cps: CP[];
  nextFolderId: number;
  nextPdId: number;
  nextCpId: number;
}

function seed(): Store {
  return {
    folders: [
      { id: 1, name: "Bundled Models", type: "PD", parentId: null, createdAt: NOW, updatedAt: NOW },
      { id: 2, name: "Standard Parts", type: "CP", parentId: null, createdAt: NOW, updatedAt: NOW },
    ],
    partDefinitions: [
      { id: 1, name: "AEBT Door Model", description: "Door model (bundled demo asset)", glbPath: "AEBT1003DModel.glb", folderId: 1, createdAt: NOW, updatedAt: NOW },
      { id: 2, name: "Door Drawing", description: "Door elevation model (bundled demo asset)", glbPath: "AEBDoorDrawing.glb", folderId: 1, createdAt: NOW, updatedAt: NOW },
      { id: 3, name: "Drawer Unit", description: "Drawer box model (bundled demo asset)", glbPath: "drawer.glb", folderId: 1, createdAt: NOW, updatedAt: NOW },
      { id: 4, name: "Cabinet Body", description: "Cabinet carcass model (bundled demo asset)", glbPath: "model.glb", folderId: 1, createdAt: NOW, updatedAt: NOW },
    ],
    cps: [
      { id: 1, name: "door", description: "Door leaf — renders the assigned door model", partDefinitionId: 1, folderId: 2, createdAt: NOW, updatedAt: NOW },
      { id: 2, name: "drawer", description: "Drawer unit", partDefinitionId: 3, folderId: 2, createdAt: NOW, updatedAt: NOW },
      { id: 3, name: "cabinet", description: "Cabinet body", partDefinitionId: 4, folderId: 2, createdAt: NOW, updatedAt: NOW },
    ],
    nextFolderId: 3,
    nextPdId: 5,
    nextCpId: 4,
  };
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // corrupted storage — fall through to a fresh seed
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage full/unavailable — demo keeps working in-memory for the session
  }
}

const store = load();
const now = () => new Date().toISOString();

// Session-only object URLs for GLBs uploaded while in demo mode.
const uploadedGlbUrls = new Map<string, string>();

export function resolveDemoGlbUrl(glbPath: string): string {
  if (glbPath.startsWith("demo-upload/")) {
    return uploadedGlbUrls.get(glbPath) ?? "";
  }
  return `${import.meta.env.BASE_URL}assets/${glbPath}`;
}

// ── Joins (mirror the Prisma `include`s of the real backend) ─────────────────

function pdWithCps(pd: PartDefinition): PartDefinition {
  return {
    ...pd,
    cps: store.cps
      .filter(cp => cp.partDefinitionId === pd.id)
      .map(cp => ({ ...cp })),
  };
}

function cpWithPd(cp: CP): CP {
  const pd = store.partDefinitions.find(p => p.id === cp.partDefinitionId);
  return { ...cp, partDefinition: pd ? { ...pd } : null };
}

// ── Folder API ────────────────────────────────────────────────────────────────

export const localFolderApi = {
  getAll: async (type: "PD" | "CP"): Promise<Folder[]> =>
    store.folders.filter(f => f.type === type).map(f => ({ ...f })),

  create: async (payload: {
    name: string;
    type: "PD" | "CP";
    parentId?: number | null;
  }): Promise<Folder> => {
    const folder: Folder = {
      id: store.nextFolderId++,
      name: payload.name,
      type: payload.type,
      parentId: payload.parentId ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    store.folders.push(folder);
    save(store);
    return { ...folder };
  },

  update: async (
    id: number,
    payload: { name?: string; parentId?: number | null },
  ): Promise<Folder> => {
    const folder = store.folders.find(f => f.id === id);
    if (!folder) throw new Error("Folder not found");
    if (payload.name !== undefined) folder.name = payload.name;
    if (payload.parentId !== undefined) folder.parentId = payload.parentId;
    folder.updatedAt = now();
    save(store);
    return { ...folder };
  },

  delete: async (id: number): Promise<void> => {
    // Mirror the backend: deleting a folder cascades to child folders and
    // un-files (folderId = null) the PDs/CPs it contained.
    const toDelete = new Set<number>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const f of store.folders) {
        if (f.parentId !== null && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          grew = true;
        }
      }
    }
    store.folders = store.folders.filter(f => !toDelete.has(f.id));
    for (const pd of store.partDefinitions) if (pd.folderId && toDelete.has(pd.folderId)) pd.folderId = null;
    for (const cp of store.cps) if (cp.folderId && toDelete.has(cp.folderId)) cp.folderId = null;
    save(store);
  },
};

// ── CP API ────────────────────────────────────────────────────────────────────

export const localCpApi = {
  getAll: async (): Promise<CP[]> => store.cps.map(cpWithPd),

  getById: async (id: number): Promise<CP> => {
    const cp = store.cps.find(c => c.id === id);
    if (!cp) throw new Error("CP not found");
    return cpWithPd(cp);
  },

  create: async (payload: {
    name: string;
    description?: string;
    partDefinitionId?: number | null;
    folderId?: number | null;
  }): Promise<CP> => {
    const cp: CP = {
      id: store.nextCpId++,
      name: payload.name,
      description: payload.description ?? null,
      partDefinitionId: payload.partDefinitionId ?? null,
      folderId: payload.folderId ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    store.cps.push(cp);
    save(store);
    return cpWithPd(cp);
  },

  update: async (
    id: number,
    payload: {
      name?: string;
      description?: string;
      partDefinitionId?: number | null;
      folderId?: number | null;
    },
  ): Promise<CP> => {
    const cp = store.cps.find(c => c.id === id);
    if (!cp) throw new Error("CP not found");
    Object.assign(cp, payload, { updatedAt: now() });
    save(store);
    return cpWithPd(cp);
  },

  assignPartDefinition: async (
    cpId: number,
    partDefinitionId: number | null,
  ): Promise<CP> => localCpApi.update(cpId, { partDefinitionId }),

  delete: async (id: number): Promise<void> => {
    store.cps = store.cps.filter(c => c.id !== id);
    save(store);
  },
};

// ── PartDefinition API ────────────────────────────────────────────────────────

export const localPartDefinitionApi = {
  getAll: async (): Promise<PartDefinition[]> =>
    store.partDefinitions.map(pdWithCps),

  getById: async (id: number): Promise<PartDefinition> => {
    const pd = store.partDefinitions.find(p => p.id === id);
    if (!pd) throw new Error("PartDefinition not found");
    return pdWithCps(pd);
  },

  create: async (payload: {
    name: string;
    description?: string;
    folderId?: number | null;
  }): Promise<PartDefinition> => {
    const pd: PartDefinition = {
      id: store.nextPdId++,
      name: payload.name,
      description: payload.description ?? null,
      glbPath: null,
      folderId: payload.folderId ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    store.partDefinitions.push(pd);
    save(store);
    return pdWithCps(pd);
  },

  update: async (
    id: number,
    payload: { name?: string; description?: string; folderId?: number | null },
  ): Promise<PartDefinition> => {
    const pd = store.partDefinitions.find(p => p.id === id);
    if (!pd) throw new Error("PartDefinition not found");
    Object.assign(pd, payload, { updatedAt: now() });
    save(store);
    return pdWithCps(pd);
  },

  delete: async (id: number): Promise<void> => {
    store.partDefinitions = store.partDefinitions.filter(p => p.id !== id);
    for (const cp of store.cps) {
      if (cp.partDefinitionId === id) cp.partDefinitionId = null;
    }
    save(store);
  },

  uploadGlb: async (
    id: number,
    file: File,
  ): Promise<{
    message: string;
    glbPath: string;
    glbUrl: string;
    partDefinition: PartDefinition;
  }> => {
    const pd = store.partDefinitions.find(p => p.id === id);
    if (!pd) throw new Error("PartDefinition not found");
    const glbPath = `demo-upload/${id}-${file.name}`;
    uploadedGlbUrls.set(glbPath, URL.createObjectURL(file));
    pd.glbPath = glbPath;
    pd.updatedAt = now();
    save(store);
    return {
      message: "GLB attached for this demo session",
      glbPath,
      glbUrl: uploadedGlbUrls.get(glbPath)!,
      partDefinition: pdWithCps(pd),
    };
  },

  removeGlb: async (
    id: number,
  ): Promise<{ message: string; partDefinition: PartDefinition }> => {
    const pd = store.partDefinitions.find(p => p.id === id);
    if (!pd) throw new Error("PartDefinition not found");
    if (pd.glbPath) uploadedGlbUrls.delete(pd.glbPath);
    pd.glbPath = null;
    pd.updatedAt = now();
    save(store);
    return { message: "GLB removed", partDefinition: pdWithCps(pd) };
  },

  getGlbUrl: (pd: PartDefinition): string | null => {
    if (!pd.glbPath) return null;
    const url = resolveDemoGlbUrl(pd.glbPath);
    return url === "" ? null : url;
  },
};
