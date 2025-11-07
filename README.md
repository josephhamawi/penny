# Spensely 💎

A premium mobile expense tracking app with AI-powered insights, built with React Native (Expo) and Firebase.

## Quick Overview

Track your income and expenses with premium features:
- 📱 Cross-platform (iOS & Android)
- 🔐 Secure authentication
- ☁️ Cloud sync via Firebase
- 📊 Real-time balance calculation
- 💎 Premium subscription with RevenueCat
- 🤖 AI-powered savings goals (GPT-3.5)
- 📈 AI personality reports (GPT-4)
- 📥 CSV export functionality
- 🎯 Beautiful, intuitive interface

## Tech Stack

- **Frontend:** React Native (Expo SDK 51)
- **Navigation:** React Navigation 6
- **Authentication:** Firebase Auth (email/password)
- **Database:** Cloud Firestore
- **UI Components:** React Native Paper

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Update `src/config/firebase.js` with your config

3. **Run the app:**
   ```bash
   npm start
   ```

4. **Test on your device:**
   - Scan QR code with Expo Go app

## Features

### 7-Column Expense View
| Ref# | Date | Description | Category | In | Out | Balance |
|------|------|-------------|----------|----|----|---------|
| ABC123 | Nov 5 | Grocery | Food | - | 45.50 | 954.50 |
| DEF456 | Nov 4 | Salary | Income | 1000.00 | - | 1000.00 |

### Categories
- Food
- Transport
- Rent
- Utilities
- Shopping
- Entertainment
- Healthcare
- Other

### Core Functionality
- ✅ Add income/expenses with description and category
- ✅ Auto-calculated running balance
- ✅ Real-time updates across devices
- ✅ Export all data to CSV
- ✅ Secure user authentication
- ✅ Data isolated per user

## Project Structure

```
src/
├── config/          # Firebase configuration
├── contexts/        # React contexts (Auth)
├── screens/         # App screens
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── ExpenseListScreen.js
│   └── AddExpenseScreen.js
├── services/        # Business logic (Firestore operations)
└── utils/           # Utility functions (CSV export)
```

## Detailed Setup

For complete setup instructions including:
- Firebase project configuration
- Firestore security rules
- Building for iOS/Android
- Deployment options

**See [SETUP_GUIDE.md](./SETUP_GUIDE.md)**

## Firebase Configuration

Update `src/config/firebase.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web browser
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build -p android

# Build for iOS (requires Apple Developer account)
eas build -p ios
```

## Firestore Security Rules

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

## Screenshots

### Login Screen
Simple email/password authentication

### Expense List
Scrollable table view with all expense details

### Add Expense
Clean form with validation

## Future Enhancements

- [ ] Date picker component
- [ ] Edit/delete expenses
- [ ] Date range filtering
- [ ] Charts and analytics
- [ ] Multiple currency support
- [ ] Recurring expenses
- [ ] Budget tracking
- [ ] Receipt photo attachments
- [ ] Biometric authentication
- [ ] Dark mode

## Requirements

- Node.js 16+
- Expo CLI
- Firebase account (free tier works)
- Expo Go app (for testing)

## License

Open source - free for personal and commercial use

## Support

For issues or questions, refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)

---

**Spensely** - Smart expense tracking with AI-powered insights 💎

Built with ❤️ using React Native & Firebase
