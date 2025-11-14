# Story: Display App Version in Settings

## Metadata
- **Story ID:** SETTINGS-VER-1
- **Epic:** Settings Enhancement
- **Status:** Ready for Development
- **Priority:** P2 (Medium)
- **Estimated Effort:** 2 hours
- **Assigned To:** Dev Team
- **Related Files:**
  - `/Users/mac/Development/Expenses/src/screens/SettingsScreen.js`
  - `/Users/mac/Development/Expenses/package.json`
  - `/Users/mac/Development/Expenses/app.json`

---

## User Story

**As a** Penny app user,
**I want** to see the app version displayed at the bottom of the Settings screen,
**So that** I know which version I'm using when seeking support or reporting issues.

---

## Context

The Settings screen currently displays user profile information, collab code, and various configuration options including:
- Monthly Budget
- Google Sheets Sync
- Invitations & Sharing
- Clear All Data
- Log out

There is no version information visible to users, which makes it difficult for them to:
- Report issues with specific version context
- Confirm they're running the latest version
- Provide accurate information to support
- Debug version-specific problems

Adding version information improves transparency and helps with troubleshooting.

---

## Acceptance Criteria

### Display Requirements

1. **Version Display**
   - [ ] Version info displays at the bottom of the Settings screen
   - [ ] Appears after the Log out menu item with appropriate spacing
   - [ ] Format: "Version 1.0.0 (Build 1)" or "Version 1.0.0 (1)"
   - [ ] Text is centered horizontally
   - [ ] Uses small, subtle gray text (not prominent)

2. **Visual Design**
   - [ ] Font size: 12px
   - [ ] Color: `colors.text.tertiary` or similar muted gray
   - [ ] Bottom padding: 40-60px from screen bottom
   - [ ] Top padding: 30-40px from Log out item
   - [ ] Should not distract from main settings options

3. **Data Source**
   - [ ] Version number reads from `package.json` version field
   - [ ] Build number reads from:
     - iOS: `app.json` → `expo.ios.buildNumber`
     - Android: `app.json` → `expo.android.versionCode`
   - [ ] Falls back gracefully if build number unavailable

4. **Interactive Behavior**
   - [ ] Version text is tappable/pressable
   - [ ] Single tap shows additional debug information in an alert/modal
   - [ ] Debug info includes:
     - Full version string
     - Build date/timestamp (if available)
     - Environment (development/production)
     - Platform (iOS/Android/Web)
     - Bundle identifier
   - [ ] No visual feedback needed (no highlight/underline in normal state)

5. **Cross-Platform**
   - [ ] Works correctly on iOS
   - [ ] Works correctly on Android
   - [ ] Works correctly on Web (if applicable)
   - [ ] Handles different screen sizes appropriately

---

## Technical Implementation Notes

### Version Reading

**Option 1: Using expo-constants (Recommended)**
```javascript
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version || '1.0.0';
const buildNumber = Platform.select({
  ios: Constants.expoConfig?.ios?.buildNumber,
  android: Constants.expoConfig?.android?.versionCode,
  default: '1'
});
```

**Option 2: Direct JSON Import**
```javascript
import { version } from '../../package.json';
import { expo } from '../../app.json';

const appVersion = version;
const buildNumber = Platform.select({
  ios: expo.ios?.buildNumber,
  android: expo.android?.versionCode,
  default: '1'
});
```

### Component Structure

Add at the end of SettingsScreen ScrollView, before the final spacer:

```jsx
{/* App Version */}
<TouchableOpacity
  style={styles.versionContainer}
  onPress={handleShowDebugInfo}
  activeOpacity={0.6}
>
  <Text style={styles.versionText}>
    Version {appVersion} (Build {buildNumber})
  </Text>
</TouchableOpacity>

<View style={{ height: 40 }} />
```

### Debug Info Handler

```javascript
const handleShowDebugInfo = () => {
  const debugInfo = `
App Version: ${appVersion}
Build Number: ${buildNumber}
Platform: ${Platform.OS} ${Platform.Version}
Environment: ${__DEV__ ? 'Development' : 'Production'}
Bundle ID: ${Constants.expoConfig?.ios?.bundleIdentifier || Constants.expoConfig?.android?.package || 'N/A'}
  `.trim();

  Alert.alert(
    'Debug Information',
    debugInfo,
    [
      {
        text: 'Copy',
        onPress: () => {
          Clipboard.setString(debugInfo);
          Toast.show({
            type: 'success',
            text1: 'Copied',
            text2: 'Debug info copied to clipboard',
            position: 'bottom',
          });
        }
      },
      { text: 'Close', style: 'cancel' }
    ]
  );
};
```

### Styling

