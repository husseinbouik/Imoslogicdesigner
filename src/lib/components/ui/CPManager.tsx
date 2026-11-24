import { useState, useEffect, useCallback } from "react";
import {
  cpApi,
  partDefinitionApi,
  folderApi,
  type CP,
  type PartDefinition,
  type Folder,
} from "../../api";
import "./CPManager.css";
import "./FolderTree.css";
import { FolderTree } from "./FolderTree";
import { FiPlus, FiX, FiCheck, FiEdit2, FiFolderPlus } from "react-icons/fi";

function Spinner() {
  return <div className="cpm-spinner" />;
}

interface CPManagerProps {
  onClose: () => void;
}

export function CPManager({ onClose }: CPManagerProps) {
  const [cps, setCps] = useState<CP[]>([]);
  const [pds, setPds] = useState<PartDefinition[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [selectedCpId, setSelectedCpId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New CP/Folder form
  const [formOpen, setFormOpen] = useState<{
    type: "cp" | "folder";
    parentId: number | null;
  } | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Rename CP/Folder (inline in detail pane)
  const [renamingCp, setRenamingCp] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [renameFolderValue, setRenameFolderValue] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const selectedCp = cps.find(c => c.id === selectedCpId) ?? null;
  const selectedFolder = folders.find(f => f.id === selectedFolderId) ?? null;

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cpList, pdList, folderList] = await Promise.all([
        cpApi.getAll(),
        partDefinitionApi.getAll(),
        folderApi.getAll("CP"),
      ]);
      setCps(cpList);
      setPds(pdList);
      setFolders(folderList);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
    // showToast is stable (defined before)
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

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCreateCp = async (parentId: number | null) => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const cp = await cpApi.create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        folderId: parentId,
      });
      setCps(prev => [...prev, cp]);
      setNewName("");
      setNewDesc("");
      setFormOpen(null);
      setSelectedCpId(cp.id);
      setSelectedFolderId(null);
      showToast(`CP "${cp.name}" created`, "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to create CP", "error");
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
        type: "CP",
        parentId,
      });
      setFolders(prev => [...prev, folder]);
      setNewName("");
      setFormOpen(null);
      setSelectedFolderId(folder.id);
      setSelectedCpId(null);
      showToast(`Folder created`, "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to create folder", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = () => {
    if (formOpen?.type === "cp") handleCreateCp(formOpen.parentId);
    else if (formOpen?.type === "folder") handleCreateFolder(formOpen.parentId);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this CP?")) return;
    try {
      await cpApi.delete(id);
      setCps(prev => prev.filter(c => c.id !== id));
      if (selectedCpId === id) setSelectedCpId(null);
      showToast("CP deleted", "success");
    } catch {
      showToast("Failed to delete CP", "error");
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (
      !confirm(
        "Delete this folder? CPs inside will move to root. Subfolders will be deleted.",
      )
    )
      return;
    try {
      await folderApi.delete(id);
      fetchAll();
      if (selectedFolderId === id) setSelectedFolderId(null);
      showToast("Folder deleted", "success");
    } catch {
      showToast("Failed to delete folder", "error");
    }
  };

  const handleRenameCp = async () => {
    if (!selectedCp || !renameValue.trim()) return;
    try {
      const updated = await cpApi.update(selectedCp.id, {
        name: renameValue.trim(),
      });
      setCps(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      setRenamingCp(false);
      showToast("CP renamed", "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to rename CP", "error");
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

  const handleMoveCp = async (cpId: number, folderId: number | null) => {
    try {
      const updated = await cpApi.update(cpId, { folderId });
      setCps(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      showToast("CP moved successfully", "success");
    } catch (e: any) {
      showToast(e.message ?? "Failed to move CP", "error");
    }
  };

  const handleAssignPd = async (cpId: number, pdId: number | null) => {
    try {
      const updated = await cpApi.assignPartDefinition(cpId, pdId);
      setCps(prev => prev.map(c => (c.id === cpId ? updated : c)));
      showToast(pdId ? "PD assigned" : "PD unassigned", "success");
    } catch {
      showToast("Failed to assign PD", "error");
    }
  };

  return (
    <div className="cpm-overlay" onClick={onClose}>
      <div className="cpm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cpm-header">
          <h2 className="cpm-title">CP Manager</h2>
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
            {/* LEFT: CP List */}
            <div className="cpm-sidebar">
              <div className="cpm-sidebar-header">
                <span className="cpm-section-label">Custom Parts</span>
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
                    onClick={() => setFormOpen({ type: "cp", parentId: null })}
                    title="New Root CP"
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
                    placeholder={`${formOpen.type === "cp" ? "CP" : "Folder"} name *`}
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateSubmit()}
                  />
                  {formOpen.type === "cp" && (
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
                  items={cps}
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  selectedItemId={selectedCpId}
                  onSelectFolder={id => {
                    setSelectedFolderId(id);
                    setSelectedCpId(null);
                  }}
                  onSelectItem={id => {
                    setSelectedCpId(id);
                    setSelectedFolderId(null);
                  }}
                  onDeleteFolder={handleDeleteFolder}
                  onDeleteItem={handleDelete}
                  onCreateSubfolder={parentId =>
                    setFormOpen({ type: "cp", parentId })
                  }
                  renderItemBadge={cp =>
                    cp.partDefinition && (
                      <span className="cpm-list-item-badge">
                        {cp.partDefinition.name}
                      </span>
                    )
                  }
                />
              </div>
            </div>

            {/* RIGHT: CP Detail */}
            <div className="cpm-detail">
              {!selectedCp && !selectedFolder ? (
                <div className="cpm-detail-placeholder">
                  <FiEdit2 size={40} />
                  <p>Select a Folder or CP to view its details</p>
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
                      You can create CPs or subfolders inside this folder by
                      clicking the + icons in the sidebar.
                    </p>
                    <div style={{ marginTop: "1rem" }}>
                      <button
                        className="cpm-btn cpm-btn--primary"
                        onClick={() =>
                          setFormOpen({
                            type: "cp",
                            parentId: selectedFolder.id,
                          })
                        }
                      >
                        <FiPlus /> New CP Here
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
                selectedCp && (
                  <>
                    <div className="cpm-detail-section">
                      <div className="cpm-detail-section-header">
                        <span className="cpm-section-label">CP Details</span>
                      </div>
                      {renamingCp ? (
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
                              e.key === "Enter" && handleRenameCp()
                            }
                          />
                          <div
                            className="cpm-inline-form-actions"
                            style={{ marginTop: "0.5rem" }}
                          >
                            <button
                              className="cpm-btn cpm-btn--ghost"
                              onClick={() => setRenamingCp(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="cpm-btn cpm-btn--primary"
                              onClick={handleRenameCp}
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
                            {selectedCp.name}
                          </h3>
                          <button
                            className="cpm-btn cpm-btn--ghost cpm-btn--sm"
                            onClick={() => {
                              setRenameValue(selectedCp.name);
                              setRenamingCp(true);
                            }}
                          >
                            Rename
                          </button>
                        </div>
                      )}
                      {selectedCp.description && (
                        <p className="cpm-detail-cp-desc">
                          {selectedCp.description}
                        </p>
                      )}
                    </div>

                    <div className="cpm-divider" />

                    <div className="cpm-detail-section">
                      <span className="cpm-section-label">Parent Folder</span>
                      <div style={{ marginTop: "0.8rem" }}>
                        <select
                          className="cpm-select"
                          value={selectedCp.folderId ?? ""}
                          onChange={e => {
                            const val = e.target.value;
                            handleMoveCp(
                              selectedCp.id,
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

                    {/* PD Assignment */}
                    <div className="cpm-detail-section">
                      <div className="cpm-detail-section-header">
                        <span className="cpm-section-label">
                          Part Definition
                        </span>
                      </div>
                      <p
                        className="cpm-detail-cp-desc"
                        style={{ marginBottom: "0.8rem" }}
                      >
                        Select a PD to assign to this CP. Manage PDs via the PD
                        Manager (<strong>PD icon</strong> in the footer).
                      </p>
                      <select
                        className="cpm-select"
                        value={selectedCp.partDefinitionId ?? ""}
                        onChange={e => {
                          const val = e.target.value;
                          handleAssignPd(
                            selectedCp.id,
                            val ? Number(val) : null,
                          );
                        }}
                      >
                        <option value="">— None —</option>
                        {pds.map(pd => (
                          <option key={pd.id} value={pd.id}>
                            {pd.name}
                            {pd.glbPath ? " ✓ GLB" : " (no GLB)"}
                          </option>
                        ))}
                      </select>

                      {/* Show assigned PD info */}
                      {selectedCp.partDefinition && (
                        <div className="cpm-pd-info">
                          <span className="cpm-field-label">Assigned PD</span>
                          <div
                            className="cpm-glb-assigned"
                            style={{ marginTop: "0.8rem" }}
                          >
                            <div>
                              <div className="cpm-list-item-name">
                                {selectedCp.partDefinition.name}
                              </div>
                              {selectedCp.partDefinition.glbPath ? (
                                <div className="cpm-list-item-badge">
                                  📦{" "}
                                  {selectedCp.partDefinition.glbPath
                                    .split("/")
                                    .pop()}
                                </div>
                              ) : (
                                <div
                                  className="cpm-list-item-badge"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  No GLB — open PD Manager to upload
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
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
