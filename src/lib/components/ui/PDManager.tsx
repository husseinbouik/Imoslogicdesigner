import { useState, useEffect, useCallback, useRef } from "react";
import {
  partDefinitionApi,
  folderApi,
  type PartDefinition,
  type Folder,
} from "../../api";
import "./CPManager.css"; /* reuse shared modal styles */
import "./FolderTree.css";
import { FolderTree } from "./FolderTree";
import {
  FiPlus,
  FiTrash2,
  FiUpload,
  FiX,
  FiCheck,
  FiPackage,
  FiFolderPlus,
} from "react-icons/fi";

function Spinner() {
  return <div className="cpm-spinner" />;
}

interface PDManagerProps {
  onClose: () => void;
}

export function PDManager({ onClose }: PDManagerProps) {
  const [pds, setPds] = useState<PartDefinition[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [selectedPdId, setSelectedPdId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGlb, setUploadingGlb] = useState(false);
  const glbInputRef = useRef<HTMLInputElement>(null);

  // New PD/Folder form
  const [formOpen, setFormOpen] = useState<{
    type: "pd" | "folder";
    parentId: number | null;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Rename PD/Folder (inline in detail pane)
  const [renamingPd, setRenamingPd] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [renameFolderValue, setRenameFolderValue] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const selectedPd = pds.find(p => p.id === selectedPdId) ?? null;
  const selectedFolder = folders.find(f => f.id === selectedFolderId) ?? null;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pdList, folderList] = await Promise.all([
        partDefinitionApi.getAll(),
        folderApi.getAll("PD"),
      ]);
      setPds(pdList);
      setFolders(folderList);
    } catch {
      showToast("Failed to load Part Definitions", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const handleCreatePd = async (parentId: number | null) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const pd = await partDefinitionApi.create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        folderId: parentId,
      });
      setPds(prev => [...prev, pd]);
      setNewName("");
      setNewDesc("");
      setFormOpen(null);
      setSelectedPdId(pd.id);
      setSelectedFolderId(null);
      showToast(`PD "${pd.name}" created`, "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to create PD", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFolder = async (parentId: number | null) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const folder = await folderApi.create({
        name: newName.trim(),
        type: "PD",
        parentId,
      });
      setFolders(prev => [...prev, folder]);
      setNewName("");
      setFormOpen(null);
      setSelectedFolderId(folder.id);
      setSelectedPdId(null);
      showToast(`Folder created`, "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to create folder", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = () => {
    if (formOpen?.type === "pd") handleCreatePd(formOpen.parentId);
    else if (formOpen?.type === "folder") handleCreateFolder(formOpen.parentId);
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Delete this Part Definition? CPs assigned to it will lose their PD.",
      )
    )
      return;
    try {
      await partDefinitionApi.delete(id);
      setPds(prev => prev.filter(p => p.id !== id));
      if (selectedPdId === id) setSelectedPdId(null);
      showToast("PD deleted", "success");
    } catch {
      showToast("Failed to delete PD", "error");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (
      !confirm(
        "Delete this folder? PDs inside will move to root. Subfolders will be deleted.",
      )
    )
      return;
    try {
      await folderApi.delete(id);
      // Reload everything to get updated states (cascades, set nulls)
      fetchAll();
      if (selectedFolderId === id) setSelectedFolderId(null);
      showToast("Folder deleted", "success");
    } catch {
      showToast("Failed to delete folder", "error");
    }
  };

  const handleRenamePd = async () => {
    if (!selectedPd || !renameValue.trim()) return;
    try {
      const updated = await partDefinitionApi.update(selectedPd.id, {
        name: renameValue.trim(),
      });
      setPds(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setRenamingPd(false);
      showToast("PD renamed", "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to rename PD", "error");
    }
  };

  const handleRenameFolder = async () => {
    if (!selectedFolder || !renameFolderValue.trim()) return;
    try {
      const updated = await folderApi.update(selectedFolder.id, {
        name: renameFolderValue.trim(),
      });
      setFolders(prev => prev.map(f => (f.id === updated.id ? updated : f)));
      setRenamingFolder(false);
      showToast("Folder renamed", "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to rename folder", "error");
    }
  };

  const handleMovePd = async (pdId: number, folderId: number | null) => {
    try {
      const updated = await partDefinitionApi.update(pdId, { folderId });
      setPds(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      showToast("PD moved successfully", "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to move PD", "error");
    }
  };

  const handleGlbUpload = async (pdId: number, file: File) => {
    setUploadingGlb(true);
    try {
      const result = await partDefinitionApi.uploadGlb(pdId, file);
      setPds(prev =>
        prev.map(p => (p.id === pdId ? result.partDefinition : p)),
      );
      showToast("GLB uploaded successfully", "success");
    } catch (e: any) {
      showToast(e.message ?? "GLB upload failed", "error");
    } finally {
      setUploadingGlb(false);
    }
  };

  const handleRemoveGlb = async (pdId: number) => {
    if (!confirm("Remove GLB file?")) return;
    try {
      const result = await partDefinitionApi.removeGlb(pdId);
      setPds(prev =>
        prev.map(p => (p.id === pdId ? result.partDefinition : p)),
      );
      showToast("GLB removed", "success");
    } catch {
      showToast("Failed to remove GLB", "error");
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cpm-header">
          <h2 className="cpm-title">PD Manager</h2>
          <button
            className="cpm-close-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <FiX />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`cpm-toast cpm-toast--${toast.type}`}>
            {toast.type === "success" ? <FiCheck /> : <FiX />}
            {toast.msg}
          </div>
        )}

        {loading ? (
          <div className="cpm-loading">
            <Spinner /> Loading...
          </div>
        ) : (
          <div className="cpm-body">
            {/* LEFT: PD List */}
            <div className="cpm-sidebar">
              <div className="cpm-sidebar-header">
                <span className="cpm-section-label">Part Definitions</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="cpm-add-btn"
                    onClick={() =>
                      setFormOpen({ type: "folder", parentId: null })
                    }
                    title="New Root Folder"
                  >
                    <FiFolderPlus />
                  </button>
                  <button
                    className="cpm-add-btn"
                    onClick={() => setFormOpen({ type: "pd", parentId: null })}
                    title="New root PD"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              {formOpen && (
                <div className="cpm-inline-form">
                  <div
                    style={{
                      fontSize: "1.2rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Creating new {formOpen.type.toUpperCase()}
                    {formOpen.parentId ? " in folder" : " at root"}
                  </div>
                  <input
                    autoFocus
                    className="cpm-input"
                    placeholder={`${formOpen.type === "pd" ? "PD" : "Folder"} name *`}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateSubmit()}
                  />
                  {formOpen.type === "pd" && (
                    <input
                      className="cpm-input"
                      placeholder="Description (optional)"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleCreateSubmit()}
                    />
                  )}
                  <div className="cpm-inline-form-actions">
                    <button
                      className="cpm-btn cpm-btn--ghost"
                      onClick={() => setFormOpen(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="cpm-btn cpm-btn--primary"
                      onClick={handleCreateSubmit}
                      disabled={saving || !newName.trim()}
                    >
                      {saving ? <Spinner /> : "Create"}
                    </button>
                  </div>
                </div>
              )}

              <div className="cpm-list">
                <FolderTree
                  items={pds}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  selectedItemId={selectedPdId}
                  onSelectFolder={id => {
                    setSelectedFolderId(id);
                    setSelectedPdId(null);
                  }}
                  onSelectItem={id => {
                    setSelectedPdId(id);
                    setSelectedFolderId(null);
                  }}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteItem={handleDelete}
                  onCreateSubfolder={parentId =>
                    setFormOpen({ type: "pd", parentId })
                  }
                  renderItemBadge={pd =>
                    pd.glbPath && (
                      <span className="cpm-list-item-badge">
                        📦 {pd.glbPath.split("/").pop()}
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* RIGHT: PD Detail */}
            <div className="cpm-detail">
              {!selectedPd && !selectedFolder ? (
                <div className="cpm-detail-placeholder">
                  <FiPackage size={40} />
                  <p>Select a Folder or Part Definition to view details</p>
                </div>
              ) : selectedFolder ? (
                <>
                  <div className="cpm-detail-section">
                    <div className="cpm-detail-section-header">
                      <span className="cpm-section-label">Folder Details</span>
                    </div>
                    {renamingFolder ? (
                      <div
                        className="cpm-inline-form"
                        style={{ marginTop: "1rem" }}
                      >
                        <input
                          autoFocus
                          className="cpm-input"
                          value={renameFolderValue}
                          onChange={e => setRenameFolderValue(e.target.value)}
                          onKeyDown={e =>
                            e.key === "Enter" && handleRenameFolder()
                          }
                        />
                        <div
                          className="cpm-inline-form-actions"
                          style={{ marginTop: "0.5rem" }}
                        >
                          <button
                            className="cpm-btn cpm-btn--ghost"
                            onClick={() => setRenamingFolder(false)}
                          >
                            Cancel
                          </button>
                          <button
                            className="cpm-btn cpm-btn--primary"
                            onClick={handleRenameFolder}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        <h3
                          className="cpm-detail-cp-name"
                          style={{ margin: 0 }}
                        >
                          {selectedFolder.name}
                        </h3>
                        <button
                          className="cpm-btn cpm-btn--ghost cpm-btn--sm"
                          onClick={() => {
                            setRenameFolderValue(selectedFolder.name);
                            setRenamingFolder(true);
                          }}
                        >
                          Rename
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="cpm-divider" />
                  <div className="cpm-detail-section">
                    <p className="cpm-detail-cp-desc">
                      You can create PDs or subfolders inside this folder by
                      clicking the + icons in the sidebar.
                    </p>
                    <div style={{ marginTop: "1rem" }}>
                      <button
                        className="cpm-btn cpm-btn--primary"
                        onClick={() =>
                          setFormOpen({
                            type: "pd",
                            parentId: selectedFolder.id,
                          })
                        }
                      >
                        <FiPlus /> New PD Here
                      </button>
                      <button
                        className="cpm-btn cpm-btn--ghost"
                        onClick={() =>
                          setFormOpen({
                            type: "folder",
                            parentId: selectedFolder.id,
                          })
                        }
                        style={{ marginLeft: "1rem" }}
                      >
                        <FiFolderPlus /> New Subfolder Here
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                selectedPd && (
                  <>
                    <div className="cpm-detail-section">
                      <div className="cpm-detail-section-header">
                        <span className="cpm-section-label">
                          Part Definition Details
                        </span>
                      </div>
                      {renamingPd ? (
                        <div
                          className="cpm-inline-form"
                          style={{ marginTop: "1rem" }}
                        >
                          <input
                            autoFocus
                            className="cpm-input"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e =>
                              e.key === "Enter" && handleRenamePd()
                            }
                          />
                          <div
                            className="cpm-inline-form-actions"
                            style={{ marginTop: "0.5rem" }}
                          >
                            <button
                              className="cpm-btn cpm-btn--ghost"
                              onClick={() => setRenamingPd(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="cpm-btn cpm-btn--primary"
                              onClick={handleRenamePd}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          <h3
                            className="cpm-detail-cp-name"
                            style={{ margin: 0 }}
                          >
                            {selectedPd.name}
                          </h3>
                          <button
                            className="cpm-btn cpm-btn--ghost cpm-btn--sm"
                            onClick={() => {
                              setRenameValue(selectedPd.name);
                              setRenamingPd(true);
                            }}
                          >
                            Rename
                          </button>
                        </div>
                      )}
                      {selectedPd.description && (
                        <p className="cpm-detail-cp-desc">
                          {selectedPd.description}
                        </p>
                      )}
                      {selectedPd.cps && selectedPd.cps.length > 0 && (
                        <p className="cpm-glb-shared-note">
                          Used by {selectedPd.cps.length} CP(s):{" "}
                          {selectedPd.cps.map(c => c.name).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="cpm-divider" />

                    <div className="cpm-detail-section">
                      <span className="cpm-section-label">Parent Folder</span>
                      <div style={{ marginTop: "0.8rem" }}>
                        <select
                          className="cpm-select"
                          value={selectedPd.folderId ?? ""}
                          onChange={e => {
                            const val = e.target.value;
                            handleMovePd(
                              selectedPd.id,
                              val ? Number(val) : null,
                            );
                          }}
                        >
                          <option value="">— Root Directory —</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="cpm-divider" />

                    {/* GLB section */}
                    <div className="cpm-detail-section">
                      <span className="cpm-section-label">GLB Model</span>

                      <div className="cpm-glb-section">
                        {selectedPd.glbPath ? (
                          <div className="cpm-glb-assigned">
                            <span className="cpm-glb-filename">
                              📦 {selectedPd.glbPath.split("/").pop()}
                            </span>
                            <div className="cpm-glb-actions">
                              <button
                                className="cpm-btn cpm-btn--ghost cpm-btn--sm"
                                onClick={() => glbInputRef.current?.click()}
                                disabled={uploadingGlb}
                              >
                                {uploadingGlb ? (
                                  <Spinner />
                                ) : (
                                  <>
                                    <FiUpload /> Replace
                                  </>
                                )}
                              </button>
                              <button
                                className="cpm-btn cpm-btn--danger cpm-btn--sm"
                                onClick={() => handleRemoveGlb(selectedPd.id)}
                              >
                                <FiTrash2 /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="cpm-glb-upload-btn"
                            onClick={() => glbInputRef.current?.click()}
                            disabled={uploadingGlb}
                          >
                            {uploadingGlb ? (
                              <>
                                <Spinner /> Uploading...
                              </>
                            ) : (
                              <>
                                <FiUpload /> Upload GLB file
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <input
                        ref={glbInputRef}
                        type="file"
                        accept=".glb"
                        style={{ display: "none" }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleGlbUpload(selectedPd.id, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
