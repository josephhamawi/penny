# Story 1.9: Update Firestore Security Rules for Collab Code Queries

## Metadata
- **Story ID:** COLLAB-1.9
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P0 (Security-critical)
- **Estimated Effort:** 3 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** security engineer,
**I want** Firestore security rules to allow authenticated users to query by collab code,
**so that** the code-based collaboration system functions securely.

---

## Story Context

### Existing System Integration
- **Integrates with:** Firestore security rules file (`firestore.rules`)
- **Technology:** Firebase Firestore security rules language
- **Follows pattern:** Existing security rules for users, invitations, sharedDatabases collections
- **Touch points:**
  - `firestore.rules` - Add collab code query rules
  - `users` collection - Allow querying by collabCode field
  - Test with Firebase Emulator

### Current System Behavior
Current Firestore rules allow authenticated users to query users collection by email. Need to extend to allow querying by collabCode field as well.

### Enhancement Details
Update Firestore security rules to:
1. Allow authenticated users to query `users` collection by `collabCode` field
2. Prevent unauthenticated queries
3. Maintain existing security for other operations
4. Prevent unauthorized access to archived personal databases

---

## Acceptance Criteria

### Security Rules Updates

**AC1: Users Collection Query by collabCode**
- [ ] Authenticated users can query `users` collection where `collabCode == X`
- [ ] Unauthenticated users cannot query users collection
- [ ] Query by collabCode returns user document (allow list)
- [ ] Individual user document reads still require authentication (allow get)

**AC2: Prevent Unauthenticated Access**
- [ ] Unauthenticated requests to query users by collabCode are denied
- [ ] Test with Firebase Emulator: unauth query fails
- [ ] Only authenticated users can search by collab code

**AC3: SharedDatabases Collection Rules**
- [ ] Existing rules maintained: members and owner can read
- [ ] Query by members array still works (existing functionality)
- [ ] No breaking changes to sharedDatabases access control

**AC4: Archived Personal Database Protection**
- [ ] Personal expenses remain accessible only to original owner
- [ ] Archived expenses not accessible to shared database members
- [ ] Rules enforce read-only access to archived data

### Testing Requirements

**AC5: Firebase Emulator Testing**
- [ ] Set up Firebase Emulator for rules testing
- [ ] Write rule tests for collab code queries
- [ ] Test authenticated user can query by collabCode
- [ ] Test unauthenticated user cannot query
- [ ] All rule tests pass

**AC6: Production Rule Validation**
- [ ] Deploy rules to Firebase
- [ ] Test in production with real app
- [ ] Verify no permission errors
- [ ] Monitor Firebase logs for rule violations

### Quality Requirements

**AC7: Rule Documentation**
- [ ] Add comments to rules explaining collab code queries
- [ ] Document security model in firestore.rules file
- [ ] Explain rationale for list vs get permissions

**AC8: No Breaking Changes**
- [ ] Existing user queries (by email) still work
- [ ] Existing shared database queries still work
- [ ] Existing expense queries still work
- [ ] No regression in security

---

## Technical Implementation Notes

