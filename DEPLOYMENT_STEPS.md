# Final Deployment Steps

## Step 1: Deploy Firebase Security Rules (MANUAL - 2 minutes)

The Firestore security rules are ready but need manual deployment:

```bash
# Authenticate with Firebase (opens browser)
firebase login

# Deploy security rules to production
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

**Files ready for deployment:**
- `/firestore.rules` ✅
- `/firestore.indexes.json` ✅
- `/firebase.json` ✅

---

## Step 2: RevenueCat Configuration (MANUAL - 10 minutes)

1. Create RevenueCat account: https://app.revenuecat.com
2. Follow setup guide: `/docs/subscription-setup-guide.md`
3. Create two products in App Store Connect:
   - `expense_monitor_monthly` - $10/month with 14-day trial
   - `expense_monitor_lifetime` - $199 one-time
4. Get your API key from RevenueCat dashboard
5. Add to `.env` file (see Step 3)

---

## Step 3: Environment Variables (AUTOMATED - Done Below)

Create `.env` file with:
```
REVENUECAT_IOS_API_KEY=your_revenuecat_key_here
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
```

---

## Step 4: Activate RevenueCat in App.js (AUTOMATED - Done Below)

Uncomment the initialization code in App.js

---

## Step 5: Integrate AI Services (AUTOMATED - Done Below)

Copy service files and update screens to use real data

---

## Step 6: Test Everything

Run through the test checklist in `/docs/FINAL_TESTING_CHECKLIST.md`

---

## Status

- ✅ Security rules written
- ✅ RevenueCat service code ready
- ✅ OpenAI integration ready
- ⏳ Need API keys from you
- ⏳ Need Firebase CLI authentication

**Estimated time to complete:** 15-20 minutes once you have API keys
