"""
FortuneMarq — Google Search Results Scraper
Uses SerpAPI to capture real Page 1 results for each niche+city keyword
Stores results as JSON in 07_DATA_AND_RESEARCH/Competitor_Data/
Run once — data stored locally — PDFs generated from stored data
"""

import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

# ── CONFIG ────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))

# Load API key from .env file
def load_env():
    env_path = os.path.join(BASE, ".env")
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env file not found at {env_path}")
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

load_env()
SERPAPI_KEY = os.environ.get("SERPAPI_KEY")
if not SERPAPI_KEY:
    raise ValueError("SERPAPI_KEY not found in .env file")

# ── NICHE + CITY CONFIG ───────────────────────────────────────────────────────
# Phase 1: Hubli only — 14 niches
# Top keyword per niche used for search
NICHES = {
    "Gyms":                 {"keyword": "gym near me hubli",                  "volume": 30000},
    "Skin_Clinics":         {"keyword": "skin clinic hubli",                   "volume": 7500},
    "Computer_Training":    {"keyword": "computer training institute hubli",   "volume": 7500},
    "Dental_Clinics":       {"keyword": "dental clinic hubli",                 "volume": 3900},
    "JEE_NEET_Coaching":    {"keyword": "neet coaching hubli",                 "volume": 2550},
    "Car_Rentals":          {"keyword": "car rental hubli",                    "volume": 2550},
    "Interior_Designers":   {"keyword": "interior designer hubli",             "volume": 3450},
    "Real_Estate":          {"keyword": "real estate agent hubli",             "volume": 2000},
    "Physiotherapy":        {"keyword": "physiotherapy clinic hubli",          "volume": 500},
    "IVF_Clinics":          {"keyword": "ivf clinic hubli",                    "volume": 800},
    "Modular_Kitchen":      {"keyword": "modular kitchen hubli",               "volume": 1200},
    "Tuition_Centres":      {"keyword": "tuition centre hubli",                "volume": 2000},
    "IELTS_Coaching":       {"keyword": "ielts coaching hubli",                "volume": 1500},
    "Salons":               {"keyword": "salon near me hubli",                 "volume": 4000},
}

CITY = "Hubli"

# ── DOMAIN CATEGORIES ─────────────────────────────────────────────────────────
DIRECTORIES = [
    "justdial.com", "sulekha.com", "practo.com", "indiamart.com",
    "tradeindia.com", "yellowpages.in", "asklaila.com", "grotal.com",
    "clickindia.com", "olx.in", "quikr.com", "urbanclap.com",
    "urban.company", "99acres.com", "magicbricks.com", "housing.com",
    "naukri.com", "commonfloor.com", "makemytrip.com", "tripadvisor.com",
    "zomato.com", "swiggy.com", "healthgrades.com", "lybrate.com",
    "1mg.com", "apollo247.com", "portea.com", "netmeds.com",
]

SOCIAL_MEDIA = [
    "instagram.com", "facebook.com", "youtube.com", "linkedin.com",
    "twitter.com", "x.com", "pinterest.com", "snapchat.com",
    "whatsapp.com", "t.me", "telegram.me",
]

# ── TRAFFIC DISTRIBUTION WEIGHTS ─────────────────────────────────────────────
# Based on CTR research for local searches in India
TRAFFIC_WEIGHTS = {
    "local_pack_total": 0.35,    # Google Local Pack (GMB) gets ~35%
    "local_pack_split": [0.43, 0.34, 0.23],  # How 35% splits among 3 GBP listings
    "directories_total": 0.20,   # Directories get ~20%
    "social_total": 0.10,        # Social media profiles get ~10%
    "organic_total": 0.25,       # Organic websites get ~25%
    "organic_split": [0.48, 0.32, 0.20],  # How 25% splits among top 3 organic
    "uncaptured": 0.10,          # Bounce / no click
}

# ── HELPERS ───────────────────────────────────────────────────────────────────
def categorize_domain(url):
    """Categorize a URL into: directory, social, website"""
    if not url:
        return "website"
    url_lower = url.lower()
    for d in DIRECTORIES:
        if d in url_lower:
            return "directory"
    for s in SOCIAL_MEDIA:
        if s in url_lower:
            return "social"
    return "website"

def extract_domain(url):
    """Extract clean domain from URL"""
    if not url:
        return ""
    try:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        return domain
    except:
        return url

