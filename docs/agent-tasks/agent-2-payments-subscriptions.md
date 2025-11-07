# Agent 2: Payments & Subscription Specialist

## 🎯 Mission
Implement complete subscription infrastructure using RevenueCat and iOS StoreKit. Enable users to purchase monthly ($10) or lifetime ($199) subscriptions with 14-day free trial, and manage the full subscription lifecycle.

---

## 📋 Assignment Overview

**Epic:** Epic 2 - In-App Purchase & Subscription Infrastructure
**Timeline:** 2 weeks (10 business days)
**Priority:** HIGH - Blocks premium features (Agents 4 & 5)
**Dependencies:**
- Requires Agent 1 Story 1.1 complete (user authentication)
- Requires Agent 1 Story 1.2 complete (user-scoped Firestore)

---

## 🔨 Stories Assigned

### ✅ Story 2.1: Set Up RevenueCat Account and Configure Products

**As a** developer,
**I want** RevenueCat configured with App Store Connect products,
**so that** I can test and sell subscriptions through the app.

#### Acceptance Criteria
1. ✓ RevenueCat account created and linked to App Store Connect
2. ✓ Monthly subscription product created: `expense_monitor_monthly` - $10/month with 14-day trial
3. ✓ Lifetime subscription product created: `expense_monitor_lifetime` - $199 one-time purchase
4. ✓ Products configured in RevenueCat dashboard with correct identifiers
5. ✓ Sandbox test accounts set up in App Store Connect for testing
6. ✓ RevenueCat API key obtained and stored securely
7. ✓ Documentation includes setup instructions for App Store Connect

#### Implementation Guidance

**Step 1: App Store Connect Setup**
1. Log into https://appstoreconnect.apple.com
2. Go to your app → Features → In-App Purchases
3. Create two products:
   - **Type:** Auto-Renewable Subscription (monthly)
     - Product ID: `expense_monitor_monthly`
     - Reference Name: "Expense Monitor Premium Monthly"
     - Subscription Group: "Premium Features"
     - Duration: 1 Month
     - Price: $9.99 USD
     - **Free Trial:** 14 days
   - **Type:** Non-Consumable (lifetime)
     - Product ID: `expense_monitor_lifetime`
     - Reference Name: "Expense Monitor Premium Lifetime"
     - Price: $199.99 USD

4. Fill out required metadata (descriptions, screenshots)
5. Create sandbox test accounts (Settings → Users and Access → Sandbox Testers)

**Step 2: RevenueCat Setup**
1. Create account at https://app.revenuecat.com
2. Create new Project: "Expense Monitor"
3. Add iOS app with Bundle ID: `com.yourdomain.expensemonitor`
4. Configure Products:
   - Go to Products tab
   - Create Offering: "default"
   - Add Monthly Package: `expense_monitor_monthly`
   - Add Lifetime Package: `expense_monitor_lifetime`
5. Get API Keys:
   - iOS App-Specific Key (public)
   - Store in `app.config.js` or EAS Secrets

**Step 3: Entitlements**
1. In RevenueCat, create Entitlement: "premium"
2. Attach both products to "premium" entitlement
3. This allows checking if user has ANY premium subscription

**Files to Create:**
- `/docs/subscription-setup-guide.md` (detailed setup instructions)
- `/secrets/revenuecat-keys.md` (gitignored - store API keys)
- `.env.example` (template for required environment variables)

---

### ✅ Story 2.2: Install and Initialize RevenueCat SDK

**As a** developer,
**I want** RevenueCat SDK installed and initialized on app launch,
**so that** the app can communicate with the subscription backend.

#### Acceptance Criteria
1. ✓ `react-native-purchases` package installed via npm
2. ✓ RevenueCat SDK initialized in App.js with API key from environment variables
3. ✓ User identified in RevenueCat using Firebase UID: `Purchases.logIn(user.uid)`
4. ✓ Initialization happens after Firebase auth is ready
5. ✓ Error handling for initialization failures with retry logic
6. ✓ RevenueCat debug logs enabled in development, disabled in production

#### Implementation Guidance

