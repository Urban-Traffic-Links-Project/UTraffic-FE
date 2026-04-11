export const qk = {
  analysis: {
    nodes: (filters) => ["analysis", "nodes", filters],
    edges: (filters) => ["analysis", "edges", filters],
    matrix: (filters) => ["analysis", "matrix", filters],
    series: (nodeId, filters) => ["analysis", "series", nodeId, filters],
  },
};
