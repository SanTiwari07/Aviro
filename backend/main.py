import os
import csv
import logging
from typing import List

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import database
from .engine.reconciliation import run_reconciliation
from .engine.control_gate import validate_match, decide_final_status
from .ai.gemini import investigate_case, ask_arivo

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("arivo")

app = FastAPI(title="ARIVO Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "arivo"}


@app.post("/api/reconciliation/run")
def start_reconciliation(db: Session = Depends(database.get_db)):
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(project_root, "dataset", "data")

    payments_path = os.path.join(data_dir, "payments.csv")
    settlements_path = os.path.join(data_dir, "settlements.csv")

    if not os.path.exists(payments_path):
        raise HTTPException(status_code=400, detail="Dataset not found. Run: make generate-data")

    with open(payments_path, "r") as f:
        payments = list(csv.DictReader(f))
    with open(settlements_path, "r") as f:
        settlements = list(csv.DictReader(f))

    for p in payments:
        p["amount"] = int(p["amount"])
    for s in settlements:
        s["gross_amount"] = int(s["gross_amount"])

    logger.info(f"[reconciliation/run] Loaded {len(payments)} payments, {len(settlements)} settlements")

    cases_data = run_reconciliation(payments, settlements)
    logger.info(f"[reconciliation/run] Generated {len(cases_data)} cases")

    saved = 0
    for case_data in cases_data:
        candidate = case_data["candidate"]

        # Route ambiguous cases to Gemini
        if candidate.get("conflicting_evidence") or candidate.get("multiple_candidates"):
            ai_result = investigate_case({
                "payment_id": case_data["payment_id"],
                "settlement_id": case_data.get("settlement_id"),
                "amount": case_data["amount"],
                "match_method": candidate.get("match_method"),
                "amount_delta": candidate.get("amount_delta"),
                "multiple_candidates": candidate.get("multiple_candidates"),
                "high_value": candidate.get("high_value"),
                "conflicting_evidence": candidate.get("conflicting_evidence"),
            })
            case_data["ai_recommendation"] = ai_result.get("recommended_decision")
            case_data["ai_confidence"] = ai_result.get("confidence")
            candidate["ai_recommendation"] = case_data["ai_recommendation"]
        else:
            case_data["ai_recommendation"] = None
            case_data["ai_confidence"] = None

        control_result = validate_match(candidate)
        case_data["control_result"] = control_result["result"]

        final_status = decide_final_status(candidate, control_result)
        case_data["status"] = final_status

        # Upsert by case_id to avoid duplicate key on re-runs
        existing = db.query(database.ReconciliationCase).filter_by(case_id=case_data["case_id"]).first()
        if not existing:
            db_case = database.ReconciliationCase(
                case_id=case_data["case_id"],
                run_id=case_data["run_id"],
                payment_id=case_data["payment_id"],
                settlement_id=case_data.get("settlement_id"),
                status=case_data["status"],
                match_method=candidate.get("match_method"),
                ai_confidence=case_data.get("ai_confidence"),
                ai_recommendation=case_data.get("ai_recommendation"),
                control_result=case_data["control_result"],
                financial_impact=case_data["financial_impact"],
                created_at=case_data["created_at"],
            )
            db.add(db_case)
            saved += 1

    db.commit()
    logger.info(f"[reconciliation/run] Saved {saved} new cases")

    return {"status": "success", "cases_processed": len(cases_data), "cases_saved": saved}


@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(database.get_db)):
    total = db.query(database.ReconciliationCase).count()
    matched = db.query(database.ReconciliationCase).filter(
        database.ReconciliationCase.status == "MATCHED"
    ).count()
    review = db.query(database.ReconciliationCase).filter(
        database.ReconciliationCase.status == "REVIEW"
    ).count()
    exceptions = db.query(database.ReconciliationCase).filter(
        database.ReconciliationCase.status == "EXCEPTION"
    ).count()

    # Cash position: sum financial_impact per status
    from sqlalchemy import func
    impact_rows = (
        db.query(database.ReconciliationCase.status, func.sum(database.ReconciliationCase.financial_impact))
        .group_by(database.ReconciliationCase.status)
        .all()
    )
    impact_by_status = {row[0]: row[1] or 0 for row in impact_rows}

    total_expected = sum(impact_by_status.values())
    total_settled = impact_by_status.get("MATCHED", 0)
    total_unexplained = impact_by_status.get("EXCEPTION", 0) + impact_by_status.get("REVIEW", 0)

    return {
        "processed": total,
        "matched": matched,
        "review": review,
        "exceptions": exceptions,
        "cash_position": {
            "expected": total_expected,
            "settled": total_settled,
            "unexplained": total_unexplained,
        }
    }


@app.get("/api/reconciliation")
def list_reconciliation(db: Session = Depends(database.get_db), limit: int = 100):
    cases = db.query(database.ReconciliationCase).order_by(
        database.ReconciliationCase.id.desc()
    ).limit(limit).all()
    return cases


@app.post("/api/ask")
def ask(payload: dict):
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    context = (
        "ARIVO Policy: Unexplained deltas must always be routed to EXCEPTION. "
        "Ambiguous matches above 50,000 INR require manual REVIEW. "
        "High-value transactions (>500,000 INR) are always blocked by the Control Gate. "
        "MATCHED status means a deterministic exact-ID match with zero amount delta passed all controls. "
        "REVIEW means the Control Gate blocked the match for manual inspection. "
        "EXCEPTION means no match was found or the match failed critical financial validation."
    )

    logger.info(f"[ask] question={question[:80]!r}")
    answer = ask_arivo(question, context)
    return {"answer": answer}
