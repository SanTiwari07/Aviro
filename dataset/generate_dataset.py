import argparse
import csv
import random
import os
import uuid
from datetime import datetime, timedelta

def get_args():
    parser = argparse.ArgumentParser(description="Generate Arivo synthetic dataset")
    parser.add_argument("--rows", type=int, default=5000, help="Number of primary records to generate")
    parser.add_argument("--seed", type=int, default=20260902, help="Random seed for determinism")
    parser.add_argument("--outdir", type=str, default="dataset/data", help="Output directory")
    parser.add_argument("--truthdir", type=str, default="dataset/ground_truth", help="Ground truth directory")
    return parser.parse_args()

def generate_id(prefix):
    return f"{prefix}_{uuid.uuid4().hex[:8].upper()}"

def random_date(start, end):
    delta = end - start
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start + timedelta(seconds=random_second)

def main():
    args = get_args()
    random.seed(args.seed)
    
    os.makedirs(args.outdir, exist_ok=True)
    os.makedirs(args.truthdir, exist_ok=True)
    
    start_date = datetime(2026, 7, 1)
    end_date = datetime(2026, 9, 2)
    
    payments = []
    settlements = []
    bank_statements = []
    refunds = []
    chargebacks = []
    ledgers = []
    ground_truth = []
    
    merchants = [f"MERCH_{i:03d}" for i in range(1, 50)]
    
    for i in range(args.rows):
        case_id = f"CASE_{i:05d}"
        
        # Determine scenario type based on probabilities
        rand_val = random.random()
        if rand_val < 0.4:
            anomaly = "CLEAN"
        elif rand_val < 0.45:
            anomaly = "REFERENCE_TYPO"
        elif rand_val < 0.5:
            anomaly = "TIMING_DIFFERENCE"
        elif rand_val < 0.55:
            anomaly = "REFUND"
        elif rand_val < 0.6:
            anomaly = "CHARGEBACK"
        elif rand_val < 0.65:
            anomaly = "FEE_VARIANCE"
        elif rand_val < 0.7:
            anomaly = "TAX_VARIANCE"
        elif rand_val < 0.75:
            anomaly = "DUPLICATE"
        elif rand_val < 0.78:
            anomaly = "MISSING_PAYMENT"
        elif rand_val < 0.81:
            anomaly = "MISSING_SETTLEMENT"
        elif rand_val < 0.85:
            anomaly = "ONE_TO_MANY"
        elif rand_val < 0.88:
            anomaly = "AMBIGUOUS"
        elif rand_val < 0.90:
            anomaly = "HIGH_VALUE_ANOMALY"
        elif rand_val < 0.95:
            anomaly = "UNEXPLAINED_DELTA"
        else:
            anomaly = "OTHER"
            
        base_amount = random.randint(100, 20000) * 100 # Minor units
        if anomaly == "HIGH_VALUE_ANOMALY":
            base_amount = random.choice([55000, 150000, 300000, 600000]) * 100
            
        merchant = random.choice(merchants)
        date = random_date(start_date, end_date)
        
        pay_id = generate_id("PAY")
        set_id = generate_id("SET")
        bnk_id = generate_id("BNK")
        ord_id = generate_id("ORD")
        
        payment_amount = base_amount
        settlement_expected = base_amount
        actual_settlement = base_amount
        
        # Base fee/tax
        fee = int(base_amount * 0.02)
        tax = int(fee * 0.18)
        
        settlement_expected = base_amount - fee - tax
        actual_settlement = settlement_expected
        
        # Adjust amounts based on anomaly
        refund_amount = 0
        chargeback_amount = 0
        adjustments = 0
        
        pay_date = date
        set_date = date + timedelta(days=2)
        bnk_date = set_date
        
        pay_ref = f"REF-{pay_id}"
        set_ref = f"REF-{pay_id}"
        bnk_ref = set_id
        
        if anomaly == "CLEAN":
            pass
        elif anomaly == "REFERENCE_TYPO":
            set_ref = f"REF-{pay_id}-TYPO"
        elif anomaly == "TIMING_DIFFERENCE":
            set_date = set_date + timedelta(days=5)
            bnk_date = set_date
        elif anomaly == "REFUND":
            refund_amount = int(base_amount * 0.5)
            actual_settlement -= refund_amount
            settlement_expected -= refund_amount
        elif anomaly == "CHARGEBACK":
            chargeback_amount = base_amount
            actual_settlement -= chargeback_amount
            settlement_expected -= chargeback_amount
        elif anomaly == "FEE_VARIANCE":
            actual_settlement -= 100
        elif anomaly == "TAX_VARIANCE":
            actual_settlement += 50
        elif anomaly == "UNEXPLAINED_DELTA":
            actual_settlement -= random.randint(10, 500) * 100
        elif anomaly == "AMBIGUOUS":
            set_ref = f"SETTLE-{merchant}-BULK"
        elif anomaly == "HIGH_VALUE_ANOMALY":
            set_ref = f"SETTLE-{merchant}-HV"
        
        # Create records
        if anomaly != "MISSING_PAYMENT":
            payments.append({
                "payment_id": pay_id,
                "order_id": ord_id,
                "merchant_id": merchant,
                "amount": payment_amount,
                "currency": "INR",
                "status": "CAPTURED",
                "created_at": pay_date.isoformat() + "Z",
                "reference": pay_ref
            })
            
            ledgers.append({
                "ledger_id": generate_id("LDG"),
                "payment_id": pay_id,
                "account": "ACCOUNTS_RECEIVABLE",
                "amount": payment_amount,
                "type": "CREDIT",
                "created_at": pay_date.isoformat() + "Z"
            })
            
        if refund_amount > 0:
            refunds.append({
                "refund_id": generate_id("REF"),
                "payment_id": pay_id,
                "amount": refund_amount,
                "currency": "INR",
                "created_at": (pay_date + timedelta(days=1)).isoformat() + "Z"
            })
            
        if chargeback_amount > 0:
            chargebacks.append({
                "chargeback_id": generate_id("CHB"),
                "payment_id": pay_id,
                "amount": chargeback_amount,
                "currency": "INR",
                "created_at": (pay_date + timedelta(days=1)).isoformat() + "Z"
            })
            
        if anomaly != "MISSING_SETTLEMENT":
            settlements.append({
                "settlement_id": set_id,
                "merchant_id": merchant,
                "gross_amount": payment_amount,
                "fees": fee,
                "tax": tax,
                "refunds": refund_amount,
                "chargebacks": chargeback_amount,
                "adjustments": adjustments,
                "net_amount": actual_settlement,
                "currency": "INR",
                "status": "PROCESSED",
                "created_at": set_date.isoformat() + "Z",
                "payment_reference": set_ref
            })
            
            bank_statements.append({
                "bank_txn_id": bnk_id,
                "amount": actual_settlement,
                "currency": "INR",
                "type": "CREDIT",
                "transaction_date": bnk_date.isoformat() + "Z",
                "description": f"SETTLEMENT {bnk_ref}",
                "reference": bnk_ref
            })
            
        # Optional Duplicate Payment
        if anomaly == "DUPLICATE":
            dup_pay_id = generate_id("PAY")
            payments.append({
                "payment_id": dup_pay_id,
                "order_id": ord_id,
                "merchant_id": merchant,
                "amount": payment_amount,
                "currency": "INR",
                "status": "CAPTURED",
                "created_at": pay_date.isoformat() + "Z",
                "reference": pay_ref
            })
            
        # Ground Truth mapping
        expected_decision = "MATCHED"
        if anomaly in ["UNEXPLAINED_DELTA", "FEE_VARIANCE", "TAX_VARIANCE", "MISSING_PAYMENT", "MISSING_SETTLEMENT"]:
            expected_decision = "EXCEPTION"
        elif anomaly in ["AMBIGUOUS", "HIGH_VALUE_ANOMALY", "DUPLICATE"]:
            expected_decision = "REVIEW"
            
        ground_truth.append({
            "case_id": case_id,
            "payment_id": pay_id if anomaly != "MISSING_PAYMENT" else None,
            "settlement_id": set_id if anomaly != "MISSING_SETTLEMENT" else None,
            "bank_txn_id": bnk_id if anomaly != "MISSING_SETTLEMENT" else None,
            "anomaly_type": anomaly,
            "expected_decision": expected_decision,
            "expected_settlement": settlement_expected,
            "actual_settlement": actual_settlement
        })

    def write_csv(filename, data):
        if not data: return
        filepath = os.path.join(args.outdir, filename)
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
            
    write_csv("payments.csv", payments)
    write_csv("settlements.csv", settlements)
    write_csv("bank_statement.csv", bank_statements)
    write_csv("refunds.csv", refunds)
    write_csv("chargebacks.csv", chargebacks)
    write_csv("ledger.csv", ledgers)
    
    gt_filepath = os.path.join(args.truthdir, "ground_truth.csv")
    if ground_truth:
        with open(gt_filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=ground_truth[0].keys())
            writer.writeheader()
            writer.writerows(ground_truth)
            
    print(f"Generated {len(payments)} payments, {len(settlements)} settlements.")
    print("Dataset generated successfully.")

if __name__ == "__main__":
    main()
