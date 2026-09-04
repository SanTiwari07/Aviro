"""
Candidate Match Scorer for ARIVO.
Implements the ML Candidate Ranking Layer:
"RULES FIND. ML RANKS. GEMINI INVESTIGATES. CONTROL GATE AUTHORIZES."

Calculates P(candidate is true match | payment, candidate settlement).
Never decides financial status (MATCHED/REVIEW/EXCEPTION).
Only ranks candidates and passes top candidate + score margin into evidence.
Includes safe deterministic fallback if the ML model is missing or fails to load.
"""

import os
import pickle
import logging
from typing import Dict, Any, List, Optional, Tuple, Union

from .features import FEATURE_NAMES, extract_candidate_features, candidate_features_to_vector

logger = logging.getLogger("arivo.ml.scorer")

# Default model artifact locations in order of preference
MODEL_LOCATIONS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "arivo_ml_model", "model", "arivo_reconciliation_xgb.pkl"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "arivo_ml_model", "arivo_reconciliation_xgb.pkl"),
]


class CandidateScorer:
    """
    Inference scoring and candidate ranking engine for reconciliation pairs.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        """Attempts to load XGBoost model from configured paths; falls back to heuristic if missing."""
        candidate_paths = [self.model_path] if self.model_path else MODEL_LOCATIONS
        for p in candidate_paths:
            if p and os.path.exists(p):
                try:
                    with open(p, "rb") as f:
                        self.model = pickle.load(f)
                    self.model_path = p
                    logger.info(f"[ML Scorer] Successfully loaded model from {p}")
                    return
                except Exception as e:
                    logger.warning(f"[ML Scorer] Failed to load model from {p}: {e}")

        logger.info("[ML Scorer] No model file loaded; using deterministic heuristic fallback.")
        self.model = None

    def _heuristic_score(self, features: Dict[str, float]) -> float:
        """
        Deterministic, robust fallback match scoring if ML model is unavailable.
        Combines exact amount match, reference similarity, merchant match, and date proximity.
        """
        merchant_match = features.get("merchant_match", 1.0)
        ref_exact = features.get("reference_exact_match", 0.0)
        amt_exact = features.get("amount_exact_match", 0.0)

        # Exact reference match + exact amount + matching merchant is nearly certain
        if ref_exact >= 1.0 and amt_exact >= 1.0:
            if merchant_match >= 1.0:
                return 0.99
            else:
                return 0.75  # Wrong merchant heavily discounted

        # Amount mismatch heavily penalized
        amt_ratio = features.get("amount_ratio", 0.0)
        ref_sim = features.get("reference_similarity", 0.0)
        date_delta = features.get("date_delta_days", 2.0)
        date_decay = 1.0 / (1.0 + 0.25 * date_delta)

        score = (0.40 * amt_ratio) + (0.35 * ref_sim) + (0.15 * date_decay) + (0.10 * merchant_match)
        return round(max(0.0, min(1.0, float(score))), 4)

    def score_pair(
        self,
        payment: Union[Dict[str, Any], Any],
        settlement: Union[Dict[str, Any], Any],
        candidate_count: int = 1,
    ) -> Tuple[float, Dict[str, float]]:
        """
        Computes match probability for a single (payment, settlement) candidate pair.
        Returns: (match_score, features_dict)
        """
        features = extract_candidate_features(payment, settlement, candidate_count=candidate_count)

        if self.model is not None:
            try:
                import numpy as np
                vector = np.array([candidate_features_to_vector(features)])
                # Predict probability for class 1 (true match)
                if hasattr(self.model, "predict_proba"):
                    proba = self.model.predict_proba(vector)[0]
                    score = float(proba[1]) if len(proba) > 1 else float(proba[0])
                elif hasattr(self.model, "predict"):
                    score = float(self.model.predict(vector)[0])
                else:
                    score = self._heuristic_score(features)
                return round(max(0.0, min(1.0, score)), 4), features
            except Exception as e:
                logger.warning(f"[ML Scorer] Model inference failed: {e}; falling back to heuristic.")
                return self._heuristic_score(features), features

        return self._heuristic_score(features), features

    def rank_candidates(
        self,
        payment: Union[Dict[str, Any], Any],
        candidates: List[Union[Dict[str, Any], Any]],
    ) -> List[Dict[str, Any]]:
        """
        Ranks candidate settlements for a payment.
        
        CRITICAL INVARIANT:
        candidate_count = len(candidates) is computed once for this payment
        and passed to every candidate evaluation to avoid label leakage.

        Returns a sorted list of ranked candidate dictionaries:
        [
          {
            "candidate": settlement_dict,
            "ml_rank": 1,
            "ml_match_score": 0.945,
            "ml_score_margin": 0.32,  # Difference between rank 1 and rank 2 score
            "features": {...}
          },
          ...
        ]
        """
        if not candidates:
            return []

        cand_count = len(candidates)
        scored_items = []

        # If model is loaded, batch predict for high throughput
        if self.model is not None and hasattr(self.model, "predict_proba"):
            try:
                import numpy as np
                feature_dicts = [
                    extract_candidate_features(payment, c, candidate_count=cand_count)
                    for c in candidates
                ]
                matrix = np.array([candidate_features_to_vector(f) for f in feature_dicts])
                probas = self.model.predict_proba(matrix)
                for i, c in enumerate(candidates):
                    p1 = float(probas[i][1]) if probas.shape[1] > 1 else float(probas[i][0])
                    p1_clamped = round(max(0.0, min(1.0, p1)), 4)
                    scored_items.append({
                        "candidate": c,
                        "ml_match_score": p1_clamped,
                        "features": feature_dicts[i],
                    })
            except Exception as e:
                logger.warning(f"[ML Scorer] Batch inference error: {e}; scoring iteratively.")
                scored_items = []
                for c in candidates:
                    s, f = self.score_pair(payment, c, candidate_count=cand_count)
                    scored_items.append({
                        "candidate": c,
                        "ml_match_score": s,
                        "features": f,
                    })
        else:
            for c in candidates:
                s, f = self.score_pair(payment, c, candidate_count=cand_count)
                scored_items.append({
                    "candidate": c,
                    "ml_match_score": s,
                    "features": f,
                })

        # Sort descending by match score, with rich feature tie-breaking
        scored_items.sort(
            key=lambda x: (
                x["ml_match_score"],
                x["features"].get("merchant_match", 0.0),
                x["features"].get("reference_similarity", 0.0),
                x["features"].get("amount_exact_match", 0.0),
                -x["features"].get("date_delta_days", 999.0),
            ),
            reverse=True,
        )

        # Assign ranks and margin
        top_score = scored_items[0]["ml_match_score"] if scored_items else 0.0
        second_score = scored_items[1]["ml_match_score"] if len(scored_items) > 1 else 0.0
        margin = round(top_score - second_score, 4)

        for rank_idx, item in enumerate(scored_items):
            item["ml_rank"] = rank_idx + 1
            item["ml_score_margin"] = margin
            item["candidate_count"] = cand_count

        return scored_items


# Global singleton instance
_GLOBAL_SCORER: Optional[CandidateScorer] = None


def get_candidate_scorer(force_reload: bool = False) -> CandidateScorer:
    """Returns singleton CandidateScorer instance."""
    global _GLOBAL_SCORER
    if _GLOBAL_SCORER is None or force_reload:
        _GLOBAL_SCORER = CandidateScorer()
    return _GLOBAL_SCORER
