# Goals Feature - Firestore Schema & Algorithm Design

## Overview
This document outlines the Firestore database schema and calculation algorithms for the AI-Powered Savings Goals feature. This design is ready for implementation once Agent 1 completes the user-scoped Firestore setup.

---

## Firestore Schema

### Goals Collection

**Path:** `/users/{userId}/goals/{goalId}`

```javascript
{
  // Core Identifiers
  id: string,                    // Document ID (auto-generated)
  userId: string,                // Owner's Firebase Auth UID

  // Goal Details
  name: string,                  // e.g., "Save for vacation"
  targetAmount: number,          // Target savings amount (e.g., 1500)
  currentAmount: number,         // Current progress (calculated from expenses)
  targetDate: Timestamp,         // Target completion date

  // Tracking Configuration
  categoryRestrictions: string[] | null,  // Optional: specific categories to track
                                          // null = track all expenses
                                          // ["Food", "Entertainment"] = track only these

  // Status & Progress
  status: 'active' | 'completed' | 'failed',  // Goal lifecycle status
  successProbability: number,               // 0-100 calculated success rate

  // AI Recommendations (cached)
  aiRecommendations: {
    text: string,                // Generated recommendations
    generatedAt: Timestamp,      // When recommendations were created
    expiresAt: Timestamp,        // 24 hours after generation
  } | null,

  // Metadata
  createdAt: Timestamp,          // Goal creation time
  updatedAt: Timestamp,          // Last modification time
}
```

### AI Generations Tracking (for rate limiting)

**Path:** `/users/{userId}/goals/{goalId}/aiGenerations/{generationId}`

```javascript
{
  generatedAt: Timestamp,        // When the AI recommendation was generated
}
```

