import { db, auth } from '../config/firebase';
import firebase from 'firebase/compat/app';
import { getUserDatabaseId } from './invitationService';
import { getActivePlans, updatePlanCumulativeTotal } from './planService';

/**
 * Plan Allocation Service
 * Manages the virtual ledger for automatic income allocations
 *
 * Core Algorithm:
 * 1. Detect income transactions (inAmount > 0)
 * 2. For each income, create allocations for all active plans
 * 3. Store allocations in parallel virtual ledger (doesn't affect balance)
 * 4. Update cumulative totals for each plan
 *
 * Virtual Allocation Structure:
 * {
 *   id: string,
 *   planId: string,
 *   planName: string,
 *   originalIncomeRowId: string,
 *   date: Timestamp,
 *   incomeAmount: number,
 *   allocatedAmount: number,
 *   targetCategory: string | null,
 *   cumulativeTotalForPlan: number,
 *   userId: string,
 *   createdAt: Timestamp
 * }
 */

// Helper to get user's allocations collection
const getUserAllocationsCollection = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.collection(`users/${userId}/planAllocations`);
};

// Helper to get user's expenses collection
const getUserExpensesCollection = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.collection(`users/${userId}/expenses`);
};

// Helper to get database ID
const getDatabaseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await getUserDatabaseId(user.uid);
};

/**
 * Get all income transactions for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of income transaction objects
 */
export const getIncomeTransactions = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const databaseId = await getUserDatabaseId(userId);
    const snapshot = await getUserExpensesCollection(databaseId)
      .where('inAmount', '>', 0)
      .orderBy('inAmount')
      .orderBy('date', 'desc')
      .get();

    const incomeTransactions = [];
    snapshot.forEach(doc => {
      incomeTransactions.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      });
    });

    return incomeTransactions;
  } catch (error) {
    console.error('[PlanAllocationService] Error getting income transactions:', error);
    throw error;
  }
};

/**
 * Get all allocations for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of allocation objects
 */
export const getAllocations = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const databaseId = await getUserDatabaseId(userId);
    const snapshot = await getUserAllocationsCollection(databaseId)
      .orderBy('date', 'desc')
      .get();

    const allocations = [];
    snapshot.forEach(doc => {
      allocations.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate()
      });
    });

    return allocations;
  } catch (error) {
    console.error('[PlanAllocationService] Error getting allocations:', error);
    throw error;
  }
};

/**
 * Get allocations for a specific plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @returns {Array} Array of allocation objects for this plan
 */
export const getAllocationsForPlan = async (userId, planId) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);
    const snapshot = await getUserAllocationsCollection(databaseId)
      .where('planId', '==', planId)
      .orderBy('date', 'desc')
      .get();

    const allocations = [];
    snapshot.forEach(doc => {
      allocations.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate()
      });
    });

    return allocations;
  } catch (error) {
    console.error('[PlanAllocationService] Error getting allocations for plan:', error);
    throw error;
  }
};

/**
 * Create a single allocation
 * @param {Object} allocationData - Allocation data
 * @returns {string} Created allocation ID
 */
export const createAllocation = async (allocationData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    const docRef = await getUserAllocationsCollection(databaseId).add({
      planId: allocationData.planId,
      planName: allocationData.planName,
      originalIncomeRowId: allocationData.originalIncomeRowId,
      date: firebase.firestore.Timestamp.fromDate(new Date(allocationData.date)),
      incomeAmount: parseFloat(allocationData.incomeAmount),
      allocatedAmount: parseFloat(allocationData.allocatedAmount),
      targetCategory: allocationData.targetCategory || null,
      cumulativeTotalForPlan: parseFloat(allocationData.cumulativeTotalForPlan || 0),
      userId: user.uid,
      createdAt: firebase.firestore.Timestamp.now()
    });

    console.log('[PlanAllocationService] Created allocation:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[PlanAllocationService] Error creating allocation:', error);
    throw error;
  }
};

/**
 * Main allocation engine - processes all income and creates allocations
 * This is the core algorithm that makes the Plan feature work
 *
 * @param {string} userId - User ID
 * @returns {Object} { processed: number, created: number, skipped: number }
 */
export const processIncomeAllocations = async (userId) => {
  try {
    console.log('[PlanAllocationService] Starting allocation processing for user:', userId);

    // Step 1: Get all active plans
    const plans = await getActivePlans(userId);
    console.log(`[PlanAllocationService] Found ${plans.length} active plans`);

    if (plans.length === 0) {
      console.log('[PlanAllocationService] No active plans, skipping allocation processing');
      return { processed: 0, created: 0, skipped: 0 };
    }

    // Step 2: Get all income transactions
    const incomeTransactions = await getIncomeTransactions(userId);
    console.log(`[PlanAllocationService] Found ${incomeTransactions.length} income transactions`);

    // Step 3: Get existing allocations
    const existingAllocations = await getAllocations(userId);
    console.log(`[PlanAllocationService] Found ${existingAllocations.length} existing allocations`);

    // Step 4: Find unallocated income
    const unallocatedIncome = incomeTransactions.filter(income =>
      !existingAllocations.some(alloc => alloc.originalIncomeRowId === income.id)
    );
    console.log(`[PlanAllocationService] Found ${unallocatedIncome.length} unallocated income transactions`);

    let created = 0;
    let skipped = 0;

    // Step 5: Create allocations for unallocated income
    for (const income of unallocatedIncome) {
      console.log(`[PlanAllocationService] Processing income transaction:`, income.id, income.inAmount);

      for (const plan of plans) {
        try {
          const allocatedAmount = income.inAmount * (plan.percentageOfIncome / 100);

          // Get current cumulative for this plan
          const planAllocations = await getAllocationsForPlan(userId, plan.id);
          const currentCumulative = planAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
          const newCumulative = currentCumulative + allocatedAmount;

          await createAllocation({
            planId: plan.id,
            planName: plan.planName,
            originalIncomeRowId: income.id,
            date: income.date,
            incomeAmount: income.inAmount,
            allocatedAmount,
            targetCategory: plan.targetCategory,
            cumulativeTotalForPlan: newCumulative
          });

          created++;
          console.log(`[PlanAllocationService] Created allocation for plan "${plan.planName}": $${allocatedAmount.toFixed(2)}`);
        } catch (error) {
          console.error(`[PlanAllocationService] Error creating allocation for plan ${plan.id}:`, error);
          skipped++;
        }
      }
    }

    // Step 6: Update cumulative totals for all plans
    await updateCumulativeTotals(userId, plans);

    console.log(`[PlanAllocationService] Processing complete. Created: ${created}, Skipped: ${skipped}`);

    return {
      processed: unallocatedIncome.length,
      created,
      skipped
    };
  } catch (error) {
    console.error('[PlanAllocationService] Error processing income allocations:', error);
    throw error;
  }
};

