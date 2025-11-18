# Plan Feature - Complete Implementation Guide

## 🎯 Overview

The **Plan** feature is an innovative savings allocation system that automatically sets aside a percentage of your income for different future goals. Unlike traditional budgeting apps, this creates a virtual savings ledger that tracks allocated funds WITHOUT affecting your visible balance.

**Key Innovation:** Every time income hits your account, the system automatically calcates and allocates a percentage to each active plan, creating psychological separation between "spendable money" and "allocated savings."

---

## 📁 File Structure

```
src/
├── services/
│   ├── planService.js                    # Plan CRUD operations
│   ├── planAllocationService.js          # Income detection & virtual ledger
│   └── planProjectionService.js          # Forecasting & recommendations
├── screens/
│   ├── PlanOverviewScreen.js             # Dashboard with all plans
│   ├── CreatePlanScreen.js               # Create/edit plan form
│   └── PlanDetailScreen.js               # Timeline, projections, what-if
├── components/
│   ├── PlanCard.js                       # Plan progress card
│   ├── PlanHealthScore.js                # 0-100 health indicator
│   └── WhatIfSlider.js                   # Interactive projection slider
└── hooks/
    └── usePlanAllocations.js             # Real-time allocation updates
```

---

## 🗄️ Data Models

### 1. Plan Document
**Firestore Path:** `/users/{userId}/plans/{planId}`

```javascript
{
  id: string,                    // Auto-generated
  userId: string,                // User ID
  planName: string,              // "Travel Fund", "Emergency Savings"
  targetCategory: string | null, // Optional: "Travel", "Clothing"
  percentageOfIncome: number,    // 0-100 (e.g., 10 = 10%)
  description: string,           // User description
  active: boolean,               // Active status

  // Optional targets
  targetAmount: number | null,   // Goal amount ($1500)
  targetDate: Timestamp | null,  // Target date

  // Computed fields
  cumulativeTotalForPlan: number, // Running total
  healthScore: number,            // 0-100

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 2. Virtual Allocation (Ledger Entry)
**Firestore Path:** `/users/{userId}/planAllocations/{allocationId}`

```javascript
{
  id: string,
  planId: string,                // Reference to plan
  planName: string,              // Plan name (denormalized)
  originalIncomeRowId: string,   // Reference to expense doc with inAmount > 0
  date: Timestamp,               // Date of income
  incomeAmount: number,          // Original income amount
  allocatedAmount: number,       // Calculated: income * percentage / 100
  targetCategory: string | null, // From plan
  cumulativeTotalForPlan: number,// Running sum
  userId: string,
  createdAt: Timestamp
}
```

---

## ⚙️ Core Algorithms

### 1. Allocation Engine
**Location:** `planAllocationService.js` → `processIncomeAllocations()`

**How it works:**
1. Get all active plans
2. Get all income transactions (where `inAmount > 0`)
3. Get existing allocations
4. Find unallocated income (transactions without allocations)
5. For each unallocated income:
   - For each active plan:
     - Calculate: `allocatedAmount = income * (plan.percentage / 100)`
     - Create allocation record
     - Update cumulative total

**When triggered:**
- App load
- New expense added
- User manually refreshes

```javascript
// Example:
// Income: $2000
// Plan "Travel": 10%
// Plan "Emergency": 5%
//
// Allocations created:
// - Travel: $200 (10% of $2000)
// - Emergency: $100 (5% of $2000)
//
// User's visible balance remains $2000
// Virtual ledger shows: Travel=$200, Emergency=$100
```

### 2. Projection Engine
**Location:** `planProjectionService.js` → `generateProjections()`

**Algorithm:**
1. Calculate moving average of income (last 3 transactions)
2. Detect income frequency (weekly, biweekly, monthly, irregular)
3. Project future allocations:
   - Use moving average as projected income
   - Apply income frequency to estimate dates
   - Calculate allocation per income event
   - Add to cumulative total
4. Determine goal achievement date (if target amount set)

**Example output:**
```javascript
{
  projections: [
    { date: '2025-12-01', projectedIncome: 2000, projectedAllocation: 200, cumulativeTotal: 400 },
    { date: '2025-12-15', projectedIncome: 2000, projectedAllocation: 200, cumulativeTotal: 600 },
    // ... up to 12 future income events
  ],
  goalAchievementDate: Date('2026-03-01'),
  message: "You'll reach your $1500 goal in 4 months (March 1, 2026)",
  incomePattern: { frequency: 'biweekly', averageDaysBetween: 14 }
}
```

### 3. Health Score Calculation
**Location:** `planProjectionService.js` → `calculatePlanHealthScore()`

**Scoring factors (0-100):**

| Factor | Points | Description |
|--------|--------|-------------|
| Income Consistency | 40 | Low variance = higher score |
| Spending Stability | 30 | Stable daily spending = higher score |
| Allocation Ratio | 20 | <50% total allocation = full points |
| Goal Timeline Realism | 10 | Achievable on time = full points |

**Example:**
- Income variance 15% → 35/40 points
- Spending stable → 30/30 points
- Total allocation 45% → 20/20 points
- Goal achievable → 10/10 points
- **Total Health Score: 95/100** ✅

### 4. Recommendation Engine
**Location:** `planProjectionService.js` → `generatePlanRecommendations()`

**Recommendation types:**

1. **Low Health Score** (< 50)
   - "Reduce allocation percentage for stability"
   - Suggested: 75% of current percentage

2. **Over-Allocated** (> 80% total)
   - "Total allocation too high, may strain budget"
   - Suggested: Rebalance to 70%

3. **Behind Schedule**
   - "Increase to X% to meet goal on time"
   - Calculates needed percentage based on remaining time

4. **High Spending in Category**
   - "Your [category] spending is high, reduce by 10%"
   - Triggered when category spending > 20% of plan total

5. **Positive Reinforcement** (score >= 80, on track)
   - "Great work! On pace to reach goal early"

---

## 🎨 UI Screens

### PlanOverviewScreen
**Features:**
- Summary cards (total allocated, % of income, active plans, avg health)
- Active plans list with PlanCard components
- Inactive plans section
- Warning banner if over-allocated (>80%)
- FAB for creating new plan

**Navigation:**
- Tap plan → PlanDetailScreen
- FAB → CreatePlanScreen

### CreatePlanScreen
**Features:**
- Plan name input
- Percentage slider with real-time validation
- Description text area
- Target category selector (modal)
- Optional goal settings (target amount + date)
- Real-time validation (prevents >100% total allocation)

**Validation:**
- Plan name required
- Percentage 1-100
- Total allocation cannot exceed 100%
- Target amount > 0 (if set)
- Target date must be future (if set)

### PlanDetailScreen
**Features:**
- Health score badge (large)
- Current accumulated amount
- Progress bar (if target amount set)
- Projection message
- Line chart showing projected growth
- WhatIfSlider for simulation
- Recommendations section
- Allocation timeline (FlatList)

**Actions:**
- Edit plan
- Delete plan (soft delete, marks inactive)
- Refresh data

---

## 🔧 API Reference

### planService.js

```javascript
// Create a plan
createPlan(planData)
// Returns: planId

