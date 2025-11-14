# Story 1.7: Build Data Merge Service for Expense Migration

## Metadata
- **Story ID:** COLLAB-1.7
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P0 (Critical backend service)
- **Estimated Effort:** 6 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** developer,
**I want** an atomic data merge service,
**so that** user expenses are safely migrated to shared databases without data loss.

---

## Story Context

### Existing System Integration
- **Integrates with:** `expenseService.js`, Firestore batch writes
- **Technology:** Firebase Firestore batch operations, transactions
- **Follows pattern:** Existing expense CRUD operations in expenseService
- **Touch points:**
  - Create new service: `dataMergeService.js`
  - Read from: `users/{userId}/expenses` collection
  - Write to: `users/{sharedDatabaseId}/expenses` collection
  - Update: `users/{userId}` document with archive flag

### Current System Behavior
Expenses are stored in `users/{userId}/expenses` subcollection. No existing merge or migration logic.

### Enhancement Details
Create service that atomically copies all user's personal expenses to shared database expenses collection. Must be transactional (all-or-nothing). Mark personal database as archived. Handle large datasets (up to 1000 expenses) within 10 seconds.

---

## Acceptance Criteria

### Functional Requirements

**AC1: mergeUserExpenses() Function**
- [ ] Function signature: `mergeUserExpenses(userId, sharedDatabaseId)`
- [ ] Returns: `{ success: boolean, count: number, error?: string }`
- [ ] Atomic operation using Firestore batch writes
- [ ] Copies all expenses from personal DB to shared DB

**AC2: Batch Write for Atomicity**
- [ ] Use Firestore batch writes (max 500 operations per batch)
- [ ] If >500 expenses, use multiple sequential batches
- [ ] All batches must succeed or entire operation rolls back
- [ ] No partial migration states

