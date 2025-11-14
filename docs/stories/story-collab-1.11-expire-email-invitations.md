# Story 1.11: Expire and Notify Users of Old Email Invitations

## Metadata
- **Story ID:** COLLAB-1.11
- **Epic:** Code-Based Collaboration System Redesign
- **Status:** Ready for Development
- **Priority:** P2 (Cleanup/communication)
- **Estimated Effort:** 3 hours
- **Assigned To:** James (Dev)

---

## User Story

**As a** user with pending email invitations,
**I want** to be notified that email invitations are no longer supported,
**so that** I understand why my invitations were expired.

---

## Story Context

### Existing System Integration
- **Integrates with:** Firestore `invitations` collection, notification system
- **Technology:** Node.js script or Cloud Function, Firestore batch updates
- **Follows pattern:** Migration/cleanup scripts
- **Touch points:**
  - Create script/function to expire email invitations
  - Send in-app notifications to affected users
  - Update invitation documents in Firestore

### Current System Behavior
Some users may have pending email invitations (`type: 'email'`) from before the code-based system launch. These invitations are no longer valid.

### Enhancement Details
Create script/function that:
1. Finds all pending email invitations (`type: 'email'`, `status: 'pending'`)
2. Marks them as expired
3. Sends in-app notifications to users explaining the change
4. Provides link to Settings to view collab code

---

## Acceptance Criteria

### Email Invitation Expiration

**AC1: Find Pending Email Invitations**
- [ ] Query `invitations` collection where `type == 'email'` and `status == 'pending'`
- [ ] Return list of all matching invitations
- [ ] Log count of invitations to expire

**AC2: Mark Invitations as Expired**
- [ ] Update invitation documents: `status: 'expired'`
- [ ] Add field: `expiredReason: 'email-invitations-deprecated'`
- [ ] Add timestamp: `expiredAt: serverTimestamp()`
- [ ] Use batch writes for efficiency

**AC3: Preserve Historical Data**
- [ ] Do not delete expired invitations
- [ ] Keep invitation data for audit trail
- [ ] Mark as expired, not deleted

### User Notification

**AC4: Notify Invitees**
- [ ] For each expired invitation, send in-app notification to invitee
- [ ] Message: "Email invitations are no longer supported. Use collab codes to collaborate with registered users."
- [ ] Include link/button to Settings screen to view their collab code
- [ ] Notification appears in app on next launch

**AC5: Notify Inviters**
- [ ] Send in-app notification to users who sent expired invitations
- [ ] Message: "Your pending invitation to [email] has expired. Email invitations are no longer supported. Use collab codes instead."
- [ ] Include link to collaboration screen

**AC6: Grace Period (Optional)**
- [ ] Consider 7-day grace period before expiration
- [ ] Send warning notification 7 days before expiration
- [ ] Final expiration after 7 days

### Error Handling

**AC7: Handle Large Datasets**
- [ ] Support expiring hundreds of invitations efficiently
- [ ] Use batch writes (500 per batch)
- [ ] Log progress

**AC8: Handle Notification Failures**
- [ ] If notification fails, log error but continue
- [ ] Don't block expiration on notification failure
- [ ] Retry failed notifications (up to 3 times)

### Quality Requirements

**AC9: Logging**
- [ ] Log total invitations expired
- [ ] Log successful notifications sent
- [ ] Log failed notifications
- [ ] Provide summary report

**AC10: Testing**
- [ ] Test with sample email invitations in Firestore Emulator
- [ ] Verify invitations marked as expired
- [ ] Verify notifications sent
- [ ] Test idempotency (safe to run multiple times)

---

## Technical Implementation Notes

### Option 1: Node.js Script (Recommended for one-time migration)

**scripts/expire-email-invitations.js**

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Expire all pending email invitations
 */
