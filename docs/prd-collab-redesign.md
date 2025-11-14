# Penny - Code-Based Collaboration System Redesign
## Brownfield Enhancement PRD v2.0

---

## Document Information
**Version:** 2.0
**Date:** 2025-11-13
**Author:** John (Product Manager)
**Status:** Draft for Review
**Enhancement Type:** Major Feature Modification + New Feature Addition

---

## Change Log
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD creation | 2025-11-13 | v2.0 | Code-based collaboration system redesign | John (PM) |

---

## 1. Intro Project Analysis and Context

### 1.1 Analysis Source
**IDE-based analysis** - Project files available, existing PRD found at `docs/prd.md`

### 1.2 Current Project State

**Penny** is a React Native/Expo expense tracking mobile application with:
- **Primary Purpose:** Personal expense tracking with AI-powered insights and multi-user collaboration
- **Current Architecture:** Firebase backend (Authentication + Firestore), React Native frontend, OpenAI integration
- **Existing Premium Features:** AI Personality Reports, AI Saving Goals Engine, subscription system ($10/month, $199 lifetime)
- **Current Collaboration System:** Email-based invitation system supporting both registered and unregistered users

### 1.3 Available Documentation

✅ **Complete Documentation Available:**
- Existing PRD (Premium AI Features & Multi-User Support)
- Architecture documentation (agent completion reports)
- API Documentation (subscription-api-documentation.md)
- UI/UX Guidelines (premium-ui-architecture.md)
- Feature-specific docs (Goals, Personality Reports, Subscriptions)
- Technical implementation guides

### 1.4 Enhancement Scope Definition

**Enhancement Type:**
- ✅ Major Feature Modification (redesigning collaboration system)
- ✅ New Feature Addition (persistent collab codes, data merge choice)

**Enhancement Description:**

Remove email invitation system for unregistered users and replace with internal code-based collaboration. Only registered users can collaborate. Each user receives a persistent personal collab code. Users can search by email in-app or share codes externally. Upon approval, users choose whether to merge existing expenses or start fresh. Multi-user groups supported with equal permissions.

**Impact Assessment:**
- ✅ **Significant Impact** - Requires substantial changes to `invitationService.js`, removal of email logic, new code generation system, new data merge UI, updated Firestore rules

### 1.5 Goals and Background Context

**Goals:**
- Simplify collaboration by removing email dependency for unregistered users
- Improve security with registered-users-only model
- Provide persistent, memorable collab codes for easy sharing
- Give users control over data with merge-or-start-fresh choice
- Support multi-user groups with equal access permissions
- Maintain all existing premium features and data isolation

**Background Context:**

The current email-based invitation system creates complexity: temporary tokens, email delivery dependencies, and security concerns with unverified invitees. Moving to registered-users-only with persistent codes simplifies the system while improving security.

Persistent codes (like Discord usernames or Venmo handles) make sharing intuitive via SMS, messaging apps, or in-person without email infrastructure dependency. User choice on data merge respects existing data while enabling seamless collaboration.

This enhancement aligns with premium positioning: collaboration becomes a polished, professional feature reinforcing subscription value.

---

## 2. Requirements

### 2.1 Functional Requirements

**Persistent Collab Code System**
- **FR1:** Every user receives a unique, persistent collaboration code upon account creation or first login after this feature launches
- **FR2:** Collab codes must follow format: `PENNY-####` (e.g., `PENNY-4729`) where #### is a 4-digit number
- **FR3:** Collab codes must be visible in Settings/Profile screen with "Share Code" and "Copy Code" actions
- **FR4:** System must handle code collisions by regenerating until unique code is found
- **FR5:** Collab codes cannot be changed by users (persistent for account lifetime)

**In-App Collaboration Discovery**
- **FR6:** Remove all email invitation functionality for unregistered users from codebase
- **FR7:** Collaboration screen must provide two methods: "Search by Email" and "Enter Collab Code"
- **FR8:** Email search must query only registered users in Firestore `users` collection
- **FR9:** Email search must show user's display name and email in results
- **FR10:** "Enter Collab Code" must validate code format and check if code exists before sending request

