# 🚀 How to Run Penny App in Xcode

## The Problem
- Node.js version 18.12.1 is too old (needs 20+)
- Command-line builds are failing
- **Solution: Use Xcode GUI directly!**

## ✅ Simple Steps (5 minutes)

### 1. Open Xcode (Already Open!)
The workspace should already be open at:
```
/Users/mac/Development/Expenses/ios/Penny.xcworkspace
```

If not, double-click this file in Finder.

---

### 2. Select Simulator
In the **top toolbar** (next to the Play/Stop buttons):

1. Click the **device dropdown** (currently might say "Joseph's iPhone" or "Any iOS Device")
2. Hover over **"iOS Simulators"** in the menu
3. Select **"iPhone 17 Pro"** (it has a ● showing it's already running)

**Can't find simulators?**
- Go to **Xcode → Settings → Platforms**
- Make sure **iOS** platform is installed
- Download if needed, then try again

---

### 3. Fix Signing (If You See Red Errors)
If you see errors about "Requires a development team":

1. Click **"Penny"** in the left sidebar (blue project icon)
2. Select **"Penny" under TARGETS** (not PROJECT)
3. Go to **"Signing & Capabilities"** tab
4. Choose ONE of these options:

**Option A: Automatic Signing (Recommended)**
- ✅ Check "Automatically manage signing"
- Select your Apple ID from "Team" dropdown
- If you don't have a team, click "Add Account..." and sign in with Apple ID

**Option B: Manual Signing (No Apple ID needed)**
- ❌ Uncheck "Automatically manage signing"
- Under "Signing Certificate", select **"Sign to Run Locally"**

---

### 4. Build and Run!
1. Click the **▶️ Play button** in top left
2. Or press **`Cmd + R`**

**What happens:**
- Xcode will compile the app (~2-3 minutes first time)
- You'll see progress in the top bar
- iPhone 17 Pro simulator will show the app
- Done!

---

## ⚠️ Common Issues & Fixes

### Issue: "Build Failed" with Signing Errors
**Fix:** Follow Step 3 above to configure signing

### Issue: "No scheme" or "Unable to run"
**Fix:**
1. Click the "Penny" scheme dropdown (next to device dropdown)
2. Select **"Edit Scheme..."**
3. Make sure "Run" is selected
4. Click "Close"

### Issue: Simulator is black/frozen
**Fix:**
1. Go to **Simulator → Device → Erase All Content and Settings**
2. Try running again

### Issue: Build takes forever
**Fix:**
- First build takes 2-5 minutes (normal!)
- Subsequent builds are much faster (10-30 seconds)

### Issue: Still can't build
**Fix - Nuclear Option:**
1. In Xcode: **Product → Clean Build Folder** (or `Cmd + Shift + K`)
2. Close Xcode
3. In Terminal:
```bash
cd /Users/mac/Development/Expenses/ios
rm -rf Pods Podfile.lock build
pod install
```
4. Reopen Xcode workspace
5. Try building again

---

## 🎉 What to Test Once App Launches

### Test 1: View Your Collab Code
1. **Login** or **create a new account**
2. Tap the **⚙️ Settings** icon (bottom right tab)
3. Scroll down to **"My Collab Code"** section
4. **Verify:**
   - ✅ See code format: `PENNY-####` (4 digits)
   - ✅ Code is large and readable
   - ✅ Key icon appears next to code
   - ✅ Two buttons: "Copy Code" and "Share Code"

### Test 2: Copy to Clipboard
1. In Settings, tap **"Copy Code"** button
2. **Verify:**
   - ✅ Toast notification appears: "Code copied!"
   - ✅ Toast has secondary text about clipboard
3. **Test clipboard:**
   - Open **Notes app** on simulator
   - Long-press and select "Paste"
   - ✅ Your code `PENNY-####` appears

### Test 3: Share Code
1. In Settings, tap **"Share Code"** button
2. **Verify:**
   - ✅ iOS share sheet appears
   - ✅ Message shows: "Collaborate with me on Penny! My code: PENNY-####"
   - ✅ Options include: Messages, Mail, Notes, etc.
3. Tap "Cancel" or try sharing to Messages

### Test 4: New User Gets Code
1. **Logout** from Settings
2. **Create a new account:**
   - Use a new email (e.g., `test2@example.com`)
   - Password: `test1234`
   - Display name: `Test User 2`
3. After signup, go to **Settings**
4. **Verify:**
   - ✅ New collab code appears (different from first user)
   - ✅ Code is also `PENNY-####` format

### Test 5: Console Logs (Advanced)
1. In Xcode, show the **debug console** (bottom panel)
2. Look for logs:
   - `"Generated collab code for new user..."` (on signup)
   - `"Generated collab code for existing user..."` (on login for users without codes)

---

## 📊 Expected Results Summary

| Test | Expected Behavior | Status |
|------|------------------|--------|
| View Code | See PENNY-#### in Settings | ☐ |
| Copy Code | Toast appears + clipboard works | ☐ |
| Share Code | Share sheet opens with message | ☐ |
| New User | Gets unique code automatically | ☐ |
| Loading | Shows spinner while loading | ☐ |
| Error | Shows error + retry on network fail | ☐ |

Check each box as you test!

---

## 🐛 If Something Breaks

**Check console logs in Xcode:**
- Look for red error messages
- Look for "Error loading collab code"
- Check Firebase connection

**Common fixes:**
1. Make sure you're **logged in** to the app
2. Check **internet connection** on simulator
3. Verify **Firebase** is configured (should be already)
4. Try **force-quitting** the app and relaunching

---

## ✨ Success Indicators

You'll know it's working when:
- ✅ You see your collab code in Settings
- ✅ You can copy the code
- ✅ You can share the code
- ✅ New users get codes automatically
- ✅ No errors or crashes
- ✅ UI looks beautiful (glass-morphism, purple buttons)

---

**Good luck testing! The hard part (coding) is done. Now just click Play in Xcode! 🎮**
