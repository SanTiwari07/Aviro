.PHONY: install dev test lint format typecheck generate-data validate-data reconcile benchmark verify clean

install:
	python -m venv venv
	.\venv\Scripts\pip install -r backend\requirements.txt
	cd frontend && npm install

dev-backend:
	.\venv\Scripts\uvicorn backend.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals."

test:
	cd backend && pytest

lint:
	cd backend && ruff check .
	cd frontend && npm run lint

format:
	cd backend && ruff format .
	cd frontend && npm run format

typecheck:
	cd frontend && npm run typecheck

generate-data:
	.\venv\Scripts\python dataset/generate_dataset.py --rows 5000 --seed 20260902

validate-data:
	.\venv\Scripts\python dataset/validate_dataset.py

reconcile:
	.\venv\Scripts\python scripts/run_reconciliation.py

benchmark:
	.\venv\Scripts\python evaluation/benchmark.py

verify: format lint typecheck test validate-data
	@echo "Verification passed."

clean:
	rm -rf dataset/data/*
	rm -rf dataset/ground_truth/*
	rm -rf backend/*.sqlite
	rm -rf frontend/dist
	find . -type d -name "__pycache__" -exec rm -rf {} +
