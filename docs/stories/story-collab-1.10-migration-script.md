# Story 1.10: Create Migration Script for Existing Users

## Metadata
- **Story ID:** COLLAB-1.10
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P1 (Deployment requirement)
- **Estimated Effort:** 4 hours
- **Assigned To:** James (Dev)

---

## User Story

**As an** operations engineer,
**I want** a migration script to generate collab codes for existing users,
**so that** all users have codes when the feature launches.

---

## Story Context

### Existing System Integration
- **Integrates with:** Firestore `users` collection, `collabCodeService.js`
- **Technology:** Node.js script, Firebase Admin SDK
- **Follows pattern:** Backend migration scripts
- **Touch points:**
  - Create new script: `scripts/migrate-collab-codes.js`
  - Use `generateUniqueCollabCode()` from collabCodeService
  - Update existing user documents in Firestore

### Current System Behavior
Existing users do not have `collabCode` field in their user documents. New feature requires all users to have collab codes.

### Enhancement Details
Create idempotent Node.js migration script that:
1. Queries all users without `collabCode` field
2. Generates unique collab code for each
3. Updates user documents
4. Logs progress and failures
5. Can be run multiple times safely

---

## Acceptance Criteria

### Migration Script Functionality

**AC1: Query Users Without Collab Code**
- [ ] Script queries `users` collection for documents where `collabCode` field is missing or null
- [ ] Uses Firebase Admin SDK for server-side access
- [ ] Handles pagination for large user bases (batch queries)

**AC2: Generate Unique Collab Codes**
- [ ] For each user, generate unique collab code using `generateUniqueCollabCode()` logic
- [ ] Check for collisions before assignment
- [ ] Retry on collision (up to 10 times)

**AC3: Update User Documents**
- [ ] Update user document with `collabCode` field
- [ ] Add `collabCodeGeneratedAt` timestamp
- [ ] Do not modify other user fields
- [ ] Use batch writes for efficiency (up to 500 per batch)

**AC4: Progress Logging**
- [ ] Log start of migration with total user count
- [ ] Log progress every 100 users
- [ ] Log completion with success/failure counts
- [ ] Log individual failures with user IDs for manual review

**AC5: Idempotent Execution**
- [ ] Script can be run multiple times safely
- [ ] Skips users who already have collab codes
- [ ] Does not create duplicate codes
- [ ] No side effects on already-migrated users

**AC6: Fallback for Missed Users**
- [ ] If script misses users (due to failures), they get codes on first login
- [ ] `initializeUserProfile()` (Story 1.1) generates code on-demand if missing
- [ ] Log on-demand generation events

### Error Handling

**AC7: Network Error Handling**
- [ ] Graceful handling of network failures
- [ ] Retry failed user updates (up to 3 times)
- [ ] Continue processing other users if one fails

**AC8: Collision Handling**
- [ ] Detect collab code collisions
- [ ] Regenerate code on collision
- [ ] Log collision events (should be rare)

### Quality Requirements

**AC9: Dry Run Mode**
- [ ] Script supports `--dry-run` flag
- [ ] Dry run logs what would be changed without making changes
- [ ] Useful for testing before production run

**AC10: Testing**
- [ ] Unit tests for migration logic
- [ ] Test with small dataset in Firebase Emulator
- [ ] Test idempotency (run twice, verify no duplicates)
- [ ] Test collision handling

---

## Technical Implementation Notes

### New Script: scripts/migrate-collab-codes.js

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Firebase service account

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Constants
const COLLAB_CODE_PREFIX = 'PENNY-';
const COLLAB_CODE_LENGTH = 4;
const MAX_COLLISION_RETRIES = 10;
const BATCH_SIZE = 500;

/**
 * Generate random 4-digit code
 */
function generateRandomCode() {
  const min = 0;
  const max = 9999;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num.toString().padStart(COLLAB_CODE_LENGTH, '0');
}

/**
 * Check if collab code already exists
 */
async function collabCodeExists(code) {
  const fullCode = `${COLLAB_CODE_PREFIX}${code}`;
  const usersRef = db.collection('users');
  const query = usersRef.where('collabCode', '==', fullCode);
  const snapshot = await query.get();
  return !snapshot.empty;
}

/**
 * Generate unique collab code
 */
async function generateUniqueCollabCode() {
  let attempts = 0;

  while (attempts < MAX_COLLISION_RETRIES) {
    const code = generateRandomCode();
    const fullCode = `${COLLAB_CODE_PREFIX}${code}`;

    const exists = await collabCodeExists(code);

    if (!exists) {
      return fullCode;
    }

    console.log(`Collision detected for code ${fullCode}, retrying...`);
    attempts++;
  }

  throw new Error('Failed to generate unique collab code after max retries');
}

/**
 * Migrate collab codes for all users
 */
