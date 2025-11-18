/**
 * One-time script to create a test promo code
 *
 * Run this in the app by importing and calling it once from SettingsScreen
 * or any other screen where you're authenticated
 */

import { createPromoCode } from './src/services/promoCodeService';

export const createTestPromoCode = async () => {
  console.log('[CreatePromo] Creating test promo code...');

  const result = await createPromoCode({
    code: 'DEV-TEST-2024',
    type: 'full_access',
    maxUses: null, // Unlimited uses
    expiresAt: null, // Never expires
    createdBy: 'dev_script'
  });

  if (result.success) {
    console.log('[CreatePromo] ✅ Success! Promo code created:', result.codeId);
    console.log('[CreatePromo] You can now redeem: DEV-TEST-2024');
  } else {
    console.log('[CreatePromo] ❌ Failed:', result.message);
  }

  return result;
};
