import { httpGet } from "../../../shared/lib/http";

export async function fetchRoadSegmentsSummary() {
  return httpGet("/api/traffic-data/segments-summary");
}

export async function fetchFrequentCongestionSegments() {
  return httpGet("/api/traffic-data/congestion-map");
}

export async function fetchSegmentStats({ segmentId, date }) {
  const qs = new URLSearchParams({ segmentId, date }).toString();
  return httpGet(`/api/traffic-data/segment-stats?${qs}`);
}