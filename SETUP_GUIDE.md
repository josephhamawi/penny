# Expense Monitor - Complete Setup Guide

A mobile expense tracking app built with React Native (Expo), Firebase Authentication, and Cloud Firestore.

## Features

- ✅ Email/Password Authentication
- ✅ Real-time expense tracking
- ✅ 7-column expense view (Ref#, Date, Description, Category, In, Out, Balance)
- ✅ Auto-calculated running balance
- ✅ Category-based expense organization
- ✅ CSV export functionality
- ✅ Cross-platform (iOS & Android)
- ✅ Responsive mobile UI

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally:
  ```bash
  npm install -g expo-cli
  ```
- **Firebase Account** - [Create free account](https://firebase.google.com/)
- **Expo Go app** on your phone (for testing):
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Part 1: Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `expense-monitor` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In Firebase Console, select your project
2. Go to **Build** > **Authentication**
3. Click **"Get started"**
4. Click on **"Email/Password"** under Sign-in method
5. Enable **"Email/Password"** (toggle ON)
6. Click **"Save"**

### Step 3: Create Firestore Database

1. Go to **Build** > **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll secure it later)
4. Choose a Firestore location (select closest to your users)
5. Click **"Enable"**

### Step 4: Configure Firestore Security Rules

1. In Firestore Database, click on **"Rules"** tab
2. Replace the rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own expenses
    match /expenses/{expense} {
      allow read, write: if request.auth != null &&
                         request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
                    request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Get Firebase Configuration

1. Go to **Project settings** (gear icon) > **General**
2. Scroll down to **"Your apps"**
3. Click the **Web icon** (`</>`)
4. Register app with nickname: `expense-monitor-web`
5. **Do NOT check** "Firebase Hosting" (optional)
6. Click **"Register app"**
7. Copy the `firebaseConfig` object

It will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## Part 2: Local Development Setup

### Step 1: Install Dependencies

Navigate to your project directory and install dependencies:

```bash
cd /Users/mac/Development/Expenses
npm install
```

### Step 2: Configure Firebase in Your App

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // Replace with your apiKey
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // Replace
  projectId: "YOUR_PROJECT_ID",        // Replace
  storageBucket: "YOUR_PROJECT_ID.appspot.com",   // Replace
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // Replace
  appId: "YOUR_APP_ID"                 // Replace
};
```

3. Save the file

### Step 3: Create Required Asset Files

Expo requires some asset files. Create placeholder files:

```bash
mkdir -p assets
```

For now, you can use default Expo assets or create simple placeholder images. The app will work without custom assets.

### Step 4: Run the App Locally

Start the Expo development server:

```bash
npm start
```

Or:

```bash
expo start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code in the terminal

### Step 5: Test on Your Phone

**Using Expo Go:**

1. Open **Expo Go** app on your phone
2. Scan the QR code from the terminal (iOS: use Camera, Android: use Expo Go)
3. The app will load on your device

**Using iOS Simulator (Mac only):**

```bash
npm run ios
```

**Using Android Emulator:**

```bash
npm run android
```

---

## Part 3: Using the App

### First Time Setup

1. **Register Account:**
   - Open the app
   - Tap "Don't have an account? Register"
   - Enter email and password (min 6 characters)
   - Tap "Register"

2. **Login:**
   - Enter your email and password
   - Tap "Login"

### Adding Expenses

1. Tap **"+ Add Expense"** button
2. Fill in the form:
   - **Date:** Format YYYY-MM-DD (e.g., 2025-11-05)
   - **Description:** What was the expense/income for?
   - **Category:** Select from dropdown
   - **In:** Enter income amount (leave blank if expense)
   - **Out:** Enter expense amount (leave blank if income)
3. Tap **"Add Expense"**

### Viewing Expenses

- Expenses are displayed in a scrollable table
- Shows: Ref#, Date, Description, Category, In, Out, Balance
- Real-time updates (no refresh needed)
- Pull down to manually refresh

### Exporting Data

1. Tap **"Export CSV"** button
2. Choose where to save/share the file
3. CSV includes all expense records

---

## Part 4: Building for Production

### Build for Android

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS:
   ```bash
   eas build:configure
   ```

4. Build APK (for testing):
   ```bash
   eas build -p android --profile preview
   ```

5. Build AAB (for Play Store):
   ```bash
   eas build -p android --profile production
   ```

### Build for iOS

1. You need an Apple Developer Account ($99/year)

2. Build for TestFlight:
   ```bash
   eas build -p ios --profile production
   ```

3. Submit to App Store:
   ```bash
   eas submit -p ios
   ```

### Alternative: Use Expo Go (No Build Required)

For personal use or testing, you can continue using Expo Go without building:
- Share your Expo project URL with users
- They can open it in Expo Go app
- No app store submission needed

---

## Part 5: Deployment Options

### Option 1: Expo Publish (Easiest)

Publish your app to Expo's servers:

```bash
expo publish
```

Users can access via Expo Go app using your project URL.

### Option 2: EAS Update (Recommended)

For over-the-air updates after building:

```bash
eas update
```

### Option 3: Firebase Hosting (Web Version)

To deploy as a web app:

1. Build for web:
   ```bash
   expo build:web
   ```

2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize hosting:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to: `web-build`
   - Configure as single-page app: Yes
   - Set up automatic builds: No

5. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

---

## Project Structure

```
Expenses/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── assets/                         # Images and assets
├── src/
│   ├── config/
│   │   └── firebase.js            # Firebase configuration
│   ├── contexts/
│   │   └── AuthContext.js         # Authentication context
│   ├── screens/
│   │   ├── LoginScreen.js         # Login screen
│   │   ├── RegisterScreen.js      # Registration screen
│   │   ├── ExpenseListScreen.js   # Main expense list
│   │   └── AddExpenseScreen.js    # Add expense form
│   ├── services/
│   │   └── expenseService.js      # Firestore operations
│   └── utils/
│       └── csvExport.js           # CSV export utility
└── SETUP_GUIDE.md                 # This file
```

---

## Troubleshooting

### Issue: Firebase configuration error

**Solution:** Double-check that you've replaced ALL placeholder values in `src/config/firebase.js` with your actual Firebase config values.

### Issue: "Permission denied" when adding expenses

**Solution:**
1. Check that you're logged in
2. Verify Firestore security rules are set correctly
3. Make sure the user is authenticated before trying to add expenses

### Issue: Expo Go won't connect

**Solution:**
1. Ensure your phone and computer are on the same WiFi network
2. Try restarting the Expo server: `npm start`
3. Try using tunnel mode: `npm start --tunnel`

### Issue: Build fails

**Solution:**
1. Clear cache: `expo start -c`
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Issue: CSV export not working

**Solution:**
- On iOS: Check that you've granted file access permissions
- On Android: Check storage permissions in app settings

---

## Security Best Practices

### Production Checklist:

1. **Update Firestore Rules:**
   - Move from test mode to production rules (already provided above)

2. **Secure Firebase Config:**
   - While the Firebase config can be public in mobile apps, consider:
   - Setting up App Check for additional security
   - Configuring authorized domains in Firebase Console

3. **Enable App Check (Optional but Recommended):**
   - Go to Firebase Console > Build > App Check
   - Register your app
   - Enforce App Check for Firestore

4. **Regular Updates:**
   - Keep dependencies updated: `npm update`
   - Monitor for security vulnerabilities: `npm audit`

---

## Cost Considerations

### Firebase Free Tier (Spark Plan):
- **Authentication:** 10,000 phone verifications/month (email is unlimited)
- **Firestore:**
  - 50,000 reads/day
  - 20,000 writes/day
  - 1 GB storage
- **Hosting:** 10 GB storage, 360 MB/day transfer

For personal use or small teams, the free tier is usually sufficient.

---

## Support & Resources

- **Expo Documentation:** https://docs.expo.dev/
- **Firebase Documentation:** https://firebase.google.com/docs
- **React Native Documentation:** https://reactnative.dev/
- **React Navigation:** https://reactnavigation.org/

---

## Next Steps & Enhancements

Consider adding these features:

1. **Date Picker:** Use a proper date picker component instead of text input
2. **Edit/Delete:** Add ability to edit or delete existing expenses
3. **Filtering:** Filter by date range, category, or amount
4. **Charts:** Add visualizations for spending patterns
5. **Multiple Currencies:** Support different currencies
6. **Recurring Expenses:** Auto-add recurring expenses
7. **Budget Tracking:** Set and track monthly budgets
8. **Receipt Photos:** Attach photos to expenses
9. **Biometric Auth:** Add fingerprint/face ID login
10. **Dark Mode:** Add dark theme support

---

## License

This project is open source and available for personal and commercial use.

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run on Expo Go
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Build for production
eas build -p android
eas build -p ios
```

---

Happy expense tracking! 📊💰
