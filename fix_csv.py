"""
fix_csv.py — Cleans a FortuneMarq leads CSV file:
  1. Sets Has Website = Y only if a Website URL column has a real URL, otherwise N
  2. Removes duplicate phone numbers (keeps first occurrence)
  3. Saves a clean version as <original_name>_FIXED.csv

Usage:
  python3 fix_csv.py path/to/your/leads.csv
"""

import csv
import sys
import os
from collections import OrderedDict

def is_real_url(value):
    if not value:
        return False
    v = value.strip().lower()
    return v.startswith("http") or v.startswith("www.") or ("." in v and len(v) > 4)

def normalize_phone(phone):
    if not phone:
        return ""
    return "".join(c for c in str(phone) if c.isdigit())

def fix_csv(input_path):
    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}")
        sys.exit(1)

    with open(input_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    if not rows:
        print("Error: CSV is empty.")
        sys.exit(1)

    print(f"\nOriginal rows: {len(rows)}")
    print(f"Columns found: {fieldnames}\n")

    # Detect website URL column (if any)
    website_col = None
    for col in fieldnames:
        if "website" in col.lower() and "has" not in col.lower():
            website_col = col
            break

    if website_col:
        print(f"Website URL column found: '{website_col}'")
    else:
        print("No Website URL column found — will set Has Website = N for all rows")

    # Detect Has Website column
    has_website_col = None
    for col in fieldnames:
        if col.strip().lower() == "has website":
            has_website_col = col
            break

    fixed_rows = []
    seen_phones = OrderedDict()
    dupe_count = 0
    website_fixed_count = 0

    for row in rows:
        phone = normalize_phone(row.get("Phone") or row.get("Phone No") or "")

        # Skip duplicate phones
        if phone and phone in seen_phones:
            dupe_count += 1
            continue
        if phone:
            seen_phones[phone] = True

        # Fix Has Website
        if has_website_col:
            if website_col:
                url = row.get(website_col, "").strip()
                correct_value = "Y" if is_real_url(url) else "N"
            else:
                correct_value = "N"

            old_value = row.get(has_website_col, "").strip()
            if old_value != correct_value:
                website_fixed_count += 1
            row[has_website_col] = correct_value

        fixed_rows.append(row)

    # Write output
    base, ext = os.path.splitext(input_path)
    output_path = base + "_FIXED" + ext

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(fixed_rows)

    print(f"Results:")
    print(f"  Duplicate rows removed : {dupe_count}")
    print(f"  Has Website corrected  : {website_fixed_count} rows")
    print(f"  Final clean rows       : {len(fixed_rows)}")
    print(f"\nSaved to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 fix_csv.py path/to/your/leads.csv")
        sys.exit(1)
    fix_csv(sys.argv[1])
