import os
import re

BASE_DIR = os.path.abspath(".")
DOC_FILES = ["README.md", "SYSTEM_DESIGN.md"]

for root, _, files in os.walk(os.path.join(BASE_DIR, "docs")):
    for f in files:
        if f.endswith(".md"):
            DOC_FILES.append(os.path.relpath(os.path.join(root, f), BASE_DIR))

link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')

broken_count = 0
total_links = 0

print(f"Scanning {len(DOC_FILES)} markdown documents for internal links...")

for doc_path in DOC_FILES:
    full_path = os.path.join(BASE_DIR, doc_path)
    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    doc_dir = os.path.dirname(full_path)
    matches = link_pattern.findall(content)

    for label, target in matches:
        # Ignore external links, mailto, anchor-only links, file:/// absolute links, etc.
        if target.startswith(("http://", "https://", "mailto:", "#", "file:///")):
            continue
        
        # Strip anchor from target
        target_path = target.split("#")[0]
        if not target_path:
            continue

        total_links += 1
        resolved_path = os.path.normpath(os.path.join(doc_dir, target_path))

        if not os.path.exists(resolved_path):
            print(f"[BROKEN] {doc_path} -> '{target}' (resolved: {resolved_path})")
            broken_count += 1

print(f"\nScan complete: Verified {total_links} internal links.")
if broken_count == 0:
    print("SUCCESS: 0 broken internal links found! All links are valid.")
else:
    print(f"FAILED: Found {broken_count} broken links.")
