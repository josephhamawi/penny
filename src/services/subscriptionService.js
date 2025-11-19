/**
 * Subscription Service
 *
 * Centralized service for managing RevenueCat subscriptions and in-app purchases.
 * Handles purchase flows, subscription status checking, and entitlement management.
 *
 * Features:
 * - Check subscription status (none, trial, active, lifetime)
 * - Fetch available offerings from RevenueCat
 * - Purchase subscriptions (monthly/lifetime)
 * - Restore previous purchases
 * - Cache subscription status for offline access
 * - Handle errors gracefully
 */

import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getUserPromoStatus } from './promoCodeService';

// Constants
const SUBSCRIPTION_CACHE_KEY = '@expense_monitor:subscription_status';
const SUBSCRIPTION_DETAILS_CACHE_KEY = '@expense_monitor:subscription_details';

/**
 * Product identifiers (must match App Store Connect)
 */
export const PRODUCT_IDS = {
  MONTHLY: 'expense_monitor_monthly',
  LIFETIME: 'expense_monitor_lifetime',
};

/**
 * Entitlement identifier (configured in RevenueCat dashboard)
 */
export const ENTITLEMENT_ID = 'premium';

/**
 * Subscription status types
 */
export const SUBSCRIPTION_STATUS = {
  NONE: 'none',           // No active subscription
  TRIAL: 'trial',         // Active free trial
  ACTIVE: 'active',       // Active paid subscription
  LIFETIME: 'lifetime',   // Lifetime purchase
  EXPIRED: 'expired',     // Subscription expired
};

/**
 * Check current subscription status
 *
 * @returns {Promise<string>} Current subscription status (none, trial, active, lifetime, expired)
 */
export const checkSubscriptionStatus = async () => {
  try {
    // DEV MODE: Enable AI features in simulator for testing
    if (__DEV__) {
      console.log('[SubscriptionService] DEV MODE: Granting premium access for testing');
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.ACTIVE);
      return SUBSCRIPTION_STATUS.ACTIVE;
    }

    const customerInfo = await Purchases.getCustomerInfo();

    // Check if user has "premium" entitlement
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!premiumEntitlement) {
      // No active entitlement
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.NONE);
      return SUBSCRIPTION_STATUS.NONE;
    }

    // Check if it's a lifetime purchase
    const isLifetime = customerInfo.activeSubscriptions.includes(PRODUCT_IDS.LIFETIME);
    if (isLifetime) {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.LIFETIME);
      return SUBSCRIPTION_STATUS.LIFETIME;
    }

    // Check if it's a trial
    if (premiumEntitlement.isActive &&
        premiumEntitlement.willRenew &&
        premiumEntitlement.periodType === 'trial') {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.TRIAL);
      return SUBSCRIPTION_STATUS.TRIAL;
    }

    // Active paid subscription
    if (premiumEntitlement.isActive) {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.ACTIVE);
      return SUBSCRIPTION_STATUS.ACTIVE;
    }

    // Entitlement exists but not active (expired)
    await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.EXPIRED);
    return SUBSCRIPTION_STATUS.EXPIRED;

  } catch (error) {
    // Suppress error in development if RevenueCat is not initialized (expected in Expo Go)
    if (__DEV__ && error.message && error.message.includes('singleton instance')) {
      // This is expected in Expo Go - RevenueCat requires EAS Build
      // Grant premium access in development for testing
      console.log('[SubscriptionService] DEV MODE: RevenueCat not initialized, granting premium access for testing');
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, SUBSCRIPTION_STATUS.ACTIVE);
      return SUBSCRIPTION_STATUS.ACTIVE;
    } else {
      console.error('[SubscriptionService] Error checking subscription:', error);
    }

    // Return cached status if available (offline fallback)
    const cachedStatus = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return cachedStatus || SUBSCRIPTION_STATUS.NONE;
  }
};

/**
 * Get available subscription offerings from RevenueCat
 *
 * @returns {Promise<Object|null>} Current offering with available packages
 */
export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('[SubscriptionService] No current offering available');
      return null;
    }

    return offerings.current;
  } catch (error) {
    console.error('[SubscriptionService] Error fetching offerings:', error);
    throw new Error('Failed to load subscription options. Please check your internet connection and try again.');
  }
};

/**
 * Purchase a subscription package
 *
 * @param {Object} packageToPurchase - The package to purchase from getOfferings()
 * @returns {Promise<Object>} Result object with success, status, and customerInfo
 */
