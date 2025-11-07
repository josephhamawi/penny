import { db, auth } from '../config/firebase';

/**
 * Personality Report Service
 * Handles all CRUD operations for AI-generated expense personality reports
 *
 * Firestore Structure:
 * /users/{userId}/personalityReports/{reportId}
 *
 * Dependencies: Requires Agent 1 (Firestore schema) to be completed
 * Once Agent 1 is done, this service will be fully functional
 */

/**
 * Get the Firestore collection reference for user's personality reports
 * @param {string} userId - The user ID
 * @returns {FirebaseFirestore.CollectionReference}
 */
const getUserReportsCollection = (userId) => {
  return db.collection(`users/${userId}/personalityReports`);
};

/**
 * Get the latest personality report for the current user
 * @returns {Promise<Object|null>} The latest report or null if none exists
 */
export const getLatestReport = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await getUserReportsCollection(user.uid)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      generatedAt: doc.data().generatedAt?.toDate(),
    };
  } catch (error) {
    console.error('Error getting latest report:', error);
    throw error;
  }
};

/**
 * Get all personality reports for the current user (sorted by date, newest first)
 * @returns {Promise<Array>} Array of reports
 */
export const getReportHistory = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await getUserReportsCollection(user.uid)
      .orderBy('generatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      generatedAt: doc.data().generatedAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting report history:', error);
    throw error;
  }
};

/**
 * Get a personality report for a specific month
 * @param {string} month - Month in format "YYYY-MM" (e.g., "2025-11")
 * @returns {Promise<Object|null>} The report for that month or null if none exists
 */
export const getReportByMonth = async (month) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await getUserReportsCollection(user.uid)
      .where('month', '==', month)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      generatedAt: doc.data().generatedAt?.toDate(),
    };
  } catch (error) {
    console.error('Error getting report by month:', error);
    throw error;
  }
};

/**
 * Get a specific personality report by ID
 * @param {string} reportId - The report ID
 * @returns {Promise<Object|null>} The report or null if not found
 */
export const getReportById = async (reportId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const doc = await getUserReportsCollection(user.uid)
      .doc(reportId)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data(),
      generatedAt: doc.data().generatedAt?.toDate(),
    };
  } catch (error) {
    console.error('Error getting report by ID:', error);
    throw error;
  }
};

/**
 * Save a new personality report
 * @param {Object} reportData - The report data to save
 * @param {string} reportData.month - Month in format "YYYY-MM"
 * @param {string} reportData.personalityType - The personality type name
 * @param {string} reportData.summary - Summary paragraph
 * @param {Array<string>} reportData.strengths - Array of strength descriptions
 * @param {Array<string>} reportData.improvements - Array of improvement suggestions
 * @param {Array<string>} reportData.recommendations - Array of actionable recommendations
 * @param {Array<Object>} reportData.categoryInsights - Array of category insights
 * @param {Array<Object>} reportData.topCategories - Array of top spending categories
 * @param {Object} reportData.monthlyStats - Monthly financial statistics
 * @returns {Promise<string>} The ID of the created report
 */
export const savePersonalityReport = async (reportData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Check if report already exists for this month
    const existingReport = await getReportByMonth(reportData.month);
    if (existingReport) {
      throw new Error(`A report for ${reportData.month} already exists. Please delete it first or generate for a different month.`);
    }

    const reportRef = getUserReportsCollection(user.uid).doc();

    await reportRef.set({
      id: reportRef.id,
      userId: user.uid,
      ...reportData,
      generatedAt: new Date(), // Use Firebase server timestamp in production
    });

    return reportRef.id;
  } catch (error) {
    console.error('Error saving personality report:', error);
    throw error;
  }
};

/**
 * Update an existing personality report
 * @param {string} reportId - The report ID to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<void>}
 */
export const updateReport = async (reportId, updates) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await getUserReportsCollection(user.uid)
      .doc(reportId)
      .update({
        ...updates,
        updatedAt: new Date(),
      });
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Delete a personality report
 * @param {string} reportId - The report ID to delete
 * @returns {Promise<void>}
 */
export const deleteReport = async (reportId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await getUserReportsCollection(user.uid).doc(reportId).delete();
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Check if a report exists for a specific month
 * @param {string} month - Month in format "YYYY-MM"
 * @returns {Promise<boolean>} True if report exists
 */
export const reportExistsForMonth = async (month) => {
  try {
    const report = await getReportByMonth(month);
    return !!report;
  } catch (error) {
    console.error('Error checking report existence:', error);
    return false;
  }
};

/**
 * Get reports for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of reports in the date range
 */
export const getReportsByDateRange = async (startDate, endDate) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const snapshot = await getUserReportsCollection(user.uid)
      .where('generatedAt', '>=', startDate)
      .where('generatedAt', '<=', endDate)
      .orderBy('generatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      generatedAt: doc.data().generatedAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting reports by date range:', error);
    throw error;
  }
};

/**
 * Get statistics across all reports
 * @returns {Promise<Object>} Statistics object
 */
export const getReportStatistics = async () => {
  try {
    const reports = await getReportHistory();

    if (reports.length === 0) {
      return {
        totalReports: 0,
        averageSavingsRate: 0,
        bestSavingsRate: 0,
        worstSavingsRate: 0,
        totalSavings: 0,
        mostCommonPersonalityType: null,
      };
    }

    const savingsRates = reports.map(r => r.monthlyStats?.savingsRate || 0);
    const personalityTypes = reports.map(r => r.personalityType);

    // Find most common personality type
    const typeFrequency = {};
    personalityTypes.forEach(type => {
      typeFrequency[type] = (typeFrequency[type] || 0) + 1;
    });
    const mostCommonType = Object.keys(typeFrequency).reduce((a, b) =>
      typeFrequency[a] > typeFrequency[b] ? a : b
    );

    return {
      totalReports: reports.length,
      averageSavingsRate: savingsRates.reduce((a, b) => a + b, 0) / reports.length,
      bestSavingsRate: Math.max(...savingsRates),
      worstSavingsRate: Math.min(...savingsRates),
      totalSavings: reports.reduce((sum, r) => sum + (r.monthlyStats?.netSavings || 0), 0),
      mostCommonPersonalityType: mostCommonType,
    };
  } catch (error) {
    console.error('Error getting report statistics:', error);
    throw error;
  }
};

/**
 * Get the current month in YYYY-MM format
 * @returns {string} Current month
 */
export const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Format month string for display
 * @param {string} month - Month in format "YYYY-MM"
 * @returns {string} Formatted month (e.g., "November 2025")
 */
export const formatMonth = (month) => {
  const [year, monthNum] = month.split('-');
  const date = new Date(year, parseInt(monthNum) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
