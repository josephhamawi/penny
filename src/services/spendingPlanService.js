import { db, auth } from '../config/firebase';
import { getUserDatabaseId } from './invitationService';
import { CATEGORIES } from '../config/categories';

/**
 * Spending Plan Service
 * Manages percentage-based budget allocations across spending categories
 *
 * Data Structure:
 * {
 *   monthlyIncome: Number,
 *   allocations: Array<{categoryId, categoryName, percentage, targetAmount}>,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   isActive: Boolean
 * }
 */

// Helper to get user's spending plan document
const getUserSpendingPlanDoc = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.doc(`users/${userId}/spendingPlan/current`);
};

// Helper to get database ID (shared or personal)
const getDatabaseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await getUserDatabaseId(user.uid);
};

/**
 * Calculate target dollar amounts from percentages
 * @param {number} monthlyIncome - User's monthly income
 * @param {Array} allocations - Array of category allocations with percentages
 * @returns {Array} Allocations with calculated targetAmount fields
 */
export const calculateTargetAmounts = (monthlyIncome, allocations) => {
  if (!monthlyIncome || monthlyIncome <= 0) {
    return allocations.map(alloc => ({ ...alloc, targetAmount: 0 }));
  }

  return allocations.map(allocation => ({
    ...allocation,
    targetAmount: parseFloat(((monthlyIncome * allocation.percentage) / 100).toFixed(2))
  }));
};

/**
 * Validate allocations
 * Ensures total percentages don't exceed 100% and individual values are valid
 * @param {Array} allocations - Array of category allocations
 * @returns {Object} {valid: Boolean, errors: Array<string>}
 */
export const validateAllocations = (allocations) => {
  const errors = [];

  if (!Array.isArray(allocations)) {
    errors.push('Allocations must be an array');
    return { valid: false, errors };
  }

  // Check individual percentages
  allocations.forEach((allocation, index) => {
    if (typeof allocation.percentage !== 'number') {
      errors.push(`Allocation ${index}: percentage must be a number`);
    } else if (allocation.percentage < 0) {
      errors.push(`Allocation ${index}: percentage cannot be negative`);
    } else if (allocation.percentage > 100) {
      errors.push(`Allocation ${index}: percentage cannot exceed 100%`);
    }

    if (!allocation.categoryId || !allocation.categoryName) {
      errors.push(`Allocation ${index}: missing category information`);
    }
  });

  // Check total percentage
  const totalPercentage = allocations.reduce((sum, alloc) => sum + (alloc.percentage || 0), 0);
  if (totalPercentage > 100) {
    errors.push(`Total allocation (${totalPercentage.toFixed(1)}%) exceeds 100%`);
  }

  return {
    valid: errors.length === 0,
    errors,
    totalPercentage
  };
};

/**
 * Create a default spending plan with all categories at 0%
 * @param {number} monthlyIncome - User's monthly income
 * @returns {Object} Default spending plan
 */
export const createDefaultSpendingPlan = (monthlyIncome = 0) => {
  const allocations = CATEGORIES
    .filter(cat => cat !== 'Salary/Income' && cat !== 'Freelance') // Exclude income categories
    .map(category => ({
      categoryId: category.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      categoryName: category,
      percentage: 0,
      targetAmount: 0
    }));

  return {
    monthlyIncome: parseFloat(monthlyIncome) || 0,
    allocations,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
};

/**
 * Save spending plan to Firestore
 * @param {string} userId - User ID (optional, defaults to current user)
 * @param {Object} planData - Spending plan data
 * @returns {Promise<boolean>} Success status
 */
export const saveSpendingPlan = async (userId = null, planData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = userId ? await getUserDatabaseId(userId) : await getDatabaseId();

    // Validate plan data
    if (planData.monthlyIncome < 0) {
      throw new Error('Monthly income cannot be negative');
    }

    if (planData.allocations) {
      const validation = validateAllocations(planData.allocations);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Calculate target amounts
    const allocationsWithTargets = calculateTargetAmounts(
      planData.monthlyIncome,
      planData.allocations || []
    );

    const planToSave = {
      monthlyIncome: parseFloat(planData.monthlyIncome) || 0,
      allocations: allocationsWithTargets,
      updatedAt: new Date(),
      isActive: true
    };

    // Preserve createdAt if it exists, otherwise set it
    if (planData.createdAt) {
      planToSave.createdAt = planData.createdAt;
    } else {
      planToSave.createdAt = new Date();
    }

    await getUserSpendingPlanDoc(databaseId).set(planToSave, { merge: true });

    console.log('[SpendingPlanService] Spending plan saved successfully');
    return true;
  } catch (error) {
    console.error('[SpendingPlanService] Error saving spending plan:', error);
    throw error;
  }
};

/**
 * Get the active spending plan
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<Object|null>} Spending plan or null if not found
 */
export const getSpendingPlan = async (userId = null) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('[SpendingPlanService] User not authenticated');
      return null;
    }

    const databaseId = userId ? await getUserDatabaseId(userId) : await getDatabaseId();
    console.log('[SpendingPlanService] Getting plan for databaseId:', databaseId);
    console.log('[SpendingPlanService] Document path:', `users/${databaseId}/spendingPlan/current`);

    const doc = await getUserSpendingPlanDoc(databaseId).get();

    if (doc.exists) {
      const data = doc.data();
      console.log('[SpendingPlanService] Spending plan retrieved');
      return data;
    }

    console.log('[SpendingPlanService] No spending plan found');
    return null;
  } catch (error) {
    console.error('[SpendingPlanService] Error getting spending plan:', error);
    return null;
  }
};

