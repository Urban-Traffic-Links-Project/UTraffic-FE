/**
 * forecastApi.js
 * API calls cho Forecast module (DMFM T+h prediction).
 */
import { httpGet } from "../../../shared/lib/http";

/**
 * Lấy danh sách (date, slot) có trong DMFM dataset và horizon labels.
 * Returns: { dates, slots, total, available_horizons, horizon_labels }
 */
export async function fetchForecastSnapshots() {
  return await httpGet("/api/v1/forecast/snapshots");
}

/**
 * Dự báo tương quan tại T+horizon×15p cho node được chọn.
 *
 * @param {number} osmNodeId  - OSM Node ID
 * @param {string} date       - "2024-08-26"
 * @param {string} slot       - "Slot_1100"
 * @param {number} horizon    - 0..9 (0=Tại T, 1=+15p, ..., 9=+135p)
 * @param {object} params     - { max_dist_m?, min_corr?, top_k? }
 *
 * Returns: {
 *   base_time, base_date, base_slot,
 *   predicted_time, predicted_slot,
 *   horizon, horizon_minutes, source,
 *   selected_node, neighbors, total
 * }
 */
export async function fetchForecastNode(osmNodeId, date, slot, horizon, params = {}) {
  const qs = new URLSearchParams({
    date,
    slot,
    horizon,
    ...Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ),
  }).toString();

  const data = await httpGet(`/api/v1/forecast/node/${osmNodeId}?${qs}`);

  return {
    basetime:        data.base_time,
    baseDate:        data.base_date,
    baseSlot:        data.base_slot,
    predictedTime:   data.predicted_time,
    predictedSlot:   data.predicted_slot,
    horizon:         data.horizon,
    horizonMinutes:  data.horizon_minutes,
    source:          data.source,           // "historical_bundle" | "dmfm_online"
    predIdx:         data.pred_idx,
    selectedNode:    data.selected_node,
    neighbors: data.neighbors.map((n) => ({
      id:          String(n.osm_node_id),
      osm_node_id: n.osm_node_id,
      node_index:  n.node_index,
      lat:         n.lat,
      lng:         n.lon,
      street_name: n.street_name ?? null,
      corr:        n.corr,
      rank:        n.rank,
      dist_m:      n.dist_m,
      is_adjacent: n.is_adjacent,
    })),
    total: data.total,
  };
}
