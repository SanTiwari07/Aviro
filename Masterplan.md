You are the principal engineer, product engineer, AI engineer, data engineer,
and QA lead responsible for completing ARIVO for the Razorpay AI Buildathon 2026,
Track 04 — AI Finance Controller.

You are working inside an existing development workspace.

Your objective is NOT to create the largest system.

Your objective is to create the most credible, reliable, polished,
measurable, demo-ready AI Finance Controller possible within the hackathon scope.

The final result must be:

- genuinely functional
- end-to-end
- reproducible
- testable
- visually polished
- GitHub-ready
- secure
- explainable
- measurable
- easy to run
- impressive in a 5-minute demo

The repository itself must look like it was built by an excellent engineering team.

============================================================
0. FIRST: INSPECT THE EXISTING WORKSPACE
============================================================

Before changing anything:

1. Inspect the complete existing repository.
2. Identify the current frontend stack.
3. Identify the current backend stack.
4. Identify database/storage.
5. Identify existing components.
6. Identify existing API routes.
7. Identify existing reconciliation logic.
8. Identify existing Gemini integration.
9. Identify existing dataset/data models.
10. Identify existing tests.
11. Identify existing Git configuration.
12. Identify existing environment variables.
13. Identify anything already working.

Do NOT blindly overwrite existing work.

Preserve useful existing implementation.

Refactor bad implementation where necessary.

Do not duplicate functionality that already exists.

Do not create parallel implementations of the same business logic.

At the end of inspection, form an internal implementation plan based on
the actual workspace.

Then execute the plan.

============================================================
1. PRODUCT IDENTITY
============================================================

Product:

ARIVO

Category:

AI Finance Controller

Primary positioning:

"Know where every rupee went — or know exactly why you don't."

Core problem:

Finance teams need to reconcile financial records across payment,
settlement, ledger, refund, chargeback, and bank systems.

The hard part is not simply matching records.

The hard part is knowing:

- what actually reconciled
- what did not
- why it did not
- how much money is affected
- whether an automated decision is safe
- when AI should be trusted
- when AI should NOT be trusted

Arivo closes that loop.

Core philosophy:

AI investigates.
Rules verify.
Controls protect.
Arivo decides.
Humans resolve ambiguity.

============================================================
2. HACKATHON STRATEGY
============================================================

Build specifically for Razorpay Buildathon Track 04.

The product must demonstrate:

- high throughput
- measured accuracy
- honest exception reporting
- real reconciliation
- meaningful AI usage
- failure recovery
- financial safety
- excellent engineering judgment

The project should strongly communicate:

"Arivo does not automate uncertainty away.
It makes uncertainty visible."

Do not optimize for:

number of agents
number of screens
number of dependencies
number of AI calls
number of features

Optimize for:

correctness
evidence
safety
measurable AI value
demo clarity

============================================================
3. CORE SYSTEM ARCHITECTURE
============================================================

Use this architecture:

DATA SOURCES
    ↓
INGESTION
    ↓
NORMALIZATION + VALIDATION
    ↓
DETERMINISTIC RECONCILIATION ENGINE
    ↓
CANDIDATE MATCHING
    ↓
FINANCIAL VALIDATION
    ↓
 ┌───────────────────────┐
 │                       │
 CLEAR                 UNCLEAR
 │                       │
 ▼                       ▼
AUTO RESOLVE       GEMINI INVESTIGATOR
                         │
                         ▼
                   CONTROL GATE
                         │
                         ▼
                 ARIVO DECISION
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          MATCHED      REVIEW     EXCEPTION

Do NOT create seven independent agents.

Do NOT build an agent swarm.

Do NOT make Gemini responsible for the entire pipeline.

There is one AI reasoning component:

GEMINI INVESTIGATOR

The rest is deterministic financial infrastructure.

============================================================
4. ARCHITECTURAL PRINCIPLE
============================================================

Use AI where AI is good.

Use deterministic code where deterministic code is better.

DETERMINISTIC:

- IDs
- arithmetic
- amounts
- currencies
- date windows
- duplicate detection
- candidate generation
- grouped reconciliation
- settlement calculations
- financial invariants
- population conservation
- risk controls
- final control authorization

GEMINI:

- ambiguous case investigation
- semantic interpretation
- exception classification
- root-cause hypothesis
- evidence summarization
- finance-friendly explanation
- policy-grounded Q&A

Gemini may recommend.

Gemini may NOT authorize.

============================================================
5. FINANCIAL DATA MODEL
============================================================

Core entities:

Order
Payment
LedgerEntry
Settlement
BankTransaction
Refund
Chargeback
Adjustment
ReconciliationCase
ReconciliationRun
AuditEvent

Core relationship:

ORDER
  ↓
PAYMENT
  ├── REFUND
  ├── CHARGEBACK
  └── SETTLEMENT
          ↓
       BANK CREDIT

Also:

LEDGER ↔ PAYMENT

Support relationships:

ONE_TO_ONE

ONE_TO_MANY

MANY_TO_ONE

MANY_TO_MANY

NO_MATCH

============================================================
6. MONEY HANDLING
============================================================

Never use floating point for authoritative financial calculations.

Use:

integer minor units

or:

Decimal

All calculations must be deterministic.

Currency:

INR

Display:

₹2,499.50

Do not perform financial calculations in the frontend.

============================================================
7. RECONCILIATION ENGINE
============================================================

Implement matching in this order:

