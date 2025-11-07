# Premium UI Testing Guide

## Quick Start: Testing Premium Features

This guide shows you how to test the premium UI with mock data while Agent 2's subscription service is being integrated.

---

## Toggle Between Free & Premium

The hook at `/src/hooks/useSubscription.js` has been updated by Agent 2 with real subscription integration. However, if you need to test with mock data during development:

### Current State:
The app is **now connected to RevenueCat** and will use real subscription data. The subscription status is determined by:
- RevenueCat subscription status
- Firebase user authentication
- Active subscriptions and trials

---

## What You'll See

### Free User Experience

**Home Screen:**
```
┌─────────────────────────────┐
│ Total Balance    🔔         │  ← No diamond badge
│ $5,234.56                   │
├─────────────────────────────┤
│ ⭐ Unlock AI insights...    │  ← Upgrade banner (dismissible)
│                    [Upgrade]│
├─────────────────────────────┤
│ Premium Features            │
│                             │
│ 🎯 Savings Goals       🔒   │  ← Locked card
│ Set goals and get AI...     │
│                             │
│ 📈 Expense Personality 🔒   │  ← Locked card
│ Get monthly insights...     │
└─────────────────────────────┘
```

**When You Tap a Locked Feature:**
- Beautiful paywall opens (modal)
- Shows value proposition
- Two subscription tiers
- Clear CTAs

**When You Tap Profile/Settings:**
- Can navigate to Subscription Management
- Shows "You're on the Free Plan"
- Upgrade button prominently displayed

---

### Premium User Experience

**Home Screen:**
```
┌─────────────────────────────┐
│ Total Balance    💎 🔔      │  ← Diamond badge appears!
│ $5,234.56                   │
├─────────────────────────────┤
│ Monthly Budget              │  ← No upgrade banner
│ ▓▓▓▓▓░░░░░ 60%            │
├─────────────────────────────┤
│ Recent Records              │  ← No locked cards
│ ☕ Coffee Shop              │
│ 🏪 Grocery Store            │
└─────────────────────────────┘
```

**When You Tap Diamond Badge:**
- Opens Subscription Management
- Shows active subscription status
- Can manage or cancel subscription

---

## Testing Scenarios

### Scenario 1: Free User Discovers Premium
1. Open app (not subscribed)
2. See upgrade banner on Home → Dismiss it
3. Scroll down → See locked feature cards
4. Tap "Savings Goals" card
5. **Expected**: Paywall opens with beautiful UI
6. Review subscription options
7. Tap "Close" to dismiss

### Scenario 2: Free User Wants to Upgrade
1. Open app (not subscribed)
2. Tap upgrade banner "Upgrade" button
3. **Expected**: Paywall opens
4. Tap "Start Free Trial" button
5. **Expected**: Alert shows mock purchase message
6. In production: Would process real purchase

### Scenario 3: Premium User Experience
1. Set `isPremium: true` in hook (or use real subscription)
2. Open app
3. **Expected**: Diamond badge visible in header
4. **Expected**: No upgrade banner
5. **Expected**: No locked feature cards
6. Tap diamond badge
7. **Expected**: Subscription Management opens
8. See active subscription details

### Scenario 4: Subscription Management (Premium)
1. Be premium user
2. Navigate to Subscription Management
3. See:
   - Premium Active badge (gradient)
   - Subscription details
   - Feature list
   - Action buttons
4. Tap "Manage Subscription"
5. **Expected**: Alert about App Store (mock)
6. In production: Opens App Store management

### Scenario 5: Subscription Management (Free)
1. Be free user
2. Navigate to Settings
3. Tap "Subscription" or similar
4. See:
   - Free plan message
   - "Upgrade to Premium" button
   - Preview of premium features
5. Tap "Upgrade to Premium"
6. **Expected**: Navigates to Paywall

---

## Visual Elements to Verify

