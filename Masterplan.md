You are the principal engineer, product engineer, AI engineer, data engineer,
and QA lead responsible for completing ARIVO for the Razorpay AI Buildathon 2026,
Track 04 - AI Finance Controller.

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

"Know where every rupee went - or know exactly why you don't."

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

100 records - smoke

500 records - demo

5,000 records - benchmark

50,000 records - optional stress

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

> Know where every rupee went - or know exactly why you don't.

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

0:00 - Problem

0:30 - Arivo overview

1:00 - Clean match

1:20 - Fuzzy reference

1:40 - Grouped settlement

2:10 - Refund waterfall

2:40 - Real exception

3:10 - Gemini investigation

3:40 - High-value ambiguous case

4:00 - Gemini 97% recommendation

4:10 - Control Gate BLOCK

4:20 - Final REVIEW

4:30 - Ask Arivo

4:50 - Benchmark

5:00 - Closing statement

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

"Know where every rupee went -
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

# ARIVO - FINAL IMPLEMENTATION & UPGRADE PROMPT

## Role

You are the principal engineer, backend engineer, frontend engineer, AI engineer, data engineer, QA engineer, and product engineer responsible for completing **ARIVO**, an AI Finance Controller built for the **Razorpay AI Buildathon 2026 - Track 04**.

You are working inside an existing implementation.

Your job is **NOT** to rebuild the application from scratch.

Your job is to:

1. inspect the existing implementation,
2. understand what already works,
3. preserve the strongest parts,
4. integrate real Razorpay test-mode data as an additional source,
5. improve the product around real financial provenance,
6. strengthen reliability and demo safety,
7. improve the existing dashboard and investigation experience,
8. preserve the controlled synthetic benchmark,
9. prove measurable AI value,
10. leave the repository cleaner and more credible than before.

The final product should feel like a real finance-control product rather than a collection of hackathon features.

---

# 1. PRODUCT IDENTITY

Product:

**ARIVO**

Category:

**AI Finance Controller**

Primary positioning:

> **Know where every rupee went - or know exactly why you don't.**

Core philosophy:

> **AI investigates.
> Rules verify.
> Controls protect.
> Arivo decides.
> Humans resolve ambiguity.**

The product is fundamentally a financial reconciliation and control system.

It is NOT:

* a payment gateway,
* a payment collection system,
* a generic chatbot,
* an AI-only reconciliation engine,
* a collection of autonomous agents,
* a Razorpay API wrapper.

Razorpay is a financial data source.

Arivo remains the controller.

---

# 2. MOST IMPORTANT ARCHITECTURAL RULE

DO NOT replace the existing reconciliation engine with Razorpay-specific logic.

DO NOT put Razorpay API calls inside the reconciliation algorithms.

DO NOT allow Gemini to calculate authoritative financial amounts.

DO NOT allow Gemini to override the Control Gate.

DO NOT make the live Razorpay API the only data source.

DO NOT remove the synthetic benchmark pipeline.

The correct architecture is:

```text
                         DATA SOURCES
                              |
                 +------------+------------+
                 |                         |
                 v                         v
          Synthetic Data            Razorpay Test API
          CSV / Benchmark           Payments + Settlements
                 |                         |
                 +------------+------------+
                              |
                              v
                       INGESTION LAYER
                              |
                              v
                    NORMALIZATION LAYER
                              |
                              v
                       VALIDATION
                              |
                              v
                     DATA SNAPSHOT
                              |
                              v
                  DETERMINISTIC RECON
                              |
                    +---------+---------+
                    |                   |
                  CLEAR              UNCLEAR
                    |                   |
                    |                Gemini
                    |                   |
                    +---------+---------+
                              |
                              v
                        CONTROL GATE
                              |
               +--------------+--------------+
               |              |              |
               v              v              v
            MATCHED         REVIEW       EXCEPTION
               |              |              |
               +--------------+--------------+
                              |
                              v
                           SQLite
                              |
          +-------------------+--------------------+
          |                   |                    |
          v                   v                    v
       Overview          Evidence Drawer       Ask Arivo
          |
          +---- Cash Position
          +---- Cash Forecast
          +---- Unresolved Exposure
          +---- System Health
          +---- Data Source / Freshness
          +---- Benchmark / AI Contribution
```

This architecture must remain the central design.

---

# 3. FIRST STEP - INSPECT BEFORE MODIFYING

Before writing or changing code:

Inspect the entire repository.

Inspect:

* frontend structure,
* backend structure,
* database models,
* reconciliation engine,
* Control Gate,
* Gemini integration,
* API routes,
* current UI pages,
* Evidence Drawer,
* Ask Arivo,
* synthetic data generator,
* benchmark implementation,
* tests,
* environment variables,
* documentation,
* deployment configuration,
* error handling,
* existing Razorpay documentation,
* webhook documentation if present.

Do not blindly overwrite existing work.

Do not create duplicate implementations.

Do not create a second reconciliation engine.

Do not create a second Gemini integration.

Do not create parallel data models unless the existing model genuinely needs extension.

After inspection, produce an internal implementation plan based on the actual codebase.

Then implement.

---

# 4. CURRENT SYSTEM - PRESERVE THESE STRENGTHS

The existing system already has several important architectural strengths.

Preserve:

### Deterministic reconciliation

Deterministic logic should remain responsible for:

* exact identifiers,
* normalized identifiers,
* amount comparison,
* currency comparison,
* date windows,
* candidate generation,
* duplicate detection,
* grouped reconciliation where already implemented,
* settlement arithmetic,
* financial invariants,
* risk checks.