export const purchasePackage = async (packageToPurchase) => {
  try {
    console.log('[SubscriptionService] Initiating purchase:', packageToPurchase.identifier);

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // Update subscription status
    const status = await checkSubscriptionStatus();

    // Cache the customer info
    await AsyncStorage.setItem(
      SUBSCRIPTION_DETAILS_CACHE_KEY,
      JSON.stringify(customerInfo)
    );

    console.log('[SubscriptionService] Purchase successful:', status);

    return {
      success: true,
      status,
      customerInfo,
      cancelled: false,
    };

  } catch (error) {
    // User cancelled the purchase
    if (error.userCancelled) {
      console.log('[SubscriptionService] Purchase cancelled by user');
      return {
        success: false,
        cancelled: true,
        error: 'Purchase cancelled',
      };
    }

    // Payment failed or other error
    console.error('[SubscriptionService] Purchase error:', error);

    return {
      success: false,
      cancelled: false,
      error: error.message || 'Purchase failed. Please try again.',
    };
  }
};

/**
 * Restore previous purchases
 *
 * @returns {Promise<Object>} Result object with success, status, and customerInfo
 */
export const restorePurchases = async () => {
  try {
    console.log('[SubscriptionService] Restoring purchases...');

    const customerInfo = await Purchases.restorePurchases();

    // Update subscription status
    const status = await checkSubscriptionStatus();

    // Cache the customer info
    await AsyncStorage.setItem(
      SUBSCRIPTION_DETAILS_CACHE_KEY,
      JSON.stringify(customerInfo)
    );

    console.log('[SubscriptionService] Restore successful:', status);

    return {
      success: true,
      status,
      customerInfo,
    };

  } catch (error) {
    console.error('[SubscriptionService] Restore error:', error);

    return {
      success: false,
      error: error.message || 'Failed to restore purchases. Please try again.',
    };
  }
};

/**
 * Get detailed subscription information
 *
 * @returns {Promise<Object|null>} Subscription details or null if no active subscription
 */
export const getSubscriptionDetails = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!premiumEntitlement) {
      return null;
    }

    return {
      productIdentifier: premiumEntitlement.productIdentifier,
      expirationDate: premiumEntitlement.expirationDate,
      latestPurchaseDate: premiumEntitlement.latestPurchaseDate,
      originalPurchaseDate: premiumEntitlement.originalPurchaseDate,
      isActive: premiumEntitlement.isActive,
      willRenew: premiumEntitlement.willRenew,
      periodType: premiumEntitlement.periodType, // 'normal', 'trial', 'intro'
      isSandbox: premiumEntitlement.isSandbox,
      unsubscribeDetectedAt: premiumEntitlement.unsubscribeDetectedAt,
      billingIssueDetectedAt: premiumEntitlement.billingIssueDetectedAt,
    };

  } catch (error) {
    console.error('[SubscriptionService] Error getting subscription details:', error);

    // Try to return cached details
    const cachedDetails = await AsyncStorage.getItem(SUBSCRIPTION_DETAILS_CACHE_KEY);
    if (cachedDetails) {
      const customerInfo = JSON.parse(cachedDetails);
      const premiumEntitlement = customerInfo.entitlements?.active?.[ENTITLEMENT_ID];
      if (premiumEntitlement) {
        return {
          productIdentifier: premiumEntitlement.productIdentifier,
          expirationDate: premiumEntitlement.expirationDate,
          isActive: premiumEntitlement.isActive,
          willRenew: premiumEntitlement.willRenew,
          periodType: premiumEntitlement.periodType,
        };
      }
    }

    return null;
  }
};

/**
 * Get formatted subscription info for display in UI
 *
 * @returns {Promise<Object>} Formatted subscription information
 */
