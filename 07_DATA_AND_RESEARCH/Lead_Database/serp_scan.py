#!/usr/bin/env python3
"""
SERP Scan + Lead Typing (SearchAPI.io google engine)
====================================================
For each Rescraped/<City>/<City>_<Niche>.csv:
  1. Fetch first 2 SERP pages for "<niche> in <city>" (organic + local pack).
  2. Stamp each lead's `SERP Ranked` (Y/N) + `SERP Source` by matching its
     name / website-domain against the results.
  3. Derive `Lead Type` A/B/C/D from Has Website + SERP Ranked + niche volume.
  4. Save the SERP competitor results to Competitor_Data/<City>/ for reports.

Keys: SERP_KEYS env (comma-separated SearchAPI.io keys); rotates on 429.
Resumable: skips a combo whose SERP file already exists.

Run:  SERP_KEYS=k1,k2,k3,k4 python3 serp_scan.py
"""
import os, sys, csv, re, json, time
import urllib.parse, urllib.request, urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "Rescraped")
COMP = os.path.join(BASE, "Competitor_Data")

KEYS = [k.strip() for k in (os.environ.get("SERP_KEYS") or "").split(",") if k.strip()]
if not KEYS:
    print("ERROR: set SERP_KEYS (comma-separated SearchAPI.io keys)."); sys.exit(1)
_ki = 0
api_calls = 0
PAGES = 2

# filename suffix -> (niche label, search term)
SUFFIX = {
    "Gyms": ("Gyms", "gym"), "SkinClinics": ("Skin Clinics", "skin clinic"),
    "DentalClinics": ("Dental Clinics", "dental clinic"),
    "ComputerTraining": ("Computer Training", "computer training institute"),
    "JEENEETCoaching": ("JEE NEET Coaching", "JEE NEET coaching"),
    "CarRentals": ("Car Rentals", "car rental"), "Physiotherapy": ("Physiotherapy", "physiotherapy clinic"),
    "IVFClinics": ("IVF Clinics", "IVF fertility clinic"), "IELTSCoaching": ("IELTS Coaching", "IELTS coaching"),
    "InteriorDesigners": ("Interior Designers", "interior designer"),
    "ModularKitchens": ("Modular Kitchens", "modular kitchen"),
    "RealEstate": ("Real Estate", "real estate agent"), "TuitionCentres": ("Tuition Centres", "tuition centre"),
}
LOW_VOL = {"IVF Clinics", "Physiotherapy", "IELTS Coaching"}  # low-search niches -> Type D
STOP = {"the", "a", "an", "and", "of", "in", "for", "at", "&", "-", "best", "near", "me"}
DIRS = ("justdial", "sulekha", "indiamart", "practo", "lybrate", "magicbricks",
        "99acres", "housing.com", "olx", "quikr", "yellowpages", "tradeindia",
        "facebook", "instagram", "youtube", "linkedin")

def dom(url):
    try:
        d = urllib.parse.urlparse(url if url.startswith("http") else "http://"+url).netloc.lower()
        return re.sub(r"^www\.", "", d)
    except Exception:
        return ""

def words(s): return set((s or "").lower().split()) - STOP

def fetch(query, page):
    global api_calls, _ki
    while _ki < len(KEYS):
        p = urllib.parse.urlencode({"engine":"google","q":query,"location":"Karnataka, India",
                                    "hl":"en","gl":"in","num":"10","page":page,"api_key":KEYS[_ki]})
        try:
            with urllib.request.urlopen("https://www.searchapi.io/api/v1/search?"+p, timeout=45) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            body = e.read().decode(errors="replace")[:160]
            if e.code in (401,429) or "used all" in body.lower() or "limit" in body.lower():
                print(f"    key #{_ki+1} exhausted -> rotating"); _ki += 1; continue
            print(f"    HTTP {e.code}: {body}"); return None
        except Exception as e:
            print(f"    fetch error: {e}"); return None
        api_calls += 1
        return data
    print("    ! all keys exhausted"); return "EXHAUSTED"

def scan_combo(city, niche, term):
    organic, local = [], []
    for page in range(1, PAGES+1):
        data = fetch(f"{term} in {city}", page)
        if data == "EXHAUSTED": return None
        if not data: break
        for r in (data.get("organic_results") or []):
            link = r.get("link") or ""
            organic.append({"title": r.get("title",""), "link": link, "domain": dom(link),
                            "position": r.get("position"), "source": "organic"})
        for r in (data.get("local_results") or []):
            local.append({"title": r.get("title",""), "link": r.get("website") or "",
                          "domain": dom(r.get("website") or ""), "source": "local"})
    return {"organic": organic, "local": local}

def save_serp(city, niche_suffix, serp):
    d = os.path.join(COMP, city); os.makedirs(d, exist_ok=True)
    path = os.path.join(d, f"{city}_{niche_suffix}_SERP.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["title","link","domain","position","source"])
        for r in serp["organic"] + serp["local"]:
            w.writerow([r["title"], r["link"], r["domain"], r.get("position",""), r["source"]])
    return path

def match(lead, serp):
    name = (lead.get("Business Name") or "").lower()
    nw = words(name); ld = dom(lead.get("Website Link") or "")
    for r in serp["organic"]:
        if ld and ld == r["domain"]: return "Y", "Organic"
        if name and name == r["title"].lower(): return "Y", "Organic"
        if len(nw & words(r["title"])) >= 3: return "Y", "Organic"
    for r in serp["local"]:
        if name and name == r["title"].lower(): return "Y", "GBP"
        if len(nw & words(r["title"])) >= 3: return "Y", "GBP"
        if ld and ld == r["domain"]: return "Y", "GBP"
    return "N", ""

def lead_type(has_site, ranked, niche):
    if has_site and ranked: return "A"
    if has_site and not ranked: return "B"
    if not has_site and niche in LOW_VOL: return "D"
    return "C"

def done(city, suffix):
    return os.path.isfile(os.path.join(COMP, city, f"{city}_{suffix}_SERP.csv"))

def main():
    files = sorted(__import__("glob").glob(os.path.join(SRC, "*", "*.csv")))
    print(f"{len(files)} lead files | keys: {len(KEYS)} | pages/combo: {PAGES}")
    types = {"A":0,"B":0,"C":0,"D":0}; ranked_tot=0; scanned=0
    for fp in files:
        city = os.path.basename(os.path.dirname(fp))
        suffix = re.sub(r"\.csv$","", os.path.basename(fp)).replace(f"{city}_","")
        if suffix not in SUFFIX: continue
        niche, term = SUFFIX[suffix]
        rows = list(csv.DictReader(open(fp, encoding="utf-8")))
        if not rows: continue
        if done(city, suffix):
            print(f"SKIP {city}/{niche} (already scanned)");
            for r in rows:
                t = r.get("Lead Type") or lead_type(r.get("Has Website")=="Y", r.get("SERP Ranked")=="Y", niche)
                types[t]=types.get(t,0)+1
            continue
        serp = scan_combo(city, niche, term)
        if serp is None:
            print(f"STOP — keys exhausted at {city}/{niche}"); break
        save_serp(city, suffix, serp)
        scanned += 1
        fns = list(rows[0].keys())
        for c in ("SERP Ranked","SERP Source","Lead Type"):
            if c not in fns: fns.append(c)
        for r in rows:
            rk, src = match(r, serp)
            r["SERP Ranked"] = rk; r["SERP Source"] = src
            t = lead_type(r.get("Has Website")=="Y", rk=="Y", niche)
            r["Lead Type"] = t; types[t]=types.get(t,0)+1
            if rk=="Y": ranked_tot+=1
        with open(fp, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fns, extrasaction="ignore"); w.writeheader(); w.writerows(rows)
        rk_n = sum(1 for r in rows if r["SERP Ranked"]=="Y")
        print(f"{city}/{niche}: {len(rows)} leads, {rk_n} ranked")
    print(f"\nScanned {scanned} combos | API calls: {api_calls}")
    print(f"Total ranked leads: {ranked_tot}")
    print(f"Type split — A:{types['A']} B:{types['B']} C:{types['C']} D:{types['D']}")

if __name__ == "__main__":
    main()
