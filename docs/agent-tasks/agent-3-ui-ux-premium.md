# Agent 3: UI/UX Developer (Premium Experience)

## 🎯 Mission
Design and implement beautiful, conversion-optimized premium UI including paywall with subscription tiers, diamond premium indicator, subscription management screen, and subtle upgrade prompts throughout the app.

---

## 📋 Assignment Overview

**Epic:** Epic 3 - Premium UI & Paywall Experience + Epic 1 Story 1.5
**Timeline:** 1.5 weeks (8 business days)
**Priority:** HIGH - Critical for user conversions and premium experience
**Dependencies:**
- Requires Agent 1 Story 1.1 complete (user profile data)
- Requires Agent 2 complete (subscription service and hooks)

---

## 🔨 Stories Assigned

### ✅ Story 3.1: Create Paywall Screen with Subscription Tiers

**As a** non-subscribed user,
**I want** to see a clear paywall with subscription options when I tap locked features,
**so that** I understand the value and pricing of premium features.

#### Acceptance Criteria
1. ✓ Paywall screen displays heading: "Unlock AI-Powered Insights"
2. ✓ Feature list shown with checkmarks:
   - "AI Saving Goals Engine with predictive analytics"
   - "Personalized Expense Personality Reports"
   - "Smart spending recommendations"
   - "Unlimited goal tracking"
3. ✓ Two subscription cards displayed side-by-side or stacked:
   - **Monthly:** "$10/month" with "Start 14-Day Free Trial" button
   - **Lifetime:** "$199 one-time" with "Buy Lifetime Access" button
4. ✓ "Restore Purchases" link at bottom
5. ✓ "Terms of Service" and "Privacy Policy" links
6. ✓ Close button to dismiss paywall
7. ✓ Paywall uses modern card-based design matching app aesthetic

#### Implementation Guidance

**Create `/src/screens/PaywallScreen.js`:**

```javascript
import React, { useState, useEffect } from 'react';
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
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '../services/subscriptionService';

const PaywallScreen = ({ navigation, route }) => {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const currentOfferings = await getOfferings();
      setOfferings(currentOfferings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase) => {
    setPurchasing(true);
    try {
      const result = await purchasePackage(packageToPurchase);

      if (result.cancelled) {
        // User cancelled - do nothing
        return;
      }

      if (result.success) {
        Alert.alert('Success!', 'Welcome to Premium! 🎉', [
          {
            text: 'Start Using',
            onPress: () => navigation.goBack(), // Return to feature they wanted
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();

      if (result.status === 'none') {
        Alert.alert('No Purchases Found', 'No previous purchases found on this account.');
      } else {
        Alert.alert('Success', 'Subscription restored successfully!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  const monthlyPackage = offerings?.availablePackages.find(
    (p) => p.identifier === '$rc_monthly'
  );
  const lifetimePackage = offerings?.availablePackages.find(
    (p) => p.identifier === 'expense_monitor_lifetime'
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Icon name="times" size={24} color="#333" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Icon name="gem" size={60} color="#1976D2" />
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
            <Icon name="check-circle" size={20} color="#00BFA6" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Subscription Cards */}
      <View style={styles.plansSection}>
        {/* Monthly Plan */}
        {monthlyPackage && (
          <TouchableOpacity
            style={[styles.planCard, styles.popularPlan]}
            onPress={() => handlePurchase(monthlyPackage)}
            disabled={purchasing}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
            <Text style={styles.planName}>Monthly</Text>
            <Text style={styles.planPrice}>$10/month</Text>
            <Text style={styles.trialText}>14-day free trial</Text>
            <View style={styles.purchaseButton}>
              {purchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Start Free Trial</Text>
              )}
            </View>
            <Text style={styles.disclaimer}>Cancel anytime</Text>
          </TouchableOpacity>
        )}

        {/* Lifetime Plan */}
        {lifetimePackage && (
          <TouchableOpacity
            style={styles.planCard}
            onPress={() => handlePurchase(lifetimePackage)}
            disabled={purchasing}
          >
            <Text style={styles.planName}>Lifetime</Text>
            <Text style={styles.planPrice}>$199</Text>
            <Text style={styles.trialText}>One-time payment</Text>
            <View style={[styles.purchaseButton, styles.lifetimeButton]}>
              {purchasing ? (
                <ActivityIndicator color="#1976D2" />
              ) : (
                <Text style={[styles.buttonText, { color: '#1976D2' }]}>
                  Buy Lifetime Access
                </Text>
              )}
            </View>
            <Text style={styles.disclaimer}>Best value - save 75%</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Restore Purchases */}
      <TouchableOpacity onPress={handleRestore} disabled={restoring}>
        <Text style={styles.restoreText}>
          {restoring ? 'Restoring...' : 'Restore Purchases'}
        </Text>
      </TouchableOpacity>

      {/* Legal Links */}
      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourapp.com/terms')}>
          <Text style={styles.linkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>•</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourapp.com/privacy')}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 30,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  plansSection: {
    marginBottom: 30,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  popularBadge: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    position: 'absolute',
    top: -12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 5,
  },
  trialText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  purchaseButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  lifetimeButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  restoreText: {
    textAlign: 'center',
    color: '#1976D2',
    fontSize: 16,
    marginTop: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#1976D2',
    fontSize: 14,
  },
  separator: {
    color: '#999',
    marginHorizontal: 10,
  },
});

export default PaywallScreen;
```

