# Final Testing Checklist

## Prerequisites
- [ ] Firebase security rules deployed: `firebase deploy --only firestore:rules`
- [ ] RevenueCat API key added to `.env`
- [ ] OpenAI API key added to `.env`
- [ ] App restarted after adding API keys

---

## Phase 1: Authentication & Security (Agent 1)

### User Registration
- [ ] Open app, tap "Register"
- [ ] Fill in: Name, Email, Password, Confirm Password
- [ ] Register successfully
- [ ] Auto-login to HomeScreen
- [ ] User name appears in header (not email)

### User Login
- [ ] Log out from HomeScreen
- [ ] Log in with correct credentials → Success
- [ ] Log in with wrong password → Error message
- [ ] Log in with non-existent email → Error message

### Password Reset
- [ ] On LoginScreen, tap "Forgot Password?"
- [ ] Enter email
- [ ] Receive password reset email
- [ ] Can reset password via email link

### Data Isolation
- [ ] Create User A, add 5 expenses
- [ ] Log out, create User B
- [ ] User B sees ZERO expenses (complete isolation)
- [ ] Log back as User A → See original 5 expenses

---

## Phase 2: Subscription System (Agent 2)

### Subscription Status
- [ ] New user defaults to `status: 'none'`
- [ ] `useSubscription()` hook returns `isPremium: false`

### Paywall Display
- [ ] Non-premium user sees locked feature cards on HomeScreen
- [ ] Tap locked feature → PaywallScreen opens
- [ ] See monthly ($10) and lifetime ($199) options

### Purchase Flow (Sandbox)
- [ ] Tap "Start 14-Day Free Trial"
- [ ] iOS payment sheet appears
- [ ] Complete purchase with sandbox account
- [ ] Success message shown
- [ ] Premium badge appears in header
- [ ] Locked features now unlocked

### Restore Purchases
- [ ] Install app on second device
- [ ] Log in with subscribed account
- [ ] Tap "Restore Purchases" on paywall
- [ ] Subscription restored successfully
- [ ] Premium features unlocked

### Subscription Management
- [ ] Go to Settings → Subscription
- [ ] See current plan (Monthly/Lifetime)
- [ ] See next billing date (or "No renewal" for lifetime)
- [ ] Tap "Manage Subscription" → Opens iOS Settings

---

## Phase 3: Premium UI (Agent 3)

### Premium Badge
- [ ] Premium users see diamond badge in header
- [ ] Badge animates with pulse on first appearance
- [ ] Badge visible on Home, Goals, Reports screens

### Locked Features (Free Users)
- [ ] See "Savings Goals" locked card
- [ ] See "Personality Report" locked card
- [ ] Lock icons displayed
- [ ] "PREMIUM" badge on cards
- [ ] Tap any locked card → Paywall opens

### Upgrade Banner
- [ ] Free users see upgrade banner at top
- [ ] Banner shows once per session
- [ ] Can dismiss banner (X button)
- [ ] Tap "Upgrade" → Paywall opens

---

## Phase 4: AI Savings Goals (Agent 4)

### Create Goal
- [ ] Navigate to Goals Dashboard
- [ ] Tap "Create Goal"
- [ ] Fill in: Name, Target Amount, Target Date
- [ ] Optional: Select category restrictions
- [ ] Tap "Create Goal" → Success
- [ ] Redirected to Goals Dashboard

### Goals Dashboard
- [ ] See list of active goals with progress bars
- [ ] Each goal shows: name, saved amount, target, days left
- [ ] Success probability badge (Green >70%, Yellow 40-70%, Red <40%)
- [ ] Pull-to-refresh updates progress

### Goal Detail
- [ ] Tap a goal card
- [ ] See large progress circle
- [ ] See AI Recommendations section
- [ ] Tap "Generate AI Recommendations"
- [ ] Wait 5-10 seconds
- [ ] See personalized recommendations (3 bullet points)
- [ ] Recommendations cached for 24 hours

### Goal Calculations
- [ ] Add expenses after creating goal
- [ ] Progress updates automatically
- [ ] Success probability recalculates
- [ ] Goal marked "completed" when amount reached
- [ ] Goal marked "failed" when overdue

### Edit/Delete Goal
- [ ] Tap goal, tap "Edit"
- [ ] Modify name/amount/date
- [ ] Save changes → Updates successfully
- [ ] Tap "Delete" → Confirmation dialog
- [ ] Confirm delete → Goal removed

---

## Phase 5: AI Personality Reports (Agent 5)

