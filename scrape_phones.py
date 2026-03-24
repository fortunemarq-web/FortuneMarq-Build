"""
FortuneMarq — Phone Number Recovery Script
Searches each business on Google and extracts phone from Knowledge Panel
Targets: Gyms and Skin Clinics across all 9 cities (17 files)
Run: python3 scrape_phones.py
"""

import csv
import time
import os
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

# ── CONFIG ────────────────────────────────────────────────────────────────────
BASE     = Path.home() / "Desktop" / "FortuneMarq_Build" / "07_DATA_AND_RESEARCH" / "Lead_Database"
PROGRESS = Path.home() / "Desktop" / "FortuneMarq_Build" / "phone_scrape_progress.json"

# All 17 files that need phone recovery
TARGET_FILES = [
    BASE / "Ballari_Cleaned_Leads"    / "Ballari_Gyms.csv",
    BASE / "Ballari_Cleaned_Leads"    / "Ballari_Skin_Clinics.csv",
    BASE / "Belgaum_cleaned_leads"    / "Belgaum_Gym.csv",
    BASE / "Belgaum_cleaned_leads"    / "Belgaum_Skin_Clinic.csv",
    BASE / "Davangere_Cleaned_Leads"  / "Davangere_Gyms.csv",
    BASE / "Davangere_Cleaned_Leads"  / "Davangere_Skin_Clinics.csv",
    BASE / "Dharwad_cleaned_leads"    / "Dharwad_Gym.csv",
    BASE / "Hubli_cleaned_leads"      / "Hubli_Gym.csv",
    BASE / "Hubli_cleaned_leads"      / "Hubli_Skin_Clinics.csv",
    BASE / "Kalburgi_cleaned_leads"   / "Kalaburgi_Gym.csv",
    BASE / "Kalburgi_cleaned_leads"   / "Kalaburgi_Skin_Clinic.csv",
    BASE / "Mysuru_Cleaned_Leads"     / "Mysuru_Gyms.csv",
    BASE / "Mysuru_Cleaned_Leads"     / "Mysuru_Skin_Clinics.csv",
    BASE / "Vijayapura_Cleaned_Leads" / "Vijayapura_Gyms.csv",
    BASE / "Vijayapura_Cleaned_Leads" / "Vijayapura_Skin_Clinics.csv",
    BASE / "manglore_cleaned_leads"   / "Mangalore_Gym.csv",
]

# ── PROGRESS TRACKING ─────────────────────────────────────────────────────────
def load_progress():
    if PROGRESS.exists():
        with open(PROGRESS) as f:
            return json.load(f)
    return {}

def save_progress(data):
    with open(PROGRESS, "w") as f:
        json.dump(data, f, indent=2)

# ── PHONE EXTRACTION ──────────────────────────────────────────────────────────
def extract_phone(page, business_name, city):
    """Search Google for business and extract phone from Knowledge Panel"""
    query = f"{business_name} {city}"
    try:
        page.goto(f"https://www.google.com/search?q={query.replace(' ', '+')}", 
                  timeout=15000)
        page.wait_for_timeout(2000)

        # Try multiple selectors for phone number in Knowledge Panel
        selectors = [
            # Standard Knowledge Panel phone
            "span[aria-label*='Phone']",
            "[data-dtype='d3ph']",
            # Phone with specific patterns
            "a[href^='tel:']",
            # Business info section
            ".rllt__details span:has-text('+91')",
            ".rllt__details span:has-text('0')",
            # Maps knowledge panel
            "[data-local-attribute='d3ph']",
            # Generic phone pattern in knowledge panel
            "div.Z0LcW",
        ]

        for sel in selectors:
            try:
                el = page.query_selector(sel)
                if el:
                    text = el.inner_text().strip()
                    if text and any(c.isdigit() for c in text):
                        phone = clean_phone(text)
                        if phone:
                            return phone
            except:
                continue

        # Try extracting from href tel: links
        tel_links = page.query_selector_all("a[href^='tel:']")
        for link in tel_links:
            href = link.get_attribute("href") or ""
            phone = href.replace("tel:", "").strip()
            if phone:
                return clean_phone(phone)

        # Try finding any 10-digit number pattern in knowledge panel
        try:
            panel = page.query_selector("#rhs, .kp-wholepage, .osrp-blk")
            if panel:
                text = panel.inner_text()
                phone = find_phone_in_text(text)
                if phone:
                    return phone
        except:
            pass

        # Last resort — search entire page for Indian phone pattern
        try:
            content = page.content()
            phone = find_phone_in_text(content)
            if phone:
                return phone
        except:
            pass

        return ""

    except Exception as e:
        print(f"    Error searching '{business_name}': {e}")
        return ""

