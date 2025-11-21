import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_ENABLED_KEY = '@notifications_enabled';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check if notifications are enabled by user
 */
export const areNotificationsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('[Notifications] Error checking enabled status:', error);
    return false;
  }
};

/**
 * Set notification enabled status
 */
export const setNotificationsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, enabled.toString());

    if (enabled) {
      // Request permissions when enabling
      await registerForPushNotifications();
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error setting enabled status:', error);
    return false;
  }
};

/**
 * Register for push notifications
 * Returns the Expo push token if successful
 */
export const registerForPushNotifications = async () => {
  let token;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If still not granted, return null
    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Get Expo push token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[Notifications] Push token:', token);

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00D9FF',
      });
    }

    return token;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Check notification permissions
 */
export const checkNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[Notifications] Error checking permissions:', error);
    return false;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (title, body, data = {}, delaySeconds = 0) => {
  try {
    const enabled = await areNotificationsEnabled();
    if (!enabled) {
      console.log('[Notifications] Notifications are disabled by user');
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
    });

    console.log('[Notifications] Scheduled notification:', id);
    return id;
  } catch (error) {
    console.error('[Notifications] Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('[Notifications] Error canceling notification:', error);
    return false;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('[Notifications] Error canceling all notifications:', error);
    return false;
  }
};
