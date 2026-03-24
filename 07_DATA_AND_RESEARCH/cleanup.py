import os, shutil

BASE = r'C:\Users\sayed\Desktop\FortuneMarq-Build-main\07_DATA_AND_RESEARCH'

deleted = []
failed = []

def delete_file(path):
    try:
        if os.path.isfile(path):
            os.remove(path)
            deleted.append(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
            deleted.append(path)
        else:
            failed.append(path + ' — NOT FOUND')
    except Exception as e:
        failed.append(path + ' — ERROR: ' + str(e))

# --- DELETE ALL .DS_Store files ---
for root, dirs, files in os.walk(BASE):
    for f in files:
        if f == '.DS_Store':
            delete_file(os.path.join(root, f))

# --- DELETE _project_files folder ---
delete_file(os.path.join(BASE, '_project_files'))

# --- DELETE serpdata folder (duplicate of SERP_HTML) ---
delete_file(os.path.join(BASE, 'Competitor_Data', 'serpdata'))

# --- DELETE old Hubli niche subfolders (duplicates of SERP_HTML) ---
hubli = os.path.join(BASE, 'Competitor_Data', 'Hubli')
old_folders = [
    'car rental',
    'Computer institutes',
    'Dental clinics',
    'Gyms',
    'IELTS coaching',
    'Interior Designers',
    'Modular kitchen',
    'Neet, jee coaching',
    'Real estate',
    'Skin clinics',
    'Tution centers',
]
for folder in old_folders:
    delete_file(os.path.join(hubli, folder))

# --- DELETE Salons_results.json ---
delete_file(os.path.join(hubli, 'Salons_results.json'))

# --- DELETE duplicate xlsx in Competitor_Data ---
delete_file(os.path.join(BASE, 'Competitor_Data', 'FortuneMarq_Master_Keyword_Research.xlsx'))

# --- DELETE old lead processing files ---
lead_db = os.path.join(BASE, 'Lead_Database')
delete_file(os.path.join(lead_db, 'process_hubli_leads.py'))
delete_file(os.path.join(lead_db, 'google_maps_scraping_all_cities.csv'))
delete_file(os.path.join(lead_db, 'google_maps_scraping_all_cities.xlsx'))
delete_file(os.path.join(lead_db, 'website_scraper.log'))

# --- DELETE sample PDF generator and sample folder ---
pdf_gen = os.path.join(BASE, 'PDF_Generator')
delete_file(os.path.join(pdf_gen, 'sample_pdf.py'))
delete_file(os.path.join(pdf_gen, 'sample'))

# --- DELETE old Generated_PDFs ---
delete_file(os.path.join(BASE, 'Generated_PDFs'))

# --- REPORT ---
print('CLEANUP COMPLETE')
print('=' * 50)
print(f'Deleted: {len(deleted)} items')
print()
for d in deleted:
    print('  DELETED: ' + d)

if failed:
    print()
    print(f'Failed: {len(failed)} items')
    for f in failed:
        print('  FAILED: ' + f)
