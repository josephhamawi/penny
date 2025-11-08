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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, typography } from '../theme/colors';

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
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGoal')}>
          <Icon name="plus" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </LinearGradient>

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
            <Icon name="bullseye" size={60} color={colors.text.disabled} />
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
          {completed && <Icon name="check-circle" size={20} color={colors.income} />}
          {failed && <Icon name="times-circle" size={20} color={colors.expense} />}
        </View>
        <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentComplete}%` },
              completed && { backgroundColor: colors.income },
              failed && { backgroundColor: colors.expense },
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
          <Icon name="chart-line" size={12} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 15,
  },
  goalCard: {
    backgroundColor: colors.glass.background,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.md,
  },
  goalCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: colors.income,
  },
  goalCardFailed: {
    borderLeftWidth: 4,
    borderLeftColor: colors.expense,
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
    ...typography.h3,
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statText: {
    ...typography.caption,
  },
  probabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  probabilityText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.tertiary,
    marginTop: 20,
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    ...shadows.md,
  },
  createButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalsDashboardScreen;
