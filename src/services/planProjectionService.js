import { getPlan, getActivePlans, updatePlanHealthScore } from './planService';
import { getAllocationsForPlan, getIncomeTransactions } from './planAllocationService';

/**
 * Plan Projection Service
 * Smart forecasting, health scoring, and recommendation engine for Plans
 *
 * Features:
 * - Income pattern detection (salary, freelance, mixed)
 * - Moving average projections
 * - Goal achievement date estimation
 * - Plan health scoring (0-100)
 * - Intelligent recommendations
 */

/**
 * Calculate moving average of income
 * @param {Array} incomeTransactions - Array of income transactions
 * @param {number} periods - Number of periods (default: 3 months)
 * @returns {number} Moving average income amount
 */
export const calculateMovingAverage = (incomeTransactions, periods = 3) => {
  if (!incomeTransactions || incomeTransactions.length === 0) return 0;

  // Sort by date descending (most recent first)
  const sorted = [...incomeTransactions].sort((a, b) => b.date - a.date);

  // Take last N transactions
  const recent = sorted.slice(0, periods);

  // Calculate average
  const sum = recent.reduce((total, tx) => total + tx.inAmount, 0);
  return sum / recent.length;
};

/**
 * Detect income frequency pattern
 * @param {Array} incomeTransactions - Array of income transactions
 * @returns {Object} { frequency: 'weekly'|'biweekly'|'monthly'|'irregular', averageDaysBetween: number }
 */
export const detectIncomeFrequency = (incomeTransactions) => {
  if (!incomeTransactions || incomeTransactions.length < 2) {
    return { frequency: 'irregular', averageDaysBetween: 30 };
  }

  // Sort by date
  const sorted = [...incomeTransactions].sort((a, b) => a.date - b.date);

  // Calculate days between each income
  const daysBetween = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.round((sorted[i].date - sorted[i - 1].date) / (1000 * 60 * 60 * 24));
    daysBetween.push(days);
  }

  // Calculate average days between
  const avgDays = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;

  // Calculate variance to determine consistency
  const variance = daysBetween.reduce((sum, days) => sum + Math.pow(days - avgDays, 2), 0) / daysBetween.length;
  const stdDev = Math.sqrt(variance);

  // Determine frequency based on average and consistency
  let frequency = 'irregular';

  // If variance is low (consistent), categorize by average days
  if (stdDev < avgDays * 0.3) { // Within 30% variance
    if (avgDays >= 6 && avgDays <= 8) {
      frequency = 'weekly';
    } else if (avgDays >= 13 && avgDays <= 16) {
      frequency = 'biweekly';
    } else if (avgDays >= 28 && avgDays <= 32) {
      frequency = 'monthly';
    }
  }

  return {
    frequency,
    averageDaysBetween: Math.round(avgDays)
  };
};

/**
 * Add income frequency to a date
 * @param {Date} date - Starting date
 * @param {Object} incomePattern - Income pattern from detectIncomeFrequency
 * @returns {Date} Next income date
 */
export const addIncomeFrequency = (date, incomePattern) => {
  const newDate = new Date(date);

  switch (incomePattern.frequency) {
    case 'weekly':
      newDate.setDate(newDate.getDate() + 7);
      break;
    case 'biweekly':
      newDate.setDate(newDate.getDate() + 14);
      break;
    case 'monthly':
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    default:
      newDate.setDate(newDate.getDate() + incomePattern.averageDaysBetween);
  }

  return newDate;
};

/**
 * Generate projections for a plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @returns {Object} Projection data with goal achievement info
 */
