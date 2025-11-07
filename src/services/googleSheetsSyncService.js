import { db, auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key for webhook URL
const WEBHOOK_CACHE_KEY = '@spensely:webhook_url';

// Helper to get user's webhook document
const getUserWebhookDoc = (userId) => {
  if (!userId) throw new Error('User ID is required');
  return db.doc(`users/${userId}/settings/webhookUrl`);
};

/**
 * Store the Google Sheets webhook URL
 * Saves to both Firestore (persistent) and AsyncStorage (cache)
 */
export const saveWebhookUrl = async (url) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Save to Firestore (primary storage)
    await getUserWebhookDoc(user.uid).set({
      url: url,
      updatedAt: new Date()
    });

    // Update cache for faster subsequent access
    await AsyncStorage.setItem(WEBHOOK_CACHE_KEY, url);
    console.log('[GoogleSheets] Webhook URL saved to database and cache');

    return true;
  } catch (error) {
    console.error('Error saving webhook URL:', error);
    throw error;
  }
};

/**
 * Get the stored Google Sheets webhook URL
 * Checks cache first, falls back to Firestore if not found
 */
export const getWebhookUrl = async (userId = null) => {
  try {
    const targetUserId = userId || auth.currentUser?.uid;
    if (!targetUserId) return null;

    // Try cache first for faster access
    const cachedUrl = await AsyncStorage.getItem(WEBHOOK_CACHE_KEY);
    if (cachedUrl) {
      console.log('[GoogleSheets] Webhook URL loaded from cache');
      return cachedUrl;
    }

    // Cache miss - load from Firestore
    console.log('[GoogleSheets] Cache miss - loading from database');
    const doc = await getUserWebhookDoc(targetUserId).get();
    if (doc.exists) {
      const url = doc.data().url || null;

      // Update cache for next time
      if (url) {
        await AsyncStorage.setItem(WEBHOOK_CACHE_KEY, url);
        console.log('[GoogleSheets] Webhook URL cached for future access');
      }

      return url;
    }
    return null;
  } catch (error) {
    console.error('Error getting webhook URL:', error);
    return null;
  }
};

/**
 * Remove the stored webhook URL
 * Clears both Firestore and AsyncStorage cache
 */
export const clearWebhookUrl = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Delete from Firestore (primary storage)
    await getUserWebhookDoc(user.uid).delete();

    // Clear cache
    await AsyncStorage.removeItem(WEBHOOK_CACHE_KEY);
    console.log('[GoogleSheets] Webhook URL cleared from database and cache');

    return true;
  } catch (error) {
    console.error('Error clearing webhook URL:', error);
    throw error;
  }
};

/**
 * Format date as MM/DD/YYYY for Google Sheets
 */
const formatDateForSheets = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Send expense data to Google Sheets via webhook
 */
export const syncExpenseToSheets = async (expense, action = 'add') => {
  try {
    const webhookUrl = await getWebhookUrl();

    if (!webhookUrl) {
      // No webhook configured, skip sync
      return { success: true, skipped: true };
    }

    const data = {
      action: action, // 'add', 'update', or 'delete'
      ref: expense.ref,
      date: formatDateForSheets(expense.date),
      description: expense.description,
      category: expense.category,
      in: expense.inAmount || 0,
      out: expense.outAmount || 0,
      balance: expense.balance || 0
    };

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Silent fail - sync failure shouldn't break the app
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    // Silently fail - sync is optional, main data is already in Firebase
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout' };
    }
    // Don't throw - we don't want to block the main operation if sync fails
    return { success: false, error: error.message };
  }
};

/**
 * Batch sync multiple expenses to Google Sheets
 */
export const batchSyncToSheets = async (expenses) => {
  try {
    const webhookUrl = await getWebhookUrl();

    if (!webhookUrl) {
      return { success: true, skipped: true };
    }

    const data = {
      action: 'batch',
      expenses: expenses.map(expense => ({
        ref: expense.ref,
        date: formatDateForSheets(expense.date),
        description: expense.description,
        category: expense.category,
        in: expense.inAmount || 0,
        out: expense.outAmount || 0,
        balance: expense.balance || 0
      }))
    };

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Silent fail - sync failure shouldn't break the app
      return { success: false, error: `HTTP ${response.status}` };
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    // Silently fail - sync is optional, main data is already in Firebase
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout' };
    }
    return { success: false, error: error.message };
  }
};

/**
 * Clear webhook cache (useful for logout)
 * Call this when user logs out to prevent cache leakage between users
 */
export const clearWebhookCache = async () => {
  try {
    await AsyncStorage.removeItem(WEBHOOK_CACHE_KEY);
    console.log('[GoogleSheets] Webhook cache cleared');
  } catch (error) {
    console.error('Error clearing webhook cache:', error);
  }
};
