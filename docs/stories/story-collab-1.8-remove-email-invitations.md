# Story 1.8: Remove Email Invitation UI and Code

## Metadata
- **Story ID:** COLLAB-1.8
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P2 (Cleanup task)
- **Estimated Effort:** 3 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** product owner,
**I want** email invitation functionality removed from the app,
**so that** the codebase is simplified and only registered users can collaborate.

---

## Story Context

### Existing System Integration
- **Integrates with:** All existing invitation UI components
- **Technology:** React Native, removal/refactoring task
- **Follows pattern:** Code cleanup, removal of deprecated features
- **Touch points:**
  - `InviteUserModal.js` - Remove email invitation UI
  - `invitationService.js` - Remove email invitation logic
  - Any other components referencing "email invitations"

### Current System Behavior
App currently has email invitation UI and logic for inviting unregistered users. These flows are no longer needed with code-based system.

### Enhancement Details
Remove all UI elements, functions, and references to email-based invitations for unregistered users. Replace with code-based collaboration UI. Ensure no breaking changes to registered user collaboration.

---

## Acceptance Criteria

### UI Removal

**AC1: Remove Email Invitation UI Elements**
- [ ] Remove "Invite by Email" button/option from collaboration screens
- [ ] Remove any modals/screens specific to email invitations
- [ ] Replace with "Search by Email (Registered Users)" option
- [ ] Update navigation to remove email invitation routes

**AC2: Update In-App Text/Documentation**
- [ ] Remove references to "email invitations" in help text
- [ ] Remove references to "invite unregistered users"
- [ ] Update tooltips to reference collab codes
- [ ] Update any onboarding/tutorial content

### Code Removal

**AC3: Remove Email Invitation Logic**
- [ ] Remove `type: 'email'` invitation creation logic from `sendInvitation()`
- [ ] Remove email invitation acceptance logic
- [ ] Remove email invitation token handling
- [ ] Keep `type: 'code-based'` logic intact

**AC4: Clean Up Invitation Service**
- [ ] Remove unused email invitation functions
- [ ] Remove email invitation type checks
- [ ] Simplify `sendInvitation()` to only handle registered users
- [ ] Update JSDoc comments to reflect code-based system

### Verification

**AC5: No Console Errors**
- [ ] App builds successfully without errors
- [ ] No missing function references
- [ ] No unused imports
- [ ] No TypeScript/ESLint errors related to removal

**AC6: Existing Collaboration Works**
- [ ] Code-based invitation flow works end-to-end
- [ ] Email search works
- [ ] Collab code entry works
- [ ] Invitation approval/rejection works
- [ ] No regressions in collaboration features

### Quality Requirements

**AC7: Code Quality**
- [ ] Remove dead code (no commented-out email invitation code left)
- [ ] Update tests to remove email invitation test cases
- [ ] Remove email invitation mock data
- [ ] Clean imports (remove unused)

**AC8: Testing**
- [ ] Run full test suite - all pass
- [ ] Integration tests for collaboration still pass
- [ ] No test failures related to removal

---

## Technical Implementation Notes

### Files to Modify

#### 1. invitationService.js

**Remove:**
- Email invitation type ('email') handling in `sendInvitation()`
- Email invitation token generation
- Any functions specific to email invitations

**Before:**
```javascript
// Create email invitation for unregistered user
const invitationRef = doc(collection(db, INVITATIONS_COLLECTION));
const invitationId = invitationRef.id;

await setDoc(invitationRef, {
  inviterId: currentUser.uid,
  inviterEmail: currentUser.email,
  inviterName: currentUserData?.displayName || currentUser.email.split('@')[0],
  inviteeEmail: normalizedEmail,
  databaseId: sharedDbId,
  type: 'email', // REMOVE THIS TYPE
  status: 'pending',
  invitationToken: invitationId,
  createdAt: serverTimestamp(),
  expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
});
```

**After:**
```javascript
// Only handle registered users now (code-based)
const existingUser = await findUserByEmail(normalizedEmail);

if (!existingUser) {
  return {
    success: false,
    error: 'User not found. Only registered users can collaborate.',
  };
}

// Create code-based invitation (registered users only)
await setDoc(invitationRef, {
  // ... registered user invitation fields
  type: 'code-based',
  // ... rest
});
```

#### 2. InviteUserModal.js (or equivalent UI component)

**Remove:**
- "Invite by Email" button/option
- Email invitation form fields
- Email invitation success messages referencing "email sent"

**Replace with:**
- "Search by Email" button → Navigates to EmailSearchScreen
- "Enter Collab Code" button → Navigates to CollabCodeEntryScreen

#### 3. Pending Invitations Display

**Update:**
- Remove handling of `type: 'email'` invitations in display logic
- Only show `type: 'code-based'` invitations
- Update invitation card styling if needed

#### 4. Tests

**Remove:**
- Email invitation test cases
- Email invitation mock data
- Any tests for email-specific logic

**Keep:**
- Code-based invitation tests
- Registered user collaboration tests

---

## Integration Verification

### IV1: Collaboration Flow Works End-to-End
**Verification Steps:**
1. Search for user by email → Send request
2. Enter collab code → Send request
3. Approve request → Join shared database
4. Verify no errors throughout flow

**Expected Result:** Full collaboration flow works

### IV2: No Console Errors/Warnings
**Verification Steps:**
1. Build app: `npm run build` or `expo build`
2. Check console for errors
3. Run linter: `npm run lint`
4. Verify no warnings about removed code

**Expected Result:** Clean build, no errors

### IV3: App Builds Successfully
**Verification Steps:**
1. Run `npm install` (verify dependencies)
2. Run `expo start` (start app)
3. Navigate to collaboration screens
4. Verify all features work

**Expected Result:** App runs without issues

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC8) are met
- [ ] Email invitation UI removed
- [ ] Email invitation logic removed from `invitationService.js`
- [ ] In-app text updated (no references to email invitations)
- [ ] Tests updated (email invitation tests removed)
- [ ] Full test suite passes
- [ ] App builds without errors
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Code review: No dead code, clean codebase
- [ ] Tested on iOS and Android

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Remove email invitation UI from InviteUserModal.js
- [ ] Task 2: Remove email invitation logic from invitationService.js
- [ ] Task 3: Update pending invitations display to remove email type handling
- [ ] Task 4: Update in-app text (remove email invitation references)
- [ ] Task 5: Remove email invitation routes from navigation
- [ ] Task 6: Remove email invitation test cases
- [ ] Task 7: Remove email invitation mock data
- [ ] Task 8: Clean up unused imports
- [ ] Task 9: Run linter and fix issues
- [ ] Task 10: Run full test suite
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
- None (cleanup task)

**Blocked By:**
- Story 1.3 (Email Search) - Need replacement feature working
- Story 1.4 (Collab Code Entry) - Need replacement feature working
- Story 1.5 (Invitation Approval) - Need updated approval flow

---

## Additional Notes

### What NOT to Remove
- `findUserByEmail()` function (still used for email search)
- `sendInvitation()` function (refactored, not removed)
- Invitation acceptance/rejection logic (still needed)
- Pending invitations display (updated, not removed)

### What to Remove
- Email invitation type ('email') handling
- Email invitation tokens
- UI for inviting unregistered users
- References to "invite unregistered users"

### PM Notes
- This is a cleanup story to simplify the codebase
- Reduces maintenance burden
- Removes confusion about email vs code-based invitations
- Keep this story separate from feature stories for clarity
- Consider adding deprecation warnings before removal if in production
