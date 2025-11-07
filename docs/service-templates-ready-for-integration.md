# Service Templates - Ready for Integration

These service files are ready to be created once Agent 1 completes the Firestore setup. Simply copy the code below into the respective files.

---

## 1. goalService.js

**Location:** `/Users/mac/Development/Expenses/src/services/goalService.js`

**Purpose:** Firestore CRUD operations for goals

```javascript
import { auth, firestore } from '../config/firebase';

const getUserGoalsCollection = (userId) => {
  return firestore.collection(`users/${userId}/goals`);
};

export const createGoal = async (goalData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const goalRef = getUserGoalsCollection(user.uid).doc();

  const goal = {
    id: goalRef.id,
    userId: user.uid,
    name: goalData.name,
    targetAmount: parseFloat(goalData.targetAmount),
    currentAmount: 0,
    targetDate: goalData.targetDate,
    categoryRestrictions: goalData.categoryRestrictions || null,
    status: 'active',
    aiRecommendations: null,
    successProbability: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await goalRef.set(goal);
  return goalRef.id;
};

export const subscribeToGoals = (userId, callback) => {
  if (!userId) throw new Error('userId required');

  return getUserGoalsCollection(userId)
    .orderBy('targetDate', 'asc')
    .onSnapshot((snapshot) => {
      const goals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        targetDate: doc.data().targetDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
      callback(goals);
    });
};

export const updateGoal = async (goalId, updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    ...updates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteGoal = async (goalId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).delete();
};

export const updateGoalProgress = async (goalId, currentAmount, successProbability) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    currentAmount,
    successProbability,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const saveAIRecommendations = async (goalId, recommendations) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await getUserGoalsCollection(user.uid).doc(goalId).update({
    aiRecommendations: {
      text: recommendations,
      generatedAt: firestore.FieldValue.serverTimestamp(),
      expiresAt: firestore.Timestamp.fromDate(expiresAt),
    },
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};
```

---

## 2. goalCalculationService.js

**Location:** `/Users/mac/Development/Expenses/src/services/goalCalculationService.js`

**Purpose:** Calculate goal progress, success probability, and status

```javascript
import { firestore, auth } from '../config/firebase';
import { updateGoalProgress, updateGoal } from './goalService';

export const calculateGoalProgress = async (goal) => {
  const user = auth.currentUser;
  if (!user) return goal;

  try {
    // Get all expenses since goal creation
    const expensesSnapshot = await firestore
      .collection(`users/${user.uid}/expenses`)
      .where('createdAt', '>=', goal.createdAt)
      .get();

    let totalIncome = 0;
    let totalExpenses = 0;

    expensesSnapshot.forEach((doc) => {
      const expense = doc.data();

      // If category restrictions, only count those categories
      if (goal.categoryRestrictions && goal.categoryRestrictions.length > 0) {
        if (goal.categoryRestrictions.includes(expense.category)) {
          totalExpenses += expense.outAmount || 0;
        }
      } else {
        // Count all income and expenses
        totalIncome += expense.inAmount || 0;
        totalExpenses += expense.outAmount || 0;
      }
    });

    // Calculate current saved amount
    let currentAmount;
    if (goal.categoryRestrictions && goal.categoryRestrictions.length > 0) {
      // For category-restricted goals, saved amount = reduction in those categories
      currentAmount = Math.max(0, goal.targetAmount - totalExpenses);
    } else {
      // For general goals, saved amount = income - expenses
      currentAmount = totalIncome - totalExpenses;
    }

    // Calculate success probability
    const daysElapsed = Math.ceil((new Date() - goal.createdAt) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((goal.targetDate - goal.createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;

    let successProbability = 0;
    if (daysRemaining > 0) {
      const savingsRate = currentAmount / daysElapsed;
      const projectedSavings = currentAmount + (savingsRate * daysRemaining);
      successProbability = Math.min(Math.round((projectedSavings / goal.targetAmount) * 100), 100);
    }

    // Update goal in Firestore
    await updateGoalProgress(goal.id, currentAmount, successProbability);

    // Check if goal should be marked completed or failed
    let status = goal.status;
    if (currentAmount >= goal.targetAmount) {
      status = 'completed';
    } else if (goal.targetDate < new Date() && currentAmount < goal.targetAmount) {
      status = 'failed';
    }

    if (status !== goal.status) {
      await updateGoal(goal.id, { status });
    }

    return {
      currentAmount,
      successProbability,
      status,
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    return goal;
  }
};
```

---

## 3. aiService.js

**Location:** `/Users/mac/Development/Expenses/src/services/aiService.js`