### Gemini

Gemini should remain responsible for:

* ambiguous cases,
* semantic interpretation,
* evidence interpretation,
* exception explanation,
* root-cause hypotheses,
* finance-friendly summaries,
* policy-oriented explanations.

Gemini must NOT:

* authorize money,
* calculate authoritative settlement values,
* bypass a failed control,
* convert a Control Gate BLOCK into MATCHED,
* invent record IDs,
* invent financial values.

### Control Gate

The Control Gate remains authoritative.

If:

```text
Control Gate = BLOCK
```

the final result cannot become:

```text
MATCHED
```

because Gemini is confident.

The system must preserve this invariant.

---

# 5. PRIMARY UPGRADE - RAZORPAY TEST-MODE DATA

Real Razorpay API access is now available.

This changes the implementation priority.

The highest-value integration is:

```text
Razorpay Test API
        |
        +--> Payments
        |
        +--> Settlements
        |
        v
Arivo Normalization
        |
        v
Existing Reconciliation Engine
```

Use Razorpay APIs only from the backend.

Never expose credentials to the frontend.

Credentials must be loaded from environment variables.

Expected configuration should follow this principle:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

Do not hard-code secrets.

Do not commit secrets.

Do not put credentials in frontend JavaScript.

Do not return secrets through API responses.

---

# 6. RAZORPAY INTEGRATION LAYER

Create a clean provider/integration boundary.

Preferred structure:

```text
backend/
    integrations/
        __init__.py
        razorpay/
            __init__.py
            client.py
            payments.py
            settlements.py
            normalizer.py
            errors.py
```

Adapt this structure to the actual repository rather than forcing it if a better existing structure already exists.

The integration should provide clean operations conceptually equivalent to:

```python
fetch_payments(...)
fetch_settlements(...)
```

The Razorpay-specific implementation must not leak throughout the application.

---

# 7. RAZORPAY CLIENT REQUIREMENTS

Implement a server-side Razorpay API client.

Requirements:

* authenticated server-side requests,
* configurable timeout,
* clear exception types,
* HTTP status handling,
* authentication failure handling,
* rate-limit handling,
* timeout handling,
* network failure handling,
* malformed response handling,
* pagination handling where required,
* retry only where safe,
* no infinite retries,
* structured logging without secrets,
* no sensitive credential leakage.

Never silently convert API failure into empty financial data.

Bad:

```text
Razorpay request failed
        ↓
payments = []
settlements = []
        ↓
reconciliation runs with zero data
```

Correct:

```text
Razorpay request failed
        ↓
SYNC_FAILED
        ↓
No reconciliation is started
        ↓
User sees explicit failure
        ↓
Previous valid snapshot remains available
```

---

# 8. PAGINATION IS REQUIRED

Do not assume a single Razorpay API response contains every record.

Implement pagination according to the API response semantics.

The system should report:

```text
pages fetched
records fetched
records normalized
records rejected
```

Example:

```text
Razorpay Sync

Pages fetched       4
Payments fetched    1,248
Settlements fetched    86
Normalized          1,334
Rejected               0
```

Do not silently drop records.

---

# 9. NORMALIZATION LAYER

This is one of the most important additions.

Never pass raw Razorpay JSON directly into reconciliation logic.

Create a normalized internal representation.

Conceptually:

```text
Razorpay Payment
        |
        v
PaymentNormalizer
        |
        v
Arivo Payment
```

and:

```text
Razorpay Settlement
        |
        v
SettlementNormalizer
        |
        v
Arivo Settlement
```

The normalized representation should contain the fields required by the existing reconciliation engine.

Preserve:

* provider ID,
* internal ID,
* amount,
* currency,
* status,
* timestamps,
* references,
* settlement information,
* relevant metadata,
* source information.

Monetary values must remain internally consistent with the existing application's minor-unit convention.

Do not introduce floating-point financial arithmetic.

Use integer minor units or an equivalent exact representation.

---

# 10. DATA PROVENANCE

Every imported record should carry source provenance.

At minimum, support concepts equivalent to:

```text
source
source_record_id
sync_id
fetched_at
```

Example:

```text
source: razorpay_test
source_record_id: pay_ABC123
sync_id: SYNC_20260903_1042
fetched_at: 2026-09-03T10:42:18
```

Synthetic records should similarly identify themselves as:

```text
source: synthetic
```

This provenance must survive through reconciliation.

A reconciliation case should be traceable to:

```text
Source
    ↓
Source Record
    ↓
Sync
    ↓
Reconciliation Run
    ↓
Case
    ↓
Decision
```

---

# 11. SYNC MUST BE SEPARATE FROM RECONCILIATION

Do not hide data fetching inside the reconciliation algorithm.

Create a conceptual lifecycle:

```text
SYNC
  ↓
SNAPSHOT
  ↓
RECONCILIATION RUN
```

A Razorpay sync should:

1. fetch payments,
2. fetch settlements,
3. normalize them,
4. validate them,
5. persist or stage the snapshot,
6. assign a sync ID,
7. expose sync statistics,
8. mark success/failure explicitly.

Then reconciliation operates against that snapshot.

This makes the process auditable and reproducible.

---

# 12. SYNC RECORD

If the current database architecture permits it cleanly, introduce a lightweight sync/run metadata structure.

Conceptually:

```text
sync_id
source
started_at
completed_at
status
payments_fetched
settlements_fetched
records_normalized
records_rejected
error_code
error_message
```