### View Report
- [ ] Navigate to Personality Report screen
- [ ] If no report: See "Generate Report" button
- [ ] If report exists: See beautiful report UI

### Generate Report
- [ ] Add at least 5 expenses for current month
- [ ] Tap "Generate Report"
- [ ] Wait 10-15 seconds (GPT-4 processing)
- [ ] See success message
- [ ] Report displays with:
  - Personality type (e.g., "Conscious Spender")
  - Summary paragraph
  - Monthly stats (income, expenses, savings)
  - Top 5 spending categories with progress bars
  - Your Strengths (5 items)
  - Areas for Improvement (3 items)
  - AI Recommendations (5 items)
  - Category Insights with trends

### Report Quality
- [ ] Summary is warm and conversational
- [ ] Strengths are specific and positive
- [ ] Improvements are gentle, not harsh
- [ ] Recommendations include dollar amounts
- [ ] Category insights show trends (↑↓→)

### Report History
- [ ] Tap history icon in header
- [ ] See list of past reports
- [ ] See statistics (total reports, avg savings, best month)
- [ ] Tap any report → View full details
- [ ] Can swipe-to-delete old reports

### Share Report
- [ ] Tap "Share Report" button
- [ ] Native share dialog appears
- [ ] Can share via Messages, Email, Social
- [ ] Shared content includes personality type and summary

---

## Phase 6: Integration Testing

### Cross-Feature Testing
- [ ] Create goal → Add expenses → Progress updates
- [ ] Generate personality report → See expenses in category insights
- [ ] Purchase subscription → All premium features unlock
- [ ] Subscription expires → Premium features lock again

### Offline Mode
- [ ] Turn off WiFi/data
- [ ] Can still view expenses (cached)
- [ ] Can still add expenses (syncs when online)
- [ ] AI features show "No internet" message

### Performance
- [ ] App launches in < 3 seconds
- [ ] Expense list scrolls smoothly (60fps)
- [ ] AI report generates in < 15 seconds
- [ ] No memory leaks after 30 minutes of use

---

## Phase 7: Edge Cases & Error Handling

### Invalid Data
- [ ] Create goal with negative amount → Error
- [ ] Create goal with past date → Error
- [ ] Generate report with < 5 expenses → Error message

### Network Errors
- [ ] Turn off internet during AI generation
- [ ] See friendly error message (not crash)
- [ ] Can retry when online

### Subscription Edge Cases
- [ ] Trial expires → Locked features immediately
- [ ] Payment fails → Enters grace period (24 hours)
- [ ] Restore with no purchases → "No purchases found"

---

## Phase 8: Security Testing

### Data Isolation (Critical)
- [ ] User A creates goal
- [ ] User B logs in
- [ ] User B CANNOT see User A's goal
- [ ] User B CANNOT access User A's expenses
- [ ] User B CANNOT generate report using User A's data

### Authentication
- [ ] Cannot access app without logging in
- [ ] Session persists after app restart
- [ ] Log out clears all cached data
- [ ] Cannot bypass paywall by modifying client code

---

## Phase 9: iOS Specific

### Device Compatibility
- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14 Pro (notch)
- [ ] Test on iPhone 14 Pro Max (large screen)
- [ ] UI adapts to all screen sizes

### iOS Features
- [ ] Face ID login works
- [ ] Profile photo picker opens
- [ ] Date picker shows iOS native UI
- [ ] Share dialog uses iOS share sheet

---

## Phase 10: App Store Readiness

### Metadata
- [ ] App name: "Expense Monitor"
- [ ] Bundle ID configured
- [ ] Version number set
- [ ] Build number incremented

### Screenshots
- [ ] HomeScreen with expenses
- [ ] Goals Dashboard
- [ ] Personality Report
- [ ] Paywall screen
- [ ] Settings screen

### Privacy
- [ ] Privacy policy URL working
- [ ] Terms of service URL working
- [ ] Data usage description accurate

---

## Critical Bugs Checklist

If ANY of these fail, DO NOT SHIP:
- [ ] Data isolation working (users cannot see each other's data)
- [ ] Subscription purchases working in sandbox
- [ ] Restore purchases working
- [ ] Firebase security rules deployed
- [ ] No app crashes during normal use
- [ ] AI features generate quality content

---

## Success Criteria

**Pass:** All items above checked ✅
**Ready for TestFlight:** Pass + no critical bugs
**Ready for App Store:** TestFlight success + beta feedback positive

---

**Estimated Testing Time:** 3-4 hours for complete checklist
