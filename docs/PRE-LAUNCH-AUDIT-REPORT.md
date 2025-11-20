# 🚀 Pre-Launch Audit Report - Penny App
**Date:** 2025-11-20
**Auditor:** Product Manager + Dev Team
**Target:** Apple App Store Launch
**Status:** ⚠️ **CRITICAL ISSUES FOUND - NOT READY FOR LAUNCH**

---

## Executive Summary

A comprehensive pre-launch audit was conducted to assess readiness for Apple App Store submission. **CRITICAL blocking issues were identified** that must be resolved before launch. This report details all findings and provides actionable fixes.

**Overall Status:** 🔴 **NOT READY** (7 critical issues, 3 warnings)

---

## 🔴 CRITICAL ISSUES (Must Fix Before Launch)

### 1. Invalid Bundle Identifier ⚠️ **BLOCKER**

**Location:** `/app.json` line 25
**Current Value:** `"com.yourname.penny.expenses"`
**Issue:** Contains placeholder "yourname" - Apple will reject this

**Fix Required:**
```json
"bundleIdentifier": "com.penny.expenses"
```

**OR** if you own a domain:
```json
"bundleIdentifier": "com.yourdomain.penny"
```

**Impact:** App Store submission will be **REJECTED** immediately

---

### 2. Exposed API Keys 🚨 **SECURITY CRITICAL**

**Location:** `/.env` line 8
**Issue:** OpenAI API key is committed and exposed in plain text

**Current (EXPOSED):**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-tOTZBa...
```

**IMMEDIATE ACTIONS REQUIRED:**

1. **Revoke the exposed API key NOW** at https://platform.openai.com/api-keys
2. Generate a new API key
3. Use EAS Secrets for production:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-new-key"
   ```
4. Remove API key from `.env` file (keep placeholder only)
5. Update `.env` to:
   ```env
   # For production: Use EAS Secrets instead
   # eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY
   EXPO_PUBLIC_OPENAI_API_KEY=your-key-here-for-local-dev-only
   ```

**Impact:**
- Current key is **compromised** and can be abused
- Could result in **thousands of dollars** in unauthorized OpenAI API charges
- Security vulnerability

---

### 3. Test RevenueCat API Key ⚠️ **BLOCKER**

**Location:** `/.env` line 3
**Current Value:** `REVENUECAT_IOS_API_KEY=test_kPJQuUnNcPqdAlnYATBQGahqFKX`

**Issue:** Using test API key - subscriptions will NOT work in production

**Fix Required:**
1. Go to https://app.revenuecat.com/projects
2. Create production app configuration
3. Get **production iOS API key**
4. Use EAS Secrets:
   ```bash
   eas secret:create --scope project --name REVENUECAT_IOS_API_KEY --value "prod_key_here"
   ```

**Impact:** Users will not be able to purchase subscriptions = **$0 revenue**

---

### 4. Invalid iOS Build Number ⚠️ **BLOCKER**

**Location:** `/app.json` line 26
**Current Value:** `"buildNumber": "1.0.0"`
**Issue:** iOS build numbers must be integers, not semantic versions

**Fix Required:**
```json
"buildNumber": "1"
```

**For future updates:**
- Version: "1.0.0" → "1.0.1" → "1.1.0"
- Build Number: "1" → "2" → "3" (increment each build)

**Impact:** TestFlight/App Store submission will **FAIL**

---

### 5. Placeholder Privacy & Terms URLs ⚠️ **BLOCKER**

**Location:** `/src/screens/PaywallScreen.js` lines ~200+

**Current (INVALID):**
```javascript
<TouchableOpacity onPress={() => openURL('https://yourapp.com/terms')}>
<TouchableOpacity onPress={() => openURL('https://yourapp.com/privacy')}>
```

**Issue:** Apple **REQUIRES** valid, publicly accessible Privacy Policy and Terms of Service

**Fix Required:**

