# URGENT: Data Recovery Guide

## Your Data is SAFE in Firebase ✅

Your 1500+ expenses are still in the Firebase database. The webhook is broken but we can recover everything.

## Quick Recovery (2 Options)

### Option 1: Add Test Expense to Trigger Sync (EASIEST)

Even though the webhook is broken, the app will try to sync. Let's use the app's built-in recovery:

1. **In the app**, go to Expenses screen
2. **Add ONE test expense**: "$1 - Test"
3. The app will automatically try to sync ALL expenses
4. Check your Google Sheets - all data should appear

**If this works, you're done!** Delete the test expense after.

---

### Option 2: Manual Webhook Fix (If Option 1 Fails)

Your webhook is returning HTTP 302 because it's not deployed as "Anyone".

**Go to Google Apps Script:**
1. Visit: https://script.google.com
2. Open your expense tracking project
3. Click **Deploy** → **Manage deployments**
4. Click ✏️ **Edit** (NOT "New deployment")
5. Change "Execute as" to **Me**
6. Change "Who has access" to **Anyone**
7. Click **Deploy**
8. The URL should be the SAME, but now it will work

**Test it:**
```bash
curl -X POST -H "Content-Type: application/json" \\
  -d '{"action":"test"}' \\
  -w "\\nHTTP: %{http_code}\\n" \\
  "YOUR_WEBHOOK_URL"
```

Should return: **HTTP: 200** (not 302)

---

### Option 3: Direct Export from Firebase (BACKUP PLAN)

If both options fail, I can create a script to export directly from Firebase to a new Google Sheet.

You'll need:
1. Your Google Sheets spreadsheet URL
2. The sheet must be shared as "Anyone with link can edit"

---

## What's Causing the Errors?

The errors you're seeing are probably:
- ❌ "Failed to sync to Google Sheets"
- ❌ HTTP 302 errors in console
- ❌ Webhook timeout errors

**These won't delete your data** - they just prevent syncing to Sheets.

---

## Next Steps

1. **Try Option 1 first** (add test expense)
2. If it doesn't work, try **Option 2** (fix webhook)
3. If still broken, tell me and I'll do **Option 3** (direct export)

**Your data is 100% safe in Firebase!** We just need to sync it to Google Sheets.