// Get all plans
getPlans(userId)
// Returns: Array<Plan>

// Get active plans only
getActivePlans(userId)
// Returns: Array<Plan>

// Update plan
updatePlan(userId, planId, updates)

// Delete plan (soft delete)
deletePlan(userId, planId)

// Real-time subscription
subscribeToPlans(userId, callback)
// Returns: unsubscribe function

// Validation
validateNewAllocation(userId, newPercentage, excludePlanId)
// Returns: { valid, currentTotal, newTotal, message }
```

### planAllocationService.js

```javascript
// Process income allocations (main engine)
processIncomeAllocations(userId)
// Returns: { processed, created, skipped }

// Get all allocations
getAllocations(userId)
// Returns: Array<Allocation>

// Get allocations for specific plan
getAllocationsForPlan(userId, planId)
// Returns: Array<Allocation>

// Get income transactions
getIncomeTransactions(userId)
// Returns: Array<Transaction>

// Get allocation summary
getAllocationSummary(userId)
// Returns: { totalAllocated, totalIncomeTransactions, planSummaries, ... }

// Real-time subscription
subscribeToAllocationsForPlan(userId, planId, callback)
// Returns: unsubscribe function
```

### planProjectionService.js

```javascript
// Generate projections
generateProjections(userId, planId)
// Returns: { projections, goalAchievementDate, message, incomePattern }

// Calculate health score
calculatePlanHealthScore(userId, planId, expenses)
// Returns: number (0-100)

// Update all health scores
updateAllPlanHealthScores(userId, expenses)

// Generate recommendations
generatePlanRecommendations(userId, planId, expenses)
// Returns: Array<Recommendation>

// What-if scenario
calculateWhatIfScenario(userId, planId, newPercentage)
// Returns: { projections, goalAchievementDate, message }
```

---

## 🧪 Testing Guide

### Manual Testing Scenarios

#### 1. Create First Plan
1. Navigate to HomeScreen
2. Tap "My Plans" card
3. See empty state
4. Tap "Create First Plan"
5. Fill in:
   - Name: "Travel Fund"
   - Percentage: 10%
   - Description: "Save for vacation"
   - Target: $1500 by June 2026
6. Save
7. Should see plan in overview

#### 2. Test Allocation Engine
**Setup:**
- Create plan: 10% allocation
- Add income: $2000

**Expected Result:**
- Navigate to Plan Detail
- Should see 1 allocation: $200
- Cumulative total: $200

**Add second income: $2500**
- Should see 2 allocations
- Second allocation: $250
- Cumulative total: $450

#### 3. Test 100% Limit Validation
1. Create Plan A: 60%
2. Create Plan B: 30%
3. Try to create Plan C: 20%
4. Should see error: "Total would exceed 100%"
5. Change Plan C to 10% → Should work

#### 4. Test Projections
**Setup:**
- Plan with $200 accumulated
- Target: $1500
- Income history: $2000 biweekly

**Expected:**
- Projection message: "Reach goal in X months"
- Chart shows upward trend
- What-if slider: Increase to 15% → "Reach goal faster"

#### 5. Test Health Score
**Scenario A: Good health**
- Consistent income ($2000 every 2 weeks)
- Stable spending
- 40% total allocation
- Result: Score >= 80

**Scenario B: Poor health**
- Irregular income (variance >50%)
- Volatile spending
- 90% total allocation
- Result: Score < 50
- Should see recommendation to reduce

#### 6. Test Recommendations
1. Create plan with 15% allocation
2. Set aggressive target (requires 30%)
3. Check detail screen
4. Should see: "Increase to 30% to meet goal"

---

## 🚀 Deployment Checklist

### Firestore Indexes Required

```javascript
// Collection: users/{userId}/plans
// Index: userId ASC, active ASC, createdAt DESC