1. Exact unique identifier
2. Normalized identifier
3. Exact amount + currency + date window
4. Reference similarity
5. Fuzzy candidate matching
6. Grouped reconciliation
7. Financial validation
8. Gemini investigation for remaining ambiguity
9. Deterministic Control Gate
10. Final decision

Every candidate must contain:

source_id
target_id
relationship_type
match_method
match_score
amount_delta
date_delta
reference_similarity
supporting_evidence
conflicting_evidence

Possible match methods:

EXACT_ID
NORMALIZED_ID
AMOUNT_DATE
REFERENCE_SIMILARITY
FUZZY
GROUPED
SEMANTIC_INVESTIGATION

============================================================
8. MATCHING RULES
============================================================

Exact IDs are strongest.

Amount-only matching is NEVER sufficient.

Date-only matching is NEVER sufficient.

Merchant + amount is NOT automatically sufficient.

Similarity is evidence, not proof.

For ambiguous cases:

DO NOT force a match.

Route to REVIEW.

============================================================
9. GROUPED RECONCILIATION
============================================================

Support:

ONE_TO_MANY

MANY_TO_ONE

MANY_TO_MANY

Example:

Payment A ₹20,000
Payment B ₹15,000
Payment C ₹25,000
Payment D ₹10,000
Payment E ₹30,000

Settlement:

₹100,000

The engine should understand that multiple payments can reconcile
to a single settlement.

All child allocations must sum exactly to the parent.

============================================================
10. SETTLEMENT WATERFALL
============================================================

For every settlement calculate:

Gross Payments
- Refunds
- Chargebacks
- Fees
- Tax
+ Adjustments
=
Expected Settlement

Then compare:

Expected Settlement
vs
Actual Settlement

Then compare:

Actual Settlement
vs
Bank Credit

Example:

Gross Payments       ₹100,000
Refunds                ₹5,000
Chargebacks            ₹2,000
Fees                   ₹1,800
Tax                      ₹324
Adjustments               ₹100
--------------------------------
Expected Settlement    ₹90,976

Actual Settlement      ₹90,476

Unexplained Delta         ₹500

Result:

EXCEPTION

All arithmetic must happen in deterministic code.

Gemini may explain the result.

Gemini must not calculate the authoritative result.

============================================================
11. FINANCIAL INVARIANTS
============================================================

Implement hard controls.

CONTROL 1:

Input population must equal:

MATCHED
+
REVIEW
+
EXCEPTION
+
INVALID

No silent drops.

CONTROL 2:

Settlement arithmetic must balance.

CONTROL 3:

Child allocations must equal parent amounts.

CONTROL 4:

Bank allocation must equal bank credit.

CONTROL 5:

One source record cannot be automatically allocated to unrelated targets twice.

CONTROL 6:

No unexplained delta may be automatically closed.

CONTROL 7:

Currency must match.

CONTROL 8:

Critical identifiers must not conflict.

CONTROL 9:

High-value ambiguity must require review.

CONTROL 10:

A Gemini recommendation cannot bypass a failed critical control.

============================================================
12. RECONCILIATION STATES
============================================================

Every record/case must have exactly one terminal state:

MATCHED

REVIEW

EXCEPTION

INVALID

No record should disappear.

============================================================
13. CONTROL GATE
============================================================

Build a deterministic Control Gate.

Input:

candidate match
+
financial analysis
+
Gemini recommendation if available

Output:

PASS

or:

BLOCK

The Control Gate may override Gemini.

Example:

Gemini:

MATCH

AI confidence:

0.97

Control Gate:

BLOCK

Reasons:

- multiple candidates
- no unique identifier
- high-value transaction
- conflicting evidence

Final Arivo decision:

REVIEW

This is a flagship demo scenario.

============================================================
14. GEMINI API
============================================================

A Gemini API key is available.

Use:

GEMINI_API_KEY

from environment configuration.

Never hard-code it.

Never expose it to the frontend.

All Gemini requests must originate from the backend.

Create a focused Gemini service.

Do NOT build a giant provider abstraction.

Use the actual Gemini SDK appropriate to the project's runtime.

Verify the SDK/model/API usage against the installed/current package.

Do not assume unsupported model names.

============================================================
15. GEMINI USAGE STRATEGY
============================================================

Do NOT call Gemini for every record.

Gemini should be called selectively.

Pipeline:

Deterministic engine
↓
Clear cases auto-resolve
↓
Ambiguous cases
↓
Gemini

This demonstrates:

cost awareness
latency awareness
AI judgment
engineering maturity

============================================================
16. GEMINI EVIDENCE PACKET
============================================================

Never send the entire dataset to Gemini.

Create a structured evidence packet.

Example:

{
  "case_id": "EXC_001",
  "records": {
    "payment": {},
    "settlement": {},
    "bank": {},
    "ledger": {}
  },
  "candidate_matches": [],
  "financial_analysis": {
    "expected_amount": 249999,
    "actual_amount": 249499,
    "delta": -500
  },
  "control_flags": [
    "MULTIPLE_CANDIDATES",
    "HIGH_VALUE"
  ]
}

Gemini should reason over this evidence.

============================================================
17. GEMINI OUTPUT CONTRACT
============================================================

Gemini must return structured JSON.

Schema:

{
  "classification": "...",
  "summary": "...",
  "supporting_evidence": [],
  "contradicting_evidence": [],
  "recommended_decision": "MATCHED|REVIEW|EXCEPTION",
  "recommended_action": "...",
  "confidence": 0.0
}

