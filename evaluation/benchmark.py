import csv
import os

def run_benchmark():
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        import importlib
        database = importlib.import_module("backend.database")
        
        # We'll just read from the DB for the benchmark if it's there
        engine = create_engine(database.DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        total = db.query(database.ReconciliationCase).count()
        if total == 0:
            print("No cases in DB. Please run reconciliation first.")
            return
            
        matched = db.query(database.ReconciliationCase).filter(database.ReconciliationCase.status == "MATCHED").count()
        review = db.query(database.ReconciliationCase).filter(database.ReconciliationCase.status == "REVIEW").count()
        exceptions = db.query(database.ReconciliationCase).filter(database.ReconciliationCase.status == "EXCEPTION").count()
        
        print("ARIVO BENCHMARK RESULTS")
        print("=======================")
        print(f"Total Cases: {total}")
        print(f"Matched: {matched} ({(matched/total)*100:.1f}%)")
        print(f"Review Required: {review} ({(review/total)*100:.1f}%)")
        print(f"Exceptions: {exceptions} ({(exceptions/total)*100:.1f}%)")
        
        # Calculate false matches by joining with ground truth
        gt_path = "dataset/ground_truth/ground_truth.csv"
        if os.path.exists(gt_path):
            with open(gt_path, 'r') as f:
                gt = list(csv.DictReader(f))
                
            gt_dict = {row['case_id']: row for row in gt}
            
            false_matches = 0
            for case in db.query(database.ReconciliationCase).all():
                gt_case = gt_dict.get(case.case_id)
                if gt_case:
                    if case.status == "MATCHED" and gt_case["expected_decision"] != "MATCHED":
                        false_matches += 1
                        
            print(f"False Matches: {false_matches}")
            
    except BaseException as e:
        print(f"Benchmark error: {e}")
        
if __name__ == "__main__":
    run_benchmark()
