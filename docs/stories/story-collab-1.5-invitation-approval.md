# Story 1.5: Refactor Invitation Approval Flow for Code-Based System

## Metadata
- **Story ID:** COLLAB-1.5
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P0 (Critical user flow)
- **Estimated Effort:** 4 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user receiving a collaboration request,
**I want** to approve or reject requests from registered users,
**so that** I can control who accesses my shared database.

---

## Story Context

### Existing System Integration
- **Integrates with:** `invitationService.js`, existing pending invitations UI
- **Technology:** React Native, Firebase Firestore, real-time listeners
- **Follows pattern:** Existing `acceptInvitation()` and `rejectInvitation()` functions
- **Touch points:**
  - Modify: `acceptInvitation()` to trigger data merge modal
  - Update pending invitations display to show collab codes
  - Maintain: `rejectInvitation()` and `subscribeToPendingInvitations()`

### Current System Behavior
Users receive pending invitations via `subscribeToPendingInvitations()` real-time listener. Invitations show inviter's name and email. Users can accept or reject.

### Enhancement Details
Update invitation display to show requester's collab code. Modify accept flow to trigger data merge decision modal (Story 1.6). Maintain reject flow unchanged.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Display Pending Requests with Collab Code**
- [ ] Pending invitations show requester's name, email, and collab code
- [ ] Collab code displayed prominently (e.g., "From: John (john@example.com) - PENNY-4729")
- [ ] Layout follows existing invitation card design

**AC2: Approve Button Triggers Data Merge Modal**
- [ ] Tapping "Approve" does NOT immediately accept invitation
- [ ] Instead, opens Data Merge Decision Modal (Story 1.6 component)
- [ ] Modal shows: "You have [X] existing expenses. What would you like to do?"
- [ ] Modal handles user's choice (merge/fresh/cancel)

**AC3: Reject Button Functionality**
- [ ] Tapping "Reject" calls existing `rejectInvitation()` function
- [ ] Show confirmation dialog: "Are you sure you want to reject this request?"
- [ ] On confirm: Update invitation status to 'rejected'
- [ ] Show toast: "Request rejected"
- [ ] Notify requester (they see "Request declined")

**AC4: Duplicate Request Prevention**
- [ ] System prevents multiple pending requests from same inviter
- [ ] If duplicate detected, show only most recent request
- [ ] Old pending requests auto-expired

**AC5: Real-Time Updates**
- [ ] Existing `subscribeToPendingInvitations()` listener continues to work
- [ ] Pending invitations list updates in real-time
- [ ] When invitation accepted/rejected, it disappears from list immediately

### Integration Requirements

**AC6: Existing accept/reject Functions Preserved**
- [ ] `rejectInvitation()` function works unchanged
- [ ] `acceptInvitation()` function signature preserved
- [ ] No breaking changes to invitation status updates

**AC7: Existing Pending Invitations Listener Works**
- [ ] `subscribeToPendingInvitations()` returns code-based invitations
- [ ] Listener filters expired invitations correctly
- [ ] Performance unchanged (<3s for real-time updates)

### Quality Requirements

**AC8: Error Handling**
- [ ] Handle missing collab code gracefully (legacy invitations)
- [ ] Handle Firestore update errors with clear messages
- [ ] Retry mechanism for failed rejections

**AC9: Testing**
- [ ] Unit tests for updated invitation display
- [ ] Unit tests for reject flow
- [ ] Integration tests for accept → modal trigger
- [ ] Real-time listener tests

---

## Technical Implementation Notes

### Modified: invitationService.js

Update `acceptInvitation()` to NOT immediately add user to database (that happens after data merge decision):

```javascript
/**
 * Accept an invitation (Step 1: Mark as accepted, trigger data merge modal)
 * Note: User is not added to shared database yet - that happens in Story 1.7
 * @param {string} invitationId - Invitation document ID
 * @param {Function} onDataMergeRequired - Callback to trigger data merge modal
 */
export const acceptInvitation = async (invitationId, onDataMergeRequired) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Verify invitation is for current user
    if (invitation.inviteeId !== currentUser.uid &&
        invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new Error('This invitation is not for you');
    }

    // Check if invitation is expired
    if (invitation.expiresAt.toDate() < new Date()) {
      await updateDoc(invitationRef, {
        status: 'expired',
        updatedAt: serverTimestamp(),
      });
      throw new Error('This invitation has expired');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    // Count user's existing expenses for data merge modal
    const expensesRef = collection(db, `users/${currentUser.uid}/expenses`);
    const expensesSnapshot = await getDocs(expensesRef);
    const expenseCount = expensesSnapshot.size;

    // Trigger data merge modal (Story 1.6)
    if (onDataMergeRequired) {
      onDataMergeRequired({
        invitation,
        expenseCount,
        invitationId,
      });
    }

    return {
      success: true,
      requiresDataMerge: true,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

### Modified: Pending Invitations Display Component

Update wherever pending invitations are displayed (e.g., in Settings or Collaboration screen):

```javascript
import { subscribeToPendingInvitations, acceptInvitation, rejectInvitation } from '../services/invitationService';

