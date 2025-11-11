/**
 * Improved Google Apps Script Webhook for Penny Expense Tracker
 *
 * This script handles syncing expense data from the Penny app to Google Sheets.
 * It's more robust with better error handling and logging.
 *
 * SETUP INSTRUCTIONS:
 * 1. In your Google Sheet, go to Extensions → Apps Script
 * 2. Delete any existing code
 * 3. Paste this entire script
 * 4. Click Deploy → New deployment → Web app
 * 5. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 6. Copy the web app URL and paste it in the Penny app settings
 */

function doPost(e) {
  try {
    // Log incoming request for debugging
    Logger.log('Received POST request');

    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    Logger.log('Parsed data action: ' + data.action);

    if (data.action === 'batch') {
      // Validate that we have expenses array
      if (!data.expenses || !Array.isArray(data.expenses)) {
        throw new Error('Invalid data: expenses array is missing or not an array');
      }

      Logger.log('Processing batch sync of ' + data.expenses.length + ' expenses');

      // Clear existing data (except header row)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        Logger.log('Clearing rows 2 to ' + lastRow);
        sheet.deleteRows(2, lastRow - 1);
      }

      // Prepare rows for batch insert
      const rows = data.expenses.map(expense => {
        // Validate each expense has required fields
        if (!expense) {
          Logger.log('Warning: Null expense found, skipping');
          return null;
        }

        return [
          expense.ref || '',
          expense.date || '',
          expense.description || '',
          expense.category || '',
          expense.in || 0,
          expense.out || 0,
          expense.balance || 0
        ];
      }).filter(row => row !== null); // Remove any null rows

      // Insert all rows at once for better performance
      if (rows.length > 0) {
        Logger.log('Inserting ' + rows.length + ' rows starting at row 2');
        sheet.getRange(2, 1, rows.length, 7).setValues(rows);

        // Format the sheet for better readability
        formatSheet(sheet, rows.length);

        Logger.log('Batch sync completed successfully');

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Batch sync completed',
          count: rows.length,
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        Logger.log('No valid rows to insert');
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'No data to sync',
          count: 0,
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Unknown action
    Logger.log('Unknown action: ' + data.action);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action: ' + data.action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log error for debugging
    Logger.log('Error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Format the sheet for better readability
 */
function formatSheet(sheet, dataRows) {
  try {
    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4A90E2');
    headerRange.setFontColor('#FFFFFF');

    // Format data rows
    if (dataRows > 0) {
      const dataRange = sheet.getRange(2, 1, dataRows, 7);

      // Alternate row colors for better readability
      for (let i = 0; i < dataRows; i++) {
        const rowRange = sheet.getRange(2 + i, 1, 1, 7);
        if (i % 2 === 0) {
          rowRange.setBackground('#F8F9FA');
        } else {
          rowRange.setBackground('#FFFFFF');
        }
      }

      // Format currency columns (In, Out, Balance)
      sheet.getRange(2, 5, dataRows, 1).setNumberFormat('$#,##0.00'); // In column
      sheet.getRange(2, 6, dataRows, 1).setNumberFormat('$#,##0.00'); // Out column
      sheet.getRange(2, 7, dataRows, 1).setNumberFormat('$#,##0.00'); // Balance column
    }

    // Auto-resize columns for better visibility
    sheet.autoResizeColumns(1, 7);

    Logger.log('Sheet formatting completed');
  } catch (error) {
    Logger.log('Formatting error (non-critical): ' + error.toString());
    // Don't throw - formatting failures shouldn't break sync
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'Webhook is running',
    message: 'Use POST requests to sync data',
    version: '2.0',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify the script works
 * Run this from Apps Script editor to test
 */
function testWebhook() {
  const testData = {
    action: 'batch',
    expenses: [
      {
        ref: 1,
        date: '01/01/2024',
        description: 'Test Expense',
        category: 'Food',
        in: 0,
        out: 50.00,
        balance: -50.00
      },
      {
        ref: 2,
        date: '01/02/2024',
        description: 'Test Income',
        category: 'Salary',
        in: 1000.00,
        out: 0,
        balance: 950.00
      }
    ]
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