Validate this response before using it.

============================================================
18. ALLOWED EXCEPTION TYPES
============================================================

Support:

REFERENCE_TYPO
TIMING_DIFFERENCE
FEE_VARIANCE
TAX_VARIANCE
REFUND
CHARGEBACK
DUPLICATE
MISSING_PAYMENT
MISSING_SETTLEMENT
BANK_REFERENCE_MISMATCH
AMOUNT_MISMATCH
ONE_TO_MANY
MANY_TO_ONE
AMBIGUOUS_MATCH
SEMANTIC_DECOY
UNEXPLAINED_DELTA
CONFLICTING_EVIDENCE
HIGH_VALUE_ANOMALY
DATA_QUALITY_ERROR
OTHER

============================================================
19. GEMINI RESPONSE VALIDATION
============================================================

Validate:

JSON syntax

schema

classification

decision enum

confidence range

record IDs

referenced evidence

amount references

If Gemini returns malformed output:

Do NOT retry indefinitely.

Mark:

AI_RESPONSE_INVALID

Route:

REVIEW

Control Gate remains authoritative.

============================================================
20. GEMINI FAILURE RECOVERY
============================================================

Handle:

missing API key

timeout

network error

rate limit

server error

invalid JSON

invalid schema

hallucinated record ID

unsupported decision

invalid confidence

When Gemini is unavailable:

deterministic reconciliation continues.

AI-dependent cases become:

REVIEW

The system must remain operational.

============================================================
21. RAG
============================================================

Implement lightweight, useful RAG.

Do NOT build an unnecessarily complex vector database.

Create:

knowledge/

reconciliation_policy.md
settlement_policy.md
refund_policy.md
chargeback_policy.md
fee_policy.md
arivo_control_policy.md

Policies should contain actual rules used by Arivo.

For the small corpus, deterministic retrieval is acceptable.

Use:

keyword search
metadata
simple relevance scoring

or embeddings only if they provide a real benefit.

Do not add infrastructure merely to claim "RAG."

============================================================
22. RAG PIPELINE
============================================================

Question

↓

Retrieve relevant policy

↓

Collect actual financial evidence

↓

Gemini

↓

Grounded explanation

Every answer should be based on:

actual records

+
retrieved policy

The response should never invent financial facts.

============================================================
23. ASK ARIVO
============================================================

Build a focused finance copilot.

It is NOT a generic chatbot.

Example questions:

"Why is today's cash below expected?"

"Which settlements have unexplained differences above ₹10,000?"

"Why was SET_1029 not auto-matched?"

"How much is currently unresolved?"

"Which merchant has the highest unresolved exposure?"

Architecture:

USER QUESTION

↓

INTENT / QUERY ROUTER

↓

CONTROLLED DATA QUERY

↓

RELEVANT RECORDS

↓

POLICY RETRIEVAL

↓

GEMINI

↓

ANSWER + RECORD REFERENCES

Never allow arbitrary AI-generated SQL to directly execute.

Use controlled query operations.

============================================================
24. GROUNDED ANSWERS
============================================================

Ask Arivo responses should cite actual record IDs.

Example:

"Settlement SET_1821 has an unexplained ₹4,500 delta because
the expected settlement was ₹92,500 while the actual settlement
was ₹88,000. No refund, chargeback, fee, tax, or adjustment
currently explains the difference."

Then:

[View SET_1821]

The numbers must come from the backend.

============================================================
25. SYNTHETIC DATASET
============================================================

Generate realistic Indian payment-finance data.

Sources:

ledger.csv
payments.csv
settlements.csv
bank_statement.csv
refunds.csv
chargebacks.csv

Use:

INR

Date range:

2026-07-01 through 2026-09-02

Dataset tiers:

100 records — smoke

500 records — demo

5,000 records — benchmark

50,000 records — optional stress

Default seed:

20260902

Command:

python generate_dataset.py --rows 5000 --seed 20260902

Generation must be deterministic.

Same seed:

same dataset.

============================================================
26. DATA ANOMALIES
============================================================

Include:

CLEAN

REFERENCE TYPO

TIMING DIFFERENCE

FEE VARIANCE

TAX VARIANCE

REFUND

CHARGEBACK

DUPLICATE

MISSING PAYMENT

MISSING SETTLEMENT

BANK REFERENCE MISMATCH

ONE_TO_MANY

MANY_TO_ONE

AMBIGUOUS

SEMANTIC DECOY

HIGH_VALUE ANOMALY

UNEXPLAINED DELTA

Do not expose anomaly labels inside source records.

============================================================
27. COMBINED ANOMALIES
============================================================

Include difficult combinations:

TIMING + FEE

REFUND + TIMING

REFERENCE TYPO + GROUPED SETTLEMENT

DUPLICATE + SAME AMOUNT

CHARGEBACK + FEE

MISSING PAYMENT + BANK MATCH

HIGH VALUE + SMALL DELTA

AMBIGUOUS + HIGH VALUE

SEMANTIC DECOY + DUPLICATE

============================================================
28. ADVERSARIAL DATA
============================================================

Create look-alike records.

Example:

Payment A:
₹249,999
merchant_001
same date

Payment B:
₹249,999
merchant_001
same date

Bank transaction:

₹249,999

Only one is the true relationship.

Amount + date alone must NOT auto-match.

