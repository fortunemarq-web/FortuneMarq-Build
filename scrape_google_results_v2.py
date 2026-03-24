"""
FortuneMarq — Google Search Results Scraper
Uses SearchAPI.io to capture real Page 1 results for each niche+city keyword
Stores results as JSON in 07_DATA_AND_RESEARCH/Competitor_Data/Hubli/
"""

import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

# ── CONFIG ────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))

def load_env():
    env_path = os.path.join(BASE, ".env")
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env file not found at {env_path}")
    with open(env_path, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

load_env()
SEARCHAPI_KEY = os.environ.get("SERPAPI_KEY")
if not SEARCHAPI_KEY:
    raise ValueError("SERPAPI_KEY not found in .env file")

# ── NICHES ────────────────────────────────────────────────────────────────────
NICHES = {
    "Gyms":               {"keyword": "gym near me hubli",                 "volume": 30000},
    "Skin_Clinics":       {"keyword": "skin clinic hubli",                  "volume": 7500},
    "Computer_Training":  {"keyword": "computer training institute hubli",  "volume": 7500},
    "Dental_Clinics":     {"keyword": "dental clinic hubli",                "volume": 3900},
    "JEE_NEET_Coaching":  {"keyword": "neet coaching hubli",                "volume": 2550},
    "Car_Rentals":        {"keyword": "car rental hubli",                   "volume": 2550},
    "Interior_Designers": {"keyword": "interior designer hubli",            "volume": 3450},
    "Real_Estate":        {"keyword": "real estate agent hubli",            "volume": 2000},
    "Physiotherapy":      {"keyword": "physiotherapy clinic hubli",         "volume": 500},
    "IVF_Clinics":        {"keyword": "ivf clinic hubli",                   "volume": 800},
    "Modular_Kitchen":    {"keyword": "modular kitchen hubli",              "volume": 1200},
    "Tuition_Centres":    {"keyword": "tuition centre hubli",               "volume": 2000},
    "IELTS_Coaching":     {"keyword": "ielts coaching hubli",               "volume": 1500},
    "Salons":             {"keyword": "salon near me hubli",                "volume": 4000},
}

CITY = "Hubli"

# ── DOMAIN CATEGORIES ─────────────────────────────────────────────────────────
DIRECTORIES = [
    "justdial.com", "sulekha.com", "practo.com", "indiamart.com",
    "tradeindia.com", "yellowpages.in", "asklaila.com", "grotal.com",
    "clickindia.com", "olx.in", "quikr.com", "urbanclap.com",
    "urban.company", "99acres.com", "magicbricks.com", "housing.com",
    "commonfloor.com", "makemytrip.com", "tripadvisor.com",
    "zomato.com", "swiggy.com", "lybrate.com", "1mg.com",
    "apollo247.com", "portea.com", "netmeds.com", "healthgrades.com",
]

SOCIAL_MEDIA = [
    "instagram.com", "facebook.com", "youtube.com", "linkedin.com",
    "twitter.com", "x.com", "pinterest.com", "snapchat.com",
    "whatsapp.com", "t.me", "telegram.me",
]

# ── TRAFFIC WEIGHTS ───────────────────────────────────────────────────────────
WEIGHTS = {
    "local_pack":      0.35,
    "local_split":     [0.43, 0.34, 0.23],
    "directories":     0.20,
    "social":          0.10,
    "organic":         0.25,
    "organic_split":   [0.48, 0.32, 0.20],
    "uncaptured":      0.10,
}

# ── HELPERS ───────────────────────────────────────────────────────────────────
def categorize(url):
    if not url:
        return "website"
    u = url.lower()
    for d in DIRECTORIES:
        if d in u:
            return "directory"
    for s in SOCIAL_MEDIA:
        if s in u:
            return "social"
    return "website"

def get_domain(url):
    if not url:
        return ""
    try:
        return urllib.parse.urlparse(url).netloc.replace("www.", "")
    except:
        return url

def get_platform(url):
    u = url.lower()
    if "instagram.com" in u: return "Instagram"
    if "facebook.com"  in u: return "Facebook"
    if "youtube.com"   in u: return "YouTube"
    if "linkedin.com"  in u: return "LinkedIn"
    if "twitter.com"   in u or "x.com" in u: return "Twitter/X"
    return "Social Media"

def searchapi_search(query):
    """Call SearchAPI.io Google Search endpoint"""
    params = {
        "q":       query,
        "engine":  "google",
        "hl":      "en",
        "gl":      "in",

        "api_key": SEARCHAPI_KEY,
        "num":     10,
    }
    url = "https://www.searchapi.io/api/v1/search?" + urllib.parse.urlencode(params)
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "FortuneMarq/1.0")
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        print(f"    HTTP {e.code}: {body[:200]}")
        return None
    except Exception as e:
        print(f"    ERROR: {e}")
        return None

