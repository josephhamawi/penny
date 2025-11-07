# Premium UI Architecture

## Component Hierarchy

```
App.js
├── NavigationContainer
│   ├── MainStack
│   │   ├── TabNavigator
│   │   │   ├── HomeScreen ⭐ UPDATED
│   │   │   │   ├── PremiumBadge (if premium)
│   │   │   │   ├── UpgradeBanner (if free)
│   │   │   │   └── LockedFeatureCards (if free)
│   │   │   ├── RecordsScreen
│   │   │   ├── StatisticsScreen
│   │   │   └── SettingsScreen
│   │   ├── AddExpenseScreen
│   │   ├── EditExpenseScreen
│   │   ├── PaywallScreen 🆕 (modal)
│   │   └── SubscriptionManagementScreen 🆕
│   └── AuthStack
│       ├── LoginScreen
│       └── RegisterScreen
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      App.js                                  │
│  - Initializes RevenueCat                                    │
│  - Logs user into RevenueCat on auth                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              useSubscription Hook                            │
│  - Checks subscription status via RevenueCat                 │
│  - Provides isPremium, status, loading                       │
│  - Auto-refreshes on app foreground                          │
│  - Periodic checks (5 min)                                   │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         ▼                           ▼
┌────────────────────┐    ┌──────────────────────────┐
│    HomeScreen      │    │  Other Screens           │
│  - Shows badge     │    │  - GoalsDashboard        │
│  - Shows banner    │    │  - PersonalityReport     │
│  - Shows locked    │    │  - All premium features  │
└─────┬──────────────┘    └──────────────────────────┘
      │
      │ User taps locked feature
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    PaywallScreen                             │
│  - Shows offerings from RevenueCat                           │
│  - Handles purchases via subscriptionService                 │
│  - Restores purchases                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Purchase succeeds
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              useSubscription Hook                            │
│  - Status updates automatically                              │
│  - isPremium becomes true                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  UI Updates                                  │
│  - Diamond badge appears                                     │
│  - Locked features unlock                                    │
│  - Upgrade banner disappears                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Dependencies

### PremiumBadge
```javascript
// Depends on:
- useSubscription (isPremium)
- expo-linear-gradient
- @expo/vector-icons

// Used by:
- HomeScreen
- GoalsDashboardScreen (potentially)
- PersonalityReportScreen (potentially)
```

### LockedFeatureCard
```javascript
// Depends on:
- @expo/vector-icons
- React Navigation (for onPress navigation)

// Used by:
- HomeScreen
- Any screen showing locked features
```

### PaywallScreen
```javascript
// Depends on:
- subscriptionService (getOfferings, purchasePackage, restorePurchases)
- expo-linear-gradient
- @expo/vector-icons
- React Navigation

// Navigated to by:
- LockedFeatureCard
- UpgradeBanner
- Settings/Profile
```

### SubscriptionManagementScreen
```javascript
// Depends on:
- useSubscription (isPremium, status, etc.)
- subscriptionService (manageSubscription, cancelSubscription)
- expo-linear-gradient
- @expo/vector-icons
- React Navigation

// Navigated to by:
- PremiumBadge
- Settings screen
- Profile screen
```

---

## State Management

### Global State
```javascript
// AuthContext (existing)
- user
- loading
- login()
- logout()
- register()

// useSubscription Hook (Agent 2)
- status (trial, active, lifetime, expired, none)
- isPremium (computed)
- isExpired (computed)
- isTrial (computed)
- loading
- error
- refresh()
```

### Local State
```javascript
// HomeScreen
- showUpgradeBanner (dismissible)
- expenses
- loading
- monthlyBudget

// PaywallScreen
- purchasing
- restoring

// SubscriptionManagementScreen
- (mostly reads from useSubscription)
```

---

## Navigation Routes

### Main Routes
```javascript
// Tab Navigator
- Home (HomeScreen)
- Records (RecordsScreen)
- Statistics (StatisticsScreen)
- Settings (SettingsScreen)

// Modal Routes
- AddExpense (modal)
- EditExpense (modal)
- Paywall (modal) 🆕
- SubscriptionManagement 🆕
```

### Navigation Patterns
```javascript
// To Paywall
navigation.navigate('Paywall')

// To Subscription Management
navigation.navigate('SubscriptionManagement')

// Back from modal
navigation.goBack()
```

---

## Styling System

### Theme Colors
```javascript
Primary: #6C63FF (purple-blue)
Premium: #1976D2 (blue)
Success: #00BFA6 (teal)
Gold: #FFD700
Warning: #FF9800
Danger: #F44336
Background: #F5F6FA
White: #FFF
Text: #333
Secondary Text: #666
Light Text: #999
```

### Gradients
```javascript
// Premium Badge & Icons
Gold to Teal: ['#FFD700', '#00BFA6']

