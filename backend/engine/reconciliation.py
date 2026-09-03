import uuid
from typing import List, Dict, Any
from datetime import datetime

def run_reconciliation(payments: List[Dict[str, Any]], settlements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deterministic reconciliation engine.
    Matches payments to settlements.
    Generates candidates and routes to Control Gate or AI.
    """
    cases = []
    run_id = f"RUN_{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Simple hash for quick lookup
    settlements_by_ref = {s["payment_reference"]: s for s in settlements}
    
    for p in payments:
        case = {
            "case_id": f"CASE_{uuid.uuid4().hex[:8].upper()}",
            "run_id": run_id,
            "payment_id": p["payment_id"],
            "settlement_id": None,
            "amount": p["amount"],
            "status": "REVIEW",
            "match_method": None,
            "financial_impact": p["amount"],
            "created_at": timestamp,
            "candidate": {}
        }
        
        # 1. Exact unique identifier
        expected_ref = f"REF-{p['payment_id']}"
        s_match = settlements_by_ref.get(expected_ref)
        
        if s_match:
            case["settlement_id"] = s_match["settlement_id"]
            
            # 7. Financial validation
            if p["amount"] == s_match["gross_amount"]:
                case["candidate"] = {
                    "match_method": "EXACT_ID",
                    "amount_delta": 0,
                    "multiple_candidates": False,
                    "high_value": p["amount"] > 5000000, # > 50k INR
                    "conflicting_evidence": False
                }
            else:
                case["candidate"] = {
                    "match_method": "AMOUNT_MISMATCH",
                    "amount_delta": abs(p["amount"] - s_match["gross_amount"]),
                    "multiple_candidates": False,
                    "high_value": p["amount"] > 5000000,
                    "conflicting_evidence": True
                }
        else:
            # Look for fuzzy candidates (e.g. typos, amount match)
            candidates = [s for s in settlements if s["gross_amount"] == p["amount"]]
            if len(candidates) == 1:
                case["settlement_id"] = candidates[0]["settlement_id"]
                case["candidate"] = {
                    "match_method": "AMOUNT_DATE",
                    "amount_delta": 0,
                    "multiple_candidates": False,
                    "high_value": p["amount"] > 5000000,
                    "conflicting_evidence": True # Missing exact ID
                }
            elif len(candidates) > 1:
                case["candidate"] = {
                    "match_method": "MULTIPLE",
                    "amount_delta": 0,
                    "multiple_candidates": True,
                    "high_value": p["amount"] > 5000000,
                    "conflicting_evidence": True
                }
            else:
                case["candidate"] = {
                    "match_method": "NO_MATCH",
                    "amount_delta": p["amount"],
                    "multiple_candidates": False,
                    "high_value": p["amount"] > 5000000,
                    "conflicting_evidence": False
                }
                
        cases.append(case)
        
    return cases
