import argparse
import csv
import glob
import os
import re

from data_loader import get_niche_data, VOLUMES
from pdf_generator import PDFGenerator

# --- CONFIG ---
OUTPUT_DIR = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/PDF_Generator/output/Hubli/'
LEADS_DIR = '/Users/fortunemarq/Desktop/FortuneMarq_Build/07_DATA_AND_RESEARCH/Lead_Database/Hubli_Final/'

# Map niche name -> lead CSV filename slug
NICHE_FILE_MAP = {
    'Gyms':               'Hubli_Gyms_Final.csv',
    'Skin Clinics':       'Hubli_SkinClinics_Final.csv',
    'Computer Training':  'Hubli_ComputerTraining_Final.csv',
    'Dental Clinics':     'Hubli_DentalClinics_Final.csv',
    'JEE NEET Coaching':  'Hubli_JEENEETCoaching_Final.csv',
    'Car Rentals':        'Hubli_CarRentals_Final.csv',
    'Physiotherapy':      'Hubli_Physiotherapy_Final.csv',
    'IVF Clinics':        None,  # no CSV available
    'IELTS Coaching':     None,
    'Interior Designers': 'Hubli_InteriorDesigners_Final.csv',
    'Modular Kitchens':   'Hubli_ModularKitchens_Final.csv',
    'Real Estate':        'Hubli_RealEstate_Final.csv',
    'Tuition Centres':    'Hubli_TuitionCentres_Final.csv',
    'Hotels':             None,
}


def niche_slug(niche):
    """'JEE NEET Coaching' -> 'JEENEETCoaching'"""
    return re.sub(r'[^A-Za-z0-9]', '', niche)


def load_leads(niche):
    """Load leads for a niche. Returns dict with SERP_Y, SERP_N_NoWeb, SERP_N_Web counts."""
    fname = NICHE_FILE_MAP.get(niche)
    if not fname:
        # No leads file — default: generate all three types for non-low-volume
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
    parser = argparse.ArgumentParser(description='Generate FortuneMarq PDFs for Hubli niches')
    parser.add_argument('--niche', default=None, help='Generate for one niche only (for testing)')
    args = parser.parse_args()

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    gen = PDFGenerator()

    all_niches = list(VOLUMES.keys())
    if args.niche:
        if args.niche not in all_niches:
            print(f"ERROR: Niche '{args.niche}' not found. Available niches:")
            for n in all_niches:
                print(f"  - {n}")
            return
        niches_to_process = [args.niche]
    else:
        niches_to_process = all_niches

    summary = []
    errors = []

    for niche in niches_to_process:
        print(f"\n{'='*60}")
        print(f"Processing: {niche}")
        slug = niche_slug(niche)
        niche_data = get_niche_data(niche)
        leads = load_leads(niche)

        generated = []

        if niche_data['is_low_volume']:
            # Type 4 only
            fname = f'Hubli_{slug}_Type4_LowVolume.pdf'
            fpath = os.path.join(OUTPUT_DIR, fname)
            try:
                gen.generate_type4(niche_data, fpath)
                size = os.path.getsize(fpath)
                print(f"  [OK] Type 4 (Low Volume): {fname} ({size:,} bytes)")
                generated.append(('Type4', fname, size))
            except Exception as e:
                msg = f"  [ERROR] Type 4: {e}"
                print(msg)
                errors.append((niche, 'Type4', str(e)))
        else:
            # Type 1 — SERP Ranked
            if leads['SERP_Y'] > 0:
                fname = f'Hubli_{slug}_Type1_Visibility.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type1(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 1 (Visibility): {fname} ({size:,} bytes)")
                    generated.append(('Type1', fname, size))
                except Exception as e:
                    msg = f"  [ERROR] Type 1: {e}"
                    print(msg)
                    errors.append((niche, 'Type1', str(e)))

            # Type 2 — No website, not on SERP
            if leads['NoWeb'] > 0:
                fname = f'Hubli_{slug}_Type2_NoWebsite.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type2(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 2 (No Website): {fname} ({size:,} bytes)")
                    generated.append(('Type2', fname, size))
                except Exception as e:
                    msg = f"  [ERROR] Type 2: {e}"
                    print(msg)
                    errors.append((niche, 'Type2', str(e)))

            # Type 3 — Has website, not on SERP
            if leads['HasWeb'] > 0:
                fname = f'Hubli_{slug}_Type3_HasWebsite.pdf'
                fpath = os.path.join(OUTPUT_DIR, fname)
                try:
                    gen.generate_type3(niche_data, fpath)
                    size = os.path.getsize(fpath)
                    print(f"  [OK] Type 3 (Has Website): {fname} ({size:,} bytes)")
                    generated.append(('Type3', fname, size))
                except Exception as e:
                    msg = f"  [ERROR] Type 3: {e}"
                    print(msg)
                    errors.append((niche, 'Type3', str(e)))

        summary.append((niche, generated))

    # --- FINAL SUMMARY ---
    print(f"\n{'='*60}")
    print("GENERATION COMPLETE — SUMMARY")
    print(f"{'='*60}")
    total_pdfs = 0
    for niche, pdfs in summary:
        status = f"  {niche}: {len(pdfs)} PDF(s) generated"
        if pdfs:
            for ptype, fname, size in pdfs:
                status += f"\n    - {fname} ({size:,} bytes)"
        print(status)
        total_pdfs += len(pdfs)

    print(f"\nTotal PDFs generated: {total_pdfs}")

    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for niche, ptype, err in errors:
            print(f"  {niche} [{ptype}]: {err}")
    else:
        print("No errors.")


if __name__ == '__main__':
    main()
