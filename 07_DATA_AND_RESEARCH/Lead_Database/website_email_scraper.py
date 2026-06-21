#!/usr/bin/env python3
"""
Website Email + Socials Scraper (FREE — no API, just HTTP)
==========================================================
Reads every Rescraped/<City>/*.csv, and for each lead that has a website,
visits the site (+ /contact, /about) and extracts:
  email(s), Instagram, Facebook, LinkedIn, WhatsApp.

Concurrent (threads), resumable (skips sites already in the output),
crash-safe (appends as it goes).

Run:  python3 website_email_scraper.py
Out:  Lead_Database/Website_Contacts.csv
"""
import os, re, csv, ssl, glob, sys
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "Rescraped")
OUT = os.path.join(BASE, "Website_Contacts.csv")
COLS = ["Business Name", "City", "Niche", "Phone", "Website Link",
        "Email", "All Emails", "Instagram", "Facebook", "LinkedIn", "WhatsApp", "Status"]

WORKERS = 40
TIMEOUT = 6
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0 Safari/537.36")
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
BAD_EMAIL = ("example.com", "domain.com", "yourdomain", "email.com", "sentry",
             "wixpress.com", "godaddy", "@2x", "@3x", ".png", ".jpg", ".jpeg",
             ".gif", ".webp", ".svg", "u003c", "react", "schema.org")
SOCIALS = {
    "Instagram": re.compile(r"https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.]+"),
    "Facebook":  re.compile(r"https?://(?:www\.)?facebook\.com/[A-Za-z0-9_.\-/]+"),
    "LinkedIn":  re.compile(r"https?://(?:www\.)?linkedin\.com/[A-Za-z0-9_.\-/]+"),
    "WhatsApp":  re.compile(r"https?://(?:wa\.me|api\.whatsapp\.com)/[A-Za-z0-9_./?=&+]+"),
}
EXTRA_PAGES = ["/contact", "/contact-us"]

def norm_url(u):
    u = (u or "").strip()
    if not u: return ""
    if not u.startswith("http"): u = "https://" + u
    return u

def get(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=TIMEOUT, context=CTX) as r:
            ct = r.headers.get("Content-Type", "")
            if "html" not in ct and "text" not in ct and ct:
                return ""
            return r.read(2_000_000).decode("utf-8", errors="replace")
    except Exception:
        return ""

def clean_emails(html):
    found = []
    for m in EMAIL_RE.findall(html or ""):
        e = m.strip().strip(".").lower()
        if any(b in e for b in BAD_EMAIL): continue
        if len(e) > 60: continue
        if e not in found: found.append(e)
    return found

def scrape(row):
    url = norm_url(row["Website Link"])
    res = dict(row); res.update({k: "" for k in ("Email","All Emails","Instagram","Facebook","LinkedIn","WhatsApp")})
    if not url:
        res["Status"] = "NO URL"; return res
    html = get(url)
    if not html:
        res["Status"] = "UNREACHABLE"; return res
    emails = clean_emails(html)
    socials = {k: (rx.search(html).group(0) if rx.search(html) else "") for k, rx in SOCIALS.items()}
    # try extra pages if no email yet
    base = url.rstrip("/")
    for path in EXTRA_PAGES:
        if emails: break
        h2 = get(base + path)
        if h2:
            emails = clean_emails(h2)
            for k, rx in SOCIALS.items():
                if not socials[k]:
                    mm = rx.search(h2);  socials[k] = mm.group(0) if mm else ""
    res["Email"] = emails[0] if emails else ""
    res["All Emails"] = "; ".join(emails[:5])
    for k in SOCIALS: res[k] = socials[k]
    res["Status"] = "EMAIL FOUND" if emails else ("SOCIALS ONLY" if any(socials.values()) else "NO CONTACT")
    return res

def load_sited_leads():
    out, seen = [], set()
    for p in glob.glob(os.path.join(SRC, "*", "*.csv")):
        for r in csv.DictReader(open(p, encoding="utf-8")):
            w = norm_url(r.get("Website Link"))
            if not w or w.lower() in seen: continue
            seen.add(w.lower())
            out.append({"Business Name": r.get("Business Name",""), "City": r.get("City",""),
                        "Niche": r.get("Niche",""), "Phone": r.get("Phone",""), "Website Link": w})
    return out

def main():
    leads = load_sited_leads()
    done = set()
    if os.path.isfile(OUT):
        for r in csv.DictReader(open(OUT, encoding="utf-8")):
            done.add((r.get("Website Link","")).lower())
    pending = [l for l in leads if l["Website Link"].lower() not in done]
    print(f"Sites total: {len(leads)} | already done: {len(done)} | pending: {len(pending)}")
    if not pending:
        print("Nothing to do."); return

    new_file = not os.path.isfile(OUT)
    f = open(OUT, "a", newline="", encoding="utf-8")
    w = csv.DictWriter(f, fieldnames=COLS, extrasaction="ignore")
    if new_file: w.writeheader()

    n = email = social = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(scrape, l): l for l in pending}
        for fut in as_completed(futs):
            r = fut.result(); w.writerow(r); n += 1
            if r["Status"] == "EMAIL FOUND": email += 1
            elif r["Status"] == "SOCIALS ONLY": social += 1
            if n % 100 == 0:
                f.flush(); print(f"  {n}/{len(pending)} done — {email} emails, {social} socials-only")
    f.close()
    print(f"\nDONE. processed {n} | emails {email} | socials-only {social} -> {os.path.basename(OUT)}")

if __name__ == "__main__":
    main()
