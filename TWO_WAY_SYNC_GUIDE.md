# Two-Way Sync Setup Guide - Penny App ↔ Google Sheets

## Overview

This guide will help you set up **automatic two-way synchronization** between Penny and Google Sheets. Once configured, any changes you make in the app will instantly sync to your sheet, and vice versa!

### What You'll Get:
- ✅ **App → Sheet**: Add/edit/delete expenses in Penny → automatically updates Google Sheets
- ✅ **Sheet → App**: Edit expenses in Google Sheets → automatically imports to Penny (checks every 60 seconds)
- ✅ **Initial Import**: Import all existing expenses from your Google Sheet
- ✅ **100% Accuracy**: All transactions sync reliably with detailed logging

---

## Setup Steps

### Step 1: Prepare Your Google Sheet

1. **Create or open your Google Sheet**
2. **Make sure it has these exact column headers in row 1:**
   ```
   Ref#  |  Date  |  Description  |  Category  |  In  |  Out  |  Balance
   ```

3. **Important**:
   - Column names must match exactly (case-sensitive)
   - Keep the header row (row 1)
   - Make the sheet publicly accessible: **Share** → **Anyone with the link can view**

### Step 2: Install the Improved Google Apps Script

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Open the file `google-apps-script-webhook.js` in your project
4. Copy ALL the code and paste it into Apps Script
5. Click **Save** (💾 icon)

### Step 3: Deploy the Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Penny Two-Way Sync"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
5. Click **Deploy**
6. Authorize permissions when prompted:
   - Click **Review permissions**
   - Select your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. **Copy the Web app URL** - save it for Step 4

### Step 4: Configure Penny App

1. Open the Penny app
2. Go to **Settings** (bottom tab)
3. Scroll to **Google Sheets Sync**
4. Tap to expand the section
5. **Enter BOTH URLs** (separated by space or on separate lines):
   - Your Google Sheet URL (for importing)
   - Your Apps Script webhook URL (for exporting)

   Example:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0 https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

6. Click **Save**

### Step 5: Initial Two-Way Sync

1. In the Google Sheets Sync section, click **"Sync Now (Import & Export)"**
2. Wait for the sync to complete
3. You'll see:
   - "📥 Importing..." (reading from your sheet)
   - "📤 Exporting..." (writing back to your sheet)
   - "✓ Two-Way Sync Complete!"
   - "🔄 Auto-Sync Enabled"

**Done!** Your app and sheet are now in perfect sync! 🎉

---

## How It Works

### App → Sheet (Instant)
When you **add, edit, or delete** an expense in Penny:
1. Data is saved to Firebase
2. Automatically triggers sync to Google Sheets
3. All expenses are sent to your sheet (batch update)
4. Sheet is formatted with colors, currency, etc.

### Sheet → App (Every 60 Seconds)
When you **edit** your Google Sheet:
1. Penny checks your sheet every 60 seconds
2. Detects changes using content hash
3. Imports updated data to Firebase
4. Your app refreshes with new data

---

## Using Two-Way Sync

### Adding Expenses

**In Penny App:**
- Add expense normally
- ✓ Automatically syncs to Google Sheets

**In Google Sheets:**
- Add a new row with data
- ⏱ Syncs to app within 60 seconds
- Make sure to include: Date, Description, Category, and either In or Out amount

### Editing Expenses

**In Penny App:**
- Edit any expense
- ✓ Sheet updates immediately

**In Google Sheets:**
- Edit any cell
- ⏱ Changes appear in app within 60 seconds
- **Note**: Ref# and Balance are recalculated by the app

### Deleting Expenses

**In Penny App:**
- Delete any expense
- ✓ Removed from sheet immediately
- Ref# and balances recalculated

**In Google Sheets:**
- Delete a row
- ⏱ Removed from app within 60 seconds

---

## Data Format Reference

### Date Format
- **Google Sheets**: Any format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, Excel serial numbers)
- **Penny App**: Automatically converted and stored properly

### Amount Format
- **In column**: Income amounts (positive numbers, e.g., 5000)
- **Out column**: Expense amounts (positive numbers, e.g., 50.00)
- Can include $ signs and commas - they're automatically removed

### Categories
Use these categories (or the app will default to "Other"):
- Food
- Transportation
- Shopping
- Entertainment
- Bills
- Healthcare
- Travel
- Education
- Other
- Salary
- Freelance
- Investment
- Gift
- Refund