// Status Cards
Blue to Teal: ['#1976D2', '#00BFA6']
```

### Shadows
```javascript
// Standard card shadow
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.05-0.1
shadowRadius: 8
elevation: 2-3 (Android)
```

---

## Animation System

### PremiumBadge
```javascript
// Pulse on mount
Scale: 1 → 1.2 → 1
Duration: 500ms each
Easing: default
useNativeDriver: true
```

### Screen Transitions
```javascript
// Modal screens (Paywall, SubscriptionManagement)
presentation: 'modal'
animation: 'slide_from_bottom' (AddExpense, EditExpense)
animation: default (Paywall - iOS modal)
```

---

## Error Handling

### Subscription Check Errors
```javascript
// In useSubscription hook
- Catches errors silently
- Logs to console
- Keeps previous status on error
- Sets error state for UI to handle
```

### Purchase Errors
```javascript
// In PaywallScreen
- Shows Alert on purchase failure
- Handles user cancellation gracefully
- Provides retry option
- Logs errors for debugging
```

### Network Errors
```javascript
// Throughout app
- Graceful degradation
- Show error messages
- Provide retry buttons
- Don't block UI
```

---

## Performance Optimizations

### Subscription Hook
- Memoized callbacks (useCallback)
- Efficient state updates
- Background refresh doesn't trigger loading
- Debounced periodic checks (5 min)

### Components
- PremiumBadge: Only renders if premium
- LockedFeatureCards: Only render if free
- Animations use native driver
- No unnecessary re-renders

### Images & Assets
- Icons from FontAwesome5 (vector, scalable)
- Gradients via expo-linear-gradient (native)
- No heavy image assets

---

## Integration Checklist

When connecting to real RevenueCat:

1. **App.js**
   - [x] Initialize RevenueCat on app start (DONE)
   - [x] Log user in to RevenueCat on auth (DONE)

2. **useSubscription Hook**
   - [x] Check subscription status via RevenueCat (DONE)
   - [x] Handle subscription changes (DONE)
   - [x] Auto-refresh on foreground (DONE)

3. **PaywallScreen**
   - [x] Get real offerings (DONE)
   - [x] Process real purchases (DONE)
   - [x] Restore purchases (DONE)
   - [ ] Remove mock data notice

4. **SubscriptionManagementScreen**
   - [x] Use real subscription data (DONE)
   - [x] Link to App Store management (DONE)
   - [ ] Remove mock data notice

5. **Testing**
   - [ ] Test free trial signup
   - [ ] Test lifetime purchase
   - [ ] Test restore purchases
   - [ ] Test subscription expiration
   - [ ] Test cancel subscription

---

## File Structure

```
/src
  /components
    ├── PremiumBadge.js              # Diamond badge component
    └── LockedFeatureCard.js         # Locked feature display

  /screens
    ├── PaywallScreen.js             # Subscription paywall
    ├── SubscriptionManagementScreen.js  # Manage subscription
    └── HomeScreen.js                # Updated with premium UI

  /hooks
    └── useSubscription.js           # Subscription state hook

  /services
    ├── subscriptionService.js       # RevenueCat integration (Agent 2)
    └── [other services]

  /contexts
    └── AuthContext.js               # User authentication

/App.js                              # Updated with premium routes

/docs
  ├── agent-3-completion-report.md        # Detailed report
  ├── premium-ui-testing-guide.md         # Testing guide
  └── premium-ui-architecture.md          # This file
```

---

## API Reference

### useSubscription Hook
```javascript
const {
  // State
  status,          // 'trial' | 'active' | 'lifetime' | 'expired' | 'none'
  loading,         // boolean
  error,           // string | null

  // Premium checks
  isPremium,       // boolean (trial OR active OR lifetime)
  isExpired,       // boolean
  isTrial,         // boolean
  isLifetime,      // boolean
  isActivePaid,    // boolean

  // Actions
  refresh,         // () => Promise<void>
} = useSubscription();
```

### PremiumBadge Component
```javascript
<PremiumBadge
  onPress={() => navigation.navigate('SubscriptionManagement')}
/>
```

### LockedFeatureCard Component
```javascript
<LockedFeatureCard
  title="Feature Name"
  description="Feature description"
  icon="icon-name"  // FontAwesome5 icon
  onPress={() => navigation.navigate('Paywall')}
/>
```

---

## Troubleshooting

### Issue: Hook says isPremium but UI doesn't update
**Solution**: Check if components are using the hook. May need to refresh or restart app.

### Issue: Paywall crashes on open
**Solution**: Check RevenueCat initialization. May be missing API key.

### Issue: Purchase doesn't work
**Solution**: Verify subscriptionService is properly connected to RevenueCat.

### Issue: Gradients not showing
**Solution**: Ensure expo-linear-gradient is installed: `npm install expo-linear-gradient`

---

## Future Enhancements

### Story 3.5: Feature Teasers
- Blurred preview screenshots
- "See Preview" buttons
- Modal previews of premium features

### Additional Ideas
- Celebration animation on purchase
- Countdown timer for trial expiration
- Referral program UI
- Gift subscription option
- Family sharing UI

---

**Architecture designed for scalability and maintainability** 🎨