**Option A: Use Termly (Free)** ⭐ Recommended
1. Go to https://termly.io/
2. Generate Privacy Policy (free tier available)
3. Generate Terms of Service (free tier available)
4. Host on Termly's free hosting OR GitHub Pages
5. Update URLs:
   ```javascript
   openURL('https://penny-app.termly.io/privacy-policy')
   openURL('https://penny-app.termly.io/terms-of-service')
   ```

**Option B: GitHub Pages** (Free hosting)
1. Create `/docs/privacy.html` and `/docs/terms.html`
2. Enable GitHub Pages in repo settings
3. URLs will be: `https://yourusername.github.io/penny/privacy.html`

**Required Content:**
- **Privacy Policy:** Must include data collection, usage, sharing, user rights, GDPR/CCPA compliance
- **Terms of Service:** Usage terms, subscription terms, cancellation policy, liability

**Impact:** App Store review will **REJECT** app without valid policies

---

### 6. Missing App Store Connect Metadata ⚠️ **BLOCKER**

**Location:** `/app.json` - missing fields

**Required for App Store Submission:**

Add to `app.json`:
```json
{
  "expo": {
    "name": "Penny",
    "description": "Track your income and expenses effortlessly with AI-powered insights and smart savings plans",
    "primaryCategory": "FINANCE",
    "ios": {
      "bundleIdentifier": "com.penny.expenses",
      "buildNumber": "1",
      "config": {
        "googleMapsApiKey": ""  // Leave empty if not using maps
      },
      "associatedDomains": [],  // For universal links (optional)
      "appStoreUrl": "https://apps.apple.com/app/idXXXXXXXX"  // After first submission
    },
    "privacy": "public",  // or "unlisted" during testing
    "orientation": "portrait",
    "backgroundColor": "#0A0E27"
  }
}
```

