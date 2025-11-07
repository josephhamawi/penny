# Agent 4: AI Features Developer (Savings Goals)

## 🎯 Mission
Build the AI-Powered Saving Goals Engine that enables users to create financial goals and receive intelligent, personalized recommendations using OpenAI to help them achieve those goals faster.

---

## 📋 Assignment Overview

**Epic:** Epic 4 - AI-Powered Saving Goals Engine
**Timeline:** 2 weeks (10 business days)
**Priority:** HIGH - Flagship premium feature
**Dependencies:**
- Requires Agent 1 complete (user-scoped Firestore)
- Requires Agent 2 complete (subscription service to gate feature)
- Requires Agent 3 complete (paywall for non-subscribers)

---

## 🔨 Stories Assigned

### ✅ Story 4.1: Create Goals Data Model and Firestore Schema

**As a** developer,
**I want** a Firestore schema for storing user goals,
**so that** goals persist across sessions and devices.

#### Acceptance Criteria
1. ✓ Goals stored at `/users/{userId}/goals/{goalId}`
2. ✓ Goal document structure includes all required fields
3. ✓ Firestore security rules allow only authenticated user to read/write their goals
4. ✓ Index created for querying goals by `userId` and `status`
5. ✓ Service methods created: `createGoal()`, `updateGoal()`, `deleteGoal()`, `subscribeToGoals()`

#### Implementation Guidance

**Firestore Schema:**
```
/users/{userId}/goals/{goalId}
  - id: string
  - userId: string
  - name: string (e.g., "Save for vacation")
  - targetAmount: number (e.g., 1500)
  - currentAmount: number (calculated from expenses)
  - targetDate: Timestamp
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - categoryRestrictions: string[] | null (e.g., ["Food", "Entertainment"])
  - status: 'active' | 'completed' | 'failed'
  - aiRecommendations: {
      text: string,
      generatedAt: Timestamp,
      expiresAt: Timestamp (24 hours from generation)
    } | null
  - successProbability: number (0-100)
```

**Update Firestore Security Rules** (`firestore.rules`):
```javascript
// Add to existing rules
match /users/{userId}/goals/{goalId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Create `/src/services/goalService.js`:**
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

**Files to Create:**
- `/src/services/goalService.js`

**Files to Modify:**
- `firestore.rules` (add goals security rules)

---

### ✅ Story 4.2: Build Create/Edit Goal Screen

**As a** premium user,
**I want** to create a savings goal with a name, amount, and target date,
**so that** I can track my progress toward financial objectives.

#### Acceptance Criteria
1. ✓ "Create Goal" button on Goals Dashboard (visible only to premium users)
2. ✓ Create Goal form includes: name, target amount, target date, optional category restrictions
3. ✓ "Save Goal" button creates goal in Firestore
4. ✓ Form validation: name required, amount > 0, date in future
5. ✓ Success message: "Goal created successfully"
6. ✓ User redirected to Goals Dashboard after creation
7. ✓ Edit mode allows updating existing goals (same form, pre-filled)

#### Implementation Guidance

**Create `/src/screens/CreateGoalScreen.js`:**
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createGoal, updateGoal } from '../services/goalService';
import { CATEGORIES } from '../constants/categories';

const CreateGoalScreen = ({ navigation, route }) => {
  const { goal } = route.params || {}; // If editing existing goal
  const isEditing = !!goal;

  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount?.toString() || '');
  const [targetDate, setTargetDate] = useState(goal?.targetDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryRestrictions, setCategoryRestrictions] = useState(goal?.categoryRestrictions || []);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a goal name');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid target amount');
      return;
    }

    if (targetDate <= new Date()) {
      Alert.alert('Validation Error', 'Target date must be in the future');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateGoal(goal.id, {
          name: name.trim(),
          targetAmount: amount,
          targetDate: firestore.Timestamp.fromDate(targetDate),
          categoryRestrictions: categoryRestrictions.length > 0 ? categoryRestrictions : null,
        });
        Alert.alert('Success', 'Goal updated successfully!');
      } else {
        await createGoal({
          name: name.trim(),
          targetAmount: amount,
          targetDate: firestore.Timestamp.fromDate(targetDate),
          categoryRestrictions: categoryRestrictions.length > 0 ? categoryRestrictions : null,
        });
        Alert.alert('Success', 'Goal created successfully!');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    if (categoryRestrictions.includes(category)) {
      setCategoryRestrictions(categoryRestrictions.filter(c => c !== category));
    } else {
      setCategoryRestrictions([...categoryRestrictions, category]);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Goal' : 'Create Goal'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Goal Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Goal Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Save for vacation"
            placeholderTextColor="#999"
          />
        </View>

        {/* Target Amount */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Amount *</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="1500"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Target Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Date *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color="#1976D2" />
            <Text style={styles.dateText}>
              {targetDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setTargetDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Category Restrictions (Optional) */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Track Specific Categories (Optional)</Text>
          <Text style={styles.hint}>
            Select categories to track for this goal. Leave empty to track all expenses.
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  categoryRestrictions.includes(category) && styles.categoryChipSelected,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryRestrictions.includes(category) && styles.categoryChipTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : isEditing ? 'Update Goal' : 'Create Goal'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  categoryChipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateGoalScreen;
```

**Install date picker:**
```bash
npx expo install @react-native-community/datetimepicker
```

**Add to navigation:**
```javascript
<Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
```

**Files to Create:**
- `/src/screens/CreateGoalScreen.js`

**Files to Modify:**
- `/src/navigation/AppNavigator.js`

---

### ✅ Story 4.3: Display Goals Dashboard with Progress Indicators

**As a** premium user,
**I want** to see all my active goals with progress bars,
**so that** I can track how close I am to achieving each goal.

