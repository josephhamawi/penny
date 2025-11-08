# Google Sheets Webhook Test Report

**Webhook URL**: https://script.google.com/macros/s/AKfycbwqknIV5HvQ3LScyR19MJPa1BL9ZJ_PReBFzQpt_pxZFryWdv3WMLRnefXHajP0K0zl1g/exec

**Test Date**: November 8, 2025

---

## Test Results Summary

### ❌ WEBHOOK IS NOT WORKING PROPERLY

The webhook responds to GET requests but **rejects all POST requests with HTTP 405 (Method Not Allowed)**.

---

## Detailed Test Results

### Test 1: GET Request (Basic Health Check)
**Status**: ✅ PASSED
```bash
curl -X GET "https://script.google.com/.../exec"
```

**Response**:
- **HTTP Status**: 200 OK
- **Headers**: 
  - `access-control-allow-origin: *` ✅ CORS enabled
  - `content-type: application/json; charset=utf-8`
- **Body**:
  ```json
  {
    "status": "Webhook is running",
    "message": "Use POST requests to sync data"
  }
  ```

**Analysis**: The webhook is accessible and the `doGet()` function is working correctly. CORS is properly configured with wildcard access.

---

### Test 2: POST Request with JSON Content-Type
**Status**: ❌ FAILED
```bash
curl -X POST "https://script.google.com/.../exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"add","ref":1,"date":"01/08/2025","description":"Test Expense","category":"Food","in":0,"out":50.00,"balance":-50.00}'
```

**Response**:
- **HTTP Status**: 405 Method Not Allowed
- **Error**: "Kan het bestand momenteel niet openen" (Dutch: "Cannot open the file at this time")
- **Allowed Methods**: HEAD, GET (from response headers)

**Analysis**: POST requests are being blocked entirely. The `doPost()` function is not accessible.

---

### Test 3: POST Request with Form-Encoded Data
**Status**: ❌ FAILED
```bash
curl -X POST "https://script.google.com/.../exec" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=add&ref=1&date=01/08/2025&description=Test+Expense&category=Food&in=0&out=50.00&balance=-50.00"
```

**Response**:
- **HTTP Status**: 405 Method Not Allowed
- **Same error as Test 2**

**Analysis**: Different content types don't resolve the issue. The problem is at the deployment level.

---

### Test 4: POST Request with Text/Plain Content-Type
**Status**: ❌ FAILED
```bash
curl -X POST "https://script.google.com/.../exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"add",...}'
```

**Response**:
- **HTTP Status**: 405 Method Not Allowed

**Analysis**: Even text/plain (which often bypasses CORS preflight) is rejected.

---

## Root Cause Analysis

The 405 error combined with `Allow: HEAD, GET` header definitively indicates that:

1. **The Google Apps Script deployment is NOT configured to accept POST requests**
2. The `doPost()` function exists in the code (per GOOGLE_SHEETS_SETUP.md) but is not exposed
3. The deployment settings likely have one of these issues:
   - **Execute as**: Not set to "Me (owner)"
   - **Who has access**: Not set to "Anyone"
   - **Deployment type**: May not be configured as "Web app"
   - **Script needs redeployment**: Changes to script require new deployment

---

## CORS Configuration
**Status**: ✅ Working correctly
- `access-control-allow-origin: *` header is present
- The app can make cross-origin requests to the webhook
- This is not the issue blocking POST requests

---

## Expected vs Actual Behavior

### Expected (from googleSheetsSyncService.js):
The app sends POST requests with this structure:
```javascript
{
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    ref: 1,
    date: '01/08/2025',
    description: 'Test Expense',
    category: 'Food',
    in: 0,
    out: 50.00,
    balance: -50.00
  })
}
```

### Actual:
```
HTTP 405 Method Not Allowed
Allow: HEAD, GET
```

The webhook only allows GET/HEAD methods, completely blocking the sync functionality.

---

## Impact on App Functionality

### What Works:
- ✅ Health checks via GET requests
- ✅ CORS is properly configured
- ✅ Webhook URL is accessible

### What Doesn't Work:
- ❌ Adding expenses to Google Sheets
- ❌ Updating expenses in Google Sheets
- ❌ Batch syncing expenses
- ❌ All POST operations

