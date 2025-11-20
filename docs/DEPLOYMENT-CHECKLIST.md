# 🚀 Penny App - Deployment Checklist

**Target:** Apple App Store Launch
**Last Updated:** November 20, 2025

---

## ✅ COMPLETED TODAY

- [x] **Removed test promo code** from Settings
- [x] **Fixed app.json** (bundle ID: `com.penny.expenses`, build number: `1`)
- [x] **Created Privacy Policy** (`/docs/legal/privacy-policy.html`)
- [x] **Created Terms of Service** (`/docs/legal/terms.html`)
- [x] **Updated PaywallScreen** with privacy/terms URLs
- [x] **Secured .env file** (removed exposed API keys)
- [x] **Created EAS Secrets guide** (`/docs/EAS-SECRETS-SETUP.md`)
- [x] **Updated eas.json** (production build profile)

---

## 🔴 CRITICAL - DO BEFORE ANYTHING ELSE

### 1. Revoke Exposed OpenAI API Key ⚠️ URGENT

```bash
# Go to: https://platform.openai.com/api-keys
# Find key ending in: ...PcmDiiAA
# Click "Revoke" or Delete
```

**Why:** Key is exposed in Git history and can be stolen.

### 2. Enable GitHub Pages (for Privacy Policy)

1. Go to repo **Settings > Pages**
2. Source: Deploy from branch `main`
3. Folder: `/docs`
4. Save
5. **Note the URL:** `https://josephhamawi.github.io/penny/`
6. **Update PaywallScreen.js** lines 213 & 217:
   - Replace `yourusername` with your actual GitHub username
   - Test URLs work before submitting to App Store

---

## 📋 PRE-BUILD CHECKLIST

### Security & Configuration

- [ ] **Revoked old OpenAI API key** ✅ CRITICAL
- [ ] **Generated new OpenAI API key** (with spending limits)
- [ ] **Got production RevenueCat key** (not test key)
- [ ] **Installed EAS CLI:** `npm install -g eas-cli`
- [ ] **Logged into EAS:** `eas login`
- [ ] **Created EAS Secrets:**
  ```bash
  eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-new-key"
  eas secret:create --scope project --name REVENUECAT_IOS_API_KEY --value "prod-key"
  ```
- [ ] **Verified secrets:** `eas secret:list`
- [ ] **Updated .env** to remove production keys
- [ ] **.gitignore includes .env**

### Legal & Metadata

- [ ] **Privacy Policy hosted** and publicly accessible
- [ ] **Terms of Service hosted** and publicly accessible
- [ ] **Updated PaywallScreen URLs** with real GitHub Pages URLs
- [ ] **Tested URLs open in browser**
- [ ] **Customized legal docs** (replaced placeholders with your info)
- [ ] **Set support email** (update in privacy/terms: `support@pennyapp.com`)

### App Store Connect Setup

- [ ] **Created Apple Developer account** ($99/year)
- [ ] **Created app in App Store Connect**
- [ ] **Got App Store Connect App ID** (10-digit number)
- [ ] **Updated eas.json** with App Store Connect ID
- [ ] **Added bundle ID** to Apple Developer portal: `com.penny.expenses`

### RevenueCat Setup

- [ ] **Created RevenueCat account**
- [ ] **Created project** named "Penny"
- [ ] **Configured iOS app** with bundle ID: `com.penny.expenses`
- [ ] **Added subscription products:**
  - Monthly: `penny_monthly` ($4.99/month)
  - Lifetime: `penny_lifetime` ($149.99 one-time)
- [ ] **Created entitlement:** `premium`
- [ ] **Linked to App Store Connect**
- [ ] **Got production API key**

---

## 🏗️ BUILD PROCESS

### Step 1: Build for Production

```bash
# Navigate to project directory
cd /Users/mac/Development/Expenses

# Clean install dependencies
rm -rf node_modules
npm install

# Build production iOS app
eas build --platform ios --profile production
```

**Expected Output:**
- Build queued on EAS servers
- Build ID provided (e.g., `abc123-def456`)
- Can monitor: https://expo.dev/accounts/[your-account]/projects/expense-monitor/builds

**Time:** 10-20 minutes

### Step 2: Monitor Build

```bash
# Check build status
eas build:list

# View specific build
eas build:view BUILD_ID
```

**Build Success:** You'll get a `.ipa` file download link

### Step 3: Download & Test

```bash
# Download IPA
eas build:download --id BUILD_ID

# Install on physical device via Xcode or TestFlight
```

---

## 📱 TESTFLIGHT SUBMISSION

### Step 1: Submit to TestFlight

```bash
eas submit --platform ios
```

**OR** manually:
1. Download IPA from EAS build
2. Open **Transporter** app (Mac App Store)
3. Drag IPA into Transporter
4. Submit

### Step 2: TestFlight Setup

