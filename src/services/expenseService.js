import firebase from 'firebase/compat/app';
import { db, auth } from '../config/firebase';
import { syncExpenseToSheets, batchSyncToSheets } from './googleSheetsSyncService';
import { getUserDatabaseId } from './invitationService';

// Helper to get user's expenses collection
// Now supports shared databases - uses shared database ID if user is part of one
const getUserExpensesCollection = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.collection(`users/${userId}/expenses`);
};

// Helper to get database ID (shared or personal)
const getDatabaseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await getUserDatabaseId(user.uid);
};

// Add a new expense record
export const addExpense = async (expenseData, options = {}) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    console.log('[addExpense] Received date:', expenseData.date, 'type:', typeof expenseData.date);
    const dateObj = new Date(expenseData.date);
    console.log('[addExpense] Date object:', dateObj, 'valid:', !isNaN(dateObj.getTime()));

    const docRef = await getUserExpensesCollection(databaseId).add({
      userId: user.uid,
      date: firebase.firestore.Timestamp.fromDate(dateObj),
      description: expenseData.description,
      category: expenseData.category,
      inAmount: parseFloat(expenseData.inAmount) || 0,
      outAmount: parseFloat(expenseData.outAmount) || 0,
      createdAt: firebase.firestore.Timestamp.now()
    });

    // Sync disabled - Import only mode
    // if (!options.skipSync) {
    //   await syncAllExpensesToSheets(databaseId);
    // }

    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Subscribe to real-time expense updates