Do not overengineer this.

SQLite remains acceptable.

---

# 13. SOURCE SELECTOR UI

Add a clear data-source selector.

Example:

```text
DATA SOURCE

[ Synthetic Demo ]   [ Razorpay Test ]
```

Synthetic mode:

```text
Controlled benchmark data
Reproducible
Ground truth available
```

Razorpay mode:

```text
Razorpay Test Mode
External test data
No real money movement
```

Do not misleadingly call test data "production" or "live production data."

Use accurate language such as:

**Razorpay Test Mode**

or:

**Razorpay Test API**

---

# 14. RAZORPAY SYNC UI

Provide an explicit action:

```text
[ Sync Razorpay ]
```

After successful synchronization:

```text
Razorpay Test Mode
CONNECTED

Last successful sync
10:42:18

Payments
1,248

Settlements
86

Records normalized
1,334

[ Run Reconciliation ]
```

The UI must distinguish:

* syncing,
* successful,
* failed,
* stale,
* never synced.

---

# 15. API FAILURE UX

If Razorpay is unavailable:

Show something like:

```text
Razorpay Test API unavailable

Reason:
Request timed out.

No new reconciliation was started.

Last successful snapshot:
10:42:18

[ Retry ]
[ Use Demo Dataset ]
```

Never show:

```text
0 payments
0 settlements
₹0 unresolved
```

when the actual reason is an API failure.

This is a critical financial safety requirement.

---

# 16. LAST-KNOWN-GOOD SNAPSHOT

If practical within the existing architecture, maintain the last successful Razorpay snapshot.

If the latest API request fails:

```text
Latest sync
FAILED

Last successful snapshot
SYNC_0041

Status
AVAILABLE
```

Allow the user to explicitly choose whether to reconcile against the last successful snapshot.

Do not silently substitute stale data.

Clearly label it:

```text
LAST SUCCESSFUL SNAPSHOT
```

---

# 17. DO NOT REMOVE SYNTHETIC DATA

Synthetic data remains mandatory.

It is required for:

* deterministic demos,
* regression testing,
* benchmark evaluation,
* ground truth,
* AI contribution measurement,
* failure scenarios,
* reproducibility.

The existing synthetic generator must continue to work.

The final system must support:

```text
Synthetic Mode
```

and:

```text
Razorpay Test Mode
```

using the same downstream reconciliation engine.

---

# 18. BENCHMARK MUST REMAIN CONTROLLED

Do NOT use arbitrary Razorpay API data as the primary benchmark.

A live/test API response does not automatically provide hidden ground truth.

Benchmark:

```text
Synthetic controlled dataset
        ↓
Known ground truth
        ↓
Baseline
        ↓
Arivo
        ↓
Metrics
```

Measure:

* precision,
* recall,
* F1,
* false auto-matches,
* review rate,
* exception rate,
* auto-resolution rate,
* silent drops,
* financial exposure,
* high-value false matches,
* throughput.

If existing benchmark code supports these metrics, extend it rather than rewriting it.

---

# 19. PROVE AI VALUE

Do not merely show:

```text
Gemini confidence: 97%
```

That is not sufficient.

Show measurable AI contribution.

Compare:

```text
Deterministic Baseline
vs
Arivo + Gemini
```

Where possible, show:

* ambiguous cases,
* cases investigated by Gemini,
* correct Gemini recommendations,
* cases correctly routed to REVIEW,
* cases where Control Gate blocked unsafe AI recommendations,
* AI failures/fallbacks,
* false auto-matches prevented,
* financial exposure prevented.

The goal is to prove:

> AI helps investigate uncertainty without being allowed to compromise financial safety.

---

# 20. FLAGSHIP AI SAFETY DEMO

Preserve/create one especially strong demonstration case.

Scenario:

```text
High-value transaction
Multiple plausible candidates
Gemini recommends MATCH
Confidence: 97%
```

Then:

```text
Control Gate
BLOCK
```

because of one or more deterministic safety conditions such as:

* multiple candidates,
* high-value transaction,
* conflicting evidence,
* amount mismatch,
* other critical invariant failure.

Final:

```text
REVIEW
```

The product should make this visually obvious.

Recommended message:

> **The AI is confident. The system is not.**

This should become one of the central demo moments.

---

# 21. WHY GEMINI WAS / WAS NOT USED

Add a transparent indicator to reconciliation cases.

Examples:

```text
AI
Not required

Reason:
Unique identifier and financial controls were sufficient.
```

or:

```text
AI
Investigated

Reason:
Multiple candidate settlements required semantic analysis.
```

This demonstrates selective AI usage.

It also avoids giving the impression that every financial record is unnecessarily sent to an LLM.

---

# 22. UNRESOLVED FINANCIAL EXPOSURE

Make this a hero metric on Overview.

Calculate:

```text
REVIEW financial impact
+
EXCEPTION financial impact
=
UNRESOLVED FINANCIAL EXPOSURE
```

Display:

```text
UNRESOLVED EXPOSURE

₹44,300

REVIEW
₹31,500

EXCEPTION
₹12,800
```

Where possible, additionally show:

```text
High-value unresolved
₹...
```

This is more meaningful than merely showing case counts.

Do not fake this number.

It must come from actual backend data.

---

# 23. EVIDENCE DRAWER

Make the Evidence Drawer one of the strongest parts of the product.

It should provide a complete chain of evidence.

Recommended structure:

```text
CASE

Payment
pay_xxxxx

Settlement
setl_xxxxx

Source
Razorpay Test Mode

Sync
SYNC_0042

Reconciliation Run
RUN_0043
```

