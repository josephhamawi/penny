# Story: Permanent Account Deletion

## Metadata
- **Story ID:** SETTINGS-DEL-1
- **Epic:** Settings Enhancement
- **Status:** Ready for Development
- **Priority:** P1 (High Priority - GDPR/Privacy Compliance)
- **Estimated Effort:** 5 hours
- **Assigned To:** Dev Team

---

## User Story

**As a** user of the Penny expense tracking app,
**I want** to permanently delete my account and all associated data,
**so that** I can completely remove my information from the app when I no longer wish to use it.

---

## Story Context

### Existing System Integration
- **Integrates with:**
  - Firebase Authentication (`auth` object)
  - Firestore collections (`users`, `expenses`, `settings`, `goals`, `personalityReports`, `invitations`, `sharedDatabases`)
  - `SettingsScreen.js` component
  - `AuthContext` (for logout after deletion)
  - `expenseService.js` (for data cleanup patterns)
  - `invitationService.js` (for shared database checks)

- **Technology:** React Native/Expo, Firebase Authentication, Firebase Firestore
- **Follows pattern:** Existing settings management in `SettingsScreen.js` (lines 507-584 show "Clear All Data" pattern)
- **Touch points:**
  - `/Users/mac/Development/Expenses/src/screens/SettingsScreen.js` - UI implementation
  - `/Users/mac/Development/Expenses/src/contexts/AuthContext.js` - Auth integration
  - `/Users/mac/Development/Expenses/firestore.rules` - Security rules (deletion permissions)
  - Firebase Auth API - Account deletion
  - Firestore subcollections - Data cleanup

### Current System Behavior
Currently, users can:
- Log out (preserving account and data)
- Clear all expense data (lines 507-584 in SettingsScreen.js)
- Update profile information

However, there is NO way to permanently delete their account or remove all data associated with their account from Firestore and Firebase Authentication.

### Enhancement Details
Add a "Delete Account" option in Settings that:
1. Requires password re-authentication for security
2. Shows clear warnings about permanent deletion
3. Checks if user is part of shared databases
4. Deletes all user data from Firestore (profile, expenses, settings, goals, reports)
5. Removes user from shared databases or handles database ownership transfer
6. Deletes the Firebase Authentication account
7. Logs the user out and returns them to the login screen

---

## Acceptance Criteria

### Functional Requirements

**AC1: Delete Account UI in Settings**
- [ ] Add "Delete Account" menu item in Settings screen danger zone (below "Clear All Data")
- [ ] Display red warning icon (trash-alt) and red text color to indicate destructive action
- [ ] Menu item positioned at bottom of settings menu, clearly separated from other options
- [ ] Tapping triggers first confirmation alert

**AC2: First Confirmation Alert (Warning)**
- [ ] Show alert titled "Delete Account"
- [ ] Display comprehensive warning message:
  - "This will permanently delete your account and ALL data"
  - "This includes: expenses, profile, settings, goals, and reports"
  - "This action cannot be undone and cannot be recovered"
- [ ] Provide two buttons:
  - "Cancel" (default style)
  - "Continue" (destructive style, red)
- [ ] If "Cancel" selected, dismiss alert with no action
- [ ] If "Continue" selected, proceed to password verification

**AC3: Password Verification Prompt**
- [ ] Show secure text input prompt titled "Verify Password"
- [ ] Prompt message: "Enter your password to confirm account deletion:"
- [ ] Use `Alert.prompt` with `'secure-text'` input type
- [ ] Provide two buttons:
  - "Cancel" (cancel style)
  - "Delete Account" (destructive style, red)
- [ ] Validate password is not empty before proceeding
- [ ] If password empty, show error: "Password is required"

**AC4: Password Re-authentication**
- [ ] Use Firebase `EmailAuthProvider.credential()` to create credential
- [ ] Call `user.reauthenticateWithCredential(credential)` to verify password
- [ ] If password incorrect, show alert: "Incorrect password. Account was not deleted."
- [ ] If re-authentication successful, proceed to shared database check
- [ ] Handle authentication errors gracefully (expired sessions, network errors)

