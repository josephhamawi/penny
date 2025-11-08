# SendGrid Setup Guide

This guide will help you configure SendGrid for sending invitation emails.

## Step 1: Create a SendGrid Account

1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Click "Start for Free" or "Sign Up"
3. Complete the registration process
4. Verify your email address

**Free Tier**: 100 emails per day forever (no credit card required)

## Step 2: Create an API Key

1. Log in to SendGrid
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name like "Spensely Invitations"
5. Select **Full Access** or at minimum **Mail Send** permission
6. Click **Create & View**
7. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again!)

Example API key format: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Verify a Sender Email (Required)

SendGrid requires you to verify the email address you'll send from:

### Option A: Single Sender Verification (Easiest for testing)

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - **From Name**: Spensely (or your app name)
   - **From Email**: your-email@gmail.com (use your real email)
   - **Reply To**: Same as above
   - **Company**: Your company name
4. Click **Create**
5. Check your email and click the verification link

### Option B: Domain Authentication (Better for production)

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the wizard to add DNS records to your domain
4. This allows you to send from any email@yourdomain.com

## Step 4: Configure Firebase Functions

Once you have your API key and verified sender email, configure your Firebase Functions:

### Method 1: Using Firebase Config (Recommended for deployment)

```bash
# Set the SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"

# Set the verified sender email
firebase functions:config:set sendgrid.sender="your-verified-email@domain.com"

# View current config
firebase functions:config:get
```

### Method 2: Using Environment Variables (For local testing)

Create a `.env` file in the `functions` directory:

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_SENDER=your-verified-email@domain.com
```

**IMPORTANT**: Never commit the `.env` file to git!

## Step 5: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy just the email function
firebase deploy --only functions:sendInvitationEmail
```

## Step 6: Test Email Sending

1. Open your app
2. Go to Settings → Invitations & Sharing
3. Click "Invite User"
4. Enter an email address that you don't have an account with
5. Click "Send Invite"
6. Check if the email was delivered

## Troubleshooting

### Email Not Received

1. **Check Spam Folder**: SendGrid emails often land in spam initially
2. **Verify Sender**: Make sure your sender email is verified in SendGrid
3. **Check Logs**: View Firebase Functions logs:
   ```bash
   firebase functions:log
   ```
4. **Check SendGrid Dashboard**: Go to SendGrid → Activity to see delivery status

### Common Errors

**Error: "SendGrid API key not configured"**
- Run: `firebase functions:config:set sendgrid.key="YOUR_API_KEY"`
- Or set `SENDGRID_API_KEY` environment variable

**Error: "The from address does not match a verified Sender Identity"**
- Verify your sender email in SendGrid Settings → Sender Authentication
- Make sure the email in `sendgrid.sender` config matches your verified email

**Error: "403 Forbidden"**
- Your API key doesn't have permission to send emails
- Create a new API key with "Mail Send" permission

### View Sent Emails in SendGrid

1. Go to SendGrid Dashboard
2. Click **Activity** in the left sidebar
3. You can see all sent, delivered, bounced, and failed emails

## Cost Considerations

**Free Tier**: 100 emails/day forever
- Perfect for testing and small apps
- No credit card required

**Paid Plans** (if you need more):
- Essentials: $19.95/month for 50,000 emails
- Pro: $89.95/month for 100,000 emails

For most apps with invitation features, the free tier is sufficient!

## Best Practices

1. **Domain Authentication**: Set up domain authentication for better deliverability
2. **Unsubscribe Link**: Add unsubscribe links for marketing emails (not required for transactional)
3. **Monitor**: Regularly check SendGrid Activity feed
4. **Rate Limiting**: Consider rate limiting invitations to prevent spam
5. **Warmup**: If sending high volumes, gradually increase sending over days/weeks

## Security Notes

⚠️ **Never commit API keys to git!**
⚠️ **Use Firebase Config for production**
⚠️ **Use environment variables for local testing**
⚠️ **Add `.env` to `.gitignore`**

## Need Help?

- SendGrid Documentation: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
- Firebase Functions Logs: `firebase functions:log`
