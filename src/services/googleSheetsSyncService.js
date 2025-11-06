import AsyncStorage from '@react-native-async-storage/async-storage';

const WEBHOOK_URL_KEY = 'googleSheetsWebhookUrl';

/**
 * Store the Google Sheets webhook URL
 */
export const saveWebhookUrl = async (url) => {
  try {
    await AsyncStorage.setItem(WEBHOOK_URL_KEY, url);
    return true;
  } catch (error) {
    // Silent fail - storage error shouldn't break the app
    throw error;
  }
};

/**
 * Get the stored Google Sheets webhook URL
 */
export const getWebhookUrl = async () => {
  try {
    const url = await AsyncStorage.getItem(WEBHOOK_URL_KEY);
    return url;
  } catch (error) {
    // Silent fail - return null if unable to get URL
    return null;
  }
};

/**
 * Remove the stored webhook URL
 */
export const clearWebhookUrl = async () => {
  try {
    await AsyncStorage.removeItem(WEBHOOK_URL_KEY);
    return true;
  } catch (error) {
    // Silent fail - storage error shouldn't break the app
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
