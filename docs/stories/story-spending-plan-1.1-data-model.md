# Story: Spending Plan Data Model & Service - Brownfield Addition

## Metadata
- **Story ID:** SPENDING-PLAN-1.1
- **Epic:** Spending Plan Feature
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 4 hours
- **Assigned To:** Dev Team

---

## User Story

**As a** user,
**I want** to define percentage allocations for different spending categories,
**so that** I can plan and track my monthly spending against my income.

---

## Story Context

### Existing System Integration
- **Integrates with:** Firestore database, expense categories system
- **Technology:** React Native, Firebase Firestore, AsyncStorage
- **Follows pattern:** Existing budget service (`src/services/budgetService.js`)
- **Touch points:**
  - Firestore `users/{userId}/spendingPlan` collection
  - Existing expense categories
  - Monthly budget calculations

### Current System Behavior
The app currently has:
- Monthly budget tracking (`budgetService.js`)
- Expense categorization
- User-scoped Firestore data

### Enhancement Details
Create the data model and service layer for storing and managing percentage-based spending allocations across categories.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Data Model Definition**
- [  ] Spending plan stored in Firestore: `users/{userId}/spendingPlan/{planId}`
- [ ] Each plan document contains:
  - `monthlyIncome`: Number (user's monthly income amount)
  - `allocations`: Array of {categoryId, categoryName, percentage, targetAmount}
  - `createdAt`: Timestamp
  - `updatedAt`: Timestamp
  - `isActive`: Boolean
- [ ] Percentage values are stored as numbers (0-100)
- [ ] Target amounts calculated as: (monthlyIncome * percentage / 100)

**AC2: Service Layer Implementation**
- [ ] Create `src/services/spendingPlanService.js` following existing service patterns
- [ ] Implement `saveSpendingPlan(userId, planData)` function
- [ ] Implement `getSpendingPlan(userId)` function
- [ ] Implement `updateAllocation(userId, categoryId, percentage)` function
- [ ] Implement `calculateTargetAmounts(monthlyIncome, allocations)` helper
- [ ] Implement `validateAllocations(allocations)` - ensures total ≤ 100%

**AC3: Data Validation**
- [ ] Total percentage allocations cannot exceed 100%
- [ ] Individual percentages must be 0-100
- [ ] Monthly income must be positive number
- [ ] Category IDs must match existing categories

**AC4: Error Handling**
- [ ] Service handles Firestore errors gracefully
- [ ] Returns meaningful error messages for validation failures
- [ ] Logs errors with context for debugging

### Integration Requirements
**AC5: Existing Functionality Preserved**
- [ ] Monthly budget service continues to work unchanged
- [ ] Expense categorization remains functional
- [ ] No breaking changes to existing Firestore structure

**AC6: Pattern Consistency**
- [ ] Service follows same structure as `budgetService.js`
- [ ] Uses same Firestore access patterns as existing services
- [ ] Error handling matches app conventions

### Quality Requirements
**AC7: Code Quality**
- [ ] Service includes JSDoc comments
- [ ] Functions are pure where possible
- [ ] Proper error boundaries implemented
- [ ] Code follows existing project style

**AC8: Testing**
- [ ] Manual testing with various allocation scenarios
- [ ] Edge cases tested (100% allocation, 0% allocations, etc.)
- [ ] Firestore read/write operations verified

---

## Technical Notes

### Integration Approach
- Create new Firestore subcollection under user documents
- Follow existing service pattern from `budgetService.js`
- Use Firebase compat library syntax matching project

### Data Structure Example
```javascript
{
  monthlyIncome: 5000,
  allocations: [
    { categoryId: 'travel', categoryName: 'Travel', percentage: 10, targetAmount: 500 },
    { categoryId: 'clothes', categoryName: 'Clothes', percentage: 2, targetAmount: 100 },
    { categoryId: 'food', categoryName: 'Food', percentage: 30, targetAmount: 1500 }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true
}
```

### Key Constraints
- Only one active spending plan per user
- Percentages stored as whole numbers (0-100)
- Calculations rounded to 2 decimal places for currency

---

## Definition of Done

- [ ] `spendingPlanService.js` created with all required functions
- [ ] Data model documented in code comments
- [ ] Firestore structure tested with real data
- [ ] Validation logic prevents invalid allocations
- [ ] Service integrated with Firebase/Firestore
- [ ] Error handling tested with offline/error scenarios
- [ ] Code reviewed and follows project patterns

---

## Risk Assessment

**Primary Risk:** Firestore schema conflicts with existing data
**Mitigation:** Use separate subcollection, additive-only changes
**Rollback:** Remove service file, delete test documents from Firestore