export const generateProjections = async (userId, planId) => {
  try {
    console.log('[PlanProjectionService] Generating projections for plan:', planId);

    // Get plan and allocations
    const plan = await getPlan(userId, planId);
    const allocations = await getAllocationsForPlan(userId, planId);
    const incomeTransactions = await getIncomeTransactions(userId);

    if (incomeTransactions.length === 0) {
      return {
        projections: [],
        goalAchievementDate: null,
        message: 'No income data yet. Add income transactions to see projections.',
        incomePattern: null
      };
    }

    // Calculate income patterns
    const movingAvg = calculateMovingAverage(incomeTransactions, 3);
    const incomePattern = detectIncomeFrequency(incomeTransactions);

    console.log('[PlanProjectionService] Moving average income:', movingAvg);
    console.log('[PlanProjectionService] Income pattern:', incomePattern);

    // Generate future projections
    const projections = [];
    let projectedTotal = plan.cumulativeTotalForPlan;
    let currentDate = new Date();
    let goalAchievementDate = null;

    // Generate up to 12 future income events or until target date
    const maxProjections = 12;
    const targetDate = plan.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year if no target

    for (let i = 0; i < maxProjections && currentDate < targetDate; i++) {
      const nextIncomeDate = addIncomeFrequency(currentDate, incomePattern);
      const projectedIncome = movingAvg;
      const projectedAllocation = projectedIncome * (plan.percentageOfIncome / 100);

      projectedTotal += projectedAllocation;

      projections.push({
        date: nextIncomeDate,
        projectedIncome,
        projectedAllocation,
        cumulativeTotal: projectedTotal
      });

      // Check if goal achieved
      if (!goalAchievementDate && plan.targetAmount && projectedTotal >= plan.targetAmount) {
        goalAchievementDate = nextIncomeDate;
      }

      currentDate = nextIncomeDate;
    }

    // Generate message
    let message = '';
    if (plan.targetAmount) {
      if (goalAchievementDate) {
        const monthsAway = Math.round((goalAchievementDate - new Date()) / (1000 * 60 * 60 * 24 * 30));
        message = `You'll reach your $${plan.targetAmount.toFixed(0)} goal in ${monthsAway} month${monthsAway !== 1 ? 's' : ''} (${goalAchievementDate.toLocaleDateString()})`;
      } else if (plan.targetDate) {
        message = `At current rate, you'll accumulate $${projectedTotal.toFixed(0)} by ${plan.targetDate.toLocaleDateString()}. Goal: $${plan.targetAmount.toFixed(0)}`;
      } else {
        message = `Continue allocating ${plan.percentageOfIncome}% to reach your $${plan.targetAmount.toFixed(0)} goal`;
      }
    } else {
      const lastProjection = projections[projections.length - 1];
      if (lastProjection) {
        message = `You'll accumulate $${lastProjection.cumulativeTotal.toFixed(0)} over the next ${projections.length} income payments`;
      }
    }

    return {
      projections,
      goalAchievementDate,
      message,
      incomePattern,
      movingAverage: movingAvg
    };
  } catch (error) {
    console.error('[PlanProjectionService] Error generating projections:', error);
    throw error;
  }
};

/**
 * Calculate plan health score (0-100)
 * Based on: income consistency, spending patterns, allocation ratio, goal timeline
 *
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {Array} expenses - All user expenses (for spending analysis)
 * @returns {number} Health score (0-100)
 */
export const calculatePlanHealthScore = async (userId, planId, expenses) => {
  try {
    console.log('[PlanProjectionService] Calculating health score for plan:', planId);

    const plan = await getPlan(userId, planId);
    const incomeTransactions = await getIncomeTransactions(userId);

    let score = 100;

    // Factor 1: Income consistency (40 points)
    if (incomeTransactions.length >= 3) {
      const amounts = incomeTransactions.slice(0, 6).map(tx => tx.inAmount);
      const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
      const coefficientOfVariation = Math.sqrt(variance) / avg;

      // Penalize high variance (> 0.3)
      if (coefficientOfVariation > 0.3) {
        const penalty = Math.min(40, (coefficientOfVariation - 0.3) * 100);
        score -= penalty;
        console.log('[PlanProjectionService] Income variance penalty:', penalty);
      }
    } else {
      // Not enough data - small penalty
      score -= 10;
      console.log('[PlanProjectionService] Insufficient income data penalty: 10');
    }

    // Factor 2: Spending pattern stability (30 points)
    if (expenses && expenses.length >= 10) {
      const last30Days = expenses.filter(e => {
        const daysSince = (new Date() - e.date) / (1000 * 60 * 60 * 24);
        return daysSince <= 30 && e.outAmount > 0;
      });

      if (last30Days.length > 0) {
        const dailyAmounts = {};
        last30Days.forEach(e => {
          const day = e.date.toISOString().split('T')[0];
          dailyAmounts[day] = (dailyAmounts[day] || 0) + e.outAmount;
        });

        const amounts = Object.values(dailyAmounts);
        const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);

        // High volatility penalized
        if (stdDev > avg * 0.5) {
          const penalty = Math.min(30, (stdDev / avg - 0.5) * 50);
          score -= penalty;
          console.log('[PlanProjectionService] Spending volatility penalty:', penalty);
        }
      }
    }

    // Factor 3: Allocation ratio reasonableness (20 points)
    const allPlans = await getActivePlans(userId);
    const totalAllocationPercentage = allPlans.reduce((sum, p) => sum + p.percentageOfIncome, 0);

    if (totalAllocationPercentage > 50) {
      const penalty = Math.min(20, (totalAllocationPercentage - 50) * 0.4);
      score -= penalty;
      console.log('[PlanProjectionService] Over-allocation penalty:', penalty);
    }

    // Factor 4: Goal timeline realism (10 points)
    if (plan.targetDate && plan.targetAmount) {
      const projectionData = await generateProjections(userId, planId);

      if (projectionData.goalAchievementDate) {
        // Goal is achievable
        if (projectionData.goalAchievementDate > plan.targetDate) {
          // Goal date is too aggressive
          score -= 5;
          console.log('[PlanProjectionService] Aggressive timeline penalty: 5');
        }
        // Else: Full points, goal is achievable on time
      } else {
        // Goal might not be achievable
        score -= 10;
        console.log('[PlanProjectionService] Unrealistic goal penalty: 10');
      }
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    console.log('[PlanProjectionService] Final health score:', finalScore);

    return finalScore;
  } catch (error) {
    console.error('[PlanProjectionService] Error calculating health score:', error);
    return 50; // Default to middle score on error
  }
};

