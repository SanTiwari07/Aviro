/**
 * Arivo Enterprise API Client & Type Definitions
 * Connects to ARIVO AI Finance Controller backend.
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

export interface CaseDetail {
  case: {
    case_id: string;
    run_id: string;
    payment_id?: string;
    settlement_id?: string;
    status: 'MATCHED' | 'REVIEW' | 'EXCEPTION';
    match_method: string;
    financial_impact: number;
    amount_delta: number;
    source: string;
    source_record_id?: string;
    sync_id?: string;
    created_at: string;
    resolved_by?: string;
    resolution_action?: string;
    resolution_notes?: string;
    resolved_at?: string;
  };
  payment?: {
    payment_id: string;
    amount: number;
    currency: string;
    order_id?: string;
    method?: string;
    fee: number;
    tax: number;
    created_at: string;
  } | null;
  settlement_waterfall?: {
    settlement_id: string;
    gross_amount: number;
    fees: number;
    tax: number;
    refunds: number;
    chargebacks: number;
    adjustments: number;
    net_amount: number;
    unexplained_delta: number;
    utr?: string;
    status: string;
    created_at: string;
  } | null;
  ai_investigation: {
    used: boolean;
    reason: string;
    recommendation?: string;
    confidence?: number;
    summary?: string;
    supporting_evidence?: string[];
  };
  control_gate: {
    verdict: 'PASS' | 'BLOCK';
    reasons: string[];
  };
}

export interface PolicyExcerpt {
  name: string;
  version: string;
  doc: string;
  section: string;
  excerpt: string;
  score?: number;
}

export interface AskResponse {
  answer: string;
  records: Array<{
    type?: string;
    id?: string;
    amount_formatted?: string;
    gross_formatted?: string;
    net_formatted?: string;
    impact_formatted?: string;
    status?: string;
    control_result?: string;
    [key: string]: any;
  }>;
  policies: PolicyExcerpt[];
  classification: string;
  recommended_actions: string[];
  grounded: boolean;
}

export interface PolicyItem {
  doc_name: string;
  policy_name: string;
  version: string;
  sections: string[];
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
  getCaseDetail: (caseId: string): Promise<CaseDetail> => apiFetch(`/api/reconciliation/${caseId}`),
  resolveCase: (caseId: string, action: 'APPROVED' | 'REJECTED' | 'ESCALATED', notes = '', user = 'Controller (SecOps)') =>
    apiFetch(`/api/reconciliation/${caseId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, notes, user }),
    }),
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
  getPolicies: (): Promise<{ status: string; total_policies: number; total_chunks: number; policies: PolicyItem[] }> =>
    apiFetch('/api/policies'),
  getRuns: (limit = 50) => apiFetch(`/api/runs?limit=${limit}`),
  getBenchmark: () => apiFetch('/api/benchmark'),
  askArivo: (question: string): Promise<AskResponse> =>
    apiFetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};

/**
 * Format integer paise into standard Indian Rupee representation (e.g. ₹2,49,999.00).
 */
export function formatINR(paise: number | undefined | null): string {
  if (paise === undefined || paise === null || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats ISO timestamp to institutional date/time representation.
 */
export function formatDate(isoStr: string | undefined | null): string {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return isoStr;
  }
}

/**
 * Formats large integer numbers with commas.
 */
export function formatNumber(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return new Intl.NumberFormat('en-IN').format(n);
}

/**
 * Formats percentages with fixed decimals.
 */
export function formatPercent(val: number | undefined | null, decimals = 1): string {
  if (val === undefined || val === null || isNaN(val)) return '0.0%';
  return `${(val * 100).toFixed(decimals)}%`;
}
