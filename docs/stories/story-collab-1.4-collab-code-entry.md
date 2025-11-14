# Story 1.4: Implement Collab Code Entry Flow

## Metadata
- **Story ID:** COLLAB-1.4
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P1
- **Estimated Effort:** 4 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user,
**I want** to enter someone's collab code to request collaboration,
**so that** I can join their shared database.

---

## Story Context

### Existing System Integration
- **Integrates with:** `collabCodeService.js`, `invitationService.js`
- **Technology:** React Native, Firebase Firestore
- **Follows pattern:** Similar to EmailSearchScreen (Story 1.3)
- **Touch points:**
  - Create new screen: `CollabCodeEntryScreen.js`
  - Use `validateCollabCodeFormat()` from collabCodeService
  - Use `sendInvitation()` from invitationService

### Current System Behavior
No existing collab code entry flow. Users currently only invite via email.

### Enhancement Details
Create screen where users can manually enter a collab code (e.g., PENNY-4729). Validate format, check if code exists, send collaboration request. This is an alternative to email search for users who received codes externally (SMS, in-person).

---

## Acceptance Criteria

### Functional Requirements

**AC1: Collab Code Entry Screen**
- [ ] New screen `CollabCodeEntryScreen.js` created
- [ ] Screen accessible from collaboration management area
- [ ] Text input for collab code with placeholder "PENNY-####"
- [ ] Input auto-formats to uppercase as user types
- [ ] "Submit" or "Request Collaboration" button

