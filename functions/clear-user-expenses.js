/**
 * Script to clear all expenses for a specific user
 * Usage: cd functions && node clear-user-expenses.js <email>
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearUserExpenses(email) {
  try {
    console.log(`🔍 Looking up user with email: ${email}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    console.log(`✓ Found user: ${userRecord.displayName || 'No name'} (${userId})`);

    // Get user's database ID (could be their own UID or a shared database)
    console.log(`🔍 Checking for shared database...`);
    const userDoc = await db.collection('users').doc(userId).get();
    const databaseId = userDoc.exists && userDoc.data().databaseId
      ? userDoc.data().databaseId
      : userId;

    console.log(`📊 Database ID: ${databaseId}`);

    // Get all expenses for this database
    const expensesRef = db.collection('expenses').doc(databaseId).collection('userExpenses');
    const snapshot = await expensesRef.get();

    if (snapshot.empty) {
      console.log('✓ No expenses found. Account is already clean.');
      return;
    }

    console.log(`🗑️  Found ${snapshot.size} expenses. Deleting...`);

    // Delete in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deleted = 0;

    while (true) {
      const batch = db.batch();
      const docs = await expensesRef.limit(batchSize).get();

      if (docs.empty) break;

      docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deleted += docs.size;
      console.log(`  ✓ Deleted ${deleted} expenses...`);
    }

    console.log(`\n✅ Successfully deleted ${deleted} expenses for ${email}`);
    console.log(`🔄 The account is now clean and ready for fresh data import.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('Usage: node clear-user-expenses.js <email>');
  process.exit(1);
}

// Run the script
clearUserExpenses(email)
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
