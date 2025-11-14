# Story 1.6: Implement Data Merge Decision Modal

## Metadata
- **Story ID:** COLLAB-1.6
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P0 (Critical user decision point)
- **Estimated Effort:** 5 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user accepting a collaboration invitation,
**I want** to choose whether to merge my existing expenses or start fresh,
**so that** I have control over my data.

---

## Story Context

### Existing System Integration
- **Integrates with:** `dataMergeService.js` (Story 1.7), `invitationService.js`
- **Technology:** React Native Modal, Firestore transactions
- **Follows pattern:** Existing `InviteUserModal.js` glass-morphism design
- **Touch points:**
  - Create new component: `DataMergeModal.js`
  - Call `mergeUserExpenses()` from dataMergeService (Story 1.7)
  - Complete invitation acceptance after user choice

### Current System Behavior
No existing data merge flow. When users accept invitations, they're immediately added to shared database without choice.

### Enhancement Details
Create full-screen modal that appears after user taps "Approve" on invitation. Modal shows expense count and three options: Merge, Start Fresh, or Cancel. Based on choice, either merge data, archive personal DB, or cancel acceptance.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Modal Display**
- [ ] Modal appears after user approves invitation (triggered from Story 1.5)
- [ ] Full-screen or prominent modal (not dismissible by tapping outside)
- [ ] Title: "Data Merge Decision"
- [ ] Subtitle: "You have [X] existing expenses. What would you like to do?"

**AC2: Three Button Options**
- [ ] Button 1: "Merge my expenses into shared database"
  - Description: "All your historical expenses will be visible to the group"
- [ ] Button 2: "Start fresh"
  - Description: "Your existing expenses will be archived (you can still view them)"
- [ ] Button 3: "Cancel"
  - Description: "Don't join the shared database yet"

**AC3: Merge Option Flow**
- [ ] Tapping "Merge" shows loading indicator
- [ ] Calls `mergeUserExpenses(userId, sharedDatabaseId)` from dataMergeService
- [ ] Shows loading message: "Merging your expenses... This may take a moment."
- [ ] On success: Complete invitation acceptance, close modal, show toast "Successfully joined!"
- [ ] On error: Show error message, allow retry or cancel

**AC4: Start Fresh Option Flow**
- [ ] Tapping "Start Fresh" archives personal database
- [ ] Mark user document with `personalDatabaseArchived: true`
- [ ] Complete invitation acceptance (add user to shared database members)
- [ ] Close modal, show toast: "Successfully joined! Starting fresh."

**AC5: Cancel Option Flow**
- [ ] Tapping "Cancel" closes modal without action
- [ ] Invitation remains pending (user can approve again later)
- [ ] Show toast: "You can accept this request anytime from pending invitations"

**AC6: Loading States**
- [ ] Show loading spinner during merge operation
- [ ] Disable all buttons during loading
- [ ] Loading completes within 10 seconds (per NFR3 in PRD)
- [ ] Timeout after 10s with retry option

**AC7: Error Handling**
- [ ] If merge fails: Show error "Merge failed. Please try again or start fresh."
- [ ] Provide "Retry Merge" and "Start Fresh" buttons
- [ ] If invitation acceptance fails: Show error "Failed to join database. Please try again."
- [ ] Log errors for debugging

### UI/UX Requirements

**AC8: Visual Design**
- [ ] Modal uses glass-morphism background (matching InviteUserModal)
- [ ] Purple accent colors for primary actions
- [ ] Clear visual hierarchy (title → subtitle → options)
- [ ] Icons for each option (merge, fresh start, cancel)
- [ ] Expense count displayed prominently

**AC9: Option Clarity**
- [ ] Each option has clear title and description
- [ ] Descriptions explain consequences of choice
- [ ] No technical jargon (user-friendly language)
- [ ] Visual indicators (icons, colors) help differentiate options

**AC10: Accessibility**
- [ ] Large touch targets (44x44 minimum)
- [ ] High contrast text
- [ ] Clear button labels