**Installation:**
```bash
npm install react-native-purchases
npx pod-install (for iOS native dependencies)
```

**App.js Initialization:**
```javascript
import { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { REVENUECAT_IOS_API_KEY } from '@env';
import { useAuth } from './src/contexts/AuthContext';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        // Enable debug logs in development
        if (__DEV__) {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }

        // Initialize SDK
        await Purchases.configure({
          apiKey: REVENUECAT_IOS_API_KEY,
        });

        console.log('RevenueCat initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        // Retry after 5 seconds
        setTimeout(initializeRevenueCat, 5000);
      }
    };

    initializeRevenueCat();
  }, []);

  // Log in user to RevenueCat after auth
  useEffect(() => {
    const loginToRevenueCat = async () => {
      if (user && user.uid) {
        try {
          await Purchases.logIn(user.uid);
          console.log('User logged into RevenueCat:', user.uid);
        } catch (error) {
          console.error('RevenueCat login error:', error);
        }
      }
    };

    loginToRevenueCat();
  }, [user]);

  return (
    // ... rest of app
  );
}
```

**Environment Variables** (`.env`):
```
REVENUECAT_IOS_API_KEY=your_ios_api_key_here
```

**app.config.js:**
```javascript
export default {
  // ... existing config
  extra: {
    revenueCatIosApiKey: process.env.REVENUECAT_IOS_API_KEY,
  },
};
```

**Files to Modify:**
- `package.json` (add react-native-purchases)
- `App.js` (initialize SDK)
- `.env` (add API key)
- `app.config.js` (expose env vars)
- `.gitignore` (ensure .env is ignored)

---

### ✅ Story 2.3: Create Subscription Service to Manage Purchase State

**As a** developer,
**I want** a centralized subscription service that exposes purchase state,
**so that** the app can easily check if user has active subscription.

#### Acceptance Criteria
1. ✓ `/src/services/subscriptionService.js` created with methods:
   - `checkSubscriptionStatus()` - returns active/trial/expired/none
   - `getOfferings()` - fetches available products from RevenueCat
   - `purchasePackage(package)` - initiates purchase flow
   - `restorePurchases()` - restores previous purchases
2. ✓ Service caches subscription status in AsyncStorage for offline access
3. ✓ Service exposes React hook: `useSubscription()` for components
4. ✓ Subscription status updates automatically on purchase/restore/expiry
5. ✓ Service handles RevenueCat errors gracefully (network issues, user cancellations)

#### Implementation Guidance

**Create `/src/services/subscriptionService.js`:**
```javascript
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_CACHE_KEY = 'subscription_status';

export const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    // Check if user has "premium" entitlement
    const hasPremium = customerInfo.entitlements.active['premium'];

    if (!hasPremium) {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'none');
      return 'none';
    }

    // Check if it's a trial
    const entitlement = customerInfo.entitlements.active['premium'];
    if (entitlement.isActive && entitlement.willRenew && entitlement.periodType === 'trial') {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'trial');
      return 'trial';
    }

    // Check if lifetime
    const isLifetime = customerInfo.activeSubscriptions.includes('expense_monitor_lifetime');
    if (isLifetime) {
      await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'lifetime');
      return 'lifetime';
    }

    // Active subscription
    await AsyncStorage.setItem(SUBSCRIPTION_CACHE_KEY, 'active');
    return 'active';
  } catch (error) {
    console.error('Error checking subscription:', error);
    // Return cached status if available
    const cached = await AsyncStorage.getItem(SUBSCRIPTION_CACHE_KEY);
    return cached || 'none';
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current; // Returns "default" offering
  } catch (error) {
    console.error('Error fetching offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (packageToPurchase) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const status = await checkSubscriptionStatus();
    return { success: true, status, customerInfo };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, cancelled: true };
    }
    console.error('Purchase error:', error);
    throw error;
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const status = await checkSubscriptionStatus();
    return { success: true, status, customerInfo };
  } catch (error) {
    console.error('Restore error:', error);
    throw error;
  }
};

export const getSubscriptionDetails = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active['premium'];

    if (!entitlement) return null;

    return {
      productIdentifier: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate,
      isActive: entitlement.isActive,
      willRenew: entitlement.willRenew,
      periodType: entitlement.periodType,
    };
  } catch (error) {
    console.error('Error getting subscription details:', error);
    return null;
  }
};
```

