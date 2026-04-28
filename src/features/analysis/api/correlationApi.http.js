/**
 * correlationApi.http.js
 * Gọi backend FastAPI thật.
 * BASE_URL đọc từ .env: VITE_API_BASE_URL=http://localhost:8000
 */
import { httpGet } from "../../../shared/lib/http";

/** Lấy tất cả 305 nodes với tọa độ thật — gọi 1 lần khi load trang */
export async function fetchNodes() {
  const data = await httpGet("/api/v1/traffic/nodes");
  // Normalize về format {id, osm_node_id, lat, lng, ...}
  return data.map((n) => ({
    id: String(n.osm_node_id),        // dùng osm_node_id làm key string
    osm_node_id: n.osm_node_id,
    node_index: n.node_index,
    lat: n.lat,
    lng: n.lon,                        // backend trả "lon", frontend dùng "lng"
    degree: n.degree ?? 0,
    betweenness_norm: n.betweenness_norm ?? 0,
    street_name: n.street_name ?? null,
  }));
}

/** Lấy 429 edges để vẽ đường nối giữa nodes */
export async function fetchEdges() {
  const data = await httpGet("/api/v1/traffic/edges");
  return data.map((e) => ({
    edge_id: e.edge_id,
    source: String(e.source_osm_id),
    target: String(e.target_osm_id),
    source_lat: e.source_lat,
    source_lng: e.source_lon,
    target_lat: e.target_lat,
    target_lng: e.target_lon,
    length_m: e.length_m,
  }));
}

/**
 * Ego-Network: khi click node X.
 * params: { max_dist_m: 1000, min_corr: 0.5 } cho Ego-Network Focus
 * params: {} để lấy tất cả (dùng cho highlight toàn bộ)
 */
export async function fetchCorrelation(osmNodeId, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    )
  ).toString();
  const url = `/api/v1/correlation/nodes/${osmNodeId}${qs ? `?${qs}` : ""}`;
  const data = await httpGet(url);

  return {
    selected: data.selected_node,
    neighbors: data.neighbors.map((n) => ({
      id: String(n.osm_node_id),
      osm_node_id: n.osm_node_id,
      lat: n.lat,
      lng: n.lon,
      corr: n.corr,
      rank: n.rank,
      dist_m: n.dist_m,
      is_adjacent: n.is_adjacent,
    })),
    total: data.total,
  };
}