import { db, auth } from '../config/firebase';
import { getUserDatabaseId } from './invitationService';

const DEFAULT_BUDGET = 5000;

// Helper to get user's budget document
const getUserBudgetDoc = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.doc(`users/${userId}/settings/budget`);
};

// Helper to get database ID (shared or personal)
const getDatabaseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await getUserDatabaseId(user.uid);
};

/**
 * Save the monthly budget
 */
export const saveMonthlyBudget = async (budget) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    await getUserBudgetDoc(databaseId).set({
      amount: parseFloat(budget),
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error saving monthly budget:', error);
    throw error;
  }
};

/**
 * Get the monthly budget
 */
export const getMonthlyBudget = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return DEFAULT_BUDGET;

    const databaseId = await getDatabaseId();

    const doc = await getUserBudgetDoc(databaseId).get();
    if (doc.exists) {
      return doc.data().amount || DEFAULT_BUDGET;
    }
    return DEFAULT_BUDGET;
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    return DEFAULT_BUDGET;
  }
};

/**
 * Subscribe to budget changes
 * userId parameter is resolved to shared database ID if user is in a shared database
 */
export const subscribeToBudget = (userId, callback) => {
  if (!userId) throw new Error('User ID is required');

  getUserDatabaseId(userId).then((databaseId) => {
    return getUserBudgetDoc(databaseId).onSnapshot((doc) => {
      if (doc.exists) {
        callback(doc.data().amount || DEFAULT_BUDGET);
      } else {
        callback(DEFAULT_BUDGET);
      }
    }, (error) => {
      console.error('Error subscribing to budget:', error);
      callback(DEFAULT_BUDGET);
    });
  }).catch((error) => {
    console.error('Error resolving database ID:', error);
    callback(DEFAULT_BUDGET);
  });

  // Return empty unsubscribe function (the actual unsubscribe is handled internally)
  return () => {};
};

/**
 * Reset to default budget
 */
export const resetMonthlyBudget = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    await getUserBudgetDoc(databaseId).delete();
    return DEFAULT_BUDGET;
  } catch (error) {
    console.error('Error resetting monthly budget:', error);
    throw error;
  }
};
