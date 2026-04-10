"""
Import Hubli Final leads into FMOS Supabase database.
- Deletes all existing leads
- Uploads all 11 Hubli_Final CSV files
"""

import csv
import json
import time
import uuid
import os
import sys
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SUPABASE_URL = "https://cnwooodktqwvpzkucskm.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud29vb2RrdHF3dnB6a3Vjc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDA3NDEsImV4cCI6MjA4MDYxNjc0MX0.IMaJkvxUyauj6ZsHv79cJGZuP1UrnzXK0tdFvbaqQgs"

HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

HUBLI_FINAL_DIR = "/Users/fortunemarq/Desktop/FortuneMarq-Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final"

BATCH_ID = f"hubli_import_{int(time.time())}"

# Niche → industry name (used as-is from CSV Niche column)
# The CSV has values like "Gyms", "Dental Clinics", etc.

def api_request(method, path, data=None):
    url = f"{SUPABASE_URL}{path}"
    body = json.dumps(data).encode() if data else None
    req = Request(url, data=body, method=method)
    for k, v in HEADERS.items():
        req.add_header(k, v)
    try:
        with urlopen(req) as resp:
            content = resp.read()
            return resp.status, content.decode() if content else ""
    except HTTPError as e:
        return e.code, e.read().decode()

def delete_all_leads():
    print("Deleting all existing leads...")
    status, body = api_request("DELETE", "/rest/v1/leads?id=neq.00000000-0000-0000-0000-000000000000")
    if status in (200, 204):
        print("  All leads deleted.")
    else:
        print(f"  Delete failed: {status} — {body}")
        sys.exit(1)

def read_csv(filepath):
    leads = []
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("Business Name", "").strip()
            if not name:
                continue

            phone_raw = (row.get("Phone") or row.get("Phone No") or "").strip()
            phone = phone_raw if phone_raw else None

            has_website_raw = (row.get("Has Website") or "").strip().upper()
            has_website = has_website_raw in ("Y", "YES", "TRUE", "1")

            website_link_raw = (row.get("Website Link") or "").strip()
            website_link = website_link_raw if website_link_raw else None
            if not has_website:
                website_link = None

            gmb_link_raw = (row.get("Google Maps Link") or "").strip()
            gmb_link = gmb_link_raw if gmb_link_raw else None

            industry = (row.get("Niche") or "").strip()

            serp_ranked_raw = (row.get("SERP_Ranked") or row.get("SERP Ranked") or "").strip().upper()
            serp_ranked = serp_ranked_raw in ("Y", "YES", "TRUE", "1") if serp_ranked_raw else None

            serp_source_raw = (row.get("SERP_Source") or row.get("SERP Source") or "").strip()
            serp_source = serp_source_raw if serp_source_raw else None

            tags = []
            if serp_ranked is True:
                tags.append("SERP Ranked")
            elif serp_ranked is False:
                tags.append("Not SERP Ranked")

            leads.append({
                "company_name": name,
                "phone": phone,
                "city": "Hubli",
                "industry": industry,
                "has_website": has_website,
                "website_link": website_link,
                "gmb_link": gmb_link,
                "source": "manual_upload",
                "lead_type": "outbound",
                "status": "new",
                "import_batch_id": BATCH_ID,
                "serp_ranked": serp_ranked,
                "serp_source": serp_source,
                "tags": tags,
            })
    return leads

def insert_batch(batch):
    status, body = api_request("POST", "/rest/v1/leads", batch)
    if status in (200, 201):
        return True
    else:
        print(f"  Insert error {status}: {body[:300]}")
        return False

def main():
    csv_files = sorted([
        f for f in os.listdir(HUBLI_FINAL_DIR)
        if f.endswith(".csv") and f.startswith("Hubli_")
    ])

    print(f"\nFound {len(csv_files)} Hubli Final CSV files:")
    for f in csv_files:
        print(f"  {f}")

    print()
    delete_all_leads()
    print()

    total_added = 0
    total_skipped = 0

    for filename in csv_files:
        filepath = os.path.join(HUBLI_FINAL_DIR, filename)
        leads = read_csv(filepath)
        niche = filename.replace("Hubli_", "").replace("_Final.csv", "")
        print(f"Uploading {niche}: {len(leads)} leads...", end=" ", flush=True)

        added = 0
        BATCH_SIZE = 50
        for i in range(0, len(leads), BATCH_SIZE):
            batch = leads[i:i + BATCH_SIZE]
            if insert_batch(batch):
                added += len(batch)

        print(f"{added} inserted.")
        total_added += added
        total_skipped += (len(leads) - added)

    print(f"\nDone. Total inserted: {total_added} | Failed: {total_skipped}")
    print(f"Batch ID: {BATCH_ID}")

if __name__ == "__main__":
    main()
