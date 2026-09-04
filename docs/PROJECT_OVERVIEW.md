# Project Overview

## What is Arivo?

Arivo is a **deterministic reconciliation engine with AI-assisted investigation** for ambiguous financial cases. It was built for the Razorpay AI Buildathon 2026 (Track 04 - AI Finance Controller).

The core premise: deterministic code handles what deterministic code does best (arithmetic, exact ID matching, financial invariants). Gemini AI handles what AI does best (semantic interpretation of ambiguous evidence, human-friendly explanations). A strict **Control Gate** sits between Gemini's recommendations and any final decision to prevent unsafe automation.

## Problem Statement

Finance teams reconcile payments against settlements across multiple systems (payment gateways, bank statements, ledgers, refund engines). The difficult part is not the exact matches - it is identifying:

- Why did this payment not settle?
- Is this delta an error or a legitimate fee?
- Should this ambiguous case be automatically matched or escalated?
- Can we trust an AI recommendation for a ₹500,000 transaction?

## Target Users

- Finance controllers and reconciliation analysts
- Engineering teams evaluating AI-assisted finance automation

## Primary Workflows

### 1. Reconciliation Run
User triggers a run. The engine ingests `payments.csv` and `settlements.csv`, runs deterministic matching, routes ambiguous cases to Gemini for investigation, passes all candidates through the Control Gate, and persists final decisions to SQLite.

### 2. Case Review
Users browse the Reconciliation table. Clicking a case opens the Evidence Drawer showing the payment ID, settlement ID, match method, Gemini's recommendation and confidence, Control Gate result and reasons, and final Arivo decision.

### 3. Exception Management
The Exceptions page shows only `EXCEPTION`-status cases with their financial impact, so analysts can prioritise high-value unresolved items.

### 4. Ask Arivo
A conversational interface where users ask natural-language questions about reconciliation policy and case behaviour. Gemini answers grounded in a policy context string.

## Major Components

| Component | Technology | Role |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | Dashboard, tables, evidence drawer, chat |
| Backend | Python + FastAPI | REST API, orchestration |
| Reconciliation Engine | Pure Python | Deterministic matching (exact ID, amount-date, fuzzy) |
| Control Gate | Pure Python | Financial invariant enforcement |
| AI Investigator | Google Gemini (google-genai SDK) | Ambiguous case analysis |
| Database | SQLite via SQLAlchemy | Persistent case storage |
| Dataset Generator | Python | Synthetic payments/settlements CSV |

## External Services

| Service | Purpose | Required? |
|---|---|---|
| Google Gemini API | AI investigation + Ask Arivo | Optional (fallback: REVIEW) |

**No Razorpay, no payment processing, no authentication, no webhooks.**

## Current Status

Working. Known limitations:
- Reconciliation run is synchronous (large datasets block the HTTP request)
- No user authentication
- Cash Position financial impact stored in minor units (paise) - display assumes this
- Ask Arivo context is a static string, not a live RAG over actual case data

## Tagline

> Know where every rupee went - or know exactly why you don't.
