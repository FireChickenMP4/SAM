import { useState } from 'react';
import { GROUP_COLORS } from '../hooks/useGraphData';

export default function InputPanel({ nodes, edges, onAddNode, onAddEdge, onImport, onBuildSAM }) {
  const [nodeId, setNodeId] = useState('');
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeGroup, setNodeGroup] = useState('默认');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('1');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [samInput, setSamInput] = useState('');

  const handleAddNode = () => {
    const label = nodeLabel.trim() || nodeId.trim();
    const id = nodeId.trim();
    if (!id && !label) return;
    onAddNode(id, label, nodeGroup);
    setNodeId('');
    setNodeLabel('');
  };

  const handleAddEdge = () => {
    if (!edgeSource || !edgeTarget) return;
    onAddEdge(edgeSource, edgeTarget, edgeWeight || '1');
    setEdgeWeight('1');
  };

  const handleImport = () => {
    setJsonError('');
    try {
      const data = JSON.parse(jsonText);
      const ok = onImport(data);
      if (ok) setJsonText('');
      else setJsonError('JSON 格式错误: 需要 {nodes: [...], edges: [...]}');
    } catch (e) {
      setJsonError('JSON 解析失败: ' + e.message);
    }
  };

  const handleLoadSample = () => {
    const sample = {
      nodes: [
        { id: 'A', label: '入口', group: '默认' },
        { id: 'B', label: '处理', group: '组A' },
        { id: 'C', label: '判断', group: '组B' },
        { id: 'D', label: '输出', group: '组C' },
        { id: 'E', label: '结束', group: '默认' },
      ],
      edges: [
        { source: 'A', target: 'B', weight: 3 },
        { source: 'A', target: 'C', weight: 8 },
        { source: 'B', target: 'D', weight: 5 },
        { source: 'C', target: 'D', weight: 2 },
        { source: 'C', target: 'E', weight: 7 },
        { source: 'D', target: 'E', weight: 4 },
      ],
    };
    setJsonText(JSON.stringify(sample, null, 2));
  };

  const handleBuildSAM = () => {
    const s = samInput.trim();
    if (!s) return;
    onBuildSAM(s);
  };

  return (
    <div className="panel-content">
      {/* SAM Builder Section */}
      <div className="panel-section sam-builder">
        <h3>SAM 自动机构建</h3>
        <div className="form-group">
          <input
            className="sam-input"
            value={samInput}
            onChange={e => setSamInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuildSAM()}
            placeholder="输入字符串，如 ababc"
          />
        </div>
        <div className="form-row" style={{ gap: 6 }}>
          <button className="btn btn-primary btn-block" onClick={handleBuildSAM}>
            构建 SAM
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => { setSamInput('ababc'); onBuildSAM('ababc'); }}>
            示例
          </button>
        </div>
      </div>

      {/* Node Section */}
      <div className="panel-section">
        <h3>添加节点</h3>
        <div className="form-group">
          <label>节点ID</label>
          <input
            value={nodeId}
            onChange={e => setNodeId(e.target.value)}
            placeholder="如 A, start (留空自动生成)"
          />
        </div>
        <div className="form-group">
          <label>显示标签</label>
          <input
            value={nodeLabel}
            onChange={e => setNodeLabel(e.target.value)}
            placeholder="如 入口节点"
          />
        </div>
        <div className="form-group">
          <label>分组</label>
          <select value={nodeGroup} onChange={e => setNodeGroup(e.target.value)}>
            {Object.keys(GROUP_COLORS).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleAddNode}>
          添加节点
        </button>
        {nodes.length > 0 && (
          <div className="node-list" style={{ marginTop: 8 }}>
            已有节点: {nodes.map(n => (
              <span key={n.id} style={{ marginRight: 8 }}>
                <span
                  className="group-color"
                  style={{ background: GROUP_COLORS[n.group] || '#999' }}
                />
                {n.id}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edge Section */}
      <div className="panel-section">
        <h3>添加有向边</h3>
        {nodes.length < 2 ? (
          <p style={{ fontSize: 12, color: '#999' }}>请先添加至少2个节点</p>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>起点</label>
                <select value={edgeSource} onChange={e => setEdgeSource(e.target.value)}>
                  <option value="">-- 选择 --</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>终点</label>
                <select value={edgeTarget} onChange={e => setEdgeTarget(e.target.value)}>
                  <option value="">-- 选择 --</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label} ({n.id})</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>权重</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={edgeWeight}
                onChange={e => setEdgeWeight(e.target.value)}
                placeholder="默认 1"
              />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleAddEdge}>
              添加边
            </button>
          </>
        )}
        {edges.length > 0 && (
          <div className="node-list" style={{ marginTop: 8 }}>
            已有边: {edges.length} 条
          </div>
        )}
      </div>

      {/* JSON Import Section */}
      <div className="panel-section">
        <h3>JSON 批量导入</h3>
        <textarea
          className="json-textarea"
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder={`{"nodes":[{"id":"A","label":"节点A","group":"默认"}],"edges":[{"source":"A","target":"B","weight":5}]}`}
        />
        {jsonError && <p style={{ color: '#e74c3c', fontSize: 12, marginTop: 4 }}>{jsonError}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={handleImport}>导入 JSON</button>
          <button className="btn btn-outline btn-sm" onClick={handleLoadSample}>加载示例</button>
        </div>
      </div>
    </div>
  );
}
