# Story 1.3: Implement Email Search for Registered Users

## Metadata
- **Story ID:** COLLAB-1.3
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 5 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user,
**I want** to search for other registered users by email within the app,
**so that** I can send them collaboration requests.

---

## Story Context

### Existing System Integration
- **Integrates with:** `invitationService.js`, Firestore `users` collection
- **Technology:** React Native, Firebase Firestore queries
- **Follows pattern:** Existing `findUserByEmail()` function in `invitationService.js`
- **Touch points:**
  - Create new screen: `EmailSearchScreen.js`
  - Modify collaboration UI flow
  - Use existing `findUserByEmail()` with enhancements

### Current System Behavior
Currently, the `InviteUserModal` allows email-based invitations for both registered and unregistered users. The `findUserByEmail()` function exists and queries the `users` collection.

### Enhancement Details
Create dedicated email search screen that queries only registered users. Display results with "Request Collaboration" button. Replace "Invite by Email" with "Search by Email (Registered Users)" in collaboration UI.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Email Search Screen**
- [ ] New screen `EmailSearchScreen.js` created
- [ ] Screen accessible from collaboration management area
- [ ] Email input field with placeholder "Enter email address"
- [ ] "Search" button to trigger search
- [ ] Search executes when user taps Search button or presses Enter

**AC2: Search Query**
- [ ] Search uses existing `findUserByEmail()` function
- [ ] Query filters by exact email match (case-insensitive)
- [ ] Query only returns registered users from `users` collection
- [ ] Query completes within 2 seconds

