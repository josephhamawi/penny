# Quick Start Guide - 5 Minutes Setup ⚡

Get your expense tracker running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
cd /Users/mac/Development/Expenses
npm install
```

## Step 2: Create Firebase Project (2 min)

1. Go to https://console.firebase.google.com/
2. Click "Add project" → Name it → Create
3. Enable **Authentication**:
   - Build → Authentication → Get Started
   - Enable "Email/Password"
4. Enable **Firestore**:
   - Build → Firestore Database → Create Database
   - Start in "test mode" → Enable

## Step 3: Get Firebase Config (1 min)

1. Project Settings (gear icon) → General
2. Scroll to "Your apps" → Click web icon `</>`
3. Register app → Copy the `firebaseConfig` object
4. Paste into `src/config/firebase.js` (replace the placeholder)

## Step 4: Run the App (1 min)

```bash
npm start
```

Scan QR code with Expo Go app on your phone!

---

## First Use

1. Tap "Register" → Create account
2. Login with your credentials
3. Tap "+ Add Expense" → Fill form → Save
4. View your expense with auto-calculated balance!

---

## That's it! 🎉

For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

## Common Commands

```bash
npm start          # Start development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator (Mac only)
```

## Need Help?

- Firebase not connecting? → Check `src/config/firebase.js` has correct values
- App won't start? → Run `npm install` again
- Can't add expenses? → Make sure you're logged in

## Firestore Security Rules (Copy-Paste)

In Firebase Console → Firestore → Rules → Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expense} {
      allow read, write: if request.auth != null &&
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                    request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Then click "Publish".

---

Happy tracking! 📊
