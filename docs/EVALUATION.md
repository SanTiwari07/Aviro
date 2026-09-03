# Arivo Evaluation & Benchmark

## Benchmark Strategy
Arivo is evaluated on a deterministic synthetic dataset containing multiple anomalies (typos, timing differences, fees, tax, refunds, chargebacks). The benchmark compares Arivo's performance against a baseline (deterministic-only) approach.

## Metrics Tracked
- **Precision**: How many MATCHED decisions were correct.
- **Recall**: How many true matches were successfully MATCHED.
- **F1 Score**: Harmonic mean of Precision and Recall.
- **False Matches**: Critical safety metric (should be 0).
- **Exceptions**: Accurately classified unexplained deltas.

Run `make benchmark` to execute the evaluation script.