**AC3: Search Results Display**
- [ ] If user found: Display card with user's display name, email, and collab code
- [ ] "Request Collaboration" button on user card
- [ ] If no user found: Show message "No users found with that email"
- [ ] If multiple results (shouldn't happen): Show all results

**AC4: Self-Search Prevention**
- [ ] If user searches for their own email, show: "You cannot collaborate with yourself"
- [ ] Do not show "Request Collaboration" button
- [ ] Prevent accidental self-invitation

**AC5: Request Collaboration Action**
- [ ] Tapping "Request Collaboration" creates pending invitation
- [ ] Use existing `sendInvitation()` function (modified for code-based flow)
- [ ] Show success toast: "Collaboration request sent!"
- [ ] Navigate back to collaboration management screen

**AC6: Duplicate Request Prevention**
- [ ] Before sending request, check for existing pending invitation
- [ ] If pending invitation exists: Show "Request already pending"
- [ ] Do not create duplicate invitation

**AC7: Already Member Check**
- [ ] Check if searched user is already in current user's shared database
- [ ] If already member: Show "Already collaborating with this user"
- [ ] Do not show "Request Collaboration" button

### UI/UX Requirements

**AC8: Visual Design**
- [ ] Screen follows existing app design (glass-morphism, purple accents)
- [ ] Email input has clear focus state
- [ ] Search button is prominent and touchable (44x44 minimum)
- [ ] User result card uses existing modal/card styling
- [ ] Loading state shown while searching

**AC9: Error Handling**
- [ ] Handle Firestore query errors gracefully
- [ ] Show error message if search fails: "Search failed. Please try again."
- [ ] Provide "Retry" button
- [ ] Invalid email format: Show "Please enter a valid email address"

**AC10: Navigation**
- [ ] "Search by Email" option in collaboration screen navigates to EmailSearchScreen
- [ ] Back button returns to collaboration management
- [ ] After sending request, navigate back to collaboration management

### Integration Requirements

**AC11: Existing findUserByEmail() Preserved**
- [ ] `findUserByEmail()` function remains functional for other uses
- [ ] No breaking changes to function signature
- [ ] Query performance unchanged

**AC12: Collaboration Management Structure Preserved**
- [ ] Existing collaboration screens/modals work unchanged
- [ ] Navigation flow remains intuitive
- [ ] No layout breaks

### Quality Requirements

**AC13: Testing**
- [ ] Unit tests for email search logic
- [ ] Unit tests for duplicate request prevention
- [ ] Unit tests for self-search prevention
- [ ] UI tests for search flow
- [ ] Integration tests for end-to-end search → request flow

---

## Technical Implementation Notes

### New Screen: src/screens/EmailSearchScreen.js

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { findUserByEmail, sendInvitation, getUserDatabaseId, getSharedDatabase } from '../services/invitationService';
import { auth } from '../config/firebase';
import { colors, spacing, borderRadius } from '../theme';

export default function EmailSearchScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSearch = async () => {
    setError(null);
    setSearchResult(null);

    // Validate email format
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if searching for self
    if (email.trim().toLowerCase() === auth.currentUser.email.toLowerCase()) {
      setError('You cannot collaborate with yourself');
      return;
    }

    setLoading(true);

    try {
      const user = await findUserByEmail(email.trim());

      if (!user) {
        setError('No users found with that email');
        setSearchResult(null);
      } else {
        // Check if already a member
        const currentDatabaseId = await getUserDatabaseId(auth.currentUser.uid);
        const sharedDb = await getSharedDatabase(currentDatabaseId);

        if (sharedDb && sharedDb.members.includes(user.id)) {
          setError('Already collaborating with this user');
          setSearchResult(user);
        } else {
          setSearchResult(user);
        }
      }
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCollaboration = async () => {
    try {
      const result = await sendInvitation(searchResult.email);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Request sent!',
          text2: `Collaboration request sent to ${searchResult.displayName}`,
          position: 'bottom',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Request failed',
          text2: result.error || 'Please try again',
          position: 'bottom',
        });
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      Toast.show({
        type: 'error',
        text1: 'Request failed',
        text2: 'Please try again',
        position: 'bottom',
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search by Email</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.emailInput}
          placeholder="Enter email address"
          placeholderTextColor={colors.text.secondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {searchResult && !error && (
        <View style={styles.resultCard}>
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{searchResult.displayName}</Text>
            <Text style={styles.userEmail}>{searchResult.email}</Text>
            <Text style={styles.collabCode}>{searchResult.collabCode}</Text>
          </View>

          {!error.includes('Already collaborating') && (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={handleRequestCollaboration}
            >
              <Ionicons name="person-add" size={20} color={colors.text.primary} />
              <Text style={styles.requestButtonText}>Request Collaboration</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... styles implementation
});
```

### Modified: invitationService.js

Update `sendInvitation()` to handle code-based flow:

```javascript
export const sendInvitation = async (inviteeEmail) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    // Check if user is trying to invite themselves
    if (normalizedEmail === currentUser.email.toLowerCase()) {
      return {
        success: false,
        error: 'You cannot invite yourself'
      };
    }

    // Get current user's profile
    const currentUserRef = doc(db, USERS_COLLECTION, currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();

    // Check if invitee is registered (required for code-based system)
    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found. Only registered users can collaborate.'
      };
    }

    // Get or create shared database
    const sharedDbId = await createOrGetSharedDatabase(
      currentUser.uid,
      currentUser.email
    );

    // Check if user is already a member
    const sharedDb = await getSharedDatabase(sharedDbId);
    if (sharedDb && sharedDb.members.includes(existingUser.id)) {
      return {
        success: false,
        error: 'User is already a member of this database',
      };
    }

    // Check for existing pending invitation
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const existingInviteQuery = query(
      invitationsRef,
      where('inviteeId', '==', existingUser.id),
      where('databaseId', '==', sharedDbId),
      where('status', '==', 'pending')
    );
    const existingInvites = await getDocs(existingInviteQuery);

    if (!existingInvites.empty) {
      return {
        success: false,
        error: 'An invitation is already pending for this user',
      };
    }

    // Create invitation (code-based, no email type)
    const invitationRef = doc(collection(db, INVITATIONS_COLLECTION));
    await setDoc(invitationRef, {
      inviterId: currentUser.uid,
      inviterEmail: currentUser.email,
      inviterName: currentUserData?.displayName || currentUser.email.split('@')[0],
      inviterCollabCode: currentUserData?.collabCode,
      inviteeId: existingUser.id,
      inviteeEmail: normalizedEmail,
      inviteeName: existingUser.displayName,
      inviteeCollabCode: existingUser.collabCode,
      databaseId: sharedDbId,
      type: 'code-based', // New type
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
    });

    return {
      success: true,
      type: 'code-based',
      message: 'Collaboration request sent successfully',
    };
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
```

### Navigation Setup

Add EmailSearchScreen to navigation stack (e.g., in `App.js` or navigation config):

```javascript
import EmailSearchScreen from './src/screens/EmailSearchScreen';

// In your Stack.Navigator:
<Stack.Screen
  name="EmailSearch"
  component={EmailSearchScreen}
  options={{ headerShown: false }}
/>
```

---

## Integration Verification

### IV1: Existing findUserByEmail() Functional
**Verification Steps:**
1. Test `findUserByEmail()` from console/test
2. Verify it returns user data for registered email
3. Verify it returns null for non-registered email
4. Check query performance (<2s)

**Expected Result:** Function works unchanged

### IV2: Collaboration Management Preserved
**Verification Steps:**
1. Open collaboration management screen
2. Verify existing sections work
3. Navigate to Email Search screen
4. Return to collaboration management
5. Check no layout breaks

**Expected Result:** Navigation flow works smoothly

### IV3: No Performance Impact
**Verification Steps:**
1. Measure email search query time
2. Verify <2s response time
3. Check for Firestore query warnings
4. Test with poor network connection

**Expected Result:** Performance within acceptable range

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC13) are met
- [ ] `EmailSearchScreen.js` created with full functionality
- [ ] `sendInvitation()` updated for code-based flow
- [ ] Navigation configured for EmailSearchScreen
- [ ] Unit tests written and passing
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Self-search prevention works
- [ ] Duplicate request prevention works
- [ ] Already-member check works
- [ ] Tested on iOS and Android

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create `src/screens/EmailSearchScreen.js`
- [ ] Task 2: Update `invitationService.js` `sendInvitation()` for code-based flow
- [ ] Task 3: Add EmailSearchScreen to navigation stack
- [ ] Task 4: Implement email validation logic
- [ ] Task 5: Implement self-search prevention
- [ ] Task 6: Implement duplicate request check
- [ ] Task 7: Implement already-member check
- [ ] Task 8: Write unit tests for search logic
- [ ] Task 9: Write integration tests for full flow
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
- Story 1.5 (Invitation Approval Flow) - Requires invitation creation

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Need collab codes in user documents
- Story 1.2 (Display Code in Settings) - UX continuity

---

## Additional Notes

### User Flow
1. User opens collaboration management
2. Taps "Search by Email"
3. Enters friend's email
4. Taps "Search" or presses Enter
5. Sees friend's profile with collab code
6. Taps "Request Collaboration"
7. Success toast appears
8. Returns to collaboration management
9. Friend receives in-app notification (Story 1.5)

### PM Notes
- This replaces the old "Invite by Email" for unregistered users
- Focus on clear error messages for edge cases
- Consider rate limiting if abuse becomes an issue
- Future: Add recent search history for convenience
