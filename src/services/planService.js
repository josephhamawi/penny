import { db, auth } from '../config/firebase';
import firebase from 'firebase/compat/app';
import { getUserDatabaseId } from './invitationService';

/**
 * Plan Service
 * Manages savings allocation plans - automatic percentage-based allocations from income
 *
 * Core Concept: Each plan automatically sets aside a % of every income transaction
 * into a virtual savings ledger for future goals (travel, clothing, emergency, etc.)
 *
 * Data Structure:
 * {
 *   id: string,
 *   userId: string,
 *   planName: string,
 *   targetCategory: string | null,
 *   percentageOfIncome: number (0-100),
 *   description: string,
 *   active: boolean,
 *   targetAmount: number | null,
 *   targetDate: Timestamp | null,
 *   cumulativeTotalForPlan: number,
 *   healthScore: number (0-100),
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp
 * }
 */

// Helper to get user's plans collection
const getUserPlansCollection = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.collection(`users/${userId}/plans`);
};

// Helper to get database ID (shared or personal)
const getDatabaseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return await getUserDatabaseId(user.uid);
};

/**
 * Create a new plan
 * @param {Object} planData - Plan configuration
 * @returns {string} Created plan ID
 */
export const createPlan = async (planData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const databaseId = await getDatabaseId();

    // Validate percentage
    if (planData.percentageOfIncome < 0 || planData.percentageOfIncome > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    // Check if adding this plan would exceed 100% total allocation
    const existingPlans = await getPlans(user.uid);
    const totalPercentage = existingPlans
      .filter(p => p.active)
      .reduce((sum, p) => sum + p.percentageOfIncome, 0);

    if (totalPercentage + planData.percentageOfIncome > 100) {
      throw new Error(`Total allocation would exceed 100%. Current: ${totalPercentage}%, Trying to add: ${planData.percentageOfIncome}%`);
    }

    const docRef = await getUserPlansCollection(databaseId).add({
      userId: user.uid,
      planName: planData.planName,
      targetCategory: planData.targetCategory || null,
      percentageOfIncome: parseFloat(planData.percentageOfIncome),
      description: planData.description || '',
      active: true,
      targetAmount: planData.targetAmount ? parseFloat(planData.targetAmount) : null,
      targetDate: planData.targetDate ? firebase.firestore.Timestamp.fromDate(new Date(planData.targetDate)) : null,
      cumulativeTotalForPlan: 0,
      healthScore: 100, // Start with perfect health
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now()
    });

    console.log('[PlanService] Created plan:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[PlanService] Error creating plan:', error);
    throw error;
  }
};

/**
 * Get all plans for a user
 * @param {string} userId - User ID
 * @returns {Array} Array of plan objects
 */
export const getPlans = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is required');

    const databaseId = await getUserDatabaseId(userId);
    const snapshot = await getUserPlansCollection(databaseId)
      .orderBy('createdAt', 'desc')
      .get();

    const plans = [];
    snapshot.forEach(doc => {
      plans.push({
        id: doc.id,
        ...doc.data(),
        targetDate: doc.data().targetDate?.toDate() || null,
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      });
    });

    return plans;
  } catch (error) {
    console.error('[PlanService] Error getting plans:', error);
    throw error;
  }
};

/**
 * Get active plans only
 * @param {string} userId - User ID
 * @returns {Array} Array of active plan objects
 */
export const getActivePlans = async (userId) => {
  try {
    const allPlans = await getPlans(userId);
    return allPlans.filter(plan => plan.active);
  } catch (error) {
    console.error('[PlanService] Error getting active plans:', error);
    throw error;
  }
};

/**
 * Get a single plan by ID
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @returns {Object} Plan object
 */
export const getPlan = async (userId, planId) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);
    const doc = await getUserPlansCollection(databaseId).doc(planId).get();

    if (!doc.exists) {
      throw new Error('Plan not found');
    }

    return {
      id: doc.id,
      ...doc.data(),
      targetDate: doc.data().targetDate?.toDate() || null,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    };
  } catch (error) {
    console.error('[PlanService] Error getting plan:', error);
    throw error;
  }
};

/**
 * Update a plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {Object} updates - Fields to update
 */
export const updatePlan = async (userId, planId, updates) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);

    // Validate percentage if being updated
    if (updates.percentageOfIncome !== undefined) {
      if (updates.percentageOfIncome < 0 || updates.percentageOfIncome > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }

      // Check total allocation
      const existingPlans = await getPlans(userId);
      const currentPlan = existingPlans.find(p => p.id === planId);
      const otherPlans = existingPlans.filter(p => p.id !== planId && p.active);
      const totalPercentage = otherPlans.reduce((sum, p) => sum + p.percentageOfIncome, 0);

      if (totalPercentage + updates.percentageOfIncome > 100) {
        throw new Error(`Total allocation would exceed 100%. Other plans: ${totalPercentage}%, New value: ${updates.percentageOfIncome}%`);
      }
    }

    // Convert dates to timestamps if present
    const updateData = { ...updates };
    if (updateData.targetDate) {
      updateData.targetDate = firebase.firestore.Timestamp.fromDate(new Date(updateData.targetDate));
    }
    updateData.updatedAt = firebase.firestore.Timestamp.now();

    await getUserPlansCollection(databaseId).doc(planId).update(updateData);
    console.log('[PlanService] Updated plan:', planId);
  } catch (error) {
    console.error('[PlanService] Error updating plan:', error);
    throw error;
  }
};

