# Agent 1: Backend & Security Specialist

## 🎯 Mission
Establish secure multi-user architecture with Firebase Authentication and Firestore data isolation. Ensure complete separation of user data to prevent any possibility of data leakage between users.

---

## 📋 Assignment Overview

**Epic:** Epic 1 - Multi-User Data Isolation & Security Foundation
**Timeline:** 1.5 weeks (10 business days)
**Priority:** CRITICAL - Blocking work for all other agents
**Dependencies:** None (can start immediately)

---

## 🔨 Stories Assigned

### ✅ Story 1.1: Implement Firebase Authentication for User Signup and Login

**As a** new user,
**I want** to create an account with my name, email, and password,
**so that** I can securely access my personal expense data.

#### Acceptance Criteria
1. ✓ User can sign up with email, password, and display name (required fields)
2. ✓ Firebase Authentication creates unique UID for each user
3. ✓ Display name is stored in Firebase Auth user profile
4. ✓ User can log in with email and password
5. ✓ User can log out and session is properly cleared
6. ✓ Error messages display for invalid credentials or existing email
7. ✓ AuthContext maintains current user state throughout app
8. ✓ Password reset functionality available via "Forgot Password" link

#### Implementation Guidance
- Update `/src/contexts/AuthContext.js` to add signup method
- Signup method should call `auth.createUserWithEmailAndPassword()` followed by `user.updateProfile({ displayName })`
- Add error handling for common Firebase auth errors (weak-password, email-already-in-use, etc.)
- Create signup screen at `/src/screens/SignupScreen.js` with form validation
- Add "Forgot Password" link to LoginScreen that calls `auth.sendPasswordResetEmail()`

**Files to Modify:**
- `/src/contexts/AuthContext.js`
- `/src/screens/LoginScreen.js` (add forgot password)
- `/src/screens/SignupScreen.js` (NEW)
- `/src/navigation/AppNavigator.js` (add signup route)

---

### ✅ Story 1.2: Update Firestore Data Model for User-Scoped Collections

**As a** developer,
**I want** all expense data stored under user-specific paths in Firestore,
**so that** queries automatically scope to the authenticated user's data.

#### Acceptance Criteria
1. ✓ Firestore structure uses `/users/{userId}/expenses/{expenseId}` pattern
2. ✓ Budget settings stored at `/users/{userId}/settings/budget`
3. ✓ Webhook URLs stored at `/users/{userId}/settings/webhookUrl`
4. ✓ All existing expense service methods updated to include user ID in queries
5. ✓ Migration strategy documented for any existing test data
6. ✓ No hardcoded user IDs - all queries use `auth.currentUser.uid`

#### Implementation Guidance
**New Firestore Structure:**
```
/users/{userId}/
  /expenses/{expenseId}
    - ref, date, description, category, inAmount, outAmount, balance, createdAt
  /settings/
    - budget (document)
    - webhookUrl (document)
  /goals/{goalId} (for future AI features)
  /personalityReports/{reportId} (for future AI features)
```

**Migration Steps:**
1. Current expenses are in root `/expenses` collection
2. Write migration script to move test data to `/users/{testUserId}/expenses/`
3. Update all service methods to accept `userId` parameter
4. Default to `auth.currentUser.uid` if userId not provided

**Files to Modify:**
- `/src/services/expenseService.js` - Update all methods
- `/src/services/budgetService.js` - Update to use `/users/{userId}/settings/budget`
- `/src/services/googleSheetsSyncService.js` - Update webhook URL path
- Create `/scripts/migrate-to-user-scoped.js` (migration script)

---

### ✅ Story 1.3: Write Firestore Security Rules for Data Isolation

**As a** system administrator,
**I want** Firestore security rules that enforce user data isolation,
**so that** users cannot read or write other users' data under any circumstances.

#### Acceptance Criteria
1. ✓ Security rules allow read/write only if `request.auth.uid == userId`
2. ✓ Unauthenticated requests are rejected
3. ✓ Rules cover all collections: expenses, settings, goals, reports
4. ✓ Rules tested with Firebase Emulator Suite to verify isolation
5. ✓ No wildcard rules that could allow data leakage
6. ✓ Rules deployed to production Firestore instance

