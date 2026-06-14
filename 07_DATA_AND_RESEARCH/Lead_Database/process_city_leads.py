#!/usr/bin/env python3
"""
Generalized City Leads Processing Script
Tasks: Merge, Clean, Dedup, (SERP Match if data available), Split by Niche, Report

Usage:
    python3 process_city_leads.py <City>

    e.g. python3 process_city_leads.py Dharwad

Input:
    Lead_Database/<City>_cleaned_leads/*.csv
    Single-format columns expected:
        Business Name, Owner Name, Phone, City, Niche, Has Website,
        GMB Rating, GMB Reviews, Lead Source, Import Date, Status

    (This is different from Hubli's two-folder F1/F2 layout — Hubli has its
    own dedicated script, process_hubli_leads_v2.py. This script is for all
    other cities using the single-folder "_cleaned_leads" format.)

SERP matching:
    If Competitor_Data/<City>/<City>_GBP_Data.csv and/or
    <City>_Organic_Results.csv exist, performs the same SERP cross-matching
    logic as the Hubli pipeline. If neither exists, SERP Ranked is set to
    "Not Scraped" and SERP Source is left blank — this is expected for
    cities that haven't had a SearchAPI.io scrape done yet.

Output:
    Lead_Database/<City>_All_Leads_Clean.csv   (master deduped file)
    Lead_Database/<City>_Final/<City>_<Niche>_Final.csv  (split by niche)
"""

import os
import re
import sys
import csv
from urllib.parse import urlparse
from collections import defaultdict, Counter

# ─── CONFIG ───────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print("Usage: python3 process_city_leads.py <City>")
    sys.exit(1)

CITY = sys.argv[1]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, "Lead_Database", f"{CITY}_cleaned_leads")
SERP_GBP = os.path.join(BASE_DIR, "Competitor_Data", CITY, f"{CITY}_GBP_Data.csv")
SERP_ORGANIC = os.path.join(BASE_DIR, "Competitor_Data", CITY, f"{CITY}_Organic_Results.csv")
OUTPUT_MASTER = os.path.join(BASE_DIR, "Lead_Database", f"{CITY}_All_Leads_Clean.csv")
OUTPUT_DIR = os.path.join(BASE_DIR, "Lead_Database", f"{CITY}_Final")

# Niche normalisations from column values (lowercased)
NICHE_VALUE_MAP = {
    "gym": "Gyms",
    "skin clinic": "Skin Clinics",
    "computer training institute": "Computer Training",
    "computer training": "Computer Training",
    "dental clinic": "Dental Clinics",
    "jee coaching": "JEE NEET Coaching",
    "neet coaching": "JEE NEET Coaching",
    "jee neet coaching": "JEE NEET Coaching",
    "car rental": "Car Rentals",
    "physiotherapy clinic": "Physiotherapy",
    "physiotherapy": "Physiotherapy",
    "ivf clinic": "IVF Clinics",
    "ivf fertility clinic": "IVF Clinics",
    "ielts coaching": "IELTS Coaching",
    "interior designer": "Interior Designers",
    "modular kitchen": "Modular Kitchens",
    "real estate agent": "Real Estate",
    "real estate": "Real Estate",
    "tuition centre": "Tuition Centres",
    "tuition center": "Tuition Centres",
    "hotel": "Hotels",
}

# Niche priority — higher = preferred when same business appears in multiple niches
NICHE_PRIORITY = {
    "Gyms": 10,
    "Skin Clinics": 10,
    "Computer Training": 10,
    "Dental Clinics": 10,
    "JEE NEET Coaching": 10,
    "Car Rentals": 10,
    "Physiotherapy": 10,
    "IVF Clinics": 10,
    "IELTS Coaching": 10,
    "Interior Designers": 8,
    "Modular Kitchens": 9,   # Modular Kitchens > Interior Designers (more specific)
    "Real Estate": 10,
    "Tuition Centres": 5,    # Lower priority — JEE/NEET businesses shouldn't fall here
    "Hotels": 10,
    "UNKNOWN": 0,
}

