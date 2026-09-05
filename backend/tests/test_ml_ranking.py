"""
Comprehensive test suite for the ML Candidate Ranking module:
- Feature extraction determinism and non-leakage
- CandidateScorer probability ranking and margin computation
- Robust fallback when model is absent
- Control Gate supremacy (ML model never acts as final authority)
- Population conservation and database schema compatibility
"""

from backend.ml.features import FEATURE_NAMES, extract_candidate_features
from backend.ml.match_scorer import CandidateScorer, get_candidate_scorer
from backend.engine.reconciliation import run_reconciliation
from backend.engine.control_gate import validate_match, decide_final_status


def test_feature_extraction_canonical_schema():
    payment = {
        "payment_id": "PAY_TEST_001",
        "amount": 50000,
        "payment_date": "2026-09-01",
        "merchant_id": "MERCH_ALPHA",
        "currency": "INR",
        "reference": "REF-PAY_TEST_001",
    }
    candidate = {
        "settlement_id": "SET_TEST_001",
        "gross_amount": 50000,
        "settlement_date": "2026-09-02",
        "merchant_id": "MERCH_ALPHA",
        "currency": "INR",
        "payment_reference": "REF-PAY_TEST_001",
    }

    feats = extract_candidate_features(payment, candidate, candidate_count=3)

    assert len(feats) == len(FEATURE_NAMES)
    assert set(feats.keys()) == set(FEATURE_NAMES)
    assert feats["amount_exact_match"] == 1.0
    assert feats["amount_delta"] == 0.0
    assert feats["amount_ratio"] == 1.0
    assert feats["merchant_match"] == 1.0
    assert feats["currency_match"] == 1.0
    assert feats["date_delta_days"] == 1.0
    assert feats["date_within_window"] == 1.0
    assert feats["reference_exact_match"] == 1.0
    assert feats["reference_similarity"] == 1.0
    assert feats["candidate_count"] == 3.0


def test_feature_extraction_dirty_and_missing_values():
    payment = {
        "payment_id": "PAY_DIRTY",
        "amount": 0,
        "payment_date": "invalid-date",
        "merchant_id": None,
        "currency": None,
        "reference": None,
    }
    candidate = {
        "settlement_id": "SET_DIRTY",
        "gross_amount": 10000,
        "settlement_date": "",
        "merchant_id": "MERCH_BETA",
        "currency": "usd",
        "payment_reference": "",
    }

    feats = extract_candidate_features(payment, candidate, candidate_count=1)

    assert isinstance(feats["amount_delta"], float)
    assert isinstance(feats["date_delta_days"], float)
    assert feats["reference_similarity"] == 0.0
    assert feats["reference_exact_match"] == 0.0
    assert feats["currency_match"] == 0.0
    assert feats["merchant_match"] == 0.0
    assert feats["candidate_count"] == 1.0


def test_candidate_scorer_ranking_and_margin():
    scorer = get_candidate_scorer()
    payment = {
        "payment_id": "PAY_TARGET",
        "amount": 100000,
        "payment_date": "2026-09-01",
        "merchant_id": "MERCHANT_X",
        "currency": "INR",
        "reference": "REF-PAY_TARGET",
    }

    # Best candidate + 2 decoys
    candidates = [
        {
            "settlement_id": "SET_DECOY_WRONG_MERCH",
            "gross_amount": 100000,
            "settlement_date": "2026-09-01",
            "merchant_id": "OTHER_MERCH",
            "currency": "INR",
            "payment_reference": "REF-PAY_TARGET",
        },
        {
            "settlement_id": "SET_PERFECT",
            "gross_amount": 100000,
            "settlement_date": "2026-09-01",
            "merchant_id": "MERCHANT_X",
            "currency": "INR",
            "payment_reference": "REF-PAY_TARGET",
        },
        {
            "settlement_id": "SET_DECOY_DIFF_DATE",
            "gross_amount": 100000,
            "settlement_date": "2026-09-20",
            "merchant_id": "MERCHANT_X",
            "currency": "INR",
            "payment_reference": "REF-OTHER",
        },
    ]

    ranked = scorer.rank_candidates(payment, candidates)

    assert len(ranked) == 3
    assert ranked[0]["ml_rank"] == 1
    assert ranked[1]["ml_rank"] == 2
    assert ranked[2]["ml_rank"] == 3

    # Top candidate must be the perfect match
    assert ranked[0]["candidate"]["settlement_id"] == "SET_PERFECT"
    assert ranked[0]["ml_match_score"] >= ranked[1]["ml_match_score"]
    assert ranked[0]["ml_score_margin"] >= 0.0


