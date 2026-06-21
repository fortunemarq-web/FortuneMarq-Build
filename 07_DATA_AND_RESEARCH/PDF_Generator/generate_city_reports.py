#!/usr/bin/env python3
"""
Generalised report generator — your ORIGINAL 5-page PDF design, for ALL cities.

Builds niche_data per (city, niche) from the live rescraped dataset:
  - top_gbp           <- Rescraped/<City>/<City>_<suffix>.csv  (top 3 by GMB Reviews)
  - top_directories   <- Competitor_Data/<City>/<City>_<suffix>_SERP.csv (organic, directories)
  - top_websites      <- Competitor_Data/<City>/<City>_<suffix>_SERP.csv (organic, local sites)
  - volume            <- market_insights.search_volume (passed in / fetched)
  - traffic           <- fixed 32/28/22/18 split (matches the original design)

Usage:
  sample : python generate_city_reports.py sample <City> <suffix> <1|2|3|4> <volume>
           -> writes /tmp/sample_<City>_<suffix>_Type<N>.pdf  (NO upload)
"""
import csv, os, sys, re
from urllib.parse import urlparse
from pdf_generator import PDFGenerator

DATA = "/Users/fortunemarq/FortuneMarq-Build/07_DATA_AND_RESEARCH/Lead_Database"
RESCRAPED = os.path.join(DATA, "Rescraped")
COMPETITOR = os.path.join(DATA, "Competitor_Data")

# filename suffix -> human display label used in the report copy
SUFFIX_LABEL = {
    "Gyms": "Gyms", "SkinClinics": "Skin Clinics", "DentalClinics": "Dental Clinics",
    "ComputerTraining": "Computer Training", "JEENEETCoaching": "JEE NEET Coaching",
    "CarRentals": "Car Rentals", "Physiotherapy": "Physiotherapy", "IVFClinics": "IVF Clinics",
    "IELTSCoaching": "IELTS Coaching", "InteriorDesigners": "Interior Designers",
    "ModularKitchens": "Modular Kitchens", "RealEstate": "Real Estate",
    "TuitionCentres": "Tuition Centres",
}

TRAFFIC_PERCENTAGES = [("GMB Profiles", 32), ("Directories", 28),
                       ("Social Media", 22), ("Local Websites", 18)]

DIRECTORY_DOMAINS = ["justdial", "sulekha", "indiamart", "tradeindia", "yellowpages",
                     "practo", "99acres", "magicbricks", "commonfloor", "olx", "quikr",
                     "urbanclap", "urbancompany", "urban-company", "bing", "yelp",
                     "tripadvisor", "ambitionbox", "fitternity", "cult.fit"]
SOCIAL_DOMAINS = ["instagram", "facebook", "youtube", "twitter", "linkedin"]


def _to_int(s):
    try:
        return int(re.sub(r"[^\d]", "", str(s) or "0") or 0)
    except Exception:
        return 0


def _domain(url):
    try:
        d = urlparse(url if url.startswith("http") else "http://" + url).netloc.lower()
        return re.sub(r"^www\.", "", d) or url
    except Exception:
        return url


def _top_gbp(city, suffix):
    fp = os.path.join(RESCRAPED, city, f"{city}_{suffix}.csv")
    rows = []
    if os.path.isfile(fp):
        for r in csv.DictReader(open(fp, encoding="utf-8")):
            name = (r.get("Business Name") or "").strip()
            if not name:
                continue
            rows.append({"name": name[:40].strip(),
                         "rating": (r.get("GMB Rating") or "N/A").strip() or "N/A",
                         "reviews": (r.get("GMB Reviews") or "0").strip() or "0",
                         "_rev": _to_int(r.get("GMB Reviews"))})
    rows.sort(key=lambda x: x["_rev"], reverse=True)
    out = [{"name": r["name"], "rating": r["rating"], "reviews": r["reviews"]} for r in rows[:3]]
    return out or [{"name": "No data available", "rating": "N/A", "reviews": "0"}]


def _top_organic(city, suffix, label):
    fp = os.path.join(COMPETITOR, city, f"{city}_{suffix}_SERP.csv")
    directories, websites = [], []
    seen_d, seen_w = set(), set()
    if os.path.isfile(fp):
        for r in csv.DictReader(open(fp, encoding="utf-8")):
            url = (r.get("link") or "").strip()
            title = (r.get("title") or "").strip()
            dom = (r.get("domain") or _domain(url)).strip().lower()
            if not url:
                continue
            if any(s in dom for s in SOCIAL_DOMAINS):
                continue
            is_dir = any(d in dom for d in DIRECTORY_DOMAINS) or \
                     any(w in title.lower() for w in ["list", "top ", "best "])
            if is_dir:
                if dom not in seen_d and len(directories) < 3:
                    seen_d.add(dom)
                    # description left blank -> generator fills a language-aware label
                    directories.append({"name": title or dom, "description": ""})
            else:
                if dom not in seen_w and len(websites) < 3:
                    seen_w.add(dom)
                    websites.append({"domain": dom, "description": ""})
    if not directories:
        directories = [{"name": "No directory data", "description": "No directory listings found"}]
    if not websites:
        websites = [{"domain": "No website data", "description": "No local websites found"}]
    return directories, websites


def build_niche_data(city, suffix, volume):
    label = SUFFIX_LABEL.get(suffix, suffix)
    traffic = {lbl: (pct, int(volume * pct / 100)) for lbl, pct in TRAFFIC_PERCENTAGES}
    dirs, webs = _top_organic(city, suffix, label)
    return {
        "niche": label, "city": city, "volume": int(volume),
        "is_low_volume": int(volume) < 2500,
        "top_gbp": _top_gbp(city, suffix),
        "top_directories": dirs, "top_websites": webs,
        "traffic": traffic,
    }


if __name__ == "__main__":
    if sys.argv[1:2] == ["sample"]:
        a = sys.argv[2:]
        city, suffix, typ, volume = a[0], a[1], a[2], a[3]
        lang = a[4] if len(a) > 4 else "en"
        nd = build_niche_data(city, suffix, int(volume))
        gen = PDFGenerator()
        out = f"/tmp/sample_{city}_{suffix}_Type{typ}_{lang}.pdf"
        getattr(gen, f"generate_type{typ}")(nd, out, lang)
        print(f"OK -> {out} ({os.path.getsize(out):,} bytes)")
        print(f"   volume={nd['volume']:,}  gbp={[g['name'] for g in nd['top_gbp']]}")
        print(f"   dirs={[d['name'] for d in nd['top_directories']]}")
        print(f"   webs={[w['domain'] for w in nd['top_websites']]}")
    else:
        print("usage: generate_city_reports.py sample <City> <suffix> <1|2|3|4> <volume>")
