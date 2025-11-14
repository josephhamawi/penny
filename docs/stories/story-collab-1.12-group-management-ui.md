# Story 1.12: Add Multi-User Group Management UI

## Metadata
- **Story ID:** COLLAB-1.12
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 5 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** database owner,
**I want** to see all members in my shared database and remove members if needed,
**so that** I can manage who has access to my expenses.

---

## Story Context

### Existing System Integration
- **Integrates with:** `invitationService.js`, collaboration management screens
- **Technology:** React Native, Firestore real-time listeners
- **Follows pattern:** Existing collaboration UI patterns
- **Touch points:**
  - Modify: Collaboration management screen
  - Use: `getDatabaseMembers()`, `removeMember()`, `leaveSharedDatabase()` from invitationService
  - Add: Member list display, remove confirmation dialogs

### Current System Behavior
Currently, users can send/accept invitations but cannot see a list of current collaborators or manage them.

### Enhancement Details
Add "Current Members" section to collaboration screen showing all users in shared database. Display owner indicator. Allow owner to remove members. Allow any member to leave shared database.

---

## Acceptance Criteria

### Member List Display

**AC1: Display Current Members**
- [ ] Collaboration screen shows "Current Members" section
- [ ] List all users in shared database with display names
- [ ] Show member count (e.g., "Collaborating with 3 members")
- [ ] Update in real-time when members join or leave
- [ ] Show "Solo" status if user is not in shared database

**AC2: Owner Indicator**
- [ ] Database owner has visual indicator (badge, icon, or label)
- [ ] Badge text: "Owner" or icon like crown emoji 👑
- [ ] Clear visual distinction from regular members

**AC3: Member Information**
- [ ] Display member's display name
- [ ] Display member's email
- [ ] Display member's collab code (optional, for reference)
- [ ] Avatar/initials if available

### Owner Actions

**AC4: Remove Member Functionality**
- [ ] Owner can tap any non-owner member to see actions
- [ ] "Remove Member" option appears in action sheet/menu
- [ ] Tapping "Remove Member" shows confirmation dialog
- [ ] Confirmation: "Are you sure you want to remove [Name]? They will lose access to all shared expenses."
- [ ] On confirm: Call `removeMember(memberId)`

**AC5: Remove Member Success**
- [ ] Member removed immediately from shared database
- [ ] Member list updates in real-time (member disappears)
- [ ] Show success toast: "Member removed successfully"
- [ ] Removed member receives notification (optional)

**AC6: Cannot Remove Owner**
- [ ] Tapping owner's card shows "Cannot remove owner"
- [ ] Or don't show remove option for owner
- [ ] Clear messaging: "Transfer ownership to remove yourself"

### Member Actions

**AC7: Leave Shared Database**
- [ ] Any member (including owner) can tap "Leave Shared Database" button
- [ ] Show confirmation dialog: "Are you sure you want to leave? You'll no longer have access to shared expenses."
- [ ] On confirm: Call `leaveSharedDatabase()`
- [ ] Navigate back to collaboration screen

**AC8: Leave Success**
- [ ] User removed from shared database
- [ ] User's personal database becomes active again (if not archived)
- [ ] Show toast: "You have left the shared database"
- [ ] UI updates to show "Solo" status

**AC9: Owner Leaving**
- [ ] If owner leaves, ownership transfers to next earliest member (by joinedAt timestamp)
- [ ] New owner receives notification: "You are now the owner of the shared database"
- [ ] Or show warning: "As owner, leaving will transfer ownership to [Next Member]"

### Real-Time Updates

**AC10: Member List Real-Time Sync**
- [ ] Member list uses Firestore real-time listener
- [ ] When member joins: List updates immediately (<3s)
- [ ] When member leaves: Removed from list immediately
- [ ] When member is removed: Disappears from list immediately

### Error Handling

**AC11: Remove Member Errors**
- [ ] Handle Firestore errors gracefully
- [ ] Show error toast if removal fails: "Failed to remove member. Please try again."
- [ ] Log errors for debugging

**AC12: Leave Database Errors**
- [ ] Handle Firestore errors gracefully
- [ ] Show error toast if leave fails
- [ ] Do not navigate away on error

### UI/UX Requirements

**AC13: Visual Design**
- [ ] Member cards use glass-morphism design (consistent with app)
- [ ] Purple accent colors for owner badge
- [ ] Clear visual hierarchy (owner, then members)
- [ ] Proper spacing between member cards

**AC14: Empty State**
- [ ] If user is solo (no shared database): Show "You're not collaborating yet"
- [ ] Provide call-to-action: "Invite someone to get started"

---

## Technical Implementation Notes

### Modified: Collaboration Management Screen

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import {
  getDatabaseMembers,
  removeMember,
  leaveSharedDatabase,
  getUserDatabaseId,
} from '../services/invitationService';
import { auth } from '../config/firebase';

