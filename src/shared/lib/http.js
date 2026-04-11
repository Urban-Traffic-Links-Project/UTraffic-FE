/**
 * Minimal fetch wrapper. Swap/extend later (auth headers, interceptors, etc.)
 */
export async function httpGet(path, { baseUrl, signal } = {}) {
  const url = new URL(path, baseUrl || import.meta.env.VITE_API_BASE_URL || "");
  const res = await fetch(url.toString(), { method: "GET", signal });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
