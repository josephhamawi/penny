#!/usr/bin/env node
/**
 * Direct Firebase → Google Sheets Sync
 * Bypasses broken webhook, writes directly to sheets
 */

const admin = require('./functions/node_modules/firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin with project ID
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'expenses-64949'
  });
}

const db = admin.firestore();

// Your webhook URL
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwqknIV5HvQ3LScyR19MJPa1BL9ZJ_PReBFzQpt_pxZFryWdv3WMLRnefXHajP0K0zl1g/exec';

// Format date as MM/DD/YYYY
function formatDate(timestamp) {
  const date = timestamp.toDate();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Sync all expenses to Google Sheets
async function syncAllExpenses() {
  try {
    console.log('🔍 Finding user data...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} user(s)`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`\n📧 User: ${userData.email || userId}`);

      // Get all expenses for this user
      const expensesSnapshot = await db
        .collection(`users/${userId}/expenses`)
        .orderBy('date', 'asc')
        .orderBy('createdAt', 'asc')
        .get();

      if (expensesSnapshot.empty) {
        console.log('   No expenses found for this user');
        continue;
      }

      console.log(`   📊 Found ${expensesSnapshot.size} expenses`);
      console.log('   🚀 Syncing to Google Sheets...');

      // Build expenses array with balance calculation
      const expenses = [];
      let balance = 0;
      let ref = 1;

      expensesSnapshot.forEach((doc) => {
        const data = doc.data();
        balance += (data.inAmount || 0) - (data.outAmount || 0);

        expenses.push({
          ref: ref++,
          date: formatDate(data.date),
          description: data.description,
          category: data.category,
          in: data.inAmount || 0,
          out: data.outAmount || 0,
          balance: balance
        });
      });

      // Send batch request to webhook
      console.log('   📤 Sending batch sync request...');

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'batch',
          expenses: expenses
        }),
        redirect: 'follow' // Follow redirects
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Sync successful!');
        console.log(`   📈 Synced ${expenses.length} expenses to Google Sheets`);
      } else {
        console.log(`   ❌ Sync failed: HTTP ${response.status}`);
        const text = await response.text();
        console.log('   Response:', text.substring(0, 200));
      }
    }

    console.log('\n✨ Sync complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the sync
syncAllExpenses();
