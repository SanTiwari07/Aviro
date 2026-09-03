"""
Gemini AI integration module for Arivo Finance Controller.
Provides:
1. investigate_case: Investigates ambiguous reconciliation cases with structured JSON output and safety fallback.
2. ask_arivo_grounded: Grounded natural-language copilot backed by real database facts and audit references.
"""

import os
import re
import math
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from google import genai
from google.genai import types

from .. import database

logger = logging.getLogger("arivo.ai")
HIGH_VALUE_THRESHOLD_PAISE = 5000000


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY", "")
    return genai.Client(api_key=api_key)


def _get_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def format_inr(paise: int) -> str:
    rupees = (paise or 0) / 100
    return f"₹{rupees:,.2f}"


def validate_gemini_case_response(raw_text: str, case: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Strict Post-Gemini Contract Validator.
    Parses, strips markdown code blocks, validates schema, enums, confidence bounds,
    and checks for hallucinated identifiers.
    Returns valid parsed dict, or raises ValueError on contract breach.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response text from LLM")

    cleaned = raw_text.strip()
    # Strip markdown code blocks ```json ... ``` or ``` ... ```
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()

    try:
        data = json.loads(cleaned)
    except Exception as err:
        raise ValueError(f"Malformed JSON from LLM: {err}")

    if not isinstance(data, dict):
        raise ValueError(f"LLM output is not a JSON object: {type(data)}")

    # Required fields
    valid_decisions = {"MATCHED", "REVIEW", "EXCEPTION"}
    rec_raw = data.get("recommended_decision")
    rec = str(rec_raw).strip().upper() if rec_raw else None
    if rec not in valid_decisions:
        raise ValueError(f"Invalid recommended_decision: {rec_raw}")
    data["recommended_decision"] = rec

    # Confidence check
    conf_raw = data.get("confidence")
    if conf_raw is None:
        conf = 0.0
    elif isinstance(conf_raw, (bool, list, dict)):
        raise ValueError(f"Invalid confidence type: {type(conf_raw)}")
    else:
        try:
            conf = float(conf_raw)
        except (ValueError, TypeError):
            raise ValueError(f"Non-numeric confidence: {conf_raw}")

        if math.isnan(conf) or math.isinf(conf):
            raise ValueError("Confidence is NaN or Infinity")

    # Clamp confidence
    data["confidence"] = max(0.0, min(1.0, conf))

    # Evidence arrays
    if "supporting_evidence" in data and not isinstance(data["supporting_evidence"], list):
        data["supporting_evidence"] = [str(data["supporting_evidence"])]
    elif "supporting_evidence" not in data:
        data["supporting_evidence"] = []

    if "contradicting_evidence" in data and not isinstance(data["contradicting_evidence"], list):
        data["contradicting_evidence"] = [str(data["contradicting_evidence"])]
    elif "contradicting_evidence" not in data:
        data["contradicting_evidence"] = []

    if "summary" not in data or not isinstance(data["summary"], str):
        data["summary"] = str(data.get("summary") or "AI automated investigation.")

    # Anti-hallucination check if case context is provided
    if case:
        expected_pay_id = case.get("payment_id")
        candidate_setl_id = case.get("settlement_id")
        if "payment_id" in data and data["payment_id"] and data["payment_id"] != expected_pay_id:
            raise ValueError(f"Hallucinated payment_id: {data['payment_id']} != {expected_pay_id}")
        if "settlement_id" in data and data["settlement_id"] and candidate_setl_id and data["settlement_id"] != candidate_setl_id:
            cand_pool = set(case.get("candidate_settlement_ids") or [])
            cand_pool.add(candidate_setl_id)
            if data["settlement_id"] not in cand_pool:
                raise ValueError(f"Hallucinated settlement_id: {data['settlement_id']} not in candidate pool")

    return data


def parse_gemini_response_safe(raw_text: str, case: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Safe wrapper for Gemini response parsing.
    Returns validated data, or safe fallback (REVIEW, confidence 0.0) on any validation failure.
    """
    try:
        return validate_gemini_case_response(raw_text, case)
    except Exception as err:
        logger.warning(f"[Gemini] Response failed validation: {err}")
        return {
            "classification": "AI_FAILURE",
            "summary": f"Gemini response invalid: {str(err)}",
            "supporting_evidence": [],
            "contradicting_evidence": ["Automated AI response failed validation."],
            "recommended_decision": "REVIEW",
            "recommended_action": "Manual review required by finance team.",
            "confidence": 0.0,
        }


def investigate_case(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calls Gemini to investigate an ambiguous reconciliation case.
    Enforces strict JSON schema validation and Markdown stripping.
    Guarantees safe fallback on failure: status REVIEW, confidence 0.0.
    """
    fallback = {
        "classification": "AI_FAILURE",
        "summary": "Gemini investigation unavailable. Routed to manual review.",
        "supporting_evidence": [],
        "contradicting_evidence": ["Automated AI investigation did not complete."],
        "recommended_decision": "REVIEW",
        "recommended_action": "Manual review required by finance team.",
        "confidence": 0.0,
    }

    prompt = f"""
    You are Arivo, an AI Finance Controller for an enterprise finance department.
    Investigate the following reconciliation candidate evidence and return a structured JSON assessment.

    Candidate Evidence:
    {json.dumps(evidence, indent=2)}

    Decision rules:
    - If there are multiple candidates or unresolved amount discrepancies, do NOT recommend MATCHED.
    - If financial delta is non-zero without valid fee/tax adjustment, recommend EXCEPTION or REVIEW.
    - If confidence is high and evidence is consistent, you may recommend MATCHED (which will still be validated by the Control Gate).

    You must return a JSON object exactly matching this schema:
    {{
      "classification": "string",
      "summary": "string",
      "supporting_evidence": ["string"],
      "contradicting_evidence": ["string"],
      "recommended_decision": "MATCHED" | "REVIEW" | "EXCEPTION",
      "recommended_action": "string",
      "confidence": 0.0
    }}
    """

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=_get_model(),
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )

        return validate_gemini_case_response(response.text, evidence)

    except Exception as e:
        logger.error(f"[Gemini] investigate_case failed: {e}")
        return fallback


def ask_arivo_grounded(question: str, db: Session) -> Dict[str, Any]:
    """
    Answers natural-language finance questions grounded strictly on verified database records.
    Extracts real figures, identifies referenced entities, queries SQLite, and supplies context to Gemini.
    Returns:
    {
      "answer": str,
      "referenced_records": [{"id": str, "type": str, "case_id": Optional[str]}]
    }
    """
    q_lower = question.lower()
    referenced_records: List[Dict[str, Any]] = []
    db_context_facts: List[str] = []

    # 1. Detect entity IDs in query (PAY_..., pay_..., SET_..., setl_..., CASE_...)
    id_matches = re.findall(r"(?:pay|PAY|setl|SET|SETL|CASE|case)_[A-Za-z0-9_]+", question)

    if id_matches:
        for ent_id in id_matches:
            # Check reconciliation case
            c = (
                db.query(database.ReconciliationCase)
                .filter(
                    (database.ReconciliationCase.case_id == ent_id)
                    | (database.ReconciliationCase.payment_id == ent_id)
                    | (database.ReconciliationCase.settlement_id == ent_id)
                )
                .first()
            )
            if c:
                referenced_records.append({
                    "id": ent_id,
                    "case_id": c.case_id,
                    "type": "case",
                    "status": c.status,
                    "financial_impact": c.financial_impact,
                })
                db_context_facts.append(
                    f"Record {ent_id}: Case {c.case_id}, Status: {c.status}, "
                    f"Payment ID: {c.payment_id}, Settlement ID: {c.settlement_id}, "
                    f"Match Method: {c.match_method}, Financial Impact: {format_inr(c.financial_impact)}, "
                    f"Control Verdict: {c.control_result}, Control Reasons: {c.control_reasons or 'None'}, "
                    f"AI Recommendation: {c.ai_recommendation or 'N/A'} (Confidence: {c.ai_confidence or 'N/A'}), "
                    f"AI Reason: {c.ai_reason or 'N/A'}."
                )

            # Check Settlement table
            s = db.query(database.Settlement).filter_by(settlement_id=ent_id).first()
            if s:
                db_context_facts.append(
                    f"Settlement {s.settlement_id}: Gross: {format_inr(s.gross_amount)}, "
                    f"Fees: {format_inr(s.fees)}, Tax: {format_inr(s.tax)}, Net: {format_inr(s.net_amount)}, "
                    f"Unexplained Delta: {format_inr(s.unexplained_delta)}, Status: {s.status}, UTR: {s.utr or 'N/A'}."
                )

    # 2. Check for "unresolved", "exposure", "how much money"
    if any(term in q_lower for term in ["unresolved", "exposure", "how much money", "outstanding", "pending"]):
        rev_cnt = db.query(database.ReconciliationCase).filter_by(status="REVIEW").count()
        rev_sum = (
            db.query(func.sum(database.ReconciliationCase.financial_impact))
            .filter_by(status="REVIEW")
            .scalar()
        ) or 0

        exc_cnt = db.query(database.ReconciliationCase).filter_by(status="EXCEPTION").count()
        exc_sum = (
            db.query(func.sum(database.ReconciliationCase.financial_impact))
            .filter_by(status="EXCEPTION")
            .scalar()
        ) or 0

        total_unres = rev_sum + exc_sum
        db_context_facts.append(
            f"Current Unresolved Exposure: Total {format_inr(total_unres)}. "
            f"Breakdown: REVIEW has {rev_cnt} cases totaling {format_inr(rev_sum)}; "
            f"EXCEPTION has {exc_cnt} cases totaling {format_inr(exc_sum)}."
        )

    # 3. Check for "largest delta", "largest unexplained", "highest difference"
    if any(term in q_lower for term in ["largest", "biggest", "highest", "delta", "unexplained"]):
        largest_delta_setl = (
            db.query(database.Settlement)
            .order_by(database.Settlement.unexplained_delta.desc())
            .first()
        )
        if largest_delta_setl and (largest_delta_setl.unexplained_delta or 0) > 0:
            c = (
                db.query(database.ReconciliationCase)
                .filter_by(settlement_id=largest_delta_setl.settlement_id)
                .first()
            )
            case_id = c.case_id if c else None
            referenced_records.append({
                "id": largest_delta_setl.settlement_id,
                "case_id": case_id,
                "type": "settlement",
                "delta": largest_delta_setl.unexplained_delta,
            })
            db_context_facts.append(
                f"Settlement with largest unexplained delta is {largest_delta_setl.settlement_id} "
                f"with a delta of {format_inr(largest_delta_setl.unexplained_delta)}. "
                f"Gross: {format_inr(largest_delta_setl.gross_amount)}, Net: {format_inr(largest_delta_setl.net_amount)}, "
                f"Fees: {format_inr(largest_delta_setl.fees)}, Tax: {format_inr(largest_delta_setl.tax)}, "
                f"Status: {largest_delta_setl.status}."
            )

    # 4. Check for "high value", "high-value"
    if "high" in q_lower and "value" in q_lower:
        hv_unresolved_cnt = (
            db.query(database.ReconciliationCase)
            .filter(
                database.ReconciliationCase.financial_impact >= HIGH_VALUE_THRESHOLD_PAISE,
                database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"]),
            )
            .count()
        )
        hv_unresolved_sum = (
            db.query(func.sum(database.ReconciliationCase.financial_impact))
            .filter(
                database.ReconciliationCase.financial_impact >= HIGH_VALUE_THRESHOLD_PAISE,
                database.ReconciliationCase.status.in_(["REVIEW", "EXCEPTION"]),
            )
            .scalar()
        ) or 0
        db_context_facts.append(
            f"High-Value Unresolved Cases (>= ₹50,000): {hv_unresolved_cnt} cases "
            f"totaling {format_inr(hv_unresolved_sum)}. Under Arivo policy, ambiguous high-value cases "
            f"are blocked from automatic clearance by the Control Gate."
        )

    # General Controller Policy Context
    policy_context = (
        "ARIVO Operating Policy:\n"
        "1. MATCHED: Deterministic exact-ID match with zero delta passed all controls.\n"
        "2. REVIEW: Ambiguous candidates or high-value (>₹50,000) transactions blocked by Control Gate for human sign-off.\n"
        "3. EXCEPTION: No settlement found, or critical financial failure (unexplained delta, fee/tax discrepancy).\n"
        "4. The Control Gate is authoritative: AI recommendations cannot override a Control Gate BLOCK.\n"
        "5. Financial figures are tracked in minor currency units (paise) and formatted as INR (₹)."
    )

    combined_facts = "\n".join(db_context_facts) if db_context_facts else "No specific records matched the query entities."

    prompt = f"""
    You are Arivo, an enterprise AI Finance Controller.
    Answer the user's question grounded strictly on the verified database facts and policy below.
    Never invent numbers, IDs, or financial totals.

    Verified Database Facts:
    {combined_facts}

    System Policy:
    {policy_context}

    Question: {question}
    """

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=_get_model(),
            contents=prompt,
        )
        answer_text = response.text
    except Exception as e:
        logger.warning(f"[Gemini] ask_arivo error: {e}. Generating deterministic fallback.")
        # Deterministic fallback answer using the exact database facts gathered
        if db_context_facts:
            answer_text = "Here are the verified records from the Arivo controller:\n\n" + "\n\n".join(db_context_facts)
        else:
            answer_text = (
                f"According to ARIVO policy, all financial matches require zero amount delta and exact unique identification. "
                f"Ambiguous or high-value transactions (>₹50,000) are routed to manual REVIEW, and discrepancies are marked as EXCEPTION."
            )

    return {
        "answer": answer_text,
        "referenced_records": referenced_records,
    }
