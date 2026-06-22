#!/usr/bin/env python3
"""Create direct_report_type_{a,b,c,d}_v2 WhatsApp templates:
IMAGE header (cover preview) + short body (no 'Read more') + 2 quick-reply buttons.
Resumable-uploads a sample cover, then POSTs each template to the WABA. One-off."""
import os, re, json, urllib.request, urllib.error

APP_ID = "1713470496330818"
WABA = "1499408311884474"
API = "v21.0"
COVER = "/tmp/cover_sample-1.png"
BODY = ("Hi {{business_name}}! 👋\n\n"
        "We did a market research for {{niche}} businesses in {{city}} and put together "
        "a report on your online presence — how visible your business is on Google, how "
        "many potential customers are searching for your service every month, and where "
        "the lead generation gap is.\n\n"
        "Have a look — it's specific to your business.\n\n"
        "— Team FortuneMarq")

ENV = ".env.local"
def env(k):
    for line in open(ENV, encoding="utf-8"):
        m = re.match(rf'^\s*{k}\s*=\s*(.*)\s*$', line)
        if m: return m.group(1).strip().strip('"').strip("'")
TOKEN = env("WHATSAPP_API_TOKEN")


def http(url, data=None, headers=None, method="POST"):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as r:
            return True, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return False, json.loads(e.read().decode())
        except Exception: return False, {"error": {"message": str(e)}}


def upload_sample():
    blob = open(COVER, "rb").read()
    ok, sess = http(
        f"https://graph.facebook.com/{API}/{APP_ID}/uploads?file_name=cover.png&file_length={len(blob)}&file_type=image/png",
        data=b"", headers={"Authorization": f"Bearer {TOKEN}"})
    if not ok: raise SystemExit(f"upload session failed: {sess}")
    sid = sess["id"]
    ok, res = http(f"https://graph.facebook.com/{API}/{sid}", data=blob,
                   headers={"Authorization": f"OAuth {TOKEN}", "file_offset": "0"})
    if not ok or "h" not in res: raise SystemExit(f"upload failed: {res}")
    return res["h"]


def delete(name):
    return http(f"https://graph.facebook.com/{API}/{WABA}/message_templates?name={name}",
                headers={"Authorization": f"Bearer {TOKEN}"}, method="DELETE")


def create(name, handle):
    payload = {
        "name": name, "language": "en", "category": "MARKETING",
        "parameter_format": "NAMED",
        "components": [
            {"type": "HEADER", "format": "IMAGE", "example": {"header_handle": [handle]}},
            {"type": "BODY", "text": BODY, "example": {"body_text_named_params": [
                {"param_name": "business_name", "example": "Acme Gym"},
                {"param_name": "niche", "example": "Gyms"},
                {"param_name": "city", "example": "Mysuru"}]}},
            {"type": "BUTTONS", "buttons": [
                {"type": "QUICK_REPLY", "text": "Book a meeting"},
                {"type": "QUICK_REPLY", "text": "Tell me more"},
                {"type": "QUICK_REPLY", "text": "ಕನ್ನಡ ವರದಿ"}]},
        ],
    }
    return http(f"https://graph.facebook.com/{API}/{WABA}/message_templates",
                data=json.dumps(payload).encode(),
                headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})


if __name__ == "__main__":
    handle = upload_sample()
    print("sample uploaded, handle ok", flush=True)
    for t in ("a", "b", "c", "d"):
        name = f"direct_report_v3_{t}"  # fresh names: cover + detailed body + 3 buttons (incl. Kannada)
        ok, res = create(name, handle)
        if ok:
            print(f"  CREATED {name}: id={res.get('id')} status={res.get('status')}", flush=True)
        else:
            err = res.get("error", {})
            print(f"  FAIL {name}: {err.get('error_user_msg') or err.get('message')}", flush=True)
