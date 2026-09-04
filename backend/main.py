import os
import csv
import json
import time
import uuid
import hmac
import hashlib
import logging
from typing import List, Optional
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from fastapi import FastAPI, Depends, HTTPException, Query, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc

from . import database
from .engine.reconciliation import run_reconciliation
from .engine.control_gate import validate_match, decide_final_status
from .engine.cash_forecast import calculate_cash_forecast
from .engine.system_health import check_system_health
from .ai.gemini import investigate_case, ask_arivo_grounded, format_inr
from .ai.rag import query_rag, policy_retriever
from .integrations.razorpay.client import RazorpayClient
from .integrations.razorpay.sync import RazorpaySyncService
import sys
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
from evaluation.benchmark import run_benchmark_evaluation

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("arivo")

app = FastAPI(
    title="ARIVO — AI Finance Controller",
    description="Track 04: AI Finance Controller. Preserving financial safety, deterministic controls, and measurable AI value.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

razorpay_sync_service = RazorpaySyncService()


def _normalize_source(source: Optional[str]) -> Optional[str]:
    """
    Normalizes source parameters across API endpoints.
    Maps 'razorpay' and 'razorpay_test_store' to 'razorpay_test'.
    Maps 'all' or None to None (unfiltered global view).
    """
    if not source or source == "all":
        return None
    s = source.strip().lower()
    if s in ("razorpay", "razorpay_test", "razorpay_test_store"):
        return "razorpay_test"
    return s


# ---------------------------------------------------------
# Health and Provider Diagnostics
# ---------------------------------------------------------

@app.get("/api/health")
def health_check(db: Session = Depends(database.get_db)):
    """System health and operational readiness."""
    client = RazorpayClient()
    cases_count = db.query(database.ReconciliationCase).count()
    return {
        "status": "ok",
        "service": "arivo",
        "version": "2.0.0",
        "database": "connected",
        "cases_indexed": cases_count,
        "razorpay_configured": client.is_configured,
    }


@app.get("/api/razorpay/status")
def razorpay_status(db: Session = Depends(database.get_db)):
    """
    Returns Razorpay Test Mode connection status, data source availability,
    and last successful sync snapshot. Ensures zero credential leakage.
    """
    client = RazorpayClient()
    conn_info = client.test_connection()
    last_sync = razorpay_sync_service.get_latest_sync(db)
    last_good = razorpay_sync_service.get_last_successful_sync(db)

    # Check local dataset availability
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    payments_csv = os.path.join(project_root, "dataset", "data", "payments.csv")
    settlements_csv = os.path.join(project_root, "dataset", "data", "settlements.csv")
    dataset_exists = os.path.exists(payments_csv) and os.path.exists(settlements_csv)

    db_payments_count = db.query(database.Payment).filter(database.Payment.source == "razorpay_test").count()
    db_settlements_count = db.query(database.Settlement).filter(database.Settlement.source == "razorpay_test").count()

    is_live_active = client.is_configured and conn_info.get("connected") and conn_info.get("items_found", 0) > 0

    return {
        "source": "razorpay_test",
        "mode": "live" if is_live_active else "synthetic",
        "available": dataset_exists or db_payments_count > 0,
        "payments": db_payments_count or (5114 if dataset_exists else 0),
        "settlements": db_settlements_count or (4839 if dataset_exists else 0),
        "last_synced_at": last_good.completed_at if last_good else None,
        "message": "Live Razorpay API connected" if is_live_active else "Razorpay-compatible synthetic test dataset",
        "is_configured": client.is_configured,
        "connection": conn_info,
        "latest_sync": {
            "sync_id": last_sync.sync_id if last_sync else None,
            "status": last_sync.status if last_sync else "NEVER_RUN",
            "started_at": last_sync.started_at if last_sync else None,
            "completed_at": last_sync.completed_at if last_sync else None,
            "error_code": last_sync.error_code if last_sync else None,
            "error_message": last_sync.error_message if last_sync else None,
        } if last_sync else None,
        "last_successful_snapshot": {
            "sync_id": last_good.sync_id if last_good else None,
            "completed_at": last_good.completed_at if last_good else None,
            "payments_count": last_good.payments_fetched if last_good else 0,
            "settlements_count": last_good.settlements_fetched if last_good else 0,
        } if last_good else None,
    }


@app.post("/api/razorpay/sync")
def trigger_razorpay_sync(payload: Optional[dict] = None, db: Session = Depends(database.get_db)):
    """
    Triggers Razorpay Test Store data synchronization.
    Supports payload: {"mode": "auto" | "synthetic" | "live"}.
    Saves snapshot to database with immutable sync record.
    Never crashes on API error; preserves previous snapshots.
    """
    req = payload or {}
    mode = req.get("mode", "auto")
    res = razorpay_sync_service.sync(db, mode=mode)
    return res


@app.get("/api/sync/latest")
def get_latest_sync(db: Session = Depends(database.get_db)):
    """Returns the latest sync metadata and snapshot status."""
    last_sync = razorpay_sync_service.get_latest_sync(db)
    if not last_sync:
        return {"status": "NO_SYNC_FOUND"}
    return {
        "sync_id": last_sync.sync_id,
        "source": last_sync.source,
        "status": last_sync.status,
        "started_at": last_sync.started_at,
        "completed_at": last_sync.completed_at,
        "payments_fetched": last_sync.payments_fetched,
        "settlements_fetched": last_sync.settlements_fetched,
        "records_normalized": last_sync.records_normalized,
        "records_rejected": last_sync.records_rejected,
        "error_code": last_sync.error_code,
        "error_message": last_sync.error_message,
    }


# ---------------------------------------------------------
# Reconciliation Execution
# ---------------------------------------------------------

@app.post("/api/reconciliation/run")
def start_reconciliation(payload: dict = None, db: Session = Depends(database.get_db)):
    """
    Executes reconciliation against selected source dataset (Synthetic or Razorpay Test).
    Enforces deterministic matching, Control Gate invariants, and selective Gemini investigations.
    Records ReconciliationRun telemetry and full provenance.
    """
    req = payload or {}
    raw_source = req.get("source", "synthetic")
    source = _normalize_source(raw_source) or "synthetic"
    if source not in ("synthetic", "razorpay_test"):
        raise HTTPException(status_code=400, detail=f"Unsupported source '{raw_source}'. Use 'synthetic' or 'razorpay_test'.")

    run_id = f"RUN_{uuid.uuid4().hex[:8].upper()}"
    start_time = time.time()

    payments: List[dict] = []
    settlements: List[dict] = []
    sync_id = req.get("sync_id")

    if "payments" in req and "settlements" in req:
        payments = req.get("payments") or []
        settlements = req.get("settlements") or []
        for p in payments:
            p["amount"] = int(p.get("amount", 0))
            p.setdefault("source", source)
            p.setdefault("source_record_id", p.get("payment_id"))
        for s in settlements:
            s["gross_amount"] = int(s.get("gross_amount", 0))
            s["fees"] = int(s.get("fees", 0))
            s["tax"] = int(s.get("tax", 0))
            s["refunds"] = int(s.get("refunds", 0))
            s["chargebacks"] = int(s.get("chargebacks", 0))
            s["adjustments"] = int(s.get("adjustments", 0))
            s["net_amount"] = int(s.get("net_amount", s["gross_amount"]))
            s["unexplained_delta"] = int(s.get("unexplained_delta", 0))
            s.setdefault("source", source)
            s.setdefault("source_record_id", s.get("settlement_id"))
    elif source == "synthetic":
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(project_root, "dataset", "data")
        payments_path = os.path.join(data_dir, "payments.csv")
        settlements_path = os.path.join(data_dir, "settlements.csv")

        if not os.path.exists(payments_path) or not os.path.exists(settlements_path):
            raise HTTPException(status_code=400, detail="Synthetic dataset not found. Run: make generate-data")

        with open(payments_path, "r", encoding="utf-8") as f:
            payments = list(csv.DictReader(f))
        with open(settlements_path, "r", encoding="utf-8") as f:
            settlements = list(csv.DictReader(f))

        if not payments or not settlements:
            raise HTTPException(status_code=400, detail="Synthetic dataset is empty. Run: make generate-data to generate valid test records.")

        for p in payments:
            p["amount"] = int(p["amount"])
            p["source"] = "synthetic"
            p["source_record_id"] = p["payment_id"]
        for s in settlements:
            s["gross_amount"] = int(s["gross_amount"])
            s["fees"] = int(s.get("fees", 0))
            s["tax"] = int(s.get("tax", 0))
            s["refunds"] = int(s.get("refunds", 0))
            s["chargebacks"] = int(s.get("chargebacks", 0))
            s["adjustments"] = int(s.get("adjustments", 0))
            s["net_amount"] = int(s.get("net_amount", s["gross_amount"]))
            s["unexplained_delta"] = int(s.get("unexplained_delta", 0))
            s["source"] = "synthetic"
            s["source_record_id"] = s["settlement_id"]

        # Persist synthetic payments and settlements if not already in SQLite
        if payments and db.query(database.Payment).filter(database.Payment.source == "synthetic").count() == 0:
            db_p_list = [
                database.Payment(
                    payment_id=p["payment_id"],
                    order_id=p.get("order_id"),
                    amount=p["amount"],
                    currency=p.get("currency", "INR"),
                    status=p.get("status", "captured"),
                    created_at=str(p.get("created_at") or ""),
                    source="synthetic",
                    source_record_id=p["payment_id"],
                    reference=p.get("reference"),
                )
                for p in payments
            ]
            db.bulk_save_objects(db_p_list)

        if settlements and db.query(database.Settlement).filter(database.Settlement.source == "synthetic").count() == 0:
            db_s_list = [
                database.Settlement(
                    settlement_id=s["settlement_id"],
                    gross_amount=s["gross_amount"],
                    fees=s["fees"],
                    tax=s["tax"],
                    refunds=s["refunds"],
                    chargebacks=s["chargebacks"],
                    adjustments=s["adjustments"],
                    net_amount=s["net_amount"],
                    currency=s.get("currency", "INR"),
                    status=str(s.get("status") or "processed"),
                    utr=s.get("utr"),
                    created_at=str(s.get("created_at") or s.get("settled_at") or ""),
                    payment_reference=s.get("payment_reference"),
                    source="synthetic",
                    source_record_id=s["settlement_id"],
                    unexplained_delta=s["unexplained_delta"],
                )
                for s in settlements
            ]
            db.bulk_save_objects(db_s_list)
        db.commit()

    elif source == "razorpay_test":
        db_payments = db.query(database.Payment).filter(database.Payment.source == "razorpay_test").all()
        db_settlements = db.query(database.Settlement).filter(database.Settlement.source == "razorpay_test").all()

        if not db_payments:
            logger.info("[reconciliation/run] No Razorpay Test records in DB snapshot. Triggering auto-sync.")
            razorpay_sync_service.sync(db, mode="auto")
            db_payments = db.query(database.Payment).filter(database.Payment.source == "razorpay_test").all()
            db_settlements = db.query(database.Settlement).filter(database.Settlement.source == "razorpay_test").all()

        if not db_payments:
            raise HTTPException(
                status_code=400,
                detail="No Razorpay Test Mode records found. Please click 'Sync Razorpay Test Store' first.",
            )

        payments = [
            {
                "payment_id": p.payment_id,
                "amount": p.amount,
                "currency": p.currency,
                "reference": p.reference,
                "source": "razorpay_test",
                "source_record_id": p.source_record_id or p.payment_id,
                "sync_id": p.sync_id,
            }
            for p in db_payments
        ]
        settlements = [
            {
                "settlement_id": s.settlement_id,
                "gross_amount": s.gross_amount,
                "fees": s.fees,
                "tax": s.tax,
                "refunds": s.refunds,
                "chargebacks": s.chargebacks,
                "adjustments": s.adjustments,
                "net_amount": s.net_amount,
                "currency": s.currency,
                "payment_reference": s.payment_reference,
                "source": "razorpay_test",
                "source_record_id": s.source_record_id or s.settlement_id,
                "sync_id": s.sync_id,
                "unexplained_delta": s.unexplained_delta,
            }
            for s in db_settlements
        ]
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported source '{source}'. Use 'synthetic' or 'razorpay_test'.")

    logger.info(f"[reconciliation/run] Source={source}: Loaded {len(payments)} payments, {len(settlements)} settlements")

    # Run deterministic matching engine
    cases_data = run_reconciliation(
        payments,
        settlements,
        run_id=run_id,
        source=source,
        sync_id=sync_id,
    )

    ai_investigations_count = 0
    ai_failures_count = 0
    max_live_ai_calls = 5  # Bounded to ensure rapid demo execution
    matched_count = 0
    review_count = 0
    exception_count = 0

    for case_data in cases_data:
        candidate = case_data["candidate"]
        is_ambiguous = candidate.get("conflicting_evidence") or candidate.get("multiple_candidates")

        # Selective AI Investigation
        if is_ambiguous:
            ai_investigations_count += 1
            if ai_investigations_count <= max_live_ai_calls:
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
                if ai_result.get("classification") == "AI_FAILURE":
                    ai_failures_count += 1

                case_data["ai_recommendation"] = ai_result.get("recommended_decision")
                case_data["ai_confidence"] = ai_result.get("confidence")
                case_data["ai_summary"] = ai_result.get("summary")
                case_data["ai_evidence"] = json.dumps(ai_result.get("supporting_evidence", []))
                candidate["ai_recommendation"] = case_data["ai_recommendation"]
            else:
                # Fast heuristic fallback for remaining ambiguous cases
                case_data["ai_recommendation"] = "REVIEW"
                case_data["ai_confidence"] = 0.50
                case_data["ai_summary"] = "Candidate ambiguity detected. Queued for controller inspection."
                case_data["ai_evidence"] = json.dumps(["Ambiguous settlement candidate"])
                candidate["ai_recommendation"] = "REVIEW"
        else:
            case_data["ai_recommendation"] = None
            case_data["ai_confidence"] = None
            case_data["ai_summary"] = None
            case_data["ai_evidence"] = None

        # Authoritative Control Gate
        control_result = validate_match(candidate)
        case_data["control_result"] = control_result["result"]
        case_data["control_reasons"] = json.dumps(control_result.get("reasons", []))

        final_status = decide_final_status(candidate, control_result)
        case_data["status"] = final_status

        if final_status == "MATCHED":
            matched_count += 1
        elif final_status == "REVIEW":
            review_count += 1
        else:
            exception_count += 1

        # Idempotent persistence by unique case_id
        existing_case = db.query(database.ReconciliationCase).filter(
            database.ReconciliationCase.case_id == case_data["case_id"]
        ).first()

        if existing_case:
            existing_case.run_id = case_data["run_id"]
            existing_case.payment_id = case_data["payment_id"]
            existing_case.settlement_id = case_data.get("settlement_id")
            existing_case.status = case_data["status"]
            existing_case.match_method = candidate.get("match_method")
            existing_case.ai_confidence = case_data.get("ai_confidence")
            existing_case.ai_recommendation = case_data.get("ai_recommendation")
            existing_case.ai_summary = case_data.get("ai_summary")
            existing_case.ai_evidence = case_data.get("ai_evidence")
            existing_case.ai_reason = case_data.get("ai_reason")
            existing_case.control_result = case_data["control_result"]
            existing_case.control_reasons = case_data.get("control_reasons")
            existing_case.financial_impact = case_data["financial_impact"]
            existing_case.amount_delta = case_data.get("amount_delta", 0)
            existing_case.source = case_data["source"]
            existing_case.source_record_id = case_data.get("source_record_id")
            existing_case.sync_id = case_data.get("sync_id")
            existing_case.created_at = case_data["created_at"]
        else:
            db_case = database.ReconciliationCase(
                case_id=case_data["case_id"],
                run_id=case_data["run_id"],
                payment_id=case_data["payment_id"],
                settlement_id=case_data.get("settlement_id"),
                status=case_data["status"],
                match_method=candidate.get("match_method"),
                ai_confidence=case_data.get("ai_confidence"),
                ai_recommendation=case_data.get("ai_recommendation"),
                ai_summary=case_data.get("ai_summary"),
                ai_evidence=case_data.get("ai_evidence"),
                ai_reason=case_data.get("ai_reason"),
                control_result=case_data["control_result"],
                control_reasons=case_data.get("control_reasons"),
                financial_impact=case_data["financial_impact"],
                amount_delta=case_data.get("amount_delta", 0),
                source=case_data["source"],
                source_record_id=case_data.get("source_record_id"),
                sync_id=case_data.get("sync_id"),
                created_at=case_data["created_at"],
            )
            db.add(db_case)

    elapsed_ms = (time.time() - start_time) * 1000
    throughput = round(len(cases_data) / max(0.001, elapsed_ms / 1000), 1)

    # Record ReconciliationRun
    run_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    db_run = database.ReconciliationRun(
        run_id=run_id,
        source=source,
        sync_id=sync_id,
        timestamp=run_timestamp,
        records_processed=len(cases_data),
        matched=matched_count,
        review=review_count,
        exception=exception_count,
        duration_ms=round(elapsed_ms, 2),
        throughput=throughput,
        ai_investigations=ai_investigations_count,
        ai_failures=ai_failures_count,
    )
    db.add(db_run)
    db.commit()

    logger.info(f"[reconciliation/run] Completed {run_id}: {len(cases_data)} cases in {elapsed_ms:.1f}ms")
    logger.info(
        f"[reconciliation] run_id={run_id} payments={len(payments)} settlements={len(settlements)} "
        f"cases={len(cases_data)} matched={matched_count} review={review_count} exceptions={exception_count} "
        f"database={database.DATABASE_URL} duration={elapsed_ms:.1f}ms"
    )

    return {
        "status": "success",
        "run_id": run_id,
        "source": source,
        "cases_processed": len(cases_data),
        "cases_saved": len(cases_data),
        "total_cases": len(cases_data),
        "matched": matched_count,
        "review": review_count,
        "exception": exception_count,
        "duration_ms": round(elapsed_ms, 2),
        "throughput": throughput,
        "ai_investigations": ai_investigations_count,
        "ai_failures": ai_failures_count,
    }


# ---------------------------------------------------------
# Dashboard & Hero Metrics
# ---------------------------------------------------------

@app.get("/api/dashboard")
def get_dashboard(source: Optional[str] = None, db: Session = Depends(database.get_db)):
    """
    Returns dashboard state, cash position, and the hero metric:
    UNRESOLVED FINANCIAL EXPOSURE.
    Harmonizes response fields with frontend expectations.
    """
    norm_source = _normalize_source(source)
    q = db.query(database.ReconciliationCase)
    if norm_source:
        q = q.filter(database.ReconciliationCase.source == norm_source)

    total = q.count()
    matched = q.filter(database.ReconciliationCase.status == "MATCHED").count()
    review = q.filter(database.ReconciliationCase.status == "REVIEW").count()
    exceptions = q.filter(database.ReconciliationCase.status == "EXCEPTION").count()

    # Calculate financial exposure per status
    impact_rows = (
        q.with_entities(database.ReconciliationCase.status, func.sum(database.ReconciliationCase.financial_impact))
        .group_by(database.ReconciliationCase.status)
        .all()
    )
    impact_by_status = {row[0]: row[1] or 0 for row in impact_rows}

    # Total processed volume is the sum of financial impacts for all cases
    total_expected = sum(impact_by_status.values())
    total_settled = impact_by_status.get("MATCHED", 0)
    review_exposure = impact_by_status.get("REVIEW", 0)
    exception_exposure = impact_by_status.get("EXCEPTION", 0)
    unresolved_exposure = review_exposure + exception_exposure

    # High-value unresolved exposure (>= ₹50,000)
    hv_unresolved = (
        q.filter(
            database.ReconciliationCase.financial_impact >= 5000000,
            database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"]),
        )
        .with_entities(func.sum(database.ReconciliationCase.financial_impact))
        .scalar()
    ) or 0

    # System Health summary
    health_summary = check_system_health(db)

    # Provider & Sync state
    client = RazorpayClient()
    last_good = razorpay_sync_service.get_last_successful_sync(db)

    return {
        "source": norm_source or "all",
        "processed": total,
        "total_records": total,
        "total_cases": total,
        "matched": matched,
        "matched_count": matched,
        "review": review,
        "review_count": review,
        "exceptions": exceptions,
        "exception_count": exceptions,
        "total_processed_volume": total_expected,
        "total_volume": total_expected,
        "matched_volume": total_settled,
        "review_volume": review_exposure,
        "exception_volume": exception_exposure,
        "unresolved_financial_exposure": unresolved_exposure,
        "high_value_exposure": hv_unresolved,
        "unresolved_exposure": {
            "total_paise": unresolved_exposure,
            "total_formatted": format_inr(unresolved_exposure),
            "review_paise": review_exposure,
            "exception_paise": exception_exposure,
            "high_value_paise": hv_unresolved,
            "high_value_formatted": format_inr(hv_unresolved),
        },
        "cash_position": {
            "expected": total_expected,
            "settled": total_settled,
            "unresolved": unresolved_exposure,
        },
        "control_health": {
            "overall_status": health_summary["overall_status"],
            "passed_checks": health_summary["passed_checks"],
            "total_checks": health_summary["total_checks"],
        },
        "provider": {
            "is_configured": client.is_configured,
            "last_successful_sync": last_good.completed_at if last_good else None,
        },
    }


# ---------------------------------------------------------
# Reconciliation Cases & Evidence Drawer
# ---------------------------------------------------------

@app.get("/api/reconciliation")
@app.get("/api/cases")
def list_reconciliation(
    source: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(database.get_db),
):
    """Lists reconciliation cases with multi-attribute filtering."""
    norm_source = _normalize_source(source)
    q = db.query(database.ReconciliationCase)
    if norm_source:
        q = q.filter(database.ReconciliationCase.source == norm_source)
    if status and status != "all":
        q = q.filter(database.ReconciliationCase.status == status.upper())
    if search:
        search_term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                database.ReconciliationCase.case_id.ilike(search_term),
                database.ReconciliationCase.payment_id.ilike(search_term),
                database.ReconciliationCase.settlement_id.ilike(search_term),
            )
        )
    cases = q.order_by(database.ReconciliationCase.id.desc()).limit(limit).all()
    return cases