### Integration Requirements

**AC11: Invitation Acceptance Completion**
- [ ] After merge/fresh choice, complete invitation acceptance flow
- [ ] Update invitation status to 'accepted' in Firestore
- [ ] Add user to shared database members
- [ ] Notify inviter: "User accepted your request!"

**AC12: Data Integrity**
- [ ] Merge operation is atomic (all-or-nothing)
- [ ] If merge fails mid-operation, rollback changes
- [ ] No partial data states
- [ ] Personal database remains intact until merge confirmed successful

### Quality Requirements

**AC13: Testing**
- [ ] Unit tests for modal logic
- [ ] Unit tests for each button handler
- [ ] Integration tests for merge flow
- [ ] Integration tests for fresh start flow
- [ ] UI tests for modal display

---

## Technical Implementation Notes

### New Component: src/components/DataMergeModal.js

```javascript
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { mergeUserExpenses } from '../services/dataMergeService'; // Story 1.7
import { completeInvitationAcceptance } from '../services/invitationService';
import { auth } from '../config/firebase';
import { colors, spacing, borderRadius } from '../theme';

export default function DataMergeModal({
  visible,
  expenseCount,
  invitationId,
  invitation,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleMerge = async () => {
    setLoading(true);
    setLoadingMessage('Merging your expenses... This may take a moment.');
    setError(null);

    try {
      const currentUser = auth.currentUser;
      const sharedDatabaseId = invitation.databaseId;

      // Call merge service (Story 1.7)
      const mergeResult = await mergeUserExpenses(currentUser.uid, sharedDatabaseId);

      if (!mergeResult.success) {
        throw new Error(mergeResult.error || 'Merge failed');
      }

      // Complete invitation acceptance
      const acceptResult = await completeInvitationAcceptance(invitationId, sharedDatabaseId);

      if (!acceptResult.success) {
        throw new Error('Failed to complete invitation acceptance');
      }

      Toast.show({
        type: 'success',
        text1: 'Successfully joined!',
        text2: `${expenseCount} expenses merged into shared database`,
        position: 'bottom',
      });

      onClose();
    } catch (err) {
      console.error('Error merging data:', err);
      setError('Merge failed. Please try again or start fresh.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleStartFresh = async () => {
    setLoading(true);
    setLoadingMessage('Setting up shared database...');
    setError(null);

    try {
      const currentUser = auth.currentUser;
      const sharedDatabaseId = invitation.databaseId;

      // Mark personal database as archived
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        personalDatabaseArchived: true,
        archivedAt: serverTimestamp(),
      });

      // Complete invitation acceptance
      const acceptResult = await completeInvitationAcceptance(invitationId, sharedDatabaseId);

      if (!acceptResult.success) {
        throw new Error('Failed to complete invitation acceptance');
      }

      Toast.show({
        type: 'success',
        text1: 'Successfully joined!',
        text2: 'Starting fresh in shared database',
        position: 'bottom',
      });

      onClose();
    } catch (err) {
      console.error('Error starting fresh:', err);
      setError('Failed to join database. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCancel = () => {
    Toast.show({
      type: 'info',
      text1: 'No changes made',
      text2: 'You can accept this request anytime from pending invitations',
      position: 'bottom',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingMessage}>{loadingMessage}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.modalTitle}>Data Merge Decision</Text>
              <Text style={styles.modalSubtitle}>
                You have {expenseCount} existing expenses. What would you like to do?
              </Text>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Merge Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleMerge}
                disabled={loading}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="git-merge" size={32} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Merge my expenses</Text>
                  <Text style={styles.optionDescription}>
                    All your historical expenses will be visible to the group
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Start Fresh Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleStartFresh}
                disabled={loading}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="refresh" size={32} color={colors.success} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Start fresh</Text>
                  <Text style={styles.optionDescription}>
                    Your existing expenses will be archived (you can still view them)
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Cancel Option */}
              <TouchableOpacity
                style={[styles.optionButton, styles.cancelOption]}
                onPress={handleCancel}
                disabled={loading}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="close-circle" size={32} color={colors.text.secondary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Cancel</Text>
                  <Text style={styles.optionDescription}>
                    Don't join the shared database yet
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  optionButton: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.glass.borderLight,
  },
  cancelOption: {
    backgroundColor: colors.glass.background,
  },
  optionIcon: {
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
```

