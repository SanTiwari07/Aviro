/**
 * Shared API base URL.
 * In development, the Vite proxy forwards /api/* to localhost:8000,
 * so we use a relative base. In production, set VITE_API_URL to the
 * deployed backend URL.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${path}: ${text}`);
  }
  return res.json();
}