async function migrateCollabCodes(dryRun = false) {
  console.log('='.repeat(60));
  console.log('Starting Collab Code Migration');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE RUN'}`);
  console.log('='.repeat(60));

  try {
    // Get all users without collab codes
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    const usersWithoutCodes = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.collabCode) {
        usersWithoutCodes.push({
          id: doc.id,
          email: userData.email,
        });
      }
    });

    console.log(`Total users: ${snapshot.size}`);
    console.log(`Users without collab codes: ${usersWithoutCodes.length}`);

    if (usersWithoutCodes.length === 0) {
      console.log('✓ All users already have collab codes. Nothing to do.');
      return;
    }

    if (dryRun) {
      console.log('DRY RUN: Would generate codes for these users:');
      usersWithoutCodes.slice(0, 10).forEach((user) => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      if (usersWithoutCodes.length > 10) {
        console.log(`  ... and ${usersWithoutCodes.length - 10} more`);
      }
      return;
    }

    // Process users in batches
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (let i = 0; i < usersWithoutCodes.length; i++) {
      const user = usersWithoutCodes[i];

      try {
        // Generate unique code
        const collabCode = await generateUniqueCollabCode();

        // Update user document
        const userRef = db.collection('users').doc(user.id);
        await userRef.update({
          collabCode: collabCode,
          collabCodeGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        successCount++;

        // Log progress every 100 users
        if ((i + 1) % 100 === 0) {
          console.log(`Progress: ${i + 1}/${usersWithoutCodes.length} users processed`);
        }
      } catch (error) {
        console.error(`Failed to generate code for user ${user.email}:`, error.message);
        failureCount++;
        failures.push({
          userId: user.id,
          email: user.email,
          error: error.message,
        });
      }
    }

    console.log('='.repeat(60));
    console.log('Migration Complete');
    console.log(`Success: ${successCount}`);
    console.log(`Failures: ${failureCount}`);

    if (failures.length > 0) {
      console.log('\\nFailed Users:');
      failures.forEach((failure) => {
        console.log(`  - ${failure.email} (${failure.userId}): ${failure.error}`);
      });
    }

    console.log('='.repeat(60));
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
migrateCollabCodes(dryRun)
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
```

### Usage

```bash
# Dry run (no changes)
node scripts/migrate-collab-codes.js --dry-run

# Live run (makes changes)
node scripts/migrate-collab-codes.js

# With environment variables
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-collab-codes.js
```

### Service Account Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Save as `scripts/serviceAccountKey.json`
4. Add to `.gitignore` (never commit!)

---

## Integration Verification

### IV1: Existing User Data Unmodified
**Verification Steps:**
1. Before migration, export sample user document
2. Run migration
3. After migration, compare user document
4. Verify only `collabCode` and `collabCodeGeneratedAt` added
5. Check all other fields unchanged (email, displayName, etc.)

**Expected Result:** Only collab code fields added

### IV2: Authentication Sessions Valid
**Verification Steps:**
1. Have users logged in before migration
2. Run migration
3. Verify users remain logged in after migration
4. Test creating expenses, navigating app
5. No re-authentication required

**Expected Result:** No disruption to active sessions

### IV3: Migration Performance
**Verification Steps:**
1. Run migration on test Firebase with 100 users
2. Measure duration
3. Verify completes in reasonable time (<5 minutes for 100 users)
4. Check Firestore usage/costs

**Expected Result:** Acceptable performance

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC10) are met
- [ ] `scripts/migrate-collab-codes.js` created
- [ ] Script uses Firebase Admin SDK
- [ ] Dry run mode works
- [ ] Idempotent execution verified
- [ ] Progress logging implemented
- [ ] Error handling robust
- [ ] Tested with Firebase Emulator
- [ ] Tested with production (dry run first)
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Documentation for running script added

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create `scripts/migrate-collab-codes.js`
- [ ] Task 2: Implement user query logic (find users without codes)
- [ ] Task 3: Implement collab code generation logic
- [ ] Task 4: Implement collision detection and retry
- [ ] Task 5: Implement batch update logic
- [ ] Task 6: Add progress logging
- [ ] Task 7: Add error handling with retries
- [ ] Task 8: Implement dry run mode
- [ ] Task 9: Test with Firebase Emulator
- [ ] Task 10: Run dry run on production
- [ ] Task 11: Run live migration on production
- [ ] Task 12: Verify integration verification steps (IV1-IV3)

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
- None (migration can run independently)

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Need code generation logic
- Story 1.9 (Firestore Rules) - Need rules deployed before migration

---

## Additional Notes

### Deployment Strategy
1. **Phase 1:** Deploy Firestore rules (Story 1.9)
2. **Phase 2:** Run migration script (dry run first)
3. **Phase 3:** Verify all users have codes
4. **Phase 4:** Deploy app with collab code features

### Rollback Plan
If migration fails:
- Users without codes will get them on first login (fallback in Story 1.1)
- No data loss (script only adds fields, doesn't delete)
- Can re-run script safely

### PM Notes
- Run during off-peak hours to minimize disruption
- Monitor Firestore costs during migration
- Consider running in stages for very large user bases (1000+ users)
- Keep service account key secure (never commit to repo)
- Document migration date and results for audit trail
