export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // Change "token" to "accessToken"
  return localStorage.getItem("accessToken");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  // If no token, return an empty object (Proxy will catch this)
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "/login";
}