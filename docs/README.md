# ARIVO Technical Documentation Hub

> **Track:** Razorpay AI Buildathon 2026  Track 04: AI Finance Controller  
> **Master Architectural Blueprint:** [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md)  
> **Project Overview & Quickstart:** [`../README.md`](../README.md)

Welcome to the internal engineering documentation hub for **ARIVO**, an invariant-governed AI Finance Controller built to enforce deterministic accounting integrity over high-volume payment processing.

---

## Documentation Categories

```
docs/
├── architecture/     # System blueprints, backend/frontend internals, database, design system
├── api/              # REST reference (20 endpoints), Razorpay integration, webhooks
├── ai/               # Gemini 2.5 Flash investigator, XGBoost ML ranking, RAG pipeline
├── operations/       # Setup, development workflow, deployment, environment, runbooks
├── quality/          # Test suite (135 tests), benchmark (5,114 txns), postmortems, changelog
├── security/         # Security policy, credential management, authentication
├── policies/         # Authoritative financial control policies and invariants
└── images/           # Verified real UI screenshots
```

---

## 1. System Architecture

Core architectural blueprints detailing data flow, state machines, and relational schemas:

- [**System Architecture**](architecture/SYSTEM_ARCHITECTURE.md)  High-level component interactions, control flow, and safety boundaries.
- [**Backend Architecture**](architecture/BACKEND.md)  FastAPI gateway, reconciliation engine, and waterfall arithmetic.
- [**Frontend Architecture**](architecture/FRONTEND.md)  React 18, Tailwind CSS, high-density financial workspace, and state management.
- [**Database Schema & Migrations**](architecture/DATABASE.md)  Relational schema, SQLite table structures, paise minor units, and dynamic migration runner.
- [**Error Handling & Fault Tolerance**](architecture/ERROR_HANDLING.md)  Hierarchy of error types, network failure resilience, and fallback modes.
- [**Design System**](architecture/DESIGN_SYSTEM.md)  Razorpay-inspired typography, dark mode color tokens, and UI component specifications.

---

## 2. API & Gateway Integration

Specifications and guides for REST endpoints and external provider interfaces:

- [**REST API Reference**](api/REFERENCE.md)  Complete contract specification for all 20 FastAPI endpoints in `backend/main.py`.
- [**Razorpay Integration Guide**](api/RAZORPAY_INTEGRATION.md)  Server-side API client, pagination, exponential backoff, and snapshot management.
- [**Webhooks Reference**](api/WEBHOOKS.md)  Asynchronous webhook listener (`/api/webhooks/razorpay`), HMAC-SHA256 signature verification, and idempotency.

---

## 3. Artificial Intelligence & Machine Learning

Architecture of the multi-tier investigation and candidate ranking pipeline:

- [**Gemini 2.5 Flash Investigation**](ai/GEMINI_INVESTIGATOR.md)  System prompt structure, structured JSON schema, non-authoritative boundary, and deterministic fallback.
- [**Machine Learning Candidate Ranking**](ai/ML_CANDIDATE_RANKING.md)  XGBoost 8-feature formulation, training pipeline, and cold-start heuristic ranker.
- [**RAG Knowledge System**](ai/RAG_SYSTEM.md)  Chunking engine, policy vector retrieval, and natural language copilot grounding.

---

## 4. Operations, Deployment & Runbooks

Operational procedures for developers, operators, and evaluators:

- [**Quickstart & Setup**](operations/SETUP.md)  Prerequisites, virtual environment configuration, and local launch instructions.
- [**Development Guide**](operations/DEVELOPMENT.md)  Local development workflow, code formatting, and hot-reload tooling.
- [**Deployment Architecture**](operations/DEPLOYMENT.md)  Docker containerization, Docker Compose, and production reverse proxying.
- [**Environment Variables**](operations/ENVIRONMENT.md)  Complete reference of `.env` configuration keys and safe defaults.
- [**5-Minute Demo Script**](operations/DEMO_SCRIPT.md)  Step-by-step walkthrough for hackathon judges and evaluation panels.
- [**Debugging Guide**](operations/DEBUGGING.md)  Forensic inspection procedures, log examination, and common traps.
- [**Troubleshooting Guide**](operations/TROUBLESHOOTING.md)  Diagnostic checklists for database locks, port conflicts, and API errors.

---

## 5. Quality Assurance, Benchmarks & History

Verification methodologies and historical logs:

- [**Testing Strategy**](quality/TESTING.md)  Full breakdown of the 135 automated tests across 16 test suites in `backend/tests/`.
- [**Controlled Synthetic Benchmark**](quality/BENCHMARK.md)  Empirical accuracy and exposure metrics against 5,114 ground-truth records.
- [**Failure Modes & Postmortems**](quality/POSTMORTEM.md)  Analysis of real financial reconciliation failures and how ARIVO mitigates them.
- [**Changelog & History**](quality/CHANGELOG.md)  Chronological history of major releases and enhancements.

---

## 6. Security & Financial Policies

Governance, compliance, and accounting invariants:

- [**Security Policy**](security/SECURITY_POLICY.md)  Zero-trust credential handling, least privilege, and PCI-DSS compliance context.
- [**Authentication Architecture**](security/AUTHENTICATION.md)  Current session boundaries and roadmap to enterprise SSO/RBAC.
- [**ARIVO Financial Control Policy**](policies/arivo_control_policy.md)  Authoritative definition of the 7 non-negotiable financial invariants.

---

## 7. Real Visual Assets

Genuine high-resolution screenshots captured from the live application in dark mode:

- [**Evidence Drawer (Flagship Safety Scenario)**](images/arivo-flagship-drawer.png)
- [**Financial Control Room Dashboard**](images/arivo-dashboard.png)
- [**Controlled Synthetic Benchmark**](images/arivo-benchmark.png)
- [**Financial Control Center**](images/arivo-control-center.png)
