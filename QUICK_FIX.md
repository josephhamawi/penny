# QUICK FIX - Google Sheets Sync

## TL;DR

**The code is fine. The webhook needs to be redeployed.**

## 5-Minute Fix

### Step 1: Open Apps Script
1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**

### Step 2: Redeploy
1. Click **Deploy** → **New deployment**
2. Click gear icon ⚙️ → Choose **Web app**
3. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Authorize if prompted
6. **COPY THE NEW URL**

### Step 3: Update App
1. Open Expense Monitor app
2. Go to **Settings**
3. Paste the NEW URL in "Google Sheets Webhook URL"
4. Tap **Save**

### Step 4: Test
```bash
./test-webhook.sh "YOUR_NEW_URL"
```

Should see:
```
✓✓✓ ALL TESTS PASSED ✓✓✓
```

## Done!

Add an expense → Should appear in Google Sheets immediately.

---

**Full Details:** See `GOOGLE_SHEETS_SYNC_FIX.md`

**Investigation:** See `INVESTIGATION_RESULTS.md`