**Also Needed (manual entry in App Store Connect):**
- App description (4000 char max)
- Keywords (100 char max, comma-separated)
- Screenshots (6.7", 6.5", 5.5" required)
- App Preview video (optional but recommended)
- Support URL
- Marketing URL (optional)
- Copyright text
- Age rating
- In-App Purchase screenshot (if subscriptions visible)

---

### 7. No robots.txt or App-Ads.txt ⚠️ Warning

**Location:** Missing files

**Issue:** Web version needs robots.txt, and if running ads need app-ads.txt

**Fix (if hosting web version):**

Create `/public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://yourwebsite.com/sitemap.xml
```

**For iOS-only app:** Not critical, but good to have if you plan web presence

---

## ⚠️ WARNINGS (Recommended but not blocking)

### W1: No Splash Screen Image

**Location:** `/app.json` line 21-23
**Current:** Only background color, no image

**Recommendation:**
```json
"splash": {
  "image": "./public/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0A0E27"
}
```

Create a 2048x2048px splash image

**Impact:** Generic splash looks unprofessional

---

### W2: Missing App Icon Sizes

**Current:** Using single `newicon.png`
**Issue:** Should provide multiple sizes for best quality

**Recommendation:** Use https://easyappicon.com/ to generate:
- iOS: 1024x1024 (App Store), 180x180, 120x120, 87x87, etc.
- Android: 512x512, 192x192, 96x96, 72x72, etc.

**Impact:** Icon may appear blurry on some devices

---

### W3: No Error Tracking/Analytics

**Current:** Console logs only
**Recommendation:** Add Sentry or similar before launch

```bash
npx expo install @sentry/react-native
```

This helps diagnose production crashes

---

## ✅ PASSED CHECKS

### ✓ App Structure
- [x] Core navigation working
- [x] Tab structure correct (5 tabs)
- [x] Authentication flow complete
- [x] Firebase properly configured

### ✓ Features Implemented
- [x] Expense tracking
- [x] Goals feature
- [x] My Plans (savings allocation)
- [x] AI Personality Reports
- [x] Subscription/paywall system
- [x] Promo code redemption
- [x] Google Sheets sync

### ✓ Code Quality
- [x] No critical console errors
- [x] Test promo code removed ✅ (fixed today)
- [x] TypeScript/syntax valid
- [x] Build compiles successfully

### ✓ Design
- [x] App icon exists (`/public/newicon.png`)
- [x] Consistent UI theme
- [x] Glass-morphism design
- [x] Dark mode support

---

## 📋 PRE-LAUNCH CHECKLIST

### Before Submission (Blocking)

- [ ] **1. Fix bundle identifier** → `com.penny.expenses`
- [ ] **2. Revoke & replace OpenAI API key** (use EAS Secrets)
- [ ] **3. Get production RevenueCat key** (use EAS Secrets)
- [ ] **4. Fix iOS build number** → `"1"` (integer)
- [ ] **5. Create Privacy Policy** (Termly recommended)
- [ ] **6. Create Terms of Service** (Termly recommended)
- [ ] **7. Update PaywallScreen with real URLs**
- [ ] **8. Add App Store Connect metadata** to app.json
- [ ] **9. Build with EAS Build** (not Expo Go)
   ```bash
   eas build --platform ios --profile production
   ```
- [ ] **10. Test on physical device** (not just simulator)

### Recommended Before Launch

- [ ] Create splash screen image (2048x2048)
- [ ] Generate multi-size app icons
- [ ] Set up Sentry or error tracking
- [ ] Create App Store screenshots (all required sizes)
- [ ] Write compelling App Store description
- [ ] Prepare App Preview video (optional)
- [ ] Set up support email/website
- [ ] Create marketing materials

### App Store Connect Setup

- [ ] Create app listing in App Store Connect
- [ ] Upload screenshots (6.7", 6.5", 5.5" required)
- [ ] Write app description & keywords
- [ ] Set pricing ($4.99/month, $149.99/lifetime)
- [ ] Configure In-App Purchases
- [ ] Set age rating
- [ ] Add support & marketing URLs
- [ ] Submit for review

### Testing Checklist

- [ ] **Subscription Flow**
  - [ ] Monthly subscription purchase works
  - [ ] Lifetime purchase works
  - [ ] Subscription restoration works
  - [ ] Free trial starts correctly (if enabled)
  - [ ] Paywall appears for free users
  - [ ] Premium features unlock after purchase

- [ ] **Core Features**
  - [ ] Add expense
  - [ ] Edit expense
  - [ ] Delete expense
  - [ ] Google Sheets sync
  - [ ] Create savings goal
  - [ ] Create savings plan
  - [ ] Generate personality report (AI)
  - [ ] Promo code redemption

- [ ] **Edge Cases**
  - [ ] No internet connection handling
  - [ ] Empty states display correctly
  - [ ] Large datasets (100+ expenses)
  - [ ] Account deletion works
  - [ ] Logout and re-login
  - [ ] Multi-user data isolation

---

## 🔧 IMMEDIATE ACTION PLAN

### Priority 1: Security (TODAY)

1. **Revoke OpenAI API key** → https://platform.openai.com/api-keys
2. **Generate new key** and store in EAS Secrets
3. **Update `.env`** to remove actual key (use placeholder)
4. **Add `.env` to .gitignore** (should already be there)
5. **Check Git history** for exposed keys (if found, consider repo rotation)

### Priority 2: App Configuration (1-2 hours)

1. **Fix app.json**:
   - Bundle identifier → `com.penny.expenses`
   - Build number → `"1"`
   - Add metadata (description, category, etc.)

2. **Create Privacy & Terms pages**:
   - Use Termly.io (15 minutes)
   - Update PaywallScreen.js URLs

### Priority 3: Production Build (2-3 hours)

1. **Configure EAS Secrets**:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-new-key"
   eas secret:create --scope project --name REVENUECAT_IOS_API_KEY --value "prod-key"
   ```

2. **Build production app**:
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to TestFlight** for internal testing

### Priority 4: App Store Prep (4-6 hours)

1. **Create screenshots** (use simulator + screenshotting tool)
2. **Write app description** (4000 char limit)
3. **Choose keywords** (100 char limit)
4. **Fill App Store Connect** metadata
5. **Configure In-App Purchases** in RevenueCat & App Store Connect

---

## 📊 LAUNCH READINESS SCORE

**Current Score:** 35/100 🔴

| Category | Score | Status |
|----------|-------|--------|
| Security | 0/25 | 🔴 Critical (API keys exposed) |
| Configuration | 10/25 | 🔴 Invalid bundle ID & build # |
| Legal | 0/15 | 🔴 No privacy/terms |
| Features | 15/15 | ✅ Complete |
| Testing | 5/10 | 🟡 Manual testing needed |
| Marketing | 5/10 | 🟡 Metadata incomplete |

**Target for Launch:** 85/100 minimum

---

## 💡 RECOMMENDATIONS

### Short-term (This Week)

1. **Fix all 7 critical issues** listed above
2. **Build with EAS** (not Expo Go - RevenueCat requires native build)
3. **Test on physical device** with production keys
4. **Submit to TestFlight** for beta testing (get 5-10 users to test)

### Medium-term (Next 2 Weeks)

1. **Collect beta feedback** and fix issues
2. **Create marketing materials** (screenshots, video, description)
3. **Submit to App Store** for review (typical review time: 1-3 days)
4. **Monitor crash reports** and analytics

### Long-term (Post-Launch)

1. **Set up monitoring** (Sentry, Analytics)
2. **A/B test paywall** conversion rates
3. **Iterate on AI features** based on usage data
4. **Plan v1.1 features** from user feedback

---

## 🎯 ESTIMATED TIMELINE TO LAUNCH

**If starting TODAY:**

- **Day 1** (Today): Fix security + config (4-6 hours)
- **Day 2**: Create privacy/terms, build production app (3-4 hours)
- **Day 3**: Internal testing, fix bugs (4-6 hours)
- **Day 4**: Create App Store materials (4-6 hours)
- **Day 5**: Submit to TestFlight (1 hour)
- **Days 6-12**: Beta testing (gather feedback)
- **Day 13**: Submit to App Store
- **Days 14-16**: Apple review
- **Day 17**: **LAUNCH** 🚀

**Total:** ~17 days to launch if no major issues found

---

## 📞 NEXT STEPS

**Immediate Actions (Next 30 Minutes):**

1. ✅ Revoke exposed OpenAI API key
2. ✅ Fix app.json bundle identifier
3. ✅ Fix iOS build number

**Next Actions (Today):**

4. Generate new API keys and configure EAS Secrets
5. Create privacy policy & terms (Termly)
6. Update PaywallScreen URLs

**Tomorrow:**

7. Build production app with EAS
8. Test on physical device
9. Submit to TestFlight

---

## ✅ SIGN-OFF

**Audit Status:** COMPLETE
**Issues Found:** 7 Critical, 3 Warnings
**Recommendation:** **DO NOT SUBMIT** to App Store until all critical issues resolved

**Next Review:** After fixes applied (estimated 2-3 days)

---

**Report Generated:** 2025-11-20
**Auditor:** John (Product Manager)
**Contact:** For questions or clarifications about this audit

---

## Appendix A: Useful Commands

```bash
# Check API key status
grep -r "EXPO_PUBLIC\|REVENUECAT" .env

# Configure EAS Secrets
eas secret:create --scope project --name KEY_NAME --value "value"
eas secret:list

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Check build status
eas build:list

# View logs
eas build:view BUILD_ID
```

## Appendix B: Required Screenshots Sizes

Apple requires screenshots for ALL supported device sizes:

- **6.7"** (iPhone 14 Pro Max, 15 Pro Max): 1290 x 2796
- **6.5"** (iPhone 11 Pro Max, XS Max): 1242 x 2688
- **5.5"** (iPhone 8 Plus): 1242 x 2208

Minimum 3 screenshots, maximum 10 per size class.

---

**END OF REPORT**
