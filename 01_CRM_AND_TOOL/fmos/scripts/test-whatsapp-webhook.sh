#!/bin/bash
SECRET=fmos_test_secret
URL=http://localhost:3000/api/webhooks/whatsapp
send() {
  local body="$1"
  local sig=$(printf '%s' "$body" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.*= //')
  curl -s -w '\n[%{http_code}]' -X POST "$URL" -H "Content-Type: application/json" -H "X-Hub-Signature-256: sha256=$sig" -d "$body"
}
case "$2" in esac
case "$1" in
  unsigned)
    curl -s -w '\n[%{http_code}]' -X POST "$URL" -H "Content-Type: application/json" -d '{"entry":[]}' ;;
  text_unknown)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"917975918980","phone_number_id":"TEST_PNID"},"contacts":[{"profile":{"name":"Test Gym Owner"},"wa_id":"919876500021"}],"messages":[{"from":"919876500021","id":"wamid.TEST001","timestamp":"1760000000","type":"text","text":{"body":"Hi, I want to know about digital marketing for my gym"}}]}}]}]}' ;;
  text_dup)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"TEST_PNID"},"contacts":[{"profile":{"name":"Test Gym Owner"},"wa_id":"919876500021"}],"messages":[{"from":"919876500021","id":"wamid.TEST001","timestamp":"1760000000","type":"text","text":{"body":"duplicate retry"}}]}}]}]}' ;;
  ctwa)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"TEST_PNID"},"contacts":[{"profile":{"name":"Test Clinic"},"wa_id":"919876500022"}],"messages":[{"from":"919876500022","id":"wamid.TEST002","timestamp":"1760000001","type":"text","text":{"body":"Saw your ad, tell me more"},"referral":{"source_url":"https://fb.me/xyz","source_id":"120211234567890123","source_type":"ad","headline":"Grow Your Clinic 3x","body":"Free marketing audit","media_type":"image","ctwa_clid":"TESTCLID123"}}]}}]}]}' ;;
  known_text)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"TEST_PNID"},"contacts":[{"profile":{"name":"Test Gym Owner"},"wa_id":"919876500021"}],"messages":[{"from":"919876500021","id":"wamid.TEST003","timestamp":"1760000002","type":"text","text":{"body":"Yes, confirmed"}}]}}]}]}' ;;
  button)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"TEST_PNID"},"contacts":[{"profile":{"name":"Test Gym Owner"},"wa_id":"919876500021"}],"messages":[{"from":"919876500021","id":"wamid.TEST004","timestamp":"1760000003","type":"interactive","interactive":{"type":"button_reply","button_reply":{"id":"book_meeting","title":"Book a meeting 📅"}}}]}}]}]}' ;;
  status)
    send '{"object":"whatsapp_business_account","entry":[{"id":"WABA_ID","changes":[{"field":"messages","value":{"messaging_product":"whatsapp","metadata":{"phone_number_id":"TEST_PNID"},"statuses":[{"id":"wamid.OUT001","status":"delivered","timestamp":"1760000004","recipient_id":"919876500021"}]}}]}]}' ;;
esac
