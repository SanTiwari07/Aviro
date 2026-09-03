/**
 * Arivo API Client
 * Manages communication with the backend controller.
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    let msg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.detail) msg = parsed.detail;
    } catch {
      // keep raw text
    }
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => apiFetch('/api/health'),
  getRazorpayStatus: () => apiFetch('/api/razorpay/status'),
  syncRazorpay: () => apiFetch('/api/razorpay/sync', { method: 'POST' }),
  getLatestSync: () => apiFetch('/api/sync/latest'),
  runReconciliation: (source = 'synthetic', syncId?: string) =>
    apiFetch('/api/reconciliation/run', {
      method: 'POST',
      body: JSON.stringify({ source, sync_id: syncId }),
    }),
  getDashboard: (source?: string) =>
    apiFetch(`/api/dashboard${source && source !== 'all' ? `?source=${source}` : ''}`),
  getReconciliation: (params?: { source?: string; status?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.source && params.source !== 'all') q.set('source', params.source);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch(`/api/reconciliation?${q.toString()}`);
  },
  getCaseDetail: (caseId: string) => apiFetch(`/api/reconciliation/${caseId}`),
  getExceptions: (params?: { source?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.source && params.source !== 'all') q.set('source', params.source);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch(`/api/exceptions?${q.toString()}`);
  },
  exportExceptionsCsvUrl: (source?: string) =>
    `${API_BASE}/api/exceptions/export${source && source !== 'all' ? `?source=${source}` : ''}`,
  getSettlements: (params?: { source?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.source && params.source !== 'all') q.set('source', params.source);
    if (params?.limit) q.set('limit', String(params.limit));
    return apiFetch(`/api/settlements?${q.toString()}`);
  },
  getSettlementDetail: (settlementId: string) => apiFetch(`/api/settlements/${settlementId}`),
  getCashForecast: () => apiFetch('/api/forecast'),
  getControlHealth: () => apiFetch('/api/health/controls'),
  getRuns: (limit = 50) => apiFetch(`/api/runs?limit=${limit}`),
  getBenchmark: () => apiFetch('/api/benchmark'),
  askArivo: (question: string) =>
    apiFetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

export function formatINR(paise: number | undefined | null): string {
  if (paise === undefined || paise === null) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rupees);
}
