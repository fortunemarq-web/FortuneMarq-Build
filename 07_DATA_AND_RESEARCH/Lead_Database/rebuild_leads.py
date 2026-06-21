#!/usr/bin/env python3
"""
Rebuild the app's leads table from the Rescraped dataset.
  python3 rebuild_leads.py backup   -> dump current leads to backup_leads_<date>.json
  python3 rebuild_leads.py import    -> insert all Rescraped/<City>/*.csv into leads

Reads Supabase URL + SERVICE ROLE key from ../../01_CRM_AND_TOOL/fmos/.env.local.
Does NOT delete — the wipe is done separately (DELETE FROM leads via SQL) after backup.
"""
import os, sys, csv, json, glob, re, time, datetime
import urllib.request, urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.join(BASE, "..", "..", "01_CRM_AND_TOOL", "fmos", ".env.local")
SRC = os.path.join(BASE, "Rescraped")
CONTACTS = os.path.join(BASE, "Website_Contacts.csv")
TODAY = datetime.date.today().isoformat()
BATCH_ID = f"rescrape_{TODAY}"

def env(key):
    for line in open(ENV, encoding="utf-8"):
        m = re.match(rf'^\s*{key}\s*=\s*(.*)\s*$', line)
        if m: return m.group(1).strip().strip('"').strip("'")
    raise SystemExit(f"{key} not found in {ENV}")

URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
SVC = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": SVC, "Authorization": f"Bearer {SVC}", "Content-Type": "application/json"}

# filename suffix -> (industry slug for leads.industry, niche label, low-volume?)
SUFFIX_INDUSTRY = {
    "Gyms":"Gyms","SkinClinics":"SkinClinics","DentalClinics":"DentalClinics",
    "ComputerTraining":"ComputerTraining","JEENEETCoaching":"JEENEETCoaching",
    "CarRentals":"CarRentals","Physiotherapy":"Physiotherapy","IVFClinics":"IVFClinics",
    "IELTSCoaching":"IELTSCoaching","InteriorDesigners":"InteriorDesigners",
    "ModularKitchens":"ModularKitchens","RealEstate":"RealEstate","TuitionCentres":"TuitionCentres",
}

def domain(u):
    try:
        d = urllib.parse.urlparse(u if u.startswith("http") else "http://"+u).netloc.lower()
        return re.sub(r"^www\.","",d)
    except Exception: return ""
import urllib.parse

def req(method, path, body=None, prefer=None):
    h = dict(H)
    if prefer: h["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL+path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=60) as resp:
        return resp.status, resp.read().decode()

def backup():
    status, body = req("GET", "/rest/v1/leads?select=*")
    rows = json.loads(body)
    out = os.path.join(BASE, f"backup_leads_{TODAY}.json")
    json.dump(rows, open(out,"w"), indent=2, default=str)
    print(f"Backed up {len(rows)} leads -> {out}")

def load_emails():
    m = {}
    if os.path.isfile(CONTACTS):
        for r in csv.DictReader(open(CONTACTS, encoding="utf-8")):
            d = domain(r.get("Website Link") or "")
            if d and r.get("Email"): m[d] = r["Email"]
    return m

def build_rows(city_filter=None):
    emails = load_emails()
    out = []
    for fp in sorted(glob.glob(os.path.join(SRC, "*", "*.csv"))):
        city = os.path.basename(os.path.dirname(fp))
        if city_filter and city.lower() != city_filter.lower():
            continue
        suffix = re.sub(r"\.csv$","",os.path.basename(fp)).replace(f"{city}_","")
        industry = SUFFIX_INDUSTRY.get(suffix)
        if not industry: continue
        for r in csv.DictReader(open(fp, encoding="utf-8")):
            name = (r.get("Business Name") or "").strip()
            if not name: continue
            web = (r.get("Website Link") or "").strip()
            ptype = (r.get("Lead Type") or "").strip().upper() or None
            out.append({
                "company_name": name,
                "phone": (r.get("Phone") or "").strip() or None,
                "city": city, "industry": industry,
                "status": "new", "outreach_stage": "touch1_pending",
                "lead_type": "outbound", "source": "Google Maps (SerpApi)",
                "lead_source": "Google Maps (SerpApi)",
                "has_website": (r.get("Has Website")=="Y"),
                "website_link": web or None, "website_url": web or None,
                "website_domain": domain(web) or None,
                "gmb_link": (r.get("Google Maps Link") or "").strip() or None,
                "has_gmb": bool((r.get("Google Maps Link") or "").strip()),
                "serp_ranked": (r.get("SERP Ranked")=="Y"),
                "serp_source": (r.get("SERP Source") or "").strip() or None,
                "pitch_type": ptype, "is_low_volume": (ptype=="D"),
                "email": emails.get(domain(web)) if web else None,
                "import_batch_id": BATCH_ID,
            })
    return out

def importer(city_filter=None):
    rows = build_rows(city_filter)
    print(f"Prepared {len(rows)} leads. Inserting in batches of 500...")
    n = 0
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        for attempt in range(3):
            try:
                st, body = req("POST", "/rest/v1/leads", chunk, prefer="return=minimal")
                if st in (200,201,204): n += len(chunk); break
                print(f"  batch {i} HTTP {st}: {body[:200]}")
                if attempt==2: raise SystemExit("insert failed")
            except urllib.error.HTTPError as e:
                print(f"  batch {i} err {e.code}: {e.read().decode()[:200]}")
                if attempt==2: raise SystemExit("insert failed")
                time.sleep(2)
        print(f"  inserted {n}/{len(rows)}")
    print(f"DONE. inserted {n} leads.")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv)>1 else ""
    if mode=="backup": backup()
    elif mode=="import": importer(sys.argv[2] if len(sys.argv)>2 else None)
    else: print("usage: rebuild_leads.py backup|import")