# Per-niche output filename suffix (combined with city name)
NICHE_FILENAME_SUFFIX = {
    "Gyms": "Gyms",
    "Skin Clinics": "SkinClinics",
    "Computer Training": "ComputerTraining",
    "Dental Clinics": "DentalClinics",
    "JEE NEET Coaching": "JEENEETCoaching",
    "Car Rentals": "CarRentals",
    "Physiotherapy": "Physiotherapy",
    "IVF Clinics": "IVFClinics",
    "IELTS Coaching": "IELTSCoaching",
    "Interior Designers": "InteriorDesigners",
    "Modular Kitchens": "ModularKitchens",
    "Real Estate": "RealEstate",
    "Tuition Centres": "TuitionCentres",
    "Hotels": "Hotels",
    "UNKNOWN": "UNKNOWN",
}

OUTPUT_COLS = ["Business Name", "Phone", "City", "Niche", "Has Website",
               "Website Link", "Google Maps Link", "SERP Ranked", "SERP Source"]

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def read_csv(path):
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    return rows, fieldnames

def clean_phone(raw):
    if not raw:
        return "MISSING"
    digits = re.sub(r'\D', '', str(raw))
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    if len(digits) == 10:
        return digits
    return "MISSING"

def is_google_maps(url):
    if not url:
        return False
    return 'google.com/maps' in url or 'maps.google' in url or 'goo.gl/maps' in url

def is_google_ad(url):
    if not url:
        return False
    return 'google.com/aclk' in url or 'googleadservices' in url

def is_valid_website(url):
    if not url:
        return False
    url = url.strip()
    if url.upper() in ('NIL', 'N/A', 'NA', '', 'NO', 'NONE'):
        return False
    if is_google_maps(url):
        return False
    if is_google_ad(url):
        return False
    if url.startswith('http'):
        return True
    return False

def normalise_niche_from_value(val):
    if not val:
        return None
    key = val.strip().lower()
    return NICHE_VALUE_MAP.get(key, None)

def get_domain(url):
    if not url:
        return ""
    try:
        parsed = urlparse(url if url.startswith('http') else 'http://' + url)
        domain = parsed.netloc.lower()
        domain = re.sub(r'^www\.', '', domain)
        return domain
    except Exception:
        return ""

def norm_name(n):
    return re.sub(r'\s+', ' ', n.strip().lower())

# ─── TASK A: READ ALL FILES INTO A UNIFIED RECORD STORE ──────────────────────

print("\n" + "="*60)
print(f"PROCESSING {CITY.upper()} LEADS")
print("="*60)

business_store = {}              # norm_name -> merged record dict
business_niches = defaultdict(list)  # norm_name -> list of niches seen

total_raw = 0


def upsert_business(nn, bname, phone, niche, has_website, website_link, maps_link):
    """Insert or update a business record, always keeping the richest data."""
    if nn not in business_store:
        business_store[nn] = {
            'Business Name': bname,
            'Phone': phone,
            'City': CITY,
            'Niche': niche,
            'Has Website': has_website,
            'Website Link': website_link,
            'Google Maps Link': maps_link,
            'SERP Ranked': '',
            'SERP Source': '',
        }
    else:
        rec = business_store[nn]
        # Prefer longer business name (more complete)
        if len(bname) > len(rec['Business Name']):
            rec['Business Name'] = bname
        # Prefer non-MISSING phone
        if rec['Phone'] == 'MISSING' and phone != 'MISSING':
            rec['Phone'] = phone
        # Prefer actual website URL
        if not rec['Website Link'] and website_link:
            rec['Website Link'] = website_link
            rec['Has Website'] = 'Y'
        elif rec['Has Website'] != 'Y' and has_website == 'Y':
            rec['Has Website'] = 'Y'
        # Prefer actual maps link
        if not rec['Google Maps Link'] and maps_link:
            rec['Google Maps Link'] = maps_link

    if niche:
        business_niches[nn].append(niche)


