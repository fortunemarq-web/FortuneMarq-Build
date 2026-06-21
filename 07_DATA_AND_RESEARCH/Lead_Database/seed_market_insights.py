#!/usr/bin/env python3
"""
Seed market_insights for every niche x city from local data:
  general_insights  <- Keyword_Data/<CityFolder>/*.csv  (search volume, top keywords, CPC)
  competitor_insights <- Competitor_Data/<City>/<City>_<suffix>_SERP.csv  (bucket %)
Upserts to Supabase market_insights (onConflict industry,city) via service key.

Run:  python3 seed_market_insights.py
"""
import os, re, csv, io, json, glob, datetime
import urllib.request, urllib.parse, urllib.error

BASE = os.path.dirname(os.path.abspath(__file__))
KW = os.path.join(BASE, "..", "Keyword_Data")
COMP = os.path.join(BASE, "Competitor_Data")
ENV = os.path.join(BASE, "..", "..", "01_CRM_AND_TOOL", "fmos", ".env.local")
NOW = datetime.datetime.now(datetime.timezone.utc).isoformat()

def env(k):
    for line in open(ENV, encoding="utf-8"):
        m = re.match(rf'^\s*{k}\s*=\s*(.*)\s*$', line)
        if m: return m.group(1).strip().strip('"').strip("'")
    raise SystemExit(f"{k} missing")
URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
SVC = env("SUPABASE_SERVICE_ROLE_KEY")

# canonical city (leads.city) -> keyword folder
CITY_KWDIR = {
    "Hubli":"Hubli_Keywords","Dharwad":"Dharwad_Keywords","Belagavi":"Belgaum_Keywords",
    "Mangalore":"Mangalore_keywords","Mysuru":"Mysuru_Cleaned_Keywords",
    "Davangere":"Davangere_Cleaned_Keywords","Ballari":"Ballari_Cleaned_Keywords",
    "Kalaburagi":"Kalaburgi_keywords","Vijayapura":"Vijayapura_Cleaned_Keywords",
}
# industry slug -> substrings to match keyword filenames (lowercased)
IND_KW = {
    "Gyms":["gym"],"SkinClinics":["skin"],"DentalClinics":["dental"],
    "ComputerTraining":["computer"],"JEENEETCoaching":["jee","neet"],
    "CarRentals":["car_rental","car rental","car-"],"Physiotherapy":["physio"],
    "IVFClinics":["ivf"],"IELTSCoaching":["ielts"],"InteriorDesigners":["interior"],
    "ModularKitchens":["modular"],"RealEstate":["real"],"TuitionCentres":["tuition"],
}
DIRECTORY = ("justdial","sulekha","indiamart","practo","lybrate","magicbricks","99acres",
             "housing.com","olx","quikr","yellowpages","tradeindia","urbancompany","urbanclap",
             "sky.com","yelp","zomato","swiggy","tripadvisor","collegedunia","shiksha")
SOCIAL = ("facebook","instagram","youtube","twitter","x.com","linkedin","pinterest","wikipedia")

def read_rows(path):
    for enc, sep in [("utf-8-sig",","),("utf-16","\t"),("utf-8-sig","\t")]:
        try:
            with io.open(path, encoding=enc, newline="") as f:
                rdr = csv.DictReader(f, delimiter=sep)
                cols = rdr.fieldnames or []
                if any("monthly search" in (c or "").lower() for c in cols):
                    return list(rdr), cols
        except Exception: continue
    return [], []

def num(x):
    try: return float(str(x).replace(",","").strip())
    except: return 0.0

def general_for(city, slug):
    folder = os.path.join(KW, CITY_KWDIR[city])
    subs = IND_KW[slug]
    files = [p for p in glob.glob(os.path.join(folder,"*.csv"))
             if any(s in os.path.basename(p).lower() for s in subs)]
    kws, low, high, total = [], [], [], 0
    for p in files:
        rows, cols = read_rows(p)
        if not rows: continue
        vc = next(c for c in cols if "monthly search" in c.lower())
        lo = next((c for c in cols if "low range" in c.lower()), None)
        hi = next((c for c in cols if "high range" in c.lower()), None)
        kwc = next((c for c in cols if c.strip().lower()=="keyword"), None)
        for r in rows:
            v = num(r.get(vc)); total += v
            if kwc and r.get(kwc): kws.append((r[kwc].strip(), int(v)))
            if lo and num(r.get(lo)): low.append(num(r.get(lo)))
            if hi and num(r.get(hi)): high.append(num(r.get(hi)))
    kws.sort(key=lambda x:-x[1])
    return {
        "monthlySearchDemand": int(round(total)),
        "topKeywords": [{"keyword":k,"volume":v} for k,v in kws[:10]],
        "avgCpcLow": round(sum(low)/len(low),1) if low else 0,
        "avgCpcHigh": round(sum(high)/len(high),1) if high else 0,
        "isLowVolume": total < 1000,
        "updatedAt": NOW,
    }

def bucket(domain, source):
    if source == "local": return "gmb"
    d = (domain or "").lower()
    if not d: return "socialOther"
    if any(s in d for s in SOCIAL): return "socialOther"
    if any(s in d for s in DIRECTORY): return "directories"
    return "realSites"

def competitor_for(city, suffix):
    p = os.path.join(COMP, city, f"{city}_{suffix}_SERP.csv")
    if not os.path.isfile(p): return None
    rows = list(csv.DictReader(open(p, encoding="utf-8")))
    if not rows: return None
    counts = {"gmb":0,"directories":0,"realSites":0,"socialOther":0}; tops=[]
    for r in rows:
        b = bucket(r.get("domain"), r.get("source"))
        counts[b]+=1
        if len(tops)<10: tops.append({"title":r.get("title",""),"url":r.get("link",""),"bucket":b})
    t = len(rows); pct=lambda n: round(100*n/t) if t else 0
    return {"buckets":{k:pct(v) for k,v in counts.items()}, "topResults":tops,
            "query":f"{suffix} in {city}", "scannedAt":NOW, "totalResults":t}

def upsert(payload):
    h={"apikey":SVC,"Authorization":f"Bearer {SVC}","Content-Type":"application/json",
       "Prefer":"resolution=merge-duplicates,return=minimal"}
    req=urllib.request.Request(URL+"/rest/v1/market_insights",
        data=json.dumps(payload).encode(), method="POST", headers=h)
    with urllib.request.urlopen(req, timeout=45) as r: return r.status

def main():
    combos=[]
    for fp in sorted(glob.glob(os.path.join(COMP,"*","*_SERP.csv"))):
        city=os.path.basename(os.path.dirname(fp))
        suffix=re.sub(r"_SERP\.csv$","",os.path.basename(fp)).replace(f"{city}_","")
        if suffix in IND_KW and city in CITY_KWDIR: combos.append((city,suffix))
    print(f"{len(combos)} niche×city to seed")
    ok=0; payload=[]
    for city,slug in combos:
        gi=general_for(city,slug); ci=competitor_for(city,slug)
        payload.append({"industry":slug,"city":city,
            "search_volume":str(gi["monthlySearchDemand"]),
            "general_insights":gi,"competitor_insights":ci})
    # upsert in batches of 50
    for i in range(0,len(payload),50):
        try:
            upsert(payload[i:i+50]); ok+=len(payload[i:i+50])
            print(f"  seeded {ok}/{len(payload)}")
        except urllib.error.HTTPError as e:
            print(f"  batch {i} err {e.code}: {e.read().decode()[:200]}")
    print(f"DONE. seeded {ok} market_insights rows.")

if __name__=="__main__":
    main()
