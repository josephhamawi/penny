import { firestore, auth } from '../config/firebase';
import { updateGoalProgress, updateGoal } from './goalService';

export const calculateGoalProgress = async (goal) => {
  const user = auth.currentUser;
  if (!user) return goal;

  try {
    // Get all expenses since goal creation
    const expensesSnapshot = await firestore
      .collection(`users/${user.uid}/expenses`)
      .where('createdAt', '>=', goal.createdAt)
      .get();

    let totalIncome = 0;
    let totalExpenses = 0;

    expensesSnapshot.forEach((doc) => {
      const expense = doc.data();

      // If category restrictions, only count those categories
      if (goal.categoryRestrictions && goal.categoryRestrictions.length > 0) {
        if (goal.categoryRestrictions.includes(expense.category)) {
          totalExpenses += expense.outAmount || 0;
        }
      } else {
        // Count all income and expenses
        totalIncome += expense.inAmount || 0;
        totalExpenses += expense.outAmount || 0;
      }
    });

    // Calculate current saved amount
    let currentAmount;
    if (goal.categoryRestrictions && goal.categoryRestrictions.length > 0) {
      // For category-restricted goals, saved amount = reduction in those categories
      currentAmount = Math.max(0, goal.targetAmount - totalExpenses);
    } else {
      // For general goals, saved amount = income - expenses
      currentAmount = totalIncome - totalExpenses;
    }

    // Calculate success probability
    const daysElapsed = Math.ceil((new Date() - goal.createdAt) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((goal.targetDate - goal.createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;

    let successProbability = 0;
    if (daysRemaining > 0) {
      const savingsRate = currentAmount / daysElapsed;
      const projectedSavings = currentAmount + (savingsRate * daysRemaining);
      successProbability = Math.min(Math.round((projectedSavings / goal.targetAmount) * 100), 100);
    }

    // Update goal in Firestore
    await updateGoalProgress(goal.id, currentAmount, successProbability);

    // Check if goal should be marked completed or failed
    let status = goal.status;
    if (currentAmount >= goal.targetAmount) {
      status = 'completed';
    } else if (goal.targetDate < new Date() && currentAmount < goal.targetAmount) {
      status = 'failed';
    }

    if (status !== goal.status) {
      await updateGoal(goal.id, { status });
    }

    return {
      currentAmount,
      successProbability,
      status,
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return goal;
  }
};
