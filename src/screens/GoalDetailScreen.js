import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

// Mock goal data - will be replaced with real data from Firestore
const MOCK_GOAL = {
  id: '1',
  name: 'Save for Vacation',
  targetAmount: 2000,
  currentAmount: 850,
  targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  status: 'active',
  successProbability: 75,
  categoryRestrictions: ['Entertainment', 'Food & Dining'],
  aiRecommendations: {
    text: `Try reducing restaurant visits from 3 to 2 times per week to save $15 weekly\nConsider carpooling or taking public transit 2 days per week to cut transport costs by $10\nShop for groceries with a list to avoid impulse buys and save $8 per trip`,
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
  },
};

const GoalDetailScreen = ({ navigation, route }) => {
  const { goalId } = route.params;
  const [goal, setGoal] = useState(MOCK_GOAL);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  // TODO: Replace with actual data fetching
  // useEffect(() => {
  //   const unsubscribe = subscribeToGoal(goalId, (updatedGoal) => {
  //     setGoal(updatedGoal);
  //   });
  //   return () => unsubscribe && unsubscribe();
  // }, [goalId]);

  const handleGenerateRecommendations = async () => {
    setGeneratingRecommendations(true);

    // TODO: Replace with actual OpenAI call
    setTimeout(() => {
      setGeneratingRecommendations(false);
      Alert.alert(
        'Success',
        'AI recommendations generated! (Using mock data - will integrate OpenAI once ready)'
      );
      // Simulate new recommendations
      setGoal({
        ...goal,
        aiRecommendations: {
          text: `Pack lunch 3 times per week instead of eating out to save $45 weekly\nSwitch to a cheaper streaming service or share with family to save $10/month\nUse cashback apps for grocery shopping to save $12 per month`,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }, 2000);

    /* READY FOR INTEGRATION:
    try {
      const expenses = await getExpensesForGoal(goal);
      const recommendations = await generateGoalRecommendations(goal, expenses);
      setGoal({ ...goal, aiRecommendations: recommendations });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate recommendations');
    } finally {
      setGeneratingRecommendations(false);
    }
    */
  };

  const handleDeleteGoal = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Replace with actual delete
            // deleteGoal(goalId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const percentComplete = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100
  );
  const daysRemaining = Math.ceil(
    (goal.targetDate - new Date()) / (1000 * 60 * 60 * 24)
  );
  const amountRemaining = goal.targetAmount - goal.currentAmount;
  const dailySavingsNeeded = daysRemaining > 0 ? amountRemaining / daysRemaining : 0;

  const isRecommendationExpired = goal.aiRecommendations?.expiresAt
    ? new Date() > goal.aiRecommendations.expiresAt
    : true;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#1976D2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGoal', { goal })}>
          <Icon name="edit" size={20} color="#1976D2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Goal Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.goalName}>{goal.name}</Text>

          {/* Progress Circle */}
          <View style={styles.progressCircle}>
            <Text style={styles.percentageText}>{percentComplete}%</Text>
            <Text style={styles.percentageLabel}>Complete</Text>
          </View>

          {/* Amount Info */}
          <View style={styles.amountRow}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Current</Text>
              <Text style={styles.amountValue}>${goal.currentAmount.toFixed(0)}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Target</Text>
              <Text style={styles.amountValue}>${goal.targetAmount.toFixed(0)}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percentComplete}%` },
                ]}
              />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="calendar" size={16} color="#666" />
              <Text style={styles.statText}>{daysRemaining} days left</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="piggy-bank" size={16} color="#666" />
              <Text style={styles.statText}>${dailySavingsNeeded.toFixed(2)}/day</Text>
            </View>
          </View>

          {/* Success Probability */}
          <View style={styles.probabilityCard}>
            <Icon name="chart-line" size={20} color="#1976D2" />
            <Text style={styles.probabilityTitle}>Success Probability</Text>
            <Text style={styles.probabilityValue}>{goal.successProbability}%</Text>
          </View>
        </View>

        {/* AI Recommendations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="brain" size={20} color="#1976D2" />
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
          </View>

          {goal.aiRecommendations && !isRecommendationExpired ? (
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsText}>
                {goal.aiRecommendations.text.split('\n').map((line, idx) => (
                  <Text key={idx}>
                    {line}
                    {'\n'}
                  </Text>
                ))}
              </Text>
              <View style={styles.recommendationFooter}>
                <Text style={styles.recommendationTime}>
                  Generated {new Date(goal.aiRecommendations.generatedAt).toLocaleTimeString()}
                </Text>
                {isRecommendationExpired && (
                  <Text style={styles.expiredText}>Expired - Generate new</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noRecommendations}>
              <Icon name="lightbulb" size={40} color="#CCC" />
              <Text style={styles.noRecommendationsText}>
                No recommendations yet. Get AI-powered tips to reach your goal faster!
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              generatingRecommendations && styles.buttonDisabled,
            ]}
            onPress={handleGenerateRecommendations}
            disabled={generatingRecommendations}
          >
            {generatingRecommendations ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Icon name="magic" size={16} color="#FFF" />
                <Text style={styles.generateButtonText}>
                  {goal.aiRecommendations && !isRecommendationExpired
                    ? 'Regenerate Recommendations'
                    : 'Generate AI Recommendations'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Restrictions */}
        {goal.categoryRestrictions && goal.categoryRestrictions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking Categories</Text>
            <View style={styles.categoryList}>
              {goal.categoryRestrictions.map((category, idx) => (
                <View key={idx} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteGoal}
        >
          <Icon name="trash" size={16} color="#F44336" />
          <Text style={styles.deleteButtonText}>Delete Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressCircle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  percentageLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  amountBox: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1976D2',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  probabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  probabilityTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  probabilityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  section: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsCard: {
    backgroundColor: '#F5F9FF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  recommendationsText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    marginBottom: 10,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationTime: {
    fontSize: 12,
    color: '#999',
  },
  expiredText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  noRecommendations: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryTagText: {
    fontSize: 14,
    color: '#1976D2',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalDetailScreen;
