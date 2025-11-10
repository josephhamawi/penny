// Script to clear all expenses for a user
const admin = require('firebase-admin');

// Initialize Firebase Admin with application default credentials
admin.initializeApp({
  projectId: 'expenses-64949'
});

const db = admin.firestore();

async function clearExpenses() {
  const userId = 'V5MdmLg66yXuDN1zKiWUupuh1a02';
  console.log(`Clearing all expenses for user: ${userId}`);

  try {
    const expensesRef = db.collection(`users/${userId}/expenses`);
    const snapshot = await expensesRef.get();

    console.log(`Found ${snapshot.size} expenses to delete`);

    if (snapshot.empty) {
      console.log('No expenses to delete');
      process.exit(0);
    }

    // Delete all expenses in batches
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`Successfully deleted ${count} expenses`);

    process.exit(0);
  } catch (error) {
    console.error('Error deleting expenses:', error);
    process.exit(1);
  }
}

clearExpenses();
