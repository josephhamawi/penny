# Story 1.2: Display Collab Code in Settings Screen

## Metadata
- **Story ID:** COLLAB-1.2
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P0 (User-facing feature)
- **Estimated Effort:** 3 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user,
**I want** to see my collab code in the Settings screen,
**so that** I can share it with people I want to collaborate with.

---

## Story Context

### Existing System Integration
- **Integrates with:** `SettingsScreen.js`, `collabCodeService.js`
- **Technology:** React Native, Expo, Clipboard API, Share API
- **Follows pattern:** Existing Settings screen sections (Profile, Subscription, Clear Data)
- **Touch points:**
  - `src/screens/SettingsScreen.js` - Add new section
  - `src/services/collabCodeService.js` - Call `getUserCollabCode()`
  - `src/theme` - Use existing colors, spacing, typography

### Current System Behavior
Settings screen currently has sections for:
- Profile (display name, email)
- Subscription status
- Clear All Data button
- Logout button

### Enhancement Details
Add "My Collab Code" section displaying user's code with copy and share functionality. Must match existing glass-morphism design from Settings screen.

---

## Acceptance Criteria

### Functional Requirements

**AC1: Display Collab Code Section**
- [ ] Settings screen shows new section titled "My Collab Code"
- [ ] Section displays user's collab code (e.g., "PENNY-4729")
- [ ] Code is large, prominent, easy to read (minimum 24px font size)
- [ ] Code uses monospace or semi-bold font for clarity
- [ ] Section positioned after Profile section, before Subscription section

**AC2: Copy to Clipboard Functionality**
- [ ] "Copy Code" button beneath collab code
- [ ] Tapping button copies code to device clipboard
- [ ] Success toast appears: "Code copied to clipboard!"
- [ ] Toast uses existing Toast notification system
- [ ] Copy includes full code with prefix (e.g., "PENNY-4729")

**AC3: Share Functionality**
- [ ] "Share Code" button beneath Copy button (or alongside)
- [ ] Tapping opens native share dialog
- [ ] Share text: "Collaborate with me on Penny! My code: PENNY-####"
- [ ] Share dialog allows SMS, messaging apps, email, etc.
- [ ] Works on both iOS and Android

**AC4: Loading State**
- [ ] While fetching collab code, show loading skeleton or spinner
- [ ] Loading state matches existing Settings screen patterns
- [ ] Loading completes within 1 second

**AC5: Error Handling**
- [ ] If collab code fetch fails, show error message: "Unable to load code. Try again."
- [ ] Provide "Retry" button
- [ ] Error state does not crash app
- [ ] Error logged to console for debugging

### UI/UX Requirements

**AC6: Visual Design**
- [ ] Section uses glass-morphism background (like other Settings sections)
- [ ] Purple accent color for buttons (matches app theme)
- [ ] Proper spacing between elements (use `spacing.md` from theme)
- [ ] Border radius matches existing sections (`borderRadius.md`)
- [ ] High contrast for code text (ensure readability)

**AC7: Responsiveness**
- [ ] Section adapts to different screen sizes
- [ ] No horizontal scrolling required
- [ ] Buttons are touch-friendly (minimum 44x44 touch target)
- [ ] Works on both phone and tablet layouts

**AC8: Accessibility**
- [ ] Code text is readable (high contrast, large size)
- [ ] Buttons have descriptive labels
- [ ] Section has clear visual hierarchy

### Integration Requirements

**AC9: Existing Settings Sections Preserved**
- [ ] Profile section remains functional
- [ ] Subscription section remains functional
- [ ] Clear Data button remains functional
- [ ] Logout button remains functional
- [ ] No layout breaks or overlaps

**AC10: Performance**
- [ ] Settings screen loads within 1 second
- [ ] No lag when tapping Copy or Share buttons
- [ ] Smooth scrolling maintained

### Quality Requirements

