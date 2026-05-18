import { useState, useRef, useCallback } from 'react';

export const GROUP_COLORS = {
  '初始': '#2ECC71',
  '终止': '#E74C3C',
  '克隆': '#F39C12',
  '默认': '#4B9CD3',
  '组A': '#E74C3C',
  '组B': '#2ECC71',
  '组C': '#F39C12',
  '组D': '#9B59B6',
};

let nodeCounter = 0;
let edgeCounter = 0;

export function useGraphData() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const cyRef = useRef(null);

  const addNode = useCallback((id, label, group = '默认') => {
    const nodeId = id || `n${++nodeCounter}`;
    setNodes(prev => {
      if (prev.find(n => n.id === nodeId)) return prev;
      return [...prev, { id: nodeId, label: label || nodeId, group }];
    });
    return nodeId;
  }, []);

  const addEdge = useCallback((source, target, weight = 1, label, edgeType) => {
    const edgeId = `e${++edgeCounter}`;
    setEdges(prev => {
      if (prev.find(e => e.source === source && e.target === target && e.edgeType === edgeType)) return prev;
      return [...prev, {
        id: edgeId,
        source,
        target,
        weight: Number(weight) || 1,
        label: label !== undefined ? String(label) : String(weight),
        edgeType: edgeType || 'default',
      }];
    });
    return edgeId;
  }, []);

  const deleteNode = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
  }, []);

  const deleteEdge = useCallback((id) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateNode = useCallback((id, updates) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const updateEdge = useCallback((id, updates) => {
    setEdges(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const clearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  const importData = useCallback((data) => {
    if (!data || typeof data !== 'object') return false;
    const newNodes = (data.nodes || [])
      .filter(n => n.id)
      .map(n => ({
        id: n.id,
        label: n.label || n.id,
        group: n.group || '默认',
      }));
    const newEdges = (data.edges || [])
      .filter(e => e.source && e.target)
      .map((e, i) => ({
        id: e.id || `e${++edgeCounter}`,
        source: e.source,
        target: e.target,
        weight: Number(e.weight) ?? 1,
        label: e.label !== undefined ? String(e.label) : String(Number(e.weight) ?? 1),
        edgeType: e.edgeType || 'default',
      }));

    setNodes(newNodes);
    setEdges(newEdges);
    return true;
  }, []);

  return {
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
  };
}