**Create `/src/hooks/useSubscription.js`:**
```javascript
import { useState, useEffect } from 'react';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

export const useSubscription = () => {
  const [status, setStatus] = useState('none'); // none, trial, active, lifetime, expired
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadStatus = async () => {
      if (user) {
        setLoading(true);
        const subscriptionStatus = await checkSubscriptionStatus();
        setStatus(subscriptionStatus);
        setLoading(false);
      } else {
        setStatus('none');
        setLoading(false);
      }
    };

    loadStatus();
  }, [user]);

  const isPremium = status === 'active' || status === 'trial' || status === 'lifetime';

  return { status, isPremium, loading };
};
```

**Files to Create:**
- `/src/services/subscriptionService.js`
- `/src/hooks/useSubscription.js`

---

### ✅ Story 2.4: Implement Purchase Flow for Monthly and Lifetime Subscriptions

**As a** user,
**I want** to purchase a subscription from the paywall screen,
**so that** I can access premium AI features.

#### Acceptance Criteria
1. ✓ Paywall screen displays both subscription options with pricing
2. ✓ Monthly option shows "Start 14-Day Free Trial" button
3. ✓ Lifetime option shows "Buy Lifetime Access for $199" button
4. ✓ Tapping purchase button triggers RevenueCat purchase flow
5. ✓ Native iOS payment sheet displays with correct pricing
6. ✓ On successful purchase, subscription status updates immediately
7. ✓ User redirected to premium feature they tried to access
8. ✓ Purchase errors shown in user-friendly alert (e.g., "Purchase canceled")
9. ✓ Loading state shown during purchase processing

#### Implementation Guidance

**This story will be completed by Agent 3 (UI/UX) - Agent 2 provides the service layer.**

Agent 2's responsibility: Ensure `purchasePackage()` method works correctly and returns proper success/error states.

**Test the purchase flow manually:**
1. Fetch offerings: `const offerings = await getOfferings();`
2. Get monthly package: `const monthlyPackage = offerings.availablePackages.find(p => p.identifier === '$rc_monthly');`
3. Purchase: `const result = await purchasePackage(monthlyPackage);`
4. Verify `result.success === true` and subscription status updates

**Files to Modify:**
- `/src/services/subscriptionService.js` (already created in Story 2.3)

---

### ✅ Story 2.5: Implement Restore Purchases Functionality

**As a** user,
**I want** to restore my purchases on a new device or after reinstalling,
**so that** I don't lose access to my paid subscription.

#### Acceptance Criteria
1. ✓ "Restore Purchases" button available on paywall screen
2. ✓ "Restore Purchases" option in Settings → Subscription section
3. ✓ Tapping restore triggers `Purchases.restorePurchases()`
4. ✓ On successful restore, subscription status updates and premium features unlock
5. ✓ Success message shown: "Subscription restored successfully"
6. ✓ If no purchases found, show message: "No previous purchases found"
7. ✓ Restore works for both monthly and lifetime subscriptions

#### Implementation Guidance

**Agent 2's responsibility:** Ensure `restorePurchases()` service method works and updates subscription status.

**Test restore flow:**
1. Purchase subscription on Device A (or simulator)
2. Delete app or log out
3. Reinstall app or log in
4. Call `restorePurchases()`
5. Verify subscription status updates to 'active' or 'lifetime'

**UI Implementation (Agent 3 will build):**
```javascript
const handleRestorePurchases = async () => {
  setRestoring(true);
  try {
    const result = await restorePurchases();
    if (result.success) {
      if (result.status === 'none') {
        Alert.alert('No Purchases Found', 'No previous purchases found on this account.');
      } else {
        Alert.alert('Success', 'Subscription restored successfully!');
      }
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to restore purchases. Please try again.');
  } finally {
    setRestoring(false);
  }
};
```

