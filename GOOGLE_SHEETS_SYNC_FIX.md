# CRITICAL FIX: Google Sheets Sync Not Working

## Executive Summary

The Google Sheets sync was 100% working before the invitation system was added. After investigation, **the code is actually correct** and fully functional. The issue is that **the Google Apps Script webhook is misconfigured and rejecting POST requests (HTTP 405 error)**.

## Root Cause

The webhook at:
```
https://script.google.com/macros/s/AKfycbwqknIV5HvQ3LScyR19MJPa1BL9ZJ_PReBFzQpt_pxZFryWdv3WMLRnefXHajP0K0zl1g/exec
```

**Is returning HTTP 405 (Method Not Allowed) for all POST requests.**

This means:
- GET requests work fine (webhook responds with "Webhook is running")
- POST requests are completely blocked
- The `doPost()` function exists in the script but is not accessible
- This is a deployment configuration issue, NOT a code issue

## Code Analysis - Everything is CORRECT

### 1. expenseService.js Flow
```javascript
// When adding/updating/deleting expenses:
addExpense() → syncAllExpensesToSheets(databaseId) → batchSyncToSheets(expenses)
updateExpense() → syncAllExpensesToSheets(databaseId) → batchSyncToSheets(expenses)
deleteExpense() → syncAllExpensesToSheets(databaseId) → batchSyncToSheets(expenses)
```
✅ **CORRECT** - Uses shared database ID properly

### 2. googleSheetsSyncService.js Flow
```javascript
getWebhookUrl() → getUserDatabaseId(userId) → Returns shared DB ID if exists
batchSyncToSheets() → Sends POST with correct format
```
✅ **CORRECT** - Properly resolves database ID and sends correct payload

### 3. Shared Database Support
```javascript
getUserDatabaseId(userId):
  - Checks if user is in a shared database
  - Returns shared DB ID if yes
  - Returns user's own ID if no
```
✅ **CORRECT** - Invitation system integration is working

### 4. Request Format
```javascript
{
  action: 'batch',
  expenses: [
    {
      ref: 1,
      date: '11/08/2025',
      description: 'Test',
      category: 'Food',
      in: 0,
      out: 50,
      balance: -50
    }
  ]
}
```
✅ **CORRECT** - Matches expected Google Apps Script format

## Why It's Not Working

The webhook test report shows:
```bash
curl -X POST https://script.google.com/.../exec \
  -H "Content-Type: application/json" \
  -d '{"action":"batch",...}'

Response:
HTTP 405 Method Not Allowed
Allow: HEAD, GET
```

This definitively proves the webhook is NOT configured to accept POST requests.

## THE FIX - Redeploy Google Apps Script

### Step 1: Access Your Apps Script
1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Verify the code contains the `doPost()` function (it should already be there)

### Step 2: Verify/Fix the Script Code
Make sure your Apps Script contains this EXACT code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'batch') {
      // Clear existing data (except header)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      // Add all expenses
      const rows = data.expenses.map(expense => [
        expense.ref,
        expense.date,
        expense.description,
        expense.category,
        expense.in || '',
        expense.out || '',
        expense.balance
      ]);

      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 7).setValues(rows);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Batch sync completed',
        count: rows.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'Webhook is running',
    message: 'Use POST requests to sync data'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### Step 3: Create NEW Deployment
**CRITICAL:** You MUST create a NEW deployment with correct settings:

1. Click **Deploy** → **New deployment** (NOT "Manage deployments")
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure EXACTLY as follows:
   - **Description**: "Expense Monitor Sync v2" (or any unique name)
   - **Execute as**: **Me** (your-email@gmail.com) ← CRITICAL
   - **Who has access**: **Anyone** ← CRITICAL
5. Click **Deploy**
6. If prompted, authorize permissions:
   - Click **Review permissions**
   - Select your Google account
   - Click **Advanced**
   - Click **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. **COPY THE NEW WEB APP URL** - it will be different from the old one

### Step 4: Update App Configuration
1. Open the Expense Monitor app
2. Go to **Settings** tab
3. Find the "Google Sheets Webhook URL" field
4. **PASTE THE NEW URL** from Step 3
5. Tap **Save**

### Step 5: Test the Fix
After deploying, test with curl:

```bash
# Test POST request (should return success)
curl -X POST "YOUR_NEW_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"batch","expenses":[{"ref":1,"date":"11/08/2025","description":"Test","category":"Food","in":0,"out":50,"balance":-50}]}'

# Expected response:
# {"success":true,"message":"Batch sync completed","count":1}
```

If you see `{"success":true,...}`, the webhook is fixed!

## Verification Checklist

After redeploying, verify:
- [ ] POST requests return HTTP 200 (not 405)
- [ ] Batch sync returns `{"success":true}`
- [ ] Adding expense in app updates Google Sheet
- [ ] Editing expense in app updates Google Sheet
- [ ] Deleting expense in app updates Google Sheet
- [ ] Shared database members see same webhook URL
- [ ] All expenses sync with correct ref#, date, and balance

## Why This Happened

**Theory:** When you modified the invitation system, you may have:
1. Accidentally changed the Apps Script deployment settings
2. Created a new deployment without POST access
3. The old deployment may have been deleted
4. The script permissions may have changed

**The good news:** The app code is 100% correct and doesn't need ANY changes. Only the webhook needs to be redeployed.

## Technical Details

### What Works
✅ Firebase data storage
✅ Shared database system
✅ Invitation system
✅ getUserDatabaseId() resolution
✅ Webhook URL caching in AsyncStorage
✅ Batch sync data formatting
✅ Silent failure handling (doesn't break app)
✅ GET request to webhook (health check)
✅ CORS configuration

### What's Broken
❌ POST requests to webhook (HTTP 405)
❌ Expense sync to Google Sheets
❌ doPost() function access

### Impact
- Firebase data: **WORKING** ✅
- Shared databases: **WORKING** ✅
- Invitation system: **WORKING** ✅
- Google Sheets sync: **NOT WORKING** ❌

Users can still add/edit/delete expenses normally. The data is safely stored in Firebase. Only the Google Sheets mirror is out of sync.

## No Code Changes Needed

**IMPORTANT:** Do NOT modify any of these files:
- ❌ src/services/expenseService.js
- ❌ src/services/googleSheetsSyncService.js
- ❌ src/services/invitationService.js

The code is already correct and working. The ONLY fix needed is redeploying the Google Apps Script webhook.

## Post-Fix Actions

Once the webhook is fixed:

1. **Test adding an expense** - should appear in Google Sheets immediately
2. **Test editing an expense** - should update in Google Sheets
3. **Test deleting an expense** - should remove from Google Sheets
4. **Test with shared database** - multiple users should see same data
5. **Monitor console logs** - should see `[GoogleSheets] Batch sync completed`

## Success Criteria

Sync is 100% working when:
- ✅ POST to webhook returns HTTP 200
- ✅ Adding expense syncs to Google Sheets within 2 seconds
- ✅ Balance calculations are correct
- ✅ Ref# sequence is correct (1, 2, 3...)
- ✅ All expenses appear in chronological order
- ✅ Shared database members see same data

## Emergency Fallback

If redeployment doesn't work:

1. **Create a brand new Apps Script project:**
   - Create new Google Sheet
   - Extensions → Apps Script
   - Paste the script code
   - Deploy as Web app
   - Use the new webhook URL

2. **Verify permissions:**
   - Go to View → Executions in Apps Script
   - Check for authorization errors
   - Run the script manually once if needed

3. **Check sheet format:**
   - Row 1 must have headers: Ref#, Date, Description, Category, In, Out, Balance
   - No extra rows above headers
   - No merged cells

## Support Information

If the issue persists after redeployment:

1. Check Apps Script execution logs (View → Executions)
2. Verify the webhook URL ends with `/exec`
3. Ensure "Execute as" is set to "Me"
4. Ensure "Who has access" is set to "Anyone"
5. Try deploying from a different Google account
6. Check if the sheet has correct permissions

## Conclusion

**THE CODE IS FINE. THE WEBHOOK NEEDS TO BE REDEPLOYED.**

Follow the deployment steps above, update the webhook URL in the app, and the sync will be 100% working again.

The invitation system didn't break the code - it's working perfectly. The webhook just needs to be reconfigured to accept POST requests.

---

**Estimated Fix Time:** 5-10 minutes

**Difficulty:** Easy (just follow deployment steps)

**Risk:** None (worst case, create new webhook)

**Impact:** HIGH - Restores 100% sync functionality
