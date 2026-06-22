#!/usr/bin/env python3
"""Edit direct_report_v3_* templates: REMOVE the image header — keep detailed body
+ 3 buttons (Book a meeting / Tell me more / ಕನ್ನಡ ವರದಿ). Text template only; the
PDF is sent separately as a follow-up document."""
import re, json, urllib.request, urllib.error

API = "v21.0"
IDS = {"a": "1679588440016280", "b": "935841572794289",
       "c": "1166925955626662", "d": "1760210568676506"}
BODY = ("Hi {{business_name}}! 👋\n\n"
        "We did a market research for {{niche}} businesses in {{city}} and put together "
        "a report on your online presence — how visible your business is on Google, how "
        "many potential customers are searching for your service every month, and where "
        "the lead generation gap is.\n\n"
        "Have a look — it's specific to your business.\n\n"
        "— Team FortuneMarq")

def env(k):
    for line in open(".env.local", encoding="utf-8"):
        m = re.match(rf'^\s*{k}\s*=\s*(.*)\s*$', line)
        if m: return m.group(1).strip().strip('"').strip("'")
TOKEN = env("WHATSAPP_API_TOKEN")


def edit(tid):
    payload = {
        "parameter_format": "NAMED",
        "components": [
            {"type": "BODY", "text": BODY, "example": {"body_text_named_params": [
                {"param_name": "business_name", "example": "Fitness First Gym"},
                {"param_name": "niche", "example": "Gym"},
                {"param_name": "city", "example": "Hubli"}]}},
            {"type": "BUTTONS", "buttons": [
                {"type": "QUICK_REPLY", "text": "Book a meeting"},
                {"type": "QUICK_REPLY", "text": "Tell me more"},
                {"type": "QUICK_REPLY", "text": "ಕನ್ನಡ ವರದಿ"}]},
        ],
    }
    req = urllib.request.Request(f"https://graph.facebook.com/{API}/{tid}",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return True, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return False, json.loads(e.read().decode())
        except Exception: return False, {"error": {"message": str(e)}}


if __name__ == "__main__":
    for k, tid in IDS.items():
        ok, res = edit(tid)
        print(f"  direct_report_v3_{k}: {'OK' if ok else 'FAIL'} {'' if ok else res}")