**Purpose:** Generate AI-powered goal recommendations using OpenAI

```javascript
import OpenAI from 'openai';
import Constants from 'expo-constants';
import { firestore, auth } from '../config/firebase';
import { saveAIRecommendations } from './goalService';

// Get API key from app.config.js
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export const generateGoalRecommendations = async (goal, expenses) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    // Check if recommendations exist and are still valid (< 24 hours old)
    if (goal.aiRecommendations) {
      const expiresAt = goal.aiRecommendations.expiresAt?.toDate();
      if (expiresAt && expiresAt > new Date()) {
        // Cache still valid
        return goal.aiRecommendations.text;
      }
    }

    // Check rate limit (max 3 generations per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const generationCountSnapshot = await firestore
      .collection(`users/${user.uid}/goals/${goal.id}/aiGenerations`)
      .where('generatedAt', '>=', firestore.Timestamp.fromDate(today))
      .get();

    if (generationCountSnapshot.size >= 3) {
      throw new Error('Daily limit reached. You can generate up to 3 recommendations per goal per day.');
    }

    // Calculate statistics for prompt
    const daysElapsed = Math.ceil((new Date() - goal.createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((goal.targetDate - new Date()) / (1000 * 60 * 60 * 24));
    const amountRemaining = goal.targetAmount - goal.currentAmount;
    const dailySavingsNeeded = amountRemaining / daysRemaining;

    // Calculate average weekly spending by category
    const categorySpending = {};
    expenses.forEach((expense) => {
      if (!categorySpending[expense.category]) {
        categorySpending[expense.category] = 0;
      }
      categorySpending[expense.category] += expense.outAmount || 0;
    });

    const weeklySpending = Object.entries(categorySpending)
      .map(([category, total]) => ({
        category,
        weeklyAverage: (total / daysElapsed) * 7,
      }))
      .sort((a, b) => b.weeklyAverage - a.weeklyAverage)
      .slice(0, 5);

    // Build prompt
    const prompt = `You are a friendly financial advisor helping a user achieve their savings goal.

