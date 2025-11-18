/**
 * One-time script to add a test promo code directly to Firestore
 * Uses Firebase Web SDK (compat mode)
 */

const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

// Firebase config from your app
const firebaseConfig = {
  apiKey: "AIzaSyCVkypVjUxN4HdeRmGotHM36Vp8fycPzNY",
  authDomain: "expenses-64949.firebaseapp.com",
  projectId: "expenses-64949",
  storageBucket: "expenses-64949.firebasestorage.app",
  messagingSenderId: "896051349073",
  appId: "1:896051349073:web:89c2f05a87a71708125a70"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

async function createPromoCode() {
  try {
    // You need to be authenticated to create promo codes
    // Replace with your actual credentials or use an environment variable
    const email = process.env.FIREBASE_USER_EMAIL;
    const password = process.env.FIREBASE_USER_PASSWORD;

    if (!email || !password) {
      console.error('❌ Error: Firebase credentials not set');
      console.error('\nPlease set your Firebase credentials:');
      console.error('export FIREBASE_USER_EMAIL="your-email@example.com"');
      console.error('export FIREBASE_USER_PASSWORD="your-password"');
      console.error('\nThen run: node scripts/addPromoCodeToFirestore.js');
      process.exit(1);
    }

    console.log('Signing in to Firebase...');
    await auth.signInWithEmailAndPassword(email, password);
    console.log('✓ Signed in successfully');

    console.log('Creating promo code...');

    const promoData = {
      code: 'DEV-TEST-2024',
      type: 'full_access',
      maxUses: null,
      usedCount: 0,
      expiresAt: null,
      createdBy: 'dev_script',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      active: true
    };

    const docRef = await db.collection('promoCodes').add(promoData);

    console.log('\n✅ Promo code created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Code: DEV-TEST-2024');
    console.log('Type: full_access');
    console.log('Max Uses: Unlimited');
    console.log('Expires: Never');
    console.log('\n🎉 You can now redeem this code in your app!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  }
}

createPromoCode();
