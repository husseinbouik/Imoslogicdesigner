import { useState } from "react";
import {
  FiChevronRight,
  FiChevronDown,
  FiFolder,
  FiTrash2,
} from "react-icons/fi";
import type { Folder } from "../../api";

interface FolderTreeProps<
  T extends { id: number; name: string; folderId?: number | null },
> {
  items: T[];
  folders: Folder[];
  selectedFolderId: number | null;
  selectedItemId: number | null;
  onSelectFolder: (id: number | null) => void;
  onSelectItem: (id: number) => void;
  onDeleteFolder: (id: number) => void;
  onDeleteItem: (id: number) => void;
  onCreateSubfolder: (parentId: number | null) => void;
  renderItemBadge?: (item: T) => React.ReactNode;
}

export function FolderTree<
  T extends { id: number; name: string; folderId?: number | null },
>({
  items,
  folders,
  selectedFolderId,
  selectedItemId,
  onSelectFolder,
  onSelectItem,
  onDeleteFolder,
  onDeleteItem,
  onCreateSubfolder,
  renderItemBadge,
}: FolderTreeProps<T>) {
  // Map folders to their children for easy lookup
  const folderChildrenMap = new Map<number | null, Folder[]>();
  folders.forEach(f => {
    const pId = f.parentId;
    if (!folderChildrenMap.has(pId)) folderChildrenMap.set(pId, []);
    folderChildrenMap.get(pId)!.push(f);
  });

  // Map items to their folders
  const itemFolderMap = new Map<number | null, T[]>();
  items.forEach(item => {
    const fId = item.folderId ?? null;
    if (!itemFolderMap.has(fId)) itemFolderMap.set(fId, []);
    itemFolderMap.get(fId)!.push(item);
  });

  // Root level rendering
  return (
    <div className="cpm-folder-tree">
      <div className="cpm-folder-root">
        <FolderNode
          folder={null} // Represents the root
          folderChildrenMap={folderChildrenMap}
          itemFolderMap={itemFolderMap}
          level={0}
          selectedFolderId={selectedFolderId}
          selectedItemId={selectedItemId}
          onSelectFolder={onSelectFolder}
          onSelectItem={onSelectItem}
          onDeleteFolder={onDeleteFolder}
          onDeleteItem={onDeleteItem}
          onCreateSubfolder={onCreateSubfolder}
          renderItemBadge={renderItemBadge}
        />
      </div>
    </div>
  );
}

interface FolderNodeProps<
  T extends { id: number; name: string; folderId?: number | null },
> {
  folder: Folder | null;
  folderChildrenMap: Map<number | null, Folder[]>;
  itemFolderMap: Map<number | null, T[]>;
  level: number;
  selectedFolderId: number | null;
  selectedItemId: number | null;
  onSelectFolder: (id: number | null) => void;
  onSelectItem: (id: number) => void;
  onDeleteFolder: (id: number) => void;
  onDeleteItem: (id: number) => void;
  onCreateSubfolder: (parentId: number | null) => void;
  renderItemBadge?: (item: T) => React.ReactNode;
}

function FolderNode<
  T extends { id: number; name: string; folderId?: number | null },
>({
  folder,
  folderChildrenMap,
  itemFolderMap,
  level,
  selectedFolderId,
  selectedItemId,
  onSelectFolder,
  onSelectItem,
  onDeleteFolder,
  onDeleteItem,
  onCreateSubfolder,
  renderItemBadge,
}: FolderNodeProps<T>) {
  const [expanded, setExpanded] = useState(level === 0 || folder === null); // Root expanded by default
  const isRoot = folder === null;
  const folderId = isRoot ? null : folder!.id;
  const childFolders = folderChildrenMap.get(folderId) || [];
  const childItems = itemFolderMap.get(folderId) || [];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(v => !v);
  };

  const isSelected = selectedFolderId === folderId && !isRoot;
  const indentStr = `${level * 1.6}rem`;

  return (
    <div className="cpm-folder-node">
      {/* Re-using cpm-list-item lightly, but overriding padding for indent */}
      {!isRoot && (
        <div
          className={`cpm-list-item cpm-folder-row ${isSelected ? "cpm-list-item--active" : ""}`}
          style={{ paddingLeft: `calc(1rem + ${indentStr})` }}
          onClick={() => onSelectFolder(folderId)}
        >
          <div className="cpm-folder-toggle" onClick={handleToggle}>
            {childFolders.length > 0 || childItems.length > 0 ? (
              expanded ? (
                <FiChevronDown />
              ) : (
                <FiChevronRight />
              )
            ) : (
              <span style={{ width: "1em", display: "inline-block" }} />
            )}
          </div>
          <FiFolder className="cpm-folder-icon" />
          <span className="cpm-list-item-name">{folder!.name}</span>

          <div className="cpm-folder-actions">
            <button
              className="cpm-icon-btn cpm-icon-btn--danger"
              onClick={e => {
                e.stopPropagation();
                onDeleteFolder(folderId!);
              }}
              title="Delete Folder"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
      )}

      {/* Render children if expanded */}
      {(expanded || isRoot) && (
        <div className="cpm-folder-children">
          {childFolders.map(subfolder => (
            <FolderNode
              key={`folder-${subfolder.id}`}
              folder={subfolder}
              folderChildrenMap={folderChildrenMap}
              itemFolderMap={itemFolderMap}
              level={isRoot ? level : level + 1}
              selectedFolderId={selectedFolderId}
              selectedItemId={selectedItemId}
              onSelectFolder={onSelectFolder}
              onSelectItem={onSelectItem}
              onDeleteFolder={onDeleteFolder}
              onDeleteItem={onDeleteItem}
              onCreateSubfolder={onCreateSubfolder}
              renderItemBadge={renderItemBadge}
            />
          ))}

          {childItems.map(item => (
            <div
              key={`item-${item.id}`}
              className={`cpm-list-item ${selectedItemId === item.id ? "cpm-list-item--active" : ""}`}
              style={{
                paddingLeft: `calc(1.4rem + ${isRoot ? 0 : level + 1} * 1.6rem)`,
              }}
              onClick={() => onSelectItem(item.id)}
            >
              <div className="cpm-list-item-info">
                <span className="cpm-list-item-name">{item.name}</span>
                {renderItemBadge && renderItemBadge(item)}
              </div>
              <button
                className="cpm-icon-btn cpm-icon-btn--danger"
                onClick={e => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title="Delete item"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}

          {/* Empty state for root */}
          {isRoot && childFolders.length === 0 && childItems.length === 0 && (
            <div className="cpm-empty">Empty. Create a folder or item.</div>
          )}
        </div>
      )}
    </div>
  );
}
