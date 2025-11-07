import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

// Mock data for development - will be replaced with real data from Firestore
const MOCK_GOALS = [
  {
    id: '1',
    name: 'Save for Vacation',
    targetAmount: 2000,
    currentAmount: 850,
    targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    status: 'active',
    successProbability: 75,
    categoryRestrictions: ['Entertainment', 'Food & Dining'],
  },
  {
    id: '2',
    name: 'Emergency Fund',
    targetAmount: 5000,
    currentAmount: 3200,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    status: 'active',
    successProbability: 85,
    categoryRestrictions: null,
  },
  {
    id: '3',
    name: 'New Laptop',
    targetAmount: 1500,
    currentAmount: 1500,
    targetDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago (completed)
    status: 'completed',
    successProbability: 100,
    categoryRestrictions: null,
  },
  {
    id: '4',
    name: 'Holiday Gifts',
    targetAmount: 800,
    currentAmount: 450,
    targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (failed)
    status: 'failed',
    successProbability: 56,
    categoryRestrictions: null,
  },
];

const GoalsDashboardScreen = ({ navigation }) => {
  const [goals, setGoals] = useState(MOCK_GOALS);
  const [refreshing, setRefreshing] = useState(false);

  // TODO: Replace with actual subscription when Firestore is ready
  // useEffect(() => {
  //   if (!user) return;
  //   const unsubscribe = subscribeToGoals(user.uid, async (updatedGoals) => {
  //     const goalsWithProgress = await Promise.all(
  //       updatedGoals.map(async (goal) => {
  //         const progress = await calculateGoalProgress(goal);
  //         return { ...goal, ...progress };
  //       })
  //     );
  //     setGoals(goalsWithProgress);
  //     setLoading(false);
  //     setRefreshing(false);
  //   });
  //   return () => unsubscribe && unsubscribe();
  // }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const failedGoals = goals.filter((g) => g.status === 'failed');

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
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                completed
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              />
            ))}
          </View>
        )}

        {/* Failed Goals */}
        {failedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missed</Text>
            {failedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                failed
                onPress={() => navigation.navigate('GoalDetail', { goalId: goal.id })}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && !refreshing && (
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

      {/* Success Probability Badge */}
      {!completed && !failed && (
        <View style={styles.probabilityBadge}>
          <Icon name="chart-line" size={12} color="#1976D2" />
          <Text style={styles.probabilityText}>
            {goal.successProbability}% likely to succeed
          </Text>
        </View>
      )}
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
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  probabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  probabilityText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
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
