import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import { colors, shadows, typography } from '../theme/colors';
import { redeemPromoCode, getUserPromoStatus } from '../services/promoCodeService';

/**
 * Subscription Management Screen
 * Allows premium users to view and manage their subscription
 *
 * CURRENT STATE: Using mock data
 * NEXT STEP: Wire up to Agent 2's subscription service when ready
 *
 * Features:
 * - Premium status display
 * - Subscription details
 * - Manage subscription options
 * - Support links
 */
const SubscriptionManagementScreen = ({ navigation, route }) => {
  const { isPremium, subscriptionStatus } = useSubscription();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Promo code states - check if promo code was passed from Settings
  const [promoCode, setPromoCode] = useState(route.params?.promoCode || '');
  const [promoStatus, setPromoStatus] = useState(null);
  const [redeeming, setRedeeming] = useState(false);

  // Load promo status on mount
  useEffect(() => {
    if (user) {
      loadPromoStatus();
    }
  }, [user]);

  const loadPromoStatus = async () => {
    try {
      const status = await getUserPromoStatus(user.uid);
      setPromoStatus(status);
    } catch (error) {
      console.error('[SubscriptionManagement] Error loading promo status:', error);
    }
  };

  const handleRedeemPromoCode = async () => {
    if (!promoCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a promo code',
        position: 'bottom',
      });
      return;
    }

    setRedeeming(true);
    try {
      const result = await redeemPromoCode(promoCode.trim(), user.uid);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Success!',
          text2: result.message,
          position: 'bottom',
          visibilityTime: 4000,
        });
        setPromoCode('');
        await loadPromoStatus();
        // Navigate away or refresh
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Invalid Code',
          text2: result.message,
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('[SubscriptionManagement] Error redeeming promo code:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to redeem promo code',
        position: 'bottom',
      });
    } finally {
      setRedeeming(false);
    }
  };

  // MOCK DATA - Will be replaced with real data
  const mockSubscriptionData = {
    planName: isPremium ? 'Monthly Premium' : 'Free Plan',
    price: isPremium ? '$4.99/month' : '$0.00',
    nextBillingDate: isPremium ? 'December 7, 2025' : null,
    status: isPremium ? 'Active' : 'Free',
    trialEndsDate: null, // Set if in trial
    features: [
      { name: 'AI Saving Goals Engine', enabled: isPremium },
      { name: 'Expense Personality Reports', enabled: isPremium },
      { name: 'Smart Recommendations', enabled: isPremium },
      { name: 'Unlimited Goal Tracking', enabled: isPremium },
    ],
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'This will open the App Store subscription management when connected to RevenueCat.\n\nFor now, this is just a UI demo.'
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription?',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Mock Cancel',
              'This will cancel the subscription when connected to RevenueCat.'
            );
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@expensemonitor.app\n\nIn production, this would open your email client.'
    );
  };

  if (!isPremium) {
    // Show upgrade prompt for free users
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.freeUserContainer}>
            <LinearGradient
              colors={colors.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            >
              <Icon name="gem" size={40} color={colors.text.primary} solid />
            </LinearGradient>
            <Text style={styles.freeUserTitle}>You're on the Free Plan</Text>
            <Text style={styles.freeUserSubtitle}>
              Upgrade to Premium to unlock all features
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>

            {/* Features Preview */}
            <View style={styles.featuresPreview}>
              <Text style={styles.featuresTitle}>Premium Features:</Text>
              {mockSubscriptionData.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Icon
                    name={feature.enabled ? 'check-circle' : 'lock'}
                    size={20}
                    color={feature.enabled ? colors.income : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feature.enabled && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Promo Code Section */}
            {promoStatus?.hasPromoAccess ? (
              <View style={styles.promoActiveSection}>
                <View style={styles.promoActiveHeader}>
                  <Icon name="ticket-alt" size={24} color={colors.income} />
                  <View style={styles.promoActiveTextContainer}>
                    <Text style={styles.promoActiveTitle}>Promo Access Active</Text>
                    <Text style={styles.promoActiveCode}>Code: {promoStatus.promoCode}</Text>
                  </View>
                </View>
                <Text style={styles.promoActiveMessage}>
                  You have full access to all AI features via promo code!
                </Text>
              </View>
            ) : (
              <View style={styles.promoCodeSection}>
                <Text style={styles.promoCodeTitle}>Have a promo code?</Text>
                <Text style={styles.promoCodeSubtitle}>
                  Get free access to premium AI features
                </Text>
                <View style={styles.promoCodeInputContainer}>
                  <TextInput
                    style={styles.promoCodeInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={colors.text.tertiary}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!redeeming}
                  />
                  <TouchableOpacity
                    style={[styles.redeemButton, redeeming && styles.redeemButtonDisabled]}
                    onPress={handleRedeemPromoCode}
                    disabled={redeeming}
                  >
                    {redeeming ? (
                      <ActivityIndicator color={colors.text.primary} size="small" />
                    ) : (
                      <Text style={styles.redeemButtonText}>Redeem</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Premium user view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <Icon name="gem" size={30} color={colors.text.primary} solid />
            <Text style={styles.statusTitle}>Premium Active</Text>
            <Text style={styles.statusSubtitle}>{mockSubscriptionData.planName}</Text>
          </LinearGradient>
        </View>

        {/* Subscription Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{mockSubscriptionData.planName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>{mockSubscriptionData.price}</Text>
          </View>

          {mockSubscriptionData.nextBillingDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Billing Date</Text>
              <Text style={styles.detailValue}>
                {mockSubscriptionData.nextBillingDate}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {mockSubscriptionData.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Your Features</Text>
          {mockSubscriptionData.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon name="check-circle" size={20} color={colors.income} />
              <Text style={styles.featureText}>{feature.name}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageSubscription}
          >
            <Icon name="cog" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Manage Subscription</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Icon name="question-circle" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Contact Support</Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleCancelSubscription}
          >
            <Icon name="times-circle" size={20} color={colors.expense} />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Cancel Subscription
            </Text>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Mock Data Notice */}
        <View style={styles.mockNotice}>
          <Icon name="info-circle" size={16} color={colors.warning} />
          <Text style={styles.mockNoticeText}>
            Using mock data - Will connect to real subscriptions when Agent 2 is ready
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.glass.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    ...shadows.lg,
  },
  statusGradient: {
    padding: 30,
    alignItems: 'center',
  },
  statusTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: 15,
  },
  statusSubtitle: {
    ...typography.body,
    color: colors.text.primary,
    opacity: 0.9,
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  detailLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  detailValue: {
    ...typography.body,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: colors.glass.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.income,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.income,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureText: {
    ...typography.body,
    marginLeft: 15,
  },
  featureTextDisabled: {
    color: colors.text.tertiary,
  },
  actionsCard: {
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  actionButtonText: {
    flex: 1,
    ...typography.body,
    marginLeft: 15,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: colors.expense,
  },
  freeUserContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...shadows.glow,
  },
  freeUserTitle: {
    ...typography.h2,
    marginBottom: 10,
  },
  freeUserSubtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 40,
    ...shadows.md,
  },
  upgradeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  featuresPreview: {
    width: '100%',
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  featuresTitle: {
    ...typography.h3,
    marginBottom: 15,
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.glass.background,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  mockNoticeText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 10,
    flex: 1,
  },
  // Promo Code Styles
  promoCodeSection: {
    backgroundColor: colors.glass.background,
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  promoCodeTitle: {
    ...typography.h4,
    marginBottom: 5,
    textAlign: 'center',
  },
  promoCodeSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  promoCodeInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  promoCodeInput: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    color: colors.text.primary,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
    ...shadows.sm,
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  promoActiveSection: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    borderWidth: 2,
    borderColor: colors.income,
    ...shadows.md,
  },
  promoActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 15,
  },
  promoActiveTextContainer: {
    flex: 1,
  },
  promoActiveTitle: {
    ...typography.h4,
    color: colors.income,
    marginBottom: 4,
  },
  promoActiveCode: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  promoActiveMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default SubscriptionManagementScreen;
