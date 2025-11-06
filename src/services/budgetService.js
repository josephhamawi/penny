import AsyncStorage from '@react-native-async-storage/async-storage';

const BUDGET_KEY = 'monthlyBudget';
const DEFAULT_BUDGET = 5000;

/**
 * Save the monthly budget
 */
export const saveMonthlyBudget = async (budget) => {
  try {
    await AsyncStorage.setItem(BUDGET_KEY, budget.toString());
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
    const budget = await AsyncStorage.getItem(BUDGET_KEY);
    return budget ? parseFloat(budget) : DEFAULT_BUDGET;
  } catch (error) {
    console.error('Error getting monthly budget:', error);
    return DEFAULT_BUDGET;
  }
};

/**
 * Reset to default budget
 */
export const resetMonthlyBudget = async () => {
  try {
    await AsyncStorage.removeItem(BUDGET_KEY);
    return DEFAULT_BUDGET;
  } catch (error) {
    console.error('Error resetting monthly budget:', error);
    throw error;
  }
};