/**
 * Update health scores for all active plans
 * @param {string} userId - User ID
 * @param {Array} expenses - All user expenses
 */
export const updateAllPlanHealthScores = async (userId, expenses) => {
  try {
    console.log('[PlanProjectionService] Updating health scores for all plans');

    const plans = await getActivePlans(userId);

    for (const plan of plans) {
      const healthScore = await calculatePlanHealthScore(userId, plan.id, expenses);
      await updatePlanHealthScore(userId, plan.id, healthScore);
    }

    console.log('[PlanProjectionService] Updated health scores for', plans.length, 'plans');
  } catch (error) {
    console.error('[PlanProjectionService] Error updating health scores:', error);
  }
};

/**
 * Generate intelligent recommendations for a plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {Array} expenses - All user expenses
 * @returns {Array} Array of recommendation objects
 */
export const generatePlanRecommendations = async (userId, planId, expenses) => {
  try {
    console.log('[PlanProjectionService] Generating recommendations for plan:', planId);

    const plan = await getPlan(userId, planId);
    const healthScore = await calculatePlanHealthScore(userId, planId, expenses);
    const projectionData = await generateProjections(userId, planId);
    const allPlans = await getActivePlans(userId);

    const recommendations = [];

    // Recommendation 1: Low health score
    if (healthScore < 50) {
      recommendations.push({
        type: 'warning',
        icon: 'exclamation-triangle',
        title: 'Plan Health Needs Attention',
        message: `Your "${plan.planName}" plan health is ${healthScore}/100. Consider reducing your allocation percentage to improve stability.`,
        action: 'adjust_percentage',
        currentValue: plan.percentageOfIncome,
        suggestedValue: Math.max(1, Math.floor(plan.percentageOfIncome * 0.75))
      });
    }

    // Recommendation 2: Over-allocated (total > 80%)
    const totalPercentage = allPlans.reduce((sum, p) => sum + p.percentageOfIncome, 0);
    if (totalPercentage > 80) {
      recommendations.push({
        type: 'alert',
        icon: 'chart-pie',
        title: 'High Total Allocation',
        message: `You're allocating ${totalPercentage.toFixed(0)}% of income across all plans. This may strain your budget for day-to-day expenses.`,
        action: 'rebalance',
        currentValue: totalPercentage,
        suggestedValue: 70
      });
    }

    // Recommendation 3: Behind schedule on goal
    if (plan.targetAmount && plan.targetDate) {
      const daysUntilTarget = Math.round((plan.targetDate - new Date()) / (1000 * 60 * 60 * 24));

      if (daysUntilTarget > 0) {
        if (!projectionData.goalAchievementDate || projectionData.goalAchievementDate > plan.targetDate) {
          // Calculate needed percentage
          const remainingAmount = plan.targetAmount - plan.cumulativeTotalForPlan;
          const incomeTransactions = await getIncomeTransactions(userId);
          const avgIncome = calculateMovingAverage(incomeTransactions, 3);
          const incomePattern = detectIncomeFrequency(incomeTransactions);

          // Estimate number of income events until target date
          const incomeEventsRemaining = Math.ceil(daysUntilTarget / incomePattern.averageDaysBetween);
          const neededPerIncome = remainingAmount / incomeEventsRemaining;
          const neededPercentage = Math.ceil((neededPerIncome / avgIncome) * 100);

          if (neededPercentage <= 100) {
            recommendations.push({
              type: 'info',
              icon: 'bullseye',
              title: 'Increase Allocation to Meet Goal',
              message: `To reach your $${plan.targetAmount.toFixed(0)} goal by ${plan.targetDate.toLocaleDateString()}, increase allocation to ${neededPercentage}%.`,
              action: 'increase_percentage',
              currentValue: plan.percentageOfIncome,
              suggestedValue: neededPercentage
            });
          } else {
            recommendations.push({
              type: 'warning',
              icon: 'calendar',
              title: 'Goal Timeline Too Aggressive',
              message: `Your goal timeline is too ambitious with current income. Consider extending your target date or reducing your target amount.`,
              action: 'adjust_goal',
              currentValue: plan.targetDate.toLocaleDateString(),
              suggestedValue: null
            });
          }
        }
      }
    }

    // Recommendation 4: Spending in target category is high
    if (plan.targetCategory && expenses) {
      const last30Days = expenses.filter(e => {
        const daysSince = (new Date() - e.date) / (1000 * 60 * 60 * 24);
        return daysSince <= 30 && e.outAmount > 0 && e.category === plan.targetCategory;
      });

      if (last30Days.length > 0) {
        const totalSpent = last30Days.reduce((sum, e) => sum + e.outAmount, 0);
        const avgWeeklySpending = (totalSpent / 30) * 7;

        // If weekly spending is more than 20% of current accumulated amount
        if (avgWeeklySpending > plan.cumulativeTotalForPlan * 0.05) {
          recommendations.push({
            type: 'warning',
            icon: 'shopping-cart',
            title: `${plan.targetCategory} Spending Is High`,
            message: `Your ${plan.targetCategory} spending ($${avgWeeklySpending.toFixed(0)}/week) is impacting your savings. Reduce by 10-15% to reach your goal faster.`,
            action: 'reduce_spending',
            category: plan.targetCategory,
            currentValue: avgWeeklySpending,
            suggestedValue: avgWeeklySpending * 0.85
          });
        }
      }
    }

    // Recommendation 5: Positive reinforcement for healthy plans
    if (healthScore >= 80 && projectionData.goalAchievementDate && plan.targetDate) {
      if (projectionData.goalAchievementDate <= plan.targetDate) {
        recommendations.push({
          type: 'success',
          icon: 'check-circle',
          title: 'On Track to Meet Goal!',
          message: `Great work! You're on pace to reach your $${plan.targetAmount.toFixed(0)} goal by ${projectionData.goalAchievementDate.toLocaleDateString()}. Keep up the consistency!`,
          action: 'none',
          currentValue: null,
          suggestedValue: null
        });
      }
    }

    console.log('[PlanProjectionService] Generated', recommendations.length, 'recommendations');
    return recommendations;
  } catch (error) {
    console.error('[PlanProjectionService] Error generating recommendations:', error);
    return [];
  }
};