============================================================
29. HIGH-VALUE CASES
============================================================

Include transactions above:

₹50,000

₹100,000

₹250,000

₹500,000

₹1,000,000

High-value ambiguity requires stricter evidence.

============================================================
30. GROUND TRUTH
============================================================

Create hidden ground truth.

Include:

true relationships

true match groups

anomaly types

expected settlement

financial impact

expected decision

human-review requirement

Use:

dataset/ground_truth/

Do not expose ground truth to the reconciliation engine.

Do not use ground truth during prediction.

============================================================
31. HOLDOUT DATASET
============================================================

Create a hidden holdout set.

Minimum:

1,000 records.

Use:

different seed

different merchant distribution

different anomaly combinations

unseen combinations

The system must not access its labels.

============================================================
32. BENCHMARK
============================================================

Create:

evaluation/benchmark.py

Calculate:

precision

recall

F1

match rate

auto-resolution coverage

review rate

exception rate

false auto-match count

false auto-match rate

silent drops

value-weighted precision

value-weighted recall

value-weighted coverage

high-value false-match count

high-value false-match amount

exception classification accuracy

throughput

All numbers must be calculated.

NEVER hard-code benchmark results.

============================================================
33. BASELINE VS ARIVO
============================================================

Run two systems:

BASELINE:

deterministic reconciliation only

ARIVO:

deterministic reconciliation
+
Gemini investigation

Compare:

precision

recall

F1

auto-resolution

false matches

exception classification

AI contribution

If Gemini does not improve a metric:

report that honestly.

============================================================
34. AI SAFETY METRICS
============================================================

Report:

Unsafe auto-matches prevented

AI recommendations blocked

High-value blocks

Ambiguous cases routed to review

False auto-match count

False auto-match amount

Silent drops

These should be actual measured results.

============================================================
35. VALUE-WEIGHTED EVALUATION
============================================================

Do not judge only by number of records.

Report:

value-weighted precision

value-weighted recall

value-weighted coverage

unresolved financial exposure

false-match financial exposure

high-value false-match amount

This makes the evaluation financially meaningful.

============================================================
36. DEMO FIXTURES
============================================================

Create stable scenarios:

DEMO_CLEAN_001

DEMO_FUZZY_001

DEMO_GROUP_001

DEMO_REFUND_001

DEMO_EXCEPTION_001

DEMO_AMBIGUOUS_001

DEMO_HIGH_VALUE_001

DEMO_CONTROL_BLOCK_001

============================================================
37. DEMO CASES
============================================================

CASE 1:

Clean exact match.

Expected:

MATCHED

No Gemini required.

CASE 2:

Reference typo.

Expected:

MATCHED

CASE 3:

Grouped settlement.

Expected:

MATCHED

CASE 4:

Refund.

Expected:

Correct settlement waterfall.

CASE 5:

₹500 unexplained delta.

Expected:

EXCEPTION

CASE 6:

Two plausible candidates.

Expected:

REVIEW

CASE 7:

₹249,999 ambiguous transaction.

Gemini:

97% match recommendation

Control:

BLOCK

Arivo:

REVIEW

CASE 8:

Gemini recommends a match despite contradictory deterministic evidence.

Control:

BLOCK

Final:

REVIEW

This is the flagship demo.

============================================================
38. DEMO FALLBACK
============================================================

Judging environments can have API failures.

Create a safe demo fallback.

If Gemini is unavailable:

use deterministic demo fixtures.

Clearly label:

"Demo AI Fixture"

Do NOT pretend it was a live Gemini call.

The fixture must pass through:

schema validation

evidence validation

Control Gate

exactly like live Gemini output.

============================================================
39. UI DESIGN
============================================================

Use the supplied Razorpay Blade-inspired design system.

Arivo is its own product.

Do NOT falsely present it as an official Razorpay product.

Visual identity:

Developer-first financial canvas.

Precision infrastructure.

Dense financial UI.

Professional.

Technical.

Trustworthy.

============================================================
40. DESIGN TOKENS
============================================================

LIGHT:

background: #ffffff

foreground: #172b4d

brand: #0d94fb

muted: #5e6c84

border: #ebecf0

card: #ffffff

accent: #012652

success: #04db7c

DARK:

background: #070e1c

foreground: #f4f5f7

muted: #97a0af

border: #1c2536

card: #0f172a

accent: #0d94fb

Typography:

Muli, Inter, system-ui, sans-serif

Body:

14px

line-height:

1.5

Headings:

font-weight 700

letter-spacing -0.01em

Corners:

4px default

6px medium

12px large

Use centralized design tokens.

============================================================
41. UI VISUAL RULES
============================================================

Use:

thin borders

dense tables

compact controls

subtle shadows

clear status pills

monospace IDs

monospace financial values where useful

right-aligned amounts

clear typography hierarchy

functional colors

Avoid:

excessive gradients

huge cards

giant hero sections

excessive rounded corners

generic SaaS styling

fake AI sparkle effects

decorative animations

empty charts

============================================================
42. APPLICATION SHELL
============================================================

Sidebar:

ARIVO

Navigation:

Overview
Reconciliation
Exceptions
Settlements
Cash Position
Runs
Audit
Ask Arivo
Benchmark

Sidebar:

#012652

Active:

#0D94FB

============================================================
43. OVERVIEW
============================================================

The overview must answer:

"How healthy are the books and cash position?"

Metrics:

Processed

Matched

Review

Exceptions

₹ Reconciled