**AC3: Expense Data Copy**
- [ ] Copy all fields from original expense document
- [ ] Preserve original timestamps (createdAt, updatedAt)
- [ ] Add metadata: `migratedFrom: userId`, `migratedAt: timestamp`
- [ ] Generate new document IDs in shared DB (don't reuse IDs)

**AC4: Personal Database Archival**
- [ ] After successful migration, mark user document:
  - `personalDatabaseArchived: true`
  - `archivedAt: serverTimestamp()`
  - `sharedDatabaseId: sharedDatabaseId`
- [ ] Personal expenses remain in place (not deleted)
- [ ] Personal expenses become read-only (enforced by app logic)

**AC5: Performance**
- [ ] Complete within 10 seconds for up to 1000 expenses (NFR3)
- [ ] Log migration duration for monitoring
- [ ] Optimize batch sizes for performance

**AC6: Rollback Mechanism**
- [ ] If any batch fails, do not mark database as archived
- [ ] Return error with details
- [ ] Allow retry without creating duplicates
- [ ] Log rollback events

### Data Integrity Requirements

**AC7: No Duplicate Expenses**
- [ ] Check if expense already migrated (by metadata field)
- [ ] Skip expenses that already exist in shared DB
- [ ] Idempotent: Safe to run multiple times

**AC8: Preserve Expense Relationships**
- [ ] Maintain expense categories
- [ ] Maintain expense tags/labels
- [ ] Preserve all custom fields

**AC9: Handle Large Datasets**
- [ ] Support up to 1000 expenses (per NFR3)
- [ ] Batch in chunks of 500 (Firestore limit)
- [ ] Progress logging for transparency

### Error Handling

**AC10: Firestore Error Handling**
- [ ] Handle network failures gracefully
- [ ] Handle permission errors with clear messages
- [ ] Handle batch write failures with retry suggestion
- [ ] Log all errors for debugging

**AC11: Validation**
- [ ] Validate userId exists
- [ ] Validate sharedDatabaseId exists
- [ ] Validate user has expenses to migrate
- [ ] Return early if no expenses found (success with count=0)

### Quality Requirements

**AC12: Testing**
- [ ] Unit tests for merge function
- [ ] Unit tests for batch write logic
- [ ] Integration tests with small dataset (10 expenses)
- [ ] Integration tests with large dataset (500+ expenses)
- [ ] Test rollback on failure
- [ ] Test idempotency (run twice, no duplicates)

---

## Technical Implementation Notes

### New Service: src/services/dataMergeService.js

```javascript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COLLECTION = 'users';
const EXPENSES_SUBCOLLECTION = 'expenses';
const BATCH_SIZE = 500; // Firestore max batch size

/**
 * Merge user's personal expenses into shared database
 * @param {string} userId - User ID whose expenses to migrate
 * @param {string} sharedDatabaseId - Shared database ID to migrate to
 * @returns {Promise<Object>} - { success, count, error }
 */
export const mergeUserExpenses = async (userId, sharedDatabaseId) => {
  const startTime = Date.now();

  try {
    console.log(`Starting expense merge for user ${userId} to DB ${sharedDatabaseId}`);

    // Validate inputs
    if (!userId || !sharedDatabaseId) {
      throw new Error('userId and sharedDatabaseId are required');
    }

    // Check if user exists
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Check if already archived
    const userData = userDoc.data();
    if (userData.personalDatabaseArchived) {
      console.log('Personal database already archived, skipping merge');
      return { success: true, count: 0, alreadyArchived: true };
    }

    // Get all personal expenses
    const personalExpensesRef = collection(db, `${USERS_COLLECTION}/${userId}/${EXPENSES_SUBCOLLECTION}`);
    const personalExpensesSnapshot = await getDocs(personalExpensesRef);

    const expenseCount = personalExpensesSnapshot.size;
    console.log(`Found ${expenseCount} expenses to migrate`);

    if (expenseCount === 0) {
      // No expenses to migrate, just mark as archived
      await updateDoc(userRef, {
        personalDatabaseArchived: true,
        archivedAt: serverTimestamp(),
        sharedDatabaseId: sharedDatabaseId,
      });
      return { success: true, count: 0 };
    }

    // Prepare expenses for migration
    const expensesToMigrate = [];
    personalExpensesSnapshot.forEach((expenseDoc) => {
      expensesToMigrate.push({
        id: expenseDoc.id,
        data: expenseDoc.data(),
      });
    });

    // Migrate expenses in batches
    const batches = [];
    for (let i = 0; i < expensesToMigrate.length; i += BATCH_SIZE) {
      const batchExpenses = expensesToMigrate.slice(i, i + BATCH_SIZE);
      batches.push(batchExpenses);
    }

    console.log(`Migrating ${expenseCount} expenses in ${batches.length} batches`);

    // Execute batches sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = writeBatch(db);
      const batchExpenses = batches[batchIndex];

      for (const expense of batchExpenses) {
        // Create new expense document in shared database
        const sharedExpenseRef = doc(
          collection(db, `${USERS_COLLECTION}/${sharedDatabaseId}/${EXPENSES_SUBCOLLECTION}`)
        );

        // Add migration metadata
        const expenseData = {
          ...expense.data,
          migratedFrom: userId,
          migratedAt: serverTimestamp(),
        };

        batch.set(sharedExpenseRef, expenseData);
      }

      // Commit batch
      await batch.commit();
      console.log(`Batch ${batchIndex + 1}/${batches.length} committed successfully`);
    }

    // Mark personal database as archived
    await updateDoc(userRef, {
      personalDatabaseArchived: true,
      archivedAt: serverTimestamp(),
      sharedDatabaseId: sharedDatabaseId,
    });

    const duration = Date.now() - startTime;
    console.log(`Merge completed in ${duration}ms`);

    return {
      success: true,
      count: expenseCount,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Merge failed after ${duration}ms:`, error);

    return {
      success: false,
      count: 0,
      error: error.message,
    };
  }
};

/**
 * Check if user's personal database is archived
 * @param {string} userId - User ID to check
 * @returns {Promise<boolean>} - True if archived, false otherwise
 */
export const isPersonalDatabaseArchived = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    return userDoc.data().personalDatabaseArchived === true;
  } catch (error) {
    console.error('Error checking archive status:', error);
    return false;
  }
};

/**
 * Get archived personal expenses (read-only)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of archived expenses
 */
