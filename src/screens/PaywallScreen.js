import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, typography } from '../theme/colors';

/**
 * Paywall Screen
 * Beautiful, conversion-optimized subscription screen
 *
 * CURRENT STATE: Using mock data
 * NEXT STEP: Wire up to Agent 2's subscription service when ready
 *
 * Features:
 * - Clean, modern design with gradient header
 * - Clear value proposition
 * - Two subscription tiers (Monthly with trial, Lifetime)
 * - Restore purchases functionality
 * - Legal links
 */
const PaywallScreen = ({ navigation, route }) => {
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // MOCK DATA - Will be replaced with real subscription service
  const mockOfferings = {
    monthly: {
      identifier: '$rc_monthly',
      price: '$4.99',
      priceString: '$4.99/month',
      description: '14-day free trial',
      buttonText: 'Start Free Trial',
    },
    lifetime: {
      identifier: 'expense_monitor_lifetime',
      price: '$149.99',
      priceString: '$149.99 one-time',
      description: 'One-time payment',
      buttonText: 'Buy Lifetime Access',
    },
  };

  const handlePurchase = async (packageType) => {
    setPurchasing(true);

    // MOCK: Simulate purchase process
    setTimeout(() => {
      setPurchasing(false);
      Alert.alert(
        'Mock Purchase',
        `This will purchase the ${packageType} plan when connected to RevenueCat.\n\nFor now, this is just a UI demo.`,
        [
          {
            text: 'Got it',
            onPress: () => {
              // In real implementation, navigate back on success
              // navigation.goBack();
            },
          },
        ]
      );
    }, 1500);
  };

  const handleRestore = async () => {
    setRestoring(true);

    // MOCK: Simulate restore process
    setTimeout(() => {
      setRestoring(false);
      Alert.alert(
        'Mock Restore',
        'This will restore purchases when connected to RevenueCat.\n\nFor now, this is just a UI demo.'
      );
    }, 1500);
  };

  const openURL = (url) => {
    Alert.alert(
      'External Link',
      `In production, this would open: ${url}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open',
          onPress: () => {
            // Linking.openURL(url);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="times" size={24} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Header with Gradient Icon Background */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientIcon}
          >
            <Icon name="gem" size={40} color={colors.text.primary} solid />
          </LinearGradient>
        </View>
        <Text style={styles.title}>Unlock AI-Powered Insights</Text>
        <Text style={styles.subtitle}>
          Get personalized financial guidance and achieve your savings goals faster
        </Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresSection}>
        {[
          'AI Saving Goals Engine with predictive analytics',
          'Personalized Expense Personality Reports',
          'Smart spending recommendations',
          'Unlimited goal tracking',
        ].map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={14} color={colors.text.primary} />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Subscription Cards */}
      <View style={styles.plansSection}>
        {/* Monthly Plan - MOST POPULAR */}
        <TouchableOpacity
          style={[styles.planCard, styles.popularPlan]}
          onPress={() => handlePurchase('monthly')}
          disabled={purchasing}
          activeOpacity={0.8}
        >
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>{mockOfferings.monthly.priceString}</Text>
          <Text style={styles.trialText}>{mockOfferings.monthly.description}</Text>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.purchaseButton}
          >
            {purchasing ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.buttonText}>{mockOfferings.monthly.buttonText}</Text>
            )}
          </LinearGradient>
          <Text style={styles.disclaimer}>Cancel anytime</Text>
        </TouchableOpacity>

        {/* Lifetime Plan */}
        <TouchableOpacity
          style={styles.planCard}
          onPress={() => handlePurchase('lifetime')}
          disabled={purchasing}
          activeOpacity={0.8}
        >
          <Text style={styles.planName}>Lifetime</Text>
          <Text style={styles.planPrice}>{mockOfferings.lifetime.priceString}</Text>
          <Text style={styles.trialText}>{mockOfferings.lifetime.description}</Text>
          <View style={styles.lifetimeButton}>
            {purchasing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                {mockOfferings.lifetime.buttonText}
              </Text>
            )}
          </View>
          <Text style={styles.disclaimer}>Best value - pay once, use forever</Text>
        </TouchableOpacity>
      </View>

      {/* Restore Purchases */}
      <TouchableOpacity onPress={handleRestore} disabled={restoring}>
        <Text style={styles.restoreText}>
          {restoring ? 'Restoring...' : 'Restore Purchases'}
        </Text>
      </TouchableOpacity>

      {/* Legal Links */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => openURL('https://yourusername.github.io/Expenses/legal/terms.html')}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>•</Text>
        <TouchableOpacity onPress={() => openURL('https://yourusername.github.io/Expenses/legal/privacy-policy.html')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  gradientIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    ...typography.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 30,
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.income,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureText: {
    ...typography.body,
    flex: 1,
    lineHeight: 22,
  },
  plansSection: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.lg,
    position: 'relative',
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.glass.background,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    position: 'absolute',
    top: -12,
  },
  popularText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  planName: {
    ...typography.h3,
    marginTop: 10,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 5,
  },
  trialText: {
    ...typography.caption,
    marginTop: 5,
  },
  purchaseButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lifetimeButton: {
    backgroundColor: colors.glass.background,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    ...typography.small,
    marginTop: 10,
  },
  restoreText: {
    textAlign: 'center',
    color: colors.primary,
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
  separator: {
    color: colors.text.tertiary,
    marginHorizontal: 10,
    fontSize: 14,
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: colors.glass.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  mockNoticeText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 10,
    flex: 1,
  },
});

export default PaywallScreen;
