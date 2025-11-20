# EAS Secrets Setup Guide

## 🚨 CRITICAL: API Key Security

Your API keys are currently **EXPOSED** in the `.env` file. Follow these steps immediately to secure them.

---

## Step 1: Revoke Exposed OpenAI API Key ⚠️ URGENT

1. **Go to:** https://platform.openai.com/api-keys
2. **Find the key** ending in `...PcmDiiAA`
3. **Click "Revoke"** or delete the key
4. **Confirm revocation**

**Why:** The current key is exposed and can be stolen, leading to unauthorized charges.

---

## Step 2: Generate New API Keys

### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Click "+ Create new secret key"
3. Name: "Penny Production"
4. **Copy the key** (you won't see it again!)
5. Save securely (password manager)

### RevenueCat Production Key

1. Go to: https://app.revenuecat.com/projects
2. Select your project (or create one)
3. Go to **Project Settings > API keys**
4. Copy your **Production iOS API Key**
   - **NOT** the test key (`test_...`)
   - Should start with something like `appl_...` or similar

**Don't have a RevenueCat project yet?**
- Create account at https://www.revenuecat.com/
- Create new project: "Penny"
- Configure iOS app with bundle ID: `com.penny.expenses`
- Add subscription products ($4.99/month, $149.99/lifetime)
- Get production API key

---

## Step 3: Install EAS CLI

```bash
npm install -g eas-cli
```

**Login to Expo:**
```bash
eas login
```

---

## Step 4: Create EAS Secrets

**Set OpenAI API Key:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "sk-proj-YOUR-NEW-KEY-HERE"
```

**Set RevenueCat API Key:**
```bash
eas secret:create --scope project --name REVENUECAT_IOS_API_KEY --value "YOUR-PROD-REVENUECAT-KEY"
```

**Verify secrets were created:**
```bash
eas secret:list
```

You should see:
```
┌──────────────────────────────────┬────────┐
│ Name                             │ Scope  │
├──────────────────────────────────┼────────┤
│ EXPO_PUBLIC_OPENAI_API_KEY       │ project│
│ REVENUECAT_IOS_API_KEY           │ project│
└──────────────────────────────────┴────────┘
```

---

## Step 5: Update .env File

Replace `.env` contents with:

```env
# ⚠️ SECURITY NOTICE ⚠️
# DO NOT commit actual API keys to Git!
# Production keys are stored in EAS Secrets
# These are for local development ONLY

# RevenueCat Configuration
# For production: Use EAS Secrets (see docs/EAS-SECRETS-SETUP.md)
# For local dev: Use test key
REVENUECAT_IOS_API_KEY=test_kPJQuUnNcPqdAlnYATBQGahqFKX

# OpenAI Configuration
# For production: Use EAS Secrets (see docs/EAS-SECRETS-SETUP.md)
# For local dev: Generate a dev-only key with spending limits
EXPO_PUBLIC_OPENAI_API_KEY=your-dev-key-here-for-local-testing-only

# Instructions:
# 1. NEVER commit actual production keys to .env
# 2. For production builds, EAS automatically uses secrets
# 3. For local dev, use test/dev keys with rate limits
# 4. Set spending limits on OpenAI dev keys ($5/month recommended)
```

---

## Step 6: Verify .gitignore

Ensure `.env` is in `.gitignore`:

```bash
grep "\.env" .gitignore
```

Should output:
```
.env
.env.local
```

If not, add it:
```bash
echo ".env" >> .gitignore
```

---

## Step 7: Test EAS Build

**Build for development (faster):**
```bash
eas build --platform ios --profile development
```

**Build for production:**
```bash
eas build --platform ios --profile production
```

EAS will automatically inject the secrets during build.

---

## How EAS Secrets Work

1. **Local Development:**
   - Uses `.env` file (test keys only)
   - Expo Go or development builds

2. **Production Builds:**
   - Uses EAS Secrets (production keys)
   - `.env` file is ignored
   - Keys never exposed in code

3. **Environment Variable Access:**
   ```javascript
   // In your code:
   const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
   // EAS automatically provides the correct key based on build profile
   ```

---

## Updating Secrets

**Change a secret:**
```bash
eas secret:delete --scope project --name SECRET_NAME
eas secret:create --scope project --name SECRET_NAME --value "new-value"
```

**Or use EAS dashboard:**
https://expo.dev/accounts/[your-account]/projects/expense-monitor/secrets

---

## Security Best Practices

✅ **DO:**
- Use EAS Secrets for production
- Use test/dev keys locally with spending limits
- Rotate keys every 90 days
- Set up billing alerts on OpenAI
- Use separate keys for dev/staging/prod

❌ **DON'T:**
- Commit real API keys to Git
- Share API keys via Slack/email
- Use production keys in development
- Hard-code keys in source code

---

## Troubleshooting

### "Secret not found during build"
- Check secret name matches exactly (case-sensitive)
- Verify scope is "project" not "account"
- Run `eas secret:list` to confirm

### "Build uses wrong API key"
- Clear EAS cache: `eas build --platform ios --profile production --clear-cache`
- Verify `.env` is not being bundled (check `metro.config.js`)

### "OpenAI API Error: Invalid API Key"
- Verify key is active on OpenAI dashboard
- Check key has correct permissions (not rate-limited)
- Ensure key is properly quoted in secret creation

---

## Cost Management

**OpenAI Costs:**
- Set usage limits: https://platform.openai.com/account/limits
- Recommended: $10/month soft limit, $50/month hard limit
- Monitor usage: https://platform.openai.com/usage

**RevenueCat:**
- Free up to $2.5k MRR
- After that: 1% of tracked revenue
- Monitor: https://app.revenuecat.com/charts

---

## Next Steps

After setting up secrets:

1. ✅ Run `eas secret:list` to verify
2. ✅ Update `.env` to remove production keys
3. ✅ Build with EAS: `eas build --platform ios --profile production`
4. ✅ Test on physical device
5. ✅ Submit to TestFlight

---

## Emergency: Key Compromised

If an API key is stolen:

1. **Revoke immediately** on the provider dashboard
2. **Generate new key**
3. **Update EAS Secret:**
   ```bash
   eas secret:delete --scope project --name KEY_NAME
   eas secret:create --scope project --name KEY_NAME --value "new-key"
   ```
4. **Rebuild app:** `eas build --platform ios --profile production`
5. **Monitor billing** for suspicious activity

---

## Questions?

- EAS Secrets Docs: https://docs.expo.dev/build-reference/variables/
- RevenueCat Setup: https://www.revenuecat.com/docs/getting-started
- OpenAI Security: https://platform.openai.com/docs/guides/safety-best-practices

---

**Created:** November 20, 2025
**Updated:** November 20, 2025
