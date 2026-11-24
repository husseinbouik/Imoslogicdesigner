import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-perf";
import Zone from "./lib/components/zoning";
import { Suspense, useMemo } from "react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { SceneProvider, SceneCapture, ExportButton } from "r3f-glb-exporter";
import { JsonInterface } from "./lib/components/ui/JsonInterface";
import { LayersInterface } from "./lib/components/ui/LayersInterface";
import { Configurator } from "./lib/components/configurator/Configurator";
import { ZoneInfo } from "./lib/components/ui/ZoneInfo";
import { RootDimensionEditor } from "./lib/components/ui/RootDimensionEditor";
import { WireframeToggle } from "./lib/components/ui/WireframeToggle";
import { PanelHeader } from "./lib/components/ui/PanelHeader";
import { CPManager } from "./lib/components/ui/CPManager";
import { PDManager } from "./lib/components/ui/PDManager";
import { GlbModel } from "./lib/components/zoning/GlbModel";
import { PiExportBold } from "react-icons/pi";
import { BiImport } from "react-icons/bi";
import { FiSun, FiMoon, FiGrid, FiPackage, FiBox } from "react-icons/fi";
import { useZoningLogic } from "./lib/hooks/useZoningLogic";
import { useTheme } from "./lib/hooks/useTheme";
import { useCPs } from "./lib/hooks/useCPs";
import { useState } from "react";
import type { cpNameDataData } from "./lib/types/types";

