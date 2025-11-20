# Spending Plan Feature - Production Readiness Test Plan

**Document Version:** 1.0
**Date:** 2025-11-20
**Feature:** Spending Plan (Stories 1.1, 1.2, 1.3)
**Status:** Ready for Testing

---

## Test Summary

This test plan validates the complete Spending Plan feature implementation including:
- Data model and service layer (Story 1.1)
- User interface and navigation (Story 1.2)
- Real-time tracking integration (Story 1.3)
- HomeScreen widget (Story 1.3 AC6)

---

## Pre-Test Setup

### Requirements
- iOS Simulator running (iPhone 12 or later recommended)
- Expo development server running (`npx expo start`)
- Firebase Authentication configured
- Test user account with existing expenses

### Test Data Preparation
1. Ensure test user has at least 20 expenses in current month across multiple categories
2. Have expenses from previous months for monthly reset testing
3. Prepare to add new expenses during testing for real-time validation

---

## Test Cases

### **TC1: Navigation Integration**

**Objective:** Verify Spending Plan tab is accessible and properly integrated

**Steps:**
1. Launch the app and log in
2. Observe bottom tab bar
3. Tap the "Plan" tab (4th position, wallet icon)
4. Verify screen loads without errors

**Expected Results:**
- ✓ Bottom tab bar shows 5 tabs: Home | Records | Statistics | Plan | Settings
- ✓ "Plan" tab has wallet icon
- ✓ Tapping "Plan" navigates to Spending Plan screen
- ✓ Screen displays "Spending Plan" header with gradient
- ✓ No console errors

**Pass/Fail:** ☐

---

### **TC2: Initial Setup - Monthly Income**

**Objective:** Verify user can set monthly income

**Steps:**
1. Navigate to Spending Plan tab
2. If first time, observe empty state
3. Tap on monthly income input field
4. Enter "5000"
5. Tap outside field to blur (trigger save)
6. Observe success toast message

**Expected Results:**
- ✓ Monthly income input accepts numeric values
- ✓ Toast shows "Monthly income updated"
- ✓ Value persists after save
- ✓ Data saves to Firestore (check console logs)

**Pass/Fail:** ☐

---

### **TC3: Add Categories to Plan**

**Objective:** Verify user can add categories to spending plan

**Steps:**
1. On Spending Plan screen with income set
2. Tap "Add Category" button (gradient button at bottom)
3. Observe category selection modal opens
4. Search for "Food" in search box
5. Tap "Food" from the list
6. Observe modal closes
7. Verify "Food" appears in allocations list with slider at 0%

**Expected Results:**
- ✓ Modal opens with all available categories
- ✓ Search filters categories in real-time
- ✓ Selecting category adds it to plan
- ✓ Category appears with icon, name, slider, and 0% initial value
- ✓ Toast shows "Category Added"

**Pass/Fail:** ☐

---

### **TC4: Adjust Category Allocations**

**Objective:** Verify slider adjustments work and save correctly

**Steps:**
1. With "Food" category added
2. Drag the slider to 30%
3. Wait 1 second (debounce delay)
4. Observe target amount updates: $1,500 (30% of $5,000)
5. Add "Transport" category
6. Set to 15% (should show $750 target)
7. Add "Entertainment" category
8. Set to 10% (should show $500 target)

**Expected Results:**
- ✓ Slider moves smoothly without lag
- ✓ Percentage value updates in real-time
- ✓ Target amount calculates correctly: (income × percentage / 100)
- ✓ Footer shows "Total Allocated: 55.0%"
- ✓ Changes persist after navigation away and back

**Pass/Fail:** ☐

---

### **TC5: Over-Allocation Warning**

**Objective:** Verify warning displays when total allocation exceeds 100%

**Steps:**
1. Continue from TC4 with 55% allocated
2. Add "Clothes" category and set to 50%
3. Observe footer changes color
4. Read warning message

**Expected Results:**
- ✓ Total Allocated shows 105.0%
- ✓ Footer progress bar and percentage turn yellow/warning color
- ✓ Warning icon (⚠️) appears
- ✓ Message displays: "You've allocated more than 100%"
- ✓ System still allows saving (warning, not blocking error)

**Pass/Fail:** ☐

---

### **TC6: Remove Category**

**Objective:** Verify category removal works correctly

**Steps:**
1. With multiple categories allocated
2. Tap the "×" button next to "Clothes" category
3. Observe category disappears
4. Check total allocation updates back to 55%

**Expected Results:**
- ✓ Category removed from list immediately
- ✓ Toast shows "Category Removed"
- ✓ Total allocation recalculates correctly
- ✓ Warning message disappears (if total now ≤ 100%)
- ✓ Change persists to Firestore

**Pass/Fail:** ☐

---

### **TC7: Real-Time Progress Tracking**

**Objective:** Verify actual spending tracked against plan

