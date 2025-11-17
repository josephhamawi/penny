# Story: Spending Plan Screen UI - Brownfield Addition

## Metadata
- **Story ID:** SPENDING-PLAN-1.2
- **Epic:** Spending Plan Feature
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 6 hours
- **Assigned To:** Dev Team
- **Depends On:** SPENDING-PLAN-1.1

---

## User Story

**As a** user,
**I want** a new "Spending Plan" tab where I can set and manage my category allocations,
**so that** I can visualize and adjust my spending plan easily.

---

## Story Context

### Existing System Integration
- **Integrates with:** Tab navigation (App.js), spendingPlanService.js
- **Technology:** React Native, React Navigation Bottom Tabs
- **Follows pattern:** Existing tab screens (HomeScreen, StatisticsScreen)
- **Touch points:**
  - `App.js` - Add new tab to TabNavigator
  - `src/screens/SpendingPlanScreen.js` - New screen
  - Navigation icon configuration

### Current System Behavior
App has 4 bottom tabs:
1. Home
2. Records
3. Statistics
4. Settings

### Enhancement Details
Add a 5th tab called "Spending Plan" between "Statistics" and "Settings" with a dedicated screen for managing percentage allocations.

---

## Acceptance Criteria

### Functional Requirements

**AC1: New Tab Navigation**
- [ ] New "Spending Plan" tab added to bottom navigation
- [ ] Tab positioned between "Statistics" and "Settings"
- [ ] Tab icon: `wallet` or `percentage` from FontAwesome5
- [ ] Tab label: "Plan"
- [ ] Tapping tab navigates to SpendingPlanScreen

**AC2: Screen Header**
- [ ] Gradient header matching app style (colors.primaryGradient)
- [ ] Title: "Spending Plan"
- [ ] Subtitle: "Allocate your monthly income"

**AC3: Monthly Income Input**
- [ ] Card section at top for monthly income
- [ ] Large, prominent input field for dollar amount
- [ ] Label: "Monthly Income"
- [ ] Format as currency with $ symbol
- [ ] Auto-save on blur or change
- [ ] Visual feedback when saving

**AC4: Category Allocations List**
- [ ] Scrollable list of all expense categories
- [ ] Each category shows:
  - Category name with icon
  - Percentage slider (0-100%)
  - Current percentage value display
  - Target dollar amount (calculated from income × percentage)
- [ ] Categories sorted alphabetically
- [ ] Empty state if no income set: "Set your monthly income to start planning"

**AC5: Percentage Sliders**
- [ ] Smooth slider component for each category
- [ ] Range: 0-100%
- [ ] Step: 1%
- [ ] Displays current value while dragging
- [ ] Updates target amount in real-time
- [ ] Debounced save (500ms after user stops dragging)

**AC6: Total Allocation Indicator**
- [ ] Fixed footer showing total allocated percentage
- [ ] Format: "Allocated: 67% of income" (with progress ring or bar)
- [ ] Color coded:
  - Green: ≤ 100%
  - Yellow: > 100% (warning)
- [ ] Warning message if total > 100%: "⚠️ You've allocated more than 100%"

**AC7: Visual Design**
- [ ] Glass-morphism cards matching app aesthetic
- [ ] Gradient accents on sliders
- [ ] Smooth animations on interactions
- [ ] Consistent spacing and typography
- [ ] Responsive to keyboard (scroll to focused input)

**AC8: Loading & Error States**
- [ ] Loading indicator while fetching plan data
- [ ] Error message if fetch fails with retry button
- [ ] Skeleton loading for better UX
- [ ] Toast notifications for save success/failure

### Integration Requirements
**AC9: Existing Functionality Preserved**
- [ ] All 4 existing tabs continue to work normally
- [ ] Tab bar styling remains consistent
- [ ] Navigation state persists correctly
- [ ] No impact on other screens

**AC10: Data Integration**
- [ ] Uses `spendingPlanService.js` for all data operations
- [ ] Loads existing plan on mount
- [ ] Creates new plan if none exists
- [ ] Persists changes to Firestore

**AC11: Pattern Consistency**
- [ ] Screen follows structure of existing screens
- [ ] Uses same hooks pattern (useState, useEffect)
- [ ] Matches color theme from `src/theme/colors.js`
- [ ] Follows React Navigation patterns from App.js

### Quality Requirements
**AC12: Code Quality**
- [ ] Component properly structured with hooks
- [ ] State management follows app patterns
- [ ] Proper cleanup in useEffect
- [ ] Performance optimized (memo, useCallback where needed)

**AC13: User Experience**
- [ ] Smooth, responsive interactions
- [ ] Clear visual feedback for all actions
- [ ] Intuitive slider controls
- [ ] No layout shifts during loading

---

## Technical Notes

### Integration Approach
**App.js Changes:**
```javascript
// Add to TabNavigator
<Tab.Screen name="SpendingPlan" component={SpendingPlanScreen}
  options={{ tabBarLabel: 'Plan' }} />
```

**Icon Configuration:**
```javascript
else if (route.name === 'SpendingPlan') {
  iconName = 'wallet'; // or 'percentage'
}
```

### Screen Structure
```
SpendingPlanScreen
├── Gradient Header
├── ScrollView
│   ├── Monthly Income Card
│   ├── Allocations List
│   │   └── Category Cards (map)
│   │       ├── Category Icon & Name
│   │       ├── Percentage Slider
│   │       └── Target Amount Display
│   └── Spacer
└── Fixed Footer (Total Allocation)
```

### Key Constraints
- Maximum 5 tabs in bottom navigation (iOS HIG recommendation)
- Tab bar height remains 85px
- Slider performance must be smooth (60fps)
- All monetary values rounded to 2 decimals

---

## Definition of Done

- [ ] New tab appears in bottom navigation
- [ ] SpendingPlanScreen.js created and functional
- [ ] Monthly income can be set and saved
- [ ] Category sliders work smoothly
- [ ] Target amounts calculated correctly
- [ ] Total allocation indicator accurate
- [ ] Warning displays when > 100% allocated
- [ ] Data persists to Firestore via service
- [ ] Loading and error states handle gracefully
- [ ] Screen matches app design aesthetic
- [ ] All existing tabs still functional
- [ ] Navigation tested on iOS simulator
- [ ] Code reviewed and follows project patterns

---

## Risk Assessment

**Primary Risk:** Adding 5th tab may crowd bottom navigation
**Mitigation:** Use concise label "Plan", test on small screens
**Rollback:** Remove tab from App.js, delete SpendingPlanScreen.js

**Secondary Risk:** Slider performance on low-end devices
**Mitigation:** Use react-native-community/slider, debounce updates
**Rollback:** Replace with text input if performance issues persist