**Collaboration Request & Approval Flow**
- **FR11:** When User B searches User A by email → "Send Collaboration Request" button creates pending invitation
- **FR12:** When User B enters User A's collab code → "Request to Collaborate" button creates pending invitation
- **FR13:** User A receives in-app notification of pending collaboration request with requester's name/email
- **FR14:** User A can "Approve" or "Reject" request from notifications or collaboration management screen
- **FR15:** Upon rejection, requester receives notification that request was declined
- **FR16:** System must prevent duplicate pending requests (same inviter/invitee pair)

**Data Merge Decision Flow**
- **FR17:** Upon invitation approval, User B (invitee) must see "Data Merge Decision" modal before joining
- **FR18:** Modal must display: "You have [X] existing expenses. What would you like to do?"
- **FR19:** Modal must offer three options:
  - "Merge my expenses into shared database" (all historical data becomes visible to group)
  - "Start fresh" (existing expenses archived, new shared database starts empty)
  - "Cancel" (don't join yet)
- **FR20:** If user chooses "Merge," their personal expenses must be migrated to shared database with original timestamps
- **FR21:** If user chooses "Start fresh," their personal expenses remain in archived personal database (read-only)
- **FR22:** After merge or fresh start, all future expenses go to shared database

**Multi-User Group Management**
- **FR23:** Shared databases must support unlimited members (not limited to 1:1)
- **FR24:** All members have equal read/write permissions (create, edit, delete expenses)
- **FR25:** Database owner (creator) can remove any member from shared database
- **FR26:** Any member can leave shared database at any time
- **FR27:** When member leaves, their access is revoked immediately but shared data remains
- **FR28:** If database owner leaves, ownership must transfer to next earliest member or database becomes orphaned (members can still access)

**UI/UX Updates**
- **FR29:** Settings screen must display user's personal collab code prominently
- **FR30:** Collaboration screen must replace "Invite by Email" with "Search by Email (Registered Users)"
- **FR31:** Remove all UI references to "email invitations" and "invite unregistered users"
- **FR32:** Add "My Collab Code" section with share/copy functionality
- **FR33:** Display current collaboration status: "Solo" or "Collaborating with [X] members"
- **FR34:** Show list of current database members with owner indicator

### 2.2 Non-Functional Requirements

**Performance**
- **NFR1:** Collab code generation must complete within 1 second (including uniqueness check)
- **NFR2:** Email search must return results within 2 seconds for typical user base
- **NFR3:** Data merge operation must complete within 10 seconds for users with up to 1000 expenses
- **NFR4:** Real-time collaboration notifications must appear within 3 seconds of action

**Security & Data Integrity**
- **NFR5:** Only authenticated, registered users can participate in collaboration
- **NFR6:** Collab codes must be cryptographically unique (no predictable patterns)
- **NFR7:** Data merge operation must be atomic (all-or-nothing) to prevent partial migrations
- **NFR8:** Archived personal databases must remain accessible to original owner only
- **NFR9:** Firestore security rules must enforce member-only access to shared databases

**Compatibility & Migration**
- **NFR10:** Existing users with email invitations in "pending" state must have invitations automatically expired with notification
- **NFR11:** Existing shared databases must continue to function without interruption
- **NFR12:** Migration script must generate collab codes for all existing users
- **NFR13:** System must maintain backward compatibility with existing `sharedDatabases` collection structure

### 2.3 Compatibility Requirements

- **CR1: API Compatibility** - Existing `invitationService.js` functions must be refactored (not removed) to maintain any dependent code references; new functions added for code-based flow
- **CR2: Database Schema Compatibility** - `sharedDatabases` collection structure must remain unchanged; add `collabCode` field to `users` collection without breaking existing user documents
- **CR3: UI/UX Consistency** - New collaboration screens must follow existing app design system (colors, typography, spacing from `src/theme`)
- **CR4: Integration Compatibility** - Firebase Authentication, Firestore queries, and subscription checks must continue functioning without modification

---

## 3. User Interface Enhancement Goals

### 3.1 Integration with Existing UI

New collaboration UI must integrate with existing design patterns:
- **Design System:** Use existing `src/theme` color palette, spacing, and typography
- **Component Library:** Leverage existing modal components (`InviteUserModal.js` pattern)
- **Navigation:** Collaboration accessible from Settings screen (existing pattern)
- **Notifications:** Use existing Toast notification system for collaboration alerts

### 3.2 Modified/New Screens and Views

**Modified Screens:**
1. **Settings Screen** - Add "My Collab Code" section displaying `PENNY-####` with share/copy buttons
2. **Collaboration Management Screen** - Replace "Invite by Email" with "Search by Email" and "Enter Collab Code"
3. **Pending Invitations Screen** - Update to show requester's collab code and remove email-specific language

**New Screens:**
1. **Data Merge Decision Modal** - Full-screen modal with three options (merge/fresh/cancel) and expense count display
2. **Collab Code Entry Screen** - Simple input screen with `PENNY-####` format validation
3. **Email Search Screen** - Search bar with registered user results (name + email + "Request Collaboration" button)

### 3.3 UI Consistency Requirements

- **Visual Consistency:** All new modals must use glass-morphism design from existing `InviteUserModal.js`
- **Interaction Consistency:** All CTAs must follow existing button styles (primary purple, secondary glass)
- **Feedback Consistency:** Use Toast notifications for success/error states (existing pattern)
- **Typography Consistency:** Match existing font weights and sizes from `src/theme`

---

## 4. Technical Constraints and Integration Requirements

### 4.1 Existing Technology Stack

**Languages:** JavaScript (React Native/Expo)
**Frameworks:** React Native, Expo SDK, React Navigation
**Database:** Firebase Firestore (NoSQL document database)
**Authentication:** Firebase Authentication
**External APIs:** OpenAI API (AI features), RevenueCat (subscriptions)
**Infrastructure:** Firebase Hosting (web), Expo EAS Build (mobile builds)
**State Management:** React Context API, AsyncStorage

### 4.2 Integration Approach

**Database Integration Strategy:**
- Add `collabCode` field to `users` collection documents
- Add `personalDatabaseArchived` boolean to track if user merged data
- Maintain existing `sharedDatabases`, `invitations`, and `expenses` collections
- Create migration function to generate collab codes for existing users
- Update Firestore security rules to allow collab code queries

**API Integration Strategy:**
- Refactor `invitationService.js` to remove email invitation functions
- Add new functions: `generateCollabCode()`, `findUserByCollabCode()`, `mergeUserExpenses()`
- Update `getUserDatabaseId()` to handle archived personal databases
- Maintain existing `sendInvitation()` signature but change internal logic

**Frontend Integration Strategy:**
- Create new components: `CollabCodeDisplay`, `DataMergeModal`, `CollabCodeEntry`, `EmailSearchScreen`
- Modify existing components: `InviteUserModal` → `CollaborationModal`, `SettingsScreen` (add collab code section)
- Remove components: Email invitation UI elements
- Update navigation to include new screens

**Testing Integration Strategy:**
- Unit tests for collab code generation uniqueness
- Integration tests for data merge operation atomicity
- E2E tests for full collaboration flow (search → request → approve → merge)
- Security rule tests for collab code queries

### 4.3 Code Organization and Standards

**File Structure Approach:**
- New service: `src/services/collabCodeService.js` (code generation, validation)
- Modified service: `src/services/invitationService.js` (remove email logic, add code logic)
- New service: `src/services/dataMergeService.js` (handle expense migration)
- New components: `src/components/CollabCodeDisplay.js`, `src/components/DataMergeModal.js`
- New screens: `src/screens/CollabCodeEntryScreen.js`, `src/screens/EmailSearchScreen.js`

**Naming Conventions:**
- Functions: camelCase (e.g., `generateCollabCode`, `mergeUserExpenses`)
- Components: PascalCase (e.g., `CollabCodeDisplay`, `DataMergeModal`)
- Constants: UPPER_SNAKE_CASE (e.g., `COLLAB_CODE_PREFIX = 'PENNY-'`)

**Coding Standards:**
- Follow existing ESLint configuration
- Use async/await for Firestore operations (existing pattern)
- Include error handling with try/catch blocks
- Add JSDoc comments for all exported functions

**Documentation Standards:**
- Update `docs/prd.md` with this PRD content
- Create `docs/collab-code-migration-guide.md` for deployment
- Add inline code comments for complex logic (especially data merge)
- Update README if collaboration flow changes user-facing behavior

### 4.4 Deployment and Operations

**Build Process Integration:**
- No changes to existing Expo build configuration
- No new environment variables required (uses existing Firebase config)
- Ensure Firestore security rules deployed before app update

**Deployment Strategy:**
1. **Phase 1 (Backend):** Deploy updated Firestore security rules with collab code query support
2. **Phase 2 (Migration):** Run migration script to generate collab codes for existing users
3. **Phase 3 (App Update):** Deploy updated app with new collaboration UI
4. **Phase 4 (Cleanup):** Expire all pending email invitations after 7 days grace period

**Monitoring and Logging:**
- Log collab code collisions (should be rare, but monitor for issues)
- Log data merge operation duration and success/failure rates
- Track collaboration request acceptance rate (product metric)
- Monitor Firestore read/write costs (collab code queries add load)

**Configuration Management:**
- Collab code format configurable via constant (`COLLAB_CODE_PREFIX`, `COLLAB_CODE_LENGTH`)
- Data merge timeout configurable (default 10 seconds)
- Max collaboration group size configurable (currently unlimited)

### 4.5 Risk Assessment and Mitigation

**Technical Risks:**
- **Risk:** Collab code collisions (two users get same code)
  - **Mitigation:** Use cryptographic random number generation, check uniqueness before assignment, monitor collision rate
- **Risk:** Data merge operation fails mid-migration (partial data loss)
  - **Mitigation:** Use Firestore batch writes (atomic), implement rollback mechanism, backup personal database before merge
- **Risk:** Archived personal databases consume extra storage
  - **Mitigation:** Implement data retention policy (e.g., archive for 90 days then delete), allow users to manually delete archive

**Integration Risks:**
- **Risk:** Existing shared databases break due to schema changes
  - **Mitigation:** Maintain backward compatibility, test with existing databases, gradual rollout
- **Risk:** Firestore security rules too permissive (allow unauthorized collab code queries)
  - **Mitigation:** Write comprehensive security rule tests, peer review rules before deployment

**Deployment Risks:**
- **Risk:** Migration script fails for subset of users (some don't get collab codes)
  - **Mitigation:** Generate collab codes on-demand at first login if missing, log migration failures for manual fix
- **Risk:** Users with pending email invitations confused after feature removal
  - **Mitigation:** Send in-app notification explaining change, provide 7-day grace period, auto-expire with friendly message

**Mitigation Strategies:**
- Implement feature flag for gradual rollout (A/B test with 10% users first)
- Create rollback plan (keep email invitation code commented out for 1 release cycle)
- Set up monitoring alerts for collab code generation failures
- Provide customer support documentation for confused users

---

## 5. Epic and Story Structure

### 5.1 Epic Approach

**Epic Structure Decision:** Single comprehensive epic

**Rationale:** This enhancement, while significant, represents a cohesive redesign of one feature system (collaboration). All stories are interdependent and must be deployed together to maintain system consistency. Splitting into multiple epics would create artificial boundaries and complicate coordination.

The stories are sequenced to minimize risk: backend changes first (collab codes, data merge), then UI updates, then cleanup. Each story includes verification that existing functionality remains intact.

---

## 6. Epic 1: Code-Based Collaboration System Redesign

**Epic Goal:** Replace email-based invitation system with secure, code-based collaboration for registered users, giving users control over data merge decisions and supporting multi-user groups with equal permissions.

**Integration Requirements:**
- Must not break existing shared databases or user authentication
- Must maintain existing subscription checks and premium feature access
- Must follow existing UI/UX design patterns
- Must deploy backend changes before frontend changes to ensure data integrity

---

### Story 1.1: Generate Persistent Collab Codes for Users

**As a registered user,
I want a unique, persistent collaboration code assigned to my account,
so that I can easily share my code with others to collaborate.**

#### Acceptance Criteria
1. Upon user signup or first login after feature launch, a unique collab code in format `PENNY-####` is generated and stored in Firestore `users/{userId}` document
2. Collab code generation checks for uniqueness across all users before assignment
3. If collision occurs (rare), system regenerates until unique code is found
4. Collab codes are immutable (cannot be changed by user)
5. Collab code is retrievable via `getUserCollabCode(userId)` function

#### Integration Verification
- **IV1:** Existing user profile creation (`initializeUserProfile` in `invitationService.js`) continues to work without errors
- **IV2:** Existing authentication flow (Firebase Auth) remains unchanged
- **IV3:** Existing user queries (e.g., `findUserByEmail`) continue to function without performance degradation

---

### Story 1.2: Display Collab Code in Settings Screen

**As a user,
I want to see my collab code in the Settings screen,
so that I can share it with people I want to collaborate with.**

#### Acceptance Criteria
1. Settings screen displays "My Collab Code" section with user's code (e.g., `PENNY-4729`)
2. "Copy Code" button copies code to clipboard with success toast
3. "Share Code" button opens native share dialog with text: "Collaborate with me on Penny! My code: PENNY-####"
4. Visual design matches existing Settings screen style (glass-morphism, purple accents)
5. Code is displayed prominently, easy to read (large font, high contrast)

#### Integration Verification
- **IV1:** Existing Settings screen sections (Profile, Subscription, Clear Data) remain functional and visually consistent
- **IV2:** Existing theme colors and spacing apply correctly to new section
- **IV3:** Settings screen scrolls smoothly with new section added

---

### Story 1.3: Implement Email Search for Registered Users

**As a user,
I want to search for other registered users by email within the app,
so that I can send them collaboration requests.**

#### Acceptance Criteria
1. Collaboration screen includes "Search by Email" option
2. Email search queries only registered users in Firestore `users` collection
3. Search results display user's display name, email, and "Request Collaboration" button
4. Search handles no results gracefully ("No users found with that email")
5. Search handles own email gracefully ("You cannot collaborate with yourself")
6. Tapping "Request Collaboration" creates pending invitation and shows success toast

#### Integration Verification
- **IV1:** Existing Firestore `users` collection queries (e.g., `findUserByEmail`) remain functional
- **IV2:** Existing collaboration management screen structure is preserved
- **IV3:** No performance impact on other Firestore queries

---

### Story 1.4: Implement Collab Code Entry Flow

**As a user,
I want to enter someone's collab code to request collaboration,
so that I can join their shared database.**

#### Acceptance Criteria
1. Collaboration screen includes "Enter Collab Code" option
2. Code entry screen validates format (`PENNY-####`) before submission
3. System checks if code exists in Firestore before creating invitation
4. Invalid codes show error: "Invalid code format. Use PENNY-#### format."
5. Non-existent codes show error: "Code not found. Check the code and try again."
6. Valid codes create pending invitation and show success toast

#### Integration Verification
- **IV1:** Existing invitation creation logic (`sendInvitation` in `invitationService.js`) is preserved for approved flow
- **IV2:** Firestore security rules allow authenticated users to query `users` collection by `collabCode` field
- **IV3:** No impact on existing pending invitations display

---

### Story 1.5: Refactor Invitation Approval Flow for Code-Based System

**As a user receiving a collaboration request,
I want to approve or reject requests from registered users,
so that I can control who accesses my shared database.**

#### Acceptance Criteria
1. Pending requests show requester's name, email, and collab code
2. "Approve" button triggers data merge decision modal for invitee
3. "Reject" button declines request and notifies requester
4. Duplicate requests are prevented (same inviter/invitee pair)
5. Existing pending invitations display continues to work for non-code invitations during transition period

#### Integration Verification
- **IV1:** Existing `acceptInvitation` and `rejectInvitation` functions continue to work
- **IV2:** Existing `subscribeToPendingInvitations` real-time listener remains functional
- **IV3:** Firestore security rules for `invitations` collection remain valid

---

### Story 1.6: Implement Data Merge Decision Modal

**As a user accepting a collaboration invitation,
I want to choose whether to merge my existing expenses or start fresh,
so that I have control over my data.**

#### Acceptance Criteria
1. Upon invitation approval, invitee sees modal: "You have [X] existing expenses. What would you like to do?"
2. Modal offers three buttons: "Merge my expenses," "Start fresh," "Cancel"
3. "Merge" triggers expense migration to shared database with loading indicator
4. "Start fresh" archives personal database and joins shared database empty
5. "Cancel" closes modal without joining (invitation remains pending)
6. Modal is dismissible only via button actions (not tap-outside)

#### Integration Verification
- **IV1:** Existing modal components (`InviteUserModal.js` pattern) visual style is matched
- **IV2:** Existing expense queries continue to work during and after merge
- **IV3:** No data loss occurs if app crashes during merge (atomic operation)

---

### Story 1.7: Build Data Merge Service for Expense Migration

**As a developer,
I want an atomic data merge service,
so that user expenses are safely migrated to shared databases without data loss.**

#### Acceptance Criteria
1. `mergeUserExpenses(userId, sharedDatabaseId)` function created in new `dataMergeService.js`
2. Function uses Firestore batch writes (atomic) to migrate expenses
3. Original personal expenses are copied (not moved) to shared database
4. Personal database is marked as archived (`personalDatabaseArchived: true` in user doc)
5. Merge operation completes within 10 seconds for up to 1000 expenses
6. Rollback mechanism exists if merge fails mid-operation

#### Integration Verification
- **IV1:** Existing `expenseService.js` functions (add, edit, delete) continue to work on both personal and shared databases
- **IV2:** Existing expense queries filter by correct database ID after merge
- **IV3:** No duplicate expenses appear in shared database

---

### Story 1.8: Remove Email Invitation UI and Code

**As a product owner,
I want email invitation functionality removed from the app,
so that the codebase is simplified and only registered users can collaborate.**

#### Acceptance Criteria
1. Remove all UI elements referencing "Invite by email" or "Send email invitation"
2. Remove email invitation creation logic from `invitationService.js`
3. Remove `type: 'email'` invitation handling code
4. Update in-app documentation/tooltips to reference collab codes instead of email
5. Codebase has no remaining references to unregistered user invitations

#### Integration Verification
- **IV1:** Existing registered user collaboration (now code-based) continues to work
- **IV2:** No console errors or warnings related to removed code
- **IV3:** App builds successfully with no missing function references

---

### Story 1.9: Update Firestore Security Rules for Collab Code Queries

**As a security engineer,
I want Firestore security rules to allow authenticated users to query by collab code,
so that the code-based collaboration system functions securely.**

#### Acceptance Criteria
1. `users` collection rules allow authenticated users to query by `collabCode` field
2. `users` collection rules prevent unauthenticated queries
3. `sharedDatabases` collection rules allow members and owner to read
4. Security rules are tested with Firebase Emulator before deployment
5. Rules prevent unauthorized access to archived personal databases

#### Integration Verification
- **IV1:** Existing user profile queries (`findUserByEmail`) continue to work
- **IV2:** Existing shared database queries (`getUserDatabaseId`) remain functional
- **IV3:** Existing expense queries maintain data isolation per user/database

---

### Story 1.10: Create Migration Script for Existing Users

**As an operations engineer,
I want a migration script to generate collab codes for existing users,
so that all users have codes when the feature launches.**

#### Acceptance Criteria
1. Migration script queries all users in Firestore without `collabCode` field
2. Script generates unique `PENNY-####` codes for each user
3. Script updates user documents with new collab codes
4. Script logs progress and any failures
5. Script is idempotent (safe to run multiple times)
6. On-demand generation fallback exists for users missed by script

#### Integration Verification
- **IV1:** Existing user data (email, displayName, profile) is not modified during migration
- **IV2:** Existing authentication sessions remain valid during and after migration
- **IV3:** Migration completes without impacting app performance

---

### Story 1.11: Expire and Notify Users of Old Email Invitations

**As a user with pending email invitations,
I want to be notified that email invitations are no longer supported,
so that I understand why my invitations were expired.**

#### Acceptance Criteria
1. All pending email invitations (`type: 'email'`) are marked as expired
2. Users with expired email invitations receive in-app notification: "Email invitations are no longer supported. Use collab codes to collaborate with registered users."
3. Notification includes link to Settings to view collab code
4. Grace period of 7 days before expiration (users can still accept during this time)
5. After 7 days, email invitations are auto-expired

#### Integration Verification
- **IV1:** Existing accepted/rejected invitations remain in historical state
- **IV2:** Existing code-based invitations (new system) are not affected
- **IV3:** Notification system (Toast) continues to function for other app alerts

---

### Story 1.12: Add Multi-User Group Management UI

**As a database owner,
I want to see all members in my shared database and remove members if needed,
so that I can manage who has access to my expenses.**

#### Acceptance Criteria
1. Collaboration screen displays "Current Members" list with display names
2. Owner is indicated with badge/icon next to name
3. Owner can tap any member and select "Remove Member" (with confirmation)
4. Any member can tap "Leave Shared Database" (with confirmation)
5. Member count is displayed (e.g., "Collaborating with 3 members")
6. Real-time updates when members join or leave

#### Integration Verification
- **IV1:** Existing `getDatabaseMembers` function in `invitationService.js` continues to work
- **IV2:** Existing `removeMember` and `leaveSharedDatabase` functions remain functional
- **IV3:** Removing members revokes their access immediately (verified via Firestore rules)

---

## 7. Success Metrics

**Adoption Metrics:**
- 70%+ of existing users have collab codes generated within 7 days of launch
- 30%+ of users view their collab code in Settings within first month
- 15%+ of users send at least one collaboration request within first month

**Engagement Metrics:**
- 60%+ collaboration request acceptance rate (indicates good UX and intentional sharing)
- Average time to accept invitation < 24 hours (fast response indicates active users)
- 5%+ of active users are in multi-user groups (3+ members)

**Technical Metrics:**
- Collab code collision rate < 0.01% (cryptographic randomness working)
- Data merge operation success rate > 99.5% (atomic operations effective)
- Zero data loss incidents during merge operations
- Firestore query costs remain within 10% of pre-feature baseline

**User Satisfaction:**
- Net Promoter Score (NPS) for collaboration feature > 40
- < 5% support requests related to collaboration confusion
- User feedback sentiment positive (manual review of app reviews)

---

## 8. Open Questions for Development Team

1. **Collab Code Format:** Should we use 4-digit numeric (`PENNY-4729`) or alphanumeric (`PENNY-A7X9`) for better uniqueness? Recommendation: Start with 4-digit numeric (10,000 combinations, sufficient for early scale).

2. **Archived Database Retention:** How long should archived personal databases be kept? Recommendation: 90 days with user option to manually delete immediately.

3. **Migration Timing:** Should migration script run as Cloud Function (automatic) or manual script? Recommendation: Manual script for controlled rollout, fallback to on-demand generation.

4. **Group Size Limit:** Should we limit collaboration group size (e.g., max 10 members)? Recommendation: Start unlimited, add limit if Firestore costs become issue.

5. **Code Regeneration:** Should users ever be able to regenerate their collab code (e.g., for security)? Recommendation: No for v1, consider for future if users request it.

6. **Owner Transfer:** When owner leaves, should ownership auto-transfer or should database become read-only? Recommendation: Auto-transfer to next earliest member for better UX.

---

## 9. Deployment Checklist

**Pre-Deployment:**
- [ ] Review and test updated Firestore security rules in emulator
- [ ] Code review for all changes in `invitationService.js` and new services
- [ ] Run migration script on test Firebase project
- [ ] Test data merge operation with large datasets (1000+ expenses)
- [ ] Verify collab code uniqueness with stress test (generate 1000+ codes)

**Deployment Phase 1 (Backend):**
- [ ] Deploy updated Firestore security rules to production
- [ ] Verify security rules are active (test with API call)
- [ ] Monitor Firebase logs for rule violations (should be none)

**Deployment Phase 2 (Migration):**
- [ ] Run migration script for existing users
- [ ] Verify all users have collab codes (spot check sample)
- [ ] Monitor script logs for errors

**Deployment Phase 3 (App Update):**
- [ ] Submit app update to App Store / Play Store
- [ ] Release to 10% of users (gradual rollout)
- [ ] Monitor crash analytics for new errors
- [ ] Monitor Firestore costs for unexpected spikes
- [ ] Expand to 100% after 48 hours if no issues

**Deployment Phase 4 (Cleanup):**
- [ ] After 7 days, expire all pending email invitations
- [ ] Send in-app notifications to affected users
- [ ] Remove email invitation code from codebase (commented out for 1 release)
- [ ] Update user-facing documentation/help articles

**Post-Deployment:**
- [ ] Monitor success metrics for 30 days
- [ ] Collect user feedback via in-app prompts
- [ ] Address any support tickets related to collaboration
- [ ] Document lessons learned for future brownfield enhancements

---

## Document Complete

This PRD is ready for review by the development team. All sections have been completed with comprehensive detail for brownfield enhancement execution.

**Next Steps:**
1. Review PRD with development team
2. Clarify open questions
3. Create GitHub issues/stories from this PRD
4. Begin Story 1.1 implementation