/**
 * Calculate what-if scenario
 * Shows projected outcome if user changes allocation percentage
 *
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {number} newPercentage - New percentage to simulate
 * @returns {Object} Projection data with new percentage
 */
export const calculateWhatIfScenario = async (userId, planId, newPercentage) => {
  try {
    const plan = await getPlan(userId, planId);
    const incomeTransactions = await getIncomeTransactions(userId);

    if (incomeTransactions.length === 0) {
      return {
        projections: [],
        message: 'No income data available for simulation'
      };
    }

    const movingAvg = calculateMovingAverage(incomeTransactions, 3);
    const incomePattern = detectIncomeFrequency(incomeTransactions);

    const projections = [];
    let projectedTotal = plan.cumulativeTotalForPlan;
    let currentDate = new Date();
    let goalAchievementDate = null;

    const maxProjections = 12;
    const targetDate = plan.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < maxProjections && currentDate < targetDate; i++) {
      const nextIncomeDate = addIncomeFrequency(currentDate, incomePattern);
      const projectedIncome = movingAvg;
      const projectedAllocation = projectedIncome * (newPercentage / 100);

      projectedTotal += projectedAllocation;

      projections.push({
        date: nextIncomeDate,
        projectedIncome,
        projectedAllocation,
        cumulativeTotal: projectedTotal
      });

      if (!goalAchievementDate && plan.targetAmount && projectedTotal >= plan.targetAmount) {
        goalAchievementDate = nextIncomeDate;
      }

      currentDate = nextIncomeDate;
    }

    let message = '';
    if (plan.targetAmount && goalAchievementDate) {
      const monthsAway = Math.round((goalAchievementDate - new Date()) / (1000 * 60 * 60 * 24 * 30));
      message = `At ${newPercentage}% allocation, you'll reach $${plan.targetAmount.toFixed(0)} in ${monthsAway} month${monthsAway !== 1 ? 's' : ''}`;
    } else {
      const lastProjection = projections[projections.length - 1];
      if (lastProjection) {
        message = `At ${newPercentage}% allocation, you'll save $${lastProjection.cumulativeTotal.toFixed(0)} over ${projections.length} payments`;
      }
    }

    return {
      projections,
      goalAchievementDate,
      message,
      simulatedPercentage: newPercentage
    };
  } catch (error) {
    console.error('[PlanProjectionService] Error calculating what-if scenario:', error);
    throw error;
  }
};
