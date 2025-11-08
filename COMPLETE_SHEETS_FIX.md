# Complete Google Sheets Fix Guide

## The Problem

You have TWO different features that are getting confused:

### 1. Sync TO Sheets (App → Sheets) ❌ BROKEN
- **What it does**: Automatically sends expense data FROM the app TO Google Sheets
- **URL needed**: Webhook URL (Apps Script deployment)
- **Your URL**: `https://script.google.com/macros/s/AKfycbwqknIV5HvQ3LScyR19MJPa1BL9ZJ_PReBFzQpt_pxZFryWdv3WMLRnefXHajP0K0zl1g/exec`
- **Status**: BROKEN - Returns HTTP 302 redirect, needs redeployment

### 2. Import FROM Sheets (Sheets → App) ❌ WRONG URL
- **What it does**: Import existing data FROM Google Sheets INTO the app
- **URL needed**: Google Sheets document URL
- **Your URL**: You're using the webhook URL (wrong!)
- **Correct URL format**: `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit#gid=0`

---

## Fix #1: Redeploy Webhook (Sync TO Sheets)

### Step 1: Open Your Google Apps Script
1. Go to: https://script.google.com
2. Find your "Spensely Expense Tracker" project
3. Open it

### Step 2: Redeploy the Script
1. Click **Deploy** → **Manage deployments**
2. Click the ✏️ (Edit) icon next to your current deployment
3. Under "Who has access", select **Anyone**
4. Click **Deploy**
5. **COPY THE NEW URL** - it will be different!

### Step 3: Test the New Webhook
```bash
# Replace NEW_WEBHOOK_URL with your new deployment URL
curl -X POST -H "Content-Type: application/json" \
  -d '{"action":"add","ref":"TEST","date":"12/15/2024","description":"Test","category":"Food","in":0,"out":50,"balance":0}' \
  -w "\nHTTP Status: %{http_code}\n" \
  "NEW_WEBHOOK_URL"
```

**Expected result**: HTTP Status: 200 (not 302!)

### Step 4: Update Webhook URL in App
1. Open the app Settings
2. Paste the **NEW webhook URL**
3. Save

---

## Fix #2: Get Your Google Sheets Document URL

### Step 1: Open Your Expense Sheet
1. Go to Google Sheets
2. Open your expense tracking spreadsheet

### Step 2: Copy the Correct URL
1. Look at the URL in your browser
2. It should look like:
   ```
   https://docs.google.com/spreadsheets/d/1abc123XYZ-EXAMPLE-ID/edit#gid=0
   ```
3. **Copy the entire URL**

### Step 3: Make Sheet Publicly Accessible
1. Click **Share** button
2. Under "General access", select **Anyone with the link**
3. Set permission to **Viewer**
4. Click **Done**

### Step 4: Import Data Using Correct URL
1. Open app Settings
2. In the Google Sheets section, paste your **Google Sheets document URL** (NOT the webhook URL!)
3. Tap **Save** - it will automatically import existing data

---

## How to Know Which URL to Use

### Use WEBHOOK URL when:
- ✅ Enabling automatic sync (app → sheets)
- ✅ "Google Sheets Webhook URL" field in Settings
- Format: `https://script.google.com/macros/s/...`

### Use SHEETS DOCUMENT URL when:
- ✅ Importing existing data (sheets → app)
- ✅ One-time import of expenses from your sheet
- Format: `https://docs.google.com/spreadsheets/d/...`

---

## Quick Verification Commands

### Test Webhook (should return HTTP 200):
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  "YOUR_WEBHOOK_URL"
```

### Test Sheets URL (should download CSV):
```bash
# Extract spreadsheet ID from your sheets URL first
# Then test the CSV export:
curl "https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/export?format=csv&gid=0"
```

---

## Common Errors

### "Failed to fetch Google Sheet"
- ❌ Sheet is not publicly shared
- ✅ Share with "Anyone with the link can view"

### "HTTP 302 / HTTP 405"
- ❌ Webhook not deployed as "Anyone"
- ✅ Redeploy with "Anyone" access

### "No data found in the sheet"
- ❌ Sheet has only headers, no data rows
- ✅ Add at least one expense row

### "Invalid Google Sheets URL"
- ❌ Using webhook URL for import
- ✅ Use actual sheets document URL

---

## Next Steps

1. **First**: Fix the webhook by redeploying (see Fix #1)
2. **Second**: Get your Google Sheets document URL (see Fix #2)
3. **Third**: Import existing data using the sheets URL
4. **Fourth**: Enable auto-sync using the webhook URL

After both fixes:
- ✅ New expenses in app → automatically appear in sheet
- ✅ Existing expenses in sheet → can be imported to app