1. Go to App Store Connect > TestFlight
2. Add **Internal Testers** (up to 100)
3. Add **External Testers** (optional, requires review)
4. Provide **Test Information:**
   - What to test
   - Known issues
   - Test credentials (if needed)

### Step 3: Beta Testing

- [ ] **Invited 5-10 beta testers**
- [ ] **Sent test instructions**
- [ ] **Collected feedback** (1-2 weeks)
- [ ] **Fixed critical bugs**
- [ ] **Rebuilt if needed** (`eas build --platform ios --profile production`)

---

## 🍎 APP STORE SUBMISSION

### Step 1: App Store Connect - App Information

1. **Basic Info:**
   - Name: Penny
   - Subtitle: Smart Expense Tracking
   - Primary Language: English
   - Bundle ID: com.penny.expenses
   - SKU: penny-expenses (unique identifier)

2. **Category:**
   - Primary: Finance
   - Secondary: (optional)

3. **Age Rating:**
   - Run through questionnaire
   - Expected: 4+ (no restricted content)

### Step 2: Pricing & Availability

- [ ] **Price:** Free (with IAP)
- [ ] **Availability:** All countries (or select specific)
- [ ] **Pre-order:** No (for first launch)

### Step 3: App Privacy

- [ ] **Fill out privacy questionnaire**
- [ ] **Data types collected:**
  - Contact Info (email)
  - Financial Info (expenses - stored locally)
  - User Content (expense descriptions)
  - Usage Data (analytics)
- [ ] **Link Privacy Policy:** `https://josephhamawi.github.io/penny/legal/privacy-policy.html`

### Step 4: In-App Purchases

1. **Create IAP in App Store Connect:**
   - Monthly Subscription: `penny_monthly` ($4.99/month auto-renewing)
   - Lifetime: `penny_lifetime` ($149.99 one-time)

2. **Subscription Group:**
   - Name: Premium Access
   - Add both products to group

3. **Localization:**
   - Display Name: "Penny Premium"
   - Description: "Unlock AI insights and unlimited goals"

4. **Review Information:**
   - Screenshot showing paywall
   - Description of features

### Step 5: App Metadata

- [ ] **App Name:** Penny
- [ ] **Subtitle:** Track expenses, achieve goals
- [ ] **Description:**
```
Track your income and expenses effortlessly with Penny, the smart finance app that helps you understand your spending habits and achieve your financial goals.

KEY FEATURES:
• Automatic expense tracking
• Smart savings plans with goal projections
• AI-powered spending personality reports
• Real-time budget monitoring
• Google Sheets sync
• Beautiful, intuitive interface

PREMIUM FEATURES:
• AI personality insights
• Unlimited savings goals
• Advanced spending analytics
• Priority support

WHY PENNY?
Unlike other expense trackers, Penny focuses on helping you SAVE and achieve goals, not just track spending. Our AI analyzes your habits and provides personalized recommendations to help you succeed.

SUBSCRIPTION:
• Monthly: $4.99/month (auto-renewing)
• Lifetime: $149.99 (one-time payment)
• 14-day free trial for monthly subscription
• Cancel anytime in your App Store settings

Privacy Policy: https://josephhamawi.github.io/penny/legal/privacy-policy.html
Terms of Service: https://josephhamawi.github.io/penny/legal/terms.html
```

- [ ] **Keywords:** `expense tracker,budget,finance,savings,money,bills,spending,goals,income`
- [ ] **Support URL:** `https://josephhamawi.github.io/penny/`
- [ ] **Marketing URL:** (optional)

### Step 6: App Review Information

- [ ] **Contact:** Your email
- [ ] **Phone:** Your phone number
- [ ] **Demo Account:** (if login required)
  - Username: `demo@pennyapp.com`
  - Password: `DemoPass123!`
  - Notes: "This is a test account with sample data"
- [ ] **Notes:**
```
Penny is a personal finance app that helps users track expenses and achieve savings goals using AI-powered insights.

KEY FEATURES TO TEST:
1. Add an expense (tap + button on Home)
2. View spending stats on Statistics tab
3. Create a savings plan (Plans tab)
4. Try Premium features (Settings > Upgrade)

SUBSCRIPTION TESTING:
- Use Apple Sandbox tester account
- Monthly: $4.99/month
- Lifetime: $149.99 one-time
- All IAP configured in RevenueCat

PROMO CODE FOR REVIEW:
Code: APPSTORE2024
(Grants full Premium access for 30 days)
```

### Step 7: Screenshots

**Required Sizes:**
- 6.7" (iPhone 15 Pro Max): 1290 x 2796
- 6.5" (iPhone 11 Pro Max): 1242 x 2688
- 5.5" (iPhone 8 Plus): 1242 x 2208

**Suggested Screenshots (5-10):**
1. Home screen with expense overview
2. Add expense screen
3. Statistics/analytics screen
4. Savings plans overview
5. AI personality report (Premium)
6. Goal progress screen
7. Paywall/subscription screen