/**
 * Update a single category allocation
 * @param {string} userId - User ID (optional, defaults to current user)
 * @param {string} categoryId - Category ID to update
 * @param {number} percentage - New percentage value
 * @returns {Promise<boolean>} Success status
 */
export const updateAllocation = async (userId = null, categoryId, percentage) => {
  try {
    console.log('[SpendingPlanService] updateAllocation called:', { userId, categoryId, percentage });
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = userId ? await getUserDatabaseId(userId) : await getDatabaseId();
    console.log('[SpendingPlanService] updateAllocation databaseId:', databaseId);

    // Get current plan or create default
    let currentPlan = await getSpendingPlan(userId);
    console.log('[SpendingPlanService] updateAllocation currentPlan:', currentPlan ? 'exists' : 'null');

    if (!currentPlan) {
      // Create a default plan if none exists
      console.log('[SpendingPlanService] Creating default plan...');
      currentPlan = createDefaultSpendingPlan(0);
      console.log('[SpendingPlanService] Default plan created, saving...');
      await saveSpendingPlan(userId, currentPlan);
      console.log('[SpendingPlanService] Default plan saved successfully');

      // Re-fetch to get the saved version with proper timestamps
      currentPlan = await getSpendingPlan(userId);
      console.log('[SpendingPlanService] Re-fetched plan after save:', currentPlan ? 'exists' : 'null');

      if (!currentPlan) {
        throw new Error('Failed to create spending plan');
      }
    }

    // Update the specific allocation
    console.log('[SpendingPlanService] Updating allocation for category:', categoryId);
    const updatedAllocations = currentPlan.allocations.map(alloc => {
      if (alloc.categoryId === categoryId) {
        return { ...alloc, percentage: parseFloat(percentage) };
      }
      return alloc;
    });

    // Validate updated allocations
    const validation = validateAllocations(updatedAllocations);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate target amounts
    const allocationsWithTargets = calculateTargetAmounts(
      currentPlan.monthlyIncome,
      updatedAllocations
    );

    // Save updated plan (use set with merge instead of update to handle creation)
    console.log('[SpendingPlanService] Saving updated allocations...');
    await getUserSpendingPlanDoc(databaseId).set({
      allocations: allocationsWithTargets,
      updatedAt: new Date(),
      monthlyIncome: currentPlan.monthlyIncome,
      isActive: true,
      createdAt: currentPlan.createdAt || new Date()
    }, { merge: true });

    console.log(`[SpendingPlanService] Allocation updated successfully for category: ${categoryId}`);
    return true;
  } catch (error) {
    console.error('[SpendingPlanService] Error updating allocation:', error);
    console.error('[SpendingPlanService] Error stack:', error.stack);
    throw error;
  }
};

/**
 * Update monthly income and recalculate all target amounts
 * @param {string} userId - User ID (optional, defaults to current user)
 * @param {number} monthlyIncome - New monthly income value
 * @returns {Promise<boolean>} Success status
 */
export const updateMonthlyIncome = async (userId = null, monthlyIncome) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    if (monthlyIncome < 0) {
      throw new Error('Monthly income cannot be negative');
    }

    const databaseId = userId ? await getUserDatabaseId(userId) : await getDatabaseId();

    // Get current plan
    const currentPlan = await getSpendingPlan(userId);

    let allocations = [];
    if (currentPlan && currentPlan.allocations) {
      // Recalculate target amounts with new income
      allocations = calculateTargetAmounts(monthlyIncome, currentPlan.allocations);
    } else {
      // Create default allocations if no plan exists
      const defaultPlan = createDefaultSpendingPlan(monthlyIncome);
      allocations = defaultPlan.allocations;
    }

    await getUserSpendingPlanDoc(databaseId).set({
      monthlyIncome: parseFloat(monthlyIncome),
      allocations,
      updatedAt: new Date(),
      isActive: true,
      createdAt: currentPlan?.createdAt || new Date()
    }, { merge: true });

    console.log('[SpendingPlanService] Monthly income updated');
    return true;
  } catch (error) {
    console.error('[SpendingPlanService] Error updating monthly income:', error);
    throw error;
  }
};

/**
 * Subscribe to spending plan changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function to receive plan updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToSpendingPlan = (userId, callback) => {
  if (!userId) throw new Error('User ID is required');

  let unsubscribe = () => {};

  getUserDatabaseId(userId).then((databaseId) => {
    unsubscribe = getUserSpendingPlanDoc(databaseId).onSnapshot((doc) => {
      if (doc.exists) {
        callback(doc.data());
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('[SpendingPlanService] Error subscribing to spending plan:', error);
      callback(null);
    });
  }).catch((error) => {
    console.error('[SpendingPlanService] Error resolving database ID:', error);
    callback(null);
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
};

/**
 * Delete the spending plan
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<boolean>} Success status
 */
export const deleteSpendingPlan = async (userId = null) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = userId ? await getUserDatabaseId(userId) : await getDatabaseId();

    await getUserSpendingPlanDoc(databaseId).delete();

    console.log('[SpendingPlanService] Spending plan deleted');
    return true;
  } catch (error) {
    console.error('[SpendingPlanService] Error deleting spending plan:', error);
    throw error;
  }
};

/**
 * Get total allocated percentage
 * @param {Array} allocations - Array of allocations
 * @returns {number} Total percentage allocated
 */
export const getTotalAllocatedPercentage = (allocations) => {
  if (!Array.isArray(allocations)) return 0;
  return allocations.reduce((sum, alloc) => sum + (alloc.percentage || 0), 0);
};

/**
 * Check if allocations are over budget (>100%)
 * @param {Array} allocations - Array of allocations
 * @returns {boolean} True if over budget
 */
export const isOverBudget = (allocations) => {
  return getTotalAllocatedPercentage(allocations) > 100;
};