**Add route to AppNavigator:**
```javascript
// In your navigation stack
<Stack.Screen
  name="Paywall"
  component={PaywallScreen}
  options={{
    presentation: 'modal',
    headerShown: false
  }}
/>
```

**Files to Create:**
- `/src/screens/PaywallScreen.js`

**Files to Modify:**
- `/src/navigation/AppNavigator.js` (add paywall route)

---

### ✅ Story 3.2: Add Diamond Premium Indicator for Subscribed Users

**As a** subscribed user,
**I want** to see a diamond icon indicating my premium status,
**so that** I feel recognized for my subscription.

#### Acceptance Criteria
1. ✓ Diamond-shaped icon displayed in top-right corner of main screens
2. ✓ Icon uses subtle gold/teal gradient (#FFD700 to #00BFA6)
3. ✓ Icon size: 24x24 px, non-intrusive
4. ✓ Icon visible on: Home, Goals Dashboard, Personality Report screens
5. ✓ Icon only shown when `subscriptionStatus === 'active' || 'trial' || 'lifetime'`
6. ✓ Tapping icon opens subscription details modal (optional enhancement)
7. ✓ Icon animated with subtle pulse on first app launch after purchase

#### Implementation Guidance

**Create `/src/components/PremiumBadge.js`:**

```javascript
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../hooks/useSubscription';

const PremiumBadge = ({ onPress }) => {
  const { isPremium } = useSubscription();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation on mount
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!isPremium) return null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['#FFD700', '#00BFA6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Icon name="gem" size={16} color="#FFF" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PremiumBadge;
```

**Add to HomeScreen header:**
```javascript
// In HomeScreen.js
import PremiumBadge from '../components/PremiumBadge';

// In your header:
<View style={styles.header}>
  <Text style={styles.headerTitle}>Expenses</Text>
  <PremiumBadge onPress={() => navigation.navigate('SubscriptionManagement')} />
</View>
```

**Files to Create:**
- `/src/components/PremiumBadge.js`

**Files to Modify:**
- `/src/screens/HomeScreen.js`
- Any other screens where badge should appear

---

### ✅ Story 3.3: Implement Lock Icons and Upgrade CTAs for Free Users

**As a** free user,
**I want** to see which features require premium,
**so that** I know what I'll get if I upgrade.

#### Acceptance Criteria
1. ✓ "Goals" tab shows lock icon if user is not subscribed
2. ✓ "Personality Report" card on Home screen shows "Premium" badge and lock icon
3. ✓ Tapping any locked feature shows paywall modal
4. ✓ Lock icons use consistent styling (gray with white lock symbol)
5. ✓ Subtle "Upgrade to Premium" banner at top of Home screen for free users (dismissible)
6. ✓ Banner shows once per session, not on every screen load
7. ✓ All locked features remain visible (not hidden) to encourage discovery

#### Implementation Guidance

**Create `/src/components/LockedFeatureCard.js`:**

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const LockedFeatureCard = ({ title, description, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={32} color="#1976D2" />
        <View style={styles.lockBadge}>
          <Icon name="lock" size={12} color="#FFF" />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default LockedFeatureCard;
```

**Add to HomeScreen:**
```javascript
import { useSubscription } from '../hooks/useSubscription';
import LockedFeatureCard from '../components/LockedFeatureCard';

// Inside HomeScreen component:
const { isPremium } = useSubscription();

// In your render:
{!isPremium && (
  <>
    <LockedFeatureCard
      title="Savings Goals"
      description="Set goals and get AI-powered recommendations to achieve them faster"
      icon="bullseye"
      onPress={() => navigation.navigate('Paywall')}
    />
    <LockedFeatureCard
      title="Expense Personality"
      description="Get monthly insights about your spending habits and personality"
      icon="user-chart"
      onPress={() => navigation.navigate('Paywall')}
    />
  </>
)}
```

**Create dismissible upgrade banner:**
```javascript
// Add to HomeScreen
const [showBanner, setShowBanner] = useState(true);

{!isPremium && showBanner && (
  <View style={styles.upgradeBanner}>
    <Icon name="star" size={20} color="#FFD700" />
    <Text style={styles.bannerText}>
      Unlock AI insights and savings goals!
    </Text>
    <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
      <Text style={styles.upgradeButton}>Upgrade</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => setShowBanner(false)}>
      <Icon name="times" size={20} color="#999" />
    </TouchableOpacity>
  </View>
)}
```

**Files to Create:**
- `/src/components/LockedFeatureCard.js`

**Files to Modify:**
- `/src/screens/HomeScreen.js`

---

### ✅ Story 3.4: Create Subscription Management Screen

**As a** subscribed user,
**I want** a dedicated screen to manage my subscription,
**so that** I can view my plan details and manage billing.

#### Implementation guidance continues in the full file...

**Files to Create:**
- `/src/screens/SubscriptionManagementScreen.js`

---

### ✅ Story 3.5: Add Premium Feature Teasers on Home Screen

[Content similar to Story 3.3 but with blurred previews]

---

### ✅ Story 1.5: Add User Profile Display in Settings

**As a** user,
**I want** to see my profile information (name, email, photo) in Settings,
**so that** I can verify my account details and update them if needed.

#### Note: This was already implemented in the existing SettingsScreen. Verify it works correctly with multi-user authentication.

---

## 📦 Deliverables

1. **Paywall Screen** - Beautiful, conversion-optimized subscription screen
2. **Premium Badge Component** - Diamond indicator for subscribed users
3. **Locked Feature Components** - Lock icons and upgrade CTAs
4. **Subscription Management Screen** - View and manage subscription
5. **Premium Teasers** - Blurred previews on Home screen

---

## 🚦 Definition of Done

- [ ] All 5 stories + Story 1.5 completed with acceptance criteria met
- [ ] Designs match modern iOS aesthetic (blue theme, cards, gradients)
- [ ] Paywall conversion-optimized (clear value prop, easy purchase flow)
- [ ] All screens responsive on iPhone SE and Pro Max
- [ ] Code reviewed and merged
- [ ] Demo prepared showing full premium experience

---

**Ready to start? Questions?**

Contact: Product Manager (John) for clarification
PRD Reference: `/docs/prd.md` - Epic 3
