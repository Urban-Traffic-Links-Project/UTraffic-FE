import { refreshAccessToken } from "./authApi";
import { clearAuthData, getAccessToken } from "./authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function apiFetch(path, options = {}) {
  const accessToken = getAccessToken();

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  /**
   * Nếu API protected trả 401 thì thử refresh token.
   * Refresh thành công thì gọi lại request cũ 1 lần.
   */
  if (response.status === 401) {
    try {
      const newTokens = await refreshAccessToken();

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newTokens.access_token}`,
      };

      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
      });
    } catch (error) {
      clearAuthData();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }

      throw error;
    }
  }

  return response;
}