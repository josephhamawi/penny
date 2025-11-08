# Firebase Cloud Functions

This directory contains the Firebase Cloud Functions for the Spensely app.

## Functions

### 1. sendInvitationEmail
Automatically sends email invitations when a new invitation is created with `type='email'`.

### 2. cleanupExpiredInvitations
Scheduled function that runs daily to mark expired pending invitations.

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Email Service

You need to configure email credentials for sending invitation emails. Choose one of the following options:

#### Option A: Gmail (for testing/development only)

1. Create a Google App Password:
   - Go to your Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"

2. Set Firebase config:
```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

#### Option B: SendGrid (recommended for production)

1. Sign up for SendGrid and get an API key
2. Install SendGrid package:
```bash
npm install @sendgrid/mail
```

3. Update the code in `index.js` to use SendGrid (see commented section)
4. Set Firebase config:
```bash
firebase functions:config:set sendgrid.key="your-api-key"
```

#### Option C: AWS SES or other SMTP

Configure your SMTP settings in the `nodemailer.createTransport()` call in `index.js`.

### 3. Update App Link

In `index.js`, update the `invitationLink` to match your app's deep link or web URL:

```javascript
const invitationLink = `spensely://accept-invite?token=${invitationId}`;
// or for web:
const invitationLink = `https://yourapp.com/accept-invite?token=${invitationId}`;
```

### 4. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy a specific function
firebase deploy --only functions:sendInvitationEmail
```

## Testing Locally

```bash
# Start the emulator
npm run serve

# Or use Firebase emulators
firebase emulators:start --only functions
```

## Environment Variables

For local testing, you can use environment variables:

```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-app-password"
```

Or create a `.env` file in the functions directory (don't commit this):

```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Logs

View function logs:

```bash
npm run logs

# Or
firebase functions:log
```

## Cost Considerations

- Cloud Functions are billed based on:
  - Number of invocations
  - Compute time
  - Memory usage
  - Outbound networking

- The free tier includes:
  - 2M invocations/month
  - 400,000 GB-seconds/month
  - 200,000 CPU-seconds/month

For most small to medium apps, these functions should stay within the free tier.

## Security Notes

- Never commit email credentials to git
- Use Firebase config or environment variables for sensitive data
- Consider implementing rate limiting for invitation sending
- Validate invitation data before sending emails