**AC11: Testing**
- [ ] Unit tests for collab code display logic
- [ ] UI tests for Copy button
- [ ] UI tests for Share button
- [ ] Integration test for Settings screen rendering

---

## Technical Implementation Notes

### Modified File: src/screens/SettingsScreen.js

Add new section after Profile section:

```javascript
import { getUserCollabCode } from '../services/collabCodeService';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import Toast from 'react-native-toast-message';

// Inside SettingsScreen component:

const [collabCode, setCollabCode] = useState(null);
const [loadingCode, setLoadingCode] = useState(true);

// Load collab code on mount
useEffect(() => {
  const loadCollabCode = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const code = await getUserCollabCode(user.uid);
        setCollabCode(code);
      }
    } catch (error) {
      console.error('Error loading collab code:', error);
      Toast.show({
        type: 'error',
        text1: 'Error loading code',
        text2: 'Please try again',
      });
    } finally {
      setLoadingCode(false);
    }
  };

  loadCollabCode();
}, []);

// Copy to clipboard handler
const handleCopyCode = async () => {
  try {
    await Clipboard.setStringAsync(collabCode);
    Toast.show({
      type: 'success',
      text1: 'Code copied!',
      text2: 'Your collab code is ready to share',
      position: 'bottom',
    });
  } catch (error) {
    console.error('Error copying code:', error);
    Toast.show({
      type: 'error',
      text1: 'Copy failed',
      text2: 'Please try again',
    });
  }
};

// Share handler
const handleShareCode = async () => {
  try {
    await Share.share({
      message: `Collaborate with me on Penny! My code: ${collabCode}`,
      title: 'Penny Collaboration Code',
    });
  } catch (error) {
    console.error('Error sharing code:', error);
    // Share.share throws error if user cancels, don't show error toast
  }
};

// JSX for collab code section (add after Profile section):
<View style={styles.collabCodeSection}>
  <Text style={styles.sectionTitle}>My Collab Code</Text>

  {loadingCode ? (
    <ActivityIndicator size="small" color={colors.primary} />
  ) : collabCode ? (
    <>
      <View style={styles.codeContainer}>
        <Text style={styles.collabCode}>{collabCode}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyCode}
        >
          <Ionicons name="copy-outline" size={20} color={colors.text.primary} />
          <Text style={styles.buttonText}>Copy Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareCode}
        >
          <Ionicons name="share-outline" size={20} color={colors.text.primary} />
          <Text style={styles.buttonText}>Share Code</Text>
        </TouchableOpacity>
      </View>
    </>
  ) : (
    <Text style={styles.errorText}>Unable to load code</Text>
  )}
</View>
```

### Styles (add to SettingsScreen.js styles):

```javascript
collabCodeSection: {
  backgroundColor: colors.glass.background,
  borderRadius: borderRadius.md,
  borderWidth: 1,
  borderColor: colors.glass.borderLight,
  padding: spacing.lg,
  marginBottom: spacing.md,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.text.primary,
  marginBottom: spacing.md,
},
codeContainer: {
  backgroundColor: colors.surface,
  borderRadius: borderRadius.sm,
  padding: spacing.md,
  alignItems: 'center',
  marginBottom: spacing.md,
},
collabCode: {
  fontSize: 28,
  fontWeight: '700',
  color: colors.primary,
  letterSpacing: 2,
  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
},
buttonRow: {
  flexDirection: 'row',
  gap: spacing.sm,
},
copyButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.glass.background,
  borderWidth: 1,
  borderColor: colors.glass.borderLight,
  borderRadius: borderRadius.md,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  gap: spacing.xs,
},
shareButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primary,
  borderRadius: borderRadius.md,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  gap: spacing.xs,
},
buttonText: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.text.primary,
},
errorText: {
  fontSize: 14,
  color: colors.error,
  textAlign: 'center',
},
```

### Dependencies
- `expo-clipboard` (likely already installed)
- `react-native` Share API (built-in)
- Existing Toast notification system

---

## Integration Verification

