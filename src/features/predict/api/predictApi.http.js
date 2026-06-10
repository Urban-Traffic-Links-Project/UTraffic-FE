import { httpGet } from "../../../shared/lib/http";

export async function fetchAffectedSegments(incidentId, horizon = 1, mode = "spread", radius = 3.0) {
  const data = await httpGet(`/api/v1/predict/affected/${incidentId}?horizon=${horizon}&mode=${mode}&radius=${radius}`);
  return data; // { items: [...] }
}

export async function fetchSpreadMapData(incidentId, horizon = 1, mode = "spread", radius = 3.0) {
  const data = await httpGet(`/api/v1/predict/spread/${incidentId}?horizon=${horizon}&mode=${mode}&radius=${radius}`);
  return data; // { center, rings, arrows }
}