/**
 * Update cumulative totals for all plans based on their allocations
 * @param {string} userId - User ID
 * @param {Array} plans - Array of plan objects (optional, will fetch if not provided)
 */
export const updateCumulativeTotals = async (userId, plans = null) => {
  try {
    console.log('[PlanAllocationService] Updating cumulative totals');

    if (!plans) {
      plans = await getActivePlans(userId);
    }

    for (const plan of plans) {
      const allocations = await getAllocationsForPlan(userId, plan.id);
      const cumulativeTotal = allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);

      await updatePlanCumulativeTotal(userId, plan.id, cumulativeTotal);
      console.log(`[PlanAllocationService] Updated cumulative total for "${plan.planName}": $${cumulativeTotal.toFixed(2)}`);
    }
  } catch (error) {
    console.error('[PlanAllocationService] Error updating cumulative totals:', error);
    throw error;
  }
};

/**
 * Get allocation summary for a user
 * @param {string} userId - User ID
 * @returns {Object} Summary statistics
 */
export const getAllocationSummary = async (userId) => {
  try {
    const plans = await getActivePlans(userId);
    const allocations = await getAllocations(userId);

    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const totalIncome = [...new Set(allocations.map(a => a.originalIncomeRowId))].length;

    const planSummaries = plans.map(plan => {
      const planAllocations = allocations.filter(a => a.planId === plan.id);
      const planTotal = planAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);

      return {
        planId: plan.id,
        planName: plan.planName,
        totalAllocated: planTotal,
        allocationCount: planAllocations.length,
        percentage: plan.percentageOfIncome
      };
    });

    return {
      totalAllocated,
      totalIncomeTransactions: totalIncome,
      totalAllocationCount: allocations.length,
      activePlansCount: plans.length,
      planSummaries
    };
  } catch (error) {
    console.error('[PlanAllocationService] Error getting allocation summary:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time allocation updates for a specific plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAllocationsForPlan = (userId, planId, callback) => {
  if (!userId || !planId) throw new Error('User ID and Plan ID are required');

  let unsubscribe = null;

  getUserDatabaseId(userId).then((databaseId) => {
    unsubscribe = getUserAllocationsCollection(databaseId)
      .where('planId', '==', planId)
      .orderBy('date', 'desc')
      .onSnapshot((querySnapshot) => {
        const allocations = [];
        querySnapshot.forEach((doc) => {
          allocations.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date.toDate(),
            createdAt: doc.data().createdAt.toDate()
          });
        });
        callback(allocations);
      }, (error) => {
        console.error('[PlanAllocationService] Subscription error:', error);
        callback([]);
      });
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
};

/**
 * Delete allocations for a plan (when plan is deleted)
 * Note: We typically DON'T delete allocations for historical tracking
 * This is here for edge cases only
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
export const deleteAllocationsForPlan = async (userId, planId) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);
    const snapshot = await getUserAllocationsCollection(databaseId)
      .where('planId', '==', planId)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[PlanAllocationService] Deleted ${snapshot.size} allocations for plan:`, planId);
  } catch (error) {
    console.error('[PlanAllocationService] Error deleting allocations:', error);
    throw error;
  }
};

/**
 * Get total allocated amount across all plans
 * @param {string} userId - User ID
 * @returns {number} Total allocated amount
 */
export const getTotalAllocatedAmount = async (userId) => {
  try {
    const allocations = await getAllocations(userId);
    return allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
  } catch (error) {
    console.error('[PlanAllocationService] Error getting total allocated:', error);
    return 0;
  }
};

/**
 * Recalculate all allocations for a plan (when percentage changes)
 * This does NOT create new allocations, just updates the cumulative total
 * Existing allocations remain unchanged for historical accuracy
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
export const recalculatePlanAllocations = async (userId, planId) => {
  try {
    console.log('[PlanAllocationService] Recalculating allocations for plan:', planId);

    const allocations = await getAllocationsForPlan(userId, planId);
    const cumulativeTotal = allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);

    await updatePlanCumulativeTotal(userId, planId, cumulativeTotal);

    console.log('[PlanAllocationService] Recalculation complete. New total:', cumulativeTotal);
    return cumulativeTotal;
  } catch (error) {
    console.error('[PlanAllocationService] Error recalculating allocations:', error);
    throw error;
  }
};