Then:

```text
MATCH EVIDENCE

Match method
EXACT_ID / FUZZY / GROUPED / ...

Candidate records
...

Identifier evidence
...

Amount evidence
...

Date evidence
...
```

Then:

```text
FINANCIAL WATERFALL

Gross
₹...

Refunds
₹...

Chargebacks
₹...

Fees
₹...

Tax
₹...

Adjustments
₹...

Expected net
₹...

Actual settlement
₹...

Unexplained delta
₹...
```

Then:

```text
AI INVESTIGATION

Recommendation
MATCH

Confidence
97%

Summary
...

Evidence cited
...
```

Then:

```text
CONTROL GATE

BLOCK

Reasons:
- Multiple candidates
- High-value case
- Conflicting evidence
```

Finally:

```text
FINAL ARIVO DECISION

REVIEW
```

The drawer must make it possible for a finance analyst to understand why the system reached its decision.

---

# 24. ASK ARIVO MUST USE REAL DATA

Improve Ask Arivo from a generic/static policy chatbot into a grounded finance query interface.

The architecture should be conceptually:

```text
User question
      ↓
Intent/query interpretation
      ↓
Controlled backend query
      ↓
Actual database records
      ↓
Relevant policy context
      ↓
Gemini explanation
      ↓
Answer + record references
```

Do NOT allow arbitrary AI-generated SQL.

The backend remains responsible for retrieving actual financial values.

---

# 25. ASK ARIVO EXAMPLES

Support questions such as:

```text
How much money is currently unresolved?
```

```text
Which settlement has the largest unexplained delta?
```

```text
Why is pay_xxxxx in review?
```

```text
How many high-value cases are unresolved?
```

```text
Show SET_1821.
```

The answer must use actual backend values.

Never fabricate numbers.

---

# 26. ASK ARIVO → EVIDENCE DRAWER

This interaction is especially important.

If the user asks:

```text
Show SET_1821
```

return:

```text
SET_1821

[ View Evidence ]
```

Clicking it must open the existing Evidence Drawer.

The drawer should show the actual settlement record and related reconciliation cases.

This creates:

```text
Natural language
      ↓
Financial record
      ↓
Evidence
      ↓
Decision
```

This is a much stronger demonstration than a generic chatbot response.

---

# 27. RUNS HISTORY

Add a Runs history view if it does not already exist.

Each run should expose:

```text
run_id
source
sync_id
timestamp
records processed
matched
review
exception
duration
throughput
AI investigations
AI failures
```

Example:

```text
RUN_0043

Source
Razorpay Test

Sync
SYNC_0042

Records
1,334

MATCHED
1,280

REVIEW
39

EXCEPTION
15

Duration
2.8 sec

AI investigations
74

AI failures
0
```

Runs should be reproducible and traceable.

---

# 28. RUN SOURCE COMPARISON

The Runs page should make it obvious that the same controller works against both sources.

Example:

```text
RUN_0043
Razorpay Test
1,334 records

RUN_0042
Synthetic Benchmark
1,000 records
```

This reinforces:

> Controlled benchmark + real provider data.

---

# 29. 7-DAY CASH FORECAST

After Razorpay ingestion is stable, implement the cash forecast.

This should be deterministic.

Do NOT call Gemini to calculate the forecast.

Use:

* pending settlements,
* settlement history,
* historical settlement lag,
* expected settlement dates,
* confidence based on historical behavior,
* current unresolved exposure where relevant.

Example:

```text
7-DAY CASH OUTLOOK

Today
₹8.42L confirmed

Tomorrow
₹0.74L expected

Day 2
₹0.52L expected

Day 3
₹0.61L expected

...
```

The methodology should be explainable.

---

# 30. CASH FORECAST MUST DISTINGUISH CONFIRMED VS EXPECTED

Never combine these into one number.

Show:

```text
CONFIRMED CASH
₹8.42L

EXPECTED SETTLEMENTS
₹2.17L

UNRESOLVED EXPOSURE
₹44K

7-DAY EXPECTED INFLOW
₹2.91L
```

This distinction is critical for finance users.

---

# 31. CONFIDENCE CALIBRATION

Only implement confidence calibration if the benchmark contains enough AI-labelled cases.

Do not make unsupported claims.

Do NOT write:

```text
97% probability this is correct
```

unless the metric has actually been calibrated and validated.

Prefer:

```text
AI confidence
97%
```

For calibration:

```text
Predicted confidence
vs
Observed accuracy
```

Where possible show:

* confidence bucket,
* number of cases,
* actual accuracy,
* calibration error.

If insufficient data exists, explicitly state:

```text
Calibration data insufficient
```

rather than inventing a chart.

---

# 32. EXCEPTION CSV EXPORT

Add a simple export action:

```text
[ Export Exceptions CSV ]
```

Export actual backend exception records.

Include useful fields such as:

```text
run_id
payment_id
settlement_id
status
match_method
financial_impact
ai_confidence
ai_recommendation
control_result
reason
source
sync_id
created_at
```

Do not generate fake export data.

---

# 33. SYSTEM HEALTH / CONTROL HEALTH

Add a compact system integrity panel.

Possible checks:

```text
CONTROL HEALTH

Population conservation       PASS
Settlement arithmetic         PASS
Duplicate allocation          PASS
Currency consistency          PASS
High-value protection         PASS
Unexplained delta protection  PASS
AI schema validation          PASS
```

If a check fails, show:

