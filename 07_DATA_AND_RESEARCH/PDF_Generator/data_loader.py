import csv
import os
from urllib.parse import urlparse

# --- PATHS ---
GBP_CSV = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_GBP_Data.csv'
ORGANIC_CSV = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_Organic_Results.csv'

# --- VOLUMES ---
VOLUMES = {
    'Gyms': 63950,           # Hubli_Gym_Keywords.csv
    'Skin Clinics': 41850,   # Hubli_Skin_Clinic_Keywords.csv
    'Computer Training': 24350,  # Hubli_Computer_Training_Institute_Keywords.csv
    'Dental Clinics': 21100, # Hubli_Dental_Clinic_Keywords.csv
    'Real Estate': 17850,    # Hubli_Real_Estate_Agent_Keywords.csv
    'Interior Designers': 16650,  # Hubli_Interior_Designer_Keywords.csv
    'Car Rentals': 16450,    # Hubli_Car_Rental_Keywords.csv
    'Tuition Centres': 11150,# Hubli_Tuition_Centre_Keywords.csv
    'JEE NEET Coaching': 12300,  # JEE 6700 + NEET 5600
    'Modular Kitchens': 6450,# Hubli_Modular_Kitchen_Keywords.csv
    'IELTS Coaching': 3200,  # Hubli_IELTS_Coaching_Keywords.csv
    'IVF Clinics': 350,      # Hubli_IVF_Fertility_Clinic_Keywords.csv
    'Physiotherapy': 1900,   # not in keyword research — retained previous estimate
    'Hotels': 8100,          # not in keyword research — retained previous estimate
}

LOW_VOLUME_THRESHOLD = 2500

TRAFFIC_PERCENTAGES = [
    ('GMB Profiles', 32),
    ('Directories', 28),
    ('Social Media', 22),
    ('Local Websites', 18),
]

DIRECTORY_DOMAINS = [
    'justdial', 'sulekha', 'indiamart', 'tradeindia', 'yellowpages',
    'practo', '99acres', 'magicbricks', 'commonfloor', 'olx', 'quikr',
    'urbanclap', 'urban company', 'urban-company',
]

SOCIAL_DOMAINS = ['instagram', 'facebook', 'youtube', 'twitter']


def _is_directory(url, title):
    url_lower = url.lower()
    title_lower = title.lower()
    for d in DIRECTORY_DOMAINS:
        if d in url_lower:
            return True
    for word in ['list', 'top', 'best']:
        if word in title_lower:
            return True
    return False


def _is_social(url):
    url_lower = url.lower()
    return any(s in url_lower for s in SOCIAL_DOMAINS)


def _extract_domain(url):
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain if domain else url
    except Exception:
        return url


def _load_gbp(niche):
    rows = []
    try:
        with open(GBP_CSV, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['niche'].strip().lower() == niche.strip().lower():
                    rows.append(row)
    except Exception:
        pass

    # Sort by reviews descending (then rating)
    def sort_key(r):
        try:
            return int(r.get('reviews', 0) or 0)
        except (ValueError, TypeError):
            return 0

    rows.sort(key=sort_key, reverse=True)
    rows = rows[:3]

    result = []
    for r in rows:
        name = r.get('name', 'Unknown').strip()
        # Trim very long names
        if len(name) > 40:
            name = name[:40].strip()
        result.append({
            'name': name,
            'rating': r.get('rating', 'N/A').strip(),
            'reviews': r.get('reviews', '0').strip(),
        })

    if not result:
        result = [{'name': 'No data available', 'rating': 'N/A', 'reviews': '0'}]

    return result


def _load_organic(niche):
    rows = []
    try:
        with open(ORGANIC_CSV, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row['niche'].strip().lower() == niche.strip().lower():
                    rows.append(row)
    except Exception:
        pass

    seen_dir_domains = set()
    seen_web_domains = set()
    directories = []
    websites = []

    for row in rows:
        url = row.get('url', '').strip()
        title = row.get('title', '').strip()
        snippet = row.get('snippet', '').strip()
        row_type = row.get('type', '').strip().lower()

        if _is_social(url):
            continue

        if row_type == 'directory' or _is_directory(url, title):
            domain = _extract_domain(url)
            if domain not in seen_dir_domains and len(directories) < 3:
                seen_dir_domains.add(domain)
                desc = snippet if snippet and snippet.lower() not in ('as:', 'n/a', '') else f'{title} listings'
                if len(desc) > 60:
                    desc = desc[:57] + '...'
                directories.append({'name': title if title else domain, 'description': desc})
        else:
            domain = _extract_domain(url)
            if domain not in seen_web_domains and len(websites) < 3:
                seen_web_domains.add(domain)
                desc = snippet if snippet and snippet.lower() not in ('as:', 'n/a', '') else f'{niche} website'
                if len(desc) > 60:
                    desc = desc[:57] + '...'
                websites.append({'domain': domain, 'description': desc})

    if not directories:
        directories = [{'name': 'No directory data', 'description': 'No directory listings found'}]
    if not websites:
        websites = [{'domain': 'No website data', 'description': 'No local websites found'}]

    return directories, websites


def get_niche_data(niche, city='Hubli'):
    volume = VOLUMES.get(niche, 0)
    is_low_volume = volume < LOW_VOLUME_THRESHOLD

    traffic = {}
    for label, pct in TRAFFIC_PERCENTAGES:
        count = int(volume * pct / 100)
        traffic[label] = (pct, count)

    top_gbp = _load_gbp(niche)
    top_directories, top_websites = _load_organic(niche)

    return {
        'niche': niche,
        'city': city,
        'volume': volume,
        'is_low_volume': is_low_volume,
        'top_gbp': top_gbp,
        'top_directories': top_directories,
        'top_websites': top_websites,
        'traffic': traffic,
    }


if __name__ == '__main__':
    for test_niche in ['Gyms', 'Dental Clinics']:
        data = get_niche_data(test_niche)
        print(f"\n=== {test_niche} ===")
        print(f"Volume: {data['volume']:,}")
        print(f"Is low volume: {data['is_low_volume']}")
        print(f"Top GBP: {data['top_gbp']}")
        print(f"Top dirs: {data['top_directories']}")
        print(f"Top websites: {data['top_websites']}")
        print(f"Traffic: {data['traffic']}")