### Premium Badge
- [ ] Appears only for premium users
- [ ] Gold to teal gradient
- [ ] Diamond gem icon
- [ ] Pulses on first appearance
- [ ] Tappable
- [ ] Located in top-right of header

### Locked Feature Cards
- [ ] Show only for free users
- [ ] Lock icon overlay on feature icon
- [ ] "PREMIUM" badge in gold
- [ ] Clear title and description
- [ ] Chevron right arrow
- [ ] Tappable
- [ ] Navigate to paywall

### Upgrade Banner
- [ ] Shows only for free users
- [ ] Star icon
- [ ] Message: "Unlock AI insights..."
- [ ] "Upgrade" button
- [ ] Close "X" button
- [ ] Dismissible (stays dismissed in session)
- [ ] Gold left border accent

### Paywall Screen
- [ ] Modal presentation
- [ ] Close button (top-right)
- [ ] Gradient icon (gem)
- [ ] Title: "Unlock AI-Powered Insights"
- [ ] Subtitle with value prop
- [ ] Feature list (4 items with checkmarks)
- [ ] Monthly plan card (with MOST POPULAR badge)
- [ ] Lifetime plan card
- [ ] "Restore Purchases" link
- [ ] Terms & Privacy links
- [ ] Mock data notice (orange box)

### Subscription Management
- [ ] Back button
- [ ] Premium status card (gradient) OR free plan message
- [ ] Subscription details table
- [ ] Feature list
- [ ] Action buttons
- [ ] Mock data notice

---

## Navigation Map

```
Home Screen
  ├─→ Tap Locked Card → Paywall
  ├─→ Tap Upgrade Banner → Paywall
  ├─→ Tap Diamond Badge → Subscription Management
  └─→ Settings → Profile → Subscription Management

Paywall
  ├─→ Tap Close → Back to Home
  ├─→ Tap Purchase → Mock Alert
  └─→ Tap Restore → Mock Alert

Subscription Management
  ├─→ Back Button → Previous Screen
  ├─→ Upgrade (if free) → Paywall
  ├─→ Manage → Mock Alert
  └─→ Cancel → Confirm Dialog
```

---

## Common Issues & Solutions

### Issue: Diamond badge not showing
**Solution**: Verify `isPremium: true` in subscription hook

### Issue: Locked cards still visible for premium users
**Solution**: Check `isPremium` logic in HomeScreen

### Issue: Paywall not opening
**Solution**: Verify navigation route "Paywall" exists in App.js

### Issue: Gradient not rendering
**Solution**: Ensure expo-linear-gradient is installed: `npm install expo-linear-gradient`

### Issue: Icons not showing
**Solution**: Verify @expo/vector-icons is installed and icon names are correct

---

## Real Data Integration Checklist

When Agent 2 completes subscription service:

- [ ] Remove mock data notice from PaywallScreen
- [ ] Remove mock data notice from SubscriptionManagementScreen
- [ ] Wire up `getOfferings()` in PaywallScreen
- [ ] Wire up `purchasePackage()` in PaywallScreen
- [ ] Wire up `restorePurchases()` in PaywallScreen
- [ ] Wire up `manageSubscription()` in SubscriptionManagementScreen
- [ ] Test real purchase flow
- [ ] Test real restore flow
- [ ] Test subscription management
- [ ] Verify diamond badge appears after purchase
- [ ] Verify locked features unlock after purchase

---

## Performance Notes

- Premium badge animation runs once on mount
- Upgrade banner state persists during session (dismissible)
- All premium checks use `useSubscription` hook (single source of truth)
- No unnecessary re-renders

---

## Accessibility

All components include:
- Tappable areas (TouchableOpacity)
- Clear visual hierarchy
- High contrast text
- Readable font sizes (14-36px)
- Icon + text labels

---

## Questions?

- Review task file: `/docs/agent-tasks/agent-3-ui-ux-premium.md`
- Check completion report: `/docs/agent-3-completion-report.md`
- See PRD: `/docs/prd.md` - Epic 3

---

**Happy Testing!** 🎨