**Tips:**
- Use device frames
- Add text overlays highlighting features
- Show value proposition
- Keep it clean and professional

### Step 8: App Preview Video (Optional but Recommended)

- 15-30 seconds
- Show key features
- Same sizes as screenshots
- No audio required but helps

---

## 🔍 FINAL PRE-SUBMISSION CHECKS

### Functionality

- [ ] **App launches without errors**
- [ ] **All tabs navigate correctly**
- [ ] **Add expense works**
- [ ] **Edit/delete expense works**
- [ ] **Google Sheets sync works** (optional feature)
- [ ] **Savings plans create successfully**
- [ ] **Goals feature works**
- [ ] **AI personality report generates** (Premium)
- [ ] **Paywall displays correctly**
- [ ] **Subscription purchase works** (Sandbox)
- [ ] **Subscription restoration works**
- [ ] **Promo code redemption works**
- [ ] **Account deletion works**
- [ ] **Logout/login works**

### Performance

- [ ] **No crashes on launch**
- [ ] **No crashes during normal use**
- [ ] **Scrolling is smooth** (60 FPS)
- [ ] **Load times < 3 seconds**
- [ ] **Works offline** (graceful degradation)
- [ ] **Large datasets** (100+ expenses) perform well

### Design & UX

- [ ] **Status bar color correct** (light content)
- [ ] **Safe areas respected** (no notch overlap)
- [ ] **Loading states display**
- [ ] **Error messages clear and helpful**
- [ ] **Empty states with guidance**
- [ ] **Consistent fonts and colors**
- [ ] **Icons aligned and sized correctly**
- [ ] **No placeholder text** ("Lorem ipsum", etc.)

### Security & Privacy

- [ ] **No API keys in code**
- [ ] **API keys in EAS Secrets**
- [ ] **Privacy Policy accessible**
- [ ] **Terms of Service accessible**
- [ ] **User data encrypted** (Firebase default)
- [ ] **Multi-user isolation working**

---

## 📤 SUBMISSION

### When Everything is Ready:

```bash
# Submit to App Store
eas submit --platform ios

# OR manually through App Store Connect
# Version > Submit for Review
```

### Review Time

- **Typical:** 1-3 days
- **First submission:** May take longer
- **Common rejections:**
  - Broken links (privacy/terms)
  - Crashes during review
  - In-app purchase issues
  - Missing features described in metadata

---

## 🎉 POST-LAUNCH

### Day 1

- [ ] **Monitor crash reports** (App Store Connect)
- [ ] **Check subscription analytics** (RevenueCat)
- [ ] **Review user feedback/ratings**
- [ ] **Respond to support emails**
- [ ] **Share on social media**

### Week 1

- [ ] **Collect user feedback**
- [ ] **Track conversion rates** (free → paid)
- [ ] **Monitor API costs** (OpenAI usage)
- [ ] **Fix critical bugs** (if any)
- [ ] **Plan v1.1 features**

### Ongoing

- [ ] **Weekly analytics review**
- [ ] **Monthly content updates** (if applicable)
- [ ] **Quarterly feature updates**
- [ ] **Annual privacy policy review**

---

## 🆘 TROUBLESHOOTING

### Build Fails

```bash
# Clear cache and retry
eas build --platform ios --profile production --clear-cache

# Check credentials
eas credentials

# View build logs
eas build:view BUILD_ID
```

### TestFlight Upload Fails

- Check bundle ID matches App Store Connect
- Verify build number increments
- Check for missing icons/assets
- Ensure Info.plist configured correctly

### App Store Rejection

**Common Issues:**
1. **Crashes:** Fix and resubmit (1-2 days)
2. **Broken Links:** Update URLs and resubmit (1 day)
3. **IAP Issues:** Fix RevenueCat config (1-2 days)
4. **Misleading Metadata:** Update description (1 day)

**How to Resubmit:**
1. Fix the issue
2. Rebuild: `eas build --platform ios --profile production`
3. Upload to TestFlight
4. Submit new build for review

---

## 📞 SUPPORT RESOURCES

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **RevenueCat Docs:** https://www.revenuecat.com/docs
- **OpenAI Best Practices:** https://platform.openai.com/docs/guides/safety-best-practices

---

## ✅ FINAL CHECK BEFORE SUBMISSION

**Have you:**
- [ ] Revoked old API keys?
- [ ] Set up EAS Secrets with production keys?
- [ ] Enabled GitHub Pages for privacy/terms?
- [ ] Updated PaywallScreen URLs?
- [ ] Tested app on physical device?
- [ ] Beta tested with 5+ users?
- [ ] Created all App Store metadata?
- [ ] Uploaded screenshots?
- [ ] Configured In-App Purchases?
- [ ] Created promo code for App Store reviewers?
- [ ] Set up support email?

**If YES to all → Submit to App Store!** 🚀

---

**Good luck with your launch!** 🎊

---

**Created:** November 20, 2025
**Version:** 1.0
