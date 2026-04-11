import { httpGet } from "../../../shared/lib/http";

/**
 * Replace endpoints to match your backend.
 * Keep the same function signatures so UI does not change.
 */

export async function fetchNodes() {
  return httpGet("/api/nodes");
}

export async function fetchEdges(filters) {
  const qs = new URLSearchParams(filters).toString();
  return httpGet(`/api/edges?${qs}`);
}

export async function fetchCorrelationMatrix(filters) {
  const qs = new URLSearchParams(filters).toString();
  return httpGet(`/api/correlation-matrix?${qs}`);
}

export async function fetchTimeSeries(nodeId, filters) {
  const qs = new URLSearchParams(filters).toString();
  return httpGet(`/api/nodes/${encodeURIComponent(nodeId)}/series?${qs}`);
}
