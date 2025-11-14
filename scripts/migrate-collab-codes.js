const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Note: Set GOOGLE_APPLICATION_CREDENTIALS environment variable or provide serviceAccountKey.json
try {
  const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.log('Using default credentials or GOOGLE_APPLICATION_CREDENTIALS');
  admin.initializeApp();
}

const db = admin.firestore();

// Constants (must match collabCodeService.js)
const COLLAB_CODE_PREFIX = 'PENNY-';
const COLLAB_CODE_LENGTH = 4;
const MAX_COLLISION_RETRIES = 10;
const USERS_COLLECTION = 'users';

/**
 * Generate random 4-digit code
 * @returns {string} - 4-digit string with leading zeros
 */
function generateRandomCode() {
  const min = 0;
  const max = 9999;
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num.toString().padStart(COLLAB_CODE_LENGTH, '0');
}

/**
 * Check if collab code already exists in Firestore
 * @param {string} code - The code to check (without prefix, e.g., "4729")
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
async function collabCodeExists(code) {
  const fullCode = `${COLLAB_CODE_PREFIX}${code}`;
  const usersRef = db.collection(USERS_COLLECTION);
  const query = usersRef.where('collabCode', '==', fullCode);
  const snapshot = await query.get();
  return !snapshot.empty;
}

/**
 * Generate unique collab code
 * @returns {Promise<string>} - Unique collab code (e.g., "PENNY-4729")
 * @throws {Error} - If unable to generate unique code after retries
 */
async function generateUniqueCollabCode() {
  let attempts = 0;

  while (attempts < MAX_COLLISION_RETRIES) {
    const code = generateRandomCode();
    const fullCode = `${COLLAB_CODE_PREFIX}${code}`;

    const exists = await collabCodeExists(code);

    if (!exists) {
      return fullCode;
    }

    console.log(`Collision detected for code ${fullCode}, retrying... (attempt ${attempts + 1}/${MAX_COLLISION_RETRIES})`);
    attempts++;
  }

  throw new Error(`Failed to generate unique collab code after ${MAX_COLLISION_RETRIES} attempts`);
}

/**
 * Migrate collab codes for all users
 * @param {boolean} dryRun - If true, only logs what would be changed without making changes
 */
async function migrateCollabCodes(dryRun = false) {
  console.log('='.repeat(60));
  console.log('Starting Collab Code Migration');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE RUN'}`);
  console.log('='.repeat(60));

  try {
    // Get all users
    const usersRef = db.collection(USERS_COLLECTION);
    const snapshot = await usersRef.get();

    const usersWithoutCodes = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      if (!userData.collabCode) {
        usersWithoutCodes.push({
          id: doc.id,
          email: userData.email || 'unknown',
        });
      }
    });

    console.log(`Total users: ${snapshot.size}`);
    console.log(`Users without collab codes: ${usersWithoutCodes.length}`);

    if (usersWithoutCodes.length === 0) {
      console.log('✓ All users already have collab codes. Nothing to do.');
      return {
        success: true,
        totalUsers: snapshot.size,
        migrated: 0,
        failed: 0,
      };
    }

    if (dryRun) {
      console.log('\nDRY RUN: Would generate codes for these users:');
      usersWithoutCodes.slice(0, 10).forEach((user) => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      if (usersWithoutCodes.length > 10) {
        console.log(`  ... and ${usersWithoutCodes.length - 10} more`);
      }
      return {
        success: true,
        totalUsers: snapshot.size,
        wouldMigrate: usersWithoutCodes.length,
        dryRun: true,
      };
    }

    // Process users one by one
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (let i = 0; i < usersWithoutCodes.length; i++) {
      const user = usersWithoutCodes[i];

      try {
        // Generate unique code
        const collabCode = await generateUniqueCollabCode();

        // Update user document
        const userRef = db.collection(USERS_COLLECTION).doc(user.id);
        await userRef.update({
          collabCode: collabCode,
          collabCodeGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        successCount++;

        // Log progress every 10 users
        if ((i + 1) % 10 === 0 || i === usersWithoutCodes.length - 1) {
          console.log(`Progress: ${i + 1}/${usersWithoutCodes.length} users processed`);
        }
      } catch (error) {
        console.error(`Failed to generate code for user ${user.email}:`, error.message);
        failureCount++;
        failures.push({
          userId: user.id,
          email: user.email,
          error: error.message,
        });
      }
    }

    console.log('='.repeat(60));
    console.log('Migration Complete');
    console.log(`Success: ${successCount}`);
    console.log(`Failures: ${failureCount}`);

    if (failures.length > 0) {
      console.log('\nFailed Users:');
      failures.forEach((failure) => {
        console.log(`  - ${failure.email} (${failure.userId}): ${failure.error}`);
      });
    }

    console.log('='.repeat(60));

    return {
      success: true,
      totalUsers: snapshot.size,
      migrated: successCount,
      failed: failureCount,
      failures: failures,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
migrateCollabCodes(dryRun)
  .then((result) => {
    console.log('\nScript completed successfully');
    if (!result.dryRun) {
      console.log(`\nSummary:`);
      console.log(`  Total users: ${result.totalUsers}`);
      console.log(`  Migrated: ${result.migrated}`);
      console.log(`  Failed: ${result.failed}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });
