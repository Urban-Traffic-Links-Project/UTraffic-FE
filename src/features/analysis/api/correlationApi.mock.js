/**
 * correlationApi.mock.js
 * Mock với tọa độ HCM thật hơn — chỉ dùng khi VITE_API_MODE=mock
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// 20 nodes mock gần khu Quận 1 HCM
const rng = seededRng(20260328);
const MOCK_NODES = Array.from({ length: 20 }, (_, i) => ({
  id: String(366381388 + i * 1000),
  osm_node_id: 366381388 + i * 1000,
  node_index: i,
  lat: 10.772 + (rng() - 0.5) * 0.06,
  lng: 106.698 + (rng() - 0.5) * 0.06,
  degree: Math.floor(rng() * 4) + 1,
  betweenness_norm: Number((rng() * 0.8).toFixed(3)),
}));

const MOCK_EDGES = [];
for (let i = 0; i < MOCK_NODES.length; i++) {
  for (let j = i + 1; j < MOCK_NODES.length; j++) {
    if (rng() > 0.7) {
      MOCK_EDGES.push({
        edge_id: `edge-${i}-${j}`,
        source: MOCK_NODES[i].id,
        target: MOCK_NODES[j].id,
        source_lat: MOCK_NODES[i].lat, source_lng: MOCK_NODES[i].lng,
        target_lat: MOCK_NODES[j].lat, target_lng: MOCK_NODES[j].lng,
        length_m: 50 + rng() * 500,
      });
    }
  }
}

export async function fetchNodes() {
  await sleep(200);
  return MOCK_NODES;
}

export async function fetchEdges() {
  await sleep(150);
  return MOCK_EDGES;
}

export async function fetchCorrelation(osmNodeId, params = {}) {
  await sleep(250);
  const r = seededRng(Number(osmNodeId) % 9999);
  const selected = MOCK_NODES.find((n) => n.osm_node_id === Number(osmNodeId)) || MOCK_NODES[0];
  const { max_dist_m, min_corr } = params;

  const neighbors = MOCK_NODES
    .filter((n) => n.osm_node_id !== selected.osm_node_id)
    .map((n, i) => {
      const corr = parseFloat((r() * 2 - 1).toFixed(4));
      const dist_m = Math.round(
        111320 * Math.sqrt((n.lat - selected.lat) ** 2 + (n.lng - selected.lng) ** 2)
      );
      return { ...n, corr, rank: i, dist_m, is_adjacent: r() > 0.7 };
    })
    .filter((n) => {
      if (max_dist_m && n.dist_m > max_dist_m) return false;
      if (min_corr && Math.abs(n.corr) < min_corr) return false;
      return true;
    })
    .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

  return {
    selected: { osm_node_id: selected.osm_node_id, lat: selected.lat, lng: selected.lng },
    neighbors,
    total: neighbors.length,
  };
}