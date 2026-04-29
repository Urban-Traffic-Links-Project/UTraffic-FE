import {
  clearAuthData,
  getRefreshToken,
  saveNewTokens,
} from "./authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthData();
    throw new Error("Không tìm thấy refresh token.");
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 200) {
    saveNewTokens(data);
    return data;
  }

  if (response.status === 403) {
    clearAuthData();
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  if (response.status === 422) {
    clearAuthData();
    throw new Error("Refresh token không hợp lệ.");
  }

  clearAuthData();
  throw new Error(data?.detail || "Không thể làm mới phiên đăng nhập.");
}

export async function logoutFromServer() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthData();
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 200) {
    return data;
  }

  if (response.status === 422) {
    throw new Error("Refresh token không hợp lệ.");
  }

  throw new Error(data?.detail || "Đăng xuất thất bại.");
}