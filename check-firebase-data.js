const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserData() {
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`\n=== Total Users: ${usersSnapshot.size} ===\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`User: ${userId}`);
      console.log(`Email: ${userData.email}`);

      // Check expenses
      const expensesSnapshot = await db.collection(`users/${userId}/expenses`).get();
      console.log(`Expenses count: ${expensesSnapshot.size}`);

      if (expensesSnapshot.size > 0) {
        console.log('\nSample expenses:');
        expensesSnapshot.docs.slice(0, 3).forEach(doc => {
          const data = doc.data();
          const dateStr = data.date && data.date.toDate ? data.date.toDate().toISOString().split('T')[0] : 'N/A';
          console.log(`  - ${dateStr} | ${data.description} | In: $${data.inAmount} | Out: $${data.outAmount}`);
        });
      }

      // Check shared databases
      const sharedDbsSnapshot = await db.collection('sharedDatabases')
        .where('members', 'array-contains', userId)
        .get();

      if (sharedDbsSnapshot.size > 0) {
        console.log(`\nShared databases: ${sharedDbsSnapshot.size}`);
        for (const sharedDoc of sharedDbsSnapshot.docs) {
          const sharedId = sharedDoc.id;
          const sharedExpenses = await db.collection(`users/${sharedId}/expenses`).get();
          console.log(`  Shared DB ${sharedId}: ${sharedExpenses.size} expenses`);
        }
      }

      console.log('\n---\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserData();