**Purpose:** Track AI recommendation generation count per day (max 3/day per goal)

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Goals: User can only read/write their own goals
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // AI generation tracking (subcollection)
      match /aiGenerations/{generationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Firestore Indexes

**Required Composite Indexes:**

1. **Query goals by user and status**
   - Collection: `users/{userId}/goals`
   - Fields: `userId` (Ascending), `status` (Ascending), `targetDate` (Ascending)
   - Purpose: Get all active/completed/failed goals sorted by date

2. **Query AI generations by date (rate limiting)**
   - Collection: `users/{userId}/goals/{goalId}/aiGenerations`
   - Fields: `generatedAt` (Descending)
   - Purpose: Count generations per day

---

## Goal Calculation Algorithms

### 1. Calculate Current Amount (Progress)

**Logic:**
- If `categoryRestrictions` is null → Track ALL income/expenses since goal creation
- If `categoryRestrictions` has categories → Track ONLY those categories

**Algorithm:**

```javascript
function calculateCurrentAmount(goal, expenses) {
  // Filter expenses since goal creation
  const relevantExpenses = expenses.filter(e => e.createdAt >= goal.createdAt);

  if (goal.categoryRestrictions === null || goal.categoryRestrictions.length === 0) {
    // General savings goal: Income - Expenses
    const totalIncome = sum(relevantExpenses.map(e => e.inAmount || 0));
    const totalExpenses = sum(relevantExpenses.map(e => e.outAmount || 0));
    return Math.max(0, totalIncome - totalExpenses);
  } else {
    // Category-specific goal: Track reduction in those categories
    // Example: "Reduce Food spending" → targetAmount - actual spending in Food
    const categorySpending = sum(
      relevantExpenses
        .filter(e => goal.categoryRestrictions.includes(e.category))
        .map(e => e.outAmount || 0)
    );

    // How much "saved" by reducing spending in these categories
    return Math.max(0, goal.targetAmount - categorySpending);
  }
}
```

**Example:**
- Goal: "Reduce Food spending by $500"
- Category restrictions: ["Food & Dining"]
- Actual Food spending since creation: $200
- Current amount saved: $500 - $200 = $300

---

### 2. Calculate Success Probability

**Formula:** Linear projection based on current savings rate

**Algorithm:**

```javascript
function calculateSuccessProbability(goal) {
  const now = new Date();

  // Time elapsed since goal creation
  const daysElapsed = Math.ceil((now - goal.createdAt) / (1000 * 60 * 60 * 24));

  // Total time from creation to target
  const totalDays = Math.ceil((goal.targetDate - goal.createdAt) / (1000 * 60 * 60 * 24));

  // Days remaining
  const daysRemaining = totalDays - daysElapsed;

  if (daysRemaining <= 0) {
    // Goal is overdue
    return goal.currentAmount >= goal.targetAmount ? 100 : 0;
  }

  // Calculate daily savings rate
  const dailySavingsRate = goal.currentAmount / daysElapsed;

  // Project future savings
  const projectedTotal = goal.currentAmount + (dailySavingsRate * daysRemaining);

  // Calculate probability (capped at 100%)
  const probability = Math.min(
    Math.round((projectedTotal / goal.targetAmount) * 100),
    100
  );

  return Math.max(0, probability);
}
```

**Example:**
- Target: $1000 in 100 days
- Current: $300 saved in 30 days
- Daily rate: $300 / 30 = $10/day
- Projected total: $300 + ($10 × 70 remaining days) = $1000
- Success probability: 100%

---

### 3. Auto-Update Goal Status

**Rules:**
- `active` → `completed`: When currentAmount >= targetAmount
- `active` → `failed`: When targetDate < now AND currentAmount < targetAmount

**Algorithm:**

```javascript
function updateGoalStatus(goal) {
  const now = new Date();

  if (goal.currentAmount >= goal.targetAmount) {
    return 'completed';
  }

  if (goal.targetDate < now && goal.currentAmount < goal.targetAmount) {
    return 'failed';
  }

  return 'active';
}
```

---

## Data Flow

### Goal Creation Flow

1. User fills CreateGoalScreen form
2. Validate inputs (name, amount > 0, date in future)
3. Call `createGoal()` service method
4. Firestore creates document with:
   - Initial `currentAmount = 0`
   - Initial `successProbability = 0`
   - `status = 'active'`
   - `aiRecommendations = null`

### Progress Update Flow (Real-time)

1. User adds/edits an expense
2. Firestore triggers subscription in GoalsDashboardScreen
3. For each active goal:
   - Fetch all expenses since goal creation
   - Run `calculateCurrentAmount()`
   - Run `calculateSuccessProbability()`
   - Run `updateGoalStatus()`
   - Update Firestore with new values
4. UI re-renders with updated progress

### AI Recommendation Flow

1. User taps "Generate AI Recommendations" on GoalDetailScreen
2. Check cache: If `aiRecommendations.expiresAt > now`, show cached version
3. Check rate limit: Count generations today (max 3/day)
4. If allowed:
   - Fetch goal + relevant expenses
   - Build OpenAI prompt with spending patterns
   - Call OpenAI API (gpt-3.5-turbo)
   - Save recommendations to Firestore with 24h expiry
   - Log generation in `aiGenerations` subcollection
5. Display recommendations in UI

---

## Performance Considerations

### Optimization Strategies

1. **Caching:**
   - AI recommendations cached for 24 hours (reduce API calls)
   - Progress calculations happen client-side (reduce Firestore reads)

2. **Rate Limiting:**
   - Max 3 AI generations per goal per day (control OpenAI costs)
   - Track in subcollection for easy querying

3. **Indexes:**
   - Composite indexes on (userId, status, targetDate) for fast queries
   - Auto-generated index on createdAt for expense filtering

4. **Subscriptions:**
   - Use Firestore real-time listeners for goals (auto-update UI)
   - Unsubscribe on component unmount (prevent memory leaks)

---

## Example Usage Scenarios

### Scenario 1: General Savings Goal

```javascript
Goal: "Emergency Fund"
targetAmount: $5000
categoryRestrictions: null  // Track all income/expenses
```

**Calculation:**
- User earned $3000 (income) since goal creation
- User spent $1500 (expenses) since goal creation
- Current amount: $3000 - $1500 = $1500

### Scenario 2: Category-Specific Reduction Goal

```javascript
Goal: "Reduce Food Spending"
targetAmount: $500  // Reduce by $500
categoryRestrictions: ["Food & Dining", "Groceries"]
```

**Calculation:**
- User spent $300 in Food categories since goal creation
- Amount saved by reducing: $500 - $300 = $200
- Current amount: $200

---

## Integration Checklist (When Agent 1 Completes)

- [ ] Copy service files: `goalService.js`, `goalCalculationService.js`, `aiService.js`
- [ ] Update `firestore.rules` with goals security rules
- [ ] Create Firestore indexes (auto-generated via console)
- [ ] Add OpenAI API key to `.env` and `app.config.js`
- [ ] Update screens to use real services instead of mock data
- [ ] Test real-time subscriptions
- [ ] Test AI recommendation generation
- [ ] Test rate limiting (3/day)

---

## Cost Estimates

### OpenAI API Costs (GPT-3.5-turbo)

- **Cost per recommendation:** ~$0.002 (300 tokens @ $0.50/1M input, $1.50/1M output)
- **Rate limit:** 3 per goal per day
- **Max daily cost per user:** ~$0.006 (if they generate for all goals)
- **Monthly estimate (100 active users):** ~$18

### Firestore Costs

- **Reads:** ~5 per goal view (goal doc + expenses query)
- **Writes:** ~2 per goal update (progress + status)
- **Storage:** ~1KB per goal document
- **Monthly estimate (100 users, 2 goals each):** ~$1

**Total estimated monthly cost:** ~$19 for 100 active users

---

## Ready for Implementation

All UI screens are built with mock data. Services are designed and documented. Once Agent 1 completes the Firestore setup, we can:

1. Create service files (`goalService.js`, `goalCalculationService.js`, `aiService.js`)
2. Replace mock data with real Firestore subscriptions
3. Integrate OpenAI API
4. Test end-to-end flow

**Status:** Ready to integrate - waiting on Agent 1 Firestore completion
