import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Invitation Service
 * Handles user invitations for database sharing
 */

// Collection references
const USERS_COLLECTION = 'users';
const INVITATIONS_COLLECTION = 'invitations';
const SHARED_DATABASES_COLLECTION = 'sharedDatabases';

/**
 * Initialize user profile when they sign up
 * @param {string} userId - Firebase user ID
 * @param {string} email - User email
 * @param {string} displayName - User display name
 */
export const initializeUserProfile = async (userId, email, displayName) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);

    // Check if profile already exists
    const existingProfile = await getDoc(userRef);

    if (existingProfile.exists()) {
      // Profile exists, just update the display name if provided
      if (displayName) {
        await updateDoc(userRef, {
          displayName: displayName,
          updatedAt: serverTimestamp(),
        });
      }
      return { success: true, existed: true };
    }

    // Create new profile
    await setDoc(userRef, {
      email: email.toLowerCase(),
      displayName: displayName || email.split('@')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, existed: false };
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 * @param {string} userId - Firebase user ID
 * @param {Object} updates - Fields to update
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Find user by email
 * @param {string} email - Email to search for
 * @returns {Object|null} User data if found, null otherwise
 */
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Get current user's database ID
 * This returns the shared database ID if user is part of one, otherwise their own user ID
 * @param {string} userId - Firebase user ID
 * @returns {string} Database ID to use for queries
 */
export const getUserDatabaseId = async (userId) => {
  try {
    const sharedDbsRef = collection(db, SHARED_DATABASES_COLLECTION);
    const q = query(sharedDbsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // User is part of a shared database
      return querySnapshot.docs[0].id;
    }

    // User has their own database
    return userId;
  } catch (error) {
    console.error('Error getting user database ID:', error);
    return userId; // Fallback to user ID
  }
};

/**
 * Get shared database info
 * @param {string} databaseId - Shared database ID
 * @returns {Object|null} Shared database data
 */
export const getSharedDatabase = async (databaseId) => {
  try {
    const dbRef = doc(db, SHARED_DATABASES_COLLECTION, databaseId);
    const dbDoc = await getDoc(dbRef);

    if (!dbDoc.exists()) {
      return null;
    }

    return {
      id: dbDoc.id,
      ...dbDoc.data(),
    };
  } catch (error) {
    console.error('Error getting shared database:', error);
    return null;
  }
};

/**
 * Create or get shared database
 * @param {string} ownerId - Owner user ID
 * @param {string} ownerEmail - Owner email
 * @returns {string} Shared database ID
 */
const createOrGetSharedDatabase = async (ownerId, ownerEmail) => {
  try {
    // Check if owner already has a shared database
    const existingDb = await getUserDatabaseId(ownerId);

    // Check if this is already a shared database
    const sharedDbRef = doc(db, SHARED_DATABASES_COLLECTION, existingDb);
    const sharedDbDoc = await getDoc(sharedDbRef);

    if (sharedDbDoc.exists()) {
      return existingDb;
    }

    // Create new shared database
    const sharedDbId = ownerId; // Use owner's ID as the database ID
    await setDoc(sharedDbRef, {
      owner: ownerId,
      ownerEmail,
      members: [ownerId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return sharedDbId;
  } catch (error) {
    console.error('Error creating shared database:', error);
    throw error;
  }
};

/**
 * Send invitation to a user
 * @param {string} inviteeEmail - Email of user to invite
 * @returns {Object} Result with success status and invitation type
 */
export const sendInvitation = async (inviteeEmail) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    // Check if user is trying to invite themselves
    if (normalizedEmail === currentUser.email.toLowerCase()) {
      return {
        success: false,
        error: 'You cannot invite yourself'
      };
    }

    // Get current user's profile
    const currentUserRef = doc(db, USERS_COLLECTION, currentUser.uid);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();

    // Check if invitee is already registered
    const existingUser = await findUserByEmail(normalizedEmail);

    // Get or create shared database
    const sharedDbId = await createOrGetSharedDatabase(
      currentUser.uid,
      currentUser.email
    );

    if (existingUser) {
      // Check if user is already a member
      const sharedDb = await getSharedDatabase(sharedDbId);
      if (sharedDb && sharedDb.members.includes(existingUser.id)) {
        return {
          success: false,
          error: 'User is already a member of this database',
        };
      }

      // Check for existing pending invitation
      const invitationsRef = collection(db, INVITATIONS_COLLECTION);
      const existingInviteQuery = query(
        invitationsRef,
        where('inviteeId', '==', existingUser.id),
        where('databaseId', '==', sharedDbId),
        where('status', '==', 'pending')
      );
      const existingInvites = await getDocs(existingInviteQuery);

      if (!existingInvites.empty) {
        return {
          success: false,
          error: 'An invitation is already pending for this user',
        };
      }

      // Create in-app invitation for registered user
      const invitationRef = doc(collection(db, INVITATIONS_COLLECTION));
      await setDoc(invitationRef, {
        inviterId: currentUser.uid,
        inviterEmail: currentUser.email,
        inviterName: currentUserData?.displayName || currentUser.email.split('@')[0],
        inviteeId: existingUser.id,
        inviteeEmail: normalizedEmail,
        inviteeName: existingUser.displayName,
        databaseId: sharedDbId,
        type: 'in-app',
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      });

      return {
        success: true,
        type: 'in-app',
        message: 'In-app invitation sent successfully',
      };
    } else {
      // Create email invitation for unregistered user
      const invitationRef = doc(collection(db, INVITATIONS_COLLECTION));
      const invitationId = invitationRef.id;

      await setDoc(invitationRef, {
        inviterId: currentUser.uid,
        inviterEmail: currentUser.email,
        inviterName: currentUserData?.displayName || currentUser.email.split('@')[0],
        inviteeEmail: normalizedEmail,
        databaseId: sharedDbId,
        type: 'email',
        status: 'pending',
        invitationToken: invitationId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      });

      // Trigger cloud function to send email
      // The cloud function will listen to new documents in invitations collection
      // and send emails for type='email' invitations

      return {
        success: true,
        type: 'email',
        message: 'Email invitation will be sent shortly',
      };
    }
  } catch (error) {
    console.error('Error sending invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Accept an invitation
 * @param {string} invitationId - Invitation document ID
 */
export const acceptInvitation = async (invitationId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Verify invitation is for current user
    if (invitation.inviteeId !== currentUser.uid &&
        invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new Error('This invitation is not for you');
    }

    // Check if invitation is expired
    if (invitation.expiresAt.toDate() < new Date()) {
      await updateDoc(invitationRef, {
        status: 'expired',
        updatedAt: serverTimestamp(),
      });
      throw new Error('This invitation has expired');
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      throw new Error('This invitation is no longer valid');
    }

    // Add user to shared database members
    const sharedDbRef = doc(db, SHARED_DATABASES_COLLECTION, invitation.databaseId);
    const sharedDbDoc = await getDoc(sharedDbRef);

    if (!sharedDbDoc.exists()) {
      throw new Error('Shared database not found');
    }

    const sharedDb = sharedDbDoc.data();
    const updatedMembers = [...new Set([...sharedDb.members, currentUser.uid])];

    await updateDoc(sharedDbRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    // Update invitation status
    await updateDoc(invitationRef, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      databaseId: invitation.databaseId,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Reject an invitation
 * @param {string} invitationId - Invitation document ID
 */
export const rejectInvitation = async (invitationId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Verify invitation is for current user
    if (invitation.inviteeId !== currentUser.uid &&
        invitation.inviteeEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      throw new Error('This invitation is not for you');
    }

    await updateDoc(invitationRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Cancel an invitation (by inviter)
 * @param {string} invitationId - Invitation document ID
 */
export const cancelInvitation = async (invitationId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const invitationRef = doc(db, INVITATIONS_COLLECTION, invitationId);
    const invitationDoc = await getDoc(invitationRef);

    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data();

    // Verify current user is the inviter
    if (invitation.inviterId !== currentUser.uid) {
      throw new Error('You can only cancel your own invitations');
    }

    await updateDoc(invitationRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Subscribe to pending invitations for current user
 * @param {Function} callback - Called with array of pending invitations
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPendingInvitations = (callback) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const invitationsRef = collection(db, INVITATIONS_COLLECTION);
  const q = query(
    invitationsRef,
    where('inviteeEmail', '==', currentUser.email.toLowerCase()),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const invitations = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Check if not expired
      if (data.expiresAt.toDate() > new Date()) {
        invitations.push({
          id: doc.id,
          ...data,
        });
      }
    });
    callback(invitations);
  }, (error) => {
    console.error('Error subscribing to invitations:', error);
    callback([]);
  });
};

/**
 * Subscribe to sent invitations (by current user)
 * @param {Function} callback - Called with array of sent invitations
 * @returns {Function} Unsubscribe function
 */
export const subscribeToSentInvitations = (callback) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const invitationsRef = collection(db, INVITATIONS_COLLECTION);
  const q = query(
    invitationsRef,
    where('inviterId', '==', currentUser.uid)
  );

  return onSnapshot(q, (snapshot) => {
    const invitations = [];
    snapshot.forEach((doc) => {
      invitations.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(invitations);
  }, (error) => {
    console.error('Error subscribing to sent invitations:', error);
    callback([]);
  });
};

/**
 * Get all members of current user's shared database
 * @returns {Array} Array of member objects with user info
 */
export const getDatabaseMembers = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return [];
    }

    const databaseId = await getUserDatabaseId(currentUser.uid);
    const sharedDb = await getSharedDatabase(databaseId);

    if (!sharedDb) {
      return []; // No shared database
    }

    // Get user info for all members
    const members = await Promise.all(
      sharedDb.members.map(async (memberId) => {
        const userRef = doc(db, USERS_COLLECTION, memberId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          return {
            id: memberId,
            ...userDoc.data(),
            isOwner: memberId === sharedDb.owner,
          };
        }
        return null;
      })
    );

    return members.filter(m => m !== null);
  } catch (error) {
    console.error('Error getting database members:', error);
    return [];
  }
};

/**
 * Remove a member from shared database
 * @param {string} memberId - User ID to remove
 */
export const removeMember = async (memberId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const databaseId = await getUserDatabaseId(currentUser.uid);
    const sharedDb = await getSharedDatabase(databaseId);

    if (!sharedDb) {
      throw new Error('No shared database found');
    }

    // Full access mode - any member can remove others
    // Remove owner check since everyone has full access

    if (memberId === sharedDb.owner) {
      throw new Error('Cannot remove the database owner');
    }

    const updatedMembers = sharedDb.members.filter(id => id !== memberId);

    const sharedDbRef = doc(db, SHARED_DATABASES_COLLECTION, databaseId);
    await updateDoc(sharedDbRef, {
      members: updatedMembers,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Leave a shared database
 */
export const leaveSharedDatabase = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    return await removeMember(currentUser.uid);
  } catch (error) {
    console.error('Error leaving shared database:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
