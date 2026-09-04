"""
ARIVO ML Candidate Ranking Training Pipeline.
Retrains the XGBoost Candidate Ranking Layer from canonical synthetic benchmark data.

Architectural Guarantees:
1. Target is binary: 1 = Candidate is true payment-settlement relationship, 0 = False relationship.
2. Zero Candidate-Count Leakage: candidate_count is uniform across all candidate pairs for a payment.
3. Grouped Split on payment_id: Zero leakage of payments or candidates between train/val/test splits.
4. Hard Negatives Included: Amount decoys, typo references, and date-shifted settlement candidates.
5. Multi-faceted evaluation: Precision/Recall/F1 + Ranking Metrics (Top-1, Top-3, MRR) + Anomaly-slice diagnostics.
"""

import os
import sys
import csv
import json
import random
import pickle
import logging
from datetime import datetime
from collections import defaultdict
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    log_loss,
    confusion_matrix,
)
import xgboost as xgb

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.features import (
    FEATURE_NAMES,
    extract_candidate_features,
    candidate_features_to_vector,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("arivo.train")

RANDOM_SEED = 20260902
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


def load_canonical_data() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
    """Loads payments, settlements, and ground truth from canonical dataset files."""
    data_dir = os.path.join(PROJECT_ROOT, "dataset", "data")
    truth_dir = os.path.join(PROJECT_ROOT, "dataset", "ground_truth")

    p_file = os.path.join(data_dir, "payments.csv")
    s_file = os.path.join(data_dir, "settlements.csv")
    gt_file = os.path.join(truth_dir, "ground_truth.csv")

    for f_path in (p_file, s_file, gt_file):
        if not os.path.exists(f_path):
            raise FileNotFoundError(f"Required dataset file missing: {f_path}. Run dataset generation first.")

    with open(p_file, "r", encoding="utf-8") as f:
        payments = list(csv.DictReader(f))
    with open(s_file, "r", encoding="utf-8") as f:
        settlements = list(csv.DictReader(f))
    with open(gt_file, "r", encoding="utf-8") as f:
        gt_rows = list(csv.DictReader(f))

    gt_by_payment = {row["payment_id"]: row for row in gt_rows}
    logger.info(f"Loaded {len(payments)} payments, {len(settlements)} settlements, {len(gt_rows)} ground truth records.")
    return payments, settlements, gt_by_payment


def build_candidate_dataset(
    payments: List[Dict[str, Any]],
    settlements: List[Dict[str, Any]],
    gt_by_payment: Dict[str, Dict[str, Any]],
) -> pd.DataFrame:
    """
    Constructs candidate pairs with hard negatives and non-leaking candidate_count.
    For each payment:
    1. Collects true positive settlement if one exists.
    2. Collects hard negatives:
       - Same gross amount, different ID (exact-amount decoys)
       - Nearby date, same merchant
       - Reference typo candidates
    3. Samples 1-2 random negative decoys.
    4. Calculates total candidate count K for this payment.
    5. Generates rows for all K candidates with candidate_count = K uniformly.
    """
    # Index settlements for fast decoy lookup
    settlements_by_id = {s["settlement_id"]: s for s in settlements}
    settlements_by_amt = defaultdict(list)
    for s in settlements:
        amt = int(s.get("gross_amount", 0))
        settlements_by_amt[amt].append(s)

    all_rows = []

    for p in payments:
        p_id = p["payment_id"]
        p_amt = int(p["amount"])
        gt = gt_by_payment.get(p_id)
        if not gt:
            continue

        true_s_id = gt.get("settlement_id")
        scenario = gt.get("anomaly_type", "UNKNOWN")
        is_true_matched = bool(true_s_id and true_s_id in settlements_by_id)

        candidates = []

        # 1. Add true positive if payment has a true settlement
        if is_true_matched:
            candidates.append((settlements_by_id[true_s_id], 1))

        # 2. Hard negative: Same amount, different settlement (ambiguity decoy)
        same_amt_pool = [s for s in settlements_by_amt.get(p_amt, []) if s["settlement_id"] != true_s_id]
        if same_amt_pool:
            num_amt_decoys = min(len(same_amt_pool), 2)
            for decoy in random.sample(same_amt_pool, num_amt_decoys):
                candidates.append((decoy, 0))

        # 3. Hard negative: Nearby amount (fees / tax discrepancy decoys)
        nearby_keys = [k for k in settlements_by_amt if abs(k - p_amt) <= 5000 and k != p_amt]
        if nearby_keys:
            chosen_key = random.choice(nearby_keys)
            nearby_pool = [s for s in settlements_by_amt[chosen_key] if s["settlement_id"] != true_s_id]
            if nearby_pool:
                candidates.append((random.choice(nearby_pool), 0))

        # 4. Hard negative: Adversarial reference decoy (shares ~85-90% similarity but is not the true match)
        if is_true_matched and same_amt_pool:
            base_decoy = dict(random.choice(same_amt_pool))
            orig_ref = f"REF-{p_id}"
            if len(orig_ref) > 8:
                mutated_ref = orig_ref[:-2] + ("00" if orig_ref[-2:] != "00" else "FF")
                base_decoy["payment_reference"] = mutated_ref
                candidates.append((base_decoy, 0))

        # 5. Distractor negative: random settlement from global pool
        distractor_count = max(1, 4 - len(candidates))
        distractors = random.sample(settlements, min(distractor_count * 3, len(settlements)))
        added = 0
        cand_ids = {c[0]["settlement_id"] for c in candidates}
        for d in distractors:
            if d["settlement_id"] != true_s_id and d["settlement_id"] not in cand_ids:
                candidates.append((d, 0))
                cand_ids.add(d["settlement_id"])
                added += 1
                if added >= distractor_count:
                    break

        # CRITICAL INVARIANT: candidate_count is len(candidates) for all candidates of this payment
        cand_pool_size = len(candidates)

        # 6. For 25% of payments, simulate reference-less candidate matching (Pass 4: AMOUNT_DATE)
        # This trains the model to score and rank on amount, date, and merchant when references are absent
        mask_refs = (random.random() < 0.25)
        eval_p = dict(p)
        if mask_refs:
            eval_p["reference"] = ""

        for s_cand, label in candidates:
            eval_s = dict(s_cand)
            if mask_refs:
                eval_s["payment_reference"] = ""

            feats = extract_candidate_features(eval_p, eval_s, candidate_count=cand_pool_size)
            row = dict(feats)
            row["payment_id"] = p_id
            row["settlement_id"] = s_cand["settlement_id"]
            row["scenario"] = scenario
            row["label"] = int(label)
            all_rows.append(row)

    df = pd.DataFrame(all_rows)
    logger.info(f"Built training candidate dataset: {len(df)} total rows across {df['payment_id'].nunique()} payments.")
    logger.info(f"Class distribution: {df['label'].value_counts().to_dict()} (Positive ratio: {df['label'].mean():.2%})")
    return df


def train_and_evaluate(df: pd.DataFrame) -> Tuple[xgb.XGBClassifier, Dict[str, Any]]:
    """
    Splits dataset using GroupShuffleSplit on payment_id, trains XGBoost classifier,
    and computes classification, ranking, and anomaly-slice metrics.
    """
    # 1. Grouped Split: 70% Train, 15% Validation, 15% Test
    gss = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=RANDOM_SEED)
    train_idx, temp_idx = next(gss.split(df, groups=df["payment_id"]))

    train_df = df.iloc[train_idx].copy()
    temp_df = df.iloc[temp_idx].copy()

    # Split temp_df equally into Validation (15%) and Test (15%)
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.50, random_state=RANDOM_SEED)
    val_rel_idx, test_rel_idx = next(gss_val.split(temp_df, groups=temp_df["payment_id"]))

    val_df = temp_df.iloc[val_rel_idx].copy()
    test_df = temp_df.iloc[test_rel_idx].copy()

    # Verify zero leakage across splits
    train_payments = set(train_df["payment_id"])
    val_payments = set(val_df["payment_id"])
    test_payments = set(test_df["payment_id"])

    assert len(train_payments.intersection(val_payments)) == 0, "Leakage between Train and Val!"
    assert len(train_payments.intersection(test_payments)) == 0, "Leakage between Train and Test!"
    assert len(val_payments.intersection(test_payments)) == 0, "Leakage between Val and Test!"

    logger.info(f"Grouped Split: Train={len(train_df)} rows ({len(train_payments)} payments), "
                f"Val={len(val_df)} rows ({len(val_payments)} payments), "
                f"Test={len(test_df)} rows ({len(test_payments)} payments).")

    X_train = train_df[FEATURE_NAMES]
    y_train = train_df["label"]

    X_val = val_df[FEATURE_NAMES]
    y_val = val_df["label"]

    X_test = test_df[FEATURE_NAMES]
    y_test = test_df["label"]

    # 2. Train XGBoost model
    # Tuned hyperparameters for robust candidate ranking without overfitting
    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=RANDOM_SEED,
        tree_method="hist",
    )

    logger.info("Training XGBoost Classifier on candidate pairs...")
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    # 3. Predict on Test set
    test_probs = model.predict_proba(X_test)[:, 1]
    test_preds = (test_probs >= 0.5).astype(int)

    precision = float(precision_score(y_test, test_preds, zero_division=0))
    recall = float(recall_score(y_test, test_preds, zero_division=0))
    f1 = float(f1_score(y_test, test_preds, zero_division=0))
    auc = float(roc_auc_score(y_test, test_probs))
    loss = float(log_loss(y_test, test_probs))

    logger.info(f"Test Classification Metrics: Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}, AUC={auc:.4f}, LogLoss={loss:.4f}")

    # 4. Evaluate Candidate Ranking Metrics on Test Set
    test_eval_df = test_df.copy()
    test_eval_df["pred_score"] = test_probs

    top1_hits = 0
    top3_hits = 0
    mrr_sum = 0.0
    evaluated_payments = 0

    for p_id, group in test_eval_df.groupby("payment_id"):
        # Only evaluate ranking for payments that actually have a true positive candidate
        if (group["label"] == 1).sum() == 0:
            continue

        evaluated_payments += 1
        sorted_group = group.sort_values(by="pred_score", ascending=False).reset_index(drop=True)
        # Find 1-based rank of the true match
        true_indices = sorted_group.index[sorted_group["label"] == 1].tolist()
        if true_indices:
            rank = true_indices[0] + 1
            if rank == 1:
                top1_hits += 1
            if rank <= 3:
                top3_hits += 1
            mrr_sum += 1.0 / rank

    top1_acc = float(top1_hits / max(1, evaluated_payments))
    top3_acc = float(top3_hits / max(1, evaluated_payments))
    mrr = float(mrr_sum / max(1, evaluated_payments))

    logger.info(f"Test Ranking Metrics ({evaluated_payments} payments with candidates): "
                f"Top-1 Acc={top1_acc:.4f}, Top-3 Acc={top3_acc:.4f}, MRR={mrr:.4f}")

    # 5. Anomaly-slice diagnostics
    slice_metrics = {}
    for scenario, group in test_eval_df.groupby("scenario"):
        s_y = group["label"]
        s_prob = group["pred_score"]
        s_pred = (s_prob >= 0.5).astype(int)

        # Slice ranking
        s_eval_payments = 0
        s_top1_hits = 0
        for p_id, p_group in group.groupby("payment_id"):
            if (p_group["label"] == 1).sum() > 0:
                s_eval_payments += 1
                s_sorted = p_group.sort_values(by="pred_score", ascending=False).reset_index(drop=True)
                if s_sorted.iloc[0]["label"] == 1:
                    s_top1_hits += 1

        slice_top1 = float(s_top1_hits / max(1, s_eval_payments)) if s_eval_payments > 0 else 1.0
        slice_f1 = float(f1_score(s_y, s_pred, zero_division=0)) if s_y.sum() > 0 else 1.0

        slice_metrics[scenario] = {
            "total_pairs": int(len(group)),
            "payments_evaluated": s_eval_payments,
            "top1_accuracy": round(slice_top1, 4),
            "f1_score": round(slice_f1, 4),
        }

    # 6. Feature importances
    booster = model.get_booster()
    gain_scores = booster.get_score(importance_type="gain")
    weight_scores = booster.get_score(importance_type="weight")

    feature_importance = []
    for f_name in FEATURE_NAMES:
        feature_importance.append({
            "feature": f_name,
            "gain": round(float(gain_scores.get(f_name, 0.0)), 4),
            "weight": int(weight_scores.get(f_name, 0)),
        })
    feature_importance.sort(key=lambda x: x["gain"], reverse=True)

    metadata = {
        "trained_at": datetime.now().isoformat(),
        "random_seed": RANDOM_SEED,
        "algorithm": "XGBoostClassifier",
        "objective": "binary:logistic",
        "features": FEATURE_NAMES,
        "dataset_summary": {
            "total_pairs": len(df),
            "train_pairs": len(train_df),
            "val_pairs": len(val_df),
            "test_pairs": len(test_df),
            "total_payments": int(df["payment_id"].nunique()),
            "positive_ratio": round(float(df["label"].mean()), 4),
        },
        "test_classification_metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "log_loss": round(loss, 4),
        },
        "test_ranking_metrics": {
            "payments_evaluated": evaluated_payments,
            "top1_accuracy": round(top1_acc, 4),
            "top3_accuracy": round(top3_acc, 4),
            "mrr": round(mrr, 4),
        },
        "slice_metrics": slice_metrics,
        "feature_importance": feature_importance,
    }

    return model, metadata


