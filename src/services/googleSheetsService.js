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

  // Parse date - support various formats with robust error handling
  let parsedDate;

  try {
    if (!date || date.trim() === '') {
      // No date provided, use current date
      parsedDate = new Date();
    } else if (date.includes('/')) {
      const parts = date.split('/');
      // Assume mm/dd/YYYY format (common in Google Sheets)
      if (parts.length === 3) {
        let month = parseInt(parts[0], 10);
        let day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);

        // Handle 2-digit year
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }

        // Validate ranges
        if (month < 1 || month > 12) {
          throw new Error(`Invalid month: ${month}`);
        }
        if (day < 1 || day > 31) {
          throw new Error(`Invalid day: ${day}`);
        }
        if (year < 1900 || year > 2100) {
          throw new Error(`Invalid year: ${year}`);
        }

        // Create date in YYYY-MM-DD format
        parsedDate = new Date(year, month - 1, day);

        // Verify date was created correctly (handles invalid dates like Feb 31)
        if (parsedDate.getFullYear() !== year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day) {
          throw new Error('Invalid date combination');
        }
      } else {
        throw new Error('Invalid date format');
      }
    } else if (date.includes('-')) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date string');
      }
    } else {
      // Try parsing as-is
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Unparseable date format');
      }
    }

    // Final validation
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      throw new Error('Date parse resulted in invalid date');
    }
  } catch (error) {
    console.warn(`Date parsing failed for "${date}":`, error.message, '- using current date');
    parsedDate = new Date();
  }

  return {
    date: parsedDate.toISOString().split('T')[0],
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
 * @returns {Promise<number>} - Number of expenses imported
 */
export const importFromGoogleSheets = async (url, userId) => {
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

    // Import each row as an expense
    let importedCount = 0;
    let skippedCount = 0;
    for (const row of rows) {
      try {
        const expenseData = rowToExpense(row);

        // Validate that we have valid data
        if (expenseData.inAmount > 0 || expenseData.outAmount > 0) {
          await addExpense(userId, expenseData);
          importedCount++;
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

    console.log(`Import complete: ${importedCount} imported, ${skippedCount} skipped`)

    return importedCount;
  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    throw error;
  }
};
