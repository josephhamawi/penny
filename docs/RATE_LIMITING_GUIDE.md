# Rate Limiting Implementation Guide

## Overview

This document describes the rate limiting system implemented to protect the Penny app's landing page and public endpoints from spam and abuse.

## Implementation

### Cloud Functions with Rate Limiting

Three protected endpoints have been created in Cloud Functions:

1. **`submitWaitlist`** - Waitlist email submissions
2. **`submitContact`** - Contact form submissions
3. **`submitSuggestion`** - Feature suggestion submissions

### Rate Limits

| Endpoint | Rate Limit | Time Window |
|----------|-----------|-------------|
| `/submitWaitlist` | 3 requests | per hour |
| `/submitContact` | 5 requests | per hour |
| `/submitSuggestion` | 10 requests | per hour |

Rate limiting is applied **per IP address** to prevent abuse while allowing legitimate users.

## How It Works

### 1. Rate Limit Tracking

- Uses Firestore collection `_rateLimits` to track requests per IP
- Document ID format: `{action}_{sanitized_ip}`
- Stores array of timestamps for requests within the time window
- Automatically expires old entries

### 2. Rate Limit Check Process

```
1. Extract client IP from request headers
2. Check Firestore for existing rate limit document
3. Filter out expired timestamps (outside time window)
4. If count < limit: allow request and add new timestamp
5. If count >= limit: reject with 429 Too Many Requests
```

### 3. Cleanup

A scheduled Cloud Function `cleanupRateLimits` runs daily at 2 AM EST to remove expired rate limit documents.

## API Endpoints

### Submit to Waitlist

```bash
POST https://us-central1-expenses-64949.cloudfunctions.net/submitWaitlist
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully added to waitlist"
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 3600
}
```

### Submit Contact Form

```bash
POST https://us-central1-expenses-64949.cloudfunctions.net/submitContact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here (10-2000 characters)"
}
```

**Validation:**
- Name: 2-100 characters
- Email: Valid email format
- Message: 10-2000 characters

### Submit Suggestion

```bash
POST https://us-central1-expenses-64949.cloudfunctions.net/submitSuggestion
Content-Type: application/json

{
  "suggestion": "Your feature suggestion (5-500 characters)"
}
```

**Validation:**
- Suggestion: 5-500 characters

## Integration with Landing Page

To use these endpoints in your landing page, replace direct Firestore writes with HTTP requests:

### Before (Direct Firestore Write):
```javascript
await db.collection('landing_waitlist').add({
  email: email,
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
```

### After (Rate-Limited Cloud Function):
```javascript
const response = await fetch('https://us-central1-expenses-64949.cloudfunctions.net/submitWaitlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: email })
});

const data = await response.json();

if (response.status === 429) {
  // Rate limited - show error to user
  alert('Too many requests. Please try again later.');
} else if (response.ok) {
  // Success
  alert('Successfully added to waitlist!');
} else {
  // Other error
  alert(data.error || 'An error occurred');
}
```

## Security Features

### Input Validation
- All inputs are validated for length and format
- Email addresses validated with regex
- XSS protection through input sanitization

### IP-Based Rate Limiting
- Tracks requests per IP address
- Prevents automated abuse
- Uses multiple header sources for IP detection:
  - `x-forwarded-for`
  - `x-real-ip`
  - `remoteAddress`

### CORS Configuration
- Allows all origins (can be restricted if needed)
- Supports OPTIONS preflight requests
- Proper CORS headers set

### Fail-Open Design
- If rate limit check fails, request is allowed
- Prevents legitimate users from being blocked due to technical issues
- Errors are logged for monitoring

## Firestore Security Rules

The `_rateLimits` collection is protected:

```javascript
match /_rateLimits/{docId} {
  // Only Cloud Functions can read/write rate limit documents
  // User-facing apps cannot access this collection
  allow read, write: if false;
}
```

This ensures only Cloud Functions (which run with admin privileges) can manage rate limits.

## Monitoring

### Cloud Function Logs

View rate limit events in Firebase Console:
1. Go to Functions → Logs
2. Filter by function name: `submitWaitlist`, `submitContact`, `submitSuggestion`
3. Look for log entries:
   - `Waitlist submission from {email} ({ip})`
   - `Rate limit exceeded for {ip} on {action}: {count} requests`

### Rate Limit Data

Query the `_rateLimits` collection (admin access required):

```javascript
const rateLimits = await admin.firestore()
  .collection('_rateLimits')
  .get();

rateLimits.forEach(doc => {
  const data = doc.data();
  console.log(`${doc.id}: ${data.requests.length} requests`);
});
```

## Deployment

Deploy the updated Cloud Functions:

```bash
cd /Users/mac/Development/Expenses
firebase deploy --only functions
```

This will deploy:
- `sendInvitationEmail`
- `cleanupExpiredInvitations`
- `submitWaitlist` (NEW)
- `submitContact` (NEW)
- `submitSuggestion` (NEW)
- `cleanupRateLimits` (NEW)

## Testing

### Test Rate Limiting

```bash
# Submit 4 times quickly (limit is 3 per hour)
for i in {1..4}; do
  curl -X POST \
    https://us-central1-expenses-64949.cloudfunctions.net/submitWaitlist \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  echo ""
  sleep 1
done
```

The 4th request should return a 429 status code.

## Cost Considerations

- Each rate limit check performs 1 Firestore transaction
- Firestore free tier: 20,000 writes/day
- With current limits, you can handle ~20,000 submissions/day before costs
- Typical landing page traffic should stay well within free tier

## Future Enhancements

1. **Firebase App Check**: Add device attestation for mobile apps
2. **Honeypot Fields**: Detect bot submissions
3. **reCAPTCHA**: Add CAPTCHA for high-risk actions
4. **IP Allowlist**: Whitelist trusted IPs (e.g., testing, monitoring)
5. **Rate Limit Tiers**: Different limits for authenticated vs anonymous users
6. **Analytics**: Track rate limit hits and patterns

## Troubleshooting

### Users Being Rate Limited Unfairly

**Possible causes:**
- Shared IP (corporate network, VPN)
- Proxy server issues

**Solutions:**
- Increase rate limits for specific endpoints
- Add user authentication to bypass IP-based limits
- Use session tokens instead of IP tracking

### Rate Limiting Not Working

**Check:**
1. Cloud Functions deployed correctly
2. Firestore rules allow `_rateLimits` for Cloud Functions
3. IP detection working (`unknown` IPs get separate tracking)
4. Logs showing rate limit checks

### High Firestore Costs

**Solutions:**
- Increase time window (less frequent cleanup)
- Use Redis or Memorystore instead of Firestore
- Implement client-side throttling

## Summary

✅ **Rate limiting implemented** for all public landing page endpoints
✅ **IP-based tracking** prevents automated abuse
✅ **Firestore security rules** protect rate limit data
✅ **Automatic cleanup** prevents data accumulation
✅ **CORS enabled** for web integration
✅ **Input validation** prevents malicious submissions
✅ **Fail-open design** ensures availability

The landing page is now protected against spam and abuse while maintaining a good user experience for legitimate visitors.