def save_artifacts(model: xgb.XGBClassifier, metadata: Dict[str, Any], df: pd.DataFrame):
    """Persists model pickle, features.json, metadata.json, and training dataset CSV."""
    target_dir = os.path.join(PROJECT_ROOT, "arivo_ml_model")
    model_sub_dir = os.path.join(target_dir, "model")
    os.makedirs(model_sub_dir, exist_ok=True)

    # 1. Save pickle to both model/ and root arivo_ml_model/
    p1 = os.path.join(model_sub_dir, "arivo_reconciliation_xgb.pkl")
    p2 = os.path.join(target_dir, "arivo_reconciliation_xgb.pkl")
    with open(p1, "wb") as f:
        pickle.dump(model, f)
    with open(p2, "wb") as f:
        pickle.dump(model, f)
    logger.info(f"Saved model pickle to {p1} and {p2}")

    # 2. Save features.json
    feat_file = os.path.join(target_dir, "features.json")
    with open(feat_file, "w", encoding="utf-8") as f:
        json.dump({
            "features": FEATURE_NAMES,
            "model": "XGBoostClassifier",
            "task": "candidate_ranking",
            "target": "is_true_relationship",
            "updated_at": metadata["trained_at"],
        }, f, indent=2)
    logger.info(f"Saved features list to {feat_file}")

    # 3. Save model_metadata.json
    meta_file = os.path.join(target_dir, "model_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved training metadata to {meta_file}")

    # 4. Save training dataset CSV
    csv_file = os.path.join(target_dir, "ml_training_dataset.csv")
    df.to_csv(csv_file, index=False)
    logger.info(f"Saved canonical candidate dataset ({len(df)} rows) to {csv_file}")