def process(data, volume):
    results = {
        "keyword":    data.get("search_parameters", {}).get("q", ""),
        "volume":     volume,
        "scraped_at": datetime.now().isoformat(),
        "local_pack": [],
        "directories":[],
        "social":     [],
        "websites":   [],
        "uncaptured": int(volume * WEIGHTS["uncaptured"]),
        "summary":    {}
    }

    # ── LOCAL PACK ────────────────────────────────────────────────────────────
    # SearchAPI.io returns local results under "local_results" or "places_results"
    local = data.get("local_results", data.get("places_results", []))
    for i, place in enumerate(local[:3]):
        share   = WEIGHTS["local_pack"] * WEIGHTS["local_split"][min(i, 2)]
        traffic = int(volume * share)
        results["local_pack"].append({
            "position":    i + 1,
            "name":        place.get("title", place.get("name", "")),
            "rating":      place.get("rating", "N/A"),
            "reviews":     place.get("reviews", place.get("reviews_count", 0)),
            "address":     place.get("address", ""),
            "website":     place.get("website", ""),
            "phone":       place.get("phone", ""),
            "traffic":     traffic,
            "traffic_pct": round((traffic / volume) * 100, 1),
        })

    # ── ORGANIC ───────────────────────────────────────────────────────────────
    organic = data.get("organic_results", [])
    dir_count = sum(1 for r in organic if categorize(r.get("link","")) == "directory")
    soc_count = sum(1 for r in organic if categorize(r.get("link","")) == "social")

    dir_pos = soc_pos = web_pos = 0

    for result in organic:
        url    = result.get("link", "")
        title  = result.get("title", "")
        snip   = result.get("snippet", "")
        domain = get_domain(url)
        cat    = categorize(url)

        if cat == "directory":
            per = WEIGHTS["directories"] / max(dir_count, 1)
            traffic = int(volume * per)
            results["directories"].append({
                "position":    dir_pos + 1,
                "name":        title[:60],
                "domain":      domain,
                "url":         url,
                "traffic":     traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            dir_pos += 1

        elif cat == "social":
            per = WEIGHTS["social"] / max(soc_count, 1)
            traffic = int(volume * per)
            results["social"].append({
                "position":    soc_pos + 1,
                "name":        title[:60],
                "domain":      domain,
                "platform":    get_platform(url),
                "url":         url,
                "traffic":     traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            soc_pos += 1

        else:
            split   = WEIGHTS["organic_split"]
            share   = WEIGHTS["organic"] * split[min(web_pos, len(split)-1)]
            traffic = int(volume * share)
            results["websites"].append({
                "position":    web_pos + 1,
                "name":        title[:60],
                "domain":      domain,
                "url":         url,
                "snippet":     snip[:150],
                "traffic":     traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            web_pos += 1

    # ── SUMMARY ───────────────────────────────────────────────────────────────
    gbp = sum(r["traffic"] for r in results["local_pack"])
    dr  = sum(r["traffic"] for r in results["directories"])
    soc = sum(r["traffic"] for r in results["social"])
    web = sum(r["traffic"] for r in results["websites"])
    unc = results["uncaptured"]

    results["summary"] = {
        "total_volume":      volume,
        "gbp_traffic":       gbp,
        "gbp_pct":           round(gbp/volume*100, 1),
        "directory_traffic": dr,
        "directory_pct":     round(dr/volume*100, 1),
        "social_traffic":    soc,
        "social_pct":        round(soc/volume*100, 1),
        "website_traffic":   web,
        "website_pct":       round(web/volume*100, 1),
        "uncaptured":        unc,
        "uncaptured_pct":    round(unc/volume*100, 1),
        "gbp_count":         len(results["local_pack"]),
        "directory_count":   len(results["directories"]),
        "social_count":      len(results["social"]),
        "website_count":     len(results["websites"]),
    }
    return results

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    out_dir = os.path.join(BASE, "07_DATA_AND_RESEARCH", "Competitor_Data", CITY)
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  FortuneMarq — SearchAPI.io Scraper")
    print(f"  City: {CITY}  |  Niches: {len(NICHES)}")
    print(f"{'='*60}\n")

    all_results = {}
    errors      = []

    for niche, config in NICHES.items():
        keyword = config["keyword"]
        volume  = config["volume"]
        outfile = os.path.join(out_dir, f"{niche}_results.json")

        if os.path.exists(outfile):
            print(f"  SKIP  {niche} — already scraped")
            with open(outfile, "r", encoding="utf-8") as f:
                all_results[niche] = json.load(f)
            continue

        print(f"  SCRAPING  {niche}")
        print(f"            '{keyword}'")

        data = searchapi_search(keyword)
        if not data:
            print(f"  ERROR — no data for {niche}\n")
            errors.append(niche)
            continue

        if "error" in data:
            print(f"  API ERROR — {data['error']}\n")
            errors.append(niche)
            continue

        processed = process(data, volume)
        all_results[niche] = processed

        with open(outfile, "w", encoding="utf-8") as f:
            json.dump(processed, f, indent=2, ensure_ascii=False)

        s = processed["summary"]
        print(f"  GBP: {s['gbp_pct']}% ({s['gbp_count']} listings)  "
              f"Dir: {s['directory_pct']}%  "
              f"Social: {s['social_pct']}%  "
              f"Websites: {s['website_pct']}%\n")

        time.sleep(1.5)

    # Master file
    master = os.path.join(out_dir, "_ALL_RESULTS.json")
    with open(master, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"  DONE  {len(all_results) - len(errors)}/{len(NICHES)} scraped")
    if errors:
        print(f"  Failed: {', '.join(errors)}")
    print(f"  Saved: {out_dir}")
    print(f"{'='*60}\n")

    if all_results:
        print(f"  {'Niche':<25} {'Volume':>8} {'GBP%':>6} {'Dir%':>6} {'Soc%':>5} {'Web%':>6}")
        print(f"  {'-'*58}")
        for niche, d in all_results.items():
            s = d.get("summary", {})
            print(f"  {niche:<25} {s.get('total_volume',0):>8,} "
                  f"{s.get('gbp_pct',0):>5.1f}% "
                  f"{s.get('directory_pct',0):>5.1f}% "
                  f"{s.get('social_pct',0):>4.1f}% "
                  f"{s.get('website_pct',0):>5.1f}%")

if __name__ == "__main__":
    main()
