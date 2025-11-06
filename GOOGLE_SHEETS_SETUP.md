# Google Sheets Auto-Sync Setup Guide

This guide will help you set up automatic two-way sync between your Expense Monitor app and Google Sheets.

## Prerequisites
- A Google account
- A Google Sheet with expense data or a new blank sheet

## Setup Instructions

### Step 1: Prepare Your Google Sheet

1. Open your Google Sheet or create a new one
2. Make sure the first row contains these headers (in this order):
   - Ref#
   - Date
   - Description
   - Category
   - In
   - Out
   - Balance

### Step 2: Create Apps Script Webhook

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy and paste the following script:

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

### Step 3: Deploy the Web App

1. Click the **Deploy** button (top right)
2. Select **New deployment**
3. Click the gear icon ⚙️ next to "Select type"
4. Choose **Web app**
5. Configure the deployment:
   - **Description**: "Expense Monitor Sync" (or any name you prefer)
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
6. Click **Deploy**
7. Review and authorize permissions when prompted:
   - Click **Review permissions**
   - Select your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
8. **Copy the Web app URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### Step 4: Configure the App

1. Open the Expense Monitor app
2. Go to the **Settings** tab
3. Tap **View Setup Instructions** to review this guide
4. Paste your Web app URL in the **Webhook URL** field
5. Tap **Save**

## How It Works

Once configured, the app will automatically:
- **Add Expense**: Syncs to Google Sheets immediately after saving to Firebase
- **Edit Expense**: Updates the entire sheet with recalculated balances and ref numbers
- **Delete Expense**: Removes the entry and updates the sheet

The sync happens in the background and won't block your app usage. If sync fails (e.g., no internet), the data remains safely stored in Firebase.

## Troubleshooting

### Sync not working?
1. Verify the webhook URL is correct (should end with `/exec`)
2. Make sure you selected "Anyone" for "Who has access" in deployment settings
3. Check that your Google Sheet has the correct headers in the first row
4. Try redeploying the Apps Script web app

### Getting "Authorization required" error?
1. Go back to Apps Script
2. Click **Deploy** → **Manage deployments**
3. Click the edit icon ✏️
4. Make sure "Execute as" is set to **Me**
5. Make sure "Who has access" is set to **Anyone**
6. Save and get the new URL

### Data not appearing in Google Sheets?
1. Make sure your sheet has headers in row 1
2. Check the Apps Script execution logs (View → Executions)
3. Try adding a test expense to trigger the sync
4. Verify your internet connection

## Security Note

The webhook is publicly accessible but requires the exact URL to use. Only POST requests with valid expense data will successfully update your sheet. The Apps Script runs with your permissions, so only you can see and modify the sheet data.

## Need Help?

If you encounter any issues, you can:
1. Clear the webhook URL in Settings and reconfigure
2. Check the Apps Script execution logs for errors
3. Ensure your Google Sheet permissions allow the script to run

---

Happy tracking! 📊💰
