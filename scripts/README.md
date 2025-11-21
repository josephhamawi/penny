# Demo Account Setup Scripts

## Prerequisites

1. **Download Firebase Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `expenses-64949`
   - Click the gear icon ⚙️ → **Project Settings**
   - Go to **Service Accounts** tab
   - Click **Generate new private key**
   - Save the file as `serviceAccountKey.json` in the project root

2. **Install Firebase Admin SDK:**
   ```bash
   npm install --save-dev firebase-admin
   ```

## Running the Demo Account Script

### Create Demo Account with Sample Data

```bash
cd /Users/mac/Development/Expenses
node scripts/createDemoAccount.js
```

This script will:
- ✅ Create `demo@pennyapp.com` account (or update if exists)
- ✅ Add 27 sample expenses (current + previous month)
- ✅ Add 3 savings plans (Emergency Fund, Vacation, Car)
- ✅ Add 2 goals (Reduce Dining, Save More)
- ✅ Grant Premium access (lifetime)

### Demo Account Credentials

```
Email: demo@pennyapp.com
Password: DemoPass2024!
```

### Sample Data Included

**Expenses (27 total):**
- Current month: 20 expenses across categories
  - Food, Transportation, Entertainment, Health, Bills, etc.
  - Income: $4,000 total ($3,500 salary + $500 freelance)
  - Expenses: ~$1,000 total
- Previous month: 7 expenses
  - Includes rent, insurance, larger purchases

**Savings Plans (3 total):**
1. **Emergency Fund** - 15% of income → Target: $10,000
2. **Summer Vacation** - 10% of income → Target: $5,000
3. **New Car Fund** - 5% of income → Target: $8,000

**Goals (2 total):**
1. **Reduce Dining Out** - Limit to $200/month
2. **Save More Monthly** - Target $600/month savings

**Premium Access:**
- ✅ Granted until 2026-12-31
- ✅ Access to AI Personality Reports
- ✅ Access to all premium features

## Troubleshooting

### Error: "Cannot find module 'firebase-admin'"

```bash
npm install --save-dev firebase-admin
```

### Error: "Cannot find module '../serviceAccountKey.json'"

1. Download the service account key from Firebase Console
2. Save it as `serviceAccountKey.json` in the project root
3. **IMPORTANT:** This file contains secrets - never commit to Git!

### Error: "Permission denied"

Make sure the service account has the following roles:
- Firebase Admin SDK Administrator Service Agent
- Cloud Datastore User

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `serviceAccountKey.json` to Git!**
   - It's already in `.gitignore`
   - Contains admin credentials for your Firebase project

2. **Service account key should only be used locally**
   - For production operations, use Firebase Functions or EAS Build

3. **Demo account password is public**
   - Only use for App Store review purposes
   - Regularly monitor for abuse
   - Can disable/delete account after approval

## Next Steps

After running this script:

1. ✅ Test login in the app with demo credentials
2. ✅ Verify all sample data appears correctly
3. ✅ Test Premium features (AI Reports)
4. ✅ Include credentials in App Store submission notes

---

**For App Store Submission:**

Include these credentials in the "App Review Information" section:

```
DEMO ACCOUNT:
Email: demo@pennyapp.com
Password: DemoPass2024!

This account has sample expenses and savings plans pre-populated for testing.
Premium access is already enabled.
```