export const getFormattedSubscriptionInfo = async () => {
  try {
    const status = await checkSubscriptionStatus();
    const details = await getSubscriptionDetails();

    // No subscription
    if (status === SUBSCRIPTION_STATUS.NONE) {
      return {
        planName: 'Free',
        statusText: 'Not subscribed',
        statusLabel: 'Free Plan',
        nextBillingDate: null,
        canManage: false,
        isPremium: false,
      };
    }

    // Lifetime subscription
    if (status === SUBSCRIPTION_STATUS.LIFETIME) {
      return {
        planName: 'Lifetime Premium',
        statusText: 'Lifetime Access - No Renewal Needed',
        statusLabel: 'Lifetime',
        nextBillingDate: null,
        canManage: false,
        isPremium: true,
      };
    }

    // Trial subscription
    if (status === SUBSCRIPTION_STATUS.TRIAL && details) {
      const daysLeft = Math.ceil(
        (new Date(details.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return {
        planName: 'Premium Trial',
        statusText: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`,
        statusLabel: 'Free Trial',
        nextBillingDate: details.expirationDate,
        canManage: true,
        isPremium: true,
      };
    }

    // Active paid subscription
    if (status === SUBSCRIPTION_STATUS.ACTIVE && details) {
      const nextBillingDate = new Date(details.expirationDate);
      const formattedDate = nextBillingDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        planName: 'Monthly Premium',
        statusText: details.willRenew ? `Renews ${formattedDate}` : `Expires ${formattedDate}`,
        statusLabel: details.willRenew ? 'Active' : 'Cancelled',
        nextBillingDate: details.expirationDate,
        canManage: true,
        isPremium: true,
      };
    }

    // Expired subscription
    if (status === SUBSCRIPTION_STATUS.EXPIRED && details) {
      const expirationDate = new Date(details.expirationDate);
      const formattedDate = expirationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      return {
        planName: 'Premium',
        statusText: `Expired on ${formattedDate}`,
        statusLabel: 'Expired',
        nextBillingDate: null,
        canManage: true,
        isPremium: false,
      };
    }

    // Unknown/error state
    return {
      planName: 'Unknown',
      statusText: 'Unable to load subscription status',
      statusLabel: 'Error',
      nextBillingDate: null,
      canManage: false,
      isPremium: false,
    };

  } catch (error) {
    console.error('[SubscriptionService] Error formatting subscription info:', error);

    // Return default error state
    return {
      planName: 'Error',
      statusText: 'Unable to load subscription',
      statusLabel: 'Error',
      nextBillingDate: null,
      canManage: false,
      isPremium: false,
    };
  }
};

/**
 * Open iOS subscription management
 * Opens the App Store subscriptions page
 */
export const openManageSubscription = async () => {
  try {
    const { Linking } = require('react-native');
    const url = 'https://apps.apple.com/account/subscriptions';

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error('[SubscriptionService] Cannot open subscription management URL');
    }
  } catch (error) {
    console.error('[SubscriptionService] Error opening subscription management:', error);
  }
};

/**
 * Check if user has premium access (any active subscription)
 *
 * @returns {Promise<boolean>} True if user has premium access
 */
export const hasPremiumAccess = async () => {
  const status = await checkSubscriptionStatus();
  return (
    status === SUBSCRIPTION_STATUS.TRIAL ||
    status === SUBSCRIPTION_STATUS.ACTIVE ||
    status === SUBSCRIPTION_STATUS.LIFETIME
  );
};

/**
 * Clear cached subscription data (useful for logout)
 */
export const clearSubscriptionCache = async () => {
  try {
    await AsyncStorage.multiRemove([
      SUBSCRIPTION_CACHE_KEY,
      SUBSCRIPTION_DETAILS_CACHE_KEY,
    ]);
    console.log('[SubscriptionService] Cache cleared');
  } catch (error) {
    console.error('[SubscriptionService] Error clearing cache:', error);
  }
};

/**
 * Get package by type from offerings
 *
 * @param {Object} offering - The offering from getOfferings()
 * @param {string} packageType - 'monthly' or 'lifetime'
 * @returns {Object|null} The package or null if not found
 */
export const getPackageByType = (offering, packageType) => {
  if (!offering || !offering.availablePackages) {
    return null;
  }

  // RevenueCat standard package identifiers
  const packageIdentifiers = {
    monthly: '$rc_monthly',
    lifetime: '$rc_lifetime',
  };

  const identifier = packageIdentifiers[packageType.toLowerCase()];
  if (!identifier) {
    console.warn(`[SubscriptionService] Unknown package type: ${packageType}`);
    return null;
  }

  return offering.availablePackages.find(
    pkg => pkg.identifier === identifier
  ) || null;
};

/**
 * Initialize RevenueCat SDK
 * Should be called once on app launch
 *
 * @param {string} apiKey - RevenueCat iOS API key
 * @param {string|null} userId - User ID to identify user (Firebase UID)
 */
// Track if RevenueCat is already initialized to prevent double initialization
let isRevenueCatInitialized = false;

export const initializeRevenueCat = async (apiKey, userId = null) => {
  try {
    // Prevent double initialization
    if (isRevenueCatInitialized) {
      console.log('[SubscriptionService] RevenueCat already initialized, skipping');
      return true;
    }

    console.log('[SubscriptionService] Initializing RevenueCat...');
    console.log('[SubscriptionService] Platform:', Platform.OS);
    console.log('[SubscriptionService] API Key:', apiKey ? 'present' : 'missing');

    if (!apiKey) {
      console.warn('[SubscriptionService] No API key provided - subscriptions disabled');
      return false;
    }

    // RevenueCat may not work in Expo Go - check if we're in a development build
    if (Platform.OS === 'web') {
      console.warn('[SubscriptionService] RevenueCat not supported on web');
      return false;
    }

    // Enable debug logs in development
    if (__DEV__) {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
      } catch (e) {
        console.warn('[SubscriptionService] Could not set log level:', e.message);
      }
    }

    // Configure SDK with proper syntax
    try {
      Purchases.configure({
        apiKey: apiKey,
        appUserID: userId || undefined,
      });

      isRevenueCatInitialized = true;
      console.log('[SubscriptionService] RevenueCat configured successfully');

      return true;
    } catch (configError) {
      console.error('[SubscriptionService] Configure failed:', configError.message);
      console.warn('[SubscriptionService] Subscription features will be unavailable');
      console.warn('[SubscriptionService] Note: RevenueCat may not work in Expo Go - use EAS Build for production');
      return false;
    }

  } catch (error) {
    console.error('[SubscriptionService] Failed to initialize RevenueCat:', error.message);
    console.warn('[SubscriptionService] App will continue without subscription features');
    return false;
  }
};

/**
 * Log in user to RevenueCat
 * Associates purchases with a specific user ID
 *
 * @param {string} userId - User ID (Firebase UID)
 */
export const loginUser = async (userId) => {
  try {
    if (!userId) {
      console.warn('[SubscriptionService] Cannot login: userId is null');
      return;
    }

    console.log('[SubscriptionService] Logging in user to RevenueCat:', userId);
    const { customerInfo } = await Purchases.logIn(userId);

    // Check and cache subscription status
    await checkSubscriptionStatus();

    console.log('[SubscriptionService] User logged in successfully');
    return customerInfo;

  } catch (error) {
    console.error('[SubscriptionService] Error logging in user:', error);
  }
};

/**
 * Log out user from RevenueCat
 * Call this when user logs out of the app
 */
export const logoutUser = async () => {
  try {
    console.log('[SubscriptionService] Logging out user from RevenueCat');
    await Purchases.logOut();
    await clearSubscriptionCache();
    console.log('[SubscriptionService] User logged out successfully');
  } catch (error) {
    console.error('[SubscriptionService] Error logging out user:', error);
  }
};

// Export all methods
export default {
  // Core methods
  checkSubscriptionStatus,
  getOfferings,
  purchasePackage,
  restorePurchases,

  // Details and info
  getSubscriptionDetails,
  getFormattedSubscriptionInfo,
  hasPremiumAccess,

  // Package helpers
  getPackageByType,

  // User management
  initializeRevenueCat,
  loginUser,
  logoutUser,

  // Utility
  openManageSubscription,
  clearSubscriptionCache,
  hasAIFeatureAccess,

  // Constants
  PRODUCT_IDS,
  ENTITLEMENT_ID,
  SUBSCRIPTION_STATUS,
};

/**
 * Check if user has AI feature access (subscription OR promo code)
 *
 * @param {string} userId - The user ID to check
 * @returns {Promise<{hasAccess: boolean, source: 'subscription'|'promo'|'none', promoCode?: string}>}
 */
export async function hasAIFeatureAccess(userId) {
  try {
    // First check promo access (faster, no RevenueCat call needed)
    const promoStatus = await getUserPromoStatus(userId);

    if (promoStatus.hasPromoAccess) {
      console.log('[SubscriptionService] AI access granted via promo code:', promoStatus.promoCode);
      return {
        hasAccess: true,
        source: 'promo',
        promoCode: promoStatus.promoCode
      };
    }

    // Check subscription status
    const status = await checkSubscriptionStatus();

    const hasSubscription = [
      SUBSCRIPTION_STATUS.TRIAL,
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.LIFETIME
    ].includes(status);

    if (hasSubscription) {
      console.log('[SubscriptionService] AI access granted via subscription:', status);
      return {
        hasAccess: true,
        source: 'subscription'
      };
    }

    // No access
    return {
      hasAccess: false,
      source: 'none'
    };

  } catch (error) {
    console.error('[SubscriptionService] Error checking AI feature access:', error);
    return {
      hasAccess: false,
      source: 'none'
    };
  }
}
