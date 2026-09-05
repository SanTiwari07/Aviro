# Frontend Architecture & Documentation

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Bundler / Dev Server**: Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: `react-router-dom` v6
- **Icons**: `lucide-react`
- **Port**: `http://localhost:5173`

---

## Directory Structure

```
frontend/
├── index.html               # Entry HTML shell
├── package.json             # NPM dependencies & build scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind theme extensions & custom palette
├── vite.config.ts           # Vite server config & /api proxy
└── src/
    ├── main.tsx             # React root mount (StrictMode)
    ├── App.tsx              # Sidebar navigation and route definitions
    ├── index.css            # Global CSS styles & Tailwind directives
    ├── api.ts               # Centralised HTTP fetch client
    ├── components/
    │   └── EvidenceDrawer.tsx  # Slide-over detail drawer for case audits
    └── pages/
        ├── Overview.tsx        # Metrics dashboard & Run trigger
        ├── Reconciliation.tsx  # Full audit table with status filtering
        ├── Exceptions.tsx      # Prioritized financial exceptions & CSV export
        ├── Settlements.tsx     # Settlement waterfall & batch inspection
        ├── ControlCenter.tsx   # Operational control center & invariant monitor
        ├── CashPosition.tsx    # 7-day cash flow forecast timeline
        ├── Ask.tsx             # Interactive grounded RAG chat copilot
        ├── Runs.tsx            # Historical reconciliation execution ledger
        ├── Benchmark.tsx       # 4-tier ablation & live AI safety benchmark
        └── Audit.tsx           # System audit trail & case verification
```

---

## Centralised API Client (`src/api.ts`)

To avoid hardcoded URLs, the application routes all backend calls through `src/api.ts`:
```typescript
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
```

In development, Vite proxies requests from `/api/*` directly to `http://localhost:8000`, eliminating CORS errors.

---

## Pages & User Workflows

### 1. Overview (`src/pages/Overview.tsx`)
- Displays metrics cards: Processed, Matched, Review, and Exceptions.
- Displays the Cash Position: Expected, Settled, and Unexplained amounts formatted in INR (`₹`).
- Houses the **Run Reconciliation** button: triggers `POST /api/reconciliation/run` and refreshes dashboard figures on completion.

### 2. Reconciliation (`src/pages/Reconciliation.tsx`)
- Renders an interactive table of up to 200 reconciliation cases.
- Displays Case ID, Payment ID, Method, AI Confidence %, Control Result, and Status.
- Clicking any row opens the `EvidenceDrawer` with full deterministic evidence, AI investigation, and Control Gate rationale.

### 3. Exceptions (`src/pages/Exceptions.tsx`)
- Filters cases to show only `status === 'EXCEPTION'`.
- Displays Case ID, Payment ID, Match Method, and Financial Impact in INR.
- Integrates with the `EvidenceDrawer` to inspect why the exception was raised.

### 4. Settlements (`src/pages/Settlements.tsx`)
- Informational view explaining the settlement waterfall deduction logic.

### 5. Ask Arivo (`src/pages/Ask.tsx`)
- Conversational chat interface for asking policy or case investigation questions.
- Automatically scrolls to latest message on response.
- Communicates with `POST /api/ask`.

---

## Components

### `EvidenceDrawer.tsx`
A slide-over drawer that displays the 3-pillar breakdown of any selected case:
1. **Deterministic Evidence**: Payment ID, Settlement ID, matching method used.
2. **Gemini Investigation**: Recommendation badge and confidence score.
3. **Control Gate**: `PASS` or `BLOCK` verdict, including explicit reasons if blocked.
4. **Final Arivo Decision**: Final status with distinct color coding (`MATCHED` in green, `REVIEW` in orange, `EXCEPTION` in red).
