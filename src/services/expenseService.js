import firebase from 'firebase/compat/app';
import { db } from '../config/firebase';
import { syncExpenseToSheets, batchSyncToSheets } from './googleSheetsSyncService';

const COLLECTION_NAME = 'expenses';

// Add a new expense record
export const addExpense = async (userId, expenseData) => {
  try {
    const docRef = await db.collection(COLLECTION_NAME).add({
      userId,
      date: firebase.firestore.Timestamp.fromDate(new Date(expenseData.date)),
      description: expenseData.description,
      category: expenseData.category,
      inAmount: parseFloat(expenseData.inAmount) || 0,
      outAmount: parseFloat(expenseData.outAmount) || 0,
      createdAt: firebase.firestore.Timestamp.now()
    });

    // Sync all expenses to Google Sheets after adding
    await syncAllExpensesToSheets(userId);

    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Subscribe to real-time expense updates
export const subscribeToExpenses = (userId, callback) => {
  return db.collection(COLLECTION_NAME)
    .where('userId', '==', userId)
    .onSnapshot((querySnapshot) => {
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

      callback(expenses);
    }, (error) => {
      console.error('Error subscribing to expenses:', error);
    });
};

// Update an existing expense
export const updateExpense = async (expenseId, expenseData, userId) => {
  try {
    await db.collection(COLLECTION_NAME).doc(expenseId).update({
      date: firebase.firestore.Timestamp.fromDate(new Date(expenseData.date)),
      description: expenseData.description,
      category: expenseData.category,
      inAmount: parseFloat(expenseData.inAmount) || 0,
      outAmount: parseFloat(expenseData.outAmount) || 0
    });

    // Sync all expenses to Google Sheets after updating
    if (userId) {
      await syncAllExpensesToSheets(userId);
    }
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (expenseId, userId) => {
  try {
    await db.collection(COLLECTION_NAME).doc(expenseId).delete();

    // Sync all expenses to Google Sheets after deleting
    if (userId) {
      await syncAllExpensesToSheets(userId);
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Get all expenses for export
export const getAllExpenses = async (userId) => {
  try {
    const querySnapshot = await db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
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
    const expenses = await getAllExpenses(userId);

    if (expenses.length > 0) {
      // Reverse back to chronological order (oldest first) for Google Sheets
      const sortedExpenses = [...expenses].reverse();
      await batchSyncToSheets(sortedExpenses);
    }
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    // Don't throw - we don't want to block the main operation if sync fails
  }
};
