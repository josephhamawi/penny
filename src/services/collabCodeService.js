import * as Crypto from 'expo-crypto';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Collab Code Service
 * Handles generation and validation of persistent collaboration codes
 */

// Constants
export const COLLAB_CODE_PREFIX = 'PENNY-';
export const COLLAB_CODE_LENGTH = 4;
export const MAX_COLLISION_RETRIES = 10;

const USERS_COLLECTION = 'users';

/**
 * Generate a random 4-digit code
 * Uses crypto.getRandomValues for cryptographic randomness
 * @returns {string} - 4-digit string with leading zeros (e.g., "0123")
 */
export const generateRandomCode = () => {
  // Generate random bytes and convert to number in range 0-9999
  const randomBytes = Crypto.getRandomBytes(2); // 2 bytes = 16 bits
  const randomValue = (randomBytes[0] << 8) | randomBytes[1]; // Combine bytes
  const code = randomValue % 10000; // Modulo to get 0-9999 range

  // Pad with leading zeros to ensure 4 digits
  return code.toString().padStart(COLLAB_CODE_LENGTH, '0');
};

/**
 * Check if a collab code already exists in Firestore
 * @param {string} code - The code to check (without prefix, e.g., "4729")
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
export const collabCodeExists = async (code) => {
  try {
    const fullCode = `${COLLAB_CODE_PREFIX}${code}`;
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('collabCode', '==', fullCode));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if collab code exists:', error);
    throw error;
  }
};

/**
 * Generate a unique collab code for a user
 * Retries on collision up to MAX_COLLISION_RETRIES times
 * @returns {Promise<string>} - Unique collab code (e.g., "PENNY-4729")
 * @throws {Error} - If unable to generate unique code after retries
 */
export const generateUniqueCollabCode = async () => {
  let attempts = 0;

  while (attempts < MAX_COLLISION_RETRIES) {
    const code = generateRandomCode();
    const fullCode = `${COLLAB_CODE_PREFIX}${code}`;

    // Check if code already exists
    const exists = await collabCodeExists(code);

    if (!exists) {
      // Found unique code
      return fullCode;
    }

    // Collision detected, log and retry
    console.warn(`Collab code collision detected: ${fullCode}. Retrying... (attempt ${attempts + 1}/${MAX_COLLISION_RETRIES})`);
    attempts++;
  }

  // Exhausted all retries
  throw new Error(`Failed to generate unique collab code after ${MAX_COLLISION_RETRIES} attempts`);
};

/**
 * Get user's collab code by userId
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string|null>} - Collab code or null if not set
 */
export const getUserCollabCode = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return userData.collabCode || null;
  } catch (error) {
    console.error('Error getting user collab code:', error);
    throw error;
  }
};

/**
 * Validate collab code format
 * @param {string} code - Code to validate (e.g., "PENNY-1234")
 * @returns {boolean} - True if valid format
 */
export const validateCollabCodeFormat = (code) => {
  // Regex: Matches PENNY- followed by exactly 4 digits
  const regex = /^PENNY-\d{4}$/;
  return regex.test(code);
};

/**
 * Find user by collab code
 * @param {string} code - Collab code to search for (e.g., "PENNY-1234")
 * @returns {Promise<Object|null>} - User data if found, null otherwise
 */
export const findUserByCollabCode = async (code) => {
  try {
    // Validate format first
    if (!validateCollabCodeFormat(code)) {
      return null;
    }

    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('collabCode', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error('Error finding user by collab code:', error);
    throw error;
  }
};
