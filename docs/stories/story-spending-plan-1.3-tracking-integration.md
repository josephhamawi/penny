# Story: Spending Plan Tracking Integration - Brownfield Addition

## Metadata
- **Story ID:** SPENDING-PLAN-1.3
- **Epic:** Spending Plan Feature
- **Status:** Ready for Development
- **Priority:** P2
- **Estimated Effort:** 5 hours
- **Assigned To:** Dev Team
- **Depends On:** SPENDING-PLAN-1.1, SPENDING-PLAN-1.2

---

## User Story

**As a** user,
**I want** to see my actual spending compared to my planned allocations,
**so that** I can track how well I'm sticking to my spending plan.

---

## Story Context

### Existing System Integration
- **Integrates with:** Existing expense tracking, spendingPlanService.js, StatisticsScreen
- **Technology:** React Native, Firestore queries, date utilities
- **Follows pattern:** Existing statistics calculations
- **Touch points:**
  - Expense data queries (current month)
  - Spending plan allocations
  - Progress visualization components

### Current System Behavior
- App tracks all expenses with categories
- StatisticsScreen shows spending breakdowns
- Monthly budget comparison exists

### Enhancement Details
Add real-time tracking of actual spending vs planned allocations, with visual indicators showing progress for each category.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Calculate Actual vs Planned**
- [ ] Create `calculateSpendingProgress(expenses, spendingPlan)` function
- [ ] For each allocation, calculate:
  - Planned amount (from allocation percentage)
  - Actual spent (sum of expenses in that category for current month)
  - Remaining budget (planned - actual)
  - Progress percentage ((actual / planned) * 100)
- [ ] Handle categories with 0% allocation
- [ ] Filter expenses to current month only

**AC2: Visual Progress Indicators**
- [ ] Add progress bars to each category card in SpendingPlanScreen
- [ ] Progress bar shows: actual / planned
- [ ] Color coded:
  - Green: ≤ 80% of planned
  - Yellow: 80-100% of planned
  - Red: > 100% of planned (over budget)
- [ ] Display format: "$450 / $500 (90%)"

**AC3: Category Status Labels**
- [ ] Show status badge for each category:
  - "On Track" (< 80%)
  - "Near Limit" (80-100%)
  - "Over Budget" (> 100%)
  - "No Spending" (actual = 0)
- [ ] Badges color-coded to match progress bars

**AC4: Overall Spending Summary**
- [ ] Add summary card at top of SpendingPlanScreen showing:
  - Total allocated this month (sum of target amounts)
  - Total spent this month (sum of all expenses)
  - Remaining budget overall
  - Overall progress percentage
- [ ] Circular progress indicator for total progress
- [ ] Updates in real-time as expenses added

**AC5: Monthly Reset**
- [ ] Progress resets automatically at start of new month
- [ ] Historical data preserved for reporting
- [ ] Clear visual indicator of current month being tracked

**AC6: Home Screen Widget**
- [ ] Add small "Spending Plan Overview" card to HomeScreen
- [ ] Shows: Top 3 categories by allocation with mini progress bars
- [ ] Tappable to navigate to full Spending Plan tab
- [ ] Only visible if user has active spending plan

### Integration Requirements
**AC7: Existing Functionality Preserved**
- [ ] Expense tracking continues to work unchanged
- [ ] Statistics screen calculations unaffected
- [ ] Monthly budget feature still functional
- [ ] All expense CRUD operations work normally

**AC8: Data Consistency**
- [ ] Uses same expense data as existing screens
- [ ] Category matching is accurate
- [ ] Date filtering consistent with app patterns
- [ ] Real-time updates when expenses added/deleted

**AC9: Performance**
- [ ] Calculations cached appropriately
- [ ] No noticeable lag when switching to Spending Plan tab
- [ ] Efficient Firestore queries (indexed, limited scope)
- [ ] Debounced updates for real-time changes

### Quality Requirements
**AC10: Code Quality**
- [ ] Calculation logic is testable and pure
- [ ] Progress components are reusable
- [ ] Proper error handling for edge cases
- [ ] Code documented with JSDoc

**AC11: Edge Cases Handled**
- [ ] No expenses in category shows 0% progress
- [ ] Category allocated 0% handled gracefully
- [ ] Division by zero prevented
- [ ] Negative budgets (income changes) handled

---

## Technical Notes

### Integration Approach
**Progress Calculation Logic:**
```javascript
const calculateProgress = (categoryId, expenses, allocation) => {
  const planned = allocation.targetAmount;
  const actual = expenses
    .filter(e => e.category === categoryId)
    .filter(e => isCurrentMonth(e.date))
    .reduce((sum, e) => sum + (e.out || 0), 0);

  return {
    planned,
    actual,
    remaining: planned - actual,
    percentage: planned > 0 ? (actual / planned) * 100 : 0,
    status: getStatus(actual, planned)
  };
};
```

**HomeScreen Integration:**
```javascript
// Add to HomeScreen.js
{hasSpendingPlan && (
  <TouchableOpacity onPress={() => navigation.navigate('SpendingPlan')}>
    <SpendingPlanOverviewCard plan={spendingPlan} progress={progress} />
  </TouchableOpacity>
)}
```

### Key Constraints
- Progress calculated on-demand, not stored
- Current month = based on user's local timezone
- Expenses filtered by "out" field only (not "in")
- Performance target: < 100ms for calculations

---

## Definition of Done

- [ ] Progress calculation function implemented and tested
- [ ] Progress bars appear on all category cards
- [ ] Color coding works correctly for all states
- [ ] Status badges display accurately
- [ ] Overall summary card shows correct totals
- [ ] Monthly reset logic verified (test with date change)
- [ ] HomeScreen widget added and functional
- [ ] Tapping widget navigates to Spending Plan tab
- [ ] Real-time updates work when expenses added
- [ ] Performance tested with 100+ expenses
- [ ] Edge cases tested (no expenses, 0% allocations, etc.)
- [ ] Code reviewed and documented
- [ ] No regression in existing screens

---

## Risk Assessment

**Primary Risk:** Performance degradation with large expense datasets
**Mitigation:** Index Firestore queries, implement pagination if needed
**Rollback:** Remove real-time updates, switch to manual refresh

**Secondary Risk:** Confusion with existing monthly budget feature
**Mitigation:** Clear UI differentiation, consider merging features later
**Rollback:** Hide spending plan progress, keep as planning-only tool
