import { apiFetch } from "./apiClient";
import { clearAuthData, saveCurrentUser } from "./authStorage";

export async function getMe() {
  const response = await apiFetch("/api/v1/auth/me", {
    method: "GET",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 200) {
    saveCurrentUser(data);
    return data;
  }

  if (response.status === 401) {
    clearAuthData();
    throw new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  throw new Error(data?.detail || "Không thể lấy thông tin tài khoản.");
}