const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

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