```javascript
versionContainer: {
  paddingVertical: 30,
  alignItems: 'center',
  justifyContent: 'center',
},
versionText: {
  fontSize: 12,
  color: colors.text.tertiary,
  textAlign: 'center',
  opacity: 0.7,
},
```

### Current Version Values

Based on project files:
- **Version:** 1.0.0 (from package.json)
- **iOS Build Number:** 1.0.0 (from app.json)
- **Android Version Code:** 1 (from app.json)

---

## Dependencies

### Required Packages
- `expo-constants` (likely already installed)
- `react-native` Platform API (already available)
- `react-native` Clipboard API (already imported in SettingsScreen.js)
- `react-native-toast-message` (already imported)

### Installation
If expo-constants is not installed:
```bash
npx expo install expo-constants
```

---

## Testing Requirements

### Unit Tests
- [ ] Version string formats correctly
- [ ] Build number displays correctly for each platform
- [ ] Falls back gracefully when build number unavailable

### Integration Tests
- [ ] Version displays at bottom of Settings screen
- [ ] Tap handler triggers debug info display
- [ ] Copy functionality works in debug info modal

### Manual Testing Checklist

**Visual Tests:**
- [ ] Version text appears at bottom of Settings screen
- [ ] Text is properly aligned (centered)
- [ ] Text color is subtle and not distracting
- [ ] Spacing from Log out item is appropriate
- [ ] Bottom padding provides comfortable margin

**Interaction Tests:**
- [ ] Tapping version text shows debug modal
- [ ] Debug modal displays correct information
- [ ] Copy button in debug modal works
- [ ] Toast notification appears after copy
- [ ] Close button dismisses modal

**Platform-Specific Tests:**
- [ ] iOS: Shows correct build number from buildNumber
- [ ] Android: Shows correct build number from versionCode
- [ ] Web: Shows appropriate version info
- [ ] Small screens: Version remains visible without scrolling issues
- [ ] Large screens (tablets): Version positioning looks good

**Edge Cases:**
- [ ] Missing build number: Shows "Version 1.0.0 (Build N/A)"
- [ ] Long version numbers: Text doesn't overflow
- [ ] Rapid tapping: No duplicate modals

---

## Design Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  [Settings Items...]                │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  [Icon]  Log out            │  │
│  └─────────────────────────────┘  │
│                                     │
│                                     │
│         Version 1.0.0 (Build 1)    │  ← Subtle gray text
│                  ↑                  │
│              Tappable               │
│                                     │
└─────────────────────────────────────┘
```

**Debug Modal (on tap):**
```
┌─────────────────────────────────────┐
│  Debug Information              [X] │
│                                     │
│  App Version: 1.0.0                │
│  Build Number: 1                   │
│  Platform: iOS 16.0                │
│  Environment: Production           │
│  Bundle ID: com.yourname.penny...  │
│                                     │
│  [Copy]              [Close]       │
└─────────────────────────────────────┘
```

---

## Accessibility

- [ ] Version text should have `accessibilityRole="text"`
- [ ] Version container should have `accessibilityHint="Double tap to view debug information"`
- [ ] Version text should be readable by screen readers
- [ ] Debug modal should support screen reader navigation

---

## Security Considerations

- [ ] Debug information should not expose sensitive data
- [ ] Build environment info is safe to display (dev/production)
- [ ] Bundle identifier is public information
- [ ] No API keys or secrets in debug output

---

## Future Enhancements

1. **Update Checker**
   - Check for new versions on app store
   - Show "Update Available" badge when newer version exists
   - Link directly to app store for updates

2. **Build Date**
   - Display when app was built
   - Show "Built X days ago"
   - Useful for beta testing

3. **Changelog**
   - Tap version to see changelog/release notes
   - Show what's new in current version
   - Link to full changelog

4. **Easter Egg**
   - 5-tap version to show easter egg or developer credits
   - Fun animation or hidden feature
   - Team acknowledgments

---

## Related Stories

- **SETTINGS-VER-2:** Add update checker (P3)
- **SETTINGS-VER-3:** Display changelog on version tap (P3)
- **SUPPORT-1:** Create in-app support contact form (P2)

---

## Notes

- Keep version display subtle and unobtrusive
- Ensure version info is easily accessible for support queries
- Consider adding to About screen if one is created later
- Version format should match app store convention
- Test with various version number formats (1.0.0, 1.0, 1.0.0-beta, etc.)

---

## Completion Checklist

- [ ] Code implemented and tested locally
- [ ] All acceptance criteria met
- [ ] Manual testing completed on iOS
- [ ] Manual testing completed on Android
- [ ] Accessibility requirements verified
- [ ] Code reviewed by peer
- [ ] Merged to main branch
- [ ] Deployed to production
- [ ] Verified in production environment
- [ ] Documentation updated (if needed)
- [ ] Story marked as Done in project tracker
