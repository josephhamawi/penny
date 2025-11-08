#!/usr/bin/env node
/**
 * Direct Firebase → Google Sheets Sync using Sheets API
 * Bypasses broken webhook completely
 */

const { google } = require('googleapis');
const admin = require('./functions/node_modules/firebase-admin');

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'expenses-64949'
  });
}

const db = admin.firestore();

// Your Google Sheet ID (extracted from the URL)
const SPREADSHEET_ID = '1APozPVqEDu6lmbp6nQxYmw9iM3N0CfAEfw0MlBFsGWw';

// Format date as MM/DD/YYYY
function formatDate(timestamp) {
  const date = timestamp.toDate();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Format currency
function formatCurrency(amount) {
  if (amount === 0) return '';
  return `$${amount.toFixed(2)}`;
}

async function syncToSheets() {
  try {
    console.log('🔍 Getting expenses from Firebase...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} user(s)`);

    // Get all expenses for the first user (you can modify this if needed)
    const userId = usersSnapshot.docs[0].id;
    const userData = usersSnapshot.docs[0].data();
    console.log(`📧 User: ${userData.email || userId}`);

    const expensesSnapshot = await db
      .collection(`users/${userId}/expenses`)
      .orderBy('date', 'asc')
      .orderBy('createdAt', 'asc')
      .get();

    if (expensesSnapshot.empty) {
      console.log('❌ No expenses found');
      return;
    }

    console.log(`📊 Found ${expensesSnapshot.size} expenses`);

    // Build expense rows with balance calculation
    const rows = [['Ref#', 'Date', 'Description', 'Category', 'In', 'Out', 'Balance']];
    let balance = 0;
    let ref = 1;

    expensesSnapshot.forEach((doc) => {
      const data = doc.data();
      balance += (data.inAmount || 0) - (data.outAmount || 0);

      rows.push([
        ref++,
        formatDate(data.date),
        data.description,
        data.category,
        formatCurrency(data.inAmount || 0),
        formatCurrency(data.outAmount || 0),
        formatCurrency(balance)
      ]);
    });

    console.log('🔑 Authenticating with Google Sheets...');

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    console.log('🗑️  Clearing existing data...');

    // Clear the sheet first
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1:Z10000',
    });

    console.log('📤 Writing data to Google Sheets...');

    // Write the new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });

    console.log(`✅ Success! Synced ${rows.length - 1} expenses to Google Sheets`);
    console.log(`📊 View your sheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 7) {
      console.error('\n⚠️  Permission denied. Make sure:');
      console.error('   1. You ran: gcloud auth application-default login');
      console.error('   2. You\'re logged in with the correct Google account');
    }
    console.error(error);
    process.exit(1);
  }
}

syncToSheets();