### IV1: Existing Settings Sections Functional
**Verification Steps:**
1. Open Settings screen
2. Verify Profile section displays correctly
3. Verify Subscription section displays correctly
4. Tap Clear Data button - should work
5. Tap Logout button - should work
6. Scroll through entire Settings screen

**Expected Result:** All existing sections work without issues

### IV2: Theme Colors and Spacing Applied
**Verification Steps:**
1. Check collab code section background color matches other sections
2. Verify button colors match app theme (purple for primary actions)
3. Measure spacing between elements (should be consistent)
4. Check border radius matches other sections

**Expected Result:** Visual consistency with existing Settings design

### IV3: Settings Screen Scrolls Smoothly
**Verification Steps:**
1. Open Settings screen
2. Scroll up and down multiple times
3. Check for lag or stuttering
4. Verify collab code section scrolls smoothly

**Expected Result:** No performance degradation, smooth scrolling maintained

---

## Testing Strategy

### Unit Tests

```javascript
describe('SettingsScreen - Collab Code Section', () => {
  it('should load and display collab code on mount');
  it('should show loading state while fetching code');
  it('should handle fetch error gracefully');

  describe('Copy Button', () => {
    it('should copy code to clipboard when tapped');
    it('should show success toast after copying');
    it('should handle copy failure with error toast');
  });

  describe('Share Button', () => {
    it('should open share dialog with correct message');
    it('should include collab code in share text');
    it('should handle share cancellation gracefully');
  });
});
```

### UI/Visual Tests

```javascript
describe('SettingsScreen - Visual Design', () => {
  it('should match existing Settings section style');
  it('should display code in large, readable font');
  it('should show buttons with proper spacing');
  it('should work on different screen sizes');
});
```

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC11) are met
- [ ] `SettingsScreen.js` updated with collab code section
- [ ] Copy to clipboard functionality works on iOS and Android
- [ ] Share functionality works on iOS and Android
- [ ] Unit tests written and passing
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Visual design matches existing Settings sections
- [ ] No console errors or warnings
- [ ] Settings screen loads within 1 second
- [ ] Tested on both iOS and Android

---

## Risk Assessment

### Primary Risk
**Risk:** Clipboard or Share API not available on device

**Likelihood:** Very Low (APIs are standard on modern devices)

**Mitigation:**
- Wrap Clipboard/Share calls in try-catch
- Show error toast if API fails
- Fallback: Display code prominently so user can manually copy

### Secondary Risk
**Risk:** Layout breaks on small screens

**Likelihood:** Low

**Mitigation:**
- Use flexbox for responsive layout
- Test on various screen sizes
- Ensure buttons stack properly on narrow screens

### Rollback Plan
If this feature causes issues:
1. Comment out collab code section JSX
2. Remove useEffect for loading code
3. Settings screen returns to previous state

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Update `SettingsScreen.js` to load collab code on mount
- [ ] Task 2: Add "My Collab Code" section JSX after Profile section
- [ ] Task 3: Implement Copy button handler with Toast notification
- [ ] Task 4: Implement Share button handler with native dialog
- [ ] Task 5: Add styles for collab code section
- [ ] Task 6: Write unit tests for copy/share functionality
- [ ] Task 7: Test on iOS and Android devices
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
- Story 1.3 (Email Search) - Users need to know their code before searching

**Blocked By:**
- Story 1.1 (Generate Collab Codes) - Must complete first

---

## Additional Notes

### Design Reference
Refer to existing `InviteUserModal.js` for glass-morphism styling patterns.

### User Flow
1. User opens Settings
2. Scrolls to "My Collab Code" section
3. Sees code displayed prominently
4. Taps "Copy Code" or "Share Code"
5. Shares code via SMS, messaging app, etc.
6. Recipient receives code and uses it in Story 1.4 flow

### PM Notes
- This is the first user-facing collab code feature
- UX should be delightful and simple
- Consider adding subtle animation when code loads (polish)
- Future enhancement: Add QR code option for in-person sharing
