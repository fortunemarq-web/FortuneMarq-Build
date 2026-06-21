#!/usr/bin/env python3
"""
Google Maps Re-Scrape Automation (via SearchAPI.io google_maps engine)
======================================================================
Replicates the manual flow — Maps search "<niche> in <city>", scroll all
results, capture every business — but reliably via the API. Produces fresh,
accurate lead data INCLUDING real website presence (the field the old
_cleaned_leads data was missing).

Requires:  env var SAPI_KEY  (the SearchAPI.io key; do NOT hardcode)

Usage:
    SAPI_KEY=... python3 gmaps_rescrape.py                 # all cities × niches
    SAPI_KEY=... python3 gmaps_rescrape.py "Hubli" "Gyms"  # one combo (test)

Output:
    Lead_Database/Rescraped/<City>/<City>_<NicheSuffix>.csv
    (resumable — skips a combo whose output file already exists, unless --force)
"""
import os, sys, csv, re, json, time, datetime
import urllib.parse, urllib.request, urllib.error

# Keys: comma-separated; rotates to the next when one hits quota/429.
KEYS = [k.strip() for k in (os.environ.get("SERP_KEYS") or os.environ.get("SAPI_KEY") or "").split(",") if k.strip()]
if not KEYS:
    print("ERROR: set SERP_KEYS env var (comma-separated keys)."); sys.exit(1)
PROVIDER = os.environ.get("SERP_PROVIDER", "serpapi").lower()  # serpapi | searchapi
_key_idx = 0

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_ROOT = os.path.join(BASE_DIR, "Rescraped")

# Canonical cities (proper spellings — fixes Manglore/Kalburgi inconsistency)
CITIES = ["Hubli", "Dharwad", "Belagavi", "Mangalore", "Mysuru",
          "Davangere", "Ballari", "Kalaburagi", "Vijayapura"]

# niche label -> (Maps search term, output filename suffix)
NICHES = {
    "Gyms":               ("gym", "Gyms"),
    "Skin Clinics":       ("skin clinic", "SkinClinics"),
    "Dental Clinics":     ("dental clinic", "DentalClinics"),
    "Computer Training":  ("computer training institute", "ComputerTraining"),
    "JEE NEET Coaching":  ("JEE NEET coaching", "JEENEETCoaching"),
    "Car Rentals":        ("car rental", "CarRentals"),
    "Physiotherapy":      ("physiotherapy clinic", "Physiotherapy"),
    "IVF Clinics":        ("IVF fertility clinic", "IVFClinics"),
    "IELTS Coaching":     ("IELTS coaching", "IELTSCoaching"),
    "Interior Designers": ("interior designer", "InteriorDesigners"),
    "Modular Kitchens":   ("modular kitchen", "ModularKitchens"),
    "Real Estate":        ("real estate agent", "RealEstate"),
    "Tuition Centres":    ("tuition centre", "TuitionCentres"),
}

MAX_PAGES = 8           # Google Maps caps ~120 local results; 8×20 = 160 headroom
COLS = ["Business Name", "Phone", "City", "Niche", "Has Website", "Website Link",
        "Google Maps Link", "GMB Rating", "GMB Reviews", "SERP Ranked",
        "SERP Source", "Lead Source", "Import Date"]
TODAY = datetime.date.today().isoformat()

api_calls = 0

def clean_phone(raw):
    if not raw: return ""
    d = re.sub(r"\D", "", str(raw))
    if len(d) == 12 and d.startswith("91"): d = d[2:]
    if len(d) == 11 and d.startswith("0"):  d = d[1:]
    return d if len(d) == 10 and d[0] in "6789" else ""

def maps_link(r):
    pid = r.get("place_id") or r.get("data_id")
    return f"https://www.google.com/maps/place/?q=place_id:{pid}" if pid else ""

def _build_url(query, page, key):
    if PROVIDER == "searchapi":
        p = urllib.parse.urlencode({"engine": "google_maps", "q": query, "hl": "en",
                                    "gl": "in", "page": page, "api_key": key})
        return "https://www.searchapi.io/api/v1/search?" + p
    # serpapi.com — Google Maps engine; pagination via `start` offset (20/page)
    p = urllib.parse.urlencode({"engine": "google_maps", "type": "search", "q": query,
                                "hl": "en", "gl": "in", "google_domain": "google.co.in",
                                "start": (page - 1) * 20, "api_key": key})
    return "https://serpapi.com/search.json?" + p

