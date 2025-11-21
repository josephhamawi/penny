const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ============================================
// RATE LIMITING UTILITY
// ============================================

/**
 * Rate limiter using Firestore to track requests per IP
 * @param {string} ip - Client IP address
 * @param {string} action - Action type (e.g., 'waitlist', 'contact', 'suggestion')
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<boolean>} - true if allowed, false if rate limited
 */
async function checkRateLimit(ip, action, maxRequests = 5, windowMs = 60000) {
  const db = admin.firestore();
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean IP for use as document ID
  const ipKey = ip.replace(/[^a-zA-Z0-9]/g, '_');
  const rateLimitRef = db.collection('_rateLimits').doc(`${action}_${ipKey}`);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);

      if (!doc.exists) {
        // First request - create document
        transaction.set(rateLimitRef, {
          requests: [now],
          lastCleanup: now,
          expiresAt: admin.firestore.Timestamp.fromMillis(now + windowMs)
        });
        return true;
      }

      const data = doc.data();
      let requests = data.requests || [];

      // Remove expired requests
      requests = requests.filter(timestamp => timestamp > windowStart);

      // Check if limit exceeded
      if (requests.length >= maxRequests) {
        console.log(`Rate limit exceeded for ${ip} on ${action}: ${requests.length} requests`);
        return false;
      }

      // Add current request
      requests.push(now);

      transaction.update(rateLimitRef, {
        requests,
        lastCleanup: now,
        expiresAt: admin.firestore.Timestamp.fromMillis(now + windowMs)
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return true;
  }
}

/**
 * Extract client IP from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Cloud Function to send email invitations
 * Triggers when a new invitation document is created with type='email'
 */
exports.sendInvitationEmail = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const invitation = snap.data();
    const invitationId = context.params.invitationId;

    // Only process email type invitations
    if (invitation.type !== 'email') {
      console.log('Skipping non-email invitation:', invitationId);
      return null;
    }

    // Only send if status is pending
    if (invitation.status !== 'pending') {
      console.log('Skipping non-pending invitation:', invitationId);
      return null;
    }

    try {
      // Configure email transport (Gmail with nodemailer)
      const emailUser = functions.config().email?.user || process.env.EMAIL_USER;
      const emailPass = functions.config().email?.password || process.env.EMAIL_PASSWORD;

      if (!emailUser || !emailPass) {
        console.error('Email credentials not configured');
        await snap.ref.update({
          emailSent: false,
          emailError: 'Email credentials not configured. Set via: firebase functions:config:set email.user="..." email.password="..."',
          emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      // Create invitation link
      // This should point to your app's deep link or web app
      const appName = 'Spensely';
      const invitationLink = `https://yourapp.com/accept-invite?token=${invitationId}`;
      // Or use a deep link for mobile:
      // const invitationLink = `spensely://accept-invite?token=${invitationId}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #00D9FF, #00B8D4);
              color: white;
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 12px 12px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #00D9FF, #00B8D4);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: 600;
            }
            .info-box {
              background: #e8f5fe;
              border-left: 4px solid #00D9FF;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${appName}</h1>
            <p>You've been invited to collaborate!</p>
          </div>
          <div class="content">
            <h2>Hi there!</h2>
            <p>
              <strong>${invitation.inviterName}</strong> (${invitation.inviterEmail})
              has invited you to collaborate on their expense tracking database.
            </p>

            <div class="info-box">
              <strong>What you'll get access to:</strong>
              <ul>
                <li>Shared expense tracking and budget management</li>
                <li>Real-time updates across all devices</li>
                <li>Collaborative Google Sheets integration</li>
                <li>Goal tracking and financial insights</li>
              </ul>
            </div>

            <p>
              Everyone in the shared database has full access to view, edit, and manage expenses,
              goals, budgets, and can invite other users.
            </p>

            <center>
              <a href="${invitationLink}" class="button">Accept Invitation</a>
            </center>

            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <code>${invitationLink}</code>
            </p>

            <p style="color: #666; font-size: 14px;">
              <strong>Note:</strong> This invitation will expire in 7 days.
            </p>

            <p>
              If you don't have the ${appName} app yet, you'll need to download it
              and create an account with this email address (<strong>${invitation.inviteeEmail}</strong>)
              before accepting the invitation.
            </p>
          </div>
          <div class="footer">
            <p>
              This is an automated email from ${appName}.
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `;

      const emailText = `
        ${appName} - Collaboration Invitation

        Hi there!

        ${invitation.inviterName} (${invitation.inviterEmail}) has invited you to collaborate on their expense tracking database.

        What you'll get access to:
        - Shared expense tracking and budget management
        - Real-time updates across all devices
        - Collaborative Google Sheets integration
        - Goal tracking and financial insights

        Everyone in the shared database has full access to view, edit, and manage expenses, goals, budgets, and can invite other users.

        To accept this invitation, click the link below or paste it into your browser:
        ${invitationLink}

        Note: This invitation will expire in 7 days.

        If you don't have the ${appName} app yet, you'll need to download it and create an account with this email address (${invitation.inviteeEmail}) before accepting the invitation.

        ---
        This is an automated email from ${appName}. If you weren't expecting this invitation, you can safely ignore this email.
      `;

      // Send email using nodemailer
      const mailOptions = {
        from: `"${appName}" <${emailUser}>`,
        to: invitation.inviteeEmail,
        subject: `You've been invited to join ${appName} by ${invitation.inviterName}`,
        text: emailText,
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);

      console.log('Invitation email sent successfully to:', invitation.inviteeEmail);

      // Update invitation document to mark email as sent
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error('Error sending invitation email:', error);

      // Update invitation document to mark email sending failed
      await snap.ref.update({
        emailSent: false,
        emailError: error.message,
        emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Don't throw - we don't want to retry automatically
      return null;
    }
  });

/**
 * Cleanup expired invitations
 * Runs daily at midnight
 */
exports.cleanupExpiredInvitations = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Find all expired pending invitations
      const expiredInvitations = await db
        .collection('invitations')
        .where('status', '==', 'pending')
        .where('expiresAt', '<=', now)
        .get();

      console.log(`Found ${expiredInvitations.size} expired invitations to clean up`);

      // Update them to expired status
      const batch = db.batch();
      expiredInvitations.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      console.log('Expired invitations cleanup completed');
      return null;
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
      return null;
    }
  });

