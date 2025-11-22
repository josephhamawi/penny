# Apple App Store Legal Links

## Required URLs for App Store Submission

When submitting the Penny app to the Apple App Store, use these URLs:

### Privacy Policy
**URL:** `https://pennybudget.app/privacy-policy.html`

**Where to add:**
- App Store Connect → App Information → Privacy Policy URL
- In-app Settings screen (✓ Already implemented)

### Terms & Conditions
**URL:** `https://pennybudget.app/terms-and-conditions.html`

**Where to add:**
- App Store Connect → App Information → License Agreement (optional)
- In-app Settings screen (✓ Already implemented)

## In-App Implementation ✓

Both links are already accessible in the app:
1. Open the app
2. Navigate to Settings screen
3. Scroll down to find:
   - **Privacy Policy** button (with shield icon)
   - **Terms & Conditions** button (with contract icon)
4. Tapping either button opens the respective page in the device browser

## App Store Connect Submission Checklist

During App Store submission, you'll need to provide these URLs in several places:

### 1. App Information Section
- **Privacy Policy URL**: Required field
  - Enter: `https://pennybudget.app/privacy-policy.html`

### 2. App Privacy Details
- Answer questions about data collection
- Reference the Privacy Policy for detailed information
- Link: `https://pennybudget.app/privacy-policy.html`

### 3. App Review Information (Optional)
- You can add notes for reviewers mentioning:
  - "Privacy Policy and Terms & Conditions are accessible in Settings"
  - "Links open in external browser for full legal documents"

## Verification

To verify links work correctly:

```bash
# Test Privacy Policy
curl -I https://pennybudget.app/privacy-policy.html

# Test Terms & Conditions
curl -I https://pennybudget.app/terms-and-conditions.html
```

Both should return `200 OK` status.

## Implementation Details

**File:** `src/screens/SettingsScreen.js`

**Functions:**
- `handleOpenPrivacyPolicy()` - Lines 572-585
- `handleOpenTermsAndConditions()` - Lines 587-600

**UI Elements:**
- Privacy Policy button - Lines 1307-1319
- Terms & Conditions button - Lines 1321-1333

**Icons:**
- Privacy Policy: `shield-alt` (FontAwesome5)
- Terms & Conditions: `file-contract` (FontAwesome5)
- External link indicator: `external-link-alt`

## Notes

- Both links use React Native's `Linking` API
- Error handling included for cases where browser cannot open
- User-friendly error alerts if links fail
- Links positioned before "Delete Account" and "Logout" for easy access
- Consistent with app's dark theme and glass morphism design