**Critical**: The entire Google Sheets sync feature is non-functional. Firebase data will be saved correctly, but the Google Sheets integration is broken.

---

## Recommended Fixes

### Solution 1: Redeploy the Apps Script Web App (MOST LIKELY FIX)

1. Open the Google Apps Script project
2. Click **Deploy** → **Manage deployments**
3. Verify the deployment configuration:
   - Type: **Web app**
   - Execute as: **Me** (your-email@gmail.com)
   - Who has access: **Anyone**
4. If settings are incorrect, click the edit icon (✏️) and fix them
5. Click **New deployment** to create a fresh deployment
6. Copy the NEW webhook URL
7. Update the app with the new URL

### Solution 2: Verify the doPost Function

Ensure the Apps Script contains this code:
```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'batch') {
      // Batch sync logic
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
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
```

### Solution 3: Check Authorization

1. In Apps Script, go to **View** → **Executions**
2. Look for any failed execution attempts
3. If you see authorization errors:
   - Run the script manually once to grant permissions
   - Click **Review permissions** and authorize

---

## Testing Recommendations

Once the deployment is fixed, test with:

```bash
# Test single expense sync
curl -X POST "YOUR_NEW_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"add","ref":1,"date":"01/08/2025","description":"Test","category":"Food","in":0,"out":50,"balance":-50}'

# Expected response:
# HTTP 200 OK
# {"success":false,"message":"Unknown action"}
# (Because 'add' action is not implemented, but POST works)

# Test batch sync
curl -X POST "YOUR_NEW_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"batch","expenses":[{"ref":1,"date":"01/08/2025","description":"Test 1","category":"Food","in":0,"out":25,"balance":-25}]}'

# Expected response:
# HTTP 200 OK
# {"success":true,"message":"Batch sync completed","count":1}
```

---

## Conclusion

**The webhook is partially working but critically misconfigured:**

✅ **Working:**
- Webhook is accessible
- GET requests work
- CORS is enabled
- doGet() function responds correctly

❌ **Not Working:**
- POST requests (HTTP 405)
- All data sync operations
- doPost() function is not accessible

**Action Required**: Redeploy the Google Apps Script with correct permissions to enable POST method support.

**Priority**: HIGH - This breaks the entire Google Sheets sync feature

---

## Additional Finding: Script Implementation Gap

### Issue
The current Apps Script (per GOOGLE_SHEETS_SETUP.md) only implements the `batch` action:
```javascript
if (data.action === 'batch') {
  // handles batch sync
}

return ContentService.createTextOutput(JSON.stringify({
  success: false,
  message: 'Unknown action'
})).setMimeType(ContentService.MimeType.JSON);
```

However, the app's `googleSheetsSyncService.js` defines support for three actions:
- `add` - Add a single expense
- `update` - Update a single expense  
- `delete` - Delete a single expense
- `batch` - Batch sync all expenses

### Current Behavior
Based on code analysis of `/Users/mac/Development/Expenses/src/services/expenseService.js`, the app currently **only uses batch sync**. Individual add/update/delete actions are defined but not actively called.

### Recommendation
If you plan to use individual expense syncing in the future, the Apps Script needs to be enhanced to handle 'add', 'update', and 'delete' actions. For now, batch sync is sufficient.

Example enhancement for the Apps Script:
```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'add') {
      const newRow = [
        data.ref,
        data.date,
        data.description,
        data.category,
        data.in || '',
        data.out || '',
        data.balance
      ];
      sheet.appendRow(newRow);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Expense added'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'update') {
      // Find row by ref and update
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.ref) {
          sheet.getRange(i + 1, 1, 1, 7).setValues([[
            data.ref,
            data.date,
            data.description,
            data.category,
            data.in || '',
            data.out || '',
            data.balance
          ]]);
          
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Expense updated'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Expense not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'delete') {
      // Find and delete row by ref
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === data.ref) {
          sheet.deleteRow(i + 1);
          
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Expense deleted'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Expense not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'batch') {
      // Existing batch logic
      // ...
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
```

However, since the app currently only uses batch sync, this enhancement is **optional** and **not required** for the webhook to work with the current codebase.