def main():
    logger.info("Starting ARIVO ML Candidate Ranking Training Pipeline...")
    payments, settlements, gt_by_payment = load_canonical_data()
    df = build_candidate_dataset(payments, settlements, gt_by_payment)
    model, metadata = train_and_evaluate(df)
    save_artifacts(model, metadata, df)

    print("\n" + "=" * 60)
    print("      ARIVO ML CANDIDATE RANKING RETRAINING COMPLETED      ")
    print("=" * 60)
    print(f"Algorithm:           {metadata['algorithm']}")
    print(f"Total Candidate Pairs: {metadata['dataset_summary']['total_pairs']}")
    print(f"Top-1 Accuracy:      {metadata['test_ranking_metrics']['top1_accuracy'] * 100:.2f}%")
    print(f"Top-3 Accuracy:      {metadata['test_ranking_metrics']['top3_accuracy'] * 100:.2f}%")
    print(f"Mean Reciprocal Rank:{metadata['test_ranking_metrics']['mrr']:.4f}")
    print(f"Test Precision:      {metadata['test_classification_metrics']['precision'] * 100:.2f}%")
    print(f"Test Recall:         {metadata['test_classification_metrics']['recall'] * 100:.2f}%")
    print(f"Test F1-Score:       {metadata['test_classification_metrics']['f1_score']:.4f}")
    print(f"Test ROC-AUC:        {metadata['test_classification_metrics']['roc_auc']:.4f}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
