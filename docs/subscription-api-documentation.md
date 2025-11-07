# Subscription Service API Documentation

Complete reference for using the subscription service and hooks in the Expense Monitor app.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Subscription Service Methods](#subscription-service-methods)
3. [React Hooks](#react-hooks)
4. [Usage Examples](#usage-examples)
5. [Constants](#constants)
6. [Error Handling](#error-handling)

---

## Quick Start

### Import the Hook

```javascript
import { useSubscription } from '../hooks/useSubscription';

function MyComponent() {
  const { isPremium, loading, status } = useSubscription();

  if (loading) return <LoadingSpinner />;
  if (!isPremium) return <PaywallScreen />;

  return <PremiumFeature />;
}
```

### Import the Service

```javascript
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkSubscriptionStatus,
} from '../services/subscriptionService';
```

---

## Subscription Service Methods

### Core Methods

#### `checkSubscriptionStatus()`

Checks the current subscription status of the user.

**Returns:** `Promise<string>` - One of: `'none'`, `'trial'`, `'active'`, `'lifetime'`, `'expired'`

**Example:**
```javascript
const status = await checkSubscriptionStatus();
console.log(status); // 'trial'
```

**Behavior:**
- Fetches fresh data from RevenueCat
- Caches result in AsyncStorage for offline access
- Returns cached data if network unavailable

---

#### `getOfferings()`

Fetches available subscription packages from RevenueCat.

**Returns:** `Promise<Object|null>` - Current offering with available packages

**Example:**
```javascript
const offering = await getOfferings();

if (offering) {
  console.log(offering.availablePackages);
  // [{ identifier: '$rc_monthly', ... }, { identifier: '$rc_lifetime', ... }]
}
```

**Throws:** Error if network request fails

---

#### `purchasePackage(packageToPurchase)`

Initiates the purchase flow for a subscription package.

**Parameters:**
- `packageToPurchase` (Object) - Package from `getOfferings()`

**Returns:** `Promise<Object>`
```javascript
{
  success: boolean,
  status: string,        // Updated subscription status
  customerInfo: Object,  // RevenueCat customer info
  cancelled: boolean,    // True if user cancelled
  error: string          // Error message if failed
}
```

**Example:**
```javascript
const offering = await getOfferings();
const monthlyPackage = offering.availablePackages.find(
  pkg => pkg.identifier === '$rc_monthly'
);

const result = await purchasePackage(monthlyPackage);

if (result.success) {
  Alert.alert('Success', 'Subscription activated!');
} else if (result.cancelled) {
  console.log('User cancelled purchase');
} else {
  Alert.alert('Error', result.error);
}
```

---

#### `restorePurchases()`

Restores previous purchases from Apple.

**Returns:** `Promise<Object>`
```javascript
{
  success: boolean,
  status: string,        // Updated subscription status
  customerInfo: Object,  // RevenueCat customer info
  error: string          // Error message if failed
}
```

**Example:**
```javascript
const result = await restorePurchases();

if (result.success) {
  if (result.status === 'none') {
    Alert.alert('No Purchases', 'No previous purchases found.');
  } else {
    Alert.alert('Success', 'Subscription restored!');
  }
}
```

---

### Information Methods

#### `getSubscriptionDetails()`

Gets detailed information about the active subscription.

**Returns:** `Promise<Object|null>` - Subscription details or null if no subscription

**Response:**
```javascript
{
  productIdentifier: string,      // 'expense_monitor_monthly'
  expirationDate: string,          // ISO date string
  latestPurchaseDate: string,
  originalPurchaseDate: string,
  isActive: boolean,
  willRenew: boolean,
  periodType: string,              // 'trial', 'normal', 'intro'
  isSandbox: boolean,
  unsubscribeDetectedAt: string,
  billingIssueDetectedAt: string,
}
```

**Example:**
```javascript
const details = await getSubscriptionDetails();

if (details) {
  console.log('Expires:', new Date(details.expirationDate));
  console.log('Will renew:', details.willRenew);
}
```

---

#### `getFormattedSubscriptionInfo()`

Gets formatted subscription info ready for display in UI.

**Returns:** `Promise<Object>`

**Response:**
```javascript
{
  planName: string,          // 'Monthly Premium', 'Lifetime Premium', 'Free'
  statusText: string,        // 'Active', '5 days remaining', 'Renews Dec 1, 2025'
  statusLabel: string,       // 'Active', 'Free Trial', 'Lifetime', 'Expired'
  nextBillingDate: string,   // ISO date or null
  canManage: boolean,        // Can open iOS subscription management
  isPremium: boolean,        // Has premium access
}
```

**Example:**
```javascript
const info = await getFormattedSubscriptionInfo();

return (
  <View>
    <Text>Plan: {info.planName}</Text>
    <Text>Status: {info.statusText}</Text>
    {info.canManage && (
      <Button title="Manage Subscription" onPress={openManageSubscription} />
    )}
  </View>
);
```

---

#### `hasPremiumAccess()`

Simple check if user has premium access.

**Returns:** `Promise<boolean>` - True if user has active subscription

**Example:**
```javascript
const canUseAI = await hasPremiumAccess();

if (canUseAI) {
  // Show AI features
}
```

---

### Helper Methods

#### `getPackageByType(offering, packageType)`

Gets a specific package from an offering.

**Parameters:**
- `offering` (Object) - Offering from `getOfferings()`
- `packageType` (string) - 'monthly' or 'lifetime'

**Returns:** `Object|null` - Package or null if not found

**Example:**
```javascript
const offering = await getOfferings();
const monthlyPackage = getPackageByType(offering, 'monthly');
const lifetimePackage = getPackageByType(offering, 'lifetime');
```

---

#### `openManageSubscription()`

Opens the iOS subscription management page in Settings.

**Returns:** `Promise<void>`

**Example:**
```javascript
<Button
  title="Manage Subscription"
  onPress={openManageSubscription}
/>
```

---

### Initialization Methods

#### `initializeRevenueCat(apiKey, userId?)`

Initializes the RevenueCat SDK. Should be called once on app launch.

**Parameters:**
- `apiKey` (string) - RevenueCat iOS API key
- `userId` (string, optional) - User ID to log in (Firebase UID)

**Returns:** `Promise<boolean>` - True if successful

**Example:**
```javascript
// In App.js
useEffect(() => {
  const init = async () => {
    const success = await initializeRevenueCat('appl_abc123', user?.uid);
    if (!success) {
      console.error('RevenueCat initialization failed');
    }
  };
  init();
}, []);
```

---

#### `loginUser(userId)`

Logs in a user to RevenueCat. Associates purchases with user ID.

**Parameters:**
- `userId` (string) - User ID (Firebase UID)

**Returns:** `Promise<Object>` - Customer info

**Example:**
```javascript
// Called automatically when user logs in
await loginUser(user.uid);
```

---

#### `logoutUser()`

Logs out user from RevenueCat and clears cache.

**Returns:** `Promise<void>`

**Example:**
```javascript
// In logout flow
await logoutUser();
```

---

#### `clearSubscriptionCache()`

Clears cached subscription data.

**Returns:** `Promise<void>`

**Example:**
```javascript
// Useful for debugging or force refresh
await clearSubscriptionCache();
await checkSubscriptionStatus(); // Fetches fresh data
```

---

## React Hooks

### `useSubscription()`

Main hook for accessing subscription state in components.

**Returns:**
```javascript
{
  // State
  status: string,           // 'none', 'trial', 'active', 'lifetime', 'expired'
  loading: boolean,         // True while loading
  error: string|null,       // Error message if any

  // Premium checks
  isPremium: boolean,       // Has active subscription
  isExpired: boolean,       // Subscription expired
  isTrial: boolean,         // On free trial
  isLifetime: boolean,      // Has lifetime access
  isActivePaid: boolean,    // On paid subscription (not trial)

  // Utilities
  refresh: Function,        // Manually refresh status
}
```

**Example:**
```javascript
import { useSubscription } from '../hooks/useSubscription';

function PremiumFeature() {
  const { isPremium, loading, isTrial, refresh } = useSubscription();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!isPremium) {
    return <PaywallPrompt />;
  }

  return (
    <View>
      {isTrial && <Text>You're on a free trial!</Text>}
      <PremiumContent />
      <Button title="Refresh Status" onPress={refresh} />
    </View>
  );
}
```

**Features:**
- Auto-refreshes when app comes to foreground
- Periodic status check every 5 minutes
- Caches data for offline access
- Updates when user changes (login/logout)

---

### `usePremiumFeature(featureName)`

Hook for gating specific features with logging.

**Parameters:**
- `featureName` (string) - Name of feature being gated

**Returns:** Same as `useSubscription()` plus:
```javascript
{
  ...useSubscription(),
  isLocked: boolean,    // True if feature is locked
  canAccess: boolean,   // True if user can access feature
}
```

**Example:**
```javascript
import { usePremiumFeature } from '../hooks/useSubscription';

function AIAnalysisScreen() {
  const { canAccess, loading, isLocked } = usePremiumFeature('AI Analysis');

  if (loading) return <Loader />;

  if (isLocked) {
    return (
      <View>
        <Text>AI Analysis requires Premium</Text>
        <Button title="Upgrade" onPress={() => navigation.navigate('Paywall')} />
      </View>
    );
  }

  return <AIAnalysisContent />;
}
```

---

## Usage Examples

### Complete Paywall Flow

```javascript
import { useState } from 'react';
import { View, Text, Button, Alert, ActivityIndicator } from 'react-native';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getPackageByType,
} from '../services/subscriptionService';

function PaywallScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [offering, setOffering] = useState(null);

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offers = await getOfferings();
      setOffering(offers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageType) => {
    if (!offering) return;

    setLoading(true);
    try {
      const pkg = getPackageByType(offering, packageType);
      const result = await purchasePackage(pkg);

      if (result.success) {
        Alert.alert('Success', 'Welcome to Premium!');
        navigation.goBack();
      } else if (!result.cancelled) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();

      if (result.success) {
        if (result.status === 'none') {
          Alert.alert('No Purchases', 'No previous purchases found');
        } else {
          Alert.alert('Success', 'Subscription restored!');
          navigation.goBack();
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Restore failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View>
      <Text>Choose Your Plan</Text>

      <Button
        title="Monthly - $10/month (14-day trial)"
        onPress={() => handlePurchase('monthly')}
      />

      <Button
        title="Lifetime - $199 (one-time)"
        onPress={() => handlePurchase('lifetime')}
      />

      <Button
        title="Restore Purchases"
        onPress={handleRestore}
      />
    </View>
  );
}
```

---

### Subscription Status Display

```javascript
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import {
  getFormattedSubscriptionInfo,
  openManageSubscription,
} from '../services/subscriptionService';

function SubscriptionManagementScreen({ navigation }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    loadInfo();
  }, []);

  const loadInfo = async () => {
    const subscriptionInfo = await getFormattedSubscriptionInfo();
    setInfo(subscriptionInfo);
  };

  if (!info) return <ActivityIndicator />;

  return (
    <View>
      <Text>Current Plan: {info.planName}</Text>
      <Text>Status: {info.statusText}</Text>

      {info.nextBillingDate && (
        <Text>Next Billing: {new Date(info.nextBillingDate).toLocaleDateString()}</Text>
      )}

      {!info.isPremium && (
        <Button
          title="Upgrade to Premium"
          onPress={() => navigation.navigate('Paywall')}
        />
      )}

      {info.canManage && (
        <Button
          title="Manage Subscription"
          onPress={openManageSubscription}
        />
      )}
    </View>
  );
}
```

---

### Feature Gating

```javascript
import { useSubscription } from '../hooks/useSubscription';

function AIInsightsButton() {
  const { isPremium } = useSubscription();

  const handlePress = () => {
    if (!isPremium) {
      navigation.navigate('Paywall');
      return;
    }

    // Show AI insights
    navigation.navigate('AIInsights');
  };

  return (
    <Button
      title={isPremium ? 'View AI Insights' : 'Unlock AI Insights'}
      onPress={handlePress}
    />
  );
}
```

---

## Constants

### `PRODUCT_IDS`

```javascript
import { PRODUCT_IDS } from '../services/subscriptionService';

console.log(PRODUCT_IDS.MONTHLY);   // 'expense_monitor_monthly'
console.log(PRODUCT_IDS.LIFETIME);  // 'expense_monitor_lifetime'
```

### `ENTITLEMENT_ID`

```javascript
import { ENTITLEMENT_ID } from '../services/subscriptionService';

console.log(ENTITLEMENT_ID); // 'premium'
```

### `SUBSCRIPTION_STATUS`

```javascript
import { SUBSCRIPTION_STATUS } from '../services/subscriptionService';

console.log(SUBSCRIPTION_STATUS.NONE);     // 'none'
console.log(SUBSCRIPTION_STATUS.TRIAL);    // 'trial'
console.log(SUBSCRIPTION_STATUS.ACTIVE);   // 'active'
console.log(SUBSCRIPTION_STATUS.LIFETIME); // 'lifetime'
console.log(SUBSCRIPTION_STATUS.EXPIRED);  // 'expired'
```

---

## Error Handling

### Network Errors

The service handles network errors gracefully by returning cached data:

```javascript
const status = await checkSubscriptionStatus();
// If network fails, returns cached status from AsyncStorage
```

### Purchase Errors

```javascript
const result = await purchasePackage(pkg);

if (!result.success) {
  if (result.cancelled) {
    // User cancelled - don't show error
    console.log('Purchase cancelled');
  } else {
    // Show error to user
    Alert.alert('Purchase Failed', result.error);
  }
}
```

### Initialization Errors

```javascript
const success = await initializeRevenueCat(apiKey);

if (!success) {
  // RevenueCat failed to initialize
  // App can still function with limited features
  console.error('RevenueCat initialization failed');
}
```

---

## Best Practices

1. **Always check loading state** before showing premium content
2. **Cache offline** - Service caches subscription status for offline access
3. **Refresh on app foreground** - Hook automatically refreshes when app becomes active
4. **Handle cancellations gracefully** - Don't show error when user cancels purchase
5. **Use constants** - Import PRODUCT_IDS and SUBSCRIPTION_STATUS for consistency
6. **Test with sandbox** - Use sandbox accounts for testing, never real purchases

---

## Support

For issues or questions:
- Check RevenueCat logs: `Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG)`
- Review `/docs/subscription-setup-guide.md`
- Contact: Agent 2 - Payments & Subscription Specialist

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
**Author:** Agent 2 - Payments & Subscription Specialist