₹ Unexplained

Precision

Recall

F1

False Auto-Matches

Throughput

Cash Position

Expected

Settled

Bank Confirmed

Unexplained

High-risk exceptions

Rank exceptions by:

financial impact
+
risk
+
uncertainty

============================================================
44. RECONCILIATION PAGE
============================================================

Columns:

Payment ID

Order ID

Settlement ID

Bank ID

Amount

Difference

Match Method

AI Confidence

Risk

Status

Filters:

date

merchant

status

exception type

amount

confidence

high-value

Click a row:

open Evidence Drawer.

============================================================
45. EVIDENCE DRAWER
============================================================

This is one of the most important components.

Show:

PAYMENT

SETTLEMENT

BANK

LEDGER

Then:

MATCH EVIDENCE

Payment ID

Settlement ID

Amount

Currency

Date difference

Reference similarity

Financial waterfall

Then:

GEMINI INVESTIGATION

Then:

CONTROL GATE

Then:

FINAL ARIVO DECISION

============================================================
46. WHY MATCHED
============================================================

Show:

WHY MATCHED

Example:

MATCHED

98% AI confidence

✓ Payment ID exact
✓ Settlement ID exact
✓ Amount exact
✓ Currency exact
✓ Settlement arithmetic valid

Method:

EXACT_ID + FINANCIAL_VALIDATION

============================================================
47. WHY BLOCKED
============================================================

Show:

AUTO-MATCH BLOCKED

AI recommendation:

MATCH

AI confidence:

97%

Control:

BLOCKED

Reasons:

Multiple candidates

No unique identifier

High-value transaction

Conflicting evidence

Final:

REVIEW

============================================================
48. EXCEPTIONS PAGE
============================================================

Columns:

Priority

Exception Type

Amount

Merchant

Age

Confidence

Risk

Status

Sort primarily by financial risk.

High-value unresolved exposure must be easy to find.

============================================================
49. EXCEPTION DETAIL
============================================================

Show:

Exception type

Financial impact

Related records

Evidence

Settlement waterfall

Gemini investigation

Control failures

Recommended action

Human review

Actions:

Approve

Reject

Escalate

Add Note

Every human action must create an audit event.

============================================================
50. SETTLEMENTS
============================================================

Columns:

Settlement ID

Gross

Refunds

Chargebacks

Fees

Tax

Adjustments

Expected

Actual

Bank

Difference

Status

Click:

open settlement waterfall.

============================================================
51. CASH POSITION
============================================================

Show:

Expected cash

Settled cash

Bank-confirmed cash

Pending settlement

Unexplained cash

Refund exposure

Chargeback exposure

Visual:

Expected
↓
Settlement
↓
Bank
↓
Confirmed

============================================================
52. RUNS
============================================================

Show:

Run ID

Dataset

Records

Matched

Review

Exceptions

Precision

Recall

F1

Duration

Throughput

Run detail:

metrics

failures

exceptions

AI investigations

control results

============================================================
53. AUDIT
============================================================

For each decision:

timestamp

run_id

record_id

decision

confidence

method

control_result

Gemini_used

human_override

prompt_version

policy_version

Do not store chain-of-thought.

Store concise evidence summaries only.

============================================================
54. BENCHMARK UI
============================================================

Show:

Dataset

Records

Precision

Recall

F1

Auto-resolution

Review

Exceptions

False matches

Silent drops

Value-weighted metrics

Throughput

BASELINE

vs

ARIVO

Also show:

AI recommendations blocked

Unsafe automation prevented

============================================================
55. ASK ARIVO UI
============================================================

Provide:

suggested questions

chat/history area

structured answers

record references

View Record actions

Policy reference where relevant

Example:

Question:

"Why was SET_1821 blocked?"

Answer:

"SET_1821 was not auto-resolved because two payment candidates
have the same amount and date, while neither has a unique
identifier. Gemini recommended Candidate A with high confidence,
but the Control Gate blocked automation because the evidence
was not unique."

Then:

View SET_1821

============================================================
56. API
============================================================

Implement only required APIs.

Potential:

GET /api/health

GET /api/dashboard

POST /api/reconciliation/run

GET /api/reconciliation

GET /api/reconciliation/:id

GET /api/exceptions

GET /api/exceptions/:id

POST /api/exceptions/:id/resolve

GET /api/settlements

GET /api/settlements/:id

GET /api/cash

GET /api/runs

GET /api/runs/:id

GET /api/audit

GET /api/benchmark

POST /api/ask

POST /api/demo/:scenario

Adapt to the actual application architecture.

Do not create unnecessary endpoints.

============================================================
57. API QUALITY
============================================================

Use typed schemas.

Validate:

request bodies

query parameters

responses

Gemini responses

dataset inputs

Return useful error messages.

============================================================
58. HEALTH CHECK
============================================================

Create:

GET /api/health

Response:

{
  "status": "ok",
  "service": "arivo"
}

Where appropriate include:

environment

database readiness

Gemini availability

dataset status

Never expose secrets.

============================================================
59. DATABASE / STORAGE
============================================================

Use the simplest reliable persistence layer.

SQLite is acceptable for a hackathon if appropriate.

Do NOT introduce:

Kafka

Redis

Kubernetes

microservices

distributed event buses

or other infrastructure

unless absolutely necessary.

The application must remain easy to run locally.

============================================================
60. IDEMPOTENCY
============================================================