**AC5: Shared Database Check**
- [ ] Call `getUserDatabaseId(userId)` to determine if user is in shared database
- [ ] If in shared database, check if user is owner:
  - Query `sharedDatabases` collection for ownership
  - If owner and has other members, show ownership transfer alert (see AC6)
  - If owner with no other members, proceed with deletion
  - If not owner (member only), warn about leaving shared group and proceed
- [ ] If not in shared database (personal database), proceed with deletion

**AC6: Ownership Transfer Alert (If Applicable)**
- [ ] If user owns shared database with other members, show alert:
  - Title: "Transfer Database Ownership"
  - Message: "You own a shared database with [N] other members. Please transfer ownership to another member before deleting your account."
  - List member emails
  - Action: "Go to Group Management" button (navigate to group management screen)
  - Cancel button returns to Settings
- [ ] Block account deletion until ownership transferred
- [ ] Future enhancement: Allow ownership transfer within delete flow

**AC7: Data Deletion Process**
- [ ] Show loading toast: "Deleting account..." (autoHide: false)
- [ ] Delete data in this order (to prevent orphaned data):
  1. User's expenses collection: `users/{userId}/expenses` (batch delete)
  2. User's settings collection: `users/{userId}/settings` (batch delete)
  3. User's goals collection: `users/{userId}/goals` (batch delete)
  4. User's personality reports: `users/{userId}/personalityReports` (batch delete)
  5. Invitations where user is inviter: `invitations` (query and delete)
  6. Invitations where user is invitee: `invitations` (query and delete)
  7. Remove user from shared database members array (if applicable)
  8. User profile document: `users/{userId}` (delete)
  9. Firebase Auth account: `user.delete()`
- [ ] Use Firestore batched writes where possible (max 500 operations per batch)
- [ ] Handle large datasets (loop through batches if needed)
- [ ] Log each step for debugging: `console.log('[AccountDeletion] Deleting...')`

**AC8: Success Confirmation**
- [ ] On successful deletion, hide loading toast
- [ ] Show success toast: "Account deleted successfully"
- [ ] Automatically log out user (call `logout()` from AuthContext)
- [ ] Clear any stored biometric credentials (call `clearStoredCredentials()`)
- [ ] Navigation automatically handled by auth state change (redirect to login)

**AC9: Error Handling**
- [ ] Catch all errors during deletion process
- [ ] If error occurs mid-deletion:
  - Hide loading toast
  - Show error alert with specific error message
  - Log error to console for debugging
  - DO NOT log out user (allow them to retry)
- [ ] Handle specific error cases:
  - Network errors: "Network error. Please check connection and try again."
  - Permission errors: "Permission denied. Please contact support."
  - Unknown errors: "Failed to delete account: [error.message]"
- [ ] If Firebase Auth deletion fails after Firestore cleanup:
  - Log critical error
  - Show message: "Data deleted but account removal failed. Please contact support."

**AC10: Audit Logging**
- [ ] Log account deletion event to console:
  - User ID
  - Email
  - Timestamp
  - Deletion status (success/failure)
  - Error message (if applicable)
- [ ] Future enhancement: Log to analytics or audit service

### Integration Requirements

**AC11: AuthContext Integration**
- [ ] Use existing `auth.currentUser` for user reference
- [ ] Use `EmailAuthProvider` from Firebase Auth SDK
- [ ] Call `logout()` from AuthContext after successful deletion
- [ ] Call `clearStoredCredentials()` to remove biometric data
- [ ] Respect existing auth state management (auto-redirect on logout)

**AC12: UI/UX Consistency**
- [ ] Follow existing SettingsScreen styling patterns (lines 994-1453)
- [ ] Use existing color scheme: `colors.expense` for destructive actions
- [ ] Use existing icon library: FontAwesome5 (`trash-alt`, `exclamation-triangle`)
- [ ] Use existing Toast library for notifications
- [ ] Match existing alert patterns (see `handleClearAllData` lines 507-584)
- [ ] Use existing loading states (ActivityIndicator patterns)

**AC13: Performance Requirements**
- [ ] Deletion process should complete within 30 seconds for typical user data (<1000 expenses)
- [ ] Show progress indicator during deletion (loading toast)
- [ ] Use batched writes for efficient Firestore operations
- [ ] Don't block UI thread during deletion (async operations)