// ============================================
// RATE-LIMITED LANDING PAGE ENDPOINTS
// ============================================

/**
 * Submit to waitlist with rate limiting
 * Rate limit: 3 submissions per hour per IP
 */
exports.submitWaitlist = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIp = getClientIp(req);
  const { email } = req.body;

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }

  // Rate limiting: 3 requests per hour
  const allowed = await checkRateLimit(clientIp, 'waitlist', 3, 3600000);
  if (!allowed) {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 3600 // seconds
    });
    return;
  }

  try {
    const db = admin.firestore();
    const emailId = email.toLowerCase().replace(/[^a-z0-9]/g, '_');

    await db.collection('landing_waitlist').doc(emailId).set({
      email: email.toLowerCase(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: clientIp,
      source: 'landing_page'
    }, { merge: true });

    console.log(`Waitlist submission from ${email} (${clientIp})`);
    res.status(200).json({ success: true, message: 'Successfully added to waitlist' });
  } catch (error) {
    console.error('Error submitting to waitlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Submit contact form with rate limiting
 * Rate limit: 5 submissions per hour per IP
 */
exports.submitContact = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIp = getClientIp(req);
  const { name, email, message } = req.body;

  // Validate inputs
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email address' });
    return;
  }
  if (!name || name.length < 2 || name.length > 100) {
    res.status(400).json({ error: 'Invalid name' });
    return;
  }
  if (!message || message.length < 10 || message.length > 2000) {
    res.status(400).json({ error: 'Message must be between 10 and 2000 characters' });
    return;
  }

  // Rate limiting: 5 requests per hour
  const allowed = await checkRateLimit(clientIp, 'contact', 5, 3600000);
  if (!allowed) {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 3600
    });
    return;
  }

  try {
    const db = admin.firestore();

    await db.collection('landing_contact_messages').add({
      name,
      email: email.toLowerCase(),
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: clientIp,
      read: false
    });

    console.log(`Contact form submission from ${email} (${clientIp})`);
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Submit suggestion with rate limiting
 * Rate limit: 10 submissions per hour per IP
 */
exports.submitSuggestion = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const clientIp = getClientIp(req);
  const { suggestion } = req.body;

  // Validate input
  if (!suggestion || suggestion.length < 5 || suggestion.length > 500) {
    res.status(400).json({ error: 'Suggestion must be between 5 and 500 characters' });
    return;
  }

  // Rate limiting: 10 requests per hour
  const allowed = await checkRateLimit(clientIp, 'suggestion', 10, 3600000);
  if (!allowed) {
    res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 3600
    });
    return;
  }

  try {
    const db = admin.firestore();

    await db.collection('landing_suggestions').add({
      suggestion,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: clientIp,
      read: false,
      votes: 0
    });

    console.log(`Suggestion submission from ${clientIp}`);
    res.status(200).json({ success: true, message: 'Suggestion submitted successfully' });
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Cleanup old rate limit documents
 * Runs daily to remove expired rate limit entries
 */
exports.cleanupRateLimits = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // Delete expired rate limit documents
      const expiredDocs = await db
        .collection('_rateLimits')
        .where('expiresAt', '<=', now)
        .get();

      console.log(`Found ${expiredDocs.size} expired rate limit documents to clean up`);

      const batch = db.batch();
      expiredDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('Rate limit cleanup completed');
      return null;
    } catch (error) {
      console.error('Error cleaning up rate limits:', error);
      return null;
    }
  });
