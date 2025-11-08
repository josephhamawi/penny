# Gmail Setup for Email Invitations (Quick & Easy)

This is a simple way to send invitation emails using your Gmail account.

## Step 1: Create a Gmail App Password (2 minutes)

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** if you haven't already (required for app passwords)
4. After enabling 2FA, go back to Security
5. Scroll down to "How you sign in to Google"
6. Click on **App passwords** (or **2-Step Verification** → **App passwords**)
7. If prompted, sign in again
8. Click **Select app** → Choose "Mail"
9. Click **Select device** → Choose "Other (Custom name)"
10. Enter a name like "Spensely Invitations"
11. Click **Generate**
12. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

**Important**: Save this password! You won't be able to see it again.

## Step 2: Configure Firebase Functions

```bash
# Set your Gmail email and app password
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-16-char-app-password"

# Verify configuration
firebase functions:config:get
```

That's it! You're ready to deploy.

## Step 3: Deploy Functions

```bash
firebase deploy --only functions
```

## Troubleshooting

### Can't find App Passwords option?
- Make sure 2-Step Verification is enabled first
- Wait a few minutes after enabling 2FA
- Try this direct link: https://myaccount.google.com/apppasswords

### Email not sending?
1. Check Firebase Functions logs: `firebase functions:log`
2. Make sure you used the app password, NOT your regular Gmail password
3. Check Gmail's "Sent" folder to verify emails are being sent

### Gmail blocks the email?
- Gmail might temporarily block if you send too many emails
- For production, switch to SendGrid or another service
- Free Gmail works fine for testing (up to ~100 emails/day)

## Security Notes

⚠️ **Never commit your app password to git!**
⚠️ **Use Firebase config (not environment variables) for deployed functions**
⚠️ **This is for testing only - use SendGrid or similar for production**

## Alternative: Skip Email for Now

If you don't want to set up email right now, that's fine! The invitation system will still work perfectly for **registered users** with in-app invitations. Only **unregistered users** need email.

You can deploy without setting email config and add it later when needed.
