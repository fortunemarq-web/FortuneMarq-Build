#!/usr/bin/env python3
"""Edit the 4 approved direct_report_cover_* templates: keep the IMAGE cover header
+ buttons, but restore the OLD detailed body (re-enters Meta review)."""
import os, re, json, subprocess, urllib.request, urllib.error

API = "v21.0"
APP_ID = "1713470496330818"
IDS = {"a": "868880355784987", "b": "27393668503626332",
       "c": "2077145799883327", "d": "1008564482204503"}
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


def http(url, data=None, headers=None, method="POST"):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as r:
            return True, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return False, json.loads(e.read().decode())
        except Exception: return False, {"error": {"message": str(e)}}


def sample_handle():
    # render page-1 of a live report as the sample cover
    subprocess.run(["curl", "-s", "-o", "/tmp/_cs.pdf",
        "https://cnwooodktqwvpzkucskm.supabase.co/storage/v1/object/public/market-reports/Mysuru/Gyms/Mysuru_Gyms_TypeA_en.pdf"], check=True)
    subprocess.run(["/opt/homebrew/bin/pdftoppm", "-png", "-singlefile", "-r", "96", "-f", "1", "-l", "1", "/tmp/_cs.pdf", "/tmp/_cs"], check=True)
    blob = open("/tmp/_cs.png", "rb").read()
    ok, sess = http(f"https://graph.facebook.com/{API}/{APP_ID}/uploads?file_name=cover.png&file_length={len(blob)}&file_type=image/png",
                    data=b"", headers={"Authorization": f"Bearer {TOKEN}"})
    if not ok: raise SystemExit(f"session: {sess}")
    ok, res = http(f"https://graph.facebook.com/{API}/{sess['id']}", data=blob,
                   headers={"Authorization": f"OAuth {TOKEN}", "file_offset": "0"})
    if not ok or "h" not in res: raise SystemExit(f"upload: {res}")
    return res["h"]


def edit(tid, handle):
    payload = {
        "parameter_format": "NAMED",
        "components": [
            {"type": "HEADER", "format": "IMAGE", "example": {"header_handle": [handle]}},
            {"type": "BODY", "text": BODY, "example": {"body_text_named_params": [
                {"param_name": "business_name", "example": "Fitness First Gym"},
                {"param_name": "niche", "example": "Gym"},
                {"param_name": "city", "example": "Hubli"}]}},
            {"type": "BUTTONS", "buttons": [
                {"type": "QUICK_REPLY", "text": "Book a meeting"},
                {"type": "QUICK_REPLY", "text": "Tell me more"}]},
        ],
    }
    return http(f"https://graph.facebook.com/{API}/{tid}",
                data=json.dumps(payload).encode(),
                headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})


if __name__ == "__main__":
    h = sample_handle()
    print("sample uploaded")
    for k, tid in IDS.items():
        ok, res = edit(tid, h)
        print(f"  direct_report_cover_{k}: {'OK' if ok else 'FAIL'} {res if not ok else ''}")
