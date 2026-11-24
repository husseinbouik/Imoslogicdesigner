import { useState } from "react";
import { FaBox, FaCaretDown } from "react-icons/fa";
import { type ZoneNode, type Selection, type Face } from "../../types/types";
import "./LayersInterface.css";
import { BsInboxesFill } from "react-icons/bs";
import {
  FACE_KEYS_FOR_UI_RENDER,
  FACE_INFO_MAP,
  getPanel,
} from "../../utils/faces";

interface LayerProps {
  node: ZoneNode;
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
  onToggleDefault: (index: string, part: Face) => void;
  onToggleDivision: (index: string) => void;
  onToggleDrawer: (index: string) => void;
  level?: number;
}

function Layer({
  node,
  selection,
  onSelect,
  onToggleDefault,
  onToggleDivision,
  onToggleDrawer,
  level = 0,
}: LayerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isNodeSelected = selection?.index === node.index && !selection.part;
  const hasChildren = node.children && node.children.length > 0;

  // Use the zoneName for display, fallback to index
  const displayName = node.zoneName || node.index || "Root";
  const isDivisionActive = node.division !== undefined;

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <div
        className={`layer-item-main ${isNodeSelected ? "selected" : ""}`}
        onClick={() => onSelect({ index: node.index })}
      >
        <div className="layer-item-content">
          <button
            className={`layer-toggle ${!isExpanded ? "collapsed" : ""}`}
            onClick={e => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <FaCaretDown />
          </button>
          <span className="layer-item-text-main">{displayName}</span>
        </div>
      </div>

      <div className={`layer-children ${!isExpanded ? "collapsed" : ""}`}>
        {/* Iterate using the centrally defined UI render order. */}
        {FACE_KEYS_FOR_UI_RENDER.map(faceKey => {
          const isFaceSelected =
            selection?.index === node.index && selection?.part === faceKey;
          const isFaceActive = getPanel(node, faceKey)?.cpName !== undefined;
          return (
            <div
              key={faceKey}
              className={`layer-item-container ${
                isFaceSelected ? "selected" : ""
              }`}
              onClick={() => onSelect({ index: node.index, part: faceKey })}
            >
              <button
                title={isFaceActive ? "Deactivate panel" : "Activate panel"}
                onClick={e => {
                  e.stopPropagation();
                  onToggleDefault(node.index, faceKey);
                }}
                className={`apply-default-btn ${isFaceActive ? "active" : ""}`}
              >
                <FaBox />
              </button>
              <div className="layer-item-text">
                {FACE_INFO_MAP.get(faceKey)!.name}
              </div>
            </div>
          );
        })}

        <div
          className={`layer-item-container ${
            selection?.index === node.index && selection?.part === "drawer"
              ? "selected"
              : ""
          }`}
          onClick={() => onSelect({ index: node.index, part: "drawer" })}
        >
          <button
            title={node.drawer ? "Deactivate drawer" : "Activate drawer"}
            onClick={e => {
              e.stopPropagation();
              onToggleDrawer(node.index);
            }}
            className={`apply-default-btn ${node.drawer ? "active" : ""}`}
          >
            <BsInboxesFill />
          </button>
          <div className="layer-item-text">Drawer</div>
        </div>

        <div
          className={`layer-item-container ${
            selection?.index === node.index && selection?.part === "division"
              ? "selected"
              : ""
          }`}
          onClick={() => onSelect({ index: node.index, part: "division" })}
        >
          <button
            title={
              isDivisionActive ? "Deactivate division" : "Activate division"
            }
            onClick={e => {
              e.stopPropagation();
              onToggleDivision(node.index);
            }}
            className={`apply-default-btn ${isDivisionActive ? "active" : ""}`}
          >
            <BsInboxesFill />
          </button>
          <div className="layer-item-text">Division</div>
        </div>

        {hasChildren && (
          <div className="layer-children-nested">
            {/* THIS IS THE CHANGE: Create a reversed copy of the children array for rendering */}
            {[...node.children!].reverse().map((child, i) => (
              <Layer
                key={i}
                node={child}
                selection={selection}
                onSelect={onSelect}
                onToggleDefault={onToggleDefault}
                onToggleDivision={onToggleDivision}
                onToggleDrawer={onToggleDrawer}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LayersInterfaceProps {
  data: ZoneNode;
  selection: Selection | null;
  onSelect: (selection: Selection) => void;
  onToggleDefault: (index: string, part: Face) => void;
  onToggleDivision: (index: string) => void;
  onToggleDrawer: (index: string) => void;
}

export function LayersInterface({
  data,
  selection,
  onSelect,
  onToggleDefault,
  onToggleDivision,
  onToggleDrawer,
}: LayersInterfaceProps) {
  return (
    <div className="layers-interface-container">
      <div className="layers-header">Layers</div>
      <div className="layers-body">
        <Layer
          node={data}
          selection={selection}
          onSelect={onSelect}
          onToggleDefault={onToggleDefault}
          onToggleDivision={onToggleDivision}
          onToggleDrawer={onToggleDrawer}
        />
      </div>
    </div>
  );
}
