import csv
import os
import sys

def validate_dataset(data_dir="dataset/data", truth_dir="dataset/ground_truth"):
    if not os.path.exists(data_dir) or not os.path.exists(truth_dir):
        print("Data directories do not exist. Please run generate_dataset.py first.")
        sys.exit(1)

    try:
        with open(os.path.join(data_dir, "payments.csv"), 'r') as f:
            payments = list(csv.DictReader(f))
        with open(os.path.join(data_dir, "settlements.csv"), 'r') as f:
            settlements = list(csv.DictReader(f))
            
        print(f"Validating {len(payments)} payments and {len(settlements)} settlements...")
        
        # Simple schema validation
        if payments and 'payment_id' not in payments[0]:
            print("ERROR: payment_id missing in payments.csv")
            sys.exit(1)
            
        print("Dataset validation passed!")
        sys.exit(0)
    except Exception as e:
        print(f"Validation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    validate_dataset()