**Steps:**
1. With spending plan set (Food: 30%, Transport: 15%, Entertainment: 10%)
2. Note current progress bars (may show some spending already)
3. Navigate to Home screen
4. Tap "+" button to add new expense
5. Add expense: "Grocery shopping" - Category: Food - Amount: $150
6. Save expense
7. Navigate back to Spending Plan tab
8. Observe Food category progress

**Expected Results:**
- ✓ Each category shows progress bar below slider
- ✓ Format: "Spent: $XXX / $1,500 (X%)"
- ✓ Progress bar fills based on actual/planned percentage
- ✓ After adding $150 expense, Food category updates immediately
- ✓ New spending included in progress calculation
- ✓ Progress bar color:
  - Green if ≤ 80%
  - Yellow if 80-100%
  - Red if > 100%

**Pass/Fail:** ☐

---

### **TC8: Status Badges**

**Objective:** Verify status badges display correctly

**Steps:**
1. Observe status badges for each category with progress
2. Find a category with < 80% progress - should show "On Track" (green)
3. Add expenses to bring a category to 85% - should show "Near Limit" (yellow)
4. Add more expenses to exceed 100% - should show "Over Budget" (red)
5. Check a category with $0 spent - should show "No Spending" (gray)

**Expected Results:**
- ✓ "On Track" badge: green background, shown when ≤ 80%
- ✓ "Near Limit" badge: yellow background, shown when 80-100%
- ✓ "Over Budget" badge: red background, shown when > 100%
- ✓ "No Spending" badge: gray background, shown when actual = $0
- ✓ Badge style is uppercase, small font, rounded corners

**Pass/Fail:** ☐

---

### **TC9: Overall Spending Summary**

**Objective:** Verify overall progress summary card displays correctly

**Steps:**
1. With spending plan active and some expenses
2. Scroll to top of Spending Plan screen
3. Locate "This Month's Progress" card (below Monthly Income card)
4. Verify all fields present

**Expected Results:**
- ✓ Card shows "This Month's Progress" title with chart icon
- ✓ Displays "Total Spent: $XXX" (sum of all current month expenses)
- ✓ Displays "Total Planned: $XXX" (sum of all target amounts)
- ✓ Displays "Remaining: $XXX" (or "$XXX over" if negative)
- ✓ Shows percentage circle: "X% Used"
- ✓ Progress bar visualizes overall progress
- ✓ Colors match progress (green/yellow/red based on percentage)

**Pass/Fail:** ☐

---

### **TC10: HomeScreen Widget Display**

**Objective:** Verify spending plan widget appears on Home screen

**Steps:**
1. Navigate to Home tab
2. Scroll down past budget card and "My Plans" feature card
3. Locate "Spending Plan" widget
4. Observe top 3 categories displayed

**Expected Results:**
- ✓ Widget appears as glass-morphism card
- ✓ Header shows wallet icon + "Spending Plan" title + chevron
- ✓ Displays top 3 categories by allocation percentage (highest first)
- ✓ Each category shows:
  - Category icon (colored, in rounded square)
  - Category name
  - Progress: "$actual / $planned"
  - Mini progress bar
- ✓ Widget only visible if spending plan exists with categories
- ✓ Widget hidden if no spending plan configured

**Pass/Fail:** ☐

---

### **TC11: HomeScreen Widget Navigation**

**Objective:** Verify tapping widget navigates to full Spending Plan

**Steps:**
1. On Home screen with widget visible
2. Tap anywhere on the "Spending Plan" widget
3. Observe navigation

**Expected Results:**
- ✓ Tapping widget navigates to Spending Plan tab
- ✓ Full Spending Plan screen loads with all categories
- ✓ Navigation is smooth without flickering
- ✓ Can navigate back to Home using bottom tab

**Pass/Fail:** ☐

---

### **TC12: Monthly Reset Logic**

**Objective:** Verify progress resets at start of new month

**Steps:**
1. With spending plan active showing current month progress
2. Manually test by adding an expense from previous month
3. Verify that expense does NOT affect current month progress
4. Confirm only current month expenses counted

**Expected Results:**
- ✓ `isCurrentMonth()` function filters by month and year
- ✓ Previous month expenses excluded from progress
- ✓ Only current month expenses included in "actual spent"
- ✓ Progress bars reflect current month only
- ✓ Overall summary shows current month totals only

**Pass/Fail:** ☐

---

### **TC13: Edge Case - No Income Set**

**Objective:** Verify graceful handling when income is $0

**Steps:**
1. Navigate to Spending Plan
2. Set monthly income to "0" or leave blank
3. Try to add categories

**Expected Results:**
- ✓ Empty state message shows: "Set your monthly income to start planning"
- ✓ Categories section hidden or disabled
- ✓ No errors in console
- ✓ Prompts user to enter income first

**Pass/Fail:** ☐

---

### **TC14: Edge Case - 0% Allocation**

**Objective:** Verify categories with 0% allocation handle correctly

