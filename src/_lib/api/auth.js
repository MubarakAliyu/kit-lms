import { apiClient } from "./client";

/**
 * Auth API service — wraps the backend's auth endpoints. In development the
 * actual HTTP calls are intercepted by MSW (browser worker for client calls,
 * Node server for NextAuth's server-side authorize() callback).
 */

/**
 * Authenticate with email + password.
 * @param {{ email: string, password: string }} args
 */
export async function login({ email, password }) {
  const { data } = await apiClient.post("/login", { email, password });
  return data;
}

/**
 * Request a password-reset email. Always resolves successfully on 2xx — the
 * backend never reveals whether the address is registered.
 * @param {{ email: string }} args
 */
export async function requestPasswordReset({ email }) {
  const { data } = await apiClient.post("/forgot-password", { email });
  return data;
}

/**
 * Submit a new password using the token from the reset-link email.
 * @param {{ token: string, password: string }} args
 */
export async function resetPassword({ token, password }) {
  const { data } = await apiClient.post("/reset-password", { token, password });
  return data;
}
