import os
import time
from playwright.sync_api import sync_playwright

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
OUTPUT_DIR = os.path.abspath("docs/images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def capture():
    print(f"Launching Edge from {EDGE_PATH}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=EDGE_PATH,
            headless=True,
            args=["--disable-gpu", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            color_scheme="dark"
        )
        page = context.new_page()

        # 1. Overview Dashboard
        print("Capturing Overview Dashboard...")
        page.goto("http://localhost:5173/overview", wait_until="networkidle")
        time.sleep(2)
        overview_path = os.path.join(OUTPUT_DIR, "arivo-dashboard.png")
        page.screenshot(path=overview_path, full_page=False)
        print(f"Saved: {overview_path} ({os.path.getsize(overview_path)} bytes)")

        # 2. Control Center
        print("Capturing Control Center...")
        page.goto("http://localhost:5173/control-center", wait_until="networkidle")
        time.sleep(2)
        cc_path = os.path.join(OUTPUT_DIR, "arivo-control-center.png")
        page.screenshot(path=cc_path, full_page=False)
        print(f"Saved: {cc_path} ({os.path.getsize(cc_path)} bytes)")

        # 3. Benchmark Page
        print("Capturing Benchmark Page...")
        page.goto("http://localhost:5173/benchmark", wait_until="networkidle")
        time.sleep(2)
        bench_path = os.path.join(OUTPUT_DIR, "arivo-benchmark.png")
        page.screenshot(path=bench_path, full_page=False)
        print(f"Saved: {bench_path} ({os.path.getsize(bench_path)} bytes)")

        # 4. Reconciliation with Evidence Drawer (Flagship Safety Demo)
        print("Capturing Reconciliation with Evidence Drawer for Flagship Case...")
        page.goto("http://localhost:5173/benchmark", wait_until="networkidle")
        time.sleep(2)
        inspect_btn = page.locator("button:has-text('Inspect Forensic Drawer')")
        if inspect_btn.count() > 0:
            inspect_btn.first.click()
            time.sleep(2)
            drawer_path = os.path.join(OUTPUT_DIR, "arivo-flagship-drawer.png")
            page.screenshot(path=drawer_path, full_page=False)
            print(f"Saved: {drawer_path} ({os.path.getsize(drawer_path)} bytes)")

        browser.close()
        print("All screenshots captured successfully!")

if __name__ == "__main__":
    capture()
