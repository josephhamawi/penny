/**
 * useSubscription Hook
 *
 * React hook for managing subscription state in components.
 * Automatically checks subscription status when user changes and
 * provides easy access to premium status.
 *
 * Usage:
 *   const { status, isPremium, loading, refresh } = useSubscription();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!isPremium) return <PaywallScreen />;
 *   return <PremiumFeature />;
 */

import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  checkSubscriptionStatus,
  SUBSCRIPTION_STATUS,
} from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing subscription state
 *
 * @returns {Object} Subscription state and utilities
 */
export const useSubscription = () => {
  const [status, setStatus] = useState(SUBSCRIPTION_STATUS.NONE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  /**
   * Load subscription status
   */
  const loadStatus = useCallback(async () => {
    if (!user) {
      setStatus(SUBSCRIPTION_STATUS.NONE);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const subscriptionStatus = await checkSubscriptionStatus();
      setStatus(subscriptionStatus);

      console.log('[useSubscription] Status loaded:', subscriptionStatus);
    } catch (err) {
      console.error('[useSubscription] Error loading status:', err);
      setError(err.message || 'Failed to load subscription status');
      // Keep previous status on error (don't reset to NONE)
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Initial load when user changes
   */
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  /**
   * Refresh subscription status when app comes to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && user) {
        console.log('[useSubscription] App became active, refreshing status...');
        // Don't set loading for background refresh
        try {
          const subscriptionStatus = await checkSubscriptionStatus();
          setStatus(subscriptionStatus);
        } catch (err) {
          console.error('[useSubscription] Error refreshing status:', err);
        }
      }
    });

    return () => subscription.remove();
  }, [user]);

  /**
   * Periodic status check (every 5 minutes)
   * Useful for detecting subscription changes and expirations
   */
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(async () => {
      try {
        console.log('[useSubscription] Periodic status check...');
        const newStatus = await checkSubscriptionStatus();

        if (newStatus !== status) {
          console.log('[useSubscription] Status changed:', status, '->', newStatus);
          setStatus(newStatus);
        }
      } catch (err) {
        console.error('[useSubscription] Error in periodic check:', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(checkInterval);
  }, [user, status]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  /**
   * Check if user has premium access
   */
  const isPremium =
    status === SUBSCRIPTION_STATUS.TRIAL ||
    status === SUBSCRIPTION_STATUS.ACTIVE ||
    status === SUBSCRIPTION_STATUS.LIFETIME;

  /**
   * Check if subscription is expired
   */
  const isExpired = status === SUBSCRIPTION_STATUS.EXPIRED;

  /**
   * Check if user is on trial
   */
  const isTrial = status === SUBSCRIPTION_STATUS.TRIAL;

  /**
   * Check if user has lifetime access
   */
  const isLifetime = status === SUBSCRIPTION_STATUS.LIFETIME;

  /**
   * Check if user is on active paid subscription
   */
  const isActivePaid = status === SUBSCRIPTION_STATUS.ACTIVE;

  return {
    // State
    status,
    loading,
    error,

    // Premium checks
    isPremium,
    isExpired,
    isTrial,
    isLifetime,
    isActivePaid,

    // Utilities
    refresh,
  };
};

/**
 * Hook for checking if premium is required for a feature
 * Shows helpful logging for feature gating
 *
 * @param {string} featureName - Name of the feature being gated
 * @returns {Object} Premium status and utilities
 */
export const usePremiumFeature = (featureName) => {
  const subscription = useSubscription();

  useEffect(() => {
    if (!subscription.loading && !subscription.isPremium) {
      console.log(`[usePremiumFeature] Feature "${featureName}" requires premium access`);
    }
  }, [subscription.loading, subscription.isPremium, featureName]);

  return {
    ...subscription,
    isLocked: !subscription.isPremium,
    canAccess: subscription.isPremium,
  };
};

export default useSubscription;
