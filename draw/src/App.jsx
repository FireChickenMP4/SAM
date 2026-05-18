import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGraphData } from './hooks/useGraphData';
import { SAM } from './utils/sam';
import InputPanel from './components/InputPanel';
import GraphCanvas from './components/GraphCanvas';
import Toolbar from './components/Toolbar';
import SamInfoPanel from './components/SamInfoPanel';

export default function App() {
  const {
    nodes,
    edges,
    cyRef,
    addNode,
    addEdge,
    deleteNode,
    deleteEdge,
    updateNode,
    updateEdge,
    clearAll,
    importData,
  } = useGraphData();

  const [samView, setSamView] = useState('combined');
  const [samLabelFormat, setSamLabelFormat] = useState('len');
  const [samData, setSamData] = useState(null);
  const autoLoaded = useRef(false);
  const pendingPositions = useRef(null);

  const handleBuildSAM = useCallback((s, format = 'len') => {
    const cy = cyRef.current;
    if (cy) {
      const pos = {};
      cy.nodes().forEach(n => { pos[n.id()] = n.position(); });
      pendingPositions.current = pos;
    }

    const sam = new SAM();
    sam.build(s);
    const { nodes: samNodes, transEdges, linkEdges } = sam.toGraphData(format);

    setSamData({ sam, input: s });
    setSamView('combined');
    setSamLabelFormat(format);

    importData({
      nodes: samNodes,
      edges: [...transEdges, ...linkEdges],
    });
  }, [importData, cyRef]);

  const handleExtendSAM = useCallback((chars) => {
    if (!samData || !samData.sam) return;

    const cy = cyRef.current;
    if (cy) {
      const pos = {};
      cy.nodes().forEach(n => { pos[n.id()] = n.position(); });
      pendingPositions.current = pos;
    }

    const sam = samData.sam;
    for (const ch of chars) {
      sam.extend(ch);
    }
    const newInput = samData.input + chars;
    const { nodes: samNodes, transEdges, linkEdges } = sam.toGraphData(samLabelFormat);

    setSamData({ sam, input: newInput });
    importData({
      nodes: samNodes,
      edges: [...transEdges, ...linkEdges],
    });
  }, [samData, samLabelFormat, importData, cyRef]);

  const handleImport = useCallback((data) => {
    const isSamFormat = !!(data.transEdges || data.linkEdges);

    if (isSamFormat && data.input) {
      handleBuildSAM(data.input);
      return true;
    }

    if (isSamFormat) {
      importData({
        nodes: data.nodes || [],
        edges: [...(data.transEdges || []), ...(data.linkEdges || [])],
      });
      setSamData({ sam: null, input: data.input || null });
      setSamView('combined');
      return true;
    }

    setSamData(null);
    return importData(data);
  }, [importData, handleBuildSAM]);

  const handleToggleLabelFormat = useCallback(() => {
    if (!samData || !samData.sam) return;
    const nextFormat = samLabelFormat === 'len' ? 'string' : 'len';
    setSamLabelFormat(nextFormat);
    const { nodes: samNodes, transEdges, linkEdges } = samData.sam.toGraphData(nextFormat);
    importData({
      nodes: samNodes,
      edges: [...transEdges, ...linkEdges],
    });
  }, [samData, samLabelFormat, importData]);

  useEffect(() => {
    if (autoLoaded.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sam') !== null) {
      autoLoaded.current = true;
      fetch('/sam_data.json')
        .then(r => {
          if (!r.ok) throw new Error('not found');
          return r.json();
        })
        .then(data => {
          if (data.input) {
            handleBuildSAM(data.input);
          } else if (data.nodes && (data.transEdges || data.linkEdges)) {
            importData({
              nodes: data.nodes,
              edges: [...(data.transEdges || []), ...(data.linkEdges || [])],
            });
          }
        })
        .catch(() => {});
    }
  }, [handleBuildSAM, importData]);

  const handleClear = useCallback(() => {
    clearAll();
    setSamData(null);
  }, [clearAll]);

  const displayEdges = useMemo(() => {
    if (!samData) return edges;
    if (samView === 'combined') return edges;
    return edges.filter(e => e.edgeType === samView);
  }, [edges, samData, samView]);

  const getCy = useCallback(() => cyRef.current, [cyRef]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2 className="sidebar-title">有向图编辑器</h2>
        <InputPanel
          nodes={nodes}
          edges={edges}
          onAddNode={addNode}
          onAddEdge={addEdge}
          onImport={handleImport}
          onBuildSAM={handleBuildSAM}
          samActive={!!samData}
          samInputStr={samData?.input}
          onExtendSAM={handleExtendSAM}
        />
        {samData && <SamInfoPanel samData={samData} />}
      </div>
      <div className="main-area">
        <Toolbar
          getCy={getCy}
          graphData={{ nodes, edges }}
          onClear={handleClear}
          samData={samData}
          samView={samView}
          onSamViewChange={setSamView}
          samLabelFormat={samLabelFormat}
          onToggleLabelFormat={handleToggleLabelFormat}
        />
        <GraphCanvas
          cyRef={cyRef}
          nodes={nodes}
          edges={displayEdges}
          onDeleteNode={deleteNode}
          onDeleteEdge={deleteEdge}
          onUpdateNode={updateNode}
          onUpdateEdge={updateEdge}
          pendingPositions={pendingPositions}
        />
      </div>
    </div>
  );
}