**AC2: Format Validation**
- [ ] Use `validateCollabCodeFormat()` from collabCodeService
- [ ] Validate pattern: `PENNY-####` (#### = 4 digits)
- [ ] If invalid format: Show error "Invalid code format. Use PENNY-#### format."
- [ ] Validation happens on blur or button tap

**AC3: Code Existence Check**
- [ ] Before sending request, query Firestore to verify code exists
- [ ] Use new function `findUserByCollabCode(code)` in collabCodeService
- [ ] If code not found: Show error "Code not found. Check the code and try again."
- [ ] If found: Proceed to send invitation

**AC4: Send Collaboration Request**
- [ ] Use existing `sendInvitation()` function with user email from code lookup
- [ ] Show success toast: "Collaboration request sent!"
- [ ] Navigate back to collaboration management screen

**AC5: Duplicate Request Prevention**
- [ ] Check for existing pending invitation before sending
- [ ] If pending: Show "Request already pending"
- [ ] Do not create duplicate invitation

**AC6: Already Member Check**
- [ ] Check if user with this code is already in shared database
- [ ] If already member: Show "Already collaborating with this user"
- [ ] Do not send request

**AC7: Self-Collaboration Prevention**
- [ ] Check if entered code matches current user's code
- [ ] If self: Show "You cannot collaborate with yourself"
- [ ] Do not send request

### UI/UX Requirements

**AC8: Visual Design**
- [ ] Screen follows existing app design (glass-morphism)
- [ ] Large, prominent input field for code
- [ ] Monospace font in input for easier reading
- [ ] Clear focus state on input
- [ ] Submit button is prominent (purple, touchable)

**AC9: Input Experience**
- [ ] Auto-focus input field when screen opens
- [ ] Keyboard type: alphanumeric (default)
- [ ] Auto-capitalize input
- [ ] Show character count or format hint below input
- [ ] Clear button to reset input

**AC10: Loading States**
- [ ] Show loading spinner while checking code existence
- [ ] Show loading spinner while sending request
- [ ] Disable submit button during loading

**AC11: Error Handling**
- [ ] Show clear error messages for all failure scenarios
- [ ] Errors displayed below input field
- [ ] Error text in red color
- [ ] Provide "Try Again" or clear error on input change

### Integration Requirements

**AC12: Existing Invitation Flow Preserved**
- [ ] `sendInvitation()` works for both email and code-based requests
- [ ] No breaking changes to invitation creation logic
- [ ] Navigation flow remains consistent

### Quality Requirements

**AC13: Testing**
- [ ] Unit tests for format validation
- [ ] Unit tests for code existence check
- [ ] Unit tests for self-collaboration prevention
- [ ] UI tests for input formatting
- [ ] Integration tests for full code entry → request flow

---

## Technical Implementation Notes

### New Service Function: findUserByCollabCode()

Add to `collabCodeService.js`:

```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const USERS_COLLECTION = 'users';

/**
 * Find user by collab code
 * @param {string} collabCode - Full collab code (e.g., "PENNY-4729")
 * @returns {Promise<Object|null>} - User data if found, null otherwise
 */
export const findUserByCollabCode = async (collabCode) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('collabCode', '==', collabCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Error finding user by collab code:', error);
    throw error;
  }
};
```

### New Screen: src/screens/CollabCodeEntryScreen.js

```javascript
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import {
  validateCollabCodeFormat,
  findUserByCollabCode,
  getUserCollabCode,
} from '../services/collabCodeService';
import {
  sendInvitation,
  getUserDatabaseId,
  getSharedDatabase,
} from '../services/invitationService';
import { auth } from '../config/firebase';
import { colors, spacing, borderRadius } from '../theme';

export default function CollabCodeEntryScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCodeChange = (text) => {
    // Auto-format to uppercase and remove spaces
    const formatted = text.toUpperCase().replace(/\s/g, '');
    setCode(formatted);
    setError(null); // Clear error on input change
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate format
    if (!validateCollabCodeFormat(code)) {
      setError('Invalid code format. Use PENNY-#### format.');
      return;
    }

    // Check if it's user's own code
    const currentUser = auth.currentUser;
    const myCode = await getUserCollabCode(currentUser.uid);
    if (code === myCode) {
      setError('You cannot collaborate with yourself');
      return;
    }

    setLoading(true);

    try {
      // Check if code exists
      const user = await findUserByCollabCode(code);

      if (!user) {
        setError('Code not found. Check the code and try again.');
        setLoading(false);
        return;
      }

      // Check if already a member
      const currentDatabaseId = await getUserDatabaseId(currentUser.uid);
      const sharedDb = await getSharedDatabase(currentDatabaseId);

      if (sharedDb && sharedDb.members.includes(user.id)) {
        setError('Already collaborating with this user');
        setLoading(false);
        return;
      }

      // Send invitation
      const result = await sendInvitation(user.email);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Request sent!',
          text2: `Collaboration request sent to ${user.displayName}`,
          position: 'bottom',
        });
        navigation.goBack();
      } else {
        setError(result.error || 'Request failed. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting collab code:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter Collab Code</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Enter the collab code someone shared with you
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            placeholder="PENNY-####"
            placeholderTextColor={colors.text.secondary}
            value={code}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10} // PENNY-#### = 10 chars
            onSubmitEditing={handleSubmit}
          />
          {code.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setCode('')}
            >
              <Ionicons name="close-circle" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.formatHint}>Format: PENNY-1234</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || code.length < 10}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={colors.text.primary} />
              <Text style={styles.submitButtonText}>Request Collaboration</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  instructions: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.glass.borderLight,
    padding: spacing.lg,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  formatHint: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
```

### Navigation Setup

Add to navigation stack:

```javascript
<Stack.Screen
  name="CollabCodeEntry"
  component={CollabCodeEntryScreen}
  options={{ headerShown: false }}
/>
```

### Firestore Security Rules Update

Ensure `users` collection allows querying by `collabCode`:

```javascript
// In firestore.rules
match /users/{userId} {
  allow list: if request.auth != null; // Allows queries by collabCode
  allow get: if request.auth != null;
  // ... other rules
}
```

---

## Integration Verification

### IV1: Existing Invitation Logic Preserved
**Verification Steps:**
1. Verify `sendInvitation()` works for code-based requests
2. Check invitation document created correctly
3. Verify no breaking changes to invitation flow

**Expected Result:** Invitations work as expected

### IV2: Firestore Security Rules Allow Queries
**Verification Steps:**
1. Query users collection by collabCode field
2. Verify query succeeds for authenticated users
3. Verify query fails for unauthenticated users
4. Check no Firestore permission errors

**Expected Result:** Queries allowed, security maintained

### IV3: No Impact on Pending Invitations
**Verification Steps:**
1. Create invitation via code entry
2. Check pending invitations display
3. Verify invitation appears correctly
4. Test accepting/rejecting invitation

**Expected Result:** Existing invitation management unaffected

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC13) are met
- [ ] `CollabCodeEntryScreen.js` created with full functionality
- [ ] `findUserByCollabCode()` function added to collabCodeService
- [ ] Navigation configured for CollabCodeEntryScreen
- [ ] Format validation works correctly
- [ ] Code existence check works
- [ ] Self-collaboration prevention works
- [ ] Duplicate request prevention works
- [ ] Unit tests written and passing
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Tested on iOS and Android

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Add `findUserByCollabCode()` to collabCodeService.js
- [ ] Task 2: Create `src/screens/CollabCodeEntryScreen.js`
- [ ] Task 3: Add CollabCodeEntryScreen to navigation
- [ ] Task 4: Implement format validation logic
- [ ] Task 5: Implement code existence check
- [ ] Task 6: Implement self-collaboration prevention
- [ ] Task 7: Implement duplicate request check
- [ ] Task 8: Write unit tests for validation and lookup
- [ ] Task 9: Write integration tests for full flow
- [ ] Task 10: Verify Firestore security rules allow collabCode queries
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
- Story 1.5 (Invitation Approval Flow) - Requires invitation creation

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Need collab codes in user documents
- Story 1.9 (Firestore Security Rules) - Need collabCode query support

---

## Additional Notes

### User Flow
1. User receives collab code via SMS/messaging app
2. Opens Penny app
3. Goes to collaboration management
4. Taps "Enter Collab Code"
5. Types or pastes code (e.g., PENNY-4729)
6. Taps "Request Collaboration"
7. Success toast appears
8. Returns to collaboration management
9. Owner receives notification (Story 1.5)

### PM Notes
- This is the primary external sharing method
- Input UX should be smooth (auto-format, clear errors)
- Consider adding paste button for convenience
- Future: Add QR code scanner as alternative to manual entry
- Monitor for invalid code submission attempts (potential abuse)