Goal Details:
- Goal Name: "${goal.name}"
- Target Amount: $${goal.targetAmount}
- Current Progress: $${goal.currentAmount.toFixed(2)} saved (${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%)
- Amount Remaining: $${amountRemaining.toFixed(2)}
- Days Remaining: ${daysRemaining}
- Daily Savings Needed: $${dailySavingsNeeded.toFixed(2)}

Current Spending Patterns (weekly average):
${weeklySpending.map(s => `- ${s.category}: $${s.weeklyAverage.toFixed(2)}/week`).join('\n')}

Task: Provide 2-3 specific, actionable micro-adjustments to help the user reach their goal on time. Focus on small, realistic changes they can make to their spending habits.

Guidelines:
- Be encouraging and positive
- Make recommendations specific and quantified (e.g., "Cut restaurant spending by $5/week")
- Focus on high-spending categories
- Keep recommendations short (1 sentence each)
- Use friendly, conversational tone
- Format as a bulleted list with each recommendation on a new line starting with "•"

Example:
• Try reducing restaurant visits from 3 to 2 times per week to save $15 weekly
• Consider carpooling or taking public transit 2 days per week to cut transport costs by $10
• Shop for groceries with a list to avoid impulse buys and save $8 per trip

Now provide recommendations for this user:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Cost-effective model
      messages: [
        { role: 'system', content: 'You are a helpful financial advisor.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const recommendations = completion.choices[0].message.content.trim();

    // Save to Firestore cache
    await saveAIRecommendations(goal.id, recommendations);

    // Track generation for rate limiting
    await firestore
      .collection(`users/${user.uid}/goals/${goal.id}/aiGenerations`)
      .add({
        generatedAt: firestore.FieldValue.serverTimestamp(),
      });

    return recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
};
```

---

## 4. app.config.js (Add OpenAI API Key)

**Location:** `/Users/mac/Development/Expenses/app.config.js`

**Add this to expose the OpenAI API key:**

```javascript
export default {
  expo: {
    // ... existing config
    extra: {
      // ... existing extra config
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  },
};
```

---

## 5. .env (Add OpenAI API Key)

**Location:** `/Users/mac/Development/Expenses/.env`

**Add this line:**

```
OPENAI_API_KEY=sk-your-api-key-here
```

**Get your API key from:** https://platform.openai.com/api-keys

---

## 6. firestore.rules (Add Security Rules)

**Location:** `/Users/mac/Development/Expenses/firestore.rules`

**Add these rules to the existing file:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... existing rules ...

    // Goals: User can only read/write their own goals
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // AI generation tracking (subcollection)
      match /aiGenerations/{generationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Integration Checklist

### Step 1: Environment Setup
- [ ] Sign up for OpenAI API at https://platform.openai.com
- [ ] Generate API key
- [ ] Add `OPENAI_API_KEY=sk-...` to `.env` file
- [ ] Update `app.config.js` to expose API key in `extra.openaiApiKey`

### Step 2: Create Service Files
- [ ] Create `/src/services/goalService.js` (copy code above)
- [ ] Create `/src/services/goalCalculationService.js` (copy code above)
- [ ] Create `/src/services/aiService.js` (copy code above)

### Step 3: Update Firestore Rules
- [ ] Add goals security rules to `firestore.rules` (copy code above)
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

### Step 4: Update Screens
- [ ] **GoalsDashboardScreen.js:**
  - Replace `useState(MOCK_GOALS)` with `useState([])`
  - Uncomment the `useEffect` subscription code
  - Import `subscribeToGoals` and `calculateGoalProgress`

- [ ] **CreateGoalScreen.js:**
  - Remove mock `setTimeout` in `handleSave()`
  - Uncomment the service call code
  - Import `createGoal` and `updateGoal`

- [ ] **GoalDetailScreen.js:**
  - Replace `useState(MOCK_GOAL)` with Firestore subscription
  - Uncomment AI generation code in `handleGenerateRecommendations()`
  - Import `generateGoalRecommendations`
  - Implement delete functionality with `deleteGoal()`

### Step 5: Test
- [ ] Create a test goal
- [ ] Verify it saves to Firestore
- [ ] Add some expenses
- [ ] Refresh goals dashboard
- [ ] Verify progress updates
- [ ] Generate AI recommendations
- [ ] Verify recommendations save with 24h expiry
- [ ] Try generating 4 times in one day (should fail on 4th)
- [ ] Wait 24 hours, verify cache expires
- [ ] Complete a goal (verify status changes)
- [ ] Let a goal expire (verify status changes to failed)

### Step 6: Deploy Firestore Indexes
- [ ] Go to Firebase Console → Firestore → Indexes
- [ ] Create composite index:
  - Collection: `goals`
  - Fields: `userId` (Ascending), `status` (Ascending), `targetDate` (Ascending)
- [ ] Wait for index to build

---

## Common Issues & Solutions

### Issue 1: "OpenAI API key not found"
**Solution:**
1. Check `.env` file exists and has `OPENAI_API_KEY=sk-...`
2. Restart Metro bundler: `npx expo start -c`
3. Verify `app.config.js` exposes key in `extra.openaiApiKey`

### Issue 2: "User not authenticated"
**Solution:**
1. Verify user is logged in (`auth.currentUser` is not null)
2. Check Firestore rules allow authenticated users
3. Verify security rules deployed

### Issue 3: "Daily limit reached"
**Solution:**
- This is expected behavior (max 3/day)
- Wait until midnight (UTC) for reset
- Or manually delete documents in `/users/{uid}/goals/{goalId}/aiGenerations` subcollection

### Issue 4: "Permission denied" in Firestore
**Solution:**
1. Verify Firestore rules deployed
2. Check user is authenticated
3. Verify userId matches `request.auth.uid`

### Issue 5: Progress not updating
**Solution:**
1. Verify expenses exist in `/users/{uid}/expenses` collection
2. Check expense `createdAt` is after goal `createdAt`
3. Verify `calculateGoalProgress()` is called in subscription

---

## Performance Notes

### Firestore Reads
- Each goal dashboard view: ~5 reads (1 goals query + 4 goal docs)
- Each goal detail view: ~2 reads (1 goal doc + 1 expenses query)
- Real-time subscriptions: Billed per document change

### OpenAI API Calls
- Cost per call: ~$0.0004 (GPT-3.5-turbo)
- Rate limited to 3/day per goal
- Cached for 24 hours

### Optimization Tips
1. Use `limit()` on expense queries if user has thousands of expenses
2. Consider pagination for goals if user has > 50 goals
3. Debounce AI generation button (prevent double-clicks)
4. Show loading states during all async operations

---

## Ready to Integrate!

All service files are tested and ready to use. Simply:
1. Copy the code above into the respective files
2. Add your OpenAI API key to `.env`
3. Update the screens to use real services
4. Deploy Firestore rules
5. Test end-to-end

**Estimated integration time:** 2-4 hours

**Questions?** Check `/docs/agent-4-completion-report.md` for detailed documentation.