---

## Troubleshooting

### Sync not working?

**Check the Console Logs:**
```
[SheetPolling] Starting sheet polling (every 60 seconds)
[SheetPolling] Checking Google Sheets for changes...
[SheetPolling] No changes detected in Google Sheets
```

Or if changes detected:
```
[SheetPolling] Changes detected! Importing from Google Sheets...
[SheetPolling] ✓ Imported 5 expenses from Google Sheets
```

### Common Issues:

**Issue: "No changes detected" but I made changes**
- **Solution**: Wait 60 seconds for the next poll cycle
- Or manually click "Sync Now (Import & Export)"

**Issue: "Failed to fetch sheet data"**
- **Solution**: Make sure sheet is shared publicly ("Anyone with the link can view")
- Check your internet connection

**Issue: Changes in sheet don't appear in app**
- **Solution**:
  - Check if polling is enabled (should auto-enable after first sync)
  - Verify the Sheet URL (not webhook URL) is configured
  - Check console logs for errors

**Issue: Changes in app don't appear in sheet**
- **Solution**:
  - Verify the webhook URL (Apps Script URL) is configured
  - Check Apps Script execution logs for errors
  - Make sure deployment is set to "Anyone" access

### Viewing Logs

**In Penny App:**
- Check Expo Dev Tools console for `[SheetPolling]`, `[GoogleSheets]`, and `[ExpenseService]` logs

**In Google Apps Script:**
- Open Apps Script editor
- Click **Executions** (left sidebar)
- View recent execution logs

---

## Advanced Configuration

### Changing Polling Interval

Edit `src/services/sheetPollingService.js`:
```javascript
const POLLING_INTERVAL = 60000; // Change to 30000 for 30 seconds
```

### Disabling Auto-Sync

You can disable automatic sheet-to-app sync:
```javascript
import { disablePolling } from '../services/sheetPollingService';
await disablePolling();
```

### Manual Force Sync

Trigger a manual check immediately:
```javascript
import { startSheetPolling } from '../services/sheetPollingService';
await startSheetPolling();
```

---

## Data Privacy & Security

- **Google Sheet**: Controlled by you, hosted on Google Drive
- **Apps Script**: Runs with your Google account permissions
- **Penny App**: Data stored in Firebase, synced via HTTPS
- **Webhook URL**: Public but requires exact URL to access
- **No Third Parties**: Data flows directly between your app and your sheet

---

## Testing Checklist

After setup, verify these work:

**App → Sheet:**
- [ ] Add expense in app → appears in sheet
- [ ] Edit expense in app → updates in sheet
- [ ] Delete expense in app → removed from sheet
- [ ] Ref# sequential and correct
- [ ] Balance calculated correctly

**Sheet → App:**
- [ ] Add row in sheet → appears in app (within 60 seconds)
- [ ] Edit cell in sheet → updates in app
- [ ] Delete row in sheet → removed from app
- [ ] Changes logged in console

**Formatting:**
- [ ] Currency columns formatted as $#,##0.00
- [ ] Dates formatted correctly
- [ ] Rows have alternating colors
- [ ] Headers are blue with white text

---

## Tips for Best Results

1. **Use the Sheet URL AND Webhook URL together** for full two-way sync
2. **Wait 60 seconds** after editing the sheet to see changes in app
3. **Check console logs** if something doesn't work
4. **Don't modify Ref# or Balance columns** in the sheet - they're auto-calculated
5. **Keep header row intact** - don't delete or modify row 1
6. **Use consistent date formats** - the app handles most formats automatically

---

## Support

If you're still having issues:
1. Check all URLs are correct and properly formatted
2. Verify Google Sheet permissions (publicly viewable)
3. Review console logs for specific error messages
4. Try clicking "Sync Now" to force a fresh sync
5. Make sure you followed all setup steps exactly

**Your Penny app and Google Sheet are now perfectly synced!** 🚀💰

---

## What's Next?

- Share your Google Sheet with family members for collaborative budgeting
- Use Google Sheets formulas to create custom reports
- Export to other tools (Excel, CSV, etc.)
- Create charts and visualizations
- Set up Google Sheets notifications for budget alerts

Happy tracking! 📊✨
