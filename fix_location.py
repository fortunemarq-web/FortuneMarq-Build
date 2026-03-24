"""
Fix location parameter in scrape_google_results_v2.py
"""

filepath = "scrape_google_results_v2.py"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old = '''    params = {
        "q":       query,
        "engine":  "google",
        "hl":      "en",
        "gl":      "in",
        "location": "Hubli,Karnataka,India",
        "api_key": SEARCHAPI_KEY,
        "num":     10,
    }'''

new = '''    params = {
        "q":       query,
        "engine":  "google",
        "hl":      "en",
        "gl":      "in",
        "api_key": SEARCHAPI_KEY,
        "num":     10,
    }'''

content = content.replace(old, new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed. Now run: python scrape_google_results_v2.py")
