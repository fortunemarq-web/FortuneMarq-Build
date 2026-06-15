# CSV Upload Format Guide

## Overview
The CSV uploader allows you to bulk import leads into the system. It supports automatic duplicate detection, custom industry/city creation, and optional market intelligence data entry.

## Required CSV Infrastructure

### 1. File Requirements
- **Format**: `.csv` (Comma Separated Values) only.
- **Encoding**: UTF-8 recommended.
- **Header Row**: Must be the first row of the file.

### 2. Column Mapping
The uploader reads the following column headers (use the exact names shown; some
fields accept an alternate spelling). Only `Business Name` is required — every
other column is optional.

| Column Header | Status | Description |
| :--- | :--- | :--- |
| `Business Name` | **Required** | The name of the company or business. |
| `Phone No` (or `Phone`) | Optional | Contact number. Recommended for dialer functionality. |
| `Website Link` | Optional | Full URL (e.g., `https://example.com`). Used to infer `Has Website`. |
| `Has Website` | Optional | `true`/`false`/`yes`/`1`. If omitted, inferred from `Website Link`. |
| `Google Maps Link` | Optional | GMB / Google Maps profile URL. |
| `SERP_Ranked` (or `SERP Ranked`) | Optional | Whether the business ranks: `Y`/`Yes`/`True`/`1` → ranked. Drives lead type A/B/C/D. |
| `SERP_Source` (or `SERP Source`) | Optional | Where the SERP ranking was observed (free text). |

> **Note on City / Industry**: these are **not** CSV columns. You pick a target
> City and Industry from the dropdown during upload, and that selection applies to
> **ALL** leads in the batch — any City/Industry columns in the CSV are ignored.

---

## Enhanced Features

### Custom Industry & City
If your target industry or city is not in the dropdown list:
1. Select **"Other"** from the bottom of the dropdown.
2. An input field will appear.
3. Type your custom name (e.g., "Solar Installers" or "Pune").
4. This value will be saved and applied to all leads in the batch.

### Market Intelligence (Optional)
You can attach market research data to the entire batch during upload. Toggle **"Add Market Research Data"** to input:
- **Monthly Search Demand**: (e.g., "1.2k searches/mo")
- **Competitor Traffic**: (e.g., "5k visits")
- **Top Keywords**: (e.g., "best dentist austin, dental implants")
- **Market Difficulty**: Low/Medium/High

This data populates the "Intelligence Card" for sales executives when calling these leads.

---

## Example CSV Data

### Standard Format
```csv
Business Name,Phone No,Website Link,Has Website
ABC Dental,555-0101,https://abcdental.com,true
XYZ Ortho,555-0102,,false
Smile Care,555-0103,https://smile.com,yes
```

### Minimal Format
```csv
Business Name,Phone No
ABC Dental,555-0101
XYZ Ortho,555-0102
```

---

## Data Parsing Logic

1. **Website Detection**:
   - If `Website Link` is present and valid (not "nil"), `Has Website` is set to `true`.
   - You can explicitly set `Has Website` to `false` or `0` to override this.

2. **Duplicate Handling**:
   - The system checks for existing `Phone No` or `Business Name` within the same City/Industry.
   - Duplicates are **skipped** automatically.
   - The results screen will show how many were "Added" vs "Skipped".

## Troubleshooting

- **"Missing Business Name" Error**: Ensure the column header is exactly `Business Name`.
- **0 Leads Found**: Check if your file is comma-delimited and not semicolon or tab-delimited.
- **Encoding Issues**: If business names look garbled (e.g., `CafÃ©`), save your CSV with UTF-8 encoding.