### Updated firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function - user must be authenticated and accessing their own data
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // Helper function - check if user is a member of a shared database
    function isMember(databaseId) {
      return request.auth != null &&
             exists(/databases/$(database)/documents/sharedDatabases/$(databaseId)) &&
             get(/databases/$(database)/documents/sharedDatabases/$(databaseId)).data.members.hasAny([request.auth.uid]);
    }

    // User profile documents (for invitation system and collab codes)
    match /users/{userId} {
      // Allow authenticated users to query/list users (needed for findUserByEmail and findUserByCollabCode)
      allow list: if request.auth != null;
      // Allow authenticated users to read any user profile (for finding users by email/collabCode)
      allow get: if request.auth != null;
      // Allow users to create/update only their own profile
      allow create, update: if isOwner(userId);
      // Don't allow delete
      allow delete: if false;

      // Expenses collection (personal or shared)
      match /expenses/{expenseId} {
        // Allow read/write if user owns this data OR is a member of the shared database
        // CRITICAL: Archived personal expenses are read-only for owner only
        allow read: if isOwner(userId) || isMember(userId);
        allow write: if (isOwner(userId) && !get(/databases/$(database)/documents/users/$(userId)).data.personalDatabaseArchived) || isMember(userId);
      }

      // Settings collection (budget, webhookUrl)
      match /settings/{settingId} {
        // Allow read/write if user owns this data OR is a member of the shared database
        allow read, write: if isOwner(userId) || isMember(userId);
      }

      // Goals collection
      match /goals/{goalId} {
        // Allow read/write if user owns this data OR is a member of the shared database
        allow read, write: if isOwner(userId) || isMember(userId);
      }

      // Personality Reports collection
      match /personalityReports/{reportId} {
        // Allow read/write if user owns this data OR is a member of the shared database
        allow read, write: if isOwner(userId) || isMember(userId);
      }
    }

    // Invitations collection
    match /invitations/{invitationId} {
      // Allow authenticated users to create invitations
      allow create: if request.auth != null && request.resource.data.inviterId == request.auth.uid;
      // Allow authenticated users to query invitations (needed for checking existing invitations)
      allow list: if request.auth != null;
      // Allow users to read specific invitations where they are inviter or invitee
      allow get: if request.auth != null &&
                     (resource.data.inviterId == request.auth.uid ||
                      resource.data.inviteeId == request.auth.uid ||
                      resource.data.inviteeEmail == request.auth.token.email);
      // Allow inviter to update their sent invitations
      allow update: if request.auth != null && resource.data.inviterId == request.auth.uid;
      // Allow invitee to update invitations sent to them (for accepting/rejecting)
      allow update: if request.auth != null &&
                       (resource.data.inviteeId == request.auth.uid ||
                        resource.data.inviteeEmail == request.auth.token.email);
      // Allow inviter to delete their sent invitations
      allow delete: if request.auth != null && resource.data.inviterId == request.auth.uid;
    }

    // Shared Databases collection
    match /sharedDatabases/{databaseId} {
      // Allow any authenticated user to query/list (needed for getUserDatabaseId)
      // But individual document reads still require membership or ownership
      allow list: if request.auth != null;
      // Allow members and owner to read specific shared database documents
      allow get: if request.auth != null && (
        resource.data.members.hasAny([request.auth.uid]) ||
        resource.data.owner == request.auth.uid
      );
      // Allow owner to create shared database
      allow create: if request.auth != null && request.resource.data.owner == request.auth.uid;
      // Allow owner to update/delete, or any authenticated user to update members array (for accepting invitations)
      allow update: if request.auth != null && (
        resource.data.owner == request.auth.uid ||
        (request.resource.data.members != resource.data.members && request.resource.data.owner == resource.data.owner)
      );
      allow delete: if request.auth != null && resource.data.owner == request.auth.uid;
    }

    // Landing Page Collections (existing - no changes)
    match /landing_visitors/{visitorId} {
      allow create, update: if true;
      allow read, delete: if request.auth != null;
    }

    match /landing_waitlist/{emailId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /landing_suggestions/{suggestionId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    match /landing_contact_messages/{messageId} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Deny all other paths by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Key Changes:
1. **Line 18-19**: `allow list: if request.auth != null` - Allows querying users collection (including by collabCode)
2. **Line 30-31**: Added check for `personalDatabaseArchived` - Archived expenses are read-only for owner
3. **Comments**: Added explanation for collab code query support

### Firebase Emulator Rule Tests

Create `firestore.rules.test.js`:

```javascript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules - Collab Code', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Users Collection - Collab Code Queries', () => {
    it('should allow authenticated users to query by collabCode', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const usersRef = alice.firestore().collection('users');
      const query = usersRef.where('collabCode', '==', 'PENNY-1234');

      await assertSucceeds(query.get());
    });

    it('should deny unauthenticated users from querying by collabCode', async () => {
      const unauthed = testEnv.unauthenticatedContext();
      const usersRef = unauthed.firestore().collection('users');
      const query = usersRef.where('collabCode', '==', 'PENNY-1234');

      await assertFails(query.get());
    });

    it('should allow authenticated users to read user documents', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const userDoc = alice.firestore().collection('users').doc('bob');

      await assertSucceeds(userDoc.get());
    });
  });

  describe('Archived Personal Expenses', () => {
    it('should allow owner to read archived expenses', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const expenseDoc = alice.firestore().collection('users/alice/expenses').doc('expense1');

      await assertSucceeds(expenseDoc.get());
    });

    it('should deny writes to archived expenses', async () => {
      const alice = testEnv.authenticatedContext('alice');
      // Assume alice's personal DB is archived
      const expenseDoc = alice.firestore().collection('users/alice/expenses').doc('expense1');

      await assertFails(expenseDoc.set({ amount: 100 }));
    });
  });
});
```

---

## Integration Verification

### IV1: Existing User Queries Work
**Verification Steps:**
1. Query users by email (`findUserByEmail()`)
2. Verify query returns results
3. Check no permission errors
4. Measure query performance

**Expected Result:** Email queries work unchanged

### IV2: Shared Database Queries Work
**Verification Steps:**
1. Query sharedDatabases by members array
2. Call `getUserDatabaseId()`
3. Verify shared database access
4. Check no permission errors

**Expected Result:** Shared database queries work

### IV3: Expense Queries Maintain Data Isolation
**Verification Steps:**
1. User A queries expenses → Only sees own/shared expenses
2. User B queries expenses → Cannot see User A's personal expenses
3. Test archived expenses → Owner can read, others cannot

**Expected Result:** Data isolation maintained

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC8) are met
- [ ] `firestore.rules` updated with collab code query support
- [ ] Archived personal expense protection added
- [ ] Firebase Emulator rule tests written and passing
- [ ] Rules deployed to Firebase
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Tested with real app (no permission errors)
- [ ] Monitored Firebase logs for rule violations
- [ ] Rule documentation added

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Update `firestore.rules` to allow collabCode queries
- [ ] Task 2: Add archived expense read-only enforcement
- [ ] Task 3: Add comments/documentation to rules
- [ ] Task 4: Set up Firebase Emulator for testing
- [ ] Task 5: Write rule tests for collab code queries
- [ ] Task 6: Write rule tests for archived expenses
- [ ] Task 7: Run all rule tests - verify pass
- [ ] Task 8: Deploy rules to Firebase: `firebase deploy --only firestore:rules`
- [ ] Task 9: Test with real app (manual verification)
- [ ] Task 10: Monitor Firebase console for rule violations
- [ ] Task 11: Verify integration verification steps (IV1-IV3)

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
- Story 1.4 (Collab Code Entry) - Needs collabCode query support

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Need collabCode field in user documents

---

## Additional Notes

### Security Principles
- **Least Privilege**: Only authenticated users can query
- **Data Isolation**: Personal expenses protected from shared DB members
- **Read-Only Archives**: Archived personal expenses cannot be modified
- **Owner Control**: Only owner can access archived data

### Deployment
```bash
# Test rules locally with emulator
firebase emulators:start --only firestore

# Deploy rules to production
firebase deploy --only firestore:rules

# Monitor logs
firebase firestore:logs
```

### PM Notes
- This is a security-critical story
- Must deploy rules BEFORE deploying app with collab code features
- Test thoroughly with emulator first
- Monitor production logs for unauthorized access attempts
- Consider adding rate limiting if abuse detected