#### Implementation Guidance
**Firestore Security Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function - user must be authenticated and accessing their own data
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // User-scoped data
    match /users/{userId} {
      // Expenses
      match /expenses/{expenseId} {
        allow read, write: if isOwner(userId);
      }

      // Settings (budget, webhook)
      match /settings/{settingId} {
        allow read, write: if isOwner(userId);
      }

      // Goals (future)
      match /goals/{goalId} {
        allow read, write: if isOwner(userId);
      }

      // Personality Reports (future)
      match /personalityReports/{reportId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Deny all other paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Testing:**
1. Install Firebase Emulator Suite: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Write test cases in `/tests/firestore-rules.test.js`:
   - User A can read their own expenses
   - User A CANNOT read User B's expenses
   - Unauthenticated requests are denied
4. Run: `firebase emulators:start` and run test suite

**Files to Create/Modify:**
- `firestore.rules` (NEW)
- `/tests/firestore-rules.test.js` (NEW)
- `firebase.json` (ensure emulators configured)

---

### ✅ Story 1.4: Update All Expense Service Methods for User-Scoped Queries

**As a** user,
**I want** all my expense operations (add, edit, delete, list) to only affect my own data,
**so that** I never see or modify another user's expenses.

#### Acceptance Criteria
1. ✓ `addExpense()` saves to current user's collection
2. ✓ `subscribeToExpenses()` filters by current user ID
3. ✓ `updateExpense()` only updates if expense belongs to current user
4. ✓ `deleteExpense()` only deletes if expense belongs to current user
5. ✓ Google Sheets sync uses user-specific webhook URL
6. ✓ All queries validate `auth.currentUser` exists before executing
7. ✓ Unit tests verify queries cannot access other users' data

#### Implementation Guidance

**Update `/src/services/expenseService.js`:**

```javascript
import { auth, firestore } from '../config/firebase';

// Helper to get user's expenses collection
const getUserExpensesCollection = (userId) => {
  return firestore.collection(`users/${userId}/expenses`);
};

export const addExpense = async (expenseData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const expenseRef = getUserExpensesCollection(user.uid).doc();
  await expenseRef.set({
    ...expenseData,
    userId: user.uid,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return expenseRef.id;
};

export const subscribeToExpenses = (userId, callback) => {
  if (!userId) throw new Error('userId required');

  return getUserExpensesCollection(userId)
    .orderBy('date', 'asc')
    .orderBy('createdAt', 'asc')
    .onSnapshot((snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(expenses);
    });
};

export const updateExpense = async (expenseId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserExpensesCollection(user.uid).doc(expenseId).update({
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp()
  });
};

export const deleteExpense = async (expenseId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserExpensesCollection(user.uid).doc(expenseId).delete();
};
```

**Update `/src/services/budgetService.js`:**
```javascript
const getUserBudgetDoc = (userId) => {
  return firestore.doc(`users/${userId}/settings/budget`);
};

export const saveMonthlyBudget = async (budget) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserBudgetDoc(user.uid).set({ amount: budget });
};
```

**Update `/src/services/googleSheetsSyncService.js`:**
```javascript
const getUserWebhookDoc = (userId) => {
  return firestore.doc(`users/${userId}/settings/webhookUrl`);
};

export const saveWebhookUrl = async (url) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserWebhookDoc(user.uid).set({ url });
};
```

**Files to Modify:**
- `/src/services/expenseService.js`
- `/src/services/budgetService.js`
- `/src/services/googleSheetsSyncService.js`
- `/src/screens/HomeScreen.js` - Pass user.uid to subscribeToExpenses
- `/src/screens/SettingsScreen.js` - Update budget/webhook loading

---

## 🧪 Testing Checklist

**Security Testing:**
- [ ] Create two test users (user A, user B)
- [ ] Add expenses as user A
- [ ] Log in as user B - verify cannot see user A's expenses
- [ ] Attempt direct Firestore query to user A's data while logged in as user B - verify denied
- [ ] Test unauthenticated access - verify all requests rejected

**Functional Testing:**
- [ ] Sign up new user - verify account created successfully
- [ ] Log in with valid credentials - verify success
- [ ] Log in with invalid credentials - verify error message
- [ ] Add expense - verify saved to correct user's collection
- [ ] Edit expense - verify only owner can edit
- [ ] Delete expense - verify only owner can delete
- [ ] Password reset - verify email sent

**Integration Testing:**
- [ ] Existing expense list loads correctly after migration
- [ ] Budget settings persist per user
- [ ] Webhook URL is user-specific
- [ ] Google Sheets sync works with new structure

---

## 📦 Deliverables

1. **Updated Authentication System**
   - Signup screen with email, password, display name
   - Enhanced login with forgot password
   - AuthContext managing user state

2. **User-Scoped Firestore Schema**
   - All data under `/users/{userId}/` structure
   - Migration script for existing test data

3. **Firestore Security Rules**
   - Complete data isolation rules
   - Tested and deployed to production

4. **Updated Services**
   - All expense/budget/webhook services use user-scoped paths
   - No hardcoded user IDs

5. **Test Suite**
   - Security rule tests
   - Unit tests for service methods
   - Manual testing documentation

---

## 🚦 Definition of Done

- [ ] All 4 stories completed with acceptance criteria met
- [ ] Code reviewed and merged to main branch
- [ ] Firestore security rules deployed to production
- [ ] All tests passing (unit + security rules)
- [ ] No user can access another user's data (verified)
- [ ] Documentation updated (README, architecture notes)
- [ ] Demo prepared for stakeholder review

---

## 📞 Communication & Handoff

**Blocks:**
- Agent 3 (UI/UX) needs Story 1.1 complete before building signup UI
- All agents need Story 1.2 complete before working with user data

**Coordinates With:**
- **Agent 2 (Subscriptions):** Will need userId for subscription linking
- **Agent 3 (UI/UX):** Will build signup/login UI after this work
- **Agents 4 & 5 (AI):** Will use user-scoped collections for goals/reports

**Handoff Requirements:**
When complete, provide:
1. Updated Firestore schema diagram
2. Example user IDs for testing (2-3 test accounts)
3. List of all updated service methods
4. Security rules test results

---

## 🎯 Success Metrics

- **100% data isolation** - Zero cross-user data access
- **All existing features working** after migration
- **Security rules tests pass** with 100% coverage
- **Authentication flow** works smoothly (signup, login, logout, reset)

---

**Ready to start? Questions?**

Contact: Product Manager (John) for clarification
PRD Reference: `/docs/prd.md` - Epic 1
