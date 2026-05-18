import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { GROUP_COLORS } from '../hooks/useGraphData';

cytoscape.use(dagre);

const CY_STYLE = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'color': '#fff',
      'font-size': '13px',
      'font-weight': '600',
      'width': 44,
      'height': 44,
      'border-width': 2,
      'border-color': '#fff',
      'text-outline-width': 1,
      'text-outline-color': 'data(color)',
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 2,
      'line-color': '#888',
      'target-arrow-color': '#888',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'label': 'data(label)',
      'font-size': '12px',
      'font-weight': '600',
      'color': '#333',
      'text-background-color': '#fff',
      'text-background-opacity': 0.85,
      'text-background-padding': '3px',
      'text-background-shape': 'roundrectangle',
    },
  },
  {
    selector: 'edge[edgeType="suffix_link"]',
    style: {
      'line-style': 'dashed',
      'line-color': '#e74c3c',
      'target-arrow-color': '#e74c3c',
      'width': 2,
      'target-arrow-shape': 'triangle',
    },
  },
  {
    selector: 'edge[edgeType="transition"]',
    style: {
      'line-style': 'solid',
      'line-color': '#333',
      'target-arrow-color': '#333',
      'width': 2,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 3,
      'border-color': '#333',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#e74c3c',
      'target-arrow-color': '#e74c3c',
      'width': 5,
    },
  },
];

function buildElements(nodes, edges) {
  const cyNodes = nodes.map(n => ({
    group: 'nodes',
    data: {
      id: n.id,
      label: n.label || n.id,
      color: GROUP_COLORS[n.group] || GROUP_COLORS['默认'],
      group: n.group,
    },
  }));

  const cyEdges = edges.map(e => ({
    group: 'edges',
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      weight: e.weight,
      label: e.label !== undefined ? e.label : String(e.weight),
      edgeType: e.edgeType || 'default',
    },
  }));

  return [...cyNodes, ...cyEdges];
}

export default function GraphCanvas({
  cyRef,
  nodes,
  edges,
  onDeleteNode,
  onDeleteEdge,
  onUpdateNode,
  onUpdateEdge,
}) {
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  const initCy = useCallback(() => {
    if (!containerRef.current || cyRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: CY_STYLE,
      layout: { name: 'grid' },
      wheelSensitivity: 0.3,
      minZoom: 0.1,
      maxZoom: 5,
    });

    cy.on('tap', 'node', evt => {
      const node = evt.target;
      setSelected({ type: 'node', id: node.id() });
      setEditForm({
        label: node.data('label'),
        group: node.data('group'),
      });
    });

    cy.on('tap', 'edge', evt => {
      const edge = evt.target;
      setSelected({ type: 'edge', id: edge.id() });
      setEditForm({
        weight: edge.data('weight'),
        label: edge.data('label'),
        edgeType: edge.data('edgeType'),
        source: edge.data('source'),
        target: edge.data('target'),
      });
    });

    cy.on('tap', evt => {
      if (evt.target === cy) {
        setSelected(null);
      }
    });

    cyRef.current = cy;
  }, [cyRef]);

  useEffect(() => {
    initCy();
  }, [initCy]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const els = buildElements(nodes, edges);
    cy.batch(() => {
      cy.elements().remove();
      cy.add(els);
    });

    if (els.length > 0 && nodes.length > 0) {
      setTimeout(() => {
        cy.layout({ name: 'dagre', rankDir: 'LR', spacingFactor: 1.3 }).run();
      }, 50);
    }
  }, [nodes, edges, cyRef]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selected) return;
    if (selected.type === 'node') {
      onUpdateNode(selected.id, {
        label: editForm.label || selected.id,
        group: editForm.group || '默认',
      });
    } else {
      onUpdateEdge(selected.id, {
        weight: Number(editForm.weight) || 1,
        label: editForm.label,
      });
    }
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    if (selected.type === 'node') {
      onDeleteNode(selected.id);
    } else {
      onDeleteEdge(selected.id);
    }
    setSelected(null);
  };

  return (
    <div className="graph-container">
      <div ref={containerRef} />

      {selected && (
        <div className="edit-popup" style={{ top: 12, right: 12 }}>
          <h4>{selected.type === 'node' ? '编辑节点' : '编辑边'}</h4>
          <form onSubmit={handleEditSubmit}>
            {selected.type === 'node' ? (
              <>
                <div className="form-group">
                  <label>ID</label>
                  <input value={selected.id} disabled style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label>标签</label>
                  <input
                    value={editForm.label}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>分组</label>
                  <select
                    value={editForm.group}
                    onChange={e => setEditForm(f => ({ ...f, group: e.target.value }))}
                  >
                    {Object.keys(GROUP_COLORS).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>起点 -&gt; 终点</label>
                  <input
                    value={`${editForm.source} -> ${editForm.target}`}
                    disabled
                    style={{ background: '#f5f5f5' }}
                  />
                </div>
                <div className="form-group">
                  <label>标签</label>
                  <input
                    value={editForm.label || ''}
                    onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>权重</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.weight}
                    onChange={e => setEditForm(f => ({ ...f, weight: e.target.value }))}
                  />
                </div>
              </>
            )}
            <div className="btn-row">
              <button type="submit" className="btn btn-primary btn-sm">保存</button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelected(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
              >
                删除
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
