# Testing Guide

## Manual Testing Checklist

### Authentication Tests

#### Registration
- [ ] Register with valid email and password (6+ chars)
- [ ] Try registering with existing email (should fail)
- [ ] Try registering with password < 6 chars (should fail)
- [ ] Try registering with invalid email format (should fail)
- [ ] Try registering with mismatched passwords (should fail)
- [ ] Verify successful registration redirects to expense list

#### Login
- [ ] Login with valid credentials
- [ ] Try login with wrong password (should fail)
- [ ] Try login with non-existent email (should fail)
- [ ] Verify successful login redirects to expense list

#### Logout
- [ ] Logout successfully redirects to login screen
- [ ] Verify logged out user cannot access expense screens

### Expense Management Tests

#### Adding Expenses
- [ ] Add expense with "Out" amount only
- [ ] Add income with "In" amount only
- [ ] Try adding with both In and Out (should fail)
- [ ] Try adding with neither In nor Out (should fail)
- [ ] Try adding without description (should fail)
- [ ] Add expense with each category
- [ ] Verify balance calculation is correct
- [ ] Verify Ref# is auto-generated
- [ ] Test date input (current date works)

#### Viewing Expenses
- [ ] Expenses appear in real-time after adding
- [ ] All 7 columns display correctly
- [ ] Balance accumulates correctly (running total)
- [ ] Income shows in green with In amount
- [ ] Expenses show in red with Out amount
- [ ] Pull-to-refresh works
- [ ] Empty state shows when no expenses
- [ ] Scroll works with many expenses

#### CSV Export
- [ ] Export with expenses creates CSV file
- [ ] CSV contains all expense data
- [ ] CSV has correct header row
- [ ] CSV can be shared/saved
- [ ] Export with no expenses shows appropriate message
- [ ] Exported data matches app display

### UI/UX Tests

#### Responsiveness
- [ ] App works on small screens (iPhone SE)
- [ ] App works on large screens (iPhone Pro Max)
- [ ] App works on Android phones
- [ ] Keyboard doesn't cover input fields
- [ ] Buttons are easily tappable
- [ ] Text is readable

#### Navigation
- [ ] Back button works on Add Expense screen
- [ ] Cancel button closes Add Expense form
- [ ] Navigation between Login/Register works
- [ ] Modal animation for Add Expense is smooth

#### Loading States
- [ ] Loading indicator shows during registration
- [ ] Loading indicator shows during login
- [ ] Loading indicator shows while adding expense
- [ ] Loading indicator shows during CSV export
- [ ] Loading indicator shows on app initialization

### Data Persistence Tests

- [ ] Log out and log back in - expenses persist
- [ ] Close app and reopen - expenses persist
- [ ] Add expense on one device, verify it appears on another device (same account)
- [ ] Multiple users see only their own expenses

### Edge Cases

- [ ] Very long description text (should truncate)
- [ ] Very large amounts (e.g., 999999.99)
- [ ] Very small amounts (e.g., 0.01)
- [ ] Decimal amounts (e.g., 12.50)
- [ ] Adding 100+ expenses (performance)
- [ ] Poor internet connection (offline behavior)
- [ ] Special characters in description

---

## Test Scenarios

### Scenario 1: New User Journey
1. Open app for first time
2. Register new account
3. Add first income entry
4. Add first expense
5. Verify balance is correct
6. Export to CSV
7. Logout and login again
8. Verify data persists

### Scenario 2: Multiple Transactions
1. Login to account
2. Add multiple income entries
3. Add multiple expenses
4. Verify running balance updates correctly
5. Check that oldest entries are at bottom
6. Verify all categories work

### Scenario 3: Multi-Device Sync
1. Login on Device A
2. Add expense
3. Login on Device B (same account)
4. Verify expense appears immediately
5. Add expense on Device B
6. Check Device A updates in real-time

---

## Test Data Samples

### Valid Test Accounts
```
Email: test@example.com
Password: test123456
```

### Sample Expenses

**Income:**
- Description: "Monthly Salary", Category: Other, In: 3000.00
- Description: "Freelance Payment", Category: Other, In: 500.00

**Expenses:**
- Description: "Grocery Shopping", Category: Food, Out: 150.00
- Description: "Uber to Work", Category: Transport, Out: 15.50
- Description: "Rent Payment", Category: Rent, Out: 1200.00
- Description: "Electricity Bill", Category: Utilities, Out: 80.00
- Description: "New Shoes", Category: Shopping, Out: 75.00
- Description: "Movie Tickets", Category: Entertainment, Out: 25.00
- Description: "Doctor Visit", Category: Healthcare, Out: 100.00

### Expected Balance Progression
1. Start: 0.00
2. After Salary: +3000.00
3. After Rent: +1800.00
4. After Groceries: +1650.00
5. After Transport: +1634.50
6. And so on...

---

## Automated Testing (Future Enhancement)

For production apps, consider adding:

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

Test files to create:
- `src/services/__tests__/expenseService.test.js`
- `src/utils/__tests__/csvExport.test.js`
- `src/contexts/__tests__/AuthContext.test.js`

### Integration Tests
- Test Firebase connection
- Test authentication flow
- Test Firestore operations

### E2E Tests
```bash
npm install --save-dev detox
```

Test complete user flows from start to finish.

---

## Performance Testing

### Metrics to Monitor
- [ ] App loads in < 3 seconds
- [ ] Adding expense completes in < 1 second
- [ ] CSV export completes in < 2 seconds
- [ ] List scrolls smoothly with 100+ items
- [ ] Real-time updates appear within 1 second

### Tools
- React DevTools
- Expo Performance Monitor
- Firebase Performance Monitoring

---

## Security Testing

- [ ] User can only see their own expenses
- [ ] Cannot access expenses without authentication
- [ ] Firebase rules properly restrict access
- [ ] Passwords are not visible in network requests
- [ ] API keys are properly configured

---

## Bug Reporting Template

When you find a bug, document:

```
Title: [Brief description]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [...]

Expected Behavior:
[What should happen]

Actual Behavior:
[What actually happens]

Device Info:
- Device: [iPhone 14 / Samsung Galaxy S22]
- OS Version: [iOS 17 / Android 13]
- App Version: 1.0.0

Screenshots:
[If applicable]

Additional Context:
[Any other relevant information]
```

---

## Testing Checklist Summary

Before releasing to production:

- [ ] All authentication flows work
- [ ] All expense operations work
- [ ] CSV export works on both platforms
- [ ] Real-time sync works
- [ ] App works on multiple device sizes
- [ ] App works offline (gracefully handles no connection)
- [ ] Firebase security rules are in production mode
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] User experience is smooth and intuitive

---

Happy Testing! 🧪✅