**Files to Modify:**
- `/src/services/subscriptionService.js` (already has `restorePurchases()`)

---

### ✅ Story 2.6: Handle Subscription Expiry and Trial End

**As a** system,
**I want** to detect when subscriptions expire and lock premium features,
**so that** non-paying users cannot access AI features.

#### Acceptance Criteria
1. ✓ App checks subscription status on launch and resume
2. ✓ When subscription expires, premium features are locked immediately
3. ✓ User shown message: "Your subscription has expired. Renew to continue using AI features."
4. ✓ Expired users can still view historical expense data (free features)
5. ✓ "Renew Subscription" button directs to paywall screen
6. ✓ Trial expiry handled same as regular expiry (prompt to subscribe)
7. ✓ Grace period of 24 hours for failed payment retries (RevenueCat default)

#### Implementation Guidance

**RevenueCat automatically handles expiry detection.** We just need to check subscription status regularly.

**Update App.js to check on resume:**
```javascript
import { AppState } from 'react-native';
import { checkSubscriptionStatus } from './src/services/subscriptionService';

useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground - recheck subscription
      await checkSubscriptionStatus();
    }
  });

  return () => subscription.remove();
}, []);
```

**Update `useSubscription` hook to listen for changes:**
```javascript
export const useSubscription = () => {
  // ... existing code

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      // Check status every 5 minutes while app is open
      const newStatus = await checkSubscriptionStatus();
      if (newStatus !== status) {
        setStatus(newStatus);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, [status]);

  // ... rest of hook
};
```

**Expired State Handling (Agent 3 & 4 & 5):**
When `isPremium === false`, premium screens should:
1. Show locked state with message
2. Display "Renew Subscription" or "Upgrade" button
3. Redirect to paywall when tapped

**Files to Modify:**
- `App.js` (add AppState listener)
- `/src/hooks/useSubscription.js` (add periodic check)

---

### ✅ Story 2.7: Display Subscription Status in Settings

**As a** user,
**I want** to see my subscription details in Settings,
**so that** I know when my subscription renews or when my trial ends.

#### Acceptance Criteria
1. ✓ Settings screen has "Subscription" section showing:
   - Current plan: "Monthly Premium" or "Lifetime Premium" or "Free"
   - Status: "Active", "Trial (X days left)", "Expired"
   - Next billing date (for monthly subscribers)
   - "Manage Subscription" button (opens App Store subscriptions)
2. ✓ Free users see "Upgrade to Premium" button
3. ✓ Lifetime subscribers see "Lifetime Access - No Renewal Needed"
4. ✓ Monthly subscribers see "Cancel Subscription" link to App Store
5. ✓ All subscription info pulled from RevenueCat customer info

#### Implementation Guidance

**Agent 2's responsibility:** Provide `getSubscriptionDetails()` method that returns formatted subscription info.

**Enhance `/src/services/subscriptionService.js`:**
```javascript
export const getFormattedSubscriptionInfo = async () => {
  try {
    const status = await checkSubscriptionStatus();
    const details = await getSubscriptionDetails();

    if (status === 'none') {
      return {
        planName: 'Free',
        statusText: 'Not subscribed',
        nextBillingDate: null,
        canManage: false,
      };
    }

    if (status === 'lifetime') {
      return {
        planName: 'Lifetime Premium',
        statusText: 'Lifetime Access - No Renewal Needed',
        nextBillingDate: null,
        canManage: false,
      };
    }

    if (status === 'trial') {
      const daysLeft = Math.ceil(
        (new Date(details.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return {
        planName: 'Premium Trial',
        statusText: `Trial (${daysLeft} days left)`,
        nextBillingDate: details.expirationDate,
        canManage: true,
      };
    }

    if (status === 'active') {
      return {
        planName: 'Monthly Premium',
        statusText: 'Active',
        nextBillingDate: details.expirationDate,
        canManage: true,
      };
    }

    return {
      planName: 'Unknown',
      statusText: 'Error loading subscription',
      nextBillingDate: null,
      canManage: false,
    };
  } catch (error) {
    console.error('Error formatting subscription info:', error);
    return null;
  }
};

export const openManageSubscription = () => {
  // Opens iOS Settings → Subscriptions
  Linking.openURL('https://apps.apple.com/account/subscriptions');
};
```

