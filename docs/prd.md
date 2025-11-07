# Expense Monitor Premium - Product Requirements Document (PRD)

## Document Information
**Version:** 1.0
**Date:** 2025-11-07
**Author:** John (Product Manager)
**Status:** Draft for Review

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-07 | 1.0 | Initial PRD for Premium AI Features & Multi-User Support | John |

---

## Goals and Background Context

### Goals
- **Enable multi-user support** with complete data isolation to ensure users can only access their own expense data
- **Implement premium subscription system** with two tiers: $10/month recurring and $199 lifetime bundle
- **Deliver AI-Powered Saving Goals Engine** that helps users set, track, and achieve financial goals with predictive analytics
- **Generate personalized "Expense Personality" reports** that provide engaging, actionable insights based on spending patterns
- **Achieve 5-10% conversion rate** from free to paid users within first 3 months
- **Reach 100-200 paying subscribers** in the first quarter post-launch
- **Optimize for user growth** first, then monetization - build a valuable product that people want to pay for

### Background Context
Expense Monitor currently provides solid basic expense tracking with Google Sheets synchronization. However, to scale beyond a few test users and create a sustainable business, we need two critical foundations: (1) proper multi-user architecture with data isolation, and (2) compelling premium features that justify subscription pricing.

AI-powered financial insights represent a significant differentiation opportunity. While many apps track expenses, few provide personalized, actionable guidance that helps users actually improve their financial behavior. By combining predictive analytics for goal achievement with personality-driven spending reports, we create an engaging premium experience that users will value and share.

This PRD focuses on three interconnected initiatives: securing user data isolation, implementing in-app purchase infrastructure, and delivering two flagship AI features. Success means converting 5-10% of free users to paid subscribers through demonstrable value.

---

## Requirements

### Functional Requirements

**Multi-User Data Isolation**
- **FR1:** User authentication must use Firebase Authentication with unique user IDs (UIDs)
- **FR2:** All Firestore queries must filter by authenticated user's UID to ensure complete data isolation
- **FR3:** Expenses, budgets, and settings must be stored in user-scoped Firestore collections or documents
- **FR4:** Google Sheets sync must be user-specific - each user's webhook URL stored separately
- **FR5:** User signup must capture display name, email, and optional profile photo

**Subscription & In-App Purchase**
- **FR6:** Implement StoreKit/RevenueCat for iOS in-app purchases
- **FR7:** Offer two subscription products: Monthly ($10/month auto-renewing) and Lifetime ($199 one-time purchase)
- **FR8:** Provide 14-day free trial for monthly subscription
- **FR9:** Display subscription status throughout the app (active, trial, expired)
- **FR10:** Lock AI features behind subscription paywall - free users see promotional UI
- **FR11:** Diamond-shaped premium button visible only to subscribed users in main UI
- **FR12:** Handle subscription lifecycle: purchase, renewal, cancellation, restoration, expiry
- **FR13:** When subscription expires, lock AI features but keep historical expense data accessible

**AI-Powered Saving Goals Engine**
- **FR14:** Users can create savings goals with: name, target amount, target date, optional category restrictions
- **FR15:** Display goal progress dashboard showing: amount saved, percentage complete, days remaining
- **FR16:** Generate AI-powered micro-adjustment recommendations (e.g., "Cut restaurant spending by $5/week to hit goal")
- **FR17:** Calculate and visualize success probability using expense history and goal parameters
- **FR18:** Send intelligent notifications when users are off-track or ahead of schedule
- **FR19:** Track multiple goals simultaneously with individual progress indicators
- **FR20:** AI engine analyzes spending patterns to suggest realistic goal timelines

**AI Expense Personality Reports**
- **FR21:** Generate monthly "Expense Personality" report based on user's spending patterns
- **FR22:** Personality report includes: personality type name, spending strengths, areas for improvement, category-specific insights
- **FR23:** Use conversational AI tone (e.g., "You're a Conscious Spender - consistent with groceries, spontaneous with tech purchases")
- **FR24:** Identify spending patterns: consistent categories, irregular splurges, improving/declining trends
- **FR25:** Provide actionable recommendations tailored to user's personality type
- **FR26:** Display visual summary of personality report (charts, badges, trend indicators)
- **FR27:** Allow users to share personality reports (screenshot or social media)

**Premium UI/UX**
- **FR28:** Implement paywall screen for non-subscribers attempting to access AI features
- **FR29:** Display pricing tiers with clear value propositions and feature comparisons
- **FR30:** Show "Start Free Trial" button prominently on paywall
- **FR31:** Premium users see diamond-shaped indicator in navigation/header
- **FR32:** Free users see subtle premium feature teasers with "Upgrade" CTAs

### Non-Functional Requirements

