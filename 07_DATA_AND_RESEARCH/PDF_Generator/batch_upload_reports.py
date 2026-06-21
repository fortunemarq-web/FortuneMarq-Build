#!/usr/bin/env python3
"""
Regenerate every market report in the ORIGINAL 5-page design (EN + KN) and
overwrite the exact Supabase Storage paths the app already serves, so the live
app + Direct Report pick up the new design with zero report_assets changes.

Driven off the report_assets table (one row = one file to replace).

Modes:
  plan                         -> dry run: counts + what would be skipped, NO writes
  one <City> <slug> <A|B|C|D> <en|kn>  -> generate+upload a single report (test)
  all                          -> generate+upload every report_assets row

Env (SUPABASE url + service key) read from ../../01_CRM_AND_TOOL/fmos/.env.local
"""
import os, sys, re, json, time
import urllib.request, urllib.error
from generate_city_reports import build_niche_data
from pdf_generator import PDFGenerator

BASE = os.path.dirname(os.path.abspath(__file__))
ENV = os.path.join(BASE, "..", "..", "01_CRM_AND_TOOL", "fmos", ".env.local")
BUCKET = "market-reports"
LETTER_TO_NUM = {"A": 1, "C": 2, "B": 3, "D": 4}


def env(key):
    for line in open(ENV, encoding="utf-8"):
        m = re.match(rf'^\s*{key}\s*=\s*(.*)\s*$', line)
        if m:
            return m.group(1).strip().strip('"').strip("'")
    raise SystemExit(f"{key} not found in {ENV}")


URL = env("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
SVC = env("SUPABASE_SERVICE_ROLE_KEY")
H = {"apikey": SVC, "Authorization": f"Bearer {SVC}"}


def get(path):
    r = urllib.request.Request(URL + path, headers=H, method="GET")
    with urllib.request.urlopen(r, timeout=60) as resp:
        return json.loads(resp.read().decode())


def fetch_assets():
    rows, frm = [], 0
    while True:
        h = dict(H); h["Range"] = f"{frm}-{frm+999}"
        r = urllib.request.Request(
            URL + "/rest/v1/report_assets?select=city,niche_slug,lead_type,lang,public_url",
            headers=h, method="GET")
        with urllib.request.urlopen(r, timeout=60) as resp:
            chunk = json.loads(resp.read().decode())
        rows.extend(chunk)
        if len(chunk) < 1000:
            break
        frm += 1000
    return rows


def fetch_volumes():
    vols = {}
    for mi in get("/rest/v1/market_insights?select=city,industry,search_volume"):
        raw = re.sub(r"[^\d]", "", str(mi.get("search_volume") or ""))
        if raw:
            vols[(mi["city"].lower(), str(mi["industry"]).lower())] = int(raw)
    return vols


def storage_path(public_url):
    marker = f"/object/public/{BUCKET}/"
    return public_url.split(marker, 1)[1]


def upload(path, pdf_bytes):
    url = f"{URL}/storage/v1/object/{BUCKET}/{path}"
    h = dict(H)
    h["Content-Type"] = "application/pdf"
    h["x-upsert"] = "true"
    r = urllib.request.Request(url, data=pdf_bytes, headers=h, method="POST")
    with urllib.request.urlopen(r, timeout=120) as resp:
        return resp.status


def render(row, volumes, gen):
    city, slug = row["city"], row["niche_slug"]
    vol = volumes.get((city.lower(), slug.lower()))
    if vol is None:
        return None, "no-volume"
    num = LETTER_TO_NUM.get(row["lead_type"])
    if not num:
        return None, f"bad-type:{row['lead_type']}"
    nd = build_niche_data(city, slug, vol)
    tmp = f"/tmp/_batch_{os.getpid()}.pdf"
    getattr(gen, f"generate_type{num}")(nd, tmp, row["lang"])
    with open(tmp, "rb") as fh:
        return fh.read(), None


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "plan"
    assets = fetch_assets()
    volumes = fetch_volumes()
    gen = PDFGenerator()
    print(f"report_assets rows: {len(assets)} | market_insights volumes: {len(volumes)}")

    if mode == "plan":
        skip = [a for a in assets if (a["city"].lower(), a["niche_slug"].lower()) not in volumes]
        miss = sorted({(a["city"], a["niche_slug"]) for a in skip})
        print(f"would generate+upload: {len(assets) - len(skip)} | skip (no volume): {len(skip)}")
        for c, s in miss[:40]:
            print(f"  skip {c}/{s}")
        return

    if mode == "one":
        _, _, city, slug, lt, lang = sys.argv
        row = {"city": city, "niche_slug": slug, "lead_type": lt, "lang": lang,
               "public_url": f"{URL}/storage/v1/object/public/{BUCKET}/{city}/{city}_{slug}_Type_{lt}_{lang}.pdf"}
        # find the real row to get the true path
        for a in assets:
            if (a["city"] == city and a["niche_slug"] == slug
                    and a["lead_type"] == lt and a["lang"] == lang):
                row = a; break
        data, err = render(row, volumes, gen)
        if err:
            print(f"SKIP: {err}"); return
        path = storage_path(row["public_url"])
        print(f"uploading -> {path} ({len(data):,} bytes)")
        print("status", upload(path, data))
        print("url", row["public_url"])
        return

    if mode == "all":
        ok = skipped = failed = 0
        for i, a in enumerate(assets):
            data, err = render(a, volumes, gen)
            if err:
                skipped += 1; continue
            path = storage_path(a["public_url"])
            for attempt in range(3):
                try:
                    upload(path, data); ok += 1; break
                except urllib.error.HTTPError as e:
                    if attempt == 2:
                        failed += 1
                        print(f"  FAIL {path}: {e.code} {e.read().decode()[:120]}")
                    else:
                        time.sleep(2)
            if (i + 1) % 50 == 0:
                print(f"  {i+1}/{len(assets)}  ok={ok} skip={skipped} fail={failed}")
        print(f"DONE. uploaded={ok} skipped={skipped} failed={failed}")


if __name__ == "__main__":
    main()