// Collection: users/{userId}/planAllocations
// Index: userId ASC, planId ASC, date DESC
// Index: userId ASC, date DESC
```

### Security Rules

```javascript
// plans collection
match /users/{userId}/plans/{planId} {
  allow read, write: if request.auth.uid == userId;
}

// planAllocations collection
match /users/{userId}/planAllocations/{allocationId} {
  allow read, write: if request.auth.uid == userId;
}
```

### Performance Considerations

1. **Allocation Processing:**
   - Runs on app load
   - Can be slow if many income transactions
   - Consider limiting to last 100 income transactions

2. **Real-time Subscriptions:**
   - Plans subscription: Low overhead
   - Allocations subscription: Can be heavy for high-frequency users
   - Consider pagination for allocation timeline

3. **Health Score Calculation:**
   - Expensive with large expense datasets
   - Cache results, refresh on pull-to-refresh
   - Run async, don't block UI

---

## 🔮 Future Enhancements

### Phase 2 Features
1. **AI-Powered Recommendations** (OpenAI integration)
   - Analyze spending patterns
   - Suggest optimal allocation percentages
   - Personalized savings strategies

2. **Plan Templates**
   - Pre-configured plans (Emergency fund, Vacation, etc.)
   - One-tap setup with recommended percentages

3. **Milestones & Celebrations**
   - Animations when reaching 25%, 50%, 75%, 100%
   - Shareable achievement badges

4. **Category-Linked Plans**
   - Track spending in target category
   - Alert when spending threatens plan
   - Auto-adjust recommendations

5. **Multi-Goal Optimizer**
   - AI suggests optimal split across all plans
   - Balance competing priorities
   - Maximize overall success probability

### Technical Improvements
1. **Background Processing**
   - Cloud Function to process allocations server-side
   - Webhook on new income transaction

2. **Advanced Analytics**
   - Income trend analysis
   - Seasonal income patterns
   - Spending correlation insights

3. **Export & Reporting**
   - CSV export of all allocations
   - Monthly plan summary emails
   - PDF reports with charts

---

## 🐛 Known Limitations

1. **Income Detection:**
   - Relies on `inAmount > 0`
   - Cannot distinguish salary vs. refund
   - No automatic categorization

2. **Projection Accuracy:**
   - Assumes past income patterns continue
   - Doesn't account for irregular bonuses
   - Limited to 12 future projections

3. **Multi-User:**
   - Each user has independent plans
   - No shared plans (family accounts)
   - No collaborative features

4. **Offline Support:**
   - Requires network for allocation processing
   - Local cache limited
   - No offline projection calculation

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Allocations not appearing
- **Solution:** Ensure income transactions exist (`inAmount > 0`)
- Pull to refresh on Plan Overview
- Check Firestore console for data

**Issue:** Projection says "No income data"
- **Solution:** Need at least 2 income transactions for projections
- Add historical income data

**Issue:** Health score always 50
- **Solution:** Need sufficient transaction history (10+ expenses, 3+ income)
- Score updates on refresh

**Issue:** Can't create plan - "Total exceeds 100%"
- **Solution:** Edit or delete existing plans to free up percentage
- Check inactive plans (still count toward total)

---

## 📚 References

- **PRD:** `/docs/prd.md` - Full product requirements
- **Architecture:** Follows existing Expenses app patterns
- **Firebase Setup:** Same as Goals feature (`/users/{userId}/...`)
- **UI Theme:** Uses existing `colors.js` theme system

---

## ✅ Implementation Status

**Completed:**
- ✅ All 3 service files (Plan, Allocation, Projection)
- ✅ All 3 screens (Overview, Create, Detail)
- ✅ All 3 components (PlanCard, HealthScore, WhatIfSlider)
- ✅ Custom hook (usePlanAllocations)
- ✅ Navigation integration
- ✅ HomeScreen entry point
- ✅ App compiled successfully

**Ready for:**
- User testing
- Firestore index creation
- Security rules deployment
- Production release

---

**Built with ❤️ by Claude Code**
*Generated: November 18, 2025*