def clean_phone(phone):
    """Clean and validate phone number"""
    import re
    # Remove all non-numeric chars except +
    digits = re.sub(r"[^\d+]", "", phone)
    # Remove country code
    if digits.startswith("+91"):
        digits = digits[3:]
    elif digits.startswith("91") and len(digits) > 10:
        digits = digits[2:]
    # Validate 10-digit Indian mobile
    if len(digits) == 10 and digits[0] in "6789":
        return digits
    # Also accept landlines (8 digits with STD code)
    if len(digits) >= 8:
        return digits
    return ""

def find_phone_in_text(text):
    """Find Indian phone number pattern in text"""
    import re
    # Indian mobile: starts with 6-9, 10 digits
    patterns = [
        r'\+91[\s\-]?([6-9]\d{9})',
        r'\b([6-9]\d{9})\b',
        r'\b0([6-9]\d{9})\b',
        r'\b(\d{4}[\s\-]\d{6})\b',
        r'\b(\d{5}[\s\-]\d{5})\b',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            phone = re.sub(r"[^\d]", "", match.group(1))
            if len(phone) >= 10:
                return phone[-10:]
    return ""

# ── PROCESS ONE FILE ──────────────────────────────────────────────────────────
def process_file(filepath, page, progress):
    filepath = Path(filepath)
    if not filepath.exists():
        print(f"  SKIP (not found): {filepath.name}")
        return

    file_key = str(filepath)
    file_progress = progress.get(file_key, {})

    # Read all rows
    with open(filepath, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    total       = len(rows)
    found       = 0
    already_had = 0
    skipped     = 0
    updated     = 0

    print(f"\n  Processing: {filepath.name} ({total} rows)")

    for i, row in enumerate(rows):
        name  = row.get("BUSINESS NAME", "").strip()
        phone = row.get("PHONE", "").strip()
        city  = row.get("CITY", "").strip()

        # Skip if already has phone
        if phone:
            already_had += 1
            continue

        # Skip if no business name
        if not name:
            skipped += 1
            continue

        # Check if already scraped in this session
        if name in file_progress:
            recovered = file_progress[name]
            if recovered:
                row["PHONE"] = recovered
                found += 1
            continue

        # Search Google
        print(f"    [{i+1}/{total}] {name[:50]}...", end=" ", flush=True)
        recovered = extract_phone(page, name, city)

        if recovered:
            row["PHONE"] = recovered
            file_progress[name] = recovered
            found += 1
            updated += 1
            print(f"✓ {recovered}")
        else:
            file_progress[name] = ""
            print("✗ not found")

        # Save progress after every row
        progress[file_key] = file_progress
        save_progress(progress)

        # Polite delay to avoid rate limiting
        time.sleep(2.5)

    # Write updated CSV back
    with open(filepath, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"  DONE: {filepath.name}")
    print(f"        Already had phone: {already_had}")
    print(f"        Recovered:         {found}")
    print(f"        Not found:         {total - already_had - found - skipped}")
    print(f"        Skipped (no name): {skipped}")

    return {"total": total, "recovered": found, "already_had": already_had}

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    progress = load_progress()

    print("\n" + "="*60)
    print("  FortuneMarq — Phone Number Recovery")
    print(f"  Target files: {len(TARGET_FILES)}")
    print("  Press Ctrl+C at any time — progress is saved")
    print("="*60)

    # Check which files exist
    existing = [f for f in TARGET_FILES if Path(f).exists()]
    missing  = [f for f in TARGET_FILES if not Path(f).exists()]

    if missing:
        print(f"\n  WARNING: {len(missing)} files not found:")
        for f in missing:
            print(f"    - {Path(f).name}")

    print(f"\n  Will process {len(existing)} files\n")

    total_recovered = 0
    total_processed = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Show browser so you can see what's happening
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="en-IN",
        )
        page = context.new_page()

        # Visit Google once to accept cookies if needed
        print("  Opening Google...")
        page.goto("https://www.google.com", timeout=15000)
        page.wait_for_timeout(2000)

        # Accept cookies if dialog appears
        try:
            accept = page.query_selector("button:has-text('Accept all'), button:has-text('I agree')")
            if accept:
                accept.click()
                page.wait_for_timeout(1000)
        except:
            pass

        print("  Google ready. Starting scrape...\n")

        try:
            for filepath in existing:
                result = process_file(filepath, page, progress)
                if result:
                    total_recovered += result.get("recovered", 0)
                    total_processed += result.get("total", 0)
        except KeyboardInterrupt:
            print("\n\n  Interrupted — progress saved. Re-run to continue.")

        browser.close()

    print("\n" + "="*60)
    print(f"  COMPLETE")
    print(f"  Total businesses processed: {total_processed}")
    print(f"  Phone numbers recovered:    {total_recovered}")
    print(f"  Progress saved to:          {PROGRESS}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
