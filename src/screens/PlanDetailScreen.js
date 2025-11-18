import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import { formatCurrency } from '../utils/formatNumber';
import { useAuth } from '../contexts/AuthContext';
import { getPlan, deletePlan } from '../services/planService';
import { getAllocationsForPlan } from '../services/planAllocationService';
import {
  generateProjections,
  generatePlanRecommendations,
  calculatePlanHealthScore,
  updateAllPlanHealthScores
} from '../services/planProjectionService';
import { subscribeToExpenses } from '../services/expenseService';
import PlanHealthScore from '../components/PlanHealthScore';
import WhatIfSlider from '../components/WhatIfSlider';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width;

const PlanDetailScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { planId } = route.params;

  const [plan, setPlan] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [projections, setProjections] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    // Subscribe to expense updates for health score calculation
    const unsubscribe = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [planId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load plan
      const planData = await getPlan(user.uid, planId);
      setPlan(planData);

      // Load allocations
      const allocationsData = await getAllocationsForPlan(user.uid, planId);
      setAllocations(allocationsData);

      // Generate projections
      const projectionsData = await generateProjections(user.uid, planId);
      setProjections(projectionsData);

      // Get expenses for recommendations
      const expensesData = expenses.length > 0 ? expenses : [];

      // Generate recommendations
      const recommendationsData = await generatePlanRecommendations(user.uid, planId, expensesData);
      setRecommendations(recommendationsData);

    } catch (error) {
      console.error('Error loading plan details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load plan details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    // Update health scores
    await updateAllPlanHealthScores(user.uid, expenses);
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('CreatePlan', { planId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.planName}"? This will mark it as inactive but preserve allocation history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(user.uid, planId);
              Toast.show({
                type: 'success',
                text1: 'Plan Deleted',
                text2: `${plan.planName} has been deactivated`
              });
              navigation.goBack();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete plan'
              });
            }
          }
        }
      ]
    );
  };

  const renderAllocation = ({ item }) => (
    <LinearGradient
      colors={[colors.glass.background, colors.glass.backgroundDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.allocationItem}
    >
      <View style={styles.allocationHeader}>
        <Text style={styles.allocationDate}>
          {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={styles.allocationAmount}>{formatCurrency(item.allocatedAmount)}</Text>
      </View>
      <View style={styles.allocationFooter}>
        <Text style={styles.allocationLabel}>From income: {formatCurrency(item.incomeAmount)}</Text>
        <Text style={styles.allocationLabel}>
          Total: {formatCurrency(item.cumulativeTotalForPlan)}
        </Text>
      </View>
    </LinearGradient>
  );

  const renderRecommendation = (recommendation, index) => {
    const iconMap = {
      warning: 'exclamation-triangle',
      alert: 'exclamation-circle',
      info: 'info-circle',
      success: 'check-circle'
    };

    const colorMap = {
      warning: colors.warning,
      alert: colors.error,
      info: colors.primary,
      success: colors.success
    };

    return (
      <LinearGradient
        key={index}
        colors={[`${colorMap[recommendation.type]}15`, `${colorMap[recommendation.type]}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.recommendationCard, { borderColor: colorMap[recommendation.type] }]}
      >
        <Icon name={iconMap[recommendation.type]} size={24} color={colorMap[recommendation.type]} />
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
          <Text style={styles.recommendationMessage}>{recommendation.message}</Text>
        </View>
      </LinearGradient>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading plan details...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Plan not found</Text>
      </View>
    );
  }

  // Prepare chart data
  const chartData = projections && projections.projections && projections.projections.length > 0
    ? {
        labels: projections.projections.slice(0, 6).map((p, i) => `+${i + 1}`),
        datasets: [{
          data: [
            plan.cumulativeTotalForPlan,
            ...projections.projections.slice(0, 5).map(p => p.cumulativeTotal)
          ]
        }]
      }
    : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
              <Icon name="edit" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <Icon name="trash" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTitle}>{plan.planName}</Text>
        <Text style={styles.headerSubtitle}>{plan.percentageOfIncome}% of income</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Health Score and Progress */}
        <View style={styles.statsContainer}>
          <View style={styles.healthContainer}>
            <PlanHealthScore score={plan.healthScore} size="large" />
          </View>

          <LinearGradient
            colors={[colors.glass.background, colors.glass.backgroundDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.progressCard}
          >
            <Text style={styles.currentAmount}>{formatCurrency(plan.cumulativeTotalForPlan)}</Text>
            <Text style={styles.currentAmountLabel}>Accumulated</Text>
            {plan.targetAmount && (
              <>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(100, (plan.cumulativeTotalForPlan / plan.targetAmount) * 100)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.targetAmountLabel}>
                  Goal: {formatCurrency(plan.targetAmount)}
                  {plan.targetDate && ` by ${plan.targetDate.toLocaleDateString()}`}
                </Text>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Projections Message */}
        {projections && projections.message && (
          <LinearGradient
            colors={[`${colors.primary}15`, `${colors.primary}05`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.projectionsMessage}
          >
            <Icon name="chart-line" size={20} color={colors.primary} />
            <Text style={styles.projectionsMessageText}>{projections.message}</Text>
          </LinearGradient>
        )}

        {/* Chart */}
        {chartData && (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Projection Chart</Text>
            <LineChart
              data={chartData}
              width={screenWidth - spacing.lg * 2}
              height={220}
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.glass.background,
                backgroundGradientTo: colors.glass.backgroundDark,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 217, 255, ${opacity})`,
                labelColor: (opacity = 1) => colors.text.tertiary,
                style: {
                  borderRadius: borderRadius.lg
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.primary
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* What-If Slider */}
        <WhatIfSlider
          userId={user.uid}
          planId={planId}
          currentPercentage={plan.percentageOfIncome}
        />

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {recommendations.map((rec, index) => renderRecommendation(rec, index))}
          </View>
        )}

        {/* Allocation Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Allocation Timeline</Text>
            <Text style={styles.sectionCount}>{allocations.length} allocations</Text>
          </View>

          {allocations.length > 0 ? (
            <FlatList
              data={allocations}
              keyExtractor={(item) => item.id}
              renderItem={renderAllocation}
              scrollEnabled={false}
            />
          ) : (
            <LinearGradient
              colors={[colors.glass.background, colors.glass.backgroundDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyAllocation}
            >
              <Icon name="inbox" size={32} color={colors.text.tertiary} />
              <Text style={styles.emptyText}>No allocations yet</Text>
              <Text style={styles.emptySubtext}>Allocations will appear when you receive income</Text>
            </LinearGradient>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  errorText: {
    ...typography.h2,
    color: colors.error,
    marginTop: spacing.lg
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxl
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: 4
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  healthContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    ...shadows.sm
  },
  currentAmount: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: 2
  },
  currentAmountLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.md
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.glass.backgroundDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4
  },
  targetAmountLabel: {
    ...typography.caption,
    color: colors.text.secondary
  },
  projectionsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary
  },
  projectionsMessageText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '600'
  },
  chartContainer: {
    marginBottom: spacing.lg
  },
  chart: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.md
  },
  section: {
    marginBottom: spacing.xl
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md
  },
  sectionCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600'
  },
  recommendationCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1
  },
  recommendationContent: {
    flex: 1
  },
  recommendationTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4
  },
  recommendationMessage: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20
  },
  allocationItem: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  allocationDate: {
    ...typography.body,
    color: colors.text.secondary
  },
  allocationAmount: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700'
  },
  allocationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  allocationLabel: {
    ...typography.caption,
    color: colors.text.tertiary
  },
  emptyAllocation: {
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderLight
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '600'
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4
  }
});

export default PlanDetailScreen;
