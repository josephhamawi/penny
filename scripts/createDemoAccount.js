/**
 * Demo Account Setup Script
 * Creates demo@pennyapp.com with sample data for Apple App Store reviewers
 *
 * Usage: node scripts/createDemoAccount.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to download this

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'expenses-64949'
});

const db = admin.firestore();
const auth = admin.auth();

const DEMO_EMAIL = 'demo@pennyapp.com';
const DEMO_PASSWORD = 'DemoPass2024!';

// Sample expense data
const sampleExpenses = [
  // Current month expenses
  { date: new Date('2025-11-01'), description: 'Grocery Shopping', category: 'Food', outAmount: 85.50, inAmount: 0 },
  { date: new Date('2025-11-02'), description: 'Gas Station', category: 'Transportation', outAmount: 45.00, inAmount: 0 },
  { date: new Date('2025-11-03'), description: 'Salary Deposit', category: 'Income', outAmount: 0, inAmount: 3500.00 },
  { date: new Date('2025-11-04'), description: 'Coffee Shop', category: 'Food', outAmount: 12.50, inAmount: 0 },
  { date: new Date('2025-11-05'), description: 'Movie Tickets', category: 'Entertainment', outAmount: 28.00, inAmount: 0 },
  { date: new Date('2025-11-06'), description: 'Restaurant Dinner', category: 'Food', outAmount: 67.80, inAmount: 0 },
  { date: new Date('2025-11-07'), description: 'Uber Ride', category: 'Transportation', outAmount: 18.50, inAmount: 0 },
  { date: new Date('2025-11-08'), description: 'Gym Membership', category: 'Health', outAmount: 49.99, inAmount: 0 },
  { date: new Date('2025-11-09'), description: 'Online Shopping', category: 'Shopping', outAmount: 125.00, inAmount: 0 },
  { date: new Date('2025-11-10'), description: 'Electric Bill', category: 'Bills', outAmount: 89.00, inAmount: 0 },
  { date: new Date('2025-11-11'), description: 'Freelance Payment', category: 'Income', outAmount: 0, inAmount: 500.00 },
  { date: new Date('2025-11-12'), description: 'Pharmacy', category: 'Health', outAmount: 32.50, inAmount: 0 },
  { date: new Date('2025-11-13'), description: 'Streaming Services', category: 'Entertainment', outAmount: 29.99, inAmount: 0 },
  { date: new Date('2025-11-14'), description: 'Grocery Shopping', category: 'Food', outAmount: 92.30, inAmount: 0 },
  { date: new Date('2025-11-15'), description: 'Gas Station', category: 'Transportation', outAmount: 48.00, inAmount: 0 },
  { date: new Date('2025-11-16'), description: 'Book Purchase', category: 'Education', outAmount: 24.99, inAmount: 0 },
  { date: new Date('2025-11-17'), description: 'Haircut', category: 'Personal Care', outAmount: 35.00, inAmount: 0 },
  { date: new Date('2025-11-18'), description: 'Phone Bill', category: 'Bills', outAmount: 65.00, inAmount: 0 },
  { date: new Date('2025-11-19'), description: 'Lunch Meeting', category: 'Food', outAmount: 42.00, inAmount: 0 },
  { date: new Date('2025-11-20'), description: 'Parking Fee', category: 'Transportation', outAmount: 15.00, inAmount: 0 },

  // Previous month expenses
  { date: new Date('2025-10-05'), description: 'Rent Payment', category: 'Bills', outAmount: 1200.00, inAmount: 0 },
  { date: new Date('2025-10-10'), description: 'Grocery Shopping', category: 'Food', outAmount: 110.00, inAmount: 0 },
  { date: new Date('2025-10-15'), description: 'Salary Deposit', category: 'Income', outAmount: 0, inAmount: 3500.00 },
  { date: new Date('2025-10-18'), description: 'Car Insurance', category: 'Bills', outAmount: 180.00, inAmount: 0 },
  { date: new Date('2025-10-22'), description: 'Dental Checkup', category: 'Health', outAmount: 150.00, inAmount: 0 },
  { date: new Date('2025-10-25'), description: 'Weekend Trip', category: 'Entertainment', outAmount: 320.00, inAmount: 0 },
  { date: new Date('2025-10-28'), description: 'Clothing Purchase', category: 'Shopping', outAmount: 89.99, inAmount: 0 }
];

// Sample savings plans
const samplePlans = [
  {
    planName: 'Emergency Fund',
    targetCategory: null,
    percentageOfIncome: 15,
    description: 'Building a safety net for unexpected expenses',
    targetAmount: 10000,
    targetDate: new Date('2026-12-31'),
    active: true
  },
  {
    planName: 'Summer Vacation',
    targetCategory: 'Entertainment',
    percentageOfIncome: 10,
    description: 'Saving for a trip to Europe',
    targetAmount: 5000,
    targetDate: new Date('2026-06-30'),
    active: true
  },
  {
    planName: 'New Car Fund',
    targetCategory: 'Transportation',
    percentageOfIncome: 5,
    description: 'Saving for a down payment on a new car',
    targetAmount: 8000,
    targetDate: new Date('2027-03-31'),
    active: true
  }
];

// Sample goals
const sampleGoals = [
  {
    goalName: 'Reduce Dining Out',
    description: 'Limit restaurant expenses to $200/month',
    category: 'Food',
    targetAmount: 200,
    type: 'spending_limit',
    active: true
  },
  {
    goalName: 'Save More Monthly',
    description: 'Increase monthly savings to $600',
    category: null,
    targetAmount: 600,
    type: 'savings_goal',
    active: true
  }
];

async function createOrUpdateDemoUser() {
  try {
    console.log('🔄 Checking if demo user exists...');

    let user;
    try {
      // Try to get existing user
      user = await auth.getUserByEmail(DEMO_EMAIL);
      console.log('✅ Demo user already exists:', user.uid);

      // Update password
      await auth.updateUser(user.uid, { password: DEMO_PASSWORD });
      console.log('✅ Password updated');

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        console.log('📝 Creating new demo user...');
        user = await auth.createUser({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          emailVerified: true,
          displayName: 'Demo Account'
        });
        console.log('✅ Demo user created:', user.uid);
      } else {
        throw error;
      }
    }

    return user.uid;
  } catch (error) {
    console.error('❌ Error creating/updating user:', error);
    throw error;
  }
}

async function addExpenses(userId) {
  console.log('\n📊 Adding sample expenses...');
  const expensesRef = db.collection(`users/${userId}/expenses`);

  // Clear existing expenses
  const existingExpenses = await expensesRef.get();
  const batch = db.batch();
  existingExpenses.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log('🗑️  Cleared existing expenses');

  // Add new expenses
  for (const expense of sampleExpenses) {
    await expensesRef.add({
      userId: userId,
      date: admin.firestore.Timestamp.fromDate(expense.date),
      description: expense.description,
      category: expense.category,
      inAmount: expense.inAmount,
      outAmount: expense.outAmount,
      createdAt: admin.firestore.Timestamp.now()
    });
  }

  console.log(`✅ Added ${sampleExpenses.length} expenses`);
}

async function addPlans(userId) {
  console.log('\n💰 Adding savings plans...');
  const plansRef = db.collection(`users/${userId}/plans`);

  // Clear existing plans
  const existingPlans = await plansRef.get();
  const batch = db.batch();
  existingPlans.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log('🗑️  Cleared existing plans');

  // Calculate cumulative totals based on income
  const totalIncome = sampleExpenses
    .filter(e => e.inAmount > 0)
    .reduce((sum, e) => sum + e.inAmount, 0);

  // Add new plans
  for (const plan of samplePlans) {
    const cumulativeTotal = (totalIncome * plan.percentageOfIncome) / 100;

    await plansRef.add({
      userId: userId,
      planName: plan.planName,
      targetCategory: plan.targetCategory,
      percentageOfIncome: plan.percentageOfIncome,
      description: plan.description,
      targetAmount: plan.targetAmount,
      targetDate: plan.targetDate ? admin.firestore.Timestamp.fromDate(plan.targetDate) : null,
      active: plan.active,
      cumulativeTotalForPlan: cumulativeTotal,
      healthScore: Math.min(100, Math.round((cumulativeTotal / plan.targetAmount) * 100)),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
  }

  console.log(`✅ Added ${samplePlans.length} savings plans`);
}

async function addGoals(userId) {
  console.log('\n🎯 Adding goals...');
  const goalsRef = db.collection(`users/${userId}/goals`);

  // Clear existing goals
  const existingGoals = await goalsRef.get();
  const batch = db.batch();
  existingGoals.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log('🗑️  Cleared existing goals');

  // Add new goals
  for (const goal of sampleGoals) {
    await goalsRef.add({
      userId: userId,
      goalName: goal.goalName,
      description: goal.description,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentAmount: 0,
      type: goal.type,
      active: goal.active,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
  }

  console.log(`✅ Added ${sampleGoals.length} goals`);
}

async function grantPremiumAccess(userId) {
  console.log('\n⭐ Granting Premium access...');

  // Add premium subscription document
  await db.collection(`users/${userId}/subscriptions`).doc('premium').set({
    active: true,
    expiresAt: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    source: 'demo_account',
    type: 'lifetime',
    createdAt: admin.firestore.Timestamp.now()
  });

  // Update user profile
  await db.collection('users').doc(userId).set({
    email: DEMO_EMAIL,
    displayName: 'Demo Account',
    isPremium: true,
    premiumGrantedAt: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now()
  }, { merge: true });

  console.log('✅ Premium access granted');
}

async function main() {
  console.log('🚀 Starting demo account setup...\n');
  console.log('📧 Email:', DEMO_EMAIL);
  console.log('🔑 Password:', DEMO_PASSWORD);
  console.log('─'.repeat(50));

  try {
    // Step 1: Create/update user
    const userId = await createOrUpdateDemoUser();

    // Step 2: Add expenses
    await addExpenses(userId);

    // Step 3: Add plans
    await addPlans(userId);

    // Step 4: Add goals
    await addGoals(userId);

    // Step 5: Grant premium access
    await grantPremiumAccess(userId);

    console.log('\n' + '─'.repeat(50));
    console.log('✅ Demo account setup complete!\n');
    console.log('📱 Login Credentials:');
    console.log('   Email:', DEMO_EMAIL);
    console.log('   Password:', DEMO_PASSWORD);
    console.log('\n📊 Sample Data Added:');
    console.log(`   • ${sampleExpenses.length} expenses`);
    console.log(`   • ${samplePlans.length} savings plans`);
    console.log(`   • ${sampleGoals.length} goals`);
    console.log('   • Premium access granted');
    console.log('\n🎉 Ready for Apple App Store review!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();