def serpapi_search(query):
    """Call SerpAPI and return JSON results"""
    params = {
        "q": query,
        "location": "Hubli, Karnataka, India",
        "hl": "en",
        "gl": "in",
        "api_key": SERPAPI_KEY,
        "num": 10,
    }
    url = "https://serpapi.com/search.json?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"  ERROR calling SerpAPI: {e}")
        return None

def calculate_traffic(volume, category, position, total_in_category):
    """Calculate estimated monthly traffic for a result"""
    weights = TRAFFIC_WEIGHTS

    if category == "local_pack":
        share = weights["local_pack_total"]
        split = weights["local_pack_split"]
        idx   = min(position, len(split) - 1)
        return int(volume * share * split[idx])

    elif category == "directory":
        share = weights["directories_total"]
        if total_in_category == 0:
            return 0
        # Distribute equally among directories found
        per_dir = share / total_in_category
        return int(volume * per_dir)

    elif category == "social":
        share = weights["social_total"]
        if total_in_category == 0:
            return 0
        per_social = share / total_in_category
        return int(volume * per_social)

    elif category == "website":
        share = weights["organic_total"]
        split = weights["organic_split"]
        idx   = min(position, len(split) - 1)
        return int(volume * share * split[idx])

    return 0

def process_results(data, volume):
    """Process SerpAPI response into structured competitor data"""
    results = {
        "keyword":      data.get("search_parameters", {}).get("q", ""),
        "volume":       volume,
        "scraped_at":   datetime.now().isoformat(),
        "local_pack":   [],
        "directories":  [],
        "social":       [],
        "websites":     [],
        "uncaptured":   int(volume * TRAFFIC_WEIGHTS["uncaptured"]),
        "summary":      {}
    }

    # ── LOCAL PACK (Google Business Profiles) ─────────────────────────────────
    local_results = data.get("local_results", [])
    for i, place in enumerate(local_results[:3]):
        traffic = calculate_traffic(volume, "local_pack", i, 3)
        results["local_pack"].append({
            "position":  i + 1,
            "name":      place.get("title", ""),
            "rating":    place.get("rating", "N/A"),
            "reviews":   place.get("reviews", 0),
            "address":   place.get("address", ""),
            "type":      place.get("type", ""),
            "website":   place.get("website", ""),
            "phone":     place.get("phone", ""),
            "traffic":   traffic,
            "traffic_pct": round((traffic / volume) * 100, 1),
        })

    # ── ORGANIC RESULTS ───────────────────────────────────────────────────────
    organic = data.get("organic_results", [])
    dir_count     = 0
    social_count  = 0
    website_count = 0

    # First pass — count categories
    for result in organic:
        cat = categorize_domain(result.get("link", ""))
        if cat == "directory":
            dir_count += 1
        elif cat == "social":
            social_count += 1
        else:
            website_count += 1

    # Second pass — assign traffic
    dir_pos    = 0
    social_pos = 0
    web_pos    = 0

    for result in organic:
        url     = result.get("link", "")
        title   = result.get("title", "")
        snippet = result.get("snippet", "")
        domain  = extract_domain(url)
        cat     = categorize_domain(url)

        if cat == "directory":
            traffic = calculate_traffic(volume, "directory", dir_pos, dir_count)
            results["directories"].append({
                "position": dir_pos + 1,
                "name":     title[:50],
                "domain":   domain,
                "url":      url,
                "traffic":  traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            dir_pos += 1

        elif cat == "social":
            traffic = calculate_traffic(volume, "social", social_pos, social_count)
            # Identify platform
            platform = "Social Media"
            if "instagram.com" in url:
                platform = "Instagram"
            elif "facebook.com" in url:
                platform = "Facebook"
            elif "youtube.com" in url:
                platform = "YouTube"
            elif "linkedin.com" in url:
                platform = "LinkedIn"

            results["social"].append({
                "position": social_pos + 1,
                "name":     title[:50],
                "domain":   domain,
                "platform": platform,
                "url":      url,
                "traffic":  traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            social_pos += 1

        else:
            traffic = calculate_traffic(volume, "website", web_pos, website_count)
            results["websites"].append({
                "position": web_pos + 1,
                "name":     title[:50],
                "domain":   domain,
                "url":      url,
                "snippet":  snippet[:150],
                "traffic":  traffic,
                "traffic_pct": round((traffic / volume) * 100, 1),
            })
            web_pos += 1

    # ── SUMMARY ───────────────────────────────────────────────────────────────
    total_gbp  = sum(r["traffic"] for r in results["local_pack"])
    total_dir  = sum(r["traffic"] for r in results["directories"])
    total_soc  = sum(r["traffic"] for r in results["social"])
    total_web  = sum(r["traffic"] for r in results["websites"])
    total_unc  = results["uncaptured"]
    total_all  = total_gbp + total_dir + total_soc + total_web + total_unc

    results["summary"] = {
        "total_volume":        volume,
        "gbp_traffic":         total_gbp,
        "gbp_pct":             round((total_gbp / volume) * 100, 1),
        "directory_traffic":   total_dir,
        "directory_pct":       round((total_dir / volume) * 100, 1),
        "social_traffic":      total_soc,
        "social_pct":          round((total_soc / volume) * 100, 1),
        "website_traffic":     total_web,
        "website_pct":         round((total_web / volume) * 100, 1),
        "uncaptured_traffic":  total_unc,
        "uncaptured_pct":      round((total_unc / volume) * 100, 1),
        "total_accounted":     total_all,
        "gbp_count":           len(results["local_pack"]),
        "directory_count":     len(results["directories"]),
        "social_count":        len(results["social"]),
        "website_count":       len(results["websites"]),
    }

    return results

# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    out_dir = os.path.join(BASE, "07_DATA_AND_RESEARCH", "Competitor_Data", CITY)
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  FortuneMarq — Google Results Scraper")
    print(f"  City: {CITY} | Niches: {len(NICHES)}")
    print(f"{'='*60}\n")

    all_results = {}
    errors      = []

    for niche, config in NICHES.items():
        keyword = config["keyword"]
        volume  = config["volume"]
        outfile = os.path.join(out_dir, f"{niche}_results.json")

        # Skip if already scraped
        if os.path.exists(outfile):
            print(f"  SKIP  {niche} — already scraped")
            with open(outfile, "r", encoding="utf-8") as f:
                all_results[niche] = json.load(f)
            continue

        print(f"  SCRAPING  {niche} — '{keyword}'")

        data = serpapi_search(keyword)
        if not data:
            print(f"  ERROR — no data returned for {niche}")
            errors.append(niche)
            continue

        if "error" in data:
            print(f"  API ERROR — {data['error']}")
            errors.append(niche)
            continue

        processed = process_results(data, volume)
        all_results[niche] = processed

        # Save individual niche file
        with open(outfile, "w", encoding="utf-8") as f:
            json.dump(processed, f, indent=2, ensure_ascii=False)

        # Print summary
        s = processed["summary"]
        print(f"          GBP: {s['gbp_pct']}% ({s['gbp_traffic']:,})  |  "
              f"Directories: {s['directory_pct']}% ({s['directory_traffic']:,})  |  "
              f"Social: {s['social_pct']}% ({s['social_traffic']:,})  |  "
              f"Websites: {s['website_pct']}% ({s['website_traffic']:,})")

        # Respect rate limits — 1 second between calls
        time.sleep(1.2)

    # Save master results file
    master_file = os.path.join(out_dir, "_ALL_RESULTS.json")
    with open(master_file, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    # Print final report
    print(f"\n{'='*60}")
    print(f"  SCRAPING COMPLETE")
    print(f"  Successful: {len(all_results) - len(errors)} / {len(NICHES)}")
    if errors:
        print(f"  Failed: {', '.join(errors)}")
    print(f"  Data saved to: {out_dir}")
    print(f"{'='*60}\n")

    # Print traffic distribution summary table
    print("  TRAFFIC DISTRIBUTION SUMMARY")
    print(f"  {'Niche':<25} {'Volume':>8} {'GBP%':>6} {'Dir%':>6} {'Soc%':>6} {'Web%':>6}")
    print(f"  {'-'*63}")
    for niche, data in all_results.items():
        s = data.get("summary", {})
        print(f"  {niche:<25} {s.get('total_volume',0):>8,} "
              f"{s.get('gbp_pct',0):>5.1f}% "
              f"{s.get('directory_pct',0):>5.1f}% "
              f"{s.get('social_pct',0):>5.1f}% "
              f"{s.get('website_pct',0):>5.1f}%")
    print()

if __name__ == "__main__":
    main()