### Quality Requirements

**AC14: Security**
- [ ] MUST require password re-authentication (prevent unauthorized deletion)
- [ ] MUST use secure text input for password prompt
- [ ] MUST verify user owns the account before deletion
- [ ] MUST delete ALL user data (no orphaned records)
- [ ] MUST handle shared database permissions correctly

**AC15: Data Integrity**
- [ ] Ensure cascading deletes complete successfully
- [ ] Ensure no orphaned invitations remain
- [ ] Ensure user removed from shared database members
- [ ] Ensure Firebase Auth account deleted last (after data cleanup)
- [ ] If deletion fails midway, maintain data consistency (log state)

**AC16: Privacy Compliance (GDPR/CCPA)**
- [ ] Permanent deletion must be truly permanent (no soft deletes)
- [ ] All personal data must be removed
- [ ] User must have clear understanding of what will be deleted
- [ ] Action must be irreversible and clearly communicated

**AC17: Testing**
- [ ] Manual test: Delete account with personal database only
- [ ] Manual test: Delete account as member of shared database
- [ ] Manual test: Attempt delete as owner of shared database (should block)
- [ ] Manual test: Incorrect password verification
- [ ] Manual test: Cancel at each confirmation step
- [ ] Manual test: Network failure during deletion
- [ ] Edge case: User with large dataset (>500 expenses)
- [ ] Edge case: User with pending invitations
- [ ] Regression test: Ensure other settings features unaffected

---

## Technical Implementation Notes

### File Structure
```
src/screens/
  └── SettingsScreen.js (MODIFY - add delete account UI and logic)

src/services/
  ├── accountDeletionService.js (NEW - create dedicated service)
  └── invitationService.js (REFERENCE - use getUserDatabaseId)

src/contexts/
  └── AuthContext.js (REFERENCE - use logout and clearStoredCredentials)

firestore.rules (VERIFY - ensure user can delete their own data)
```

### New Service: accountDeletionService.js

Create dedicated service for account deletion logic:

```javascript
/**
 * Account Deletion Service
 * Handles permanent deletion of user account and all associated data
 */

import { auth, db } from '../config/firebase';
import { getUserDatabaseId } from './invitationService';

/**
 * Check if user owns a shared database with other members
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Object>} - { isOwner: boolean, memberCount: number, members: Array }
 */
export const checkSharedDatabaseOwnership = async (userId) => {
  try {
    const sharedDbsRef = db.collection('sharedDatabases');
    const querySnapshot = await sharedDbsRef.where('owner', '==', userId).get();

    if (querySnapshot.empty) {
      return { isOwner: false, memberCount: 0, members: [] };
    }

    const sharedDb = querySnapshot.docs[0].data();
    const members = sharedDb.members || [];

    // Check if there are other members besides the owner
    const otherMembers = members.filter(m => m !== userId);

    return {
      isOwner: true,
      memberCount: otherMembers.length,
      members: otherMembers,
      databaseId: querySnapshot.docs[0].id
    };
  } catch (error) {
    console.error('[AccountDeletion] Error checking database ownership:', error);
    throw error;
  }
};

/**
 * Delete a Firestore subcollection in batches
 * @param {string} path - Collection path (e.g., 'users/uid/expenses')
 * @returns {Promise<number>} - Number of documents deleted
 */
const deleteCollection = async (collectionPath) => {
  const collectionRef = db.collection(collectionPath);
  const batchSize = 500; // Firestore batch limit
  let totalDeleted = 0;

  let snapshot = await collectionRef.limit(batchSize).get();

  while (!snapshot.empty) {
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
    console.log(`[AccountDeletion] Deleted ${totalDeleted} documents from ${collectionPath}...`);

    // Get next batch
    snapshot = await collectionRef.limit(batchSize).get();
  }

  return totalDeleted;
};

/**
 * Delete user's invitations (sent and received)
 * @param {string} userId - Firebase user ID
 * @returns {Promise<number>} - Number of invitations deleted
 */
const deleteUserInvitations = async (userId, userEmail) => {
  const invitationsRef = db.collection('invitations');
  let deleted = 0;

  // Delete invitations where user is inviter
  const sentQuery = await invitationsRef.where('inviterId', '==', userId).get();
  const sentBatch = db.batch();
  sentQuery.docs.forEach(doc => {
    sentBatch.delete(doc.ref);
    deleted++;
  });
  if (!sentQuery.empty) await sentBatch.commit();

  // Delete invitations where user is invitee
  const receivedQuery = await invitationsRef.where('inviteeId', '==', userId).get();
  const receivedBatch = db.batch();
  receivedQuery.docs.forEach(doc => {
    receivedBatch.delete(doc.ref);
    deleted++;
  });
  if (!receivedQuery.empty) await receivedBatch.commit();

  // Delete invitations by email
  const emailQuery = await invitationsRef.where('inviteeEmail', '==', userEmail).get();
  const emailBatch = db.batch();
  emailQuery.docs.forEach(doc => {
    emailBatch.delete(doc.ref);
    deleted++;
  });
  if (!emailQuery.empty) await emailBatch.commit();

  return deleted;
};

/**
 * Remove user from shared database members array
 * @param {string} userId - Firebase user ID
 */
const removeFromSharedDatabase = async (userId) => {
  const databaseId = await getUserDatabaseId(userId);

  // If user's databaseId equals their userId, they're not in a shared database
  if (databaseId === userId) {
    return;
  }

  // Remove from members array
  const sharedDbRef = db.collection('sharedDatabases').doc(databaseId);
  const sharedDb = await sharedDbRef.get();

  if (sharedDb.exists()) {
    const members = sharedDb.data().members || [];
    const updatedMembers = members.filter(m => m !== userId);

    await sharedDbRef.update({
      members: updatedMembers,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[AccountDeletion] Removed user from shared database ${databaseId}`);
  }
};

