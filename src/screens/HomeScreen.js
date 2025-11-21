import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { getCategoryConfig } from '../config/categories';
import { getMonthlyBudget } from '../services/budgetService';
import { formatCurrency, formatNumber } from '../utils/formatNumber';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBadge from '../components/PremiumBadge';
import LockedFeatureCard from '../components/LockedFeatureCard';
import { colors, shadows, typography } from '../theme/colors';
import { startSheetPolling } from '../services/sheetPollingService';
import { subscribeToSpendingPlan } from '../services/spendingPlanService';

const HomeScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  const [spendingPlan, setSpendingPlan] = useState(null);
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  useEffect(() => {
    loadBudget();
    // Start sheet polling for two-way sync
    startSheetPolling();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBudget();
    });

    return unsubscribe;
  }, [navigation]);

  const loadBudget = async () => {
    const budget = await getMonthlyBudget();
    setMonthlyBudget(budget);
  };

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeExpenses = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setLoading(false);
    });

    // Subscribe to spending plan updates
    const unsubscribePlan = subscribeToSpendingPlan(user.uid, (updatedPlan) => {
      setSpendingPlan(updatedPlan);
    });

    return () => {
      if (unsubscribeExpenses) {
        unsubscribeExpenses();
      }
      if (unsubscribePlan) {
        unsubscribePlan();
      }
    };
  }, [user]);

  // Calculate current month expenses
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate.getMonth() === currentMonth &&
             expenseDate.getFullYear() === currentYear;
    });
  };

  const currentMonthExpenses = getCurrentMonthExpenses();

  const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.outAmount, 0);
  const totalIncome = currentMonthExpenses.reduce((sum, exp) => sum + exp.inAmount, 0);
  const currentBalance = expenses.length > 0 ? expenses[0].balance : 0;
  const budgetUsed = (totalExpenses / monthlyBudget) * 100;
  const budgetRemaining = monthlyBudget - totalExpenses;

  // Get recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

  // Helper to check if date is in current month
  const isCurrentMonth = (date) => {
    const now = new Date();
    const expenseDate = date instanceof Date ? date : date.toDate();
    return expenseDate.getMonth() === now.getMonth() &&
           expenseDate.getFullYear() === now.getFullYear();
  };

  // Get top 3 categories from spending plan with progress
  const getTopSpendingCategories = () => {
    if (!spendingPlan || !spendingPlan.allocations) return [];

    // Filter to categories with percentage > 0 and sort by percentage (descending)
    const activeAllocations = spendingPlan.allocations
      .filter(alloc => alloc.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    // Calculate progress for each
    return activeAllocations.map(allocation => {
      const planned = allocation.targetAmount || 0;
      const actual = currentMonthExpenses
        .filter(e => e.category === allocation.categoryName)
        .reduce((sum, e) => sum + (e.outAmount || 0), 0);

      const percentage = planned > 0 ? (actual / planned) * 100 : 0;

      return {
        ...allocation,
        actual,
        percentage: Math.min(percentage, 100)
      };
    });
  };

  const topCategories = getTopSpendingCategories();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Extended Header with Gradient - includes Total Balance and Budget */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerExtended}
      >
        {/* Top Section - Total Balance */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainerHome}>
              <Image
                source={require('../../public/newicon.png')}
                style={styles.logoImageHome}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={styles.headerSubtitle}>Total Balance</Text>
              <Text style={styles.headerAmount}>${formatCurrency(currentBalance)}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <PremiumBadge onPress={() => navigation.navigate('SubscriptionManagement')} />
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="bell" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget Card - now inside gradient */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Monthly Budget Limit</Text>
            <Text style={styles.budgetAmount}>${formatNumber(monthlyBudget)}</Text>
          </View>
          <View style={styles.budgetBarContainer}>
            <View style={[styles.budgetBar, { width: `${Math.min(budgetUsed, 100)}%` }]} />
          </View>
          <View style={styles.budgetFooter}>
            <Text style={styles.budgetUsed}>${formatCurrency(totalExpenses)} spent</Text>
            <Text style={styles.budgetRemaining}>${formatCurrency(budgetRemaining)} left</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statBox}>
          <Icon name="arrow-down" size={24} color={colors.income} solid />
          <Text style={styles.statValue}>${formatNumber(totalIncome)}</Text>
          <Text style={styles.statLabel}>Income</Text>
        </View>
        <View style={styles.statBox}>
          <Icon name="arrow-up" size={24} color={colors.expense} solid />
          <Text style={styles.statValue}>${formatNumber(totalExpenses)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
      </View>


      {/* Spending Plan Overview Widget */}
      {spendingPlan && topCategories.length > 0 && (
        <TouchableOpacity
          style={styles.spendingPlanWidget}
          onPress={() => navigation.navigate('SpendingPlan')}
          activeOpacity={0.8}
        >
          <View style={styles.widgetHeader}>
            <View style={styles.widgetTitleContainer}>
              <Icon name="wallet" size={20} color={colors.primary} solid />
              <Text style={styles.widgetTitle}>Spending Plan</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.text.tertiary} />
          </View>

          <View style={styles.widgetCategories}>
            {topCategories.map((category, index) => {
              const categoryConfig = getCategoryConfig(category.categoryName);
              const progressColor = category.percentage <= 80
                ? colors.success
                : category.percentage <= 100
                ? colors.warning
                : colors.error;

              return (
                <View key={category.categoryId || index} style={styles.widgetCategory}>
                  <View style={styles.widgetCategoryHeader}>
                    <View style={[styles.widgetCategoryIcon, { backgroundColor: categoryConfig.bgColor }]}>
                      <Icon name={categoryConfig.icon} size={12} color={categoryConfig.color} solid />
                    </View>
                    <Text style={styles.widgetCategoryName} numberOfLines={1}>
                      {category.categoryName}
                    </Text>
                    <Text style={styles.widgetCategoryAmount}>
                      ${formatCurrency(category.actual)} / ${formatCurrency(category.targetAmount)}
                    </Text>
                  </View>
                  <View style={styles.widgetProgressBar}>
                    <View
                      style={[
                        styles.widgetProgressFill,
                        {
                          width: `${category.percentage}%`,
                          backgroundColor: progressColor
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      )}

      {/* Upgrade Banner for Free Users */}
      {!isPremium && showUpgradeBanner && (
        <View style={styles.upgradeBanner}>
          <Icon name="star" size={20} color="#FFD700" />
          <Text style={styles.bannerText}>
            Unlock AI insights and savings goals!
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
            <Text style={styles.upgradeButton}>Upgrade</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowUpgradeBanner(false)}>
            <Icon name="times" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Features Section */}
      {!isPremium && (
        <View style={styles.premiumSection}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <LockedFeatureCard
            title="Savings Goals"
            description="Set goals and get AI-powered recommendations to achieve them faster"
            icon="bullseye"
            onPress={() => navigation.navigate('Paywall')}
          />
          <LockedFeatureCard
            title="Expense Personality"
            description="Get monthly insights about your spending habits and personality"
            icon="chart-line"
            onPress={() => navigation.navigate('Paywall')}
          />
        </View>
      )}

      {/* Recent Records */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Records')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length > 0 ? (
          recentExpenses.map((expense) => {
            const config = getCategoryConfig(expense.category);
            const isIncome = expense.inAmount > 0;
            return (
              <TouchableOpacity
                key={expense.id}
                style={styles.recordItem}
                onPress={() => navigation.navigate('EditExpense', { expense })}
              >
                <View style={[styles.recordIcon, { backgroundColor: config.bgColor }]}>
                  <Icon name={config.icon} size={24} color={config.color} />
                  <View style={styles.arrowIndicator}>
                    <Icon
                      name={isIncome ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color={isIncome ? colors.income : colors.expense}
                      solid
                    />
                  </View>
                </View>
                <View style={styles.recordContent}>
                  <Text style={styles.recordTitle}>{expense.description}</Text>
                  <Text style={styles.recordDate}>
                    {expense.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <Text style={[
                  styles.recordAmount,
                  isIncome ? styles.incomeAmount : styles.expenseAmount
                ]}>
                  {isIncome ? '+' : '-'}${formatCurrency(Math.abs(expense.inAmount || expense.outAmount))}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyRecords}>
            <Text style={styles.emptyRecordsText}>No expenses yet</Text>
          </View>
        )}
      </View>

      {/* Add some padding at the bottom */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerExtended: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainerHome: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoImageHome: {
    width: '100%',
    height: '100%',
  },
  headerSubtitle: {
    ...typography.caption,
    opacity: 0.9,
    marginBottom: 5,
  },
  headerAmount: {
    ...typography.h1,
    fontSize: 36,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.lg,
  },
  featureCardGradient: {
    padding: 20,
  },
  featureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    ...shadows.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 10,
  },
  upgradeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 10,
  },
  premiumSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  budgetCard: {
    padding: 20,
    backgroundColor: 'rgba(10, 14, 39, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    ...shadows.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  budgetBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  budgetBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetUsed: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    ...shadows.sm,
  },
  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  arrowIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: colors.income,
  },
  expenseAmount: {
    color: colors.expense,
  },
  emptyRecords: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyRecordsText: {
    color: colors.text.tertiary,
    fontSize: 14,
  },
  // Spending Plan Widget Styles
  spendingPlanWidget: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...shadows.sm,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  widgetCategories: {
    gap: 12,
  },
  widgetCategory: {
    gap: 6,
  },
  widgetCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetCategoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  widgetCategoryAmount: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  widgetProgressBar: {
    height: 6,
    backgroundColor: colors.glass.backgroundMedium,
    borderRadius: 3,
    overflow: 'hidden',
  },
  widgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default HomeScreen;