### New Function: completeInvitationAcceptance()

Add to `invitationService.js`:

```javascript
/**
 * Complete invitation acceptance after data merge decision
 * @param {string} invitationId - Invitation document ID
 * @param {string} sharedDatabaseId - Shared database ID
 */
export const completeInvitationAcceptance = async (invitationId, sharedDatabaseId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Add user to shared database members
    const sharedDbRef = doc(db, SHARED_DATABASES_COLLECTION, sharedDatabaseId);
    const sharedDbDoc = await getDoc(sharedDbRef);

    if (!sharedDbDoc.exists()) {
      throw new Error('Shared database not found');
    }

    const sharedDb = sharedDbDoc.data();
    const updatedMembers = [...new Set([...sharedDb.members, currentUser.uid])];

    await updateDoc(sharedDbRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    // Update invitation status
    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error completing invitation acceptance:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

---

## Integration Verification

### IV1: Existing Modal Pattern Matched
**Verification Steps:**
1. Compare DataMergeModal styling with InviteUserModal
2. Verify glass-morphism effect matches
3. Check button styles match app theme
4. Test modal animations

**Expected Result:** Visual consistency with existing modals

### IV2: Expense Queries Work After Merge/Fresh
**Verification Steps:**
1. User chooses "Merge" → Verify expenses appear in shared DB
2. User chooses "Start Fresh" → Verify shared DB is empty
3. Query personal expenses → Verify archived if "Start Fresh"
4. Test adding new expense → Goes to shared DB

**Expected Result:** Expense routing works correctly

### IV3: No Data Loss on Merge Failure
**Verification Steps:**
1. Simulate merge failure (disconnect network mid-merge)
2. Verify personal expenses intact
3. Verify user not added to shared DB
4. Retry merge → Verify success

**Expected Result:** Atomic operation, no partial states

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC13) are met
- [ ] `DataMergeModal.js` component created
- [ ] `completeInvitationAcceptance()` function added to invitationService
- [ ] Merge option triggers dataMergeService (Story 1.7)
- [ ] Start Fresh option archives personal DB
- [ ] Cancel option closes modal without action
- [ ] Loading states work correctly
- [ ] Error handling with retry options
- [ ] Unit tests written and passing
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Tested on iOS and Android

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create `src/components/DataMergeModal.js`
- [ ] Task 2: Add `completeInvitationAcceptance()` to invitationService.js
- [ ] Task 3: Implement merge option handler
- [ ] Task 4: Implement start fresh option handler
- [ ] Task 5: Implement cancel option handler
- [ ] Task 6: Add loading states for async operations
- [ ] Task 7: Add error handling with retry logic
- [ ] Task 8: Write unit tests for modal logic
- [ ] Task 9: Write integration tests for merge/fresh flows
- [ ] Task 10: Verify integration verification steps (IV1-IV3)

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
- None (this completes the acceptance flow)

**Blocked By:**
- Story 1.5 (Invitation Approval) - Triggers this modal
- Story 1.7 (Data Merge Service) - Need mergeUserExpenses() function

---

## Additional Notes

### User Decision Point
This is the MOST CRITICAL user decision in the collaboration flow. UX must be:
- Clear (no ambiguity about consequences)
- Reversible (user can cancel)
- Safe (no data loss on failure)

### PM Notes
- This respects user autonomy (key product value)
- Merge vs. Fresh Start addresses different collaboration scenarios:
  - **Merge:** Couples, existing shared finances
  - **Fresh Start:** Roommates, new shared situation
- Monitor which option is more popular (product insight)
- Future: Add "Preview merged data" before confirming
- Future: Allow users to "undo merge" within 24 hours
