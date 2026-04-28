export const AUTH_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  tokenType: "token_type",
  expiresAt: "expires_at",
  user: "user",
  storageType: "auth_storage_type",
};

export function getAuthStorage() {
  const storageType = localStorage.getItem(AUTH_KEYS.storageType);

  if (storageType === "local") {
    return localStorage;
  }

  return sessionStorage;
}

export function saveAuthData({ user, tokens, remember = false }) {
  clearAuthData();

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem(AUTH_KEYS.accessToken, tokens.access_token);
  storage.setItem(AUTH_KEYS.refreshToken, tokens.refresh_token);
  storage.setItem(AUTH_KEYS.tokenType, tokens.token_type || "bearer");
  storage.setItem(AUTH_KEYS.expiresAt, String(tokens.expires_at));

  if (user) {
    storage.setItem(AUTH_KEYS.user, JSON.stringify(user));
  }

  localStorage.setItem(AUTH_KEYS.storageType, remember ? "local" : "session");
}

export function saveNewTokens(tokens) {
  const storage = getAuthStorage();

  storage.setItem(AUTH_KEYS.accessToken, tokens.access_token);
  storage.setItem(AUTH_KEYS.refreshToken, tokens.refresh_token);
  storage.setItem(AUTH_KEYS.tokenType, tokens.token_type || "bearer");
  storage.setItem(AUTH_KEYS.expiresAt, String(tokens.expires_at));
}

export function getAccessToken() {
  return getAuthStorage().getItem(AUTH_KEYS.accessToken);
}

export function getRefreshToken() {
  return getAuthStorage().getItem(AUTH_KEYS.refreshToken);
}

export function getCurrentUser() {
  const userRaw = getAuthStorage().getItem(AUTH_KEYS.user);

  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

export function clearAuthData() {
  Object.values(AUTH_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function saveCurrentUser(user) {
  const storage = getAuthStorage();

  storage.setItem(AUTH_KEYS.user, JSON.stringify(user));
}