/**
 * Permanently delete user account and all data
 * @param {string} password - User's password for re-authentication
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
export const deleteUserAccount = async (password) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user');
  }

  const userId = user.uid;
  const userEmail = user.email;

  try {
    console.log(`[AccountDeletion] Starting deletion for user ${userId}`);

    // Step 1: Re-authenticate user
    console.log('[AccountDeletion] Step 1: Re-authenticating user...');
    const credential = auth.EmailAuthProvider.credential(userEmail, password);
    await user.reauthenticateWithCredential(credential);
    console.log('[AccountDeletion] Re-authentication successful');

    // Step 2: Check shared database ownership
    console.log('[AccountDeletion] Step 2: Checking shared database ownership...');
    const ownershipInfo = await checkSharedDatabaseOwnership(userId);

    if (ownershipInfo.isOwner && ownershipInfo.memberCount > 0) {
      throw new Error(
        `OWNERSHIP_TRANSFER_REQUIRED:${ownershipInfo.memberCount}:${ownershipInfo.members.join(',')}`
      );
    }

    // Step 3: Delete subcollections
    console.log('[AccountDeletion] Step 3: Deleting expenses...');
    const expensesDeleted = await deleteCollection(`users/${userId}/expenses`);
    console.log(`[AccountDeletion] Deleted ${expensesDeleted} expenses`);

    console.log('[AccountDeletion] Step 4: Deleting settings...');
    const settingsDeleted = await deleteCollection(`users/${userId}/settings`);
    console.log(`[AccountDeletion] Deleted ${settingsDeleted} settings`);

    console.log('[AccountDeletion] Step 5: Deleting goals...');
    const goalsDeleted = await deleteCollection(`users/${userId}/goals`);
    console.log(`[AccountDeletion] Deleted ${goalsDeleted} goals`);

    console.log('[AccountDeletion] Step 6: Deleting personality reports...');
    const reportsDeleted = await deleteCollection(`users/${userId}/personalityReports`);
    console.log(`[AccountDeletion] Deleted ${reportsDeleted} reports`);

    // Step 4: Delete invitations
    console.log('[AccountDeletion] Step 7: Deleting invitations...');
    const invitationsDeleted = await deleteUserInvitations(userId, userEmail);
    console.log(`[AccountDeletion] Deleted ${invitationsDeleted} invitations`);

    // Step 5: Remove from shared database (if member)
    console.log('[AccountDeletion] Step 8: Removing from shared database...');
    await removeFromSharedDatabase(userId);

    // Step 6: Delete user profile document
    console.log('[AccountDeletion] Step 9: Deleting user profile...');
    await db.collection('users').doc(userId).delete();
    console.log('[AccountDeletion] User profile deleted');

    // Step 7: Delete Firebase Auth account (LAST STEP)
    console.log('[AccountDeletion] Step 10: Deleting Firebase Auth account...');
    await user.delete();
    console.log('[AccountDeletion] Firebase Auth account deleted');

    console.log(`[AccountDeletion] ✓ Account deletion complete for ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('[AccountDeletion] Error during account deletion:', error);
    return { success: false, error: error.message };
  }
};
```

### Modified Screen: SettingsScreen.js

Add delete account UI and handler:

```javascript
// Add after handleClearAllData function (around line 585)

const handleDeleteAccount = async () => {
  // First confirmation alert
  Alert.alert(
    'Delete Account',
    'This will permanently delete your account and ALL data including:\n\n' +
    '• All expenses\n' +
    '• Profile information\n' +
    '• Settings and preferences\n' +
    '• Goals and reports\n\n' +
    'This action cannot be undone and cannot be recovered.\n\n' +
    'Are you absolutely sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () => {
          // Password verification prompt
          Alert.prompt(
            'Verify Password',
            'Enter your password to confirm account deletion:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete Account',
                style: 'destructive',
                onPress: async (password) => {
                  if (!password || password.trim() === '') {
                    Alert.alert('Error', 'Password is required');
                    return;
                  }

                  try {
                    // Show loading
                    Toast.show({
                      type: 'info',
                      text1: 'Deleting account...',
                      text2: 'This may take a few moments',
                      position: 'bottom',
                      autoHide: false,
                    });

                    // Import deleteUserAccount function
                    const { deleteUserAccount } = require('../services/accountDeletionService');
                    const result = await deleteUserAccount(password);

                    Toast.hide();

                    if (result.success) {
                      Toast.show({
                        type: 'success',
                        text1: 'Account Deleted',
                        text2: 'Your account has been permanently deleted',
                        position: 'bottom',
                        visibilityTime: 3000,
                      });

                      // Clear stored credentials and logout
                      await clearStoredCredentials();
                      await logout();
                    } else {
                      // Check for ownership transfer required error
                      if (result.error && result.error.startsWith('OWNERSHIP_TRANSFER_REQUIRED')) {
                        const [_, memberCount, memberEmails] = result.error.split(':');

                        Alert.alert(
                          'Transfer Ownership Required',
                          `You own a shared database with ${memberCount} other member(s).\n\n` +
                          `Members: ${memberEmails.replace(/,/g, ', ')}\n\n` +
                          `Please transfer ownership to another member before deleting your account.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Go to Group Management',
                              onPress: () => navigation.navigate('Invitations')
                            }
                          ]
                        );
                      } else {
                        throw new Error(result.error);
                      }
                    }
                  } catch (error) {
                    Toast.hide();
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                      Alert.alert('Error', 'Incorrect password. Account was not deleted.');
                    } else {
                      Alert.alert('Error', `Failed to delete account: ${error.message}`);
                    }
                  }
                }
              }
            ],
            'secure-text'
          );
        }
      }
    ]
  );
};

// Add to Settings Menu section (after "Clear All Data" menu item, around line 973)

{/* Delete Account */}
<TouchableOpacity
  style={styles.menuItem}
  onPress={handleDeleteAccount}
