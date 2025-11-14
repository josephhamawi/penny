import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Account Deletion Service
 * Handles permanent deletion of user account and all associated data
 */

const USERS_COLLECTION = 'users';
const INVITATIONS_COLLECTION = 'invitations';
const SHARED_DATABASES_COLLECTION = 'sharedDatabases';

/**
 * Check if user owns any shared databases
 * @param {string} userId - Firebase user ID
 * @returns {Promise<Array>} - Array of owned shared databases
 */
export const getUserOwnedSharedDatabases = async (userId) => {
  try {
    const sharedDbsRef = collection(db, SHARED_DATABASES_COLLECTION);
    const q = query(sharedDbsRef, where('owner', '==', userId));
    const snapshot = await getDocs(q);

    const ownedDatabases = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      ownedDatabases.push({
        id: doc.id,
        ...data,
      });
    });

    return ownedDatabases;
  } catch (error) {
    console.error('Error checking owned shared databases:', error);
    throw error;
  }
};

/**
 * Delete all user data from Firestore
 * Deletes: expenses, settings, goals, personalityReports, profile
 * @param {string} userId - Firebase user ID
 */
export const deleteUserData = async (userId) => {
  try {
    console.log(`Starting data deletion for user: ${userId}`);

    // Delete subcollections in batches
    const subcollections = ['expenses', 'settings', 'goals', 'personalityReports'];

    for (const subcollection of subcollections) {
      const subcollectionRef = collection(db, `${USERS_COLLECTION}/${userId}/${subcollection}`);
      const snapshot = await getDocs(subcollectionRef);

      if (!snapshot.empty) {
        // Batch delete (max 500 per batch)
        const batches = [];
        let currentBatch = writeBatch(db);
        let batchCount = 0;

        snapshot.forEach((docSnap) => {
          currentBatch.delete(docSnap.ref);
          batchCount++;

          if (batchCount === 500) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        });

        if (batchCount > 0) {
          batches.push(currentBatch);
        }

        // Commit all batches
        for (const batch of batches) {
          await batch.commit();
        }

        console.log(`Deleted ${snapshot.size} documents from ${subcollection}`);
      }
    }

    // Delete invitations where user is inviter or invitee
    const invitationsRef = collection(db, INVITATIONS_COLLECTION);
    const inviterQuery = query(invitationsRef, where('inviterId', '==', userId));
    const inviteeQuery = query(invitationsRef, where('inviteeId', '==', userId));

    const [inviterSnapshot, inviteeSnapshot] = await Promise.all([
      getDocs(inviterQuery),
      getDocs(inviteeQuery),
    ]);

    const invitationDeletions = [];
    inviterSnapshot.forEach((doc) => invitationDeletions.push(deleteDoc(doc.ref)));
    inviteeSnapshot.forEach((doc) => invitationDeletions.push(deleteDoc(doc.ref)));

    await Promise.all(invitationDeletions);
    console.log(`Deleted ${invitationDeletions.length} invitations`);

    // Remove user from shared databases (as member, not owner)
    const sharedDbsRef = collection(db, SHARED_DATABASES_COLLECTION);
    const memberQuery = query(sharedDbsRef, where('members', 'array-contains', userId));
    const memberSnapshot = await getDocs(memberQuery);

    const memberUpdates = [];
    memberSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.owner !== userId) {
        // Remove user from members array
        const updatedMembers = data.members.filter(id => id !== userId);
        memberUpdates.push(
          deleteDoc(doc(db, SHARED_DATABASES_COLLECTION, docSnap.id))
            .then(() => {
              // Re-create with updated members
              return setDoc(doc(db, SHARED_DATABASES_COLLECTION, docSnap.id), {
                ...data,
                members: updatedMembers,
              });
            })
        );
      }
    });

    await Promise.all(memberUpdates);
    console.log(`Removed user from ${memberUpdates.length} shared databases`);

    // Delete user profile document
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    console.log('Deleted user profile document');

    return {
      success: true,
      message: 'All user data deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};

/**
 * Delete Firebase Authentication account
 * @param {Object} user - Firebase auth user object
 */
export const deleteAuthAccount = async (user) => {
  try {
    await user.delete();
    console.log('Firebase Auth account deleted');
    return { success: true };
  } catch (error) {
    console.error('Error deleting auth account:', error);
    throw error;
  }
};

/**
 * Complete account deletion process
 * 1. Check for owned shared databases
 * 2. Delete all Firestore data
 * 3. Delete Firebase Auth account
 * @param {string} userId - Firebase user ID
 * @param {Object} user - Firebase auth user object
 * @returns {Promise<Object>} - Result with success status
 */
export const deleteAccount = async (userId, user) => {
  try {
    // Check for owned shared databases
    const ownedDatabases = await getUserOwnedSharedDatabases(userId);

    if (ownedDatabases.length > 0) {
      // Check if any have other members
      const dbsWithMembers = ownedDatabases.filter(
        db => db.members && db.members.length > 1
      );

      if (dbsWithMembers.length > 0) {
        return {
          success: false,
          error: 'transfer_ownership',
          message: `You own ${dbsWithMembers.length} shared database(s) with other members. Please transfer ownership or remove all members before deleting your account.`,
          databases: dbsWithMembers,
        };
      }
    }

    // Delete all user data from Firestore
    await deleteUserData(userId);

    // Delete Firebase Auth account
    await deleteAuthAccount(user);

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  } catch (error) {
    console.error('Complete account deletion failed:', error);
    return {
      success: false,
      error: error.code || 'unknown',
      message: error.message || 'Failed to delete account',
    };
  }
};
