# Testing Guide - Collab Code Features

## Xcode Is Open - Ready to Test!

### Quick Start - Running in Xcode

1. **Xcode should already be open** with `Penny.xcworkspace`
2. **Select the simulator:**
   - Click the device dropdown in the top toolbar (next to "Penny" scheme)
   - Select "iPhone 17 Pro" (already booted) or any available iPhone simulator
3. **Build and Run:**
   - Click the Play button (▶️) in the top left
   - OR press `Cmd + R`
   - Wait for build to complete (~2-3 minutes first time)
4. **App will launch** on the simulator automatically

### Troubleshooting Xcode Build

If you see signing errors in Xcode:
1. Select the "Penny" project in the left sidebar
2. Select the "Penny" target
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your development team from the dropdown
6. Try building again

If you see "iOS 26.1 not installed" errors:
- This happens when trying to build for a physical device
- Make sure you've selected a **simulator** (not "Joseph's iPhone") from the device dropdown

---

## What to Test

### Feature 1: New User Collab Code Generation

**Steps:**
1. If not logged in, create a new account:
   - Email: `test+$(date +%s)@example.com` (generates unique email)
   - Password: `test1234`
   - Display Name: `Test User`

2. After signup, navigate to **Settings** (gear icon in tab bar)

3. **Expected Results:**
   - ✅ See "My Collab Code" section after your profile
   - ✅ Code format: `PENNY-####` (4 digits, e.g., `PENNY-4729`)
   - ✅ Large, readable code with key icon
   - ✅ Two buttons: "Copy Code" and "Share Code"

**Console Logs to Verify:**
- Look for: `"Generated collab code for new user [userId]: PENNY-####"`

---

### Feature 2: Copy to Clipboard

**Steps:**
1. In Settings, find your collab code
2. Tap the **"Copy Code"** button

**Expected Results:**
- ✅ Toast notification appears at bottom: "Code copied!"
- ✅ Secondary message: "Your collab code has been copied to clipboard"
- ✅ Code is actually in clipboard (test by pasting in Notes app)

---

### Feature 3: Share Code

**Steps:**
1. In Settings, tap the **"Share Code"** button

**Expected Results:**
- ✅ Native iOS share sheet appears
- ✅ Share message: "Collaborate with me on Penny! My code: PENNY-####"
- ✅ Options include: Messages, Mail, Notes, etc.
- ✅ You can cancel or actually send to test

---

### Feature 4: Existing User Migration

**Important:** This tests backward compatibility!

**Setup (Using Firebase Console):**
1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore Database
3. Navigate to `users` collection
4. Find a user document
5. **Delete the `collabCode` field** from that user (to simulate old user)

**Steps:**
1. Logout from the app (if logged in)
2. Login with the user whose `collabCode` you deleted
3. Watch the console logs

**Expected Results:**
- ✅ Console log: `"Generated collab code for existing user [userId]: PENNY-####"`
- ✅ Navigate to Settings → See collab code
- ✅ Check Firebase → User now has `collabCode` field

---

### Feature 5: Loading & Error States

**Loading State Test:**
1. Slow down network in simulator:
   - Settings → Developer → Network Link Conditioner → Very Bad Network
2. Navigate to Settings while logged in

**Expected Results:**
- ✅ See loading spinner in collab code card
- ✅ No crash or error
- ✅ Eventually loads code

**Error State Test:**
1. Turn off WiFi/network completely
2. Force quit and relaunch app
3. Login and navigate to Settings

**Expected Results:**
- ✅ See error icon (exclamation circle)
- ✅ Message: "Unable to load code"
- ✅ "Retry" button appears
- ✅ Turn network back on, tap Retry
- ✅ Code loads successfully

---

### Feature 6: UI/Visual Design

**Check these visual elements:**
- ✅ Glass-morphism background (semi-transparent)
- ✅ Purple accent colors on buttons
- ✅ Code display has border and background
- ✅ Monospace/courier font for code (readable)
- ✅ Key icon next to code
- ✅ Buttons have icons (copy icon, share icon)
- ✅ Proper spacing and padding
- ✅ Responsive to screen rotation