Repeated reconciliation must not create duplicate results.

Use:

run_id

source IDs

deterministic identifiers

or equivalent.

Same input:

same reconciliation result.

============================================================
61. OBSERVABILITY
============================================================

Every reconciliation run should expose:

Run ID

Start

End

Duration

Records processed

Deterministic cases

Gemini cases

Gemini failures

Matched

Review

Exception

Invalid

Throughput

============================================================
62. LOGGING
============================================================

Use useful structured logs.

Include:

timestamp

level

run_id

record_id

operation

duration

status

Never log:

API keys

tokens

passwords

secrets

unnecessary sensitive information

============================================================
63. FRONTEND QUALITY
============================================================

No:

console.log

debugger

placeholder data

broken links

unfinished routes

fake metrics

unused components

console errors

All screens must handle:

loading

success

empty

error

long IDs

large amounts

============================================================
64. BACKEND QUALITY
============================================================

Backend must:

start cleanly

validate config

validate inputs

handle errors

isolate Gemini

keep financial logic deterministic

pass tests

============================================================
65. DATASET VALIDATION
============================================================

Create:

validate_dataset.py

Validate:

schema

relationships

amounts

currencies

duplicates

settlement math

anomalies

ground truth consistency

population conservation

high-value cases

combined anomalies

Exit non-zero if invalid.

============================================================
66. TESTING
============================================================

Create tests for:

exact matching

normalized matching

fuzzy matching

grouped matching

one-to-many

many-to-one

refunds

chargebacks

fee calculation

tax calculation

settlement waterfall

duplicate prevention

ambiguous cases

high-value blocking

Control Gate

population conservation

Gemini schema validation

Gemini failure

benchmark metrics

Ask Arivo grounding

human resolution

audit events

============================================================
67. FIXTURES
============================================================

Create deterministic fixtures:

clean_case

fuzzy_case

grouped_case

refund_case

duplicate_case

ambiguous_case

high_value_case

control_block_case

gemini_failure_case

These must be easy to reproduce.

============================================================
68. FAILURE RECOVERY
============================================================

Implement and test:

Gemini unavailable

Gemini timeout

Gemini malformed JSON

Gemini invalid schema

multiple candidates

duplicate allocation

financial invariant failure

missing source

invalid dataset

database failure

For all cases:

fail safely.

Never silently convert uncertainty into success.

============================================================
69. FAILURE DOCUMENTATION
============================================================

Create:

FAILURES.md

Only document real failures encountered during development.

For each:

What broke?

Impact?

Root cause?

Fix?

Regression test?

Lesson?

Do not fabricate engineering failures.

============================================================
70. PRODUCTION REPOSITORY
============================================================

The final Git repository must be clean and professional.

Recommended:

arivo/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .gitignore
├── .env.example
├── .editorconfig
├── .gitattributes
├── LICENSE
├── README.md
├── ARCHITECTURE.md
├── DEMO_SCRIPT.md
├── EVALUATION.md
├── FAILURES.md
├── SECURITY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── Makefile
├── Dockerfile
├── docker-compose.yml
│
├── frontend/
├── backend/
├── reconciliation/
├── ai/
├── dataset/
├── knowledge/
├── evaluation/
├── tests/
└── scripts/

IMPORTANT:

Adapt this to the actual project.

Do not create artificial empty folders.

Do not create unnecessary architecture simply to match the tree.

============================================================
71. GITIGNORE
============================================================

Create a complete .gitignore for the actual stack.

Ignore:

.env
.env.local
.env.*.local

node_modules/

dist/
build/
.cache/
.vite/

__pycache__/
*.pyc

.venv/
venv/

.pytest_cache/
.mypy_cache/
.ruff_cache/

coverage/
htmlcov/

*.log
*.tmp
*.temp

.DS_Store

.idea/

local databases

generated runtime data

temporary benchmark output

AI request logs

credentials

private keys

certificates

IDE artifacts

Docker local overrides

Do not accidentally ignore source code.

============================================================
72. ENVIRONMENT
============================================================

Create:

.env.example

At minimum:

GEMINI_API_KEY=

APP_ENV=development

DATABASE_URL=

LOG_LEVEL=INFO

BACKEND_PORT=8000

FRONTEND_PORT=5173

Use the actual stack's variables.

Never commit:

.env

============================================================
73. SECURITY
============================================================

Create:

SECURITY.md

Document:

secret handling

Gemini API handling

data handling

logging

AI limitations

human review

financial controls

responsible disclosure

Never expose Gemini credentials in browser code.

============================================================
74. README
============================================================

README must be excellent.

Start with:

# Arivo

### AI Finance Controller

> Know where every rupee went — or know exactly why you don't.

Then explain:

Problem

Solution

Architecture

Gemini role

RAG

Control Gate

Settlement waterfall

Dataset

Benchmark

Demo

Setup

Testing

Security

Limitations

Future improvements

Include architecture diagram.

Clearly explain:

"Gemini investigates ambiguity.
Deterministic controls remain authoritative."

============================================================
75. QUICKSTART
============================================================

README must contain verified commands.

Example:

git clone ...

cd arivo

cp .env.example .env

# add GEMINI_API_KEY

make install

make dev

Commands must correspond exactly to the implementation.

Do not document commands that have not been tested.

============================================================
76. MAKEFILE
============================================================

Create useful commands:

make install

make dev

make test

make lint

make format

make typecheck

make generate-data

make validate-data

make reconcile

