import { db, auth } from '../config/firebase';

const DEFAULT_BUDGET = 5000;

// Helper to get user's budget document
const getUserBudgetDoc = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.doc(`users/${userId}/settings/budget`);
};

/**
 * Save the monthly budget
 */
export const saveMonthlyBudget = async (budget) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await getUserBudgetDoc(user.uid).set({
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

    const doc = await getUserBudgetDoc(user.uid).get();
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
 */
export const subscribeToBudget = (userId, callback) => {
  if (!userId) throw new Error('User ID is required');

  return getUserBudgetDoc(userId).onSnapshot((doc) => {
    if (doc.exists) {
      callback(doc.data().amount || DEFAULT_BUDGET);
    } else {
      callback(DEFAULT_BUDGET);
    }
  }, (error) => {
    console.error('Error subscribing to budget:', error);
    callback(DEFAULT_BUDGET);
  });
};

/**
 * Reset to default budget
 */
export const resetMonthlyBudget = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await getUserBudgetDoc(user.uid).delete();
    return DEFAULT_BUDGET;
  } catch (error) {
    console.error('Error resetting monthly budget:', error);
    throw error;
  }
};
