import AsyncStorage from '@react-native-async-storage/async-storage';
import { importFromGoogleSheets } from './googleSheetsService';
import { getWebhookUrl } from './googleSheetsSyncService';
import { getUserDatabaseId } from './invitationService';
import { auth } from '../config/firebase';

// Keys for storing polling state
const POLLING_ENABLED_KEY = '@penny:polling_enabled';
const LAST_SYNC_KEY = '@penny:last_sync_timestamp';

// Polling interval (in milliseconds)
const POLLING_INTERVAL = 60000; // 1 minute

let pollingInterval = null;
let isPolling = false;

/**
 * Start polling Google Sheets for changes
 */
export const startSheetPolling = async () => {
  try {
    // Check if polling is enabled
    const enabled = await isPollingEnabled();
    if (!enabled) {
      console.log('[SheetPolling] Polling is disabled');
      return;
    }

    // Stop any existing polling
    stopSheetPolling();

    console.log('[SheetPolling] Starting sheet polling (every 60 seconds)');
    isPolling = true;

    // Do initial check immediately
    await checkForSheetChanges();

    // Then poll every minute
    pollingInterval = setInterval(async () => {
      if (isPolling) {
        await checkForSheetChanges();
      }
    }, POLLING_INTERVAL);

    // Save that polling is active
    await AsyncStorage.setItem(POLLING_ENABLED_KEY, 'true');
  } catch (error) {
    console.error('[SheetPolling] Error starting polling:', error);
  }
};

/**
 * Stop polling Google Sheets
 */
export const stopSheetPolling = () => {
  if (pollingInterval) {
    console.log('[SheetPolling] Stopping sheet polling');
    clearInterval(pollingInterval);
    pollingInterval = null;
    isPolling = false;
  }
};

/**
 * Check if polling is enabled
 */
export const isPollingEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(POLLING_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Enable polling
 */
export const enablePolling = async () => {
  await AsyncStorage.setItem(POLLING_ENABLED_KEY, 'true');
  await startSheetPolling();
};

/**
 * Disable polling
 */
export const disablePolling = async () => {
  await AsyncStorage.setItem(POLLING_ENABLED_KEY, 'false');
  stopSheetPolling();
};

/**
 * Check Google Sheets for changes and import if needed
 */
const checkForSheetChanges = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('[SheetPolling] No user authenticated, skipping check');
      return;
    }

    // Get the webhook URL (which should be the Google Sheets URL)
    const webhookUrl = await getWebhookUrl();
    if (!webhookUrl) {
      console.log('[SheetPolling] No webhook URL configured, skipping check');
      return;
    }

    // Only poll if it's a Google Sheets URL (not a webhook URL)
    const isSheetUrl = webhookUrl.includes('docs.google.com/spreadsheets');
    if (!isSheetUrl) {
      console.log('[SheetPolling] URL is not a Google Sheets URL, skipping polling');
      return;
    }

    console.log('[SheetPolling] Checking Google Sheets for changes...');

    // Get the database ID
    const databaseId = await getUserDatabaseId(user.uid);

    // Fetch sheet data to check for changes
    const { spreadsheetId, gid } = parseGoogleSheetsUrl(webhookUrl);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

    const response = await fetch(csvUrl);
    if (!response.ok) {
      console.log('[SheetPolling] Failed to fetch sheet data');
      return;
    }

    const csvText = await response.text();
    const currentHash = hashString(csvText);

    // Get last known hash
    const lastHash = await AsyncStorage.getItem(`${LAST_SYNC_KEY}_hash`);

    if (lastHash === currentHash) {
      console.log('[SheetPolling] No changes detected in Google Sheets');
      return;
    }

    console.log('[SheetPolling] Changes detected! Importing from Google Sheets...');

    // Import changes silently (don't show toast)
    const count = await importFromGoogleSheets(webhookUrl, databaseId, null, null);

    console.log(`[SheetPolling] ✓ Imported ${count} expenses from Google Sheets`);

    // Save new hash
    await AsyncStorage.setItem(`${LAST_SYNC_KEY}_hash`, currentHash);
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  } catch (error) {
    console.error('[SheetPolling] Error checking for changes:', error);
    // Don't throw - polling should continue even if one check fails
  }
};

/**
 * Parse Google Sheets URL to get spreadsheet ID and GID
 */
const parseGoogleSheetsUrl = (url) => {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) {
    throw new Error('Invalid Google Sheets URL');
  }
  const spreadsheetId = idMatch[1];

  const gidMatch = url.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return { spreadsheetId, gid };
};

/**
 * Simple string hash function
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    return null;
  }
};
