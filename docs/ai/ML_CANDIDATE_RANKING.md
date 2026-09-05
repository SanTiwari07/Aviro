# Machine Learning Candidate Ranking Engine

> **Module:** `backend/ml/` (`model.py`, `features.py`)  
> **Framework:** XGBoost 3.4.1 / Scikit-learn 1.9.0  
> **Training Script:** `scripts/train_ml_model.py`  
> **Artifact Directory:** `arivo_ml_model/`

ARIVO employs an XGBoost gradient-boosted decision tree pipeline to score and rank candidate settlement matches before invoking generative AI.

---

## 1. Candidate Ranking Workflow

When a payment does not have an exact 1-to-1 identifier, candidate settlement batches are scored across 8 dimensional features:

```
[Payment Record] + [Candidate Settlements]
                   │
                   ▼
     [Feature Extractor (8 Features)]
                   │
                   ▼
     [XGBoost Inference Engine]
                   │
                   ▼
   [Ranked Candidate Probabilities]
     ├── Top candidate > 0.85 & Δ > 0.35 ──> High Confidence Proposal
     └── Top candidates close in score    ──> Ambiguous Flag (Trigger Gemini)
```

---

## 2. Feature Vector Formulation (8 Features)

| Feature | Type | Range | Description |
|---|---|---|---|
| `amount_delta_paise` | Integer | $\ge 0$ | Absolute difference between payment gross and candidate settlement gross. |
| `timestamp_delta_hours` | Float | $\ge 0.0$ | Time difference between payment capture and settlement timestamp. |
| `fee_ratio` | Float | $0.0 \dots 0.10$ | Gateway processing fee divided by gross transaction value. |
| `tax_ratio` | Float | $0.0 \dots 0.25$ | Statutory GST divided by gateway processing fee (expected $\approx 0.18$). |
| `id_token_overlap` | Float | $0.0 \dots 1.0$ | Jaccard token similarity between order references and settlement notes. |
| `method_match` | Binary | $\{0, 1\}$ | Binary match between payment method (UPI, Card, NetBanking) and batch mode. |
| `historical_merchant_settlement_count` | Integer | $\ge 0$ | Total count of historic settlements successfully cleared for this merchant. |
| `day_of_week_dispersion` | Float | $-1.0 \dots 1.0$ | Cyclic sin/cos encoding of settlement day of the week. |

---

## 3. Training & Cold-Start Fallback

### Model Retraining
To retrain the model against updated reconciliation history:
```bash
python scripts/train_ml_model.py
```
The script trains an `XGBClassifier`, computes precision/recall curves, and exports the serialized model artifact to `arivo_ml_model/model.joblib`.

### Cold-Start Fallback Heuristic
If `model.joblib` is absent (e.g., initial git clone or scratch container), the system gracefully activates the deterministic heuristic ranker:
$$\text{Score} = \exp\left(-\frac{\Delta_{\text{hours}}}{24}\right) \times \left(1 - \frac{|\Delta_{\text{paise}}|}{\text{Amount}}\right)$$
This guarantees zero disruption to reconciliation execution.