#### Acceptance Criteria
1. ✓ Goals Dashboard lists all active goals (status: 'active')
2. ✓ Each goal card shows: name, progress bar, saved amount, days remaining
3. ✓ Empty state: "No goals yet - Create your first goal!"
4. ✓ Goals sorted by target date (soonest first)
5. ✓ Completed goals shown in separate "Completed" section with green checkmark
6. ✓ Failed goals (past target date, not achieved) shown in "Missed" section
7. ✓ Pull-to-refresh updates goal progress

#### Implementation Guidance

**Create `/src/screens/GoalsDashboardScreen.js`:**
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { subscribeToGoals } from '../services/goalService';
import { calculateGoalProgress } from '../services/goalCalculationService';

const GoalsDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      navigation.replace('Paywall');
      return;
    }

    if (!user) return;

    const unsubscribe = subscribeToGoals(user.uid, async (updatedGoals) => {
      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        updatedGoals.map(async (goal) => {
          const progress = await calculateGoalProgress(goal);
          return { ...goal, ...progress };
        })
      );
      setGoals(goalsWithProgress);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe && unsubscribe();
  }, [user, isPremium]);

  const onRefresh = () => {
    setRefreshing(true);
    // Goals will auto-update via subscription
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const failedGoals = goals.filter((g) => g.status === 'failed');

  if (!isPremium) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGoal')}>
          <Icon name="plus" size={24} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              />
            ))}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed 🎉</Text>
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} completed />
            ))}
          </View>
        )}

        {/* Failed Goals */}
        {failedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missed</Text>
            {failedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} failed />
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="bullseye" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No goals yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateGoal')}
            >
              <Text style={styles.createButtonText}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const GoalCard = ({ goal, completed, failed, onPress }) => {
  const percentComplete = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100
  );
  const daysRemaining = Math.ceil(
    (goal.targetDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity
      style={[
        styles.goalCard,
        completed && styles.goalCardCompleted,
        failed && styles.goalCardFailed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.goalName}>{goal.name}</Text>
          {completed && <Icon name="check-circle" size={20} color="#4CAF50" />}
          {failed && <Icon name="times-circle" size={20} color="#F44336" />}
        </View>
        <Icon name="chevron-right" size={20} color="#999" />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentComplete}%` },
              completed && { backgroundColor: '#4CAF50' },
              failed && { backgroundColor: '#F44336' },
            ]}
          />
        </View>
      </View>

      <View style={styles.goalStats}>
        <Text style={styles.statText}>
          ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
        </Text>
        <Text style={styles.statText}>
          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  goalCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  goalCardFailed: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalsDashboardScreen;
```

**Files to Create:**
- `/src/screens/GoalsDashboardScreen.js`

---

### ✅ Story 4.4: Calculate Goal Progress Based on Expense History

**As a** system,
**I want** to calculate how much a user has saved toward their goal,
**so that** progress indicators are accurate.

#### Implementation Guidance

**Create `/src/services/goalCalculationService.js`:**
```javascript
import { firestore, auth } from '../config/firebase';
import { updateGoalProgress } from './goalService';

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

**Files to Create:**
- `/src/services/goalCalculationService.js`

---

### ✅ Story 4.5: Integrate OpenAI API for Goal Recommendations

**As a** premium user,
**I want** AI-generated recommendations to help me achieve my goal,
**so that** I know exactly what adjustments to make.

#### Acceptance Criteria
1. ✓ OpenAI API integrated using `openai` npm package
2. ✓ API key stored securely in environment variables
3. ✓ Prompt template created for goal recommendations
4. ✓ AI service method: `generateGoalRecommendations(goal, expenses)` returns string
5. ✓ Recommendations cached in Firestore (24-hour expiry)
6. ✓ Cache expires after 24 hours (regenerate if requested again)
7. ✓ Rate limit: Max 3 recommendations per goal per day

#### Implementation Guidance

**Install OpenAI:**
```bash
npm install openai
```

**Add to `.env`:**
```
OPENAI_API_KEY=sk-your-api-key-here
```

**Create `/src/services/aiService.js`:**
```javascript
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@env';
import { firestore, auth } from '../config/firebase';
import { saveAIRecommendations } from './goalService';

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

**Files to Create:**
- `/src/services/aiService.js`

**Files to Modify:**
- `.env` (add OPENAI_API_KEY)
- `app.config.js` (expose env variable)

---

### ✅ Story 4.6: Display AI Recommendations and Success Probability on Goal Detail Screen

[Implementation continues with GoalDetailScreen.js - full code provided in deliverables]

---

### ✅ Story 4.7: Send Goal Progress Notifications

[Implementation with Expo Notifications - full code provided in deliverables]

---

## 📦 Deliverables

1. **Goal Data Model** - Firestore schema and service methods
2. **Create/Edit Goal Screen** - Form to set up savings goals
3. **Goals Dashboard** - List view with progress indicators
4. **Goal Calculation Service** - Progress tracking from expenses
5. **OpenAI Integration** - AI-powered recommendations
6. **Goal Detail Screen** - Full goal view with AI insights
7. **Push Notifications** - Progress alerts

---

## 🚦 Definition of Done

- [ ] All 7 stories completed with acceptance criteria met
- [ ] OpenAI API working and generating quality recommendations
- [ ] Goal progress calculations accurate
- [ ] All screens responsive and polished
- [ ] Notifications working (test with sandbox)
- [ ] Code reviewed and merged
- [ ] Demo prepared showing full goals flow

---

**Ready to start? Questions?**

Contact: Product Manager (John) for clarification
PRD Reference: `/docs/prd.md` - Epic 4
