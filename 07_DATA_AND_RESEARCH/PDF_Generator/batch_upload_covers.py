#!/usr/bin/env python3
"""Render a cover PNG (page 1) for every report and upload it next to the PDF
(same path, .png) so the WhatsApp image-header template can preview the cover.
Driven off report_assets, same as batch_upload_reports.py."""
import os, sys, time, subprocess, urllib.request, urllib.error
from batch_upload_reports import (URL, SVC, BUCKET, LETTER_TO_NUM, H,
                                  fetch_assets, fetch_volumes, storage_path)
from generate_city_reports import build_niche_data
from pdf_generator import PDFGenerator

PDFTOPPM = "/opt/homebrew/bin/pdftoppm"


def upload_png(path, data):
    h = dict(H); h["Content-Type"] = "image/png"; h["x-upsert"] = "true"
    r = urllib.request.Request(f"{URL}/storage/v1/object/{BUCKET}/{path}",
                               data=data, headers=h, method="POST")
    with urllib.request.urlopen(r, timeout=120) as resp:
        return resp.status


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None  # optional city filter / "one"
    assets = fetch_assets()
    volumes = fetch_volumes()
    gen = PDFGenerator()
    pid = os.getpid()
    pdf, pngbase = f"/tmp/_cov_{pid}.pdf", f"/tmp/_cov_{pid}"
    ok = skip = fail = 0
    for i, a in enumerate(assets):
        if only and only not in ("all", "one") and only.lower() != a["city"].lower():
            continue
        vol = volumes.get((a["city"].lower(), a["niche_slug"].lower()))
        num = LETTER_TO_NUM.get(a["lead_type"])
        if vol is None or not num:
            skip += 1
            continue
        nd = build_niche_data(a["city"], a["niche_slug"], vol)
        getattr(gen, f"generate_type{num}")(nd, pdf, a["lang"])
        subprocess.run([PDFTOPPM, "-png", "-singlefile", "-r", "96", "-f", "1", "-l", "1", pdf, pngbase],
                       check=True, capture_output=True)
        with open(pngbase + ".png", "rb") as fh:
            data = fh.read()
        cover_path = storage_path(a["public_url"]).rsplit(".pdf", 1)[0] + ".png"
        for attempt in range(3):
            try:
                upload_png(cover_path, data); ok += 1; break
            except urllib.error.HTTPError as e:
                if attempt == 2:
                    fail += 1; print(f"  FAIL {cover_path}: {e.code}", flush=True)
                else:
                    time.sleep(2)
        if only == "one":
            print(f"ONE -> {cover_path} ({len(data):,} bytes) status ok")
            return
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(assets)} ok={ok} skip={skip} fail={fail}", flush=True)
    print(f"DONE covers uploaded={ok} skipped={skip} failed={fail}")


if __name__ == "__main__":
    main()
