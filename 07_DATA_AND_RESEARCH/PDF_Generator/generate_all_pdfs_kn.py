import argparse
import csv
import os
import re

from data_loader import get_niche_data, VOLUMES
from pdf_generator_kn import PDFGeneratorKN
import translator as T

OUTPUT_DIR = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/PDF_Generator/output/Hubli/'
LEADS_DIR = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final/'

NICHE_FILE_MAP = {
    'Gyms':               'Hubli_Gyms_Final.csv',
    'Skin Clinics':       'Hubli_SkinClinics_Final.csv',
    'Computer Training':  'Hubli_ComputerTraining_Final.csv',
    'Dental Clinics':     'Hubli_DentalClinics_Final.csv',
    'JEE NEET Coaching':  'Hubli_JEENEETCoaching_Final.csv',
    'Car Rentals':        'Hubli_CarRentals_Final.csv',
    'Physiotherapy':      'Hubli_Physiotherapy_Final.csv',
    'IVF Clinics':        None,
    'IELTS Coaching':     None,
    'Interior Designers': 'Hubli_InteriorDesigners_Final.csv',
    'Modular Kitchens':   'Hubli_ModularKitchens_Final.csv',
    'Real Estate':        'Hubli_RealEstate_Final.csv',
    'Tuition Centres':    'Hubli_TuitionCentres_Final.csv',
    'Hotels':             None,
}


def niche_slug(niche):
    return re.sub(r'[^A-Za-z0-9]', '', niche)


def load_leads(niche):
    fname = NICHE_FILE_MAP.get(niche)
    if not fname:
        return {'SERP_Y': 1, 'NoWeb': 1, 'HasWeb': 1}
    fpath = os.path.join(LEADS_DIR, fname)
    if not os.path.exists(fpath):
        return {'SERP_Y': 1, 'NoWeb': 1, 'HasWeb': 1}
    counts = {'SERP_Y': 0, 'NoWeb': 0, 'HasWeb': 0}
    with open(fpath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            serp = row.get('SERP Ranked', '').strip().upper()
            web = row.get('Has Website', '').strip().upper()
            if serp == 'Y':
                counts['SERP_Y'] += 1
            elif serp == 'N' and web == 'N':
                counts['NoWeb'] += 1
            elif serp == 'N' and web == 'Y':
                counts['HasWeb'] += 1
    return counts


def main():
    parser = argparse.ArgumentParser(description='Generate FortuneMarq Kannada PDFs for Hubli niches')
    parser.add_argument('--niche', default=None, help='Generate for one niche only')
    parser.add_argument('--test-niche', default=None, dest='test_niche',
                        help='Alias for --niche (for testing)')
    args = parser.parse_args()

    target_niche = args.niche or args.test_niche

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    gen = PDFGeneratorKN()

    all_niches = list(VOLUMES.keys())
    if target_niche:
        if target_niche not in all_niches:
            print(f"ERROR: Niche '{target_niche}' not found. Available niches:")
            for n in all_niches:
                print(f"  - {n}")
            return
        niches_to_process = [target_niche]
    else:
        niches_to_process = all_niches

    summary = []
    errors = []
    cache_hits_before = len(T._cache)

    for niche in niches_to_process:
        print(f"\n{'='*60}")
        print(f"Processing (KN): {niche}")
        slug = niche_slug(niche)
        niche_data = get_niche_data(niche)
        leads = load_leads(niche)
        generated = []

        if niche_data['is_low_volume']:
            fname = f'Hubli_{slug}_Type4_LowVolume_KN.pdf'
            fpath = os.path.join(OUTPUT_DIR, fname)
            try:
                gen.generate_type4(niche_data, fpath)
                size = os.path.getsize(fpath)
                print(f"  [OK] Type 4 KN: {fname} ({size:,} bytes)")
                generated.append(('Type4', fname, size))
            except Exception as e:
                print(f"  [ERROR] Type 4 KN: {e}")
                errors.append((niche, 'Type4', str(e)))
        else:
            if leads['SERP_Y'] > 0:
                fname = f'Hubli_{slug}_Type1_Visibility_KN.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type1(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 1 KN: {fname} ({size:,} bytes)")
                    generated.append(('Type1', fname, size))
                except Exception as e:
                    print(f"  [ERROR] Type 1 KN: {e}")
                    errors.append((niche, 'Type1', str(e)))

            if leads['NoWeb'] > 0:
                fname = f'Hubli_{slug}_Type2_NoWebsite_KN.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type2(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 2 KN: {fname} ({size:,} bytes)")
                    generated.append(('Type2', fname, size))
                except Exception as e:
                    print(f"  [ERROR] Type 2 KN: {e}")
                    errors.append((niche, 'Type2', str(e)))

            if leads['HasWeb'] > 0:
                fname = f'Hubli_{slug}_Type3_HasWebsite_KN.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type3(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 3 KN: {fname} ({size:,} bytes)")
                    generated.append(('Type3', fname, size))
                except Exception as e:
                    print(f"  [ERROR] Type 3 KN: {e}")
                    errors.append((niche, 'Type3', str(e)))

        summary.append((niche, generated))

    cache_hits_after = len(T._cache)

    # Final summary
    print(f"\n{'='*40}")
    print("HUBLI KANNADA PDF GENERATION COMPLETE")
    print('=' * 40)
    total_pdfs = sum(len(pdfs) for _, pdfs in summary)
    print(f"Total PDFs generated: {total_pdfs}")
    print()
    for niche, pdfs in summary:
        for ptype, fname, size in pdfs:
            print(f"  {fname} ({size:,} bytes)")

    print()
    print(f"Translation cache entries: {len(T._cache)}")
    print(f"New cache entries this run: {cache_hits_after - cache_hits_before}")

    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for niche, ptype, err in errors:
            print(f"  {niche} [{ptype}]: {err}")
    else:
        print("No errors.")


if __name__ == '__main__':
    main()
