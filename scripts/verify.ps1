# ARIVO Production Verification Suite for Windows / PowerShell
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         ARIVO PRODUCTION READINESS VERIFICATION          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Lint Backend
Write-Host "`n[Gate 1/8] Running Backend Ruff Lint..." -ForegroundColor Yellow
& .\venv\Scripts\ruff check backend dataset evaluation scripts
if ($LASTEXITCODE -ne 0) { throw "Backend lint failed." }

# 2. Lint Frontend
Write-Host "`n[Gate 2/8] Running Frontend ESLint..." -ForegroundColor Yellow
& npm --prefix frontend run lint
if ($LASTEXITCODE -ne 0) { throw "Frontend lint failed." }

# 3. Typecheck Frontend
Write-Host "`n[Gate 3/8] Running Frontend TypeScript Typecheck..." -ForegroundColor Yellow
& npm --prefix frontend run typecheck
if ($LASTEXITCODE -ne 0) { throw "Frontend typecheck failed." }

# 4. Pytest Test Suites
Write-Host "`n[Gate 4/8] Running Pytest Verification Suite..." -ForegroundColor Yellow
& .\venv\Scripts\pytest backend/tests/test_production_hardening.py backend/tests/test_adversarial.py backend/tests/test_api_idempotency_and_boundaries.py backend/tests/test_benchmark_integrity.py backend/tests/test_cash_forecast.py backend/tests/test_gemini_failure_modes.py backend/tests/test_grouped_reconciliation.py backend/tests/test_ml_ranking.py backend/tests/test_normalizer.py backend/tests/test_razorpay_client.py backend/tests/test_reconciliation.py backend/tests/test_reconciliation_paths.py backend/tests/test_full_qa_pipeline.py -v
if ($LASTEXITCODE -ne 0) { throw "Pytest suite failed." }

# 5. Dataset Validation
Write-Host "`n[Gate 5/8] Validating Ground Truth Dataset..." -ForegroundColor Yellow
& .\venv\Scripts\python dataset/validate_dataset.py
if ($LASTEXITCODE -ne 0) { throw "Dataset validation failed." }

# 6. Benchmark Evaluation
Write-Host "`n[Gate 6/8] Executing Benchmark Evaluation..." -ForegroundColor Yellow
& .\venv\Scripts\python evaluation/benchmark.py
if ($LASTEXITCODE -ne 0) { throw "Benchmark evaluation failed." }

# 7. Frontend Production Build
Write-Host "`n[Gate 7/8] Compiling Frontend Production Bundle..." -ForegroundColor Yellow
& npm --prefix frontend run build
if ($LASTEXITCODE -ne 0) { throw "Frontend production build failed." }

# 8. Documentation Link Verification
Write-Host "`n[Gate 8/8] Verifying Internal Markdown Documentation Links..." -ForegroundColor Yellow
& .\venv\Scripts\python scripts/verify_markdown_links.py
if ($LASTEXITCODE -ne 0) { throw "Markdown link verification failed." }

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "ALL 8 PRODUCTION READINESS GATES PASSED CLEANLY" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
