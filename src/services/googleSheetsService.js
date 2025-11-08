import { addExpense } from './expenseService';

/**
 * Parse Google Sheets URL to get the spreadsheet ID and GID
 * Supports various Google Sheets URL formats
 */
const parseGoogleSheetsUrl = (url) => {
  try {
    // Extract spreadsheet ID
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!idMatch) {
      throw new Error('Invalid Google Sheets URL');
    }
    const spreadsheetId = idMatch[1];

    // Extract GID (sheet ID) if present, default to 0
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    return { spreadsheetId, gid };
  } catch (error) {
    throw new Error('Invalid Google Sheets URL format');
  }
};

/**
 * Parse CSV text into array of objects
 */
const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Get headers from first row
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, ''));
};

/**
 * Parse date flexibly - handles any Excel/Google Sheets date format
 * Strategies: Excel serial numbers, US/EU formats, ISO formats
 * Never throws errors - falls back to 11/11/11 for invalid dates
 */
const parseFlexibleDate = (dateValue) => {
  // If no date provided or invalid date marker (########), use default date
  if (!dateValue || dateValue.toString().trim() === '' || dateValue.toString().includes('#')) {
    console.log(`[Import] Invalid or missing date detected: "${dateValue}" → using default 11/11/11`);
    return new Date(2011, 10, 11); // November 11, 2011
  }

  const dateStr = dateValue.toString().trim();

  // Strategy 1: Try as Excel serial number (days since 1899-12-30)
  const asNumber = parseFloat(dateStr);
  if (!isNaN(asNumber) && asNumber > 0 && asNumber < 100000) {
    try {
      // Excel date serial number (e.g., 44927 = 2023-01-01)
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + asNumber * 86400000);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        return date;
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 2: Try slash-separated formats (mm/dd/yyyy, dd/mm/yyyy, yyyy/mm/dd)
  if (dateStr.includes('/')) {
    try {
      const parts = dateStr.split('/').map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        let [a, b, c] = parts;

        // Handle 2-digit year in any position
        if (c < 100) {
          c = c < 50 ? 2000 + c : 1900 + c;
        }
        if (a < 100 && a > 31) {
          a = a < 50 ? 2000 + a : 1900 + a;
        }

        // Try mm/dd/yyyy (US format) - most common in Excel
        if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
          const usDate = new Date(c, a - 1, b);
          if (!isNaN(usDate.getTime()) && usDate.getMonth() === a - 1) {
            return usDate;
          }
        }

        // Try dd/mm/yyyy (EU format)
        if (b >= 1 && b <= 12 && a >= 1 && a <= 31) {
          const euDate = new Date(c, b - 1, a);
          if (!isNaN(euDate.getTime()) && euDate.getMonth() === b - 1) {
            return euDate;
          }
        }

        // Try yyyy/mm/dd (ISO-like)
        if (a > 1000 && b >= 1 && b <= 12 && c >= 1 && c <= 31) {
          const isoDate = new Date(a, b - 1, c);
          if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() === a) {
            return isoDate;
          }
        }
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 3: Try dash-separated formats (yyyy-mm-dd, dd-mm-yyyy)
  if (dateStr.includes('-')) {
    try {
      // Try ISO format first (yyyy-mm-dd)
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime()) && dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
        return isoDate;
      }

      // Try parsing dash-separated values
      const parts = dateStr.split('-').map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        let [a, b, c] = parts;

        if (a > 1000) {
          // yyyy-mm-dd
          const date = new Date(a, b - 1, c);
          if (!isNaN(date.getTime())) return date;
        } else if (c > 1000) {
          // dd-mm-yyyy
          const date = new Date(c, b - 1, a);
          if (!isNaN(date.getTime())) return date;
        }
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 4: Try dot-separated format (dd.mm.yyyy - common in Europe)
  if (dateStr.includes('.')) {
    try {
      const parts = dateStr.split('.').map(p => parseInt(p, 10));
      if (parts.length === 3 && parts.every(p => !isNaN(p))) {
        let [day, month, year] = parts;
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (e) {
      // Continue to next strategy
    }
  }

  // Strategy 5: Try Date.parse() as last resort
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Continue to fallback
  }

  // Strategy 6: Fallback to default date 11/11/11 (never fail)
  console.log(`[Import] Using default date 11/11/11 for unrecognized format: "${dateStr}"`);
  return new Date(2011, 10, 11); // November 11, 2011
};

/**
 * Convert imported row to expense format
 */
const rowToExpense = (row) => {
  // Support various column name variations
  const getColumnValue = (possibleNames) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined) {
        return row[name];
      }
    }
    return '';
  };

  const date = getColumnValue(['Date', 'date', 'DATE']);
  const description = getColumnValue(['Description', 'description', 'DESCRIPTION', 'Desc']);
  const category = getColumnValue(['Category', 'category', 'CATEGORY', 'Cat']);
  let inAmount = getColumnValue(['In', 'in', 'IN', 'Income', 'income']);
  let outAmount = getColumnValue(['Out', 'out', 'OUT', 'Expense', 'expense']);

  // Remove $ signs and convert to numbers
  inAmount = inAmount ? parseFloat(inAmount.toString().replace(/[$,]/g, '')) : 0;
  outAmount = outAmount ? parseFloat(outAmount.toString().replace(/[$,]/g, '')) : 0;

  // Parse date using flexible parser
  const parsedDate = parseFlexibleDate(date);
  const dateString = parsedDate.toISOString().split('T')[0];

  console.log(`[Import] Parsed date "${date}" → ${dateString} (Date object: ${parsedDate})`);

  return {
    date: dateString,
    description: description || 'Imported expense',
    category: category || 'Other',
    inAmount: inAmount || 0,
    outAmount: outAmount || 0
  };
};

