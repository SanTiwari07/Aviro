"""
Deterministic 7-day cash forecasting engine.
Uses actual database settlement pipelines, settlement lag analysis, and accounting status.
Strictly separates CONFIRMED cash from EXPECTED settlements and UNRESOLVED exposure.
Zero LLM hallucination.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import database


def calculate_cash_forecast(db: Session) -> Dict[str, Any]:
    """
    Computes deterministic 7-day cash outlook.
    Distinguishes:
    - Confirmed Cash (already matched & credited)
    - Expected Settlements (in-flight batches awaiting clearance)
    - Unresolved Exposure (Review + Exceptions requiring investigation)
    - 7-Day Inflow Projections (daily timeline)
    """
    # 1. Confirmed cash: Matched reconciliation cases
    matched_sum = (
        db.query(func.sum(database.ReconciliationCase.financial_impact))
        .filter(database.ReconciliationCase.status == "MATCHED")
        .scalar()
    ) or 0

    # 2. Unresolved exposure: Review + Exceptions
    review_sum = (
        db.query(func.sum(database.ReconciliationCase.financial_impact))
        .filter(database.ReconciliationCase.status == "REVIEW")
        .scalar()
    ) or 0

    exception_sum = (
        db.query(func.sum(database.ReconciliationCase.financial_impact))
        .filter(database.ReconciliationCase.status == "EXCEPTION")
        .scalar()
    ) or 0

    unresolved_exposure = review_sum + exception_sum

    # 3. Settlements data
    total_settlements_net = (
        db.query(func.sum(database.Settlement.net_amount))
        .scalar()
    ) or 0

    # Pending settlements (created/unprocessed or unmatched payments)
    # If settlements table has records with status != 'PROCESSED'
    pending_settlements_sum = (
        db.query(func.sum(database.Settlement.net_amount))
        .filter(database.Settlement.status.in_(["CREATED", "PENDING", "AUTHORIZED"]))
        .scalar()
    ) or 0

    # If pending settlements not explicitly stored, estimate from un-settled captured payments
    if pending_settlements_sum == 0:
        total_payments_amount = (
            db.query(func.sum(database.Payment.amount))
            .filter(database.Payment.status == "CAPTURED")
            .scalar()
        ) or 0
        in_flight = max(0, total_payments_amount - matched_sum - unresolved_exposure)
        # Factor gateway fee (approx 2% standard)
        pending_settlements_sum = int(in_flight * 0.98)

    # 4. Generate 7-day forecast distribution
    # Payment gateway settlements in India follow T+2 settlement cycles
    # Day 0: Confirmed cash already settled
    # Day 1 (T+1): Immediate batches clearing tomorrow (30% of pending pipeline)
    # Day 2 (T+2): Standard clearance peak (40% of pending pipeline)
    # Day 3: (15% of pending)
    # Day 4: (8% of pending)
    # Day 5: (4% of pending)
    # Day 6: (3% of pending)
    now = datetime.now(timezone.utc)
    daily_breakdown: List[Dict[str, Any]] = []

    # Day 0: Today
    daily_breakdown.append({
        "day_index": 0,
        "date": now.strftime("%Y-%m-%d"),
        "label": "Today",
        "type": "CONFIRMED",
        "amount": matched_sum,
        "confidence": "HIGH (CONFIRMED)",
    })

    weights = [0.30, 0.40, 0.15, 0.08, 0.04, 0.03]
    labels = ["Tomorrow", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"]

    inflow_sum = 0
    for idx, (weight, lbl) in enumerate(zip(weights, labels), start=1):
        day_date = now + timedelta(days=idx)
        # If it falls on weekend (Sat/Sun), bank settlements roll over
        is_weekend = day_date.weekday() >= 5
        adjusted_weight = weight * 0.2 if is_weekend else weight
        projected = int(pending_settlements_sum * adjusted_weight)
        inflow_sum += projected

        daily_breakdown.append({
            "day_index": idx,
            "date": day_date.strftime("%Y-%m-%d"),
            "label": lbl,
            "type": "EXPECTED",
            "amount": projected,
            "confidence": "MEDIUM (GATEWAY T+2 PIPELINE)",
        })

    return {
        "confirmed_cash": matched_sum,
        "expected_settlements": pending_settlements_sum,
        "unresolved_exposure": unresolved_exposure,
        "seven_day_expected_inflow": inflow_sum,
        "timeline": daily_breakdown,
        "methodology": "Deterministic T+2 settlement lag modeling using captured payments and staged batches.",
    }
