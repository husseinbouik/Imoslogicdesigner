// ── Types ─────────────────────────────────────────────────────────────────────

export interface Folder {
  id: number;
  name: string;
  type: "PD" | "CP";
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartDefinition {
  id: number;
  name: string;
  description: string | null;
  glbPath: string | null;
  createdAt: string;
  updatedAt: string;
  cps?: CP[];
  folderId?: number | null;
}

export interface CP {
  id: number;
  name: string;
  description: string | null;
  partDefinitionId: number | null;
  partDefinition?: PartDefinition | null;
  createdAt: string;
  updatedAt: string;
  folderId?: number | null;
}

// ── Base URL ──────────────────────────────────────────────────────────────────
// During dev, Vite proxies /api → http://localhost:3001
const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

// ── Folder API ────────────────────────────────────────────────────────────────

export const folderApi = {
  /** List all Folders by type */
  getAll: (type: "PD" | "CP") => request<Folder[]>(`/folders?type=${type}`),

  /** Create a new Folder */
  create: (payload: {
    name: string;
    type: "PD" | "CP";
    parentId?: number | null;
  }) =>
    request<Folder>("/folders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Update a Folder (rename / move) */
  update: (id: number, payload: { name?: string; parentId?: number | null }) =>
    request<Folder>(`/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** Delete a Folder */
  delete: (id: number) => request<void>(`/folders/${id}`, { method: "DELETE" }),
};

// ── CP API ────────────────────────────────────────────────────────────────────

export const cpApi = {
  /** List all CPs (includes partDefinition) */
  getAll: () => request<CP[]>("/cps"),

  /** Get a single CP by id */
  getById: (id: number) => request<CP>(`/cps/${id}`),

  /** Create a new CP */
  create: (payload: {
    name: string;
    description?: string;
    partDefinitionId?: number | null;
    folderId?: number | null;
  }) =>
    request<CP>("/cps", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Update a CP — pass only the fields you want to change */
  update: (
    id: number,
    payload: {
      name?: string;
      description?: string;
      partDefinitionId?: number | null;
      folderId?: number | null;
    },
  ) =>
    request<CP>(`/cps/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** Assign a PartDefinition to a CP */
  assignPartDefinition: (cpId: number, partDefinitionId: number | null) =>
    request<CP>(`/cps/${cpId}`, {
      method: "PUT",
      body: JSON.stringify({ partDefinitionId }),
    }),

  /** Delete a CP */
  delete: (id: number) => request<void>(`/cps/${id}`, { method: "DELETE" }),
};

// ── PartDefinition API ────────────────────────────────────────────────────────

export const partDefinitionApi = {
  /** List all PartDefinitions (includes assigned CPs) */
  getAll: () => request<PartDefinition[]>("/part-definitions"),

  /** Get a single PartDefinition by id */
  getById: (id: number) => request<PartDefinition>(`/part-definitions/${id}`),

  /** Create a new PartDefinition */
  create: (payload: {
    name: string;
    description?: string;
    folderId?: number | null;
  }) =>
    request<PartDefinition>("/part-definitions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Update a PartDefinition */
  update: (
    id: number,
    payload: { name?: string; description?: string; folderId?: number | null },
  ) =>
    request<PartDefinition>(`/part-definitions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** Delete a PartDefinition (CPs pointing to it will have partDefinitionId set to null) */
  delete: (id: number) =>
    request<void>(`/part-definitions/${id}`, { method: "DELETE" }),

  /**
   * Upload a GLB file to a PartDefinition.
   * Pass a File object from an <input type="file"> element.
   */
  uploadGlb: async (
    id: number,
    file: File,
  ): Promise<{
    message: string;
    glbPath: string;
    glbUrl: string;
    partDefinition: PartDefinition;
  }> => {
    const formData = new FormData();
    formData.append("glb", file);

    const res = await fetch(`${BASE}/part-definitions/${id}/upload-glb`, {
      method: "POST",
      body: formData,
      // NOTE: do NOT set Content-Type header — browser sets it with the correct boundary
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error ?? `Upload failed: ${res.status}`);
    }
    return data;
  },

  /** Remove the GLB file from a PartDefinition (keeps the PD record) */
  removeGlb: (id: number) =>
    request<{ message: string; partDefinition: PartDefinition }>(
      `/part-definitions/${id}/glb`,
      { method: "DELETE" },
    ),

  /**
   * Get the public URL for a GLB file stored in a PartDefinition.
   * Returns null if no GLB is assigned.
   */
  getGlbUrl: (pd: PartDefinition): string | null => {
    if (!pd.glbPath) return null;
    return `/uploads/${pd.glbPath}`;
  },
};