```text
BLOCKED
```

rather than hiding it.

This communicates that Arivo is a control system, not merely a prediction system.

---

# 34. RAZORPAY API HEALTH

Add a small provider status indicator.

Example:

```text
RAZORPAY TEST API

● Connected

Last successful sync
10:42:18
```

Failure:

```text
○ Unavailable

Last successful sync
10:42:18
```

Never use green for a failed or stale provider.

---

# 35. DATABASE CHANGES

Extend the current database minimally.

Do not replace SQLite.

Potential additions:

```text
syncs
```

or equivalent sync metadata.

Potential additions to reconciliation cases:

```text
source
source_record_id
sync_id
```

Potential additions to runs:

```text
source
sync_id
duration
records_processed
ai_cases
ai_failures
```

Use the existing SQLAlchemy architecture.

Do not introduce a second ORM.

Do not introduce a database server unless absolutely required.

---

# 36. IDEMPOTENCY

Razorpay syncing and reconciliation must be safe to repeat.

If the same source snapshot is fetched multiple times:

```text
do not create duplicate financial records
```

Repeated reconciliation of the same snapshot should produce consistent results.

Use stable source IDs.

For Razorpay:

```text
payment_id
settlement_id
```

should be treated as provider identifiers, not regenerated internal random IDs.

---

# 37. DUPLICATE PROTECTION

Explicitly test:

* duplicate payment,
* duplicate settlement,
* repeated sync,
* repeated reconciliation,
* duplicate allocation,
* same payment matched twice,
* same settlement allocated twice.

A financial controller must never silently duplicate money.

---

# 38. WEBHOOKS - OPTIONAL, NOT FIRST PRIORITY

If sufficient time remains after the core Razorpay API integration is stable, consider:

```text
POST /api/webhooks/razorpay
```

Verify:

```text
X-Razorpay-Signature
```

using the appropriate cryptographic verification method.

Support only the minimum useful events required for the demo.

Potential examples:

```text
payment.captured
settlement.processed
```

Webhook lifecycle:

```text
Razorpay
   ↓
Webhook
   ↓
Signature verification
   ↓
Event validation
   ↓
Persist event
   ↓
Update source snapshot/state
   ↓
Optional reconciliation trigger
```

Do not build a complete event-driven payments platform.

Do not implement payouts merely because the API exists.

Do not implement payment collection.

Do not implement unnecessary refunds/payout workflows unless they are directly required by the existing reconciliation architecture.

Webhooks are a bonus.

A stable Payments + Settlements API integration is more important.

---

# 39. RAZORPAY API SHOULD NOT CONTROL FINAL DECISIONS

The Razorpay API provides source data.

It does not determine:

```text
MATCHED
REVIEW
EXCEPTION
```

Arivo determines those through:

```text
Deterministic reconciliation
+
financial validation
+
Gemini investigation where needed
+
Control Gate
```

---

# 40. FRONTEND DESIGN

Preserve the existing professional finance dashboard.

The UI should feel:

* trustworthy,
* dense but readable,
* operational,
* modern,
* financial,
* evidence-oriented.

Avoid excessive:

* gradients,
* floating blobs,
* gimmicky animations,
* giant hero sections inside the application,
* decorative AI effects.

Use animation only where it improves feedback.

The existing project already has a Razorpay-inspired visual system. Reuse the existing design tokens and components instead of creating a competing visual language.

---

# 41. OVERVIEW PAGE

The Overview page should become the operational command center.

Recommended hierarchy:

```text
ARIVO
AI Finance Controller

Razorpay Test API
● Connected
Last sync: 10:42:18
```

Then:

```text
FINANCIAL CONTROL

Processed
1,334

Matched
1,280

Review
39

Exception
15
```

Then prominently:

```text
UNRESOLVED EXPOSURE

₹44,300
```

Then:

```text
CASH POSITION

Confirmed
₹8.42L

Expected
₹2.17L

Unexplained
₹44K
```

Then:

```text
7-DAY CASH OUTLOOK
...
```

Then:

```text
CONTROL HEALTH
...
```

Then:

```text
AI CONTRIBUTION
...
```

---

# 42. RECONCILIATION PAGE

Support filtering by:

* status,
* amount,
* confidence,
* high-value,
* source,
* match method,
* exception type.

Rows should clearly expose:

```text
Payment
Settlement
Status
Amount
Match method
AI
Control
Source
```

Clicking a row opens the Evidence Drawer.

---

# 43. EXCEPTIONS PAGE

Rank exceptions by financial significance.

Show:

```text
Highest financial impact first
```

Useful filters:

* high-value,
* exception type,
* source,
* amount,
* age,
* settlement,
* payment.

Provide:

```text
Export CSV
```

---

# 44. SETTLEMENTS PAGE

Show settlement-centric information.

Useful columns:

```text
Settlement ID
Source
Settlement date
Gross
Fees
Tax
Refunds
Chargebacks
Adjustments
Net
Bank/confirmed amount if available
Unexplained delta
Status
```

Click settlement:

```text
Evidence Drawer
```

This is particularly useful for Razorpay settlement demonstrations.

---

# 45. ASK PAGE

Ask Arivo should look like a finance analyst interface.

Show:

```text
Ask Arivo

Try:
• How much money is unresolved?
• Which settlement has the largest unexplained delta?
• Why is this payment in review?
• Show SET_1821
```

Answers must be grounded.

Show references.

Show clickable record IDs.

---

# 46. BENCHMARK PAGE

If benchmark UI exists or can be added cleanly:

