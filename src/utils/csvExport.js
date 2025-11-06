import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export const exportToExcel = async (expenses) => {
  try {
    // Prepare data for Excel
    const data = expenses.map(expense => ({
      'Ref#': expense.ref,
      'Date': expense.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      'Description': expense.description,
      'Category': expense.category,
      'In': expense.inAmount > 0 ? `$${expense.inAmount.toFixed(2)}` : '-',
      'Out': expense.outAmount > 0 ? `$${expense.outAmount.toFixed(2)}` : '-',
      'Balance': `$${expense.balance.toFixed(2)}`
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // Ref#
      { wch: 12 }, // Date
      { wch: 30 }, // Description
      { wch: 20 }, // Category
      { wch: 12 }, // In
      { wch: 12 }, // Out
      { wch: 12 }  // Balance
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Save to file
    const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Expenses',
        UTI: 'com.microsoft.excel.xlsx'
      });
    } else {
      alert('Sharing is not available on this device');
    }

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const exportToCSV = async (expenses) => {
  try {
    // Create CSV header
    const header = 'Ref#,Date,Description,Category,In,Out,Balance\n';

    // Create CSV rows
    const rows = expenses.map(expense => {
      const date = expense.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const description = `"${expense.description.replace(/"/g, '""')}"`;
      const inAmt = expense.inAmount > 0 ? `$${expense.inAmount.toFixed(2)}` : '-';
      const outAmt = expense.outAmount > 0 ? `$${expense.outAmount.toFixed(2)}` : '-';
      return `${expense.ref},${date},${description},${expense.category},${inAmt},${outAmt},$${expense.balance.toFixed(2)}`;
    }).join('\n');

    const csv = header + rows;

    // Save to file
    const fileName = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      alert('Sharing is not available on this device');
    }

    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};
