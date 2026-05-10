import { httpGet, httpPost } from "../../../shared/lib/http";

export async function fetchIncidents({ limit = 50 } = {}) {
  const qs = new URLSearchParams({ limit: String(limit) }).toString();
  return httpGet(`/api/v1/incidents?${qs}`);
}

export async function fetchAndSaveIncidents(params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    )
  ).toString();
  return httpPost(`/api/v1/incidents/fetch${qs ? `?${qs}` : ""}`, null);
}