/**
 * Delete a plan (soft delete - marks as inactive)
 * Note: We keep allocations for historical tracking
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 */
export const deletePlan = async (userId, planId) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);
    await getUserPlansCollection(databaseId).doc(planId).update({
      active: false,
      updatedAt: firebase.firestore.Timestamp.now()
    });

    console.log('[PlanService] Deleted (deactivated) plan:', planId);
  } catch (error) {
    console.error('[PlanService] Error deleting plan:', error);
    throw error;
  }
};

/**
 * Update cumulative total for a plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {number} newTotal - New cumulative total
 */
export const updatePlanCumulativeTotal = async (userId, planId, newTotal) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');

    const databaseId = await getUserDatabaseId(userId);
    await getUserPlansCollection(databaseId).doc(planId).update({
      cumulativeTotalForPlan: newTotal,
      updatedAt: firebase.firestore.Timestamp.now()
    });

    console.log('[PlanService] Updated cumulative total for plan:', planId, newTotal);
  } catch (error) {
    console.error('[PlanService] Error updating cumulative total:', error);
    throw error;
  }
};

/**
 * Update health score for a plan
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID
 * @param {number} healthScore - Health score (0-100)
 */
export const updatePlanHealthScore = async (userId, planId, healthScore) => {
  try {
    if (!userId || !planId) throw new Error('User ID and Plan ID are required');
    if (healthScore < 0 || healthScore > 100) throw new Error('Health score must be between 0 and 100');

    const databaseId = await getUserDatabaseId(userId);
    await getUserPlansCollection(databaseId).doc(planId).update({
      healthScore: Math.round(healthScore),
      updatedAt: firebase.firestore.Timestamp.now()
    });

    console.log('[PlanService] Updated health score for plan:', planId, healthScore);
  } catch (error) {
    console.error('[PlanService] Error updating health score:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time plan updates
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function receiving plans array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPlans = (userId, callback) => {
  if (!userId) throw new Error('User ID is required');

  let unsubscribe = null;

  getUserDatabaseId(userId).then((databaseId) => {
    unsubscribe = getUserPlansCollection(databaseId)
      .orderBy('createdAt', 'desc')
      .onSnapshot((querySnapshot) => {
        const plans = [];
        querySnapshot.forEach((doc) => {
          plans.push({
            id: doc.id,
            ...doc.data(),
            targetDate: doc.data().targetDate?.toDate() || null,
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate()
          });
        });
        callback(plans);
      }, (error) => {
        console.error('[PlanService] Subscription error:', error);
        callback([]);
      });
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
};

/**
 * Get total allocation percentage across all active plans
 * @param {string} userId - User ID
 * @returns {number} Total percentage allocated
 */
export const getTotalAllocationPercentage = async (userId) => {
  try {
    const activePlans = await getActivePlans(userId);
    return activePlans.reduce((sum, plan) => sum + plan.percentageOfIncome, 0);
  } catch (error) {
    console.error('[PlanService] Error calculating total allocation:', error);
    return 0;
  }
};

/**
 * Validate if a new percentage allocation is allowed
 * @param {string} userId - User ID
 * @param {number} newPercentage - Percentage to add
 * @param {string} excludePlanId - Plan ID to exclude from total (when updating existing plan)
 * @returns {Object} { valid: boolean, currentTotal: number, newTotal: number, message: string }
 */
export const validateNewAllocation = async (userId, newPercentage, excludePlanId = null) => {
  try {
    const allPlans = await getPlans(userId);
    const activePlans = allPlans.filter(p => p.active && p.id !== excludePlanId);
    const currentTotal = activePlans.reduce((sum, p) => sum + p.percentageOfIncome, 0);
    const newTotal = currentTotal + newPercentage;

    return {
      valid: newTotal <= 100,
      currentTotal,
      newTotal,
      message: newTotal > 100
        ? `Total allocation would be ${newTotal}%. Maximum is 100%.`
        : `Valid. Total allocation will be ${newTotal}%.`
    };
  } catch (error) {
    console.error('[PlanService] Error validating allocation:', error);
    return {
      valid: false,
      currentTotal: 0,
      newTotal: 0,
      message: 'Error validating allocation'
    };
  }
};