**Steps:**
1. Add a category but leave slider at 0%
2. Check if progress section appears
3. Add expenses in that category

**Expected Results:**
- ✓ Category displays with 0% and $0 target
- ✓ No progress bar shown (targetAmount = 0)
- ✓ No division by zero errors
- ✓ Category can be removed or adjusted later

**Pass/Fail:** ☐

---

### **TC15: Edge Case - Category with No Expenses**

**Objective:** Verify correct display when category has $0 spent

**Steps:**
1. Add category "Clothes" with 5% allocation ($250 target)
2. Do NOT add any expenses in "Clothes" category
3. Observe progress display

**Expected Results:**
- ✓ Progress shows: "Spent: $0.00 / $250.00 (0%)"
- ✓ Progress bar is empty (0% filled)
- ✓ Status badge shows "No Spending" (gray)
- ✓ No errors or crashes

**Pass/Fail:** ☐

---

### **TC16: Data Persistence**

**Objective:** Verify spending plan persists across sessions

**Steps:**
1. Set up complete spending plan with 3+ categories
2. Force close the app (not just background)
3. Reopen the app and log in
4. Navigate to Spending Plan tab

**Expected Results:**
- ✓ Monthly income value persists
- ✓ All added categories still present
- ✓ Allocation percentages unchanged
- ✓ Progress recalculates from current expenses
- ✓ No data loss

**Pass/Fail:** ☐

---

### **TC17: Real-Time Updates**

**Objective:** Verify Firestore subscription updates work

**Steps:**
1. Open app on simulator
2. (Optional: open app on second device/simulator)
3. Add a new expense in a tracked category
4. Observe Spending Plan screen without manually refreshing

**Expected Results:**
- ✓ Progress updates automatically when new expense added
- ✓ No need to pull-to-refresh or navigate away
- ✓ Updates appear within 1-2 seconds (Firestore real-time)
- ✓ Smooth updates without UI flickering

**Pass/Fail:** ☐

---

### **TC18: Performance - Large Dataset**

**Objective:** Verify performance with many expenses

**Prerequisites:** Add 100+ expenses across multiple categories

**Steps:**
1. With 100+ expenses in current month
2. Navigate to Spending Plan tab
3. Observe load time
4. Adjust slider values
5. Add new expense and check update speed

**Expected Results:**
- ✓ Screen loads in < 2 seconds
- ✓ Slider adjustments are smooth (no lag)
- ✓ Progress calculations complete quickly (< 500ms)
- ✓ No noticeable performance degradation
- ✓ Real-time updates still responsive

**Pass/Fail:** ☐

---

### **TC19: UI/UX Polish**

**Objective:** Verify visual design and user experience

**Steps:**
1. Review all Spending Plan screens
2. Check visual consistency
3. Test interactions

**Expected Results:**
- ✓ Colors match app theme (glass-morphism, gradients)
- ✓ Icons display correctly for all categories
- ✓ Text is readable (good contrast)
- ✓ Spacing and padding consistent
- ✓ Animations smooth (slider, navigation)
- ✓ Toast notifications appear and dismiss properly
- ✓ Touch targets are adequate (min 44x44 pts)
- ✓ No layout shifts during loading
- ✓ Keyboard handling works (income input)

**Pass/Fail:** ☐

---

### **TC20: Error Handling**

**Objective:** Verify graceful error handling

**Steps:**
1. Turn off internet connection
2. Try to save changes to spending plan
3. Observe error handling
4. Reconnect internet
5. Verify sync recovers

**Expected Results:**
- ✓ Error toast shows: "Failed to save changes"
- ✓ App doesn't crash
- ✓ Local state maintained
- ✓ Retry mechanism works when connection restored
- ✓ Console logs useful debugging information

**Pass/Fail:** ☐

---

## Test Results Summary

**Total Test Cases:** 20
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Not Executed:** ___

**Pass Rate:** ____%

---

## Defects Found

| ID | Severity | Test Case | Description | Status |
|----|----------|-----------|-------------|--------|
| | | | | |

---

## Sign-Off

**Tested By:** _______________
**Date:** _______________
**Approved for Production:** ☐ Yes ☐ No

**Notes:**

---

## Appendix: Manual Testing Checklist

Quick reference checklist for rapid validation:

- [ ] Tab navigation works
- [ ] Monthly income can be set and saves
- [ ] Categories can be added from modal
- [ ] Sliders adjust smoothly
- [ ] Target amounts calculate correctly
- [ ] Over-allocation warning displays
- [ ] Categories can be removed
- [ ] Progress bars show correct spending
- [ ] Status badges accurate (On Track/Near Limit/Over Budget)
- [ ] Overall summary card displays
- [ ] HomeScreen widget appears
- [ ] Widget navigation works
- [ ] Monthly filtering correct
- [ ] Data persists across app restarts
- [ ] Real-time updates work
- [ ] Performance acceptable
- [ ] UI is polished and consistent
- [ ] Error handling graceful
