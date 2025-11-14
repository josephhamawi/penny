# Expense Monitor - Subscription Setup Guide

Complete guide for setting up RevenueCat and iOS in-app purchases for the Expense Monitor app.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: App Store Connect Setup](#step-1-app-store-connect-setup)
3. [Step 2: RevenueCat Account Setup](#step-2-revenuecat-account-setup)
4. [Step 3: Configure Products in RevenueCat](#step-3-configure-products-in-revenuecat)
5. [Step 4: Set Up Entitlements](#step-4-set-up-entitlements)
6. [Step 5: Obtain API Keys](#step-5-obtain-api-keys)
7. [Step 6: Create Sandbox Test Accounts](#step-6-create-sandbox-test-accounts)
8. [Step 7: Testing in Sandbox Environment](#step-7-testing-in-sandbox-environment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Active Apple Developer Account ($99/year)
- App registered in App Store Connect
- Bundle ID configured: `com.yourdomain.expensemonitor`
- Mac with Xcode installed
- Access to email for sandbox test accounts

---

## Step 1: App Store Connect Setup

### 1.1 Create In-App Purchase Products

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** → Select your app (Expense Monitor)
3. Go to **Features** tab → **In-App Purchases**
4. Click the **+** button to create a new in-app purchase

### 1.2 Configure Monthly Subscription

1. Select **Auto-Renewable Subscription**
2. Fill in the following details:

   **Reference Name:** `Expense Monitor Premium Monthly`

   **Product ID:** `expense_monitor_monthly` (IMPORTANT: Use this exact ID)

   **Subscription Group:** Create new group called "Premium Features"

   **Subscription Duration:** 1 Month

   **Price:** Select **Tier 5** ($4.99 USD)

3. Configure the **Free Trial**:
   - Click "Add Free Trial"
   - Duration: 14 days
   - Type: Introductory Offer
   - Countries: All territories

4. Add **Localized Information**:
   - **Display Name (English):** Premium Monthly
   - **Description:** Get unlimited AI expense analysis, advanced insights, and receipt scanning. Billed monthly after 14-day free trial.

5. Add **Review Information**:
   - Screenshot of subscription in app (you can add placeholder initially)
   - Review notes: "This is our monthly premium subscription with 14-day trial"

6. Click **Save**

### 1.3 Configure Lifetime Subscription

1. Click **+** to create another product
2. Select **Non-Consumable** (one-time purchase)
3. Fill in details:

   **Reference Name:** `Expense Monitor Premium Lifetime`

   **Product ID:** `expense_monitor_lifetime` (IMPORTANT: Use this exact ID)

   **Price:** Select **Tier 150** ($149.99 USD)

4. Add **Localized Information**:
   - **Display Name (English):** Premium Lifetime
   - **Description:** One-time payment for lifetime access to all premium features including AI analysis, insights, and receipt scanning. Never pay again!

5. Add **Review Information**:
   - Screenshot of subscription in app
   - Review notes: "This is our lifetime access product"

6. Click **Save**

### 1.4 Submit for Review

**Important:** In-app purchases must be submitted with your app for review. They will not be available until approved.

For testing purposes, they are immediately available in the **Sandbox environment**.

---

## Step 2: RevenueCat Account Setup

### 2.1 Create RevenueCat Account

1. Go to [RevenueCat](https://app.revenuecat.com)
2. Click **Sign Up**
3. Use your company email (recommended) or personal email
4. Verify your email address
5. Complete onboarding survey (optional)

### 2.2 Create New Project

1. On the dashboard, click **Create New Project**
2. Project Name: `Expense Monitor`
3. Select **iOS** as your platform
4. Click **Continue**

### 2.3 Add iOS App

1. Enter your **Bundle ID**: `com.yourdomain.expensemonitor`
2. App Name: `Expense Monitor`
3. Click **Save**

### 2.4 Connect to App Store Connect

1. In RevenueCat dashboard, go to **Project Settings** → **App Store Connect**
2. You'll need to provide:
   - **Issuer ID**
   - **Key ID**
   - **Private Key (.p8 file)**

**How to get these credentials:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Integrations** → **App Store Connect API**
3. Click **Generate API Key**
4. Fill in:
   - Key Name: `RevenueCat Integration`
   - Access: **Admin** (or Sales and Finance if Admin not available)
5. Click **Generate**
6. **Download the .p8 file immediately** (you can only download it once!)
7. Copy the **Key ID** and **Issuer ID**

**In RevenueCat:**

1. Paste the **Issuer ID**
2. Paste the **Key ID**
3. Upload the **.p8 file** you downloaded
4. Click **Submit**

**Verification:**

- RevenueCat will verify the connection
- You should see "Connected to App Store Connect" with a green checkmark
- If it fails, double-check your credentials and that the API key has correct permissions

---

## Step 3: Configure Products in RevenueCat

### 3.1 Create Products

1. In RevenueCat dashboard, go to **Products**
2. Click **+ New** to add a product

**Add Monthly Product:**
- Product Identifier: `expense_monitor_monthly` (must match App Store Connect)
- Product Type: Auto-renewable subscription
- Click **Save**

**Add Lifetime Product:**
- Product Identifier: `expense_monitor_lifetime` (must match App Store Connect)
- Product Type: Non-consumable
- Click **Save**

### 3.2 Create an Offering

Offerings are how you group products for display in your app.

1. Go to **Offerings** tab
2. Click **+ New Offering**
3. Offering Identifier: `default` (this is the standard identifier)
4. Description: "Default subscription offering"
5. Click **Save**

### 3.3 Add Packages to Offering

Packages define how products are presented to users.

1. Click on your `default` offering
2. Click **+ Add Package**

**Add Monthly Package:**
- Package Identifier: `$rc_monthly` (RevenueCat's standard monthly identifier)
- Product: Select `expense_monitor_monthly`
- Click **Save**

**Add Lifetime Package:**
- Package Identifier: `$rc_lifetime` (RevenueCat's standard lifetime identifier)
- Product: Select `expense_monitor_lifetime`
- Click **Save**

### 3.4 Set as Current Offering

1. Make sure `default` offering is marked as **Current**
2. This is the offering that will be returned when you call `Purchases.getOfferings()`

---

## Step 4: Set Up Entitlements

Entitlements are the access levels you grant to users. They allow you to check if a user has premium access regardless of which product they purchased.

### 4.1 Create Entitlement

1. Go to **Entitlements** tab in RevenueCat
2. Click **+ New Entitlement**
3. Identifier: `premium` (this is what you'll check in code)
4. Description: "Premium features access"
5. Click **Save**

### 4.2 Attach Products to Entitlement

1. Click on the `premium` entitlement
2. Click **Attach Products**
3. Select both:
   - `expense_monitor_monthly`
   - `expense_monitor_lifetime`
4. Click **Save**

**Why this matters:**
- Now you can check `customerInfo.entitlements.active['premium']` in code
- It returns `true` whether user has monthly OR lifetime subscription
- You don't need to check each product individually

---

## Step 5: Obtain API Keys

### 5.1 Get iOS API Key

1. In RevenueCat dashboard, go to **Project Settings** → **API Keys**
2. Find your app under **App-specific Keys**
3. Copy the **iOS Public API Key**
4. This key is safe to embed in your app (it's public)

**Example format:** `appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ`

### 5.2 Store API Key Securely

**Option 1: Environment Variables (Recommended for development)**

Create a `.env` file in your project root:

```bash
REVENUECAT_IOS_API_KEY=appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

**Make sure `.env` is in your `.gitignore`!**

**Option 2: EAS Secrets (Recommended for production)**

If using Expo Application Services (EAS):

```bash
eas secret:create --scope project --name REVENUECAT_IOS_API_KEY --value appl_aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

### 5.3 Create .env.example Template

Create `/Users/mac/Development/Expenses/.env.example`:

```bash
# RevenueCat Configuration
REVENUECAT_IOS_API_KEY=your_ios_api_key_here

# Firebase Configuration (if not in firebase.js)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

Commit `.env.example` to git, but NEVER commit `.env`!

---

## Step 6: Create Sandbox Test Accounts

Sandbox accounts let you test purchases without real money.

### 6.1 Create Test Accounts

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Sandbox Testers**
3. Click **+** to add a tester
4. Fill in:
   - First Name: Test
   - Last Name: User1
   - Email: **Use a real email you have access to** (e.g., your_email+sandbox1@gmail.com)
   - Password: Create a strong password (save it in password manager!)
   - Country: United States
   - Apple ID: Leave auto-generated
5. Click **Save**

**Create at least 3 test accounts:**
- `your_email+sandbox1@gmail.com` - For monthly subscription testing
- `your_email+sandbox2@gmail.com` - For lifetime purchase testing
- `your_email+sandbox3@gmail.com` - For restore purchase testing

**Gmail Pro Tip:** Gmail ignores anything after `+`, so `you+test1@gmail.com` and `you+test2@gmail.com` both go to `you@gmail.com`

### 6.2 Configure iOS Device for Sandbox Testing

**On your test iPhone/simulator:**

1. Go to **Settings** → **App Store**
2. Scroll down to **SANDBOX ACCOUNT**
3. Sign in with one of your sandbox test accounts
4. DO NOT sign into your real Apple ID here!

**Important:**
- Use sandbox account ONLY in Settings → App Store → Sandbox Account
- Keep your real Apple ID in Settings → [Your Name]
- The sandbox account is only for testing purchases

---

## Step 7: Testing in Sandbox Environment

### 7.1 Test Monthly Subscription Purchase

1. Launch your app on device/simulator
2. Sign in with a test Firebase account
3. Navigate to paywall screen
4. Tap "Start 14-Day Free Trial"
5. You should see the iOS payment sheet with:
   - Product name: "Premium Monthly"
   - Price: $4.99
   - "FREE for 14 days, then $4.99/month"
6. Confirm purchase (use Face ID/Touch ID or password)
7. Purchase should complete immediately
8. Verify in app: Premium features unlock

**Check in RevenueCat:**
1. Go to RevenueCat dashboard → **Customer History**
2. Search for your user's Firebase UID
3. You should see:
   - Active entitlement: `premium`
   - Product: `expense_monitor_monthly`
   - Expiration date: ~14 days from now (trial)

### 7.2 Test Lifetime Purchase

1. Use a different sandbox account
2. Sign out and create new Firebase account in app
3. Navigate to paywall
4. Tap "Buy Lifetime Access for $149.99"
5. Confirm purchase
6. Verify premium features unlock
7. Check RevenueCat: Should show `expense_monitor_lifetime` with no expiration date

### 7.3 Test Restore Purchases

1. After purchasing on one device, delete the app
2. Reinstall the app
3. Log in with the SAME Firebase account
4. Tap "Restore Purchases" on paywall
5. Your subscription should be restored
6. Premium features should unlock again

### 7.4 Test Subscription Expiry (Sandbox Accelerated Time)

**Important:** Sandbox subscriptions renew at an accelerated rate:
- 1 month subscription = renews every 5 minutes
- 14-day trial = expires after ~3 minutes

**To test expiry:**
1. Purchase monthly subscription with trial
2. Wait 3-4 minutes
3. Force-close and reopen app
4. App should detect trial expired and show paywall

**Sandbox Time Compression:**
| Production Duration | Sandbox Duration |
|---------------------|------------------|
| 14-day trial        | 3 minutes        |
| 1 month             | 5 minutes        |
| 2 months            | 10 minutes       |
| 3 months            | 15 minutes       |

### 7.5 Test Network Error Handling

1. Enable Airplane Mode
2. Try to fetch offerings
3. App should show cached subscription status
4. Disable Airplane Mode
5. App should sync with RevenueCat

---

## Troubleshooting

### Products Not Showing in App

**Symptoms:** `getOfferings()` returns empty or null

**Solutions:**
1. Check App Store Connect: Are products in "Ready to Submit" status?
2. Check RevenueCat dashboard: Are products added and offering is "Current"?
3. Wait 15-30 minutes for App Store Connect to sync with RevenueCat
4. Check bundle ID matches exactly between Xcode, App Store Connect, and RevenueCat
5. Try clearing cache: Delete app, rebuild, reinstall

### Purchase Fails with "Cannot connect to iTunes Store"

**Solutions:**
1. Verify sandbox account is signed in (Settings → App Store → Sandbox Account)
2. Sign out of real Apple ID from App Store (not iCloud!)
3. Restart device
4. Ensure you're on WiFi (sandbox purchases sometimes fail on cellular)

### "You've already purchased this. Tap OK to download it again for free."

**This is normal!** It means:
- You already bought this product with this sandbox account
- Tap OK to restore the purchase
- If testing fresh purchase, use a different sandbox account

### RevenueCat returns "Invalid API Key"

**Solutions:**
1. Verify API key is correct (check for extra spaces)
2. Ensure you're using the iOS-specific key (not Android key)
3. Check that `.env` file is being loaded correctly
4. Restart Metro bundler

### Trial Not Showing 14 Days

**Verify in App Store Connect:**
1. Go to product → Subscription Pricing
2. Click "View All Subscription Prices"
3. Check that Introductory Offer is set to 14 days
4. Save and wait 15 minutes for sync

### customerInfo.entitlements.active is empty

**Solutions:**
1. Check that products are attached to `premium` entitlement in RevenueCat
2. Make sure `Purchases.logIn(user.uid)` was called
3. Check that purchase actually succeeded (look for errors in logs)
4. Call `Purchases.getCustomerInfo()` to force a sync

### Sandbox Account Email Already in Use

**Solutions:**
1. Each sandbox account must have a unique email
2. Use Gmail's `+` trick: `yourname+test1@gmail.com`, `yourname+test2@gmail.com`
3. Or use a different email provider

### "This item is no longer available"

**Solutions:**
1. Product may be in "Pending Developer Release" status in App Store Connect
2. Check that product metadata is complete (description, screenshot)
3. Try a different sandbox account

---

## Next Steps

Once you've completed setup:

1. ✅ Products created in App Store Connect
2. ✅ RevenueCat account configured with products and entitlements
3. ✅ API keys stored in `.env`
4. ✅ Sandbox test accounts created
5. ✅ Test purchases working in sandbox

**You're ready to integrate the SDK into your app!**

Proceed to:
- Story 2.2: Install and Initialize RevenueCat SDK
- Story 2.3: Create Subscription Service

---

## Reference Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [RevenueCat Dashboard](https://app.revenuecat.com)
- [RevenueCat Documentation](https://docs.revenuecat.com)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [Sandbox Testing Guide](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox)

---

## Support

- **RevenueCat Support:** support@revenuecat.com
- **Apple Developer Support:** https://developer.apple.com/contact/
- **Project Issues:** Create an issue in the GitHub repo

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
**Author:** Agent 2 - Payments & Subscription Specialist
