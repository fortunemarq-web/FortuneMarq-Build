"""
Website Phone Scraper
---------------------
Reads Website_Rescrape_Queue.csv
For each business:
  1. Searches Google Maps to find the website URL
  2. Visits the website
  3. Extracts phone number using multiple strategies
  4. Writes results back to No_Phone_Has_Website_Leads.csv

Requirements:
    pip install selenium beautifulsoup4 requests
    Chrome + ChromeDriver must be installed and on PATH
    (or use: brew install --cask chromedriver)

Run:
    python3 website_phone_scraper.py
"""

import csv
import re
import time
import random
import logging
from pathlib import Path
from urllib.parse import urlparse, urljoin

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

# ── Config ────────────────────────────────────────────────────────────────────

BASE_DIR       = Path(__file__).parent
QUEUE_FILE     = BASE_DIR / "Website_Rescrape_Queue.csv"
OUTPUT_FILE    = BASE_DIR / "No_Phone_Has_Website_Leads.csv"
LOG_FILE       = BASE_DIR / "website_scraper.log"

HEADLESS       = True           # Set True to run Chrome in background
PAGE_TIMEOUT   = 12             # seconds to wait for page load
MAPS_DELAY     = (3, 6)         # random delay range between Maps searches (seconds)
SITE_DELAY     = (2, 4)         # random delay range between site visits

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── Phone patterns ────────────────────────────────────────────────────────────

# Matches Indian mobile / landline numbers in various formats
PHONE_PATTERNS = [
    r'\+91[\s\-]?([6-9]\d{9})',           # +91 XXXXXXXXXX
    r'0([6-9]\d{9})',                      # 0XXXXXXXXXX
    r'\b([6-9]\d{9})\b',                  # bare 10-digit mobile
    r'\b0\d{2,4}[\s\-]\d{6,8}\b',         # STD landline: 0836-XXXXXX
    r'tel:[\+\d\s\-\(\)]{7,15}',          # tel: href value
]

def extract_phones_from_text(text: str) -> list[str]:
    """Pull all plausible Indian phone numbers out of a block of text."""
    found = []
    for pattern in PHONE_PATTERNS:
        for match in re.finditer(pattern, text):
            raw = match.group(0)
            cleaned = re.sub(r'[^\d]', '', raw)
            if cleaned.startswith('91') and len(cleaned) == 12:
                cleaned = cleaned[2:]
            if cleaned.startswith('0') and len(cleaned) == 11:
                cleaned = cleaned[1:]
            if len(cleaned) == 10 and cleaned[0] in '6789':
                if cleaned not in found:
                    found.append(cleaned)
    return found


def extract_phones_from_page(soup: BeautifulSoup, page_text: str) -> str | None:
    """Try multiple strategies to find a phone on the page. Returns best match or None."""

    # Strategy 1 — tel: links (most reliable)
    for tag in soup.find_all('a', href=re.compile(r'^tel:')):
        digits = re.sub(r'[^\d]', '', tag['href'])
        if digits.startswith('91') and len(digits) == 12:
            digits = digits[2:]
        if digits.startswith('0') and len(digits) == 11:
            digits = digits[1:]
        if len(digits) == 10 and digits[0] in '6789':
            return digits

    # Strategy 2 — schema.org / microdata telephone
    for tag in soup.find_all(itemprop='telephone'):
        digits = re.sub(r'[^\d]', '', tag.get_text())
        if digits.startswith('91') and len(digits) == 12:
            digits = digits[2:]
        if digits.startswith('0') and len(digits) == 11:
            digits = digits[1:]
        if len(digits) == 10 and digits[0] in '6789':
            return digits

    # Strategy 3 — common footer / contact keywords nearby
    for keyword in ['contact', 'phone', 'call', 'mobile', 'tel']:
        for tag in soup.find_all(string=re.compile(keyword, re.I)):
            parent = tag.parent
            nearby_text = parent.get_text() if parent else ''
            phones = extract_phones_from_text(nearby_text)
            if phones:
                return phones[0]

    # Strategy 4 — raw text scan
    phones = extract_phones_from_text(page_text)
    return phones[0] if phones else None


def try_contact_page(driver, base_url: str) -> str | None:
    """If no phone found on homepage, try /contact or /contact-us."""
    contact_paths = ['/contact', '/contact-us', '/contactus', '/reach-us', '/about']
    for path in contact_paths:
        url = base_url.rstrip('/') + path
        try:
            driver.get(url)
            time.sleep(2)
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            phone = extract_phones_from_page(soup, driver.page_source)
            if phone:
                log.info(f"  Found on {path}: {phone}")
                return phone
        except Exception:
            continue
    return None


# ── Chrome setup ──────────────────────────────────────────────────────────────

