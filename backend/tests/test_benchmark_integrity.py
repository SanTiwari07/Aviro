"""
Tests verifying the integrity, dynamic calculation, and mathematical
rigor of the benchmark evaluation engine (evaluation/benchmark.py).
"""

import pytest
from evaluation.benchmark import run_benchmark_evaluation


def test_benchmark_execution_and_structure():
    """
    Ensures run_benchmark_evaluation runs authentically and returns valid metrics.
    """
    res = run_benchmark_evaluation()
    assert res.get("status") == "SUCCESS"
    assert res["dataset_size"] == 5114
    assert "metrics" in res
    assert "baseline" in res["metrics"]
    assert "arivo" in res["metrics"]


def test_arivo_superiority_over_baseline():
    """
    Verifies that ARIVO significantly outperforms the naive baseline in precision,
    F1 score, and prevention of false auto-matches.
    """
    res = run_benchmark_evaluation()
    b = res["metrics"]["baseline"]
    a = res["metrics"]["arivo"]

    # Precision and F1 must exceed 90%
    assert a["precision"] >= 0.90, f"Precision was {a['precision']}, expected >= 0.90"
    assert a["f1_score"] >= 0.90, f"F1 score was {a['f1_score']}, expected >= 0.90"

    # ARIVO must prevent hundreds of false auto-matches compared to naive baseline
    assert b["false_auto_matches"] > 1000
    assert a["false_auto_matches"] < 300
    assert a["false_auto_matches"] < b["false_auto_matches"]

    # Financial exposure prevented must exceed 1 Crore INR (10,000,000,000 paise)
    exposure_prevented = b["false_match_exposure_paise"] - a["false_match_exposure_paise"]
    assert exposure_prevented >= 1000000000, f"Exposure prevented {exposure_prevented} paise < 1 Cr"


def test_ai_value_and_safety_telemetry():
    """
    Verifies safety metrics are dynamically computed and populated.
    """
    res = run_benchmark_evaluation()
    safety = res.get("ai_value_and_safety", {})

    assert "unsafe_ai_matches_blocked" in safety
    assert "financial_exposure_prevented_paise" in safety
    assert "flagship_safety_demo" in res

    scenario = res["flagship_safety_demo"]
    assert scenario["gemini_recommendation"] == "MATCHED"
    assert scenario["control_gate_verdict"] == "BLOCK"
    assert scenario["final_arivo_decision"] == "REVIEW"
    assert scenario["safety_verdict"] == "The AI is confident. The system is not."