```text
BENCHMARK

Dataset
Synthetic Holdout

Baseline
vs
Arivo
```

Show:

```text
Precision
Recall
F1
False auto-matches
Review rate
Exception rate
Throughput
```

Then:

```text
AI CONTRIBUTION

Ambiguous cases
...

Correct AI recommendations
...

AI recommendations blocked by Control Gate
...

Unsafe matches prevented
...

False auto-match exposure
₹0
```

Only show ₹0 if the benchmark actually supports that claim.

---

# 47. LIVE VS BENCHMARK MUST BE CLEAR

Do not mix metrics from different contexts.

Clearly label:

```text
BENCHMARK
Controlled synthetic data
Known ground truth
```

versus:

```text
LIVE / TEST DATA
Razorpay Test Mode
External API data
```

Do not calculate benchmark accuracy using data without ground truth.

---

# 48. ERROR HANDLING

Every major operation must have:

```text
Loading
Success
Empty
Error
```

states.

For Razorpay:

```text
Connecting...
```

```text
Connected
```

```text
Authentication failed
```

```text
Rate limited
```

```text
Request timed out
```

```text
Malformed provider response
```

Do not expose raw stack traces to the user.

Do not hide errors.

---

# 49. LOGGING

Logs should be useful for debugging.

Include:

```text
sync_id
run_id
source
operation
duration
record counts
error category
```

Never log:

* API secrets,
* authorization headers,
* credentials,
* full sensitive payloads unnecessarily.

---

# 50. TESTING REQUIREMENTS

Add tests before declaring the feature complete.

At minimum test:

### Razorpay client

* successful response,
* authentication error,
* rate limit,
* timeout,
* network error,
* malformed response,
* pagination.

### Normalizer

* valid payment,
* valid settlement,
* missing required field,
* invalid amount,
* invalid currency,
* malformed timestamp,
* provider-specific edge cases.

### Sync

* successful sync,
* repeated sync,
* partial failure,
* zero records,
* API unavailable,
* snapshot preservation.

### Reconciliation

* Razorpay normalized records reach existing engine,
* exact match,
* mismatch,
* ambiguous match,
* no match,
* grouped reconciliation where applicable,
* settlement waterfall,
* high-value case,
* Control Gate block.

### AI

* valid Gemini response,
* malformed response,
* unavailable Gemini,
* timeout,
* confidence handling,
* AI recommendation cannot bypass Control Gate.

### Ask Arivo

* actual unresolved amount,
* settlement lookup,
* payment lookup,
* nonexistent record,
* malicious/uncontrolled query,
* no fabricated financial values.

### Runs

* run creation,
* counts,
* duration,
* source,
* sync ID,
* repeated runs.

---

# 51. ADVERSARIAL TESTING

Explicitly test cases that could create dangerous false matches.

Examples:

```text
same amount
different payment IDs
different dates
multiple candidates
high-value amount
conflicting identifiers
duplicate settlement
settlement delta
wrong currency
```

The system must prefer:

```text
REVIEW
```

over an unsafe automatic match.

This is more important than maximizing match rate.

---

# 52. HIGH-VALUE CONTROL

Preserve the high-value protection.

A high-value ambiguous transaction must not automatically match merely because Gemini has high confidence.

Example:

```text
Amount
₹500,000+

Gemini
97% MATCH

Control Gate
BLOCK

Final
REVIEW
```

The exact threshold must follow the existing project's configured policy.

Do not arbitrarily introduce a conflicting threshold.

---

# 53. FINANCIAL INVARIANTS

Preserve and test:

### Population conservation

Every input record must have an accounted-for outcome.

### Settlement arithmetic

Expected and actual settlement calculations must remain internally consistent.

### Child allocation

Grouped records must sum exactly to the parent amount.

### Duplicate allocation

One settlement must not be incorrectly allocated to unrelated records.

### Currency

Currency must be compatible.

### Unexplained delta

Unexplained financial deltas must not silently auto-close.

### High-value ambiguity

High-value ambiguous records require review.

### Control Gate

AI cannot bypass a failed critical control.

---

# 54. CASH FORECAST SAFETY

Do not make the cash forecast appear more certain than it is.

Distinguish:

```text
confirmed
expected
estimated
unresolved
```

If historical confidence is weak, communicate that.

Do not let the forecast imply guaranteed future cash.

---

# 55. DOCUMENTATION UPDATES

After implementation, update documentation.

At minimum update:

```text
RAZORPAY.md
README.md
API.md
API_ENDPOINTS.md
ARCHITECTURE.md
BACKEND.md
DATABASE.md
ENVIRONMENT.md
ERROR_HANDLING.md
DEVELOPMENT.md
CHANGELOG.md
```

If webhook documentation exists, update it only if webhooks are actually implemented.

Documentation must reflect the actual implementation.

Do not leave statements such as:

```text
No Razorpay integration
```

after implementing it.

---

# 56. UPDATE RAZORPAY.md

Rewrite it from:

```text
Razorpay integration not implemented
```

into an accurate status document.

Include:

```text
Integration status
Supported APIs
Test-mode behavior
Data flow
Authentication
Environment variables
Normalization
Sync lifecycle
Failure handling
Snapshot behavior
Security
Limitations
Webhook status
```

Be honest about test mode.

Do not claim production integration if only test-mode integration exists.

---

# 57. README POSITIONING

The README should explain:

```text
Arivo can operate against:

1. controlled synthetic benchmark data
2. Razorpay Test API data
```

Then explain why both exist:

