# How to Download Firebase Service Account Key

## Step-by-Step Guide

### 1. Open Firebase Console
Go to: https://console.firebase.google.com/

### 2. Select Your Project
- Click on **expenses-64949**

### 3. Go to Project Settings
- Click the **⚙️ gear icon** in the top left (next to "Project Overview")
- Select **Project settings**

### 4. Navigate to Service Accounts Tab
- In the Project settings page, click on the **Service accounts** tab at the top

### 5. Generate Private Key
- You'll see a section titled "Firebase Admin SDK"
- Click the button: **Generate new private key**
- A confirmation dialog will appear

### 6. Confirm Download
- Click **Generate key** in the confirmation dialog
- A JSON file will download automatically (named something like `expenses-64949-firebase-adminsdk-xxxxx.json`)

### 7. Save the File
- **Rename** the downloaded file to: `serviceAccountKey.json`
- **Move** it to your project root: `/Users/mac/Development/Expenses/`
- Make sure it's in the same directory as `package.json`

### 8. Verify File Location

Run this command to verify:
```bash
ls -la /Users/mac/Development/Expenses/serviceAccountKey.json
```

You should see the file listed.

## Security Warning ⚠️

**CRITICAL:** This file contains admin credentials for your entire Firebase project!

- ✅ **DO:** Keep it local only
- ✅ **DO:** It's already in `.gitignore` - never commit it
- ✅ **DO:** Delete it after running the demo account script
- ❌ **DON'T:** Share it with anyone
- ❌ **DON'T:** Upload it anywhere
- ❌ **DON'T:** Commit it to Git

## What This File Contains

```json
{
  "type": "service_account",
  "project_id": "expenses-64949",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@expenses-64949.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

## After Download

Once you have the file in place, run:

```bash
cd /Users/mac/Development/Expenses
node scripts/createDemoAccount.js
```

This will create the demo account with all sample data!

## Troubleshooting

### "Cannot find module '../serviceAccountKey.json'"
- Make sure the file is named exactly: `serviceAccountKey.json` (case-sensitive)
- Make sure it's in the project root, not in the `scripts/` folder

### "Error: Permission denied"
- The service account should have admin permissions automatically
- If not, go back to Firebase Console → IAM & Admin → Add roles

### File downloaded with different name
- Just rename it to `serviceAccountKey.json`
- On Mac: `mv ~/Downloads/expenses-64949-*.json /Users/mac/Development/Expenses/serviceAccountKey.json`

## Clean Up After Use

Once the demo account is created, you can safely delete this file:

```bash
rm /Users/mac/Development/Expenses/serviceAccountKey.json
```

It's only needed once to create the demo account.