def _exhausted(text):
    t = (text or "").lower()
    return any(s in t for s in ("run out", "used all", "ran out", "exceeded", "upgrade your plan", "limit"))

def fetch(query, page):
    global api_calls, _key_idx
    while _key_idx < len(KEYS):
        url = _build_url(query, page, KEYS[_key_idx])
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                data = json.load(resp)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:200]
            if e.code in (401, 429) or _exhausted(body):
                print(f"      key #{_key_idx+1} exhausted ({e.code}) -> rotating"); _key_idx += 1; continue
            print(f"      ! HTTP {e.code} p{page}: {body}"); return []
        except Exception as e:
            print(f"      ! fetch error p{page}: {e}"); return []
        if isinstance(data, dict) and data.get("error"):
            if _exhausted(str(data["error"])):
                print(f"      key #{_key_idx+1} exhausted -> rotating"); _key_idx += 1; continue
            print(f"      ! api error p{page}: {str(data['error'])[:140]}"); return []
        api_calls += 1
        return data.get("local_results") or data.get("maps_results") or []
    print("      ! all keys exhausted"); return []

def scrape_combo(city, niche):
    term, suffix = NICHES[niche]
    query = f"{term} in {city}"
    seen, rows = set(), []
    for page in range(1, MAX_PAGES + 1):
        results = fetch(query, page)
        if not results:
            break
        new = 0
        for r in results:
            key = r.get("place_id") or r.get("data_id") or (r.get("title"), r.get("address"))
            if key in seen:
                continue
            seen.add(key); new += 1
            website = (r.get("website") or "").strip()
            rows.append({
                "Business Name": (r.get("title") or "").strip(),
                "Phone": clean_phone(r.get("phone")),
                "City": city,
                "Niche": niche,
                "Has Website": "Y" if website else "N",
                "Website Link": website,
                "Google Maps Link": maps_link(r),
                "GMB Rating": r.get("rating") or "",
                "GMB Reviews": r.get("reviews") or "",
                "SERP Ranked": "",
                "SERP Source": "",
                "Lead Source": "Google Maps (SearchAPI)",
                "Import Date": TODAY,
            })
        # stop if the page was full of duplicates or short (end of list)
        if new == 0 or len(results) < 20:
            break
        time.sleep(0.5)
    return rows

def write_combo(city, niche, rows):
    suffix = NICHES[niche][1]
    out_dir = os.path.join(OUT_ROOT, city)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{city}_{suffix}.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
        w.writeheader(); w.writerows(rows)
    return path

def already_done(city, niche):
    # Done only if the file has at least one DATA row — so combos that wrote an
    # empty (header-only) file due to the credit-exhaustion run get re-scraped.
    suffix = NICHES[niche][1]
    p = os.path.join(OUT_ROOT, city, f"{city}_{suffix}.csv")
    if not os.path.isfile(p):
        return False
    with open(p, encoding="utf-8") as f:
        return sum(1 for _ in f) > 1

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    if len(args) == 2:
        combos = [(args[0], args[1])]
    else:
        combos = [(c, n) for c in CITIES for n in NICHES]

    print(f"Re-scrape: {len(combos)} city×niche combos | MAX_PAGES={MAX_PAGES}")
    grand = 0
    for i, (city, niche) in enumerate(combos, 1):
        if not force and already_done(city, niche):
            print(f"[{i}/{len(combos)}] {city} / {niche} — SKIP (already scraped)")
            continue
        rows = scrape_combo(city, niche)
        path = write_combo(city, niche, rows)
        with_site = sum(1 for r in rows if r["Has Website"] == "Y")
        with_phone = sum(1 for r in rows if r["Phone"])
        grand += len(rows)
        print(f"[{i}/{len(combos)}] {city} / {niche}: {len(rows)} leads "
              f"({with_phone} phone, {with_site} website) -> {os.path.relpath(path, BASE_DIR)}")
    print(f"\nDone. Total leads: {grand} | API calls: {api_calls}")

if __name__ == "__main__":
    main()