export default function CollaborationScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSolo, setIsSolo] = useState(true);
  const currentUserId = auth.currentUser.uid;

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const databaseId = await getUserDatabaseId(currentUserId);
      const membersList = await getDatabaseMembers();

      if (membersList.length > 1) {
        // User is in shared database (more than just themselves)
        setMembers(membersList);
        setIsSolo(false);
      } else {
        setIsSolo(true);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load members',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMemberPress = (member) => {
    if (member.isOwner) {
      Alert.alert('Owner', 'Cannot remove the database owner');
      return;
    }

    // Check if current user is owner
    const isCurrentUserOwner = members.find(m => m.id === currentUserId)?.isOwner;

    if (!isCurrentUserOwner) {
      Alert.alert('Permission Denied', 'Only the owner can remove members');
      return;
    }

    // Show action sheet
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Remove Member'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          confirmRemoveMember(member);
        }
      }
    );
  };

  const confirmRemoveMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.displayName}? They will lose access to all shared expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveMember(member.id),
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const result = await removeMember(memberId);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Member removed',
          text2: 'Member removed successfully',
        });
        loadMembers(); // Refresh list
      } else {
        throw new Error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to remove member',
        text2: error.message,
      });
    }
  };

  const handleLeaveDatabase = () => {
    const isOwner = members.find(m => m.id === currentUserId)?.isOwner;
    const nextOwner = members.find(m => !m.isOwner);

    let message = 'Are you sure you want to leave? You'll no longer have access to shared expenses.';

    if (isOwner && nextOwner) {
      message = `As owner, leaving will transfer ownership to ${nextOwner.displayName}. Continue?`;
    }

    Alert.alert(
      'Leave Shared Database',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: confirmLeaveDatabase,
        },
      ]
    );
  };

  const confirmLeaveDatabase = async () => {
    try {
      const result = await leaveSharedDatabase();

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Left shared database',
          text2: 'You are now solo',
        });
        loadMembers(); // Refresh to show solo status
      } else {
        throw new Error(result.error || 'Failed to leave database');
      }
    } catch (error) {
      console.error('Error leaving database:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to leave',
        text2: error.message,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Current Members Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Members</Text>

        {isSolo ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={48} color={colors.text.secondary} />
            <Text style={styles.emptyStateText}>You're not collaborating yet</Text>
            <Text style={styles.emptyStateSubtext}>Invite someone to get started</Text>
          </View>
        ) : (
          <>
            <Text style={styles.memberCount}>
              Collaborating with {members.length} {members.length === 1 ? 'member' : 'members'}
            </Text>

            {members.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => handleMemberPress(member)}
                disabled={member.id === currentUserId}
              >
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitials}>
                      {member.displayName?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>

                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>{member.displayName}</Text>
                      {member.isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                      {member.id === currentUserId && (
                        <Text style={styles.youBadge}>(You)</Text>
                      )}
                    </View>
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  </View>
                </View>

                {!member.isOwner && member.id !== currentUserId && (
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            ))}

            {/* Leave Database Button */}
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveDatabase}
            >
              <Ionicons name="exit-outline" size={20} color={colors.error} />
              <Text style={styles.leaveButtonText}>Leave Shared Database</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Other collaboration sections (invitations, etc.) */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  memberCount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  memberInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  ownerBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  youBadge: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  memberEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
```

---

## Integration Verification

### IV1: getDatabaseMembers() Works
**Verification Steps:**
1. User in shared database calls `getDatabaseMembers()`
2. Verify returns array of member objects
3. Verify owner indicator correct
4. Check member data complete (name, email, id)

**Expected Result:** Function returns accurate member data

### IV2: removeMember() and leaveSharedDatabase() Work
**Verification Steps:**
1. Owner removes member → Verify member access revoked immediately
2. Member leaves database → Verify removed from members list
3. Check Firestore security rules enforce access changes
4. Verify removed member cannot query shared expenses

**Expected Result:** Access control works correctly

### IV3: Removing Members Revokes Access Immediately
**Verification Steps:**
1. Member A is viewing shared expenses
2. Owner removes Member A
3. Member A tries to query expenses
4. Verify Firestore denies access (security rules)

**Expected Result:** Access revoked immediately, no stale data

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC14) are met
- [ ] Collaboration screen displays current members
- [ ] Owner can remove members with confirmation
- [ ] Any member can leave shared database
- [ ] Owner indicator displayed correctly
- [ ] Real-time updates work (<3s)
- [ ] Error handling with clear messages
- [ ] Unit tests for member management logic
- [ ] UI tests for member list display
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Tested on iOS and Android

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Update collaboration screen to display current members
- [ ] Task 2: Implement member card UI with owner badge
- [ ] Task 3: Implement remove member action (owner only)
- [ ] Task 4: Add confirmation dialogs for remove/leave actions
- [ ] Task 5: Implement leave shared database functionality
- [ ] Task 6: Handle owner leaving (ownership transfer)
- [ ] Task 7: Add real-time member list updates
- [ ] Task 8: Implement empty state for solo users
- [ ] Task 9: Add error handling and retry logic
- [ ] Task 10: Write unit tests for member management
- [ ] Task 11: Write UI tests for member display
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
- None (final story in epic)

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Need user data
- Story 1.5 (Invitation Approval) - Need members in database
- Story 1.6 (Data Merge) - Need shared database populated

---

## Additional Notes

### Owner Transfer Logic
When owner leaves:
1. Find next earliest member (by `joinedAt` timestamp)
2. Update `sharedDatabases` document: `owner: nextMemberId`
3. Send notification to new owner
4. Remove old owner from members array

### PM Notes
- This completes the collaboration UX
- Critical for transparency (users know who has access)
- Owner control is important for trust
- Consider adding "Invite History" in future (who invited whom)
- Monitor member removal rate (product metric)
- Future: Add member permissions (read-only, etc.)