function App() {
  const {
    data,
    setData,
    selection,
    rootCalculatedDims,
    rawSelectedNode,
    displaySelectedNode,
    isRootSelected,
    handleSelect,
    handleNodeChange,
    handleToggleFaceStyle,
    handleToggleDivision,
    handleToggleDrawer,
    handleRootDimensionChange,
  } = useZoningLogic();

  const { theme, toggleTheme } = useTheme();
  const { cps } = useCPs();

  const [areWireframesVisible, setAreWireframesVisible] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCPManagerOpen, setIsCPManagerOpen] = useState(false);
  const [isPDManagerOpen, setIsPDManagerOpen] = useState(false);

  /**
   * Build the cpNameData map from live CPs.
   * For each CP that has a PartDefinition with a GLB file, we create a stable
   * React component (via useMemo) that renders the GLB inside the zone.
   * CPs without a GLB are omitted — the zone falls back to its default box render.
   */
  const cpNameData = useMemo(() => {
    const map: Record<string, cpNameDataData> = {};
    for (const cp of cps) {
      if (cp.partDefinition?.glbPath) {
        const glbUrl = `/uploads/${cp.partDefinition.glbPath}`;
        // Create a stable named component for this CP so React can reconcile properly
        const CpComponent: cpNameDataData = props => (
          <GlbModel {...props} glbUrl={glbUrl} />
        );
        map[cp.name] = CpComponent;
      }
    }
    return map;
  }, [cps]);

  return (
    <SceneProvider>
      <JsonInterface data={data} onDataChange={setData}>
        {({ handleImport, handleExport }) => (
          <div id="app-container">
            {isCPManagerOpen && (
              <CPManager onClose={() => setIsCPManagerOpen(false)} />
            )}
            {isPDManagerOpen && (
              <PDManager onClose={() => setIsPDManagerOpen(false)} />
            )}
            <div
              className={`left-ui-panel ${isPanelCollapsed ? "collapsed" : ""}`}
            >
              <PanelHeader
                isCollapsed={isPanelCollapsed}
                onToggle={() => setIsPanelCollapsed(prev => !prev)}
                isWireframeVisible={areWireframesVisible}
                onWireframeToggle={() => setAreWireframesVisible(prev => !prev)}
                onImport={handleImport}
                onExport={handleExport}
                theme={theme}
                onThemeToggle={toggleTheme}
                isCPManagerOpen={isCPManagerOpen}
                isPDManagerOpen={isPDManagerOpen}
                onOpenCPManager={() => {
                  setIsCPManagerOpen(v => !v);
                  setIsPDManagerOpen(false);
                }}
                onOpenPDManager={() => {
                  setIsPDManagerOpen(v => !v);
                  setIsCPManagerOpen(false);
                }}
              />
              <div className="panel-content-wrapper">
                <PanelGroup direction="vertical">
                  <Panel defaultSize={10} minSize={10} collapsible>
                    <RootDimensionEditor
                      length={data.root.length ?? 0}
                      height={data.root.height ?? 0}
                      depth={data.root.depth ?? 0}
                      onDimensionsChange={handleRootDimensionChange}
                    />
                  </Panel>
                  <PanelResizeHandle>
                    <div className="resize-handle-container">
                      <svg width="24" height="6" viewBox="0 0 24 6" fill="none">
                        <circle cx="3" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="9" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="15" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="21" cy="3" r="1.5" fill="#adb5bd" />
                      </svg>
                    </div>
                  </PanelResizeHandle>
                  <Panel defaultSize={45} minSize={20}>
                    <LayersInterface
                      data={data.root}
                      selection={selection}
                      onSelect={handleSelect}
                      onToggleDefault={handleToggleFaceStyle}
                      onToggleDivision={handleToggleDivision}
                      onToggleDrawer={handleToggleDrawer}
                    />
                  </Panel>
                  <PanelResizeHandle>
                    <div className="resize-handle-container">
                      <svg width="24" height="6" viewBox="0 0 24 6" fill="none">
                        <circle cx="3" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="9" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="15" cy="3" r="1.5" fill="#adb5bd" />
                        <circle cx="21" cy="3" r="1.5" fill="#adb5bd" />
                      </svg>
                    </div>
                  </PanelResizeHandle>
                  <Panel defaultSize={45} minSize={20}>
                    <Configurator
                      selection={selection}
                      selectedNode={rawSelectedNode}
                      displayNode={displaySelectedNode}
                      onNodeChange={handleNodeChange}
                      isRoot={isRootSelected}
                    />
                  </Panel>
                </PanelGroup>
              </div>
              <div className="panel-footer">
                {/* Left group — always visible */}
                <div className="panel-footer-left">
                  {!isPanelCollapsed && (
                    <>
                      <WireframeToggle
                        isVisible={areWireframesVisible}
                        onToggle={() => setAreWireframesVisible(prev => !prev)}
                      />
                      <button
                        className="footer-btn"
                        onClick={toggleTheme}
                        title={
                          theme === "light"
                            ? "Switch to Dark Mode"
                            : "Switch to Light Mode"
                        }
                      >
                        {theme === "light" ? <FiMoon /> : <FiSun />}
                      </button>
                      <button
                        className="footer-btn"
                        onClick={handleExport}
                        title="Export JSON"
                      >
                        <PiExportBold />
                      </button>

                      <label className="footer-btn" title="Import JSON">
                        <BiImport />
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          style={{ display: "none" }}
                        />
                      </label>
                      <ExportButton
                        filename="my-model"
                        className="footer-btn"
                        title="Export GLB"
                      >
                        <FiBox />
                      </ExportButton>
                    </>
                  )}
                </div>

                {/* Right group — always visible */}
                <div className="panel-footer-right">
                  <button
                    className={`footer-btn ${isCPManagerOpen ? "active" : ""}`}
                    onClick={() => {
                      setIsCPManagerOpen(v => !v);
                      setIsPDManagerOpen(false);
                    }}
                    title="CP Manager"
                  >
                    <FiGrid />
                  </button>
                  <button
                    className={`footer-btn ${isPDManagerOpen ? "active" : ""}`}
                    onClick={() => {
                      setIsPDManagerOpen(v => !v);
                      setIsCPManagerOpen(false);
                    }}
                    title="PD Manager"
                  >
                    <FiPackage />
                  </button>
                </div>
              </div>
            </div>

            <ZoneInfo
              selectedNode={displaySelectedNode}
              rawSelectedNode={rawSelectedNode}
            />

            <div id="canvas">
              <Canvas camera={{ position: [0, 0.5, 1.5], fov: 50 }} shadows>
                <SceneCapture />
                <ambientLight intensity={1.5} />
                <directionalLight
                  position={[1, 1, 1]}
                  intensity={1.5}
                  castShadow
                />
                <Suspense fallback={null}>
                  <Zone
                    node={data.root}
                    length={rootCalculatedDims.length}
                    height={rootCalculatedDims.height}
                    depth={rootCalculatedDims.depth}
                    partition={data.root.partition}
                    divisionData={data.divisionData}
                    formData={data.formData}
                    cpNameData={cpNameData}
                    selectedZone={selection?.index}
                    selectedPart={selection?.part}
                    onSelect={handleSelect}
                    areWireframesVisible={areWireframesVisible}
                    rootNode={data.root}
                  />
                </Suspense>
                <OrbitControls />
                <Perf position="bottom-right" />
              </Canvas>
            </div>
          </div>
        )}
      </JsonInterface>
    </SceneProvider>
  );
}

export default App;