if not os.path.isdir(INPUT_DIR):
    print(f"ERROR: input directory not found: {INPUT_DIR}")
    sys.exit(1)

input_files = sorted(f for f in os.listdir(INPUT_DIR) if f.lower().endswith('.csv'))
print(f"\nFound {len(input_files)} input files in {INPUT_DIR}")

unmapped_niches = Counter()

for fname in input_files:
    fpath = os.path.join(INPUT_DIR, fname)
    rows, _ = read_csv(fpath)
    count = 0
    for r in rows:
        bname = (r.get('Business Name') or '').strip()
        if not bname:
            continue
        total_raw += 1
        count += 1

        phone = clean_phone(r.get('Phone', ''))

        niche_raw = (r.get('Niche') or '').strip()
        niche = normalise_niche_from_value(niche_raw)
        if niche is None:
            unmapped_niches[niche_raw] += 1
            niche = "UNKNOWN"

        # Single-format files have a Has Website flag but no URL column
        has_website_raw = (r.get('Has Website') or '').strip().upper()
        has_website = 'Y' if has_website_raw == 'Y' else 'N'
        website_link = ''   # not available in this data format
        maps_link = ''       # not available in this data format

        nn = norm_name(bname)
        upsert_business(nn, bname, phone, niche, has_website, website_link, maps_link)

    print(f"  {fname}: {count} rows")

print(f"\nTotal raw rows processed: {total_raw}")
if unmapped_niches:
    print(f"WARNING: unmapped niche values encountered: {dict(unmapped_niches)}")

# ─── TASK B: NICHE ASSIGNMENT (highest priority niche per business) ──────────

for nn, rec in business_store.items():
    niches_seen = business_niches[nn]
    if niches_seen:
        best_niche = max(set(niches_seen), key=lambda x: NICHE_PRIORITY.get(x, 0))
        rec['Niche'] = best_niche

# ─── TASK C: DEDUP ────────────────────────────────────────────────────────────

deduped = [rec for rec in business_store.values() if rec['Business Name'].strip()]
dup_count = total_raw - len(deduped)

print(f"\nUnique businesses after dedup: {len(deduped)}")
print(f"Duplicates removed: {dup_count}")

# ─── TASK D: SERP CROSS-MATCHING (only if SERP data exists for this city) ────

STOPWORDS = {'the', 'a', 'an', 'and', 'of', 'in', 'for', 'at', '&', '-'}

serp_available = os.path.isfile(SERP_GBP) or os.path.isfile(SERP_ORGANIC)

if serp_available:
    print("\n" + "="*60)
    print("SERP CROSS-MATCHING")
    print("="*60)

    organic_entries = []
    if os.path.isfile(SERP_ORGANIC):
        rows, _ = read_csv(SERP_ORGANIC)
        for r in rows:
            title = (r.get('title') or '').strip()
            url = (r.get('link') or r.get('url') or '').strip()
            snippet = (r.get('snippet') or '').strip()
            title_lower = title.lower()
            title_words = set(title_lower.split()) - STOPWORDS
            domain = get_domain(url) or get_domain(snippet)
            organic_entries.append({
                'title_lower': title_lower,
                'title_words': title_words,
                'domain': domain,
            })
        print(f"Loaded {len(organic_entries)} organic SERP results")

    gbp_entries = []
    if os.path.isfile(SERP_GBP):
        rows, _ = read_csv(SERP_GBP)
        for r in rows:
            name = (r.get('name') or r.get('title') or '').strip()
            name_lower = name.lower()
            name_words = set(name_lower.split()) - STOPWORDS
            phone_match = re.search(r'(\+?91)?(\d{10})', (r.get('phone', '') or '') + (r.get('address', '') or ''))
            phone = phone_match.group(2) if phone_match else ''
            gbp_entries.append({
                'name_lower': name_lower,
                'name_words': name_words,
                'phone': phone,
            })
        print(f"Loaded {len(gbp_entries)} GBP entries")

    def check_serp_match(lead):
        name_lower = lead['Business Name'].strip().lower()
        name_words = set(name_lower.split()) - STOPWORDS
        phone = lead['Phone']

        for g in gbp_entries:
            if not g['name_lower']:
                continue
            if name_lower == g['name_lower']:
                return 'Y', 'GBP'
            if len(name_words & g['name_words']) >= 4:
                return 'Y', 'GBP'
            if phone != 'MISSING' and phone == g['phone']:
                return 'Y', 'GBP'

        for o in organic_entries:
            if not o['title_lower']:
                continue
            if name_lower == o['title_lower']:
                return 'Y', 'Organic'
            if len(name_words & o['title_words']) >= 4:
                return 'Y', 'Organic'
            domain = get_domain(lead.get('Website Link', ''))
            if domain and domain == o['domain']:
                return 'Y', 'Organic'

        return 'N', ''

    for lead in deduped:
        ranked, source = check_serp_match(lead)
        lead['SERP Ranked'] = ranked
        lead['SERP Source'] = source

    ranked_count = sum(1 for l in deduped if l['SERP Ranked'] == 'Y')
    print(f"SERP matched: {ranked_count}/{len(deduped)}")

else:
    print("\nNo SERP data found for this city (no *_GBP_Data.csv / *_Organic_Results.csv).")
    print('Setting SERP Ranked = "Not Scraped" for all leads.')
    for lead in deduped:
        lead['SERP Ranked'] = 'Not Scraped'
        lead['SERP Source'] = ''

# ─── TASK E: SAVE MASTER FILE ──────────────────────────────────────────────────

with open(OUTPUT_MASTER, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS, extrasaction='ignore')
    writer.writeheader()
    for lead in deduped:
        writer.writerow(lead)

print(f"\nMaster file written: {OUTPUT_MASTER}")

# ─── TASK F: SPLIT BY NICHE ─────────────────────────────────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)

niche_groups = defaultdict(list)
for lead in deduped:
    niche_groups[lead['Niche']].append(lead)

for niche, leads in niche_groups.items():
    suffix = NICHE_FILENAME_SUFFIX.get(niche, niche.replace(' ', ''))
    out_fname = f"{CITY}_{suffix}_Final.csv"
    out_path = os.path.join(OUTPUT_DIR, out_fname)
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS, extrasaction='ignore')
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead)

print(f"Split into {len(niche_groups)} niche files in {OUTPUT_DIR}")

# ─── TASK G: SUMMARY REPORT ──────────────────────────────────────────────────────

print("\n" + "="*60)
print(f"SUMMARY — {CITY.upper()}")
print("="*60)

total = len(deduped)
with_phone = sum(1 for l in deduped if l['Phone'] != 'MISSING')
without_phone = total - with_phone
with_website = sum(1 for l in deduped if l['Has Website'] == 'Y')
without_website = total - with_website

if serp_available:
    serp_ranked = sum(1 for l in deduped if l['SERP Ranked'] == 'Y')
    serp_pct = f"{serp_ranked}/{total} ({100*serp_ranked/total:.1f}%)" if total else "0/0"
else:
    serp_pct = "Not Scraped (no SERP data available for this city)"

print(f"Total raw rows:        {total_raw}")
print(f"Duplicates removed:    {dup_count}")
print(f"Unique businesses:     {total}")
print(f"With phone:            {with_phone}")
print(f"Without phone:         {without_phone}")
print(f"With website:          {with_website}")
print(f"Without website:       {without_website}")
print(f"SERP ranked:           {serp_pct}")

print("\nPer-niche breakdown:")
print(f"{'Niche':<22} {'Count':>6} {'With Phone':>11} {'With Website':>13}")
for niche in sorted(niche_groups.keys(), key=lambda n: -len(niche_groups[n])):
    leads = niche_groups[niche]
    n_total = len(leads)
    n_phone = sum(1 for l in leads if l['Phone'] != 'MISSING')
    n_web = sum(1 for l in leads if l['Has Website'] == 'Y')
    print(f"{niche:<22} {n_total:>6} {n_phone:>11} {n_web:>13}")

print("\nDone.")