def test_control_gate_supremacy_over_ml():
    """
    INVARIANT: The ML model must NEVER become the final financial authority.
    Even if ML gives a candidate high score (0.99), Control Gate must BLOCK
    if there is an amount delta, duplicate claim, or waterfall discrepancy.
    """
    candidate = {
        "match_method": "AMOUNT_MISMATCH",
        "amount_delta": 500,  # 5 INR discrepancy
        "multiple_candidates": False,
        "high_value": False,
        "conflicting_evidence": True,
        "duplicate_allocation": False,
        "unexplained_delta": False,
        "currency_mismatch": False,
        "ml_match_score": 0.99,  # High ML score
        "ml_rank": 1,
    }

    control_result = validate_match(candidate)
    assert control_result["result"] == "BLOCK"
    assert "Non-zero amount delta." in control_result["reasons"]

    final_status = decide_final_status(candidate, control_result)
    assert final_status in ("REVIEW", "EXCEPTION")
    assert final_status != "MATCHED"


def test_candidate_scorer_fallback_resilience():
    """
    Ensures CandidateScorer falls back safely to heuristic scoring
    if initialized with a non-existent model path.
    """
    scorer = CandidateScorer(model_path="non_existent_model_file.pkl")
    assert scorer.model is None

    payment = {
        "payment_id": "PAY_FALLBACK",
        "amount": 25000,
        "payment_date": "2026-09-01",
        "merchant_id": "MERCH_1",
        "currency": "INR",
        "reference": "REF-PAY_FALLBACK",
    }
    candidates = [
        {
            "settlement_id": "SET_FALLBACK_1",
            "gross_amount": 25000,
            "settlement_date": "2026-09-01",
            "merchant_id": "MERCH_1",
            "currency": "INR",
            "payment_reference": "REF-PAY_FALLBACK",
        },
        {
            "settlement_id": "SET_FALLBACK_2",
            "gross_amount": 25000,
            "settlement_date": "2026-09-10",
            "merchant_id": "OTHER",
            "currency": "INR",
            "payment_reference": "REF-OTHER",
        },
    ]

    ranked = scorer.rank_candidates(payment, candidates)
    assert len(ranked) == 2
    assert ranked[0]["candidate"]["settlement_id"] == "SET_FALLBACK_1"
    assert ranked[0]["ml_match_score"] > ranked[1]["ml_match_score"]


def test_reconciliation_engine_ml_metadata_attachment():
    """
    Tests that run_reconciliation attaches ml_match_score and ml_rank to output cases.
    """
    payments = [
        {
            "payment_id": "PAY_E2E_1",
            "amount": 10000,
            "payment_date": "2026-09-01",
            "merchant_id": "MERCH_TEST",
            "currency": "INR",
            "reference": "REF-PAY_E2E_1",
        },
        {
            "payment_id": "PAY_E2E_2",
            "amount": 20000,
            "payment_date": "2026-09-01",
            "merchant_id": "MERCH_TEST",
            "currency": "INR",
            "reference": "REF-UNKNOWN",
        },
    ]
    settlements = [
        {
            "settlement_id": "SET_E2E_1",
            "gross_amount": 10000,
            "settlement_date": "2026-09-01",
            "merchant_id": "MERCH_TEST",
            "currency": "INR",
            "payment_reference": "REF-PAY_E2E_1",
        },
        {
            "settlement_id": "SET_E2E_2",
            "gross_amount": 20000,
            "settlement_date": "2026-09-02",
            "merchant_id": "MERCH_TEST",
            "currency": "INR",
            "payment_reference": "SET_E2E_2",
        },
    ]

    cases = run_reconciliation(payments, settlements)
    assert len(cases) == 2

    # Case 1: Exact match
    c1 = next(c for c in cases if c["payment_id"] == "PAY_E2E_1")
    assert c1["status"] == "MATCHED"
    assert c1["ml_match_score"] == 1.0
    assert c1["ml_rank"] == 1

    # Case 2: Pass 4 heuristic candidate match ranked by ML
    c2 = next(c for c in cases if c["payment_id"] == "PAY_E2E_2")
    assert c2["settlement_id"] == "SET_E2E_2"
    assert c2["ml_match_score"] is not None
    assert c2["ml_rank"] == 1
