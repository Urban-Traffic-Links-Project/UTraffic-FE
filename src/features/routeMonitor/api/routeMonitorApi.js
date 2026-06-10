/**
 * src/features/routeMonitor/api/routeMonitorApi.js
 * API client cho Route Monitor — theo dõi kẹt xe tuyến đường cố định A→B.
 */

const BASE_URL = "/api/v1/route-monitor";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.detail || body?.message || message;
    } catch {
      // giữ fallback
    }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Lấy trạng thái mới nhất của toàn tuyến.
 * @returns {Promise<RouteStatusResponse>}
 */
export async function fetchRouteStatus() {
  const res = await fetch(`${BASE_URL}/status`);
  return handleResponse(res);
}

/**
 * Lấy lịch sử snapshots.
 * @param {number} hours - Số giờ nhìn lại (1-168)
 * @param {string|null} point - "A" | "B" | null (tất cả)
 * @returns {Promise<Array>}
 */
export async function fetchRouteHistory(hours = 24, point = null) {
  const params = new URLSearchParams({ hours: String(hours) });
  if (point) params.set("point", point);
  const res = await fetch(`${BASE_URL}/history?${params}`);
  return handleResponse(res);
}

/**
 * Lấy snapshot gần nhất với thời điểm chỉ định (±30 phút).
 * @param {string} datetimeISO - ISO 8601 string (VD: "2024-08-26T10:30:00+07:00")
 * @param {string|null} point - "A" | "B" | null
 * @returns {Promise<RouteSnapshotAtResponse>}
 */
export async function fetchSnapshotAt(datetimeISO, point = null) {
  const params = new URLSearchParams({ datetime: datetimeISO });
  if (point) params.set("point", point);
  const res = await fetch(`${BASE_URL}/snapshot-at?${params}`);
  return handleResponse(res);
}

/**
 * Thu thập snapshot thủ công (trigger ngay).
 * @returns {Promise<{message: string, created: number}>}
 */
export async function triggerCollect() {
  const res = await fetch(`${BASE_URL}/collect`, { method: "POST" });
  return handleResponse(res);
}

/**
 * Seed điểm A và B vào DB (idempotent).
 * @returns {Promise<{message: string, created: number}>}
 */
export async function seedRoutePoints() {
  const res = await fetch(`${BASE_URL}/seed`, { method: "POST" });
  return handleResponse(res);
}
