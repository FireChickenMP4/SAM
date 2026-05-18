import { exportPNG, exportJSON } from '../utils/export';
import ViewToggle from './ViewToggle';

const LAYOUTS = [
  { name: 'dagre', label: '树形', opts: { name: 'dagre', rankDir: 'LR', spacingFactor: 1.3 } },
  { name: 'cose', label: '力导向', opts: { name: 'cose', animate: true } },
  { name: 'circle', label: '圆形', opts: { name: 'circle' } },
  { name: 'concentric', label: '同心圆', opts: { name: 'concentric' } },
  { name: 'grid', label: '网格', opts: { name: 'grid' } },
  { name: 'breadthfirst', label: '广度优先', opts: { name: 'breadthfirst', directed: true } },
];

export default function Toolbar({ getCy, graphData, onClear, samData, samView, onSamViewChange, samLabelFormat, onToggleLabelFormat }) {
  const handleLayout = (layout) => {
    const cy = getCy();
    if (!cy || cy.nodes().length === 0) return;
    cy.layout(layout.opts).run();
  };

  const handleExportPNG = () => {
    const cy = getCy();
    if (!cy) return;
    exportPNG(cy);
  };

  const handleExportJSON = () => {
    exportJSON(graphData);
  };

  const handleClear = () => {
    if (graphData.nodes.length === 0 && !samData) return;
    onClear();
  };

  return (
    <div className="toolbar">
      {samData && (
        <>
          <span className="toolbar-label">视图</span>
          <ViewToggle value={samView} onChange={onSamViewChange} />
          <span className="toolbar-divider" />
          <span className="toolbar-label">标签</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={onToggleLabelFormat}
          >
            {samLabelFormat === 'len' ? 'len' : '字符串'}
          </button>
          <span className="toolbar-divider" />
        </>
      )}

      <span className="toolbar-label">布局</span>
      {LAYOUTS.map(l => (
        <button
          key={l.name}
          className="btn btn-outline btn-sm"
          onClick={() => handleLayout(l)}
        >
          {l.label}
        </button>
      ))}

      <span className="toolbar-divider" />

      <span className="toolbar-label">导出</span>
      <button className="btn btn-outline btn-sm" onClick={handleExportPNG}>
        PNG 图片
      </button>
      <button className="btn btn-outline btn-sm" onClick={handleExportJSON}>
        JSON 数据
      </button>

      <span className="toolbar-divider" />

      <button className="btn btn-danger btn-sm" onClick={handleClear}>
        清空画布
      </button>
    </div>
  );
}
