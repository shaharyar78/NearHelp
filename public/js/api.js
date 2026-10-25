const TOKEN_KEY = "nearhelp_token";
const USER_KEY = "nearhelp_user";
const API_ORIGIN = window.Capacitor?.Plugins?.Geolocation
  ? "https://near-by-help-1.onrender.com"
  : window.location.origin;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  if (typeof token !== "string" || !token) {
    throw new Error("A valid sign-in token is required.");
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  if (!user || typeof user !== "object") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(new URL(path, API_ORIGIN), {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data?.error
        ? data.error
        : `Request failed (${response.status})`
    );
  }

  return data;
}

export function apiGet(path) {
  return apiRequest(path);
}

export function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return apiRequest(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