```text
Synthetic data provides reproducible evaluation.

Razorpay Test Mode demonstrates compatibility with a real payment-provider data source.
```

This is a strong engineering story.

---

# 58. DO NOT OVERCLAIM

Never say:

```text
Production Razorpay integration
```

unless production access actually exists and is supported.

Prefer:

```text
Razorpay Test Mode Integration
```

Never say:

```text
AI guarantees correctness
```

Say:

```text
AI investigates ambiguity; deterministic controls remain authoritative.
```

Never say:

```text
97% accurate
```

based solely on confidence.

Use actual benchmark metrics.

---

# 59. SECURITY

Ensure:

* secrets remain backend-only,
* `.env` is ignored by git,
* `.env.example` contains placeholders only,
* frontend never receives Razorpay secrets,
* errors don't leak credentials,
* logs don't contain credentials,
* webhook secrets are protected if webhooks are implemented,
* provider payloads are handled safely.

Do not add authentication/RBAC unless there is substantial remaining time and it does not threaten the core implementation.

For this hackathon, correctness and demo reliability are higher priority.

---

# 60. DO NOT ADD MULTI-AGENT ARCHITECTURE

Do not introduce multiple AI agents.

The current targeted Gemini investigator is sufficient.

The architecture should remain:

```text
Deterministic engine
       ↓
Gemini investigator when needed
       ↓
Control Gate
```

More agents do not automatically make the product better.

---

# 61. DO NOT BUILD A GIANT RAG SYSTEM

Ask Arivo needs controlled retrieval.

Do not introduce:

* giant vector databases,
* complex retrieval infrastructure,
* arbitrary semantic databases.

Use the existing policy/data retrieval architecture where possible.

The backend must control financial data retrieval.

---

# 62. DO NOT IMPLEMENT PAYMENT COLLECTION

Do not use Razorpay APIs to:

* create payments,
* collect money,
* initiate real transfers,
* trigger financial operations.

Arivo is a controller/reconciliation system.

Its role is to analyze and control financial records.

---

# 63. DO NOT IMPLEMENT UNNECESSARY RAZORPAY APIS

Prioritize:

```text
Payments
Settlements
```

Optional:

```text
Webhooks
```

Skip unless directly useful:

```text
Payouts
Payment collection
Unrelated operational APIs
```

Every additional external API creates another failure surface.

---

# 64. IMPLEMENTATION ORDER

Follow this order.

## Phase 1 - Inspection

Inspect existing code and documentation.

Do not modify yet.

---

## Phase 2 - Razorpay foundation

Implement:

```text
Razorpay client
Payments API
Settlements API
Authentication
Pagination
Timeouts
Errors
```

---

## Phase 3 - Normalization

Implement:

```text
Razorpay JSON
    ↓
Normalized Arivo records
```

Test thoroughly.

---

## Phase 4 - Sync/Snapshot

Implement:

```text
Sync
↓
Validation
↓
Snapshot
↓
sync_id
```

Add provenance.

---

## Phase 5 - Existing engine integration

Connect normalized Razorpay data to the existing reconciliation engine.

Do NOT rewrite the engine unless inspection proves a real incompatibility.

---

## Phase 6 - Reliability

Implement:

```text
API failure
timeout
rate limit
malformed data
last successful snapshot
clear UI errors
```

---

## Phase 7 - UI source selection

Add:

```text
Synthetic Demo
Razorpay Test
```

and:

```text
Sync Razorpay
```

---

## Phase 8 - Evidence provenance

Show:

```text
Source
Sync ID
Provider record ID
Run ID
```

in Evidence Drawer.

---

## Phase 9 - Unresolved exposure

Add the financial exposure KPI.

---

## Phase 10 - Ask Arivo grounding

Connect Ask Arivo to real backend records.

Implement:

```text
View SET_xxx
```

and:

```text
View pay_xxx
```

into Evidence Drawer.

---

## Phase 11 - Runs

Add run history and source/sync provenance.

---

## Phase 12 - Cash forecast

Implement deterministic 7-day forecast.

---

## Phase 13 - Benchmark / AI contribution

Improve benchmark visibility and AI lift measurement.

---

## Phase 14 - Confidence calibration

Only if benchmark data supports it.

---

## Phase 15 - CSV export

Add exception export.

---

## Phase 16 - Webhooks

Only if all previous phases are stable and there is meaningful time remaining.

---

# 65. DEMO FALLBACK STRATEGY

The application must NEVER depend entirely on the external Razorpay API for the demo.

The guaranteed fallback is:

```text
Synthetic Dataset
```

If Razorpay fails:

```text
Razorpay unavailable
        ↓
Do not crash
        ↓
Show error
        ↓
Allow Demo Dataset
        ↓
Existing deterministic pipeline
        ↓
Demo continues
```

This is mandatory.

The live integration is an enhancement, not a single point of demo failure.

---

# 66. FIVE-MINUTE DEMO FLOW

The final application should support this sequence naturally.

## 0:00 - Problem

Explain:

> Finance teams don't just need to know what matched. They need to know what did not match, why, how much money is exposed, and whether automation is safe.

---

## 0:30 - Razorpay connection

Show:

```text
Razorpay Test Mode
● Connected

Payments
1,248

Settlements
86
```

Click:

```text
Sync Razorpay
```

---

## 1:00 - Reconciliation

Show:

```text
1,334 records
1,280 matched
39 review
15 exceptions
```

---

## 1:30 - Clean case

Open a normal match.

Show:

