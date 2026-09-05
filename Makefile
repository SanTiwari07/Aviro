.PHONY: install dev dev-backend dev-frontend test test-fast lint lint-backend lint-frontend typecheck build-frontend generate-data validate-data reconcile benchmark verify verify-links clean

install:
	python -m venv venv
	.\venv\Scripts\pip install -r backend\requirements.txt
	npm --prefix frontend install

dev-backend:
	.\venv\Scripts\uvicorn backend.main:app --reload --port 8000

dev-frontend:
	npm --prefix frontend run dev

dev:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals."

test:
	.\venv\Scripts\pytest backend/tests/ -v

test-fast:
	.\venv\Scripts\pytest backend/tests/test_production_hardening.py backend/tests/test_adversarial.py backend/tests/test_api_idempotency_and_boundaries.py backend/tests/test_benchmark_integrity.py backend/tests/test_cash_forecast.py backend/tests/test_gemini_failure_modes.py backend/tests/test_grouped_reconciliation.py backend/tests/test_ml_ranking.py backend/tests/test_normalizer.py backend/tests/test_razorpay_client.py backend/tests/test_reconciliation.py backend/tests/test_reconciliation_paths.py backend/tests/test_full_qa_pipeline.py -v

lint-backend:
	.\venv\Scripts\ruff check backend dataset evaluation scripts

lint-frontend:
	npm --prefix frontend run lint

lint: lint-backend lint-frontend

typecheck:
	npm --prefix frontend run typecheck

build-frontend:
	npm --prefix frontend run build

verify-links:
	.\venv\Scripts\python scripts/verify_markdown_links.py

generate-data:
	.\venv\Scripts\python dataset/generate_dataset.py --rows 5000 --seed 20260902

validate-data:
	.\venv\Scripts\python dataset/validate_dataset.py

reconcile:
	.\venv\Scripts\python scripts/run_reconciliation.py

benchmark:
	.\venv\Scripts\python evaluation/benchmark.py

verify: lint typecheck test-fast validate-data benchmark build-frontend verify-links
	@echo "=========================================================="
	@echo "ALL PRODUCTION READINESS VERIFICATION GATES PASSED CLEANLY"
	@echo "=========================================================="

clean:
	powershell -Command "if (Test-Path dataset/data) { Remove-Item -Recurse -Force dataset/data/* }; if (Test-Path frontend/dist) { Remove-Item -Recurse -Force frontend/dist }; Get-ChildItem -Path . -Include __pycache__ -Recurse -Directory | Remove-Item -Recurse -Force"