---

## Backend Testing (Migration Script)

### Test Migration Script (Dry Run)

**From Terminal:**
```bash
cd /Users/mac/Development/Expenses
node scripts/migrate-collab-codes.js --dry-run
```

**Expected Output:**
```
============================================================
Starting Collab Code Migration
Mode: DRY RUN (no changes)
============================================================
Total users: X
Users without collab codes: Y

DRY RUN: Would generate codes for these users:
  - user1@example.com (user-id-1)
  - user2@example.com (user-id-2)
  ...

Script completed successfully
```

### Run Live Migration (Only if needed)

**⚠️ Warning:** This modifies production data!

```bash
node scripts/migrate-collab-codes.js
```

**Expected Output:**
```
============================================================
Starting Collab Code Migration
Mode: LIVE RUN
============================================================
Total users: X
Users without collab codes: Y
Progress: 10/50 users processed
Progress: 20/50 users processed
...
============================================================
Migration Complete
Success: 50
Failures: 0
============================================================
```

---

## Code Verification

### Check Firestore Data

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore Database
3. Navigate to `users` collection
4. Select any user document

**Expected Fields:**
- `collabCode`: "PENNY-####" (string)
- `collabCodeGeneratedAt`: (timestamp) - may not exist for old users
- `email`: (string)
- `displayName`: (string)
- `createdAt`: (timestamp)
- `updatedAt`: (timestamp)

### Check for Duplicates

Run this Firestore query to verify uniqueness:
```javascript
// In Firebase Console > Firestore > Run a query
// This should return 0 results (meaning no duplicates)
users
  .groupBy('collabCode')
  .having('COUNT(*) > 1')
```

Or manually scan through users and verify all codes are unique.

---

## Performance Testing

### Code Generation Speed
- New user signup should complete in < 3 seconds
- Settings screen should load code in < 1 second
- Migration script should process 100 users in < 2 minutes

### Collision Detection
With only 10,000 possible codes (0000-9999):
- First 100 users: ~0.5% collision chance (handled by retry)
- First 1000 users: ~5% collision chance
- Monitor console for collision warnings during testing

---

## Success Criteria

**All these should work:**
- ✅ New users get codes automatically
- ✅ Existing users get codes on login
- ✅ Users can view their codes
- ✅ Users can copy codes
- ✅ Users can share codes
- ✅ Loading states work
- ✅ Error states work with retry
- ✅ UI matches app design
- ✅ No crashes or errors
- ✅ Firestore data is correct

---

## Known Issues / Limitations

1. **Code Space:** Only 10,000 possible codes
   - Fine for < 1,000 users
   - Consider expanding to 6 digits for larger scale

2. **Node Version:** Project requires Node 20+
   - Current: Node 18.12
   - May cause `expo start` issues
   - Use `expo run:ios` instead for now

3. **Xcode Warnings:** Non-critical
   - "Update to recommended settings" - can ignore
   - "Requires development team" - select team in Signing tab
   - Hermes script warnings - can ignore

---

## Next Steps After Testing

Once all manual tests pass:

1. **Deploy Firestore Rules** (already correct, but verify):
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Run Migration Script** (if you have existing users):
   ```bash
   node scripts/migrate-collab-codes.js --dry-run  # Test first
   node scripts/migrate-collab-codes.js            # Then run live
   ```

3. **Continue with remaining UI stories:**
   - Story 1.3 (Full): Email Search Screen
   - Story 1.4: Collab Code Entry Screen
   - Story 1.5: Accept/Reject Invitations
   - Story 1.6: Data Merge Choice
   - Story 1.7: Multi-User Groups
   - Story 1.8: Remove Old Code
   - Story 1.11: Expire Old Invitations
   - Story 1.12: Group Management

---

## Questions or Issues?

If you encounter any problems:
1. Check the console logs for error messages
2. Verify Firebase connection (check Firestore console)
3. Check that the simulator has internet access
4. Try cleaning the build: Product → Clean Build Folder (Cmd+Shift+K)
5. Restart the simulator and try again

**Happy Testing! 🎉**
