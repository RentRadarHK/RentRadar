export const AUTH_RETURN_COOKIE = "rr_auth_return";

export function setAuthReturnPath(path: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_RETURN_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=600; SameSite=Lax`;
}

export function clearAuthReturnPath() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_RETURN_COOKIE}=; path=/; max-age=0`;
}