// userId parameter is resolved to shared database ID if user is in a shared database
export const subscribeToExpenses = (userId, callback) => {
  console.log('[ExpenseService] subscribeToExpenses called with userId:', userId);
  if (!userId) {
    console.error('[ExpenseService] User ID is required');
    callback([]);
    return () => {};
  }

  // Track unsubscribe function
  let unsubscribe = null;
  let hasCalledCallback = false;

  // Set up a timeout to prevent infinite loading
  const timeoutId = setTimeout(() => {
    if (!hasCalledCallback) {
      console.warn('[ExpenseService] Subscription timeout - calling callback with empty array');
      hasCalledCallback = true;
      callback([]);
    }
  }, 10000); // 10 second timeout

  // Resolve to database ID (shared or personal)
  getUserDatabaseId(userId)
    .then((databaseId) => {
      console.log('[ExpenseService] Database ID resolved to:', databaseId);

      unsubscribe = getUserExpensesCollection(databaseId)
        .orderBy('date', 'asc')
        .orderBy('createdAt', 'asc')
        .onSnapshot(
          (querySnapshot) => {
            // Clear timeout on successful response
            clearTimeout(timeoutId);
            hasCalledCallback = true;

            const expenses = [];
            let balance = 0;

            // Process expenses
            const tempExpenses = [];
            querySnapshot.forEach((doc) => {
              tempExpenses.push({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date.toDate()
              });
            });

            // Sort by date (oldest first) for balance calculation and ref# assignment
            // This ensures ref# 1 is the earliest expense, increasing chronologically
            // If dates are equal, sort by createdAt timestamp
            tempExpenses.sort((a, b) => {
              const dateCompare = a.date - b.date;
              if (dateCompare !== 0) return dateCompare;
              // If dates are the same, sort by creation time
              return a.createdAt.seconds - b.createdAt.seconds;
            });

            // Calculate balance and assign ref numbers
            tempExpenses.forEach((expense, index) => {
              expense.ref = index + 1; // Sequential ref# starting from 1 (earliest expense = ref# 1)
              balance += expense.inAmount - expense.outAmount;
              expense.balance = balance;
              expenses.push(expense);
            });

            // Reverse to show newest first in the list
            expenses.reverse();

            console.log(`[ExpenseService] Loaded ${expenses.length} expenses from Firebase`);
            callback(expenses);
          },
          (error) => {
            // Clear timeout on error
            clearTimeout(timeoutId);
            console.error('[ExpenseService] Error subscribing to expenses:', error);

            // CRITICAL: Always call callback even on error to stop loading spinner
            if (!hasCalledCallback) {
              hasCalledCallback = true;
              callback([]);
            }
          }
        );
    })
    .catch((error) => {
      // Clear timeout on error
      clearTimeout(timeoutId);
      console.error('[ExpenseService] Error resolving database ID:', error);

      // CRITICAL: Always call callback even on error to stop loading spinner
      if (!hasCalledCallback) {
        hasCalledCallback = true;
        callback([]);
      }
    });

  // Return unsubscribe function that also clears timeout
  return () => {
    clearTimeout(timeoutId);
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

// Update an existing expense
export const updateExpense = async (expenseId, expenseData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    await getUserExpensesCollection(databaseId).doc(expenseId).update({
      date: firebase.firestore.Timestamp.fromDate(new Date(expenseData.date)),
      description: expenseData.description,
      category: expenseData.category,
      inAmount: parseFloat(expenseData.inAmount) || 0,
      outAmount: parseFloat(expenseData.outAmount) || 0,
      updatedAt: firebase.firestore.Timestamp.now()
    });

    // Sync disabled - Import only mode
    // await syncAllExpensesToSheets(databaseId);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (expenseId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    await getUserExpensesCollection(databaseId).doc(expenseId).delete();

    // Sync disabled - Import only mode
    // await syncAllExpensesToSheets(databaseId);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Get all expenses for export
// userId parameter is resolved to shared database ID if user is in a shared database
export const getAllExpenses = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const databaseId = await getUserDatabaseId(userId);

    const querySnapshot = await getUserExpensesCollection(databaseId)
      .orderBy('date', 'asc')
      .orderBy('createdAt', 'asc')
      .get();

    const expenses = [];
    let balance = 0;

    const tempExpenses = [];
    querySnapshot.forEach((doc) => {
      tempExpenses.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      });
    });

    // Sort by date (oldest first) for balance calculation and ref# assignment
    // This ensures ref# 1 is the earliest expense, increasing chronologically
    // If dates are equal, sort by createdAt timestamp
    tempExpenses.sort((a, b) => {
      const dateCompare = a.date - b.date;
      if (dateCompare !== 0) return dateCompare;
      // If dates are the same, sort by creation time
      return a.createdAt.seconds - b.createdAt.seconds;
    });

    // Calculate balance and assign ref numbers
    tempExpenses.forEach((expense, index) => {
      expense.ref = index + 1; // Sequential ref# starting from 1 (earliest expense = ref# 1)
      balance += expense.inAmount - expense.outAmount;
      expense.balance = balance;
      expenses.push(expense);
    });

    // Reverse to show newest first
    expenses.reverse();

    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

// Sync all expenses to Google Sheets
const syncAllExpensesToSheets = async (userId) => {
  try {
    console.log('[ExpenseService] Starting sync to Google Sheets for user:', userId);
    const expenses = await getAllExpenses(userId);
    console.log(`[ExpenseService] Retrieved ${expenses.length} expenses for sync`);

    if (expenses.length > 0) {
      // Reverse back to chronological order (oldest first) for Google Sheets
      const sortedExpenses = [...expenses].reverse();
      console.log('[ExpenseService] Expenses sorted chronologically (oldest first)');
      console.log('[ExpenseService] First expense:', sortedExpenses[0]?.description, sortedExpenses[0]?.date);
      console.log('[ExpenseService] Last expense:', sortedExpenses[sortedExpenses.length - 1]?.description, sortedExpenses[sortedExpenses.length - 1]?.date);

      const result = await batchSyncToSheets(sortedExpenses);

      if (result.success && !result.skipped) {
        console.log('[ExpenseService] ✓ Sync to Google Sheets completed successfully');
      } else if (result.skipped) {
        console.log('[ExpenseService] ⊘ Sync skipped (no webhook configured)');
      } else {
        console.error('[ExpenseService] ✗ Sync to Google Sheets failed:', result.error);
      }

      return result;
    } else {
      console.log('[ExpenseService] No expenses to sync');
      return { success: true, count: 0 };
    }
  } catch (error) {
    console.error('[ExpenseService] Error syncing to Google Sheets:', error);
    // Don't throw - we don't want to block the main operation if sync fails
    return { success: false, error: error.message };
  }
};

// Export manual sync function for Settings screen
export const manualSyncToSheets = async (userId) => {
  return await syncAllExpensesToSheets(userId);
};

/**
 * Clear all expenses for the current user
 * WARNING: This is a destructive operation and cannot be undone
 */
export const clearAllExpenses = async () => {
  try {
    console.log('[ExpenseService] Starting to clear all expenses...');

    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();
    console.log('[ExpenseService] Database ID:', databaseId);

    const expensesRef = getUserExpensesCollection(databaseId);

    // Get all expenses
    const snapshot = await expensesRef.get();

    if (snapshot.empty) {
      console.log('[ExpenseService] No expenses to delete');
      return { success: true, count: 0 };
    }

    console.log(`[ExpenseService] Found ${snapshot.size} expenses to delete`);

    // Delete in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deleted = 0;

    let docsToDelete = await expensesRef.limit(batchSize).get();

    while (!docsToDelete.empty) {
      const batch = db.batch();

      docsToDelete.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deleted += docsToDelete.size;
      console.log(`[ExpenseService] Deleted ${deleted} expenses...`);

      // Get next batch
      docsToDelete = await expensesRef.limit(batchSize).get();
    }

    console.log(`[ExpenseService] ✓ Successfully deleted ${deleted} expenses`);

    return { success: true, count: deleted };
  } catch (error) {
    console.error('[ExpenseService] Error clearing expenses:', error);
    throw error;
  }
};