export const getArchivedExpenses = async (userId) => {
  try {
    const isArchived = await isPersonalDatabaseArchived(userId);
    if (!isArchived) {
      return [];
    }

    const personalExpensesRef = collection(db, `${USERS_COLLECTION}/${userId}/${EXPENSES_SUBCOLLECTION}`);
    const personalExpensesSnapshot = await getDocs(personalExpensesRef);

    const expenses = [];
    personalExpensesSnapshot.forEach((expenseDoc) => {
      expenses.push({
        id: expenseDoc.id,
        ...expenseDoc.data(),
      });
    });

    return expenses;
  } catch (error) {
    console.error('Error getting archived expenses:', error);
    return [];
  }
};
```

### Modified: expenseService.js

Update `getUserDatabaseId()` to respect archived status:

```javascript
export const getUserDatabaseId = async (userId) => {
  try {
    // Check if personal database is archived
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.personalDatabaseArchived && userData.sharedDatabaseId) {
        // User's personal DB is archived, use shared DB
        return userData.sharedDatabaseId;
      }
    }

    // Check if user is part of a shared database
    const sharedDbsRef = collection(db, SHARED_DATABASES_COLLECTION);
    const q = query(sharedDbsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }

    // User has their own database
    return userId;
  } catch (error) {
    console.error('Error getting user database ID:', error);
    return userId;
  }
};
```

---

## Integration Verification

### IV1: Existing expenseService Functions Work
**Verification Steps:**
1. After merge, call `addExpense()` → Verify goes to shared DB
2. Call `getExpenses()` → Verify returns merged expenses
3. Call `editExpense()` → Verify edits work in shared DB
4. Call `deleteExpense()` → Verify deletes work in shared DB

**Expected Result:** All CRUD operations work on shared DB

### IV2: Expense Queries Filter Correctly
**Verification Steps:**
1. Query expenses by database ID
2. Verify merged expenses appear
3. Verify original personal expenses still exist (but not queried)
4. Check no duplicate expenses

**Expected Result:** Query logic routes to correct database

### IV3: No Duplicate Expenses
**Verification Steps:**
1. Run merge once → Check expense count
2. Run merge again (idempotency test) → Check expense count
3. Verify count unchanged (no duplicates created)

**Expected Result:** Idempotent operation

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC12) are met
- [ ] `dataMergeService.js` created with all functions
- [ ] `mergeUserExpenses()` uses Firestore batch writes
- [ ] Personal database marked as archived after merge
- [ ] Rollback mechanism on failure
- [ ] `getUserDatabaseId()` updated to respect archive status
- [ ] Unit tests written and passing (100% coverage)
- [ ] Integration tests with small and large datasets
- [ ] Performance verified (<10s for 1000 expenses)
- [ ] Integration verification (IV1-IV3) completed successfully

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create `src/services/dataMergeService.js`
- [ ] Task 2: Implement `mergeUserExpenses()` with batch writes
- [ ] Task 3: Implement batch chunking for >500 expenses
- [ ] Task 4: Add migration metadata to copied expenses
- [ ] Task 5: Implement personal database archival
- [ ] Task 6: Implement `isPersonalDatabaseArchived()` helper
- [ ] Task 7: Implement `getArchivedExpenses()` helper
- [ ] Task 8: Update `getUserDatabaseId()` in expenseService.js
- [ ] Task 9: Write unit tests for merge logic
- [ ] Task 10: Write integration tests (small and large datasets)
- [ ] Task 11: Test rollback on failure
- [ ] Task 12: Test idempotency (no duplicates)
- [ ] Task 13: Verify integration verification steps (IV1-IV3)

### Debug Log
<!-- Dev: Add debug notes here during implementation -->

### Completion Notes
<!-- Dev: Add completion summary here -->

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-11-13 | Story created from PRD | John (PM) |

---

## Dependencies

**Blocks:**
- Story 1.6 (Data Merge Modal) - Modal calls this service

**Blocked By:**
- None (backend service, no UI dependencies)

---

## Additional Notes

### Performance Considerations
- Firestore batch write limit: 500 operations
- For 1000 expenses, need 2 batches
- Expected duration: ~5-8 seconds for 1000 expenses
- Monitor and optimize if needed

### Data Integrity
- Batch writes are atomic within each batch
- If batch 1 succeeds but batch 2 fails, batch 1 is NOT rolled back
- Consider this in error handling (mark partial success)
- Future improvement: Use Firestore transactions for true atomicity across batches

### PM Notes
- This is the most critical backend operation
- Zero tolerance for data loss
- Extensive testing required
- Monitor merge success rate in production
- Future: Add progress callback for UI updates during merge
- Future: Allow "undo merge" within 24 hours