```text
Razorpay source
Payment
Settlement
Exact match
Control Gate PASS
MATCHED
```

---

## 2:00 - Financial exception

Open a settlement with an unexplained delta.

Show:

```text
Gross
Fees
Tax
Refunds
Chargebacks
Expected
Actual
Delta
```

Final:

```text
EXCEPTION
```

---

## 2:30 - AI safety flagship

Show:

```text
Gemini
97% MATCH
```

Then:

```text
Control Gate
BLOCK
```

Then:

```text
Final
REVIEW
```

Say:

> **The AI is confident. The system is not.**

---

## 3:15 - Ask Arivo

Ask:

```text
How much money is currently unresolved?
```

Show actual amount.

Then:

```text
Show the largest unresolved settlement.
```

Click:

```text
View SET_xxx
```

Evidence Drawer opens.

---

## 4:00 - Cash forecast

Show:

```text
Confirmed cash
Expected settlements
7-day outlook
Unresolved exposure
```

---

## 4:30 - Benchmark

Show:

```text
Baseline
vs
Arivo
```

and:

```text
Precision
Recall
F1
False auto-match exposure
AI contribution
```

---

## 4:55 - Closing

Use:

> **Arivo doesn't automate uncertainty away. It makes uncertainty visible - and protects the money when AI isn't certain enough.**

---

# 67. QUALITY BAR

The final system must be:

* functional,
* reliable,
* reproducible,
* secure,
* measurable,
* explainable,
* testable,
* visually polished,
* demo-ready.

Do not optimize for number of features.

Optimize for:

1. correctness,
2. financial safety,
3. evidence,
4. real-data credibility,
5. measurable AI value,
6. demo reliability.

---

# 68. STOP CONDITIONS

Do NOT continue adding features if any of these are broken:

```text
Razorpay sync unreliable
```

```text
Synthetic benchmark broken
```

```text
Reconciliation regression
```

```text
Control Gate bypass possible
```

```text
Evidence Drawer broken
```

```text
Ask Arivo fabricates financial values
```

```text
Duplicate records possible
```

```text
API failure produces silent zero data
```

```text
Frontend contains fake metrics
```

```text
Existing tests fail
```

The product should become smaller and more reliable rather than larger and unstable.

---

# 69. FINAL ACCEPTANCE CHECKLIST

Before completion, verify:

## Razorpay

* [ ] Razorpay Test API credentials work
* [ ] Payments API works
* [ ] Settlements API works
* [ ] Pagination works
* [ ] Timeouts handled
* [ ] Authentication failures handled
* [ ] Rate limits handled
* [ ] Provider errors handled
* [ ] No secrets exposed
* [ ] Source provenance stored
* [ ] Sync IDs generated
* [ ] Last successful snapshot supported where implemented

## Reconciliation

* [ ] Razorpay data reaches existing engine
* [ ] Synthetic data still works
* [ ] Exact matching works
* [ ] Ambiguity works
* [ ] Settlement waterfall works
* [ ] Exceptions work
* [ ] High-value protection works
* [ ] Duplicate protection works
* [ ] Control Gate remains authoritative
* [ ] AI cannot bypass controls

## AI

* [ ] Gemini only used when appropriate
* [ ] AI response schema validated
* [ ] AI failures safely handled
* [ ] AI confidence clearly labelled
* [ ] AI contribution measurable
* [ ] No fabricated financial numbers

## UI

* [ ] Source selector
* [ ] Razorpay sync status
* [ ] Unresolved exposure
* [ ] Cash position
* [ ] Cash forecast
* [ ] Evidence Drawer
* [ ] Ask Arivo
* [ ] Ask Arivo → record → Evidence Drawer
* [ ] Runs history
* [ ] Benchmark
* [ ] Exception CSV export
* [ ] Error states
* [ ] Loading states
* [ ] Empty states
* [ ] No fake metrics
* [ ] No broken navigation

## Testing

* [ ] Existing tests pass
* [ ] New Razorpay tests pass
* [ ] Normalization tests pass
* [ ] Failure tests pass
* [ ] Idempotency tests pass
* [ ] Adversarial matching tests pass
* [ ] Benchmark runs
* [ ] Frontend builds
* [ ] Backend starts cleanly

## Documentation

* [ ] README updated
* [ ] RAZORPAY.md updated
* [ ] ARCHITECTURE.md updated
* [ ] BACKEND.md updated
* [ ] DATABASE.md updated
* [ ] API documentation updated
* [ ] ENVIRONMENT.md updated
* [ ] ERROR_HANDLING.md updated
* [ ] CHANGELOG.md updated
* [ ] Webhook documentation updated only if webhooks were actually implemented

---

# 70. FINAL PRODUCT PRINCIPLE

Do not lose sight of what makes Arivo different.

The goal is not:

> "We connected Razorpay APIs."

The goal is:

> **"Arivo can take real Razorpay financial data, reconcile it deterministically, investigate ambiguity with AI, prove the evidence, prevent unsafe AI decisions through a Control Gate, quantify unresolved financial exposure, and give finance teams a clear view of what money is settled, expected, or still unexplained."**

The final system should communicate:

```text
REAL DATA
    ↓
RECONCILIATION
    ↓
EVIDENCE
    ↓
AI INVESTIGATION
    ↓
CONTROL
    ↓
SAFE DECISION
    ↓
FINANCIAL VISIBILITY
```

And the central product message remains:

> **AI investigates.
> Rules verify.
> Controls protect.
> Arivo decides.
> Humans resolve ambiguity.**