def make_driver() -> webdriver.Chrome:
    opts = Options()
    if HEADLESS:
        opts.add_argument('--headless=new')
    opts.add_argument('--disable-blink-features=AutomationControlled')
    opts.add_argument('--no-sandbox')
    opts.add_argument('--disable-dev-shm-usage')
    opts.add_argument('--window-size=1280,900')
    opts.add_experimental_option('excludeSwitches', ['enable-automation'])
    opts.add_experimental_option('useAutomationExtension', False)
    opts.add_argument(
        'user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    driver = webdriver.Chrome(options=opts)
    driver.set_page_load_timeout(PAGE_TIMEOUT)
    return driver


# ── Google Maps website lookup ────────────────────────────────────────────────

def get_website_from_maps(driver, query: str) -> str | None:
    """
    Search Google Maps for the business, return the website URL if listed.
    Returns None if no website found.
    """
    search_url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
    try:
        driver.get(search_url)
        time.sleep(random.uniform(*MAPS_DELAY))

        # Click the first result if on a list page
        try:
            first_result = WebDriverWait(driver, 6).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[href*="/maps/place/"]'))
            )
            first_result.click()
            time.sleep(random.uniform(2, 4))
        except TimeoutException:
            pass  # Already on a place page

        # Look for website link in the business panel
        website_selectors = [
            'a[data-item-id="authority"]',
            'a[aria-label*="website" i]',
            'a[href*="http"][data-tooltip="Open website"]',
        ]
        for selector in website_selectors:
            try:
                el = driver.find_element(By.CSS_SELECTOR, selector)
                href = el.get_attribute('href')
                if href and href.startswith('http') and 'google.com' not in href:
                    return href
            except Exception:
                continue

        # Fallback: scan all links in the panel for external URLs
        try:
            panel = driver.find_element(By.CSS_SELECTOR, 'div[role="main"]')
            for a in panel.find_elements(By.TAG_NAME, 'a'):
                href = a.get_attribute('href') or ''
                if href.startswith('http') and 'google.com' not in href and 'goo.gl' not in href:
                    return href
        except Exception:
            pass

    except WebDriverException as e:
        log.warning(f"Maps error for '{query}': {e}")

    return None


# ── Scrape website for phone ──────────────────────────────────────────────────

def scrape_website_for_phone(driver, url: str) -> str | None:
    """Visit a website and try to extract a phone number."""
    try:
        driver.get(url)
        time.sleep(random.uniform(*SITE_DELAY))
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        phone = extract_phones_from_page(soup, driver.page_source)
        if phone:
            return phone
        # Try contact page
        base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        return try_contact_page(driver, base_url)
    except TimeoutException:
        log.warning(f"  Timeout loading {url}")
        # Try anyway with whatever loaded
        try:
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            return extract_phones_from_page(soup, driver.page_source)
        except Exception:
            return None
    except WebDriverException as e:
        log.warning(f"  WebDriver error on {url}: {e}")
        return None


# ── Load / save CSVs ──────────────────────────────────────────────────────────

def load_queue() -> list[dict]:
    rows = []
    with open(QUEUE_FILE, newline='', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    return rows


def load_output() -> tuple[list[dict], list[str]]:
    rows = []
    fieldnames = []
    with open(OUTPUT_FILE, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        rows = list(reader)
    return rows, fieldnames


def save_output(rows: list[dict], fieldnames: list[str]):
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def save_queue(rows: list[dict]):
    fieldnames = list(rows[0].keys()) if rows else []
    with open(QUEUE_FILE, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    queue = load_queue()
    output_rows, output_fields = load_output()

    pending = [r for r in queue if r.get('Scrape Status', 'PENDING') == 'PENDING']
    log.info(f"Queue: {len(queue)} total — {len(pending)} pending")

    if not pending:
        log.info("All rows already processed. Nothing to do.")
        return

    # Build a lookup: Business Name → output row index
    output_index = {r['Business Name']: i for i, r in enumerate(output_rows)}

    driver = make_driver()
    found_count = 0
    failed_count = 0

    try:
        for i, item in enumerate(queue):
            if item.get('Scrape Status') != 'PENDING':
                continue

            name    = item['Business Name']
            city    = item['City']
            niche   = item['Niche']
            query   = item.get('Google Maps Search Query', f"{name} {city}")

            log.info(f"[{i+1}/{len(queue)}] {name} — {city} ({niche})")

            # Step 1: get website URL from Maps
            website_url = get_website_from_maps(driver, query)

            if not website_url:
                log.info(f"  No website found on Maps")
                item['Scrape Status'] = 'NO WEBSITE ON MAPS'
                failed_count += 1
            else:
                log.info(f"  Website: {website_url}")

                # Step 2: scrape the website for phone
                phone = scrape_website_for_phone(driver, website_url)

                if phone:
                    log.info(f"  Phone found: {phone}")
                    item['Scrape Status'] = 'DONE'
                    found_count += 1

                    # Update the output file row
                    if name in output_index:
                        idx = output_index[name]
                        output_rows[idx]['Phone']        = phone
                        output_rows[idx]['Website URL']  = website_url
                        output_rows[idx]['Status']       = 'PHONE RECOVERED'
                        output_rows[idx]['Scrape Status'] = 'DONE'
                    else:
                        # Business not in output file — append it
                        output_rows.append({
                            'Business Name': name,
                            'City':          city,
                            'Niche':         niche,
                            'Has Website':   'Y',
                            'Website URL':   website_url,
                            'Phone':         phone,
                            'Status':        'PHONE RECOVERED',
                            'Scrape Status': 'DONE',
                        })
                        output_index[name] = len(output_rows) - 1
                else:
                    log.info(f"  No phone found on website")
                    item['Scrape Status'] = 'NO PHONE ON SITE'
                    failed_count += 1

                    # Still save the website URL even if no phone
                    if name in output_index:
                        output_rows[output_index[name]]['Website URL'] = website_url

            # Save progress every 10 rows so a crash doesn't lose everything
            if (i + 1) % 10 == 0:
                save_queue(queue)
                save_output(output_rows, output_fields)
                log.info(f"  --- Progress saved ({found_count} found / {failed_count} failed so far) ---")

            time.sleep(random.uniform(1, 2))

    except KeyboardInterrupt:
        log.info("Interrupted by user — saving progress...")

    finally:
        driver.quit()
        save_queue(queue)
        save_output(output_rows, output_fields)
        log.info(f"\nDone. Phones found: {found_count} | Not found: {failed_count}")
        log.info(f"Results saved to: {OUTPUT_FILE.name}")
        log.info(f"Queue updated in: {QUEUE_FILE.name}")


if __name__ == '__main__':
    main()
