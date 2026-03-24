import os
import csv
from collections import defaultdict

def analyze():
    city_stats = defaultdict(int)
    niche_stats = defaultdict(int)
    detailed_stats = defaultdict(lambda: defaultdict(int))
    total_leads = 0

    # Folders to skip or files to ignore
    exclude_files = ['google_maps_scraping_all_cities.csv', 'google_maps_scraping_all_cities.xlsx', 'analyze_leads.py']

    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.csv') and file not in exclude_files:
                path = os.path.join(root, file)
                
                # Determine City and Niche from path/filename
                # Using folder name for city to be more accurate
                city = root.replace('./', '').split('_')[0].split(' ')[0].capitalize()
                # Clean up niche from filename
                niche = file.replace('.csv', '').replace(city, '').replace('_', ' ').strip()
                if niche.startswith('cleaned leads'): niche = niche.replace('cleaned leads', '').strip()

                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        reader = csv.reader(f)
                        count = sum(1 for row in reader) - 1 # Subtract header
                        if count < 0: count = 0
                        
                        detailed_stats[city][niche] += count
                        city_stats[city] += count
                        niche_stats[niche] += count
                        total_leads += count
                except Exception as e:
                    print(f"Error reading {file}: {e}")

    print(f"{'CITY':<15} | {'NICHE':<35} | {'LEADS':<6}")
    print("-" * 65)
    for city in sorted(detailed_stats.keys()):
        for niche, count in sorted(detailed_stats[city].items()):
            print(f"{city:<15} | {niche:<35} | {count:<6}")
        print(f"{city:<15} | {'TOTAL':<35} | {city_stats[city]:<6}")
        print("-" * 65)

    print("\n--- NICHE SUMMARY ---")
    for niche, count in sorted(niche_stats.items()):
        print(f"{niche:<40}: {count}")

    print(f"\nGRAND TOTAL LEADS: {total_leads}")

if __name__ == "__main__":
    analyze()
