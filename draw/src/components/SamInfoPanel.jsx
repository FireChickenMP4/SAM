import { GROUP_COLORS } from '../hooks/useGraphData';

function SamTable({ title, columns, rows }) {
  if (rows.length === 0) return null;
  return (
    <div className="sam-table-wrap">
      <h4 className="sam-table-title">{title} ({rows.length})</h4>
      <table className="sam-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={col.style}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} style={col.style}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SamInfoPanel({ samData }) {
  if (!samData || !samData.sam) return null;

  const { sam } = samData;
  const terminals = sam.getTerminals();

  const nodeCols = [
    { key: 'id', label: '状态', style: { width: 40 } },
    {
      key: 'group', label: '类型', style: { width: 50 },
      render: r => {
        const c = GROUP_COLORS[r.group] || '#999';
        return <span><span className="group-color" style={{ background: c }} />{r.group}</span>;
      },
    },
    { key: 'len', label: 'len', style: { width: 40 } },
    { key: 'link', label: 'link', style: { width: 50 },
      render: r => r.link >= 0 ? r.link : '-' },
  ];
  const nodeRows = [];
  for (let i = 0; i < sam.next.length; i++) {
    let group = '默认';
    if (i === 0) group = '初始';
    else if (terminals.has(i)) group = '终止';
    else if (sam.isClone[i]) group = '克隆';
    nodeRows.push({ id: i, group, len: sam.len[i], link: sam.link[i] });
  }

  const transCols = [
    { key: 'from', label: '起点' },
    { key: 'ch', label: '字符' },
    { key: 'to', label: '终点' },
  ];
  const transRows = [];
  for (let i = 0; i < sam.next.length; i++) {
    for (const [ch, target] of Object.entries(sam.next[i])) {
      transRows.push({ from: i, ch, to: target });
    }
  }

  const linkCols = [
    { key: 'from', label: '子', style: { width: 40 } },
    { key: 'to', label: '父', style: { width: 40 } },
  ];
  const linkRows = [];
  for (let i = 0; i < sam.link.length; i++) {
    if (sam.link[i] >= 0) {
      linkRows.push({ from: i, to: sam.link[i] });
    }
  }

  return (
    <div className="sam-info-panel">
      <SamTable title="状态节点" columns={nodeCols} rows={nodeRows} />
      <SamTable title="转移边" columns={transCols} rows={transRows} />
      <SamTable title="后缀链接" columns={linkCols} rows={linkRows} />
    </div>
  );
}