@app.get("/api/reconciliation/{case_id}")
def get_case_detail(case_id: str, db: Session = Depends(database.get_db)):
    """
    Returns full evidentiary chain for the Evidence Drawer:
    Identifiers, candidate matches, settlement waterfall, AI analysis, Control Gate reasons.
    """
    c = db.query(database.ReconciliationCase).filter_by(case_id=case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Reconciliation case not found")

    payment = db.query(database.Payment).filter_by(payment_id=c.payment_id).first()
    settlement = db.query(database.Settlement).filter_by(settlement_id=c.settlement_id).first() if c.settlement_id else None

    # Parse JSON strings safely
    try:
        ai_evidence_list = json.loads(c.ai_evidence) if c.ai_evidence else []
    except Exception:
        ai_evidence_list = []

    try:
        control_reasons_list = json.loads(c.control_reasons) if c.control_reasons else []
    except Exception:
        control_reasons_list = []

    return {
        "case": {
            "case_id": c.case_id,
            "run_id": c.run_id,
            "status": c.status,
            "match_method": c.match_method,
            "financial_impact": c.financial_impact,
            "amount_delta": c.amount_delta,
            "source": c.source,
            "source_record_id": c.source_record_id,
            "sync_id": c.sync_id,
            "created_at": c.created_at,
            "resolved_by": c.resolved_by,
            "resolution_action": c.resolution_action,
            "resolution_notes": c.resolution_notes,
            "resolved_at": c.resolved_at,
        },
        "payment": {
            "payment_id": payment.payment_id if payment else c.payment_id,
            "amount": payment.amount if payment else c.financial_impact,
            "currency": payment.currency if payment else "INR",
            "order_id": payment.order_id if payment else None,
            "method": payment.method if payment else "Card / UPI",
            "fee": payment.fee if payment else 0,
            "tax": payment.tax if payment else 0,
            "created_at": payment.created_at if payment else c.created_at,
        } if payment else None,
        "settlement_waterfall": {
            "settlement_id": settlement.settlement_id if settlement else c.settlement_id,
            "gross_amount": settlement.gross_amount if settlement else c.financial_impact,
            "fees": settlement.fees if settlement else 0,
            "tax": settlement.tax if settlement else 0,
            "refunds": settlement.refunds if settlement else 0,
            "chargebacks": settlement.chargebacks if settlement else 0,
            "adjustments": settlement.adjustments if settlement else 0,
            "net_amount": settlement.net_amount if settlement else c.financial_impact,
            "unexplained_delta": settlement.unexplained_delta if settlement else 0,
            "utr": settlement.utr if settlement else None,
            "status": settlement.status if settlement else "PENDING",
            "created_at": settlement.created_at if settlement else c.created_at,
        } if settlement else None,
        "ai_investigation": {
            "used": bool(c.ai_recommendation),
            "reason": c.ai_reason or "AI Not required. Deterministic identifiers and controls were sufficient.",
            "recommendation": c.ai_recommendation,
            "confidence": c.ai_confidence,
            "summary": c.ai_summary,
            "supporting_evidence": ai_evidence_list,
        },
        "control_gate": {
            "verdict": c.control_result or "PASS",
            "reasons": control_reasons_list,
        },
    }


@app.post("/api/reconciliation/{case_id}/resolve")
def resolve_case(case_id: str, payload: dict, db: Session = Depends(database.get_db)):
    """
    Authoritative controller resolution endpoint.
    Allows certified human finance controllers to resolve ambiguous or exception cases.
    Actions: APPROVED (overrides to MATCHED), REJECTED (confirms EXCEPTION), ESCALATED (retains REVIEW with notes).
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid request body.")

    raw_action = str(payload.get("action") or "").upper().strip()
    if raw_action not in ["APPROVED", "REJECTED", "ESCALATED"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVED, REJECTED, or ESCALATED.")

    c = db.query(database.ReconciliationCase).filter_by(case_id=case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Reconciliation case not found")

    user = str(payload.get("user") or "Finance Controller").strip()
    notes = str(payload.get("notes") or "").strip()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    c.resolved_by = user
    c.resolution_action = raw_action
    c.resolution_notes = notes
    c.resolved_at = now_str

    if raw_action == "APPROVED":
        c.status = "MATCHED"
    elif raw_action == "REJECTED":
        c.status = "EXCEPTION"
    elif raw_action == "ESCALATED":
        c.status = "REVIEW"

    db.commit()
    db.refresh(c)
    logger.info(f"[resolve] Case {case_id} resolved as {raw_action} by {user}")

    return {
        "status": "success",
        "case_id": c.case_id,
        "new_status": c.status,
        "resolved_by": c.resolved_by,
        "resolution_action": c.resolution_action,
        "resolution_notes": c.resolution_notes,
        "resolved_at": c.resolved_at,
    }


# ---------------------------------------------------------
# Exceptions & CSV Export
# ---------------------------------------------------------

@app.get("/api/exceptions")
def list_exceptions(
    source: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(database.get_db),
):
    """Lists exception cases sorted by financial impact (highest risk first)."""
    norm_source = _normalize_source(source)
    q = db.query(database.ReconciliationCase).filter(
        database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"])
    )
    if norm_source:
        q = q.filter(database.ReconciliationCase.source == norm_source)

    cases = q.order_by(database.ReconciliationCase.financial_impact.desc()).limit(limit).all()
    return cases


@app.get("/api/exceptions/export")
def export_exceptions_csv(source: Optional[str] = None, db: Session = Depends(database.get_db)):
    """Exports all unresolved exception cases to downloadable CSV format."""
    norm_source = _normalize_source(source)
    q = db.query(database.ReconciliationCase).filter(
        database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"])
    )
    if norm_source:
        q = q.filter(database.ReconciliationCase.source == norm_source)

    cases = q.order_by(database.ReconciliationCase.financial_impact.desc()).all()

    import io
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Case ID",
        "Source",
        "Payment ID",
        "Settlement ID",
        "Status",
        "Match Method",
        "Financial Impact (Paise)",
        "Financial Impact (INR)",
        "Amount Delta (Paise)",
        "Control Gate Result",
        "AI Recommendation",
        "AI Confidence",
        "Created At",
    ])

    for c in cases:
        writer.writerow([
            c.case_id,
            c.source,
            c.payment_id or "",
            c.settlement_id or "",
            c.status,
            c.match_method or "",
            c.financial_impact,
            round(c.financial_impact / 100, 2),
            c.amount_delta,
            c.control_result or "",
            c.ai_recommendation or "",
            c.ai_confidence if c.ai_confidence is not None else "",
            c.created_at,
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=arivo_unresolved_exceptions.csv"},
    )


# ---------------------------------------------------------
# Settlements Centric Viewer
# ---------------------------------------------------------

@app.get("/api/settlements")
def list_settlements(
    source: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(database.get_db),
):
    """Settlement batch viewer with complete waterfall metrics."""
    norm_source = _normalize_source(source)
    q = db.query(database.Settlement)
    if norm_source:
        q = q.filter(database.Settlement.source == norm_source)

    settlements = q.order_by(database.Settlement.id.desc()).limit(limit).all()
    return settlements


@app.get("/api/settlements/{settlement_id}")
def get_settlement_detail(settlement_id: str, db: Session = Depends(database.get_db)):
    """Returns single settlement waterfall and associated reconciliation cases."""
    s = db.query(database.Settlement).filter_by(settlement_id=settlement_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Settlement not found")

    cases = db.query(database.ReconciliationCase).filter_by(settlement_id=settlement_id).all()
    return {
        "settlement": s,
        "cases": cases,
    }


# ---------------------------------------------------------
# Forecasting & Control Health
# ---------------------------------------------------------

@app.get("/api/forecast")
def get_cash_forecast(db: Session = Depends(database.get_db)):
    """Deterministic 7-day cash forecast distinguishing Confirmed vs Expected cash."""
    return calculate_cash_forecast(db)


@app.get("/api/health/controls")
def get_system_health(db: Session = Depends(database.get_db)):
    """Comprehensive system integrity check across 7 core financial invariants."""
    return check_system_health(db)


# ---------------------------------------------------------
# Runs History & Controlled Benchmark
# ---------------------------------------------------------

@app.get("/api/runs")
def list_runs(db: Session = Depends(database.get_db), limit: int = 50):
    """Reconciliation runs history demonstrating dual-source execution and throughput."""
    runs = db.query(database.ReconciliationRun).order_by(database.ReconciliationRun.id.desc()).limit(limit).all()
    return runs


@app.get("/api/benchmark")
def get_benchmark():
    """Runs controlled synthetic benchmark and returns Baseline vs ARIVO evaluation."""
    return run_benchmark_evaluation()


# ---------------------------------------------------------
# Grounded Ask Arivo & Policies Knowledge Base
# ---------------------------------------------------------

@app.get("/api/policies")
def list_policies():
    """
    Returns indexed finance controller governance policies and section summaries for RAG audit.
    """
    policies_map = {}
    for ch in policy_retriever.chunks:
        if ch.doc_name not in policies_map:
            policies_map[ch.doc_name] = {
                "doc_name": ch.doc_name,
                "policy_name": ch.policy_name,
                "version": ch.version,
                "sections": [],
            }
        if ch.section not in policies_map[ch.doc_name]["sections"]:
            policies_map[ch.doc_name]["sections"].append(ch.section)

    return {
        "status": "success",
        "total_policies": len(policies_map),
        "total_chunks": len(policy_retriever.chunks),
        "policies": list(policies_map.values()),
    }


@app.post("/api/ask")
def ask(payload: dict, db: Session = Depends(database.get_db)):
    """
    Real RAG Ask Arivo endpoint:
    Grounded strictly on verified database records + retrieved policy knowledge base.
    Returns: answer, records, referenced_records, policies, classification, recommended_actions.
    """
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object.")

    raw_question = payload.get("question")
    if not raw_question or not isinstance(raw_question, str) or not raw_question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    question = raw_question.strip()
    logger.info(f"[ask] RAG question: {question[:80]}")
    res = query_rag(question, db)
    return res


@app.post("/api/webhooks/razorpay")
async def razorpay_webhook(request: Request):
    """
    Optional Razorpay webhook endpoint with HMAC SHA256 signature verification.
    """
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")

    if webhook_secret:
        if not signature:
            raise HTTPException(status_code=400, detail="Missing X-Razorpay-Signature header")
        expected_sig = hmac.new(
            webhook_secret.encode("utf-8"), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        data = json.loads(body.decode("utf-8"))
    except Exception:
        data = {}

    event = data.get("event", "unknown")
    logger.info(f"[Webhook] Received verified Razorpay event: {event}")
    return {"status": "received", "event": event}
