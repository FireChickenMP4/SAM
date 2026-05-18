import { saveAs } from 'file-saver';

export async function exportPNG(cy) {
  const { toPng } = await import('html-to-image');
  const container = cy.container();
  if (!container) return;

  const dataUrl = await toPng(container, {
    backgroundColor: '#fafbfc',
    pixelRatio: 2,
  });

  const link = document.createElement('a');
  link.download = `graph_${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
}

export function exportJSON({ nodes, edges }) {
  const data = {
    nodes: nodes.map(n => ({
      id: n.id,
      label: n.label,
      group: n.group,
    })),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  saveAs(blob, `graph_${Date.now()}.json`);
}