make benchmark

make verify

make clean

Every target must actually work.

============================================================
77. ONE-COMMAND VERIFICATION
============================================================

Create:

make verify

It must execute:

format checks

lint

type checks where applicable

unit tests

integration tests

dataset validation

reconciliation smoke test

benchmark smoke test

frontend build

backend verification

secret scan where practical

Exit non-zero if anything fails.

============================================================
78. CI
============================================================

Create:

.github/workflows/ci.yml

CI should run:

dependency installation

lint

typecheck

tests

dataset validation

frontend build

backend verification

Do not require live Gemini credentials for normal CI.

Use mocked Gemini responses for AI contract tests.

Optional AI integration tests may use GitHub secrets.

Never commit credentials.

============================================================
79. FORMATTERS / LINTERS
============================================================

Use tools appropriate to the actual stack.

Python:

ruff

black if appropriate

TypeScript:

eslint

prettier

Use committed config files.

Run checks in CI.

============================================================
80. DEPENDENCY HYGIENE
============================================================

Do not install libraries simply because they are popular.

Remove unused dependencies.

Avoid unnecessary:

frameworks

SDKs

databases

vector stores

UI libraries

AI frameworks

============================================================
81. PROMPT VERSIONING
============================================================

Store Gemini prompts separately.

Example:

ai/prompts/

investigate_exception.md

classify_exception.md

ask_arivo.md

Prompts must specify:

role

input schema

allowed decisions

allowed classifications

evidence rules

no hallucination

no invented record IDs

no authoritative arithmetic

structured output

============================================================
82. POLICY VERSIONING
============================================================

Policy documents should contain:

policy name

version

effective date

description

Store:

policy_version

with AI investigation records.

============================================================
83. AUDITABILITY
============================================================

For every AI investigation store:

case_id

run_id

model

prompt_version

policy_version

input evidence IDs

classification

recommendation

confidence

validation result

Control Gate result

final decision

Do not store chain-of-thought.

Store concise reasoning/evidence summaries.

============================================================
84. CONFIDENCE
============================================================

Call the displayed value:

AI confidence

Do NOT describe:

0.97

as:

"97% probability of correctness"

unless genuine calibration supports that interpretation.

If calibration is implemented:

document it.

============================================================
85. REPRODUCIBILITY
============================================================

Record:

dataset version

dataset seed

run ID

prompt version

policy version

model identifier

timestamp

Benchmark must be reproducible.

============================================================
86. PERFORMANCE
============================================================

The 5,000-record benchmark should run comfortably.

Do not invoke Gemini for every record.

Measure:

runtime

records/sec

AI investigations

AI failures

deterministic cases

All throughput claims must come from actual execution.

============================================================
87. NO SILENT MOCKING
============================================================

Never put fake metrics directly into frontend code.

Never fake Gemini responses in normal production/demo operation.

Fixtures are allowed only for:

tests

offline demo fallback

explicitly labeled demo scenarios

============================================================
88. HUMAN REVIEW
============================================================

Review UI must make human intervention understandable.

For every review:

Why was it not auto-resolved?

What evidence exists?

What conflicts?

What does Gemini recommend?

Why did the Control Gate block?

What action can the human take?

============================================================
89. HUMAN ACTION AUDIT
============================================================

When a user:

approves

rejects

escalates

adds note

record:

timestamp

user/action actor identifier if available

case_id

previous state

new state

reason/note

============================================================
90. DEMO SCRIPT
============================================================

Create:

DEMO_SCRIPT.md

Structure:

0:00 — Problem

0:30 — Arivo overview

1:00 — Clean match

1:20 — Fuzzy reference

1:40 — Grouped settlement

2:10 — Refund waterfall

2:40 — Real exception

3:10 — Gemini investigation

3:40 — High-value ambiguous case

4:00 — Gemini 97% recommendation

4:10 — Control Gate BLOCK

4:20 — Final REVIEW

4:30 — Ask Arivo

4:50 — Benchmark

5:00 — Closing statement

Closing:

"Arivo doesn't automate uncertainty away.
It makes uncertainty visible."

============================================================
91. JUDGE EXPERIENCE
============================================================

A judge should understand within minutes:

WHAT:

Finance reconciliation.

WHY:

Money is fragmented across systems.

AI:

Gemini investigates ambiguity.

CONTROL:

Rules prevent unsafe automation.

OUTPUT:

Matched / Review / Exception.

PROOF:

Measured benchmark.

This should be immediately visible.

============================================================
92. DESIGN THE FLAGSHIP MOMENT
============================================================

The flagship UI should be:

┌──────────────────────────────────────────────┐
│ ARIVO CONTROL GATE                           │
│                                              │
│ AI RECOMMENDATION                            │
│ MATCH                                        │
│ AI CONFIDENCE 97%                            │
│                                              │
│ ──────────────────────────────────────────── │
│                                              │
│ CONTROL RESULT                               │
│ BLOCKED                                      │
│                                              │
│ • Multiple candidates                        │
│ • No unique identifier                       │
│ • High-value transaction                     │
│ • Conflicting evidence                       │
│                                              │
│ ──────────────────────────────────────────── │
│                                              │
│ FINAL ARIVO DECISION                         │
│ REVIEW                                       │
│                                              │
│ Human verification required                  │
└──────────────────────────────────────────────┘

Make this excellent.

============================================================
93. ENGINEERING TRADEOFF
============================================================