// Inside component:
const [pendingInvitations, setPendingInvitations] = useState([]);
const [showDataMergeModal, setShowDataMergeModal] = useState(false);
const [dataMergeData, setDataMergeData] = useState(null);

useEffect(() => {
  const unsubscribe = subscribeToPendingInvitations((invitations) => {
    setPendingInvitations(invitations);
  });

  return () => unsubscribe();
}, []);

const handleApprove = async (invitationId) => {
  const result = await acceptInvitation(invitationId, (data) => {
    // Trigger data merge modal
    setDataMergeData(data);
    setShowDataMergeModal(true);
  });

  if (!result.success) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: result.error,
    });
  }
};

const handleReject = async (invitationId) => {
  Alert.alert(
    'Reject Request',
    'Are you sure you want to reject this collaboration request?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const result = await rejectInvitation(invitationId);
          if (result.success) {
            Toast.show({
              type: 'success',
              text1: 'Request rejected',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: result.error,
            });
          }
        },
      },
    ]
  );
};

// JSX for invitation card:
{pendingInvitations.map((invitation) => (
  <View key={invitation.id} style={styles.invitationCard}>
    <View style={styles.inviterInfo}>
      <Text style={styles.inviterName}>{invitation.inviterName}</Text>
      <Text style={styles.inviterEmail}>{invitation.inviterEmail}</Text>
      {invitation.inviterCollabCode && (
        <Text style={styles.inviterCode}>Code: {invitation.inviterCollabCode}</Text>
      )}
    </View>

    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={styles.rejectButton}
        onPress={() => handleReject(invitation.id)}
      >
        <Text style={styles.rejectButtonText}>Reject</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.approveButton}
        onPress={() => handleApprove(invitation.id)}
      >
        <Text style={styles.approveButtonText}>Approve</Text>
      </TouchableOpacity>
    </View>
  </View>
))}

{/* Data Merge Modal (Story 1.6 component) */}
{showDataMergeModal && dataMergeData && (
  <DataMergeModal
    visible={showDataMergeModal}
    expenseCount={dataMergeData.expenseCount}
    invitationId={dataMergeData.invitationId}
    invitation={dataMergeData.invitation}
    onClose={() => {
      setShowDataMergeModal(false);
      setDataMergeData(null);
    }}
  />
)}
```

---

## Integration Verification

### IV1: Existing accept/reject Functions Work
**Verification Steps:**
1. Create test invitation
2. Call `rejectInvitation()` - verify it updates status
3. Call `acceptInvitation()` with callback - verify callback triggered
4. Check invitation document status in Firestore

**Expected Result:** Functions work as expected

### IV2: subscribeToPendingInvitations Listener Functional
**Verification Steps:**
1. Subscribe to pending invitations
2. Create new invitation in Firestore
3. Verify listener fires and updates UI (<3s)
4. Accept/reject invitation - verify it disappears from list

**Expected Result:** Real-time updates work correctly

### IV3: Firestore Rules for Invitations Valid
**Verification Steps:**
1. Query invitations as authenticated user
2. Verify read access granted
3. Update invitation status - verify write access
4. Test as unauthenticated - verify access denied

**Expected Result:** Security rules enforce correct access

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC9) are met
- [ ] `acceptInvitation()` updated to trigger data merge modal
- [ ] Pending invitations UI updated to show collab codes
- [ ] Reject flow works with confirmation dialog
- [ ] Real-time listener works correctly
- [ ] Unit tests written and passing
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Tested on iOS and Android
- [ ] No console errors or warnings

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Update `acceptInvitation()` in invitationService.js
- [ ] Task 2: Update pending invitations display UI to show collab codes
- [ ] Task 3: Implement approve button handler (triggers modal)
- [ ] Task 4: Implement reject button handler with confirmation
- [ ] Task 5: Add expense count query to acceptInvitation
- [ ] Task 6: Write unit tests for updated functions
- [ ] Task 7: Write integration tests for accept/reject flow
- [ ] Task 8: Verify integration verification steps (IV1-IV3)

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
- Story 1.6 (Data Merge Modal) - Approval flow triggers this modal

**Blocked By:**
- Story 1.3 (Email Search) - Need invitation creation flow
- Story 1.4 (Collab Code Entry) - Need invitation creation flow

---

## Additional Notes

### User Flow
1. User receives in-app notification: "New collaboration request!"
2. Opens pending invitations
3. Sees request from "John (john@example.com) - PENNY-4729"
4. Taps "Approve"
5. Data Merge Modal appears (Story 1.6)
6. User chooses merge/fresh/cancel
7. If merge/fresh: Added to shared database
8. If cancel: Invitation remains pending

### PM Notes
- This is a critical UX moment - keep it simple
- Rejection should be easy and non-confrontational
- Approval triggers the data merge decision (user control)
- Consider adding "Block User" option in future
- Monitor rejection rate for UX insights