**Agent 3 will build the UI using this data.**

**Files to Modify:**
- `/src/services/subscriptionService.js`

---

## 🧪 Testing Checklist

**Purchase Testing (iOS Sandbox):**
- [ ] Monthly subscription purchase completes successfully
- [ ] Lifetime subscription purchase completes successfully
- [ ] Free trial shows "14 days remaining"
- [ ] Native payment sheet displays correct pricing
- [ ] User canceling purchase handled gracefully
- [ ] Payment failure handled gracefully

**Restore Testing:**
- [ ] Restore purchases works on new device
- [ ] Restore detects monthly subscription
- [ ] Restore detects lifetime subscription
- [ ] Restore shows "no purchases" for new user

**Expiry Testing:**
- [ ] Trial expiry detected after 14 days (use sandbox time manipulation)
- [ ] Expired subscription locks premium features
- [ ] Grace period respected for failed payments
- [ ] Subscription renewal detected and premium unlocked

**Status Checking:**
- [ ] Subscription status accurate after purchase
- [ ] Subscription status updates when app resumes
- [ ] Offline mode uses cached status
- [ ] Settings displays correct subscription info

**Edge Cases:**
- [ ] Network errors during purchase handled
- [ ] App doesn't crash if RevenueCat is down
- [ ] Multiple rapid purchases don't create duplicate charges
- [ ] Subscription status syncs across devices (same Apple ID)

---

## 📦 Deliverables

1. **RevenueCat Configuration**
   - App Store Connect products configured
   - RevenueCat dashboard set up with offerings
   - Sandbox test accounts created
   - Documentation for setup process

2. **SDK Integration**
   - `react-native-purchases` installed and initialized
   - User logged into RevenueCat on auth
   - Debug logging configured

3. **Subscription Service Layer**
   - Complete subscription service with all methods
   - React hook for subscription state
   - AsyncStorage caching for offline

4. **Purchase & Restore Flows**
   - Purchase method tested with sandbox accounts
   - Restore purchases working across devices
   - Error handling for all scenarios

5. **Subscription Lifecycle Management**
   - Expiry detection on app launch and resume
   - Trial end handling
   - Grace period support

6. **Subscription Info Display**
   - Formatted subscription details for UI
   - Method to open iOS subscription management

---

## 🚦 Definition of Done

- [ ] All 7 stories completed with acceptance criteria met
- [ ] RevenueCat fully configured in production mode
- [ ] Code reviewed and merged to main branch
- [ ] All purchases tested in sandbox environment
- [ ] Documentation complete for subscription setup
- [ ] No critical bugs in purchase flow
- [ ] Demo prepared showing: purchase, restore, expiry

---

## 📞 Communication & Handoff

**Depends On:**
- **Agent 1:** Needs user authentication (UID for RevenueCat login)
- **Agent 1:** Needs Firestore user-scoped structure (to store subscription metadata if needed)

**Blocks:**
- **Agent 3:** Needs subscription service before building paywall UI
- **Agent 4 & 5:** Needs `useSubscription()` hook to gate AI features

**Coordinates With:**
- **Agent 3 (UI/UX):** Will build paywall and subscription management screens using this service
- **Agents 4 & 5 (AI):** Will use `isPremium` check to gate features

**Handoff Requirements:**
When complete, provide:
1. Subscription service API documentation (methods, return values)
2. Example usage of `useSubscription()` hook
3. List of sandbox test accounts for QA
4. RevenueCat dashboard access for PM/QA

---

## 🎯 Success Metrics

- **Purchase success rate:** >95% (sandbox testing)
- **Restore success rate:** >98%
- **Zero duplicate charges** in testing
- **Subscription status accuracy:** 100% (no false positives/negatives)
- **Trial conversion tracking:** Set up analytics events

---

**Ready to start? Questions?**

Contact: Product Manager (John) for clarification
PRD Reference: `/docs/prd.md` - Epic 2