Document this architectural decision:

Why no multi-agent swarm?

Because most reconciliation operations are deterministic.

AI adds the most value when:

evidence is ambiguous

references are messy

exceptions need classification

human-friendly explanation is needed

Therefore:

one targeted AI Investigator

instead of:

multiple autonomous agents.

============================================================
94. DELIBERATE NON-FEATURES
============================================================

Document why Arivo does NOT currently include:

multi-agent swarm

live production payment mutation

complex role management

enterprise authentication

giant vector database

microservices

real-time streaming architecture

arbitrary SQL generation

autonomous financial posting

These are deliberate safety/scope decisions.

============================================================
95. PRODUCTION CLEANUP
============================================================

Before completion:

remove:

console.log

debugger

temporary scripts

unused components

dead code

duplicate implementations

unused imports

unused dependencies

temporary datasets

local DBs

logs

screenshots not required

API keys

secrets

unfinished TODOs

fake data

broken links

============================================================
96. SECRET SCAN
============================================================

Search the entire repository for:

GEMINI_API_KEY=

AIza

private key patterns

password=

token=

secret=

AWS credentials

database passwords

connection strings

If any real secret is found:

remove it.

============================================================
97. GIT CHECK
============================================================

Run:

git status

Verify the working tree.

Check:

no .env

no node_modules

no virtual environment

no local DB

no credentials

no build artifacts

no massive generated files

no accidental secrets

============================================================
98. BUILD VERIFICATION
============================================================

Run:

frontend build

backend startup

tests

dataset generation

dataset validation

reconciliation

benchmark

Gemini mocked tests

Gemini live smoke test if credentials are available

============================================================
99. FINAL END-TO-END TEST
============================================================

From a clean setup:

1. Clone repository.
2. Copy .env.example.
3. Configure Gemini key.
4. Install.
5. Generate dataset.
6. Validate dataset.
7. Start application.
8. Open dashboard.
9. Run reconciliation.
10. Open clean case.
11. Open grouped settlement.
12. Open refund.
13. Open exception.
14. Open ambiguous case.
15. Observe Gemini.
16. Observe Control Gate.
17. Open cash position.
18. Ask Arivo.
19. Run benchmark.
20. Run tests.
21. Build frontend.
22. Check git status.

Everything must work.

============================================================
100. FINAL ACCEPTANCE CRITERIA
============================================================

ARIVO IS COMPLETE ONLY IF:

[ ] deterministic reconciliation works

[ ] grouped reconciliation works

[ ] settlement waterfall works

[ ] refunds work

[ ] chargebacks work

[ ] fee/tax calculations work

[ ] ambiguous cases route to review

[ ] high-value cases receive stricter controls

[ ] Gemini investigates ambiguous cases

[ ] Gemini responses are schema validated

[ ] RAG grounds explanations in policy

[ ] Ask Arivo uses actual data

[ ] Control Gate can override Gemini

[ ] no silent drops

[ ] no unsafe auto-matches in tested adversarial cases

[ ] benchmark produces real metrics

[ ] baseline vs Arivo comparison exists

[ ] value-weighted metrics exist

[ ] throughput is measured

[ ] failure recovery works

[ ] audit trail exists

[ ] frontend is polished

[ ] backend is reliable

[ ] tests pass

[ ] frontend builds

[ ] repository is clean

[ ] .gitignore is correct

[ ] .env.example exists

[ ] no secrets committed

[ ] README is complete

[ ] ARCHITECTURE.md exists

[ ] EVALUATION.md exists

[ ] DEMO_SCRIPT.md exists

[ ] FAILURES.md exists

[ ] SECURITY.md exists

[ ] CI exists

[ ] verification command works

============================================================
101. FINAL QUALITY BAR
============================================================

Before declaring success, ask:

Would a senior finance engineer trust this architecture?

Would a judge understand the AI contribution?

Can every important financial number be traced to source records?

Can we explain why something matched?

Can we explain why something was blocked?

Can we prove that Gemini adds value?

Can we prove when Gemini is not used?

Can we show measured accuracy?

Can we show unresolved exposure?

Can we demonstrate failure recovery?

Can another engineer clone and run this repository?

If the answer to any of these is no:

fix it before completion.

============================================================
102. FINAL PRODUCT MESSAGE
============================================================

The final product should communicate:

ARIVO

AI Finance Controller

"Know where every rupee went —
or know exactly why you don't."

AI investigates.

Rules verify.

Controls protect.

Arivo decides.

Humans resolve ambiguity.

============================================================
103. FINAL INSTRUCTION
============================================================

BUILD THE PRODUCT.

Do not merely plan it.

Do not only create documentation.

Do not create mock screens without backend functionality.

Do not create fake metrics.

Do not create fake AI.

Do not over-engineer.

Do not stop when the UI compiles.

Build:

DATA
→
NORMALIZATION
→
RECONCILIATION
→
SETTLEMENT WATERFALL
→
GEMINI INVESTIGATION
→
RAG
→
CONTROL GATE
→
FINAL DECISION
→
AUDIT
→
BENCHMARK
→
POLISHED UI

Then:

TEST IT.

BREAK IT.

FIX IT.

RUN IT AGAIN.

VERIFY IT.

CLEAN THE REPOSITORY.

Only then declare the implementation complete.

The winning principle is:

DO NOT BUILD THE MOST SOFTWARE.

BUILD THE MOST CREDIBLE FINANCE CONTROLLER.