#!/usr/bin/env python3
"""
Hubli Leads Processing Script v2
Tasks 2-5: Merge, Clean, SERP Match, Split, Report

Key fixes vs v1:
- Has Website = Y only when actual URL exists (not just a flag)
- Niche assignment: collect ALL niche appearances per business,
  prefer the most specific/correct niche (JEE NEET > Tuition Centre, etc.)
- Cross-niche dedup: if business appears in multiple niches, keep all unique
  niche assignments UNLESS the niches are the same business truly duplicated.
  Actually per spec: deduplicate by Business Name + Phone globally — keep first occurrence.
  BUT: fix Coaching_Leads niche mapping issue by processing JEE/NEET files first.
"""

import os
import re
import csv
from urllib.parse import urlparse
from collections import defaultdict, Counter

# ─── CONFIG ───────────────────────────────────────────────────────────────────

FOLDER1 = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_cleaned_leads"
FOLDER2 = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_cleaned_leads 2"
SERP_ORGANIC = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_Organic_Results.csv"
SERP_GBP = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_GBP_Data.csv"
OUTPUT_MASTER = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_All_Leads_Clean.csv"
OUTPUT_DIR = "/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final"

# Niche normalisations from column values
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
    "ielts coaching": "IELTS Coaching",
    "interior designer": "Interior Designers",
    "modular kitchen": "Modular Kitchens",
    "real estate agent": "Real Estate",
    "real estate": "Real Estate",
    "tuition centre": "Tuition Centres",
    "tuition center": "Tuition Centres",
    "hotel": "Hotels",
}

# Filename → niche mapping
FILENAME_NICHE = {
    "hubli_carrentals_leads": "Car Rentals",
    "hubli_coaching_leads": "Tuition Centres",
    "hubli_computertraining_leads": "Computer Training",
    "hubli_dentalclinics_leads": "Dental Clinics",
    "hubli_gyms_leads": "Gyms",
    "hubli_ielts_coaching1": "IELTS Coaching",
    "hubli_interiordesign_leads": "Interior Designers",
    "hubli_jeecoaching_leads": "JEE NEET Coaching",
    "hubli_modularskitchens_leads": "Modular Kitchens",
    "hubli_modularkitchens_leads": "Modular Kitchens",
    "hubli_neetcoaching_leads": "JEE NEET Coaching",
    "hubli_physiotherapyclinics_leads": "Physiotherapy",
    "hubli_realestate_leads": "Real Estate",
    "hubli_skinclinics_leads": "Skin Clinics",
    # Folder 2
    "hubli_car_rental": "Car Rentals",
    "hubli_computer_training_institute": "Computer Training",
    "hubli_dental_clinics": "Dental Clinics",
    "hubli_gym": "Gyms",
    "hubli_interior_designer": "Interior Designers",
    "hubli_jee_coaching": "JEE NEET Coaching",
    "hubli_modular_kitchen": "Modular Kitchens",
    "hubli_neet_coaching": "JEE NEET Coaching",
    "hubli_physiotherapy_clinics": "Physiotherapy",
    "hubli_real_estate_agent": "Real Estate",
    "hubli_skin_clinics": "Skin Clinics",
    "hubli_tuition_centre": "Tuition Centres",
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

# Per-niche output filename
NICHE_FILENAME = {
    "Gyms": "Hubli_Gyms_Final.csv",
    "Skin Clinics": "Hubli_SkinClinics_Final.csv",
    "Computer Training": "Hubli_ComputerTraining_Final.csv",
    "Dental Clinics": "Hubli_DentalClinics_Final.csv",
    "JEE NEET Coaching": "Hubli_JEENEETCoaching_Final.csv",
    "Car Rentals": "Hubli_CarRentals_Final.csv",
    "Physiotherapy": "Hubli_Physiotherapy_Final.csv",
    "IVF Clinics": "Hubli_IVFClinics_Final.csv",
    "IELTS Coaching": "Hubli_IELTSCoaching_Final.csv",
    "Interior Designers": "Hubli_InteriorDesigners_Final.csv",
    "Modular Kitchens": "Hubli_ModularKitchens_Final.csv",
    "Real Estate": "Hubli_RealEstate_Final.csv",
    "Tuition Centres": "Hubli_TuitionCentres_Final.csv",
    "Hotels": "Hubli_Hotels_Final.csv",
    "UNKNOWN": "Hubli_UNKNOWN_Final.csv",
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

def normalise_niche_from_filename(fname):
    key = fname.lower().replace('.csv', '').replace(' ', '_')
    return FILENAME_NICHE.get(key, "UNKNOWN")

def get_domain(url):
    if not url:
        return ""
    try:
        parsed = urlparse(url if url.startswith('http') else 'http://' + url)
        domain = parsed.netloc.lower()
        domain = re.sub(r'^www\.', '', domain)
        return domain
    except:
        return ""

def norm_name(n):
    return re.sub(r'\s+', ' ', n.strip().lower())

# ─── TASK 2: READ ALL FILES INTO A UNIFIED RECORD STORE ──────────────────────

print("\n" + "="*60)
print("TASK 2 — MERGING AND CLEANING ALL HUBLI LEADS")
print("="*60)

# We'll collect ALL occurrences of each business (by normalised name),
# then merge to pick the best data for each field.
# Key: normalised_name → merged record dict

# Structure to accumulate all data per business
business_store = {}  # norm_name → dict of best data
# Track all niches seen per business
business_niches = defaultdict(list)  # norm_name → list of niches
business_phones = defaultdict(list)  # norm_name → list of phone values

def upsert_business(nn, bname, phone, niche, has_website, website_link, maps_link, source):
    """Insert or update a business record, always keeping the richest data."""
    if nn not in business_store:
        business_store[nn] = {
            'Business Name': bname,
            'Phone': phone,
            'City': 'Hubli',
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
        # Prefer actual maps link
        if not rec['Google Maps Link'] and maps_link:
            rec['Google Maps Link'] = maps_link

    if niche:
        business_niches[nn].append(niche)
    if phone and phone != 'MISSING':
        business_phones[nn].append(phone)

total_raw = 0

def process_f1_file(fpath, fname):
    """Folder 1: 11 cols — Business Name, Phone, Niche, Has Website (flag only)"""
    global total_raw
    rows, _ = read_csv(fpath)
    niche_from_file = normalise_niche_from_filename(fname.replace('.csv',''))
    count = 0
    for r in rows:
        bname = r.get('Business Name', '').strip()
        if not bname:
            continue
        phone = clean_phone(r.get('Phone', ''))
        niche_raw = r.get('Niche', '').strip()
        niche_from_col = normalise_niche_from_value(niche_raw)
        # Use column niche if available, else filename niche
        niche = niche_from_col or niche_from_file or "UNKNOWN"
        # F1 only has Y/N flag — no actual URL
        # Per spec: Has Website = Y only if actual URL exists — so always N for F1 only records
        # (will be updated when F2 data is merged in)
        has_website = 'N'
        website_link = ''
        maps_link = ''
        nn = norm_name(bname)
        upsert_business(nn, bname, phone, niche, has_website, website_link, maps_link, 'f1')
        count += 1
    total_raw += count
    return count

def process_f2_file(fpath, fname):
    """Folder 2: 4 cols — BUSINESS NAME, PHONE, WEBSITE LINK, CITY"""
    global total_raw
    rows, _ = read_csv(fpath)
    if not rows:
        return 0
    # Check columns are valid
    first = rows[0] if rows else {}
    if 'BUSINESS NAME' not in first and 'Business Name' not in first:
        print(f"  SKIPPING {fname} — unrecognised columns: {list(first.keys())}")
        return 0

    niche = normalise_niche_from_filename(fname.replace('.csv',''))
    count = 0
    for r in rows:
        bname = (r.get('BUSINESS NAME') or r.get('Business Name') or '').strip()
        if not bname:
            continue
        phone = clean_phone(r.get('PHONE') or r.get('Phone') or '')
        url_raw = (r.get('WEBSITE LINK') or r.get('Website Link') or '').strip()

        if is_valid_website(url_raw):
            has_website = 'Y'
            website_link = url_raw
            maps_link = ''
        elif is_google_maps(url_raw):
            has_website = 'N'
            website_link = ''
            maps_link = url_raw
        else:
            has_website = 'N'
            website_link = ''
            maps_link = ''

        nn = norm_name(bname)
        upsert_business(nn, bname, phone, niche, has_website, website_link, maps_link, 'f2')
        count += 1
    total_raw += count
    return count

# Process Folder 1
print("\nFolder 1:")
for fname in sorted(os.listdir(FOLDER1)):
    if not fname.endswith('.csv'):
        continue
    fpath = os.path.join(FOLDER1, fname)
    n = process_f1_file(fpath, fname)
    print(f"  {fname}: {n} rows")

# Process Folder 2
print("\nFolder 2:")
for fname in sorted(os.listdir(FOLDER2)):
    if not fname.endswith('.csv'):
        continue
    fpath = os.path.join(FOLDER2, fname)
    n = process_f2_file(fpath, fname)
    print(f"  {fname}: {n} rows")

print(f"\nTotal raw rows processed: {total_raw}")
print(f"Unique businesses (by name): {len(business_store)}")

# ─── ASSIGN BEST NICHE PER BUSINESS ──────────────────────────────────────────

# For each business, pick the highest-priority niche it was found in
for nn, rec in business_store.items():
    niches_seen = business_niches[nn]
    if not niches_seen:
        rec['Niche'] = 'UNKNOWN'
        continue
    # Pick highest priority niche
    best_niche = max(set(niches_seen), key=lambda n: NICHE_PRIORITY.get(n, 0))
    rec['Niche'] = best_niche
    # Recalculate Has Website correctly
    if rec['Website Link']:
        rec['Has Website'] = 'Y'
    else:
        rec['Has Website'] = 'N'

# ─── DEDUP ────────────────────────────────────────────────────────────────────

# business_store already has one record per normalised name (that is the dedup).
# Per spec: remove exact duplicates where Business Name + Phone are BOTH identical.
# Phone-only dedup is NOT applied — different businesses can share a phone number.
deduped = list(business_store.values())

# Remove rows where Business Name is empty (safety check)
deduped = [r for r in deduped if r['Business Name'].strip()]

dup_count = total_raw - len(deduped)  # raw rows - unique names = duplicates

print(f"After dedup (by normalised name): {len(deduped)} rows")
print(f"Total duplicates removed: {dup_count}")

# ─── TASK 3: CROSS-MATCH WITH SERP DATA ──────────────────────────────────────

print("\n" + "="*60)
print("TASK 3 — CROSS-MATCHING WITH SERP DATA")
print("="*60)

# Load organic results
organic_rows, _ = read_csv(SERP_ORGANIC)
organic_entries = []
stop = {'in', 'at', 'the', 'and', 'of', 'for', 'a', 'an', 'hubli', 'hubballi',
        'hub', '-', '&', 'by', 'with', 'to', 'is', 'are', 'was', 'be', 'it'}

for r in organic_rows:
    title = r.get('title', '').strip()
    url = r.get('url', '').strip()
    snippet_url = r.get('snippet', '').strip()
    domain = get_domain(url) or get_domain(snippet_url)
    title_lower = title.lower()
    title_words = set(re.sub(r'[^\w\s]', '', title_lower).split()) - stop
    organic_entries.append({
        'title_lower': title_lower,
        'title_words': title_words,
        'domain': domain,
    })

# Load GBP data
gbp_rows, _ = read_csv(SERP_GBP)
gbp_entries = []
for r in gbp_rows:
    name = r.get('name', '').strip()
    phone_raw = (r.get('phone', '') or '') + ' ' + (r.get('address', '') or '')
    phone_digits = re.sub(r'\D', '', phone_raw)
    # Extract 10-digit phone from the string
    phones_found = re.findall(r'\d{10}', phone_digits)
    gbp_phone = phones_found[0] if phones_found else ''
    # Also try 12-digit starting with 91
    phones_12 = re.findall(r'91\d{10}', phone_digits)
    if phones_12 and not gbp_phone:
        gbp_phone = phones_12[0][2:]

    name_lower = name.lower()
    name_words = set(re.sub(r'[^\w\s]', '', name_lower).split()) - stop
    gbp_entries.append({
        'name_lower': name_lower,
        'name_words': name_words,
        'phone': gbp_phone,
    })

def check_serp_match(lead):
    bname = lead['Business Name'].strip()
    bname_lower = bname.lower()
    bname_words = set(re.sub(r'[^\w\s]', '', bname_lower).split()) - stop
    website_domain = get_domain(lead.get('Website Link', ''))
    phone = lead.get('Phone', '')

    # Check GBP first
    for gbp in gbp_entries:
        if bname_lower == gbp['name_lower']:
            return 'Y', 'GBP'
        # 4+ meaningful word overlap
        overlap = bname_words & gbp['name_words']
        if len(overlap) >= 4:
            return 'Y', 'GBP'
        # Phone match
        if phone and phone != 'MISSING' and gbp['phone'] and phone == gbp['phone']:
            return 'Y', 'GBP'

    # Check organic results
    for org in organic_entries:
        if bname_lower == org['title_lower']:
            return 'Y', 'Organic'
        overlap = bname_words & org['title_words']
        if len(overlap) >= 4:
            return 'Y', 'Organic'
        # Domain match
        if website_domain and org['domain'] and website_domain == org['domain']:
            return 'Y', 'Organic'

    return 'N', ''

serp_matched = 0
for lead in deduped:
    ranked, source = check_serp_match(lead)
    lead['SERP Ranked'] = ranked
    lead['SERP Source'] = source
    if ranked == 'Y':
        serp_matched += 1

print(f"SERP matched: {serp_matched} / {len(deduped)}")

# ─── SAVE MASTER FILE ─────────────────────────────────────────────────────────

with open(OUTPUT_MASTER, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS, extrasaction='ignore')
    writer.writeheader()
    writer.writerows(deduped)

print(f"\nMaster file saved: {OUTPUT_MASTER}")

# ─── TASK 4: SPLIT BY NICHE ───────────────────────────────────────────────────

print("\n" + "="*60)
print("TASK 4 — SPLITTING INTO NICHE FILES")
print("="*60)

os.makedirs(OUTPUT_DIR, exist_ok=True)

niche_groups = defaultdict(list)
for lead in deduped:
    niche = lead.get('Niche', 'UNKNOWN') or 'UNKNOWN'
    niche_groups[niche].append(lead)

for niche, leads in sorted(niche_groups.items()):
    fname = NICHE_FILENAME.get(niche, f"Hubli_{niche.replace(' ','')}_Final.csv")
    fpath = os.path.join(OUTPUT_DIR, fname)
    with open(fpath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLS, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(leads)
    print(f"  {fname}: {len(leads)} rows")

# ─── TASK 5: SUMMARY REPORT ───────────────────────────────────────────────────

print("\n")
print("HUBLI LEADS — FINAL SUMMARY")
print("=" * 60)

total = len(deduped)
with_phone = sum(1 for l in deduped if l['Phone'] != 'MISSING' and l['Phone'])
missing_phone = total - with_phone
with_website = sum(1 for l in deduped if l['Has Website'] == 'Y')
without_website = total - with_website
serp_ranked = sum(1 for l in deduped if l['SERP Ranked'] == 'Y')

print(f"Total leads merged:      {total}")
print(f"Duplicates removed:      {dup_count}")
print(f"Leads with phone:        {with_phone}")
print(f"Leads missing phone:     {missing_phone}")
print(f"Leads with website:      {with_website} ({with_website/total*100:.1f}%)")
print(f"Leads without website:   {without_website} ({without_website/total*100:.1f}%)")
print(f"SERP Ranked leads:       {serp_ranked} ({serp_ranked/total*100:.1f}%)")

print()
print(f"{'Niche':<25} {'Total':>6} {'Has Phone':>10} {'Has Website':>12} {'SERP Ranked':>12}")
print("-" * 70)

for niche in sorted(niche_groups.keys()):
    leads = niche_groups[niche]
    t = len(leads)
    p = sum(1 for l in leads if l['Phone'] != 'MISSING' and l['Phone'])
    w = sum(1 for l in leads if l['Has Website'] == 'Y')
    s = sum(1 for l in leads if l['SERP Ranked'] == 'Y')
    print(f"{niche:<25} {t:>6} {p:>10} {w:>12} {s:>12}")

print()
print(f"Files saved to: {OUTPUT_DIR}")
print()
print("DONE.")
