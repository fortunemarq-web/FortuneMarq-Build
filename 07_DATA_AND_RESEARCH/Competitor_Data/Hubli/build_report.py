import csv, os
from collections import defaultdict

gbp_file='/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_GBP_Data.csv'
org_file='/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_Organic_Results.csv'
out='/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Competitor_Data/Hubli/Hubli_Master_SERP_Report.md'

ads = {
    'Car Rental': 'YES — likely OTA platforms',
    'Hotels': 'YES — likely booking platforms',
    'Ivf': 'YES — likely national chains'
}

volumes = {
    'Gyms': 30000,
    'Skins': 7500,
    'Computer Training Institute': 7500,
    'Dental': 3900,
    'Jee Neet Coaching': 2550,
    'Car Rental': 2550,
    'Physiotherapy': 'TBD',
    'Ivf': 'TBD',
    'Ielts Coaching': 'TBD',
    'Interior Designer': 'TBD',
    'Modular Kitchen': 'TBD',
    'Real Estate Agent': 'TBD',
    'Tuition': 'TBD',
    'Hotels': 'TBD'
}

gbp = defaultdict(list)
with open(gbp_file, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        gbp[row['niche']].append(row)

org = defaultdict(list)
with open(org_file, encoding='utf-8') as f:
    for row in csv.DictReader(f):
        org[row['niche']].append(row)

report = []
report.append('# Hubli — Master SERP Intelligence Report')
report.append('**All 14 Niches | Live Google Data | March 2026**')
report.append('**FortuneMarq Media & Marketing — Internal Use Only**')
report.append('')
report.append('---')
report.append('')
report.append('## Key Finding')
report.append('**11 out of 14 niches have ZERO local businesses running paid ads.**')
report.append('The 3 niches showing ads (Car Rental, Hotels, IVF) are dominated by national OTA platforms — not local competitors.')
report.append('This means any local business that runs Google Ads today owns the top of the page immediately.')
report.append('')
report.append('---')
report.append('')
report.append('## Quick Reference Table')
report.append('')
report.append('| Niche | Monthly Volume | Paid Ads | GBP #1 | Rating | Reviews | GBP #2 | GBP #3 | Dirs P1 | Local Sites P1 |')
report.append('|---|---|---|---|---|---|---|---|---|---|')

all_niches = sorted(set(list(gbp.keys()) + list(org.keys())))

for niche in all_niches:
    vol = volumes.get(niche, 'TBD')
    ad_status = 'YES — national' if niche in ads else 'NO ADS'
    gbp_entries = gbp.get(niche, [])
    g1 = gbp_entries[0]['name'][:30] if len(gbp_entries) > 0 else 'No local pack'
    g1r = gbp_entries[0]['rating'] if len(gbp_entries) > 0 else ''
    g1rv = gbp_entries[0]['reviews'] if len(gbp_entries) > 0 else ''
    g2 = gbp_entries[1]['name'][:25] if len(gbp_entries) > 1 else ''
    g3 = gbp_entries[2]['name'][:25] if len(gbp_entries) > 2 else ''
    org_entries = org.get(niche, [])
    dirs = len([r for r in org_entries if r['type'] == 'Directory'])
    local = len([r for r in org_entries if r['type'] == 'Local Website'])
    report.append('| ' + niche + ' | ' + str(vol) + ' | ' + ad_status + ' | ' + g1 + ' | ' + g1r + ' | ' + g1rv + ' | ' + g2 + ' | ' + g3 + ' | ' + str(dirs) + ' | ' + str(local) + ' |')

report.append('')
report.append('---')
report.append('')
report.append('## Individual Niche Breakdown')
report.append('')

for niche in all_niches:
    vol = volumes.get(niche, 'TBD')
    report.append('### ' + niche)
    report.append('**Monthly Search Volume:** ' + str(vol))
    report.append('**Paid Ads:** ' + ads.get(niche, 'NO ADS — Zero local businesses running Google Ads'))
    report.append('')
    report.append('**Google Business Profile — Local 3-Pack**')
    report.append('')
    gbp_entries = gbp.get(niche, [])
    if gbp_entries and gbp_entries[0]['position'] != 'NO LOCAL PACK':
        report.append('| Position | Business | Rating | Reviews | Phone |')
        report.append('|---|---|---|---|---|')
        for e in gbp_entries:
            phone = e['phone'][:35] if e['phone'] else 'Not shown'
            report.append('| ' + str(e['position']) + ' | ' + e['name'][:50] + ' | ' + e['rating'] + ' | ' + e['reviews'] + ' | ' + phone + ' |')
    else:
        report.append('No local pack present for this keyword.')
    report.append('')
    report.append('**Page 1 Organic Results**')
    report.append('')
    org_entries = org.get(niche, [])
    if org_entries:
        report.append('| Position | Title | URL | Type |')
        report.append('|---|---|---|---|')
        for r in org_entries[:10]:
            report.append('| ' + str(r['position']) + ' | ' + r['title'][:45] + ' | ' + r['url'][:40] + ' | ' + r['type'] + ' |')
    report.append('')
    dirs_list = [r for r in org_entries if r['type'] == 'Directory']
    social_list = [r for r in org_entries if r['type'] == 'Social Media']
    local_list = [r for r in org_entries if r['type'] == 'Local Website']
    national_list = [r for r in org_entries if r['type'] == 'National Platform']
    report.append('**Traffic Distribution on Page 1**')
    report.append('- Directories: ' + str(len(dirs_list)) + ' listings')
    report.append('- Social Media profiles: ' + str(len(social_list)) + ' profiles')
    report.append('- Local business websites: ' + str(len(local_list)) + ' sites')
    report.append('- National platforms: ' + str(len(national_list)) + ' platforms')
    report.append('')
    report.append('**FortuneMarq Pitch Angle**')
    if niche not in ads:
        report.append('Zero paid ads in this niche. First local business to run Google Ads owns the top of the page immediately.')
    else:
        report.append('Ads present but from national platforms only. Local businesses can compete directly with a targeted local campaign.')
    if len(dirs_list) >= 2:
        report.append('JustDial and directories appear ' + str(len(dirs_list)) + ' times on Page 1. Pitch: directories own the customer relationship, not the business.')
    report.append('')
    report.append('---')
    report.append('')

open(out, 'w', encoding='utf-8').write('\n'.join(report))
print('Master report saved: ' + out)
print('Total niches covered: ' + str(len(all_niches)))
