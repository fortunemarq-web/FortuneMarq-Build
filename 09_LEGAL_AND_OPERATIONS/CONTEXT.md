# 09 — Legal & Operations
**Last Updated:** 2026-06-25 | **Status:** GST + Udyam registered. Agreement template, service terms, and payment/cancellation policy complete and wired into FMOS (deployed & live; agreements confirm by WhatsApp/email reply). Privacy Policy + Terms + consent banner are **live on the website**, and **GST invoicing is built** in FMOS (no "activation" pending). Genuinely open: SAC codes + a website-ownership-transfer doc (see "What's Pending").

> Ground truth for build state: `00_MASTER/FMOS_System_Design_And_Tasks.md` + `00_MASTER/FMOS_Execution_Roadmap.md`.

## Folder Purpose
Create and store all legal documents, business policies, and compliance materials. These documents protect FortuneMarq and set clear expectations with clients. Agreement template is L4b in the content hierarchy.

## What Exists (Complete)

### Root Files
| File | Description |
|---|---|
| `BUSINESS_MASTER_INFO.md` | Complete business identity: trade name, legal name (Sayed Jabeer), GSTIN 29ICWPS9816Q1ZS, Udyam number UDYAM-KR-13-0088191, registered address, bank account details, NIC codes |
| `CONTEXT.md` | This file |

### Agreement_Templates/ folder
| File | Description |
|---|---|
| `agreement_template.md` | L4b: The actual 1-page agreement document Jabeer sends to clients. All {{variables}} marked for FMOS substitution. Client confirms by replying "Yes, confirmed." |
| `service_terms.json` | Service-specific terms for all 7 services + universal terms + exit policy. Used in FMOS and optionally appended to agreement PDF. |

### Business_Policies/ folder
| File | Description |
|---|---|
| `payment_and_cancellation_policy.md` | Full payment SOP: invoice schedule, accepted methods, overdue escalation flow (7-day pause, 30-day offline), cancellation terms, asset handover on exit |

### GST_and_Compliance/ folder
| File | Description |
|---|---|
| `GST Certificate.pdf` | Official GST registration certificate. GSTIN: 29ICWPS9816Q1ZS. Valid from 05/11/2025. |

### _project_files/ folder
| File | Description |
|---|---|
| `MASTER_CONTEXT.md` | Master context for the folder |

### Root-level documents
| File | Description |
|---|---|
| `fortunemarq udyam.pdf` | Udyam Registration Certificate. UDYAM-KR-13-0088191. Micro enterprise. NIC codes: 62012 (Web-page designing), 73100 (Advertising). Registered 05/11/2025. |

## Business Registration Details
| Detail | Value |
|---|---|
| Legal Name | Sayed Jabeer (Proprietorship) |
| Trade Name | FortuneMarq Media & Marketing |
| Founded | 04/11/2025 |
| GSTIN | 29ICWPS9816Q1ZS |
| Udyam Number | UDYAM-KR-13-0088191 |
| Address | Galaxy Mall, Floor 1, Shop No. 43, JC Nagar, Hubli — 580020, Karnataka |
| Phone | 9353082656 |
| Email | fortunemarq@gmail.com |

## What's Pending
Most former items are now DONE (see 2026-06-25 note). Genuinely open:
- [ ] **SAC codes** — confirm the GST Services Accounting Code per service (advertising/marketing ≈ 998361) and enter in FMOS.
- [ ] **Website Ownership Transfer document** — short doc for website clients who later move their site elsewhere.
- [ ] (Optional) review the live Privacy Policy for DPDP-Act specifics (data-principal rights, grievance officer).

## Done (corrected 2026-06-25)
- Privacy Policy + Terms of Service: **built and live on the website** (`01_CRM_AND_TOOL/fmos/app/site/privacy-policy`, `.../terms-of-service`) with a consent/cookie banner (`components/site/site-consent.tsx`).
- GST invoicing: **built** in FMOS (GSTIN + 18% configured, GST-compliant PDF, quarterly GST report at `/admin/finance/gst`) — no "activation" needed. Remaining GST refinements tracked in `08_FINANCE/gst-status-and-gaps.md`.

## Connections to Other Folders
- **Feeds INTO:** `03_SALES_SYSTEM/Proposals` — proposals reference agreement terms
- **Feeds INTO:** `04_CLIENT_MANAGEMENT/Onboarding` — onboarding starts after agreement signed
- **Feeds INTO:** `08_FINANCE` — GSTIN used in all invoices
- **Service terms used by:** `01_CRM_AND_TOOL/FMOS_Change_Specs/data/agreement_template.json` — FMOS version of the agreement

## Key Decisions Made (Locked)
- Agreement is confirmed by WhatsApp/email reply — no physical signature required
- Agreement number format: AGR-2026-001 (auto-incremented by FMOS)
- Service terms are universal + service-specific (layered approach)
- Exit: 30-day written notice, monthly fees pro-rated
- All assets created for client remain the client's property and are handed over on exit

## Session History
| Date | Summary |
|---|---|
| March 2026 | Context file created. GST status and existing assets documented. |
| 2026-04-02 | L4b complete: agreement_template.md created. service_terms.json created (7 services + universal + exit). payment_and_cancellation_policy.md created. |
| 2026-04-28 | CONTEXT.md fully rewritten. BUSINESS_MASTER_INFO.md and fortunemarq udyam.pdf noted. |
| 2026-06-17 | Doc-accuracy sweep. FMOS deployed & live; "blocked on deployment" framing removed. Agreement/terms/policy confirmed wired into the live app. |