>
  <View style={styles.menuItemLeft}>
    <View style={[styles.menuIcon, { backgroundColor: colors.glass.background }]}>
      <Icon name="user-times" size={20} color="#FF3B30" />
    </View>
    <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Delete Account</Text>
  </View>
  <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
</TouchableOpacity>
```

### Firestore Security Rules Verification

Verify existing rules allow user self-deletion (firestore.rules lines 23-25):

```javascript
// User profile documents
match /users/{userId} {
  // Allow users to delete only their own profile
  allow delete: if isOwner(userId); // ✓ Currently set to false - MUST CHANGE TO TRUE

  // Subcollections already allow delete if isOwner
  match /expenses/{expenseId} {
    allow read, write: if isOwner(userId) || isMember(userId);
  }
  // ... (other subcollections similar)
}
```

**IMPORTANT:** Update line 25 in firestore.rules from `allow delete: if false;` to `allow delete: if isOwner(userId);`

### Dependencies
- Existing Firebase Auth SDK
- Existing Firestore SDK
- Existing `invitationService.js` (for `getUserDatabaseId`)
- Existing `AuthContext` (for `logout`, `clearStoredCredentials`)

---

## Integration Verification

### IV1: Settings Screen UI
**Verification Steps:**
1. Open Settings screen
2. Scroll to bottom of settings menu
3. Verify "Delete Account" option appears below "Clear All Data"
4. Verify red color and user-times icon displayed
5. Verify separated visually from other options (danger zone)

**Expected Result:** Delete Account option visible and clearly destructive

### IV2: Password Verification Flow
**Verification Steps:**
1. Tap "Delete Account"
2. Confirm first alert by tapping "Continue"
3. Enter password in secure prompt
4. Verify password masked (dots/asterisks)
5. Tap "Delete Account" button

**Expected Result:** Password prompt appears with secure input

### IV3: Data Deletion Success
**Verification Steps:**
1. Complete deletion flow with correct password
2. Monitor console logs for deletion steps
3. Verify loading toast appears
4. Wait for success toast
5. Verify auto-logout occurs
6. Verify redirect to login screen
7. Check Firestore console - all user data deleted
8. Check Firebase Auth console - user removed

**Expected Result:** All data deleted, user logged out

### IV4: Shared Database Member Deletion
**Verification Steps:**
1. Create shared database with User A (owner) and User B (member)
2. Log in as User B
3. Initiate account deletion
4. Complete flow successfully
5. Verify User B removed from shared database members array
6. Verify User A still has access to shared data
7. Verify User B's account and data deleted

**Expected Result:** Member removed from shared DB, owner unaffected

### IV5: Shared Database Owner Block
**Verification Steps:**
1. Create shared database with User A (owner) and User B (member)
2. Log in as User A (owner)
3. Initiate account deletion
4. Verify ownership transfer alert appears
5. Verify member count and emails displayed
6. Verify "Go to Group Management" button works
7. Verify account NOT deleted

**Expected Result:** Owner blocked from deletion until transfer

### IV6: Error Handling
**Verification Steps:**
1. Attempt deletion with wrong password - verify error message
2. Simulate network failure - verify error handling
3. Cancel at first alert - verify no action
4. Cancel at password prompt - verify no action
5. Test with user having large dataset (>500 expenses)

**Expected Result:** All error cases handled gracefully

---

## Testing Strategy

### Manual Testing Checklist

#### Test Case 1: Delete Account - Personal Database
**Preconditions:** User has personal database (not shared)

**Steps:**
1. Log in as test user
2. Navigate to Settings
3. Tap "Delete Account"
4. Tap "Continue" on warning alert
5. Enter correct password
6. Tap "Delete Account"

**Expected Result:**
- Loading toast appears
- Success toast appears
- User logged out
- Firestore data deleted
- Auth account deleted

**Actual Result:** [ ]

---

#### Test Case 2: Delete Account - Wrong Password
**Steps:**
1. Initiate delete flow
2. Enter incorrect password
3. Tap "Delete Account"

**Expected Result:**
- Error alert: "Incorrect password. Account was not deleted."
- User remains logged in
- No data deleted

**Actual Result:** [ ]

---

#### Test Case 3: Delete Account - Shared Database Member
**Preconditions:** User is member of shared database

**Steps:**
1. Log in as member user
2. Initiate delete flow
3. Complete with correct password

**Expected Result:**
- Account deleted
- User removed from shared database members array
- Owner's data unaffected

**Actual Result:** [ ]

---

#### Test Case 4: Delete Account - Shared Database Owner
**Preconditions:** User owns shared database with members

**Steps:**
1. Log in as owner user
2. Initiate delete flow
3. Enter correct password

**Expected Result:**
- Ownership transfer alert appears
- Shows member count and emails
- Deletion blocked
- No data deleted

**Actual Result:** [ ]

---

#### Test Case 5: Cancel at Various Steps
**Steps:**
1. Test cancel at first alert
2. Test cancel at password prompt

**Expected Result:**
- No action taken
- User remains logged in
- No data deleted

**Actual Result:** [ ]

---

#### Test Case 6: Large Dataset Deletion
**Preconditions:** User has >500 expenses

**Steps:**
1. Create test user with 600 expenses
2. Initiate delete flow
3. Monitor deletion progress

**Expected Result:**
- Batched deletion works correctly
- All expenses deleted
- Completes within 30 seconds

**Actual Result:** [ ]

---

### Edge Cases

#### Edge Case 1: Network Failure Mid-Deletion
**Test:** Disconnect network after deletion starts
**Expected:** Error alert, no logout, user can retry

#### Edge Case 2: User Has Pending Invitations
**Test:** Delete account with sent and received invitations
**Expected:** All invitations deleted, no orphaned records

#### Edge Case 3: Auth Deletion Fails After Data Cleanup
**Test:** Simulate auth deletion failure
**Expected:** Error logged, user notified to contact support

---

## Security Considerations

### SEC1: Password Re-authentication Required
**Threat:** Unauthorized account deletion (e.g., stolen device)

**Mitigation:**
- MUST require password re-authentication before deletion
- Use Firebase `reauthenticateWithCredential()` API
- Secure text input for password

**Verification:**
- Manual test: Attempt deletion without password
- Manual test: Attempt deletion with wrong password
- Code review: Verify re-authentication implemented

### SEC2: Prevent Owner Deletion with Active Members
**Threat:** Data loss for shared database members

**Mitigation:**
- Check shared database ownership before deletion
- Block deletion if owner has active members
- Require ownership transfer first

**Verification:**
- Manual test: Attempt owner deletion with members
- Verify alert and block works

### SEC3: Complete Data Removal
**Threat:** Privacy violation (orphaned data)

**Mitigation:**
- Delete all subcollections (expenses, settings, goals, reports)
- Delete invitations (sent and received)
- Remove from shared databases
- Delete profile document
- Delete Auth account

**Verification:**
- Manual test: Check Firestore after deletion
- Verify no orphaned documents exist
- Use Firestore console to inspect

### SEC4: Firestore Security Rules
**Threat:** User cannot delete own data due to rules

**Mitigation:**
- Update firestore.rules line 25 to allow self-deletion
- Change from `allow delete: if false;` to `allow delete: if isOwner(userId);`
- Deploy updated rules before feature release

**Verification:**
- Review firestore.rules changes
- Test deletion in production-like environment
- Verify rules allow self-deletion

### SEC5: Audit Logging
**Threat:** No record of account deletions

**Mitigation:**
- Log all deletion events to console
- Include user ID, email, timestamp, status
- Future: Send to analytics or audit service

**Verification:**
- Review console logs during testing
- Verify all deletion steps logged

---

## Privacy & Compliance

### GDPR Compliance
- [ ] Users can request complete data deletion (Right to Erasure)
- [ ] Deletion is permanent and complete (no soft deletes)
- [ ] All personal data removed from all systems
- [ ] User receives confirmation of deletion

### CCPA Compliance
- [ ] Users can delete personal information
- [ ] Clear disclosure of what will be deleted
- [ ] Confirmation of deletion provided

### Best Practices
- [ ] Clear warning about irreversibility
- [ ] Comprehensive list of data to be deleted
- [ ] Password verification for security
- [ ] Immediate effect (no retention period)

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC17) are met
- [ ] `accountDeletionService.js` created with all functions
- [ ] `SettingsScreen.js` updated with delete account UI and handler
- [ ] `firestore.rules` updated to allow self-deletion (line 25)
- [ ] Manual testing completed (all test cases pass)
- [ ] Security verification completed (SEC1-SEC5)
- [ ] Privacy compliance verified (GDPR/CCPA)
- [ ] Integration verification (IV1-IV6) completed successfully
- [ ] Code reviewed for error handling and edge cases
- [ ] Console logs verify deletion steps working correctly
- [ ] No console errors or warnings during testing
- [ ] Documentation updated (if needed)

---

## Risk Assessment

### Primary Risk
**Risk:** Accidental account deletion by user

**Likelihood:** Low (multiple confirmations + password required)

**Impact:** High (permanent data loss)

**Mitigation:**
- Three-step confirmation process (warning alert → password → deletion)
- Clear warnings about permanent deletion
- List exactly what will be deleted
- Password re-authentication required
- No "quick delete" option

**Rollback:** User must create new account, no data recovery

### Secondary Risk
**Risk:** Partial deletion (data left behind)

**Likelihood:** Medium (complex deletion logic)

**Impact:** High (privacy violation)

**Mitigation:**
- Comprehensive deletion logic covering all collections
- Batched writes for reliability
- Console logging for verification
- Manual testing of Firestore after deletion
- Code review for completeness

**Rollback:** Manual cleanup of orphaned data

### Tertiary Risk
**Risk:** Owner deletes account, orphaning shared data

**Likelihood:** Medium (users may not understand shared ownership)

**Impact:** High (data loss for members)

**Mitigation:**
- Check ownership before deletion
- Block deletion if owner has active members
- Require ownership transfer
- Clear alert with member information
- Link to group management screen

**Rollback:** Members lose access, manual admin intervention needed

### Performance Risk
**Risk:** Deletion timeout for large datasets

**Likelihood:** Low (most users have <500 expenses)

**Impact:** Medium (incomplete deletion)

**Mitigation:**
- Use batched writes (500 per batch)
- Loop through batches for large datasets
- 30-second timeout assumption reasonable
- Console logging shows progress
- User sees loading indicator

**Rollback:** User can retry deletion

---

## Future Enhancements

### FE1: Export Data Before Deletion
**Description:** Allow user to export all data before deletion
**Priority:** P2
**Effort:** 2 hours

### FE2: Soft Delete (Retention Period)
**Description:** Keep data for 30 days before permanent deletion
**Priority:** P3
**Effort:** 4 hours

### FE3: Ownership Transfer in Delete Flow
**Description:** Allow ownership transfer without leaving delete flow
**Priority:** P2
**Effort:** 3 hours

### FE4: Analytics Event for Deletion
**Description:** Send deletion event to analytics service
**Priority:** P3
**Effort:** 1 hour

### FE5: Email Confirmation
**Description:** Send email confirming account deletion
**Priority:** P3
**Effort:** 2 hours

---

## Dependencies

**Blocks:** None

**Blocked By:**
- Firestore security rules must allow self-deletion
- User must not be owner of shared database with active members

---

## Additional Notes

### Implementation Tips
1. Start with `accountDeletionService.js` - build and test in isolation
2. Then integrate into `SettingsScreen.js`
3. Update `firestore.rules` and deploy before testing
4. Test in order: personal DB → member → owner (increasing complexity)
5. Monitor Firestore console during testing to verify deletion
6. Keep console logs verbose for debugging

### Common Pitfalls
- Forgetting to update firestore.rules (deletion will fail)
- Deleting Auth account before Firestore data (user loses ability to delete data)
- Not checking shared database ownership (data loss risk)
- Not using batched writes (performance issues)
- Not clearing biometric credentials (user can't re-register)

### Dev Questions to Resolve
1. Should we add a "cooling off" period before deletion? (Current: No, immediate)
2. Should we send confirmation email? (Current: No, future enhancement)
3. Should we allow data export before deletion? (Current: No, future enhancement)
4. Should we track deletion analytics? (Current: Console logs only)

### PM Notes
- This is a critical privacy feature for GDPR/CCPA compliance
- Must be implemented carefully to avoid data loss
- User experience should make consequences crystal clear
- Consider adding this to onboarding: "You can delete your account anytime"
- Monitor deletion rates after launch (high rate = UX problem)

---

## Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-11-13 | Story created | PM |
| | | |
| | | |
