/**
 * Helper script to create promo codes in Firestore
 *
 * Usage:
 * node scripts/createPromoCode.js FRIEND2024 10
 *
 * This creates a promo code "FRIEND2024" with max 10 uses
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this from Firebase Console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createPromoCode(code, maxUses = null, expiresAt = null) {
  try {
    const normalizedCode = code.trim().toUpperCase();

    // Check if code already exists
    const snapshot = await db.collection('promoCodes')
      .where('code', '==', normalizedCode)
      .get();

    if (!snapshot.empty) {
      console.error(`❌ Error: Promo code "${normalizedCode}" already exists`);
      return;
    }

    // Create the promo code
    const promoData = {
      code: normalizedCode,
      type: 'full_access',
      maxUses: maxUses ? parseInt(maxUses) : null,
      usedCount: 0,
      expiresAt: expiresAt ? admin.firestore.Timestamp.fromDate(new Date(expiresAt)) : null,
      createdBy: 'admin_script',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    };

    await db.collection('promoCodes').add(promoData);

    console.log(`\n✅ Promo code created successfully!`);
    console.log(`Code: ${normalizedCode}`);
    console.log(`Max Uses: ${maxUses || 'Unlimited'}`);
    console.log(`Expires: ${expiresAt || 'Never'}`);
    console.log(`\nShare this code with your testers/friends!\n`);

  } catch (error) {
    console.error('❌ Error creating promo code:', error);
  } finally {
    process.exit();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log(`
Usage: node scripts/createPromoCode.js <CODE> [maxUses] [expiresAt]

Examples:
  node scripts/createPromoCode.js FRIEND2024
  node scripts/createPromoCode.js FRIEND2024 10
  node scripts/createPromoCode.js FRIEND2024 10 "2025-12-31"

Arguments:
  CODE       - The promo code (will be uppercased)
  maxUses    - Maximum number of uses (optional, default: unlimited)
  expiresAt  - Expiration date (optional, format: "YYYY-MM-DD")
  `);
  process.exit(1);
}

const [code, maxUses, expiresAt] = args;

createPromoCode(code, maxUses, expiresAt);
