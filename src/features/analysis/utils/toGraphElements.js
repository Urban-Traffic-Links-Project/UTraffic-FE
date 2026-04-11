/**
 * Convert nodes/edges into a generic graph format for future libs (Cytoscape/D3/etc).
 * Keeping this adapter makes swapping visual libs easy.
 */
export function toGraphElements(nodes, edges) {
  const nodeEls = nodes.map((n) => ({
    data: { id: n.id, label: n.name, zone: n.zone },
    position: { x: n.lng * 1000, y: -n.lat * 1000 }, // rough stable spread
  }));

  const edgeEls = edges.map((e, idx) => ({
    data: {
      id: `E${idx}`,
      source: e.source,
      target: e.target,
      corr: e.corr,
      lag: e.lag,
    },
  }));

  return [...nodeEls, ...edgeEls];
}
