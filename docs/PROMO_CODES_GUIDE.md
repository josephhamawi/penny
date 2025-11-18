# Promo Codes Feature - Complete Guide

## Overview

The promo code system allows you to grant complimentary access to AI features for testers, friends, or promotional purposes. Users can redeem codes to bypass subscription requirements.

---

## Creating Promo Codes (Firebase Console - Easiest Method)

### Step 1: Open Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **expenses-64949**
3. Navigate to **Firestore Database** from the left sidebar

### Step 2: Create a Promo Code Document

1. Click on the **promoCodes** collection (create it if it doesn't exist)
2. Click **Add Document**
3. Let Firebase auto-generate the Document ID, or specify your own
4. Add the following fields:

| Field Name | Type | Value | Description |
|------------|------|-------|-------------|
| `code` | string | `FRIEND2024` | The code users will enter (use UPPERCASE) |
| `type` | string | `full_access` | Type of access granted |
| `maxUses` | number | `10` | Maximum redemptions (null for unlimited) |
| `usedCount` | number | `0` | Current redemption count |
| `expiresAt` | timestamp | `null` or future date | Expiration (null for never) |
| `createdBy` | string | `admin` | Who created it |
| `createdAt` | timestamp | (click "now") | Creation timestamp |
| `active` | boolean | `true` | Is the code active? |

5. Click **Save**

### Example Promo Code Document

```javascript
{
  code: "FRIEND2024",
  type: "full_access",
  maxUses: 10,
  usedCount: 0,
  expiresAt: null,
  createdBy: "admin",
  createdAt: November 18, 2025 at 12:00:00 AM UTC,
  active: true
}
```

---

## How Users Redeem Codes

### User Flow:

1. User opens the app (without premium subscription)
2. Navigate to **Settings** → **Manage Subscription**
3. Scroll down to "Have a promo code?" section
4. Enter the code (e.g., `FRIEND2024`)
5. Tap **Redeem**
6. If valid, user gets full AI feature access immediately

### What Happens Behind the Scenes:

- Code is validated against Firestore `promoCodes` collection
- Checks: active, not expired, under max uses limit
- User's document is updated with promo access flags
- `usedCount` is incremented
- User gets toast notification of success

---

## Promo Code Examples

### For Friends (Limited Use)
```
code: "FRIEND2024"
maxUses: 5
expiresAt: null
```
✅ 5 friends can redeem, never expires

### For Beta Testers (Time-Limited)
```
code: "BETA-TEST"
maxUses: null (unlimited)
expiresAt: December 31, 2025
```
✅ Unlimited uses, expires at year-end

### For Influencer Campaign (Single Use)
```
code: "SARAH123"
maxUses: 1
expiresAt: null
```
✅ One person can redeem

---

## Managing Promo Codes

### Check Usage

1. Open Firebase Console → Firestore → `promoCodes`
2. Click on a code document
3. Check the `usedCount` field to see how many times it's been redeemed

### Deactivate a Code

1. Find the code in Firestore
2. Change `active` from `true` to `false`
3. Save
4. Code will no longer work for new redemptions

### Revoke User Access

If you need to remove promo access from a specific user:

1. Go to Firestore → `users` → find the user by ID
2. Update the following fields:
   - `hasPromoAccess`: `false`
   - `promoCode`: `null`
   - `promoActivatedAt`: `null`
3. Save

---

## Monitoring & Analytics

### Firebase Console Queries

**Find all active codes:**
```
Collection: promoCodes
Where: active == true
```

**Find codes nearing max usage:**
```
Collection: promoCodes
Where: usedCount >= 8
Where: maxUses == 10
```

**Find users with promo access:**
```
Collection: users
Where: hasPromoAccess == true
```

---

## Security Notes

✅ **Secure Design:**
- Users can only read promo codes (can't create/edit)
- Validation happens server-side (Firestore rules)
- Codes are case-insensitive (normalized to uppercase)
- One code per user (can't stack codes)

⚠️ **Best Practices:**
- Use unique, hard-to-guess codes
- Set reasonable `maxUses` limits
- Monitor usage regularly
- Deactivate codes after campaigns end

---

## Quick Reference: Code Patterns

| Use Case | Code Example | Max Uses | Expires |
|----------|--------------|----------|---------|
| Friend access | `FRIEND-2024` | 10 | Never |
| Beta testing | `BETA-TEST` | null | 30 days |
| Influencer | `SARAH123` | 1 | Never |
| Limited promo | `NEWYEAR25` | 100 | Jan 31 |
| Staff access | `TEAM-ADMIN` | null | Never |

---

## Troubleshooting

### Code not working?

**Check:**
1. Is `active` set to `true`?
2. Has `maxUses` been reached?
3. Has the code `expiresAt` passed?
4. Is the code spelled correctly (uppercase)?

### User already has access?

**Error:** "You already have promo access via code: XXX"
**Solution:** User can only have one promo code at a time. Revoke the old one first.

### Want to extend a code?

**To add more uses:**
1. Find code in Firestore
2. Increase `maxUses` value
3. Save

**To extend expiration:**
1. Find code in Firestore
2. Update `expiresAt` to new date (or `null` for never)
3. Save

---

## Integration with AI Features

When checking if a user has AI access, the system checks:

1. **First**: Promo code access (faster)
2. **Second**: RevenueCat subscription status

This means promo codes bypass the subscription check entirely!

### Code Usage Example:

```javascript
import { hasAIFeatureAccess } from './services/subscriptionService';

const checkAccess = async (userId) => {
  const result = await hasAIFeatureAccess(userId);

  if (result.hasAccess) {
    if (result.source === 'promo') {
      console.log(`Access via promo: ${result.promoCode}`);
    } else {
      console.log('Access via subscription');
    }
  }
};
```

---

## Summary

✅ **Implemented:**
- Promo code service (`promoCodeService.js`)
- Redemption UI in Subscription Management screen
- Firestore security rules
- Integrated with subscription checking

🎯 **How to Use:**
1. Create codes in Firebase Console (takes 1 minute)
2. Share code with testers/friends
3. They redeem in app
4. Monitor usage in Firestore

📋 **Admin Access:**
- All codes managed via Firebase Console
- No admin panel needed
- Simple, secure, effective

---

**Built by: Claude Code (PM Agent)**
**Date: November 18, 2025**
