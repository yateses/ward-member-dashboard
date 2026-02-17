# Running LCR scripts manually

Use these when the API server isn’t running or you want to see errors in the terminal.

---

## 1. Main fetch script (same as “Run LCR” in the app)

Fetches member data from LCR and writes `lcr-data.json` (and `.tsv`) in the project root.

**From the project root:**

```bash
node scripts/fetchLCRData.js
```

**Requirements:**

- Project root = folder that contains `package.json` and `scripts/`.
- `.env` in project root is optional:
  - **With** `LCR_USERNAME` and `LCR_PASSWORD`: script will try to log in automatically; if it fails, it will ask you to sign in in the browser.
  - **Without** credentials: browser opens on the Church sign-in page; sign in manually; script continues when it sees you’re on LCR.

**What you’ll see:**

- A Chrome window opens, goes to LCR (and sign-in if needed).
- Terminal logs each step (login, fetch, save).
- If something fails (e.g. 404 on the report), the error is printed and the browser stays open a few seconds so you can look at the page.

---

## 2. Debug script (find the right report and see 404 details)

Use this to see which report endpoints work and what the run-report URL returns (including 404 body).

**From the project root:**

```bash
node scripts/manualLCRDebug.js
```

**What it does:**

1. Opens Chrome and gets you to LCR (auto-login if `.env` has credentials, otherwise you sign in manually).
2. While logged in, calls from the browser:
   - `.../api/report/custom-reports/list`
   - `.../api/report/custom-reports/available`
   - `.../api/report/custom-reports`
   - `.../api/report/custom-reports/run-report/<REPORT_ID>?lang=eng`
3. Prints **status code** and **full response body** for each in the terminal.
4. Leaves the browser open for 60 seconds so you can inspect the LCR page (e.g. open Custom Reports and see which report IDs you have).

**Optional in `.env`:**

- `LCR_REPORT_ID=your-report-uuid`  
  If not set, the script uses the default ID `33D30D27-9F76-A043-B73E-D27CC6D5D730`.

**How to fix a 404 on run-report:**

- The 404 usually means “this report doesn’t exist or you don’t have access.”
- In LCR: **Reports → Custom Reports** and find the report you want. The URL or report settings may show the report ID.
- Put that ID in `.env` as `LCR_REPORT_ID=...` and run the debug script again to confirm it returns 200 and member data.

---

## 3. Quick reference

| Goal                         | Command                          |
|-----------------------------|-----------------------------------|
| Fetch data (like the app)  | `node scripts/fetchLCRData.js`    |
| See API responses / 404    | `node scripts/manualLCRDebug.js` |

Run both from the **project root** (where `package.json` and `scripts/` live).