async function expireEmailInvitations() {
  console.log('Starting email invitation expiration...');

  try {
    // Find all pending email invitations
    const invitationsRef = db.collection('invitations');
    const query = invitationsRef
      .where('type', '==', 'email')
      .where('status', '==', 'pending');

    const snapshot = await query.get();

    console.log(`Found ${snapshot.size} pending email invitations to expire`);

    if (snapshot.empty) {
      console.log('No email invitations to expire');
      return;
    }

    // Prepare batch updates
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    const invitationsData = [];

    snapshot.forEach((doc) => {
      invitationsData.push({
        id: doc.id,
        data: doc.data(),
      });

      currentBatch.update(doc.ref, {
        status: 'expired',
        expiredReason: 'email-invitations-deprecated',
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      batchCount++;

      if (batchCount === 500) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        batchCount = 0;
      }
    });

    if (batchCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    console.log(`Expiring invitations in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`Batch ${i + 1}/${batches.length} committed`);
    }

    console.log('✓ All email invitations expired');

    // Send notifications
    console.log('Sending notifications...');

    const notificationsSent = [];
    const notificationsFailed = [];

    for (const invitation of invitationsData) {
      try {
        // Notify invitee
        if (invitation.data.inviteeId) {
          await sendNotification(invitation.data.inviteeId, {
            title: 'Invitation Expired',
            message: 'Email invitations are no longer supported. Use collab codes to collaborate with registered users.',
            type: 'info',
            actionLabel: 'View My Code',
            actionRoute: 'Settings',
          });
          notificationsSent.push(invitation.data.inviteeEmail);
        }

        // Notify inviter
        if (invitation.data.inviterId) {
          await sendNotification(invitation.data.inviterId, {
            title: 'Invitation Expired',
            message: `Your pending invitation to ${invitation.data.inviteeEmail} has expired. Email invitations are no longer supported. Use collab codes instead.`,
            type: 'info',
            actionLabel: 'Learn More',
            actionRoute: 'Collaboration',
          });
        }
      } catch (error) {
        console.error(`Failed to send notification for invitation ${invitation.id}:`, error);
        notificationsFailed.push(invitation.id);
      }
    }

    console.log('='.repeat(60));
    console.log('Expiration Complete');
    console.log(`Invitations expired: ${snapshot.size}`);
    console.log(`Notifications sent: ${notificationsSent.length}`);
    console.log(`Notifications failed: ${notificationsFailed.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Expiration failed:', error);
    throw error;
  }
}

/**
 * Send in-app notification to user
 * (Implement based on your notification system)
 */
async function sendNotification(userId, notification) {
  // Option 1: Create notification document in Firestore
  const notificationRef = db.collection('notifications').doc();
  await notificationRef.set({
    userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    actionLabel: notification.actionLabel,
    actionRoute: notification.actionRoute,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Option 2: Use Firebase Cloud Messaging (FCM)
  // const message = {
  //   notification: {
  //     title: notification.title,
  //     body: notification.message,
  //   },
  //   token: userDeviceToken,
  // };
  // await admin.messaging().send(message);
}

// Run expiration
expireEmailInvitations()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
```

### Option 2: Cloud Function (Recommended for scheduled/automated expiration)

```javascript
// functions/src/expire-email-invitations.js
exports.expireEmailInvitations = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .onRun(async (context) => {
    const db = admin.firestore();

    // Find pending email invitations older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const invitationsRef = db.collection('invitations');
    const query = invitationsRef
      .where('type', '==', 'email')
      .where('status', '==', 'pending')
      .where('createdAt', '<', sevenDaysAgo);

    const snapshot = await query.get();

    // ... rest of expiration logic
  });
```

### In-App Notification Display

Update app to display notifications:

```javascript
// In SettingsScreen or Header component
const [notifications, setNotifications] = useState([]);

useEffect(() => {
  const unsubscribe = db
    .collection('notifications')
    .where('userId', '==', auth.currentUser.uid)
    .where('read', '==', false)
    .onSnapshot((snapshot) => {
      const newNotifications = [];
      snapshot.forEach((doc) => {
        newNotifications.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(newNotifications);
    });

  return () => unsubscribe();
}, []);

// Display notification banner
{notifications.map((notif) => (
  <View key={notif.id} style={styles.notificationBanner}>
    <Text style={styles.notificationTitle}>{notif.title}</Text>
    <Text style={styles.notificationMessage}>{notif.message}</Text>
    {notif.actionRoute && (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate(notif.actionRoute);
          markNotificationAsRead(notif.id);
        }}
      >
        <Text style={styles.notificationAction}>{notif.actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
))}
```

---

## Integration Verification

### IV1: Accepted/Rejected Invitations Unaffected
**Verification Steps:**
1. Create test invitations with status 'accepted' and 'rejected'
2. Run expiration script
3. Verify accepted/rejected invitations remain unchanged
4. Only pending email invitations expired

**Expected Result:** Only pending email invitations affected

### IV2: Code-Based Invitations Unaffected
**Verification Steps:**
1. Create test code-based invitations (`type: 'code-based'`)
2. Run expiration script
3. Verify code-based invitations remain pending
4. No code-based invitations expired

**Expected Result:** Code-based invitations work normally

### IV3: Notification System Works
**Verification Steps:**
1. Expire test email invitation
2. Check invitee receives notification
3. Check inviter receives notification
4. Tap notification action → Navigate to correct screen

**Expected Result:** Notifications appear and function correctly

---

## Definition of Done

- [ ] All Acceptance Criteria (AC1-AC10) are met
- [ ] Script/function created to expire email invitations
- [ ] Batch update logic implemented
- [ ] In-app notifications sent to affected users
- [ ] Notification display implemented in app
- [ ] Tested with Firebase Emulator
- [ ] Tested with production (dry run first if applicable)
- [ ] Integration verification (IV1-IV3) completed successfully
- [ ] Logging and reporting implemented

---

## Dev Agent Record

### Tasks
- [ ] Task 1: Create `scripts/expire-email-invitations.js` OR Cloud Function
- [ ] Task 2: Implement query for pending email invitations
- [ ] Task 3: Implement batch expiration logic
- [ ] Task 4: Implement notification sending for invitees
- [ ] Task 5: Implement notification sending for inviters
- [ ] Task 6: Implement in-app notification display component
- [ ] Task 7: Add logging and reporting
- [ ] Task 8: Test with Firebase Emulator
- [ ] Task 9: Run on production
- [ ] Task 10: Verify integration verification steps (IV1-IV3)

### Debug Log
<!-- Dev: Add debug notes here during implementation -->

### Completion Notes
<!-- Dev: Add completion summary here -->

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2025-11-13 | Story created from PRD | John (PM) |

---

## Dependencies

**Blocks:**
- None (cleanup task)

**Blocked By:**
- Story 1.8 (Remove Email Invitation Code) - Should remove code before expiring

---

## Additional Notes

### Timing
- Run this 7 days after deploying code-based system
- Give users time to understand the change
- Send warning notification 7 days before expiration (optional)

### Communication Strategy
1. **Day 0:** Deploy code-based system
2. **Day 1:** Send in-app announcement about new system
3. **Day 7:** Send expiration warning
4. **Day 14:** Run expiration script

### PM Notes
- This is a user communication task, not just technical
- Be empathetic in messaging (users may be confused)
- Provide clear instructions on using collab codes
- Monitor support tickets after expiration
- Consider email communication in addition to in-app notifications
- Track how many invitations are expired (product metric)