**Performance & Scalability**
- **NFR1:** AI report generation must complete within 10 seconds for typical user (100-500 expenses)
- **NFR2:** App must remain responsive during AI processing (use background tasks/loading states)
- **NFR3:** Firestore queries must be indexed and optimized for fast user-scoped data retrieval
- **NFR4:** Support up to 10,000 expenses per user without performance degradation

**Security & Privacy**
- **NFR5:** All user data must be encrypted at rest (Firestore default encryption)
- **NFR6:** API keys (OpenAI, Firebase) must be secured using environment variables or secure key management
- **NFR7:** No user expense data may be shared between accounts under any circumstances
- **NFR8:** AI processing must not expose PII to third-party services beyond necessary API calls

**Cost Management**
- **NFR9:** OpenAI API usage must target $0.03-$0.10 per active user per month
- **NFR10:** Implement rate limiting on AI features to prevent abuse (e.g., max 3 reports per day per user)
- **NFR11:** Cache AI responses where appropriate to reduce API costs

**User Experience**
- **NFR12:** AI-generated content must feel personal, not robotic or generic
- **NFR13:** Error messages must be user-friendly (e.g., "Couldn't generate report - please try again" vs technical errors)
- **NFR14:** Free trial must be clearly communicated - no surprise charges

**Testing & Quality**
- **NFR15:** Unit tests for data isolation logic (ensure user A cannot access user B's data)
- **NFR16:** Integration tests for subscription lifecycle (purchase, restore, expiry)
- **NFR17:** Manual testing of AI outputs for quality, tone, and accuracy

---

## User Interface Design Goals

### Overall UX Vision
The app should feel like having a friendly, intelligent financial advisor in your pocket. Premium features should delight users with insights they couldn't get elsewhere, presented in a warm, conversational tone. The free experience remains clean and functional, with tasteful upgrade prompts that highlight value without being pushy.

### Key Interaction Paradigms
- **Goal Setting:** Simple form-based input with smart defaults (AI suggests realistic timelines based on past spending)
- **Progress Tracking:** Visual dashboard with charts, progress bars, and probability indicators
- **Personality Reports:** Swipeable card-based UI with distinct sections (personality type, strengths, recommendations)
- **Paywall:** Non-intrusive modal that appears when tapping locked features, with clear pricing and trial information
- **Premium Indicator:** Subtle diamond icon in top-right corner for subscribed users

### Core Screens and Views
1. **Home/Expenses Screen** - Existing expense list with subtle AI feature teaser cards
2. **Goals Dashboard** - List of active goals with progress indicators (Premium)
3. **Goal Detail Screen** - Individual goal progress, AI recommendations, success probability chart (Premium)
4. **Create/Edit Goal Screen** - Form to set up new savings goals
5. **Personality Report Screen** - Full AI-generated personality report with shareable visuals (Premium)
6. **Paywall/Pricing Screen** - Subscription tiers, free trial info, purchase buttons
7. **Settings Screen** - Existing settings + subscription management section
8. **Subscription Management** - View current plan, billing date, cancel/restore options

### Accessibility
**WCAG AA** - Ensure color contrast, screen reader support, and touch target sizes meet accessibility standards.

### Branding
Maintain existing modern, clean aesthetic with blue (#1976D2) as primary color. Add premium touches:
- **Diamond icon** for premium features (subtle gold/teal gradient)
- **AI elements** use soft purple/blue gradients to differentiate from core tracking features
- **Success indicators** use encouraging greens; warnings use friendly oranges (not harsh reds)

### Target Device and Platforms
**iOS first** (iPhone 12+ optimized), with responsive design for iPhone SE and Pro Max models. Android support planned for future phase. All AI features require internet connectivity.

---

## Technical Assumptions

### Repository Structure
**Monorepo** - Single repository containing React Native Expo app with clear folder structure for features.

### Service Architecture
**Firebase Backend-as-a-Service** with the following components:
- **Firebase Authentication** for user management
- **Firestore** for data storage with user-scoped security rules
- **Cloud Functions** (optional) for background processing if needed
- **OpenAI API** (GPT-3.5-turbo or GPT-4) for AI report generation
- **RevenueCat** for simplified subscription management and cross-platform support

**Architecture Pattern:** Client-side app with cloud services (Firebase + OpenAI). No custom backend server required initially.

### Testing Requirements
- **Unit Testing:** Jest for critical business logic (data isolation, goal calculations, subscription state)
- **Integration Testing:** Test Firebase security rules to ensure data isolation
- **Manual Testing:** Extensive manual testing of subscription flows (purchase, restore, trial expiry) and AI output quality
- **Beta Testing:** TestFlight beta with 10-20 users before App Store submission

### Technical Stack
- **Frontend:** React Native (Expo SDK 50+)
- **Navigation:** React Navigation
- **State Management:** React Context API + AsyncStorage for local preferences
- **Authentication:** Firebase Auth (@react-native-firebase/auth)
- **Database:** Firestore (@react-native-firebase/firestore)
- **Subscriptions:** RevenueCat SDK (react-native-purchases)
- **AI:** OpenAI API (gpt-3.5-turbo for cost efficiency, gpt-4 for premium reports)
- **Image Picker:** expo-image-picker (already integrated)
- **Icons:** @expo/vector-icons (already integrated)

### Additional Technical Assumptions and Requests
- **Environment Variables:** Use `app.config.js` or Expo EAS Secrets for API keys (Firebase, OpenAI, RevenueCat)
- **Error Handling:** Graceful degradation for AI features (if API fails, show cached report or friendly error)
- **Offline Support:** Core expense tracking works offline; AI features require internet (show clear messaging)
- **App Store Submission:** Set up EAS Build for iOS app submission, include subscription metadata in App Store Connect
- **Analytics:** Basic event tracking for subscription funnel (trial start, conversion, churn) - use Firebase Analytics or RevenueCat analytics

---

## Epic List

### Epic 1: Multi-User Data Isolation & Security Foundation
**Goal:** Ensure every user's expense data is completely isolated with proper Firebase Authentication and Firestore security rules, preventing any data leakage between users.

### Epic 2: In-App Purchase & Subscription Infrastructure
**Goal:** Implement RevenueCat SDK with StoreKit to enable users to purchase monthly ($10) or lifetime ($199) subscriptions, manage trials, and handle subscription lifecycle events.

### Epic 3: Premium UI & Paywall Experience
**Goal:** Design and implement premium-gated UI with diamond indicator for subscribers, paywall modal for non-subscribers, and subscription management screen.

### Epic 4: AI-Powered Saving Goals Engine
**Goal:** Enable users to create savings goals and receive AI-generated micro-adjustment recommendations with visual success probability indicators.

### Epic 5: AI Expense Personality Reports
**Goal:** Generate monthly personalized "Expense Personality" reports using OpenAI that analyze spending patterns and provide engaging, actionable insights.

---

## Epic 1: Multi-User Data Isolation & Security Foundation

**Expanded Goal:** Establish robust multi-user architecture by implementing Firebase Authentication, updating all Firestore queries to filter by user ID, and writing security rules that enforce complete data isolation. This prevents any possibility of users accessing each other's expense data and ensures GDPR/privacy compliance.

### Story 1.1: Implement Firebase Authentication for User Signup and Login

**As a** new user,
**I want** to create an account with my name, email, and password,
**so that** I can securely access my personal expense data.

**Acceptance Criteria:**
1. User can sign up with email, password, and display name (required fields)
2. Firebase Authentication creates unique UID for each user
3. Display name is stored in Firebase Auth user profile
4. User can log in with email and password
5. User can log out and session is properly cleared
6. Error messages display for invalid credentials or existing email
7. AuthContext maintains current user state throughout app
8. Password reset functionality available via "Forgot Password" link

### Story 1.2: Update Firestore Data Model for User-Scoped Collections

**As a** developer,
**I want** all expense data stored under user-specific paths in Firestore,
**so that** queries automatically scope to the authenticated user's data.

**Acceptance Criteria:**
1. Firestore structure uses `/users/{userId}/expenses/{expenseId}` pattern
2. Budget settings stored at `/users/{userId}/settings/budget`
3. Webhook URLs stored at `/users/{userId}/settings/webhookUrl`
4. All existing expense service methods updated to include user ID in queries
5. Migration strategy documented for any existing test data
6. No hardcoded user IDs - all queries use `auth.currentUser.uid`

### Story 1.3: Write Firestore Security Rules for Data Isolation

**As a** system administrator,
**I want** Firestore security rules that enforce user data isolation,
**so that** users cannot read or write other users' data under any circumstances.

**Acceptance Criteria:**
1. Security rules allow read/write only if `request.auth.uid == userId`
2. Unauthenticated requests are rejected
3. Rules cover all collections: expenses, settings, goals, reports
4. Rules tested with Firebase Emulator Suite to verify isolation
5. No wildcard rules that could allow data leakage
6. Rules deployed to production Firestore instance

### Story 1.4: Update All Expense Service Methods for User-Scoped Queries

**As a** user,
**I want** all my expense operations (add, edit, delete, list) to only affect my own data,
**so that** I never see or modify another user's expenses.

**Acceptance Criteria:**
1. `addExpense()` saves to current user's collection
2. `subscribeToExpenses()` filters by current user ID
3. `updateExpense()` only updates if expense belongs to current user
4. `deleteExpense()` only deletes if expense belongs to current user
5. Google Sheets sync uses user-specific webhook URL
6. All queries validate `auth.currentUser` exists before executing
7. Unit tests verify queries cannot access other users' data

### Story 1.5: Add User Profile Display in Settings

**As a** user,
**I want** to see my profile information (name, email, photo) in Settings,
**so that** I can verify my account details and update them if needed.

**Acceptance Criteria:**
1. Settings screen displays current user's display name and email
2. User can update display name via edit mode
3. User can update profile photo using image picker
4. Changes persist to Firebase Auth user profile
5. Updated name/photo reflected immediately across app
6. Email displayed as read-only (cannot be changed in-app)

---

## Epic 2: In-App Purchase & Subscription Infrastructure

**Expanded Goal:** Integrate RevenueCat SDK to handle iOS in-app purchases, configure two subscription products (monthly $10 and lifetime $199), implement 14-day free trial for monthly tier, and manage subscription lifecycle (purchase, restore, renewal, expiry) throughout the app.

### Story 2.1: Set Up RevenueCat Account and Configure Products

**As a** developer,
**I want** RevenueCat configured with App Store Connect products,
**so that** I can test and sell subscriptions through the app.

**Acceptance Criteria:**
1. RevenueCat account created and linked to App Store Connect
2. Monthly subscription product created: `expense_monitor_monthly` - $10/month with 14-day trial
3. Lifetime subscription product created: `expense_monitor_lifetime` - $199 one-time purchase
4. Products configured in RevenueCat dashboard with correct identifiers
5. Sandbox test accounts set up in App Store Connect for testing
6. RevenueCat API key obtained and stored securely
7. Documentation includes setup instructions for App Store Connect

### Story 2.2: Install and Initialize RevenueCat SDK

**As a** developer,
**I want** RevenueCat SDK installed and initialized on app launch,
**so that** the app can communicate with the subscription backend.

**Acceptance Criteria:**
1. `react-native-purchases` package installed via npm
2. RevenueCat SDK initialized in App.js with API key from environment variables
3. User identified in RevenueCat using Firebase UID: `Purchases.logIn(user.uid)`
4. Initialization happens after Firebase auth is ready
5. Error handling for initialization failures with retry logic
6. RevenueCat debug logs enabled in development, disabled in production

### Story 2.3: Create Subscription Service to Manage Purchase State

**As a** developer,
**I want** a centralized subscription service that exposes purchase state,
**so that** the app can easily check if user has active subscription.

**Acceptance Criteria:**
1. `/src/services/subscriptionService.js` created with methods:
   - `checkSubscriptionStatus()` - returns active/trial/expired/none
   - `getOfferings()` - fetches available products from RevenueCat
   - `purchasePackage(package)` - initiates purchase flow
   - `restorePurchases()` - restores previous purchases
2. Service caches subscription status in AsyncStorage for offline access
3. Service exposes React hook: `useSubscription()` for components
4. Subscription status updates automatically on purchase/restore/expiry
5. Service handles RevenueCat errors gracefully (network issues, user cancellations)

### Story 2.4: Implement Purchase Flow for Monthly and Lifetime Subscriptions

**As a** user,
**I want** to purchase a subscription from the paywall screen,
**so that** I can access premium AI features.

**Acceptance Criteria:**
1. Paywall screen displays both subscription options with pricing
2. Monthly option shows "Start 14-Day Free Trial" button
3. Lifetime option shows "Buy Lifetime Access for $199" button
4. Tapping purchase button triggers RevenueCat purchase flow
5. Native iOS payment sheet displays with correct pricing
6. On successful purchase, subscription status updates immediately
7. User redirected to premium feature they tried to access
8. Purchase errors shown in user-friendly alert (e.g., "Purchase canceled")
9. Loading state shown during purchase processing

### Story 2.5: Implement Restore Purchases Functionality

**As a** user,
**I want** to restore my purchases on a new device or after reinstalling,
**so that** I don't lose access to my paid subscription.

**Acceptance Criteria:**
1. "Restore Purchases" button available on paywall screen
2. "Restore Purchases" option in Settings → Subscription section
3. Tapping restore triggers `Purchases.restorePurchases()`
4. On successful restore, subscription status updates and premium features unlock
5. Success message shown: "Subscription restored successfully"
6. If no purchases found, show message: "No previous purchases found"
7. Restore works for both monthly and lifetime subscriptions

### Story 2.6: Handle Subscription Expiry and Trial End

**As a** system,
**I want** to detect when subscriptions expire and lock premium features,
**so that** non-paying users cannot access AI features.

**Acceptance Criteria:**
1. App checks subscription status on launch and resume
2. When subscription expires, premium features are locked immediately
3. User shown message: "Your subscription has expired. Renew to continue using AI features."
4. Expired users can still view historical expense data (free features)
5. "Renew Subscription" button directs to paywall screen
6. Trial expiry handled same as regular expiry (prompt to subscribe)
7. Grace period of 24 hours for failed payment retries (RevenueCat default)

### Story 2.7: Display Subscription Status in Settings

**As a** user,
**I want** to see my subscription details in Settings,
**so that** I know when my subscription renews or when my trial ends.

**Acceptance Criteria:**
1. Settings screen has "Subscription" section showing:
   - Current plan: "Monthly Premium" or "Lifetime Premium" or "Free"
   - Status: "Active", "Trial (X days left)", "Expired"
   - Next billing date (for monthly subscribers)
   - "Manage Subscription" button (opens App Store subscriptions)
2. Free users see "Upgrade to Premium" button
3. Lifetime subscribers see "Lifetime Access - No Renewal Needed"
4. Monthly subscribers see "Cancel Subscription" link to App Store
5. All subscription info pulled from RevenueCat customer info

---

## Epic 3: Premium UI & Paywall Experience

**Expanded Goal:** Design and implement polished premium-gated UI including diamond indicator for active subscribers, paywall modal with pricing tiers for non-subscribers, subscription management screen, and subtle upgrade prompts throughout the app.

### Story 3.1: Create Paywall Screen with Subscription Tiers

**As a** non-subscribed user,
**I want** to see a clear paywall with subscription options when I tap locked features,
**so that** I understand the value and pricing of premium features.

**Acceptance Criteria:**
1. Paywall screen displays heading: "Unlock AI-Powered Insights"
2. Feature list shown with checkmarks:
   - "AI Saving Goals Engine with predictive analytics"
   - "Personalized Expense Personality Reports"
   - "Smart spending recommendations"
   - "Unlimited goal tracking"
3. Two subscription cards displayed side-by-side or stacked:
   - **Monthly:** "$10/month" with "Start 14-Day Free Trial" button
   - **Lifetime:** "$199 one-time" with "Buy Lifetime Access" button
4. "Restore Purchases" link at bottom
5. "Terms of Service" and "Privacy Policy" links
6. Close button to dismiss paywall
7. Paywall uses modern card-based design matching app aesthetic

### Story 3.2: Add Diamond Premium Indicator for Subscribed Users

**As a** subscribed user,
**I want** to see a diamond icon indicating my premium status,
**so that** I feel recognized for my subscription.

**Acceptance Criteria:**
1. Diamond-shaped icon displayed in top-right corner of main screens
2. Icon uses subtle gold/teal gradient (#FFD700 to #00BFA6)
3. Icon size: 24x24 px, non-intrusive
4. Icon visible on: Home, Goals Dashboard, Personality Report screens
5. Icon only shown when `subscriptionStatus === 'active' || 'trial' || 'lifetime'`
6. Tapping icon opens subscription details modal (optional enhancement)
7. Icon animated with subtle pulse on first app launch after purchase

### Story 3.3: Implement Lock Icons and Upgrade CTAs for Free Users

**As a** free user,
**I want** to see which features require premium,
**so that** I know what I'll get if I upgrade.

**Acceptance Criteria:**
1. "Goals" tab shows lock icon if user is not subscribed
2. "Personality Report" card on Home screen shows "Premium" badge and lock icon
3. Tapping any locked feature shows paywall modal
4. Lock icons use consistent styling (gray with white lock symbol)
5. Subtle "Upgrade to Premium" banner at top of Home screen for free users (dismissible)
6. Banner shows once per session, not on every screen load
7. All locked features remain visible (not hidden) to encourage discovery

### Story 3.4: Create Subscription Management Screen

**As a** subscribed user,
**I want** a dedicated screen to manage my subscription,
**so that** I can view my plan details and manage billing.

**Acceptance Criteria:**
1. Accessible from Settings → "Subscription" menu item
2. Screen shows:
   - Current plan name and icon
   - Subscription status (Active, Trial, Expired)
   - Next billing date (or "Lifetime - No Billing")
   - Amount charged (e.g., "$10.00 per month")
3. "Manage Subscription" button opens iOS Settings → Subscriptions
4. "Restore Purchases" button (calls restore function)
5. "Cancel Subscription" button (opens iOS subscription management)
6. For lifetime subscribers: "You have lifetime access - no renewal needed" message
7. Screen matches existing Settings design (blue header, white cards)

### Story 3.5: Add Premium Feature Teasers on Home Screen

**As a** free user,
**I want** to see previews of premium features on the Home screen,
**so that** I'm tempted to upgrade when I see the value.

**Acceptance Criteria:**
1. "See Your Expense Personality" teaser card displayed after expense list
2. Card shows sample personality icon, blurred text, and "Unlock with Premium" button
3. "Track Your Savings Goals" teaser card with goal icon and upgrade CTA
4. Teaser cards use glassmorphism or subtle blur effect over sample content
5. Tapping any teaser opens paywall modal
6. Teasers shown max once per day (stored in AsyncStorage)
7. Premium users never see teasers (replaced with actual features)

---

## Epic 4: AI-Powered Saving Goals Engine

**Expanded Goal:** Enable users to create and track savings goals, then use OpenAI to analyze their expense history and provide personalized micro-adjustment recommendations (e.g., "Cut coffee spending by $5/week") along with a visual success probability indicator.

### Story 4.1: Create Goals Data Model and Firestore Schema

**As a** developer,
**I want** a Firestore schema for storing user goals,
**so that** goals persist across sessions and devices.

**Acceptance Criteria:**
1. Goals stored at `/users/{userId}/goals/{goalId}`
2. Goal document structure:
   ```
   {
     id: string,
     userId: string,
     name: string,
     targetAmount: number,
     currentAmount: number,
     targetDate: Timestamp,
     createdAt: Timestamp,
     updatedAt: Timestamp,
     categoryRestrictions: string[] | null,
     status: 'active' | 'completed' | 'failed'
   }
   ```
3. Firestore security rules allow only authenticated user to read/write their goals
4. Index created for querying goals by `userId` and `status`
5. Service methods created: `createGoal()`, `updateGoal()`, `deleteGoal()`, `subscribeToGoals()`

### Story 4.2: Build Create/Edit Goal Screen

**As a** premium user,
**I want** to create a savings goal with a name, amount, and target date,
**so that** I can track my progress toward financial objectives.

**Acceptance Criteria:**
1. "Create Goal" button on Goals Dashboard (visible only to premium users)
2. Create Goal form includes:
   - Goal name (text input, required, e.g., "Save for vacation")
   - Target amount (number input, required, e.g., "1500")
   - Target date (date picker, required)
   - Optional: Category restrictions (multi-select, e.g., "Track only Restaurant & Entertainment")
3. "Save Goal" button creates goal in Firestore
4. Form validation: name required, amount > 0, date in future
5. Success message: "Goal created successfully"
6. User redirected to Goals Dashboard after creation
7. Edit mode allows updating existing goals (same form, pre-filled)

### Story 4.3: Display Goals Dashboard with Progress Indicators

**As a** premium user,
**I want** to see all my active goals with progress bars,
**so that** I can track how close I am to achieving each goal.

**Acceptance Criteria:**
1. Goals Dashboard lists all active goals (status: 'active')
2. Each goal card shows:
   - Goal name
   - Progress bar (visual percentage complete)
   - "Saved: $XXX / $XXX" (current vs target amount)
   - "XX days remaining"
   - Tap to view goal details
3. Empty state: "No goals yet - Create your first goal!"
4. Goals sorted by target date (soonest first)
5. Completed goals shown in separate "Completed" section with green checkmark
6. Failed goals (past target date, not achieved) shown in "Missed" section
7. Pull-to-refresh updates goal progress

### Story 4.4: Calculate Goal Progress Based on Expense History

**As a** system,
**I want** to calculate how much a user has saved toward their goal,
**so that** progress indicators are accurate.

**Acceptance Criteria:**
1. Progress calculated by:
   - If no category restrictions: `currentAmount = (totalIncome - totalExpenses) since goal creation`
   - If category restrictions: `currentAmount = sum of expenses in restricted categories since goal creation`
2. Progress updates in real-time as user adds/edits expenses
3. Percentage complete: `(currentAmount / targetAmount) * 100`
4. Days remaining: `targetDate - today`
5. Status auto-updated:
   - `completed` if currentAmount >= targetAmount
   - `failed` if targetDate passed and currentAmount < targetAmount
6. Progress calculation runs efficiently (indexed Firestore queries)

### Story 4.5: Integrate OpenAI API for Goal Recommendations

**As a** premium user,
**I want** AI-generated recommendations to help me achieve my goal,
**so that** I know exactly what adjustments to make.

**Acceptance Criteria:**
1. OpenAI API integrated using `openai` npm package
2. API key stored securely in environment variables
3. Prompt template created for goal recommendations:
   ```
   User has a goal to save $X by [date]. Based on their spending history:
   - Average weekly spending on [categories]: $Y
   - Current progress: $Z saved
   - Days remaining: N

   Provide 2-3 specific, actionable micro-adjustments to help them hit their goal.
   Use friendly, encouraging tone. Format as bullet points.
   ```
4. AI service method: `generateGoalRecommendations(goal, expenses)` returns string
5. Recommendations cached in Firestore (`/users/{userId}/goals/{goalId}/aiRecommendations`)
6. Cache expires after 24 hours (regenerate if requested again)
7. Rate limit: Max 3 recommendations per goal per day

### Story 4.6: Display AI Recommendations and Success Probability on Goal Detail Screen

**As a** premium user,
**I want** to see AI-generated recommendations and my success probability,
**so that** I stay motivated and know what actions to take.

**Acceptance Criteria:**
1. Goal Detail screen shows:
   - Goal name and progress bar (from dashboard)
   - "AI Recommendations" section with bulleted suggestions (e.g., "Cut restaurant spending by $5/week")
   - Success probability indicator (e.g., "75% likely to succeed")
   - Visual chart: line graph showing projected savings vs goal trajectory
2. "Refresh Recommendations" button (if cached recommendations > 24 hours old)
3. Loading state while AI generates recommendations
4. Error handling: "Couldn't generate recommendations - please try again later"
5. Success probability calculated by:
   - Simple model: `(current savings rate * days remaining) >= remaining amount`
   - Visual: Green (>70%), Yellow (40-70%), Red (<40%)
6. Chart uses Victory Native or react-native-chart-kit

### Story 4.7: Send Goal Progress Notifications

**As a** premium user,
**I want** notifications when I'm ahead or behind on my goal,
**so that** I stay accountable.

**Acceptance Criteria:**
1. Expo Notifications configured for local push notifications
2. Notification types:
   - "You're 25% ahead of schedule! Keep it up 🎉" (weekly check-in if ahead)
   - "You're $50 behind your goal. Review AI tips to catch up." (weekly if behind)
   - "3 days until goal deadline - you're almost there!" (3 days before target date)
3. Notifications sent at user-friendly times (e.g., Sunday 10 AM)
4. User can disable notifications in Settings
5. Notification taps open Goal Detail screen
6. Background task checks goals weekly (use Expo TaskManager)

---

## Epic 5: AI Expense Personality Reports

**Expanded Goal:** Use OpenAI to analyze user's spending patterns monthly and generate engaging "Expense Personality" reports that identify their financial personality type, spending strengths, areas for improvement, and provide actionable recommendations in a conversational tone.

### Story 5.1: Create Personality Reports Data Model

**As a** developer,
**I want** a Firestore schema for storing generated personality reports,
**so that** reports are cached and can be viewed later without regenerating.

**Acceptance Criteria:**
1. Reports stored at `/users/{userId}/personalityReports/{reportId}`
2. Report document structure:
   ```
   {
     id: string,
     userId: string,
     month: string, // e.g., "2025-11"
     generatedAt: Timestamp,
     personalityType: string, // e.g., "Conscious Spender"
     summary: string, // AI-generated summary
     strengths: string[], // e.g., ["Consistent with groceries"]
     improvements: string[], // e.g., ["Spontaneous with tech"]
     recommendations: string[], // Actionable tips
     categoryInsights: { category: string, insight: string }[]
   }
   ```
3. Firestore security rules allow only authenticated user to read/write their reports
4. Index created for querying reports by `userId` and `month`
5. Service methods: `generatePersonalityReport()`, `getLatestReport()`, `getReportHistory()`

### Story 5.2: Build AI Prompt Template for Personality Analysis

**As a** developer,
**I want** a well-structured OpenAI prompt that generates personality reports,
**so that** AI output is consistent, engaging, and actionable.

**Acceptance Criteria:**
1. Prompt template includes:
   - User's expense summary: total income, total expenses, top 5 categories
   - Spending patterns: consistent categories, irregular splurges, trends
   - Request for personality type name (creative, friendly)
   - Request for 3-5 strengths, 2-3 improvements, 3-5 recommendations
2. Prompt specifies tone: "Conversational, encouraging, personal (not robotic)"
3. Prompt includes examples of good output:
   ```
   Personality Type: "Conscious Spender"
   Summary: "You're doing great! You're consistent with groceries and rent, but love treating yourself to tech gadgets. Your transport spending has improved this month!"
   Strengths: [...]
   Improvements: [...]
   ```
4. Prompt uses GPT-4 for high-quality language (fallback to GPT-3.5 for cost)
5. Max tokens: 800 (enough for detailed report without excessive cost)

### Story 5.3: Implement Personality Report Generation Service

**As a** premium user,
**I want** the app to automatically generate my monthly personality report,
**so that** I get fresh insights each month.

**Acceptance Criteria:**
1. Service method: `generatePersonalityReport(userId, month)` calls OpenAI API
2. Method aggregates last 30 days of expenses for analysis
3. AI response parsed into structured report format (personality type, strengths, etc.)
4. Generated report saved to Firestore for caching
5. If report for current month already exists, return cached version
6. Rate limit: Max 1 report generation per user per day (prevent abuse)
7. Error handling: Graceful failure if OpenAI API is down (retry mechanism)
8. Cost optimization: Use GPT-3.5 if expense count < 50, GPT-4 if >= 50

### Story 5.4: Create Personality Report Screen UI

**As a** premium user,
**I want** a beautiful screen to view my personality report,
**so that** I enjoy reading and sharing my insights.

**Acceptance Criteria:**
1. Personality Report screen accessible from Home screen card (premium users only)
2. Screen displays:
   - Month/year header (e.g., "November 2025 Report")
   - Personality type badge (large, centered, e.g., "🌟 Conscious Spender")
   - Summary paragraph (AI-generated, conversational)
   - "Your Strengths" section with green checkmarks
   - "Areas to Improve" section with orange icons
   - "Recommendations" section with actionable tips
   - Category insights cards (e.g., "Groceries: Consistent - great job!")
3. Swipeable cards for each section (smooth UX)
4. "Share Report" button (generates screenshot or social media image)
5. "View Previous Reports" button (opens report history)
6. Loading state: "Generating your personality report..."
7. Error state: "Couldn't generate report - try again later"

### Story 5.5: Add Report History View

**As a** premium user,
**I want** to see my past personality reports,
**so that** I can track my financial behavior over time.

**Acceptance Criteria:**
1. "Report History" screen lists all generated reports by month (newest first)
2. Each list item shows:
   - Month/year (e.g., "November 2025")
   - Personality type (e.g., "Conscious Spender")
   - Tap to view full report
3. Empty state: "No reports yet - your first report will generate at end of month"
4. Reports lazy-loaded (pagination if user has >12 reports)
5. Swipe-to-delete option (with confirmation)
6. Pull-to-refresh to check for new report

### Story 5.6: Implement Social Share Functionality

**As a** premium user,
**I want** to share my personality report on social media,
**so that** I can show off my financial progress to friends.

**Acceptance Criteria:**
1. "Share Report" button on Personality Report screen
2. Generates shareable image (1080x1080 for Instagram, 1200x630 for Twitter):
   - App logo in corner
   - Personality type prominently displayed
   - 2-3 key strengths highlighted
   - "Generated by Expense Monitor" watermark
3. Uses `react-native-view-shot` to capture screen or `expo-sharing` for native share
4. Share options: Save to Photos, Instagram, Twitter, Messages
5. Image has clean, branded design (not just screenshot)
6. Optional: Add "Download my report at [app link]" text to image

### Story 5.7: Schedule Monthly Report Generation Reminder

**As a** premium user,
**I want** a notification when my monthly report is ready,
**so that** I don't forget to check it.

**Acceptance Criteria:**
1. Background task runs on 1st day of each month at 9 AM
2. Task generates personality report for previous month (if not already generated)
3. Push notification sent: "Your November Expense Personality Report is ready! 🌟"
4. Notification taps open Personality Report screen
5. User can disable monthly report notifications in Settings
6. If user hasn't logged expenses in past month, skip notification
7. Uses Expo TaskManager for background scheduling

---

## Checklist Results Report

*To be completed after PRD review and approval*

---

## Next Steps

### UX Expert Prompt
"Please review the attached PRD for Expense Monitor Premium and create a UX design specification including wireframes for the following key screens: Goals Dashboard, Goal Detail with AI Recommendations, Personality Report Screen, and Paywall Modal. Ensure designs follow WCAG AA accessibility standards and match the existing app's modern blue aesthetic."

### Architect Prompt
"Please review the attached PRD for Expense Monitor Premium and create a technical architecture document covering: (1) Firebase Firestore schema and security rules for multi-user data isolation, (2) RevenueCat integration architecture for subscriptions, (3) OpenAI API integration strategy with rate limiting and cost optimization, (4) Data flow diagrams for AI features, and (5) Testing strategy for subscription lifecycle and data isolation. Use the existing React Native Expo stack and propose implementation approach for each epic."

---

## Development Agent Task Assignment

Based on the epics and stories above, here's how work should be distributed:

### **Agent 1: Backend & Security Specialist**
**Focus:** Multi-user data isolation and Firestore setup
- Epic 1: Stories 1.1 - 1.4 (Authentication, Firestore schema, security rules)
- Deliverable: Secure, isolated user data architecture

### **Agent 2: Payments & Subscription Specialist**
**Focus:** In-app purchases and RevenueCat integration
- Epic 2: All stories (RevenueCat setup, purchase flows, subscription management)
- Deliverable: Fully functional subscription system with trial support

### **Agent 3: UI/UX Developer**
**Focus:** Premium UI and paywall experience
- Epic 3: All stories (Paywall, diamond indicator, subscription management screen)
- Epic 1: Story 1.5 (User profile UI in Settings)
- Deliverable: Polished premium user experience

### **Agent 4: AI Features Developer (Goals)**
**Focus:** AI-Powered Saving Goals Engine
- Epic 4: All stories (Goals data model, UI, OpenAI integration, notifications)
- Deliverable: Complete goals feature with AI recommendations

### **Agent 5: AI Features Developer (Personality)**
**Focus:** AI Expense Personality Reports
- Epic 5: All stories (Report generation, UI, sharing, scheduling)
- Deliverable: Monthly personality report system

---

**Total Estimated Timeline:** 6-8 weeks with 5 developers working in parallel

**Critical Path:** Epic 1 → Epic 2 → Epic 3 → (Epic 4 & 5 in parallel)

---

*End of PRD*
