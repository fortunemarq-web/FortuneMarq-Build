# 09 — Legal & Operations
**Last Updated:** 2026-04-28 | **Status:** GST registered, Udyam registered. Agreement template and policies complete. Minor items pending.

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
- [ ] Privacy Policy for fortunemarq.com (website legal requirement)
- [ ] Website Ownership Transfer document (for website clients who want to take their site elsewhere)
- [ ] GST invoice compliance checklist for FMOS activation
- [ ] FMOS activation: enter GSTIN and bank details in `/admin/finance` settings

## What's Blocked
- Privacy Policy: not urgent until website gets significant traffic
- FMOS GST activation: blocked on FMOS deployment

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
