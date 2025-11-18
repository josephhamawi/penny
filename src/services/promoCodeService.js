import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, updateDoc, setDoc, increment, Timestamp } from 'firebase/firestore';

/**
 * Promo Code Service
 *
 * Manages promo codes for granting complimentary access to AI features
 */

/**
 * Validate and redeem a promo code
 * @param {string} code - The promo code to validate
 * @param {string} userId - The user ID attempting to redeem
 * @returns {Promise<{success: boolean, message: string, codeData?: object}>}
 */
export const redeemPromoCode = async (code, userId) => {
  try {
    console.log('[PromoCode] Attempting to redeem code:', code, 'for user:', userId);

    // Normalize code (uppercase, trim)
    const normalizedCode = code.trim().toUpperCase();

    // Query for the promo code
    const promoCodesRef = collection(db, 'promoCodes');
    const q = query(promoCodesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('[PromoCode] Code not found:', normalizedCode);
      return {
        success: false,
        message: 'Invalid promo code'
      };
    }

    const promoDoc = querySnapshot.docs[0];
    const promoData = promoDoc.data();

    console.log('[PromoCode] Found code:', promoData);

    // Validate code is active
    if (!promoData.active) {
      return {
        success: false,
        message: 'This promo code is no longer active'
      };
    }

    // Validate expiration
    if (promoData.expiresAt && promoData.expiresAt.toDate() < new Date()) {
      return {
        success: false,
        message: 'This promo code has expired'
      };
    }

    // Validate max uses
    if (promoData.maxUses !== null && promoData.usedCount >= promoData.maxUses) {
      return {
        success: false,
        message: 'This promo code has reached its usage limit'
      };
    }

    // Check if user already has promo access
    const userPromoStatus = await getUserPromoStatus(userId);
    if (userPromoStatus.hasPromoAccess) {
      return {
        success: false,
        message: `You already have promo access via code: ${userPromoStatus.promoCode}`
      };
    }

    // Redeem the code
    // 1. Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      promoCode: normalizedCode,
      promoActivatedAt: Timestamp.now(),
      hasPromoAccess: true
    });

    // 2. Increment usage counter
    const promoRef = doc(db, 'promoCodes', promoDoc.id);
    await updateDoc(promoRef, {
      usedCount: increment(1)
    });

    console.log('[PromoCode] Successfully redeemed code:', normalizedCode);

    return {
      success: true,
      message: 'Promo code activated! You now have full access to AI features.',
      codeData: promoData
    };

  } catch (error) {
    console.error('[PromoCode] Error redeeming code:', error);
    return {
      success: false,
      message: 'Failed to redeem promo code. Please try again.'
    };
  }
};

/**
 * Get user's promo code status
 * @param {string} userId - The user ID
 * @returns {Promise<{hasPromoAccess: boolean, promoCode: string|null, activatedAt: Date|null}>}
 */
export const getUserPromoStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        hasPromoAccess: false,
        promoCode: null,
        activatedAt: null
      };
    }

    const userData = userDoc.data();

    return {
      hasPromoAccess: userData.hasPromoAccess || false,
      promoCode: userData.promoCode || null,
      activatedAt: userData.promoActivatedAt ? userData.promoActivatedAt.toDate() : null
    };

  } catch (error) {
    console.error('[PromoCode] Error getting user promo status:', error);
    return {
      hasPromoAccess: false,
      promoCode: null,
      activatedAt: null
    };
  }
};

/**
 * Check if user has AI feature access (either via subscription or promo code)
 * @param {string} userId - The user ID
 * @returns {Promise<{hasAccess: boolean, source: 'subscription'|'promo'|'none'}>}
 */
export const checkAIFeatureAccess = async (userId) => {
  try {
    // Check promo access first (faster than RevenueCat)
    const promoStatus = await getUserPromoStatus(userId);

    if (promoStatus.hasPromoAccess) {
      console.log('[PromoCode] User has AI access via promo code:', promoStatus.promoCode);
      return {
        hasAccess: true,
        source: 'promo'
      };
    }

    // If no promo access, check subscription
    // This would be integrated with your existing subscription service
    // For now, return no access
    return {
      hasAccess: false,
      source: 'none'
    };

  } catch (error) {
    console.error('[PromoCode] Error checking AI feature access:', error);
    return {
      hasAccess: false,
      source: 'none'
    };
  }
};

/**
 * Revoke promo access from a user (admin function)
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const revokePromoAccess = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      promoCode: null,
      promoActivatedAt: null,
      hasPromoAccess: false
    });

    return {
      success: true,
      message: 'Promo access revoked successfully'
    };

  } catch (error) {
    console.error('[PromoCode] Error revoking promo access:', error);
    return {
      success: false,
      message: 'Failed to revoke promo access'
    };
  }
};

/**
 * ADMIN: Create a new promo code
 * @param {object} codeData - The promo code data
 * @returns {Promise<{success: boolean, message: string, codeId?: string}>}
 */
export const createPromoCode = async (codeData) => {
  try {
    const {
      code,
      type = 'full_access',
      maxUses = null,
      expiresAt = null,
      createdBy = 'admin'
    } = codeData;

    // Normalize code
    const normalizedCode = code.trim().toUpperCase();

    // Check if code already exists
    const promoCodesRef = collection(db, 'promoCodes');
    const q = query(promoCodesRef, where('code', '==', normalizedCode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        success: false,
        message: 'A promo code with this name already exists'
      };
    }

    // Create the promo code
    const newPromoRef = doc(promoCodesRef);
    await setDoc(newPromoRef, {
      code: normalizedCode,
      type,
      maxUses,
      usedCount: 0,
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      createdBy,
      createdAt: Timestamp.now(),
      active: true
    });

    console.log('[PromoCode] Created new promo code:', normalizedCode);

    return {
      success: true,
      message: 'Promo code created successfully',
      codeId: newPromoRef.id
    };

  } catch (error) {
    console.error('[PromoCode] Error creating promo code:', error);
    return {
      success: false,
      message: 'Failed to create promo code'
    };
  }
};