/**
 * Import expenses from Google Sheets
 * @param {string} url - Google Sheets URL
 * @param {string} userId - Firebase user ID
 * @param {function} onProgress - Progress callback (current, total)
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<number>} - Number of expenses imported
 */
export const importFromGoogleSheets = async (url, userId, onProgress = null, signal = null) => {
  try {
    // Parse URL to get spreadsheet ID and GID
    const { spreadsheetId, gid } = parseGoogleSheetsUrl(url);

    // Construct CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    // Fetch the CSV data
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Google Sheet. Make sure the sheet is shared publicly with "Anyone with the link can view".');
    }

    const csvText = await response.text();

    // Parse CSV
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      throw new Error('No data found in the sheet');
    }

    // Import each row as an expense (skip auto-sync for performance)
    let importedCount = 0;
    let skippedCount = 0;
    console.log(`[Import] Starting batch import of ${rows.length} rows...`);

    // Report initial progress
    if (onProgress) {
      onProgress(0, rows.length);
    }

    for (let i = 0; i < rows.length; i++) {
      // Check if import was cancelled
      if (signal && signal.aborted) {
        console.log('[Import] Import cancelled by user');
        const error = new Error('Import cancelled');
        error.name = 'AbortError';
        throw error;
      }

      const row = rows[i];
      try {
        const expenseData = rowToExpense(row);

        // Validate that we have valid data
        if (expenseData.inAmount > 0 || expenseData.outAmount > 0) {
          // Skip sync during bulk import for performance
          await addExpense(expenseData, { skipSync: true });
          importedCount++;

          // Report progress
          if (onProgress) {
            onProgress(importedCount, rows.length);
          }

          // Log progress every 50 rows
          if (importedCount % 50 === 0) {
            console.log(`[Import] Progress: ${importedCount}/${rows.length} expenses imported`);
          }
        } else {
          skippedCount++;
          console.log('Skipped row with no amounts:', row);
        }
      } catch (error) {
        console.error('Error importing row:', error.message);
        console.error('Row data:', JSON.stringify(row));
        skippedCount++;
        // Continue with next row
      }
    }

    console.log(`[Import] Batch import complete: ${importedCount} imported, ${skippedCount} skipped`);
    console.log(`[Import] Final sync to Google Sheets skipped (no webhook configured yet)`);

    return importedCount;
  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    throw error;
  }
};
