import requests

def run_reconciliation():
    print("Starting reconciliation run...")
    try:
        response = requests.post("http://localhost:8000/api/reconciliation/run")
        response.raise_for_status()
        data = response.json()
        print(f"Success! Processed {data.get('cases_processed')} cases.")
    except Exception as e:
        print(f"Error running reconciliation: {e}")

if __name__ == "__main__":
    run_reconciliation()
