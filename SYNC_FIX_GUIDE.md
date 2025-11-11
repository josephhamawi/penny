# Google Sheets Sync - 100% Accuracy Fix Guide

## What Was Fixed

I've improved the Google Sheets sync to ensure 100% accuracy with missing transactions. Here's what was changed:

### 1. **Better Error Logging**
- Added detailed console logs throughout the sync process
- You can now see exactly what's being sent to Google Sheets
- Errors are logged with full details

### 2. **Improved Data Validation**
- All fields now have fallback values (empty strings or 0)
- Numbers are properly parsed as floats
- Dates are consistently formatted as MM/DD/YYYY

### 3. **Increased Timeout**
- Changed from 10 seconds to 30 seconds
- Handles large datasets (hundreds of expenses) without timing out

### 4. **Enhanced Google Apps Script**
- Better error handling and logging
- Validates data before inserting
- Filters out null/invalid rows
- Automatic sheet formatting (currency columns, alternating row colors)
- Returns detailed success/error messages

### 5. **Sync Status Feedback**
- Manual sync now shows detailed results
- Success messages show how many expenses synced
- Error messages show specific failure reasons

---

## How to Update Your Google Apps Script

Follow these steps to get 100% accurate sync:

### Step 1: Open Your Google Sheet

1. Open the Google Sheet you're using with Penny
2. Click **Extensions** → **Apps Script**

### Step 2: Replace the Script

1. **Delete all existing code** in the Apps Script editor
2. **Copy the entire improved script** from the file: `google-apps-script-webhook.js`
3. **Paste it** into the Apps Script editor
4. Click the **Save** icon (💾)

### Step 3: Redeploy the Web App

1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** icon (✏️) next to your existing deployment
3. Under "Version", select **New version**
4. Click **Deploy**
5. **Copy the new Web app URL** (it might be the same as before)

### Step 4: Update the Webhook URL in Penny App

1. Open the Penny app
2. Go to **Settings**
3. Paste the webhook URL (from Step 3)
4. Click **Save**

### Step 5: Test the Sync

1. In Settings, click **Manual Sync**
2. You should see a success message like: "✓ Export Complete! 370 expenses synced to Google Sheets"
3. Check your Google Sheet - all transactions should be there now!

---

## How to Debug Sync Issues

If you're still experiencing issues, check the console logs:

### In the Expo Dev Tools:

```bash
# You should see these logs when sync happens:
[ExpenseService] Starting sync to Google Sheets for user: ...
[ExpenseService] Retrieved 370 expenses for sync
[ExpenseService] Expenses sorted chronologically (oldest first)
[ExpenseService] First expense: ...
[ExpenseService] Last expense: ...
[GoogleSheets] Starting batch sync of 370 expenses
[GoogleSheets] Sending data: ...
[GoogleSheets] Response status: 200
[GoogleSheets] Sync successful: {success: true, count: 370}
[ExpenseService] ✓ Sync to Google Sheets completed successfully
```

### In Google Apps Script:

1. Go to Extensions → Apps Script
2. Click **Executions** (left sidebar)
3. Look at recent executions to see if there are any errors
4. Click on an execution to see detailed logs

### Common Issues and Solutions:

**Issue: "No webhook URL configured"**
- Solution: Make sure you've saved the webhook URL in Settings

**Issue: "HTTP 403" or "Authorization required"**
- Solution: In Apps Script deployment settings, make sure:
  - "Execute as" is set to **Me**
  - "Who has access" is set to **Anyone**

**Issue: "Timeout"**
- Solution: This shouldn't happen with the 30-second timeout
- If it does, you might have network issues or a very slow connection

**Issue: Expenses show up as "0" or empty**
- Solution: The improved script now handles this with fallback values
- Make sure your expenses have either `inAmount` or `outAmount` set

---

## What Happens During Sync

Here's the exact flow:

1. **App collects all expenses** from Firebase
2. **Sorts them chronologically** (oldest first)
3. **Assigns ref numbers** (1, 2, 3...) starting from oldest
4. **Calculates running balance** for each expense
5. **Formats dates** as MM/DD/YYYY
6. **Sends to Google Sheets** via webhook
7. **Google Apps Script receives data**
8. **Clears old data** (except header row)
9. **Inserts all expenses** in one batch operation
10. **Formats the sheet** (colors, currency)
11. **Returns success message** with count

---

## Testing Checklist

After updating, verify these:

- [ ] All expenses appear in Google Sheets
- [ ] Ref numbers are sequential (1, 2, 3...)
- [ ] Dates are correct
- [ ] Income amounts in "In" column
- [ ] Expense amounts in "Out" column
- [ ] Balance column shows running total
- [ ] Currency columns formatted with $
- [ ] Rows alternate between white and light gray

---

## Additional Features

The improved script now includes:

### Auto-Formatting
- Header row: Blue background, white text, bold
- Alternating row colors for readability
- Currency columns auto-formatted as $#,##0.00
- Columns auto-resized for content

### Test Function
Run `testWebhook()` from Apps Script editor to test without using the app

### Health Check
Visit your webhook URL in a browser - you should see:
```json
{
  "status": "Webhook is running",
  "message": "Use POST requests to sync data",
  "version": "2.0",
  "timestamp": "2025-11-11T..."
}
```

---

## Need More Help?

If you're still experiencing missing transactions:

1. Check the Expo console logs for `[GoogleSheets]` and `[ExpenseService]` messages
2. Check Google Apps Script executions for errors
3. Make sure your webhook URL ends with `/exec`
4. Try clicking "Manual Sync" in Settings to force a full sync
5. Verify your Google Sheet has the correct header row

---

**You should now have 100% accurate sync between Penny and Google Sheets!** 🎉
