import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { getCategoryConfig } from '../config/categories';
import { getMonthlyBudget } from '../services/budgetService';
import { formatCurrency, formatNumber } from '../utils/formatNumber';
import { useSubscription } from '../hooks/useSubscription';
import PremiumBadge from '../components/PremiumBadge';
import LockedFeatureCard from '../components/LockedFeatureCard';

const HomeScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState(5000);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  useEffect(() => {
    loadBudget();
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
    const unsubscribe = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Total Balance</Text>
          <Text style={styles.headerAmount}>${formatCurrency(currentBalance)}</Text>
        </View>
        <View style={styles.headerActions}>
          <PremiumBadge onPress={() => navigation.navigate('SubscriptionManagement')} />
          <TouchableOpacity style={styles.notificationButton}>
            <Icon name="bell" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Budget Card */}
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

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
          <Icon name="arrow-down" size={24} color="#4CAF50" solid />
          <Text style={styles.statValue}>${formatNumber(totalIncome)}</Text>
          <Text style={styles.statLabel}>Income</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#FFEBEE' }]}>
          <Icon name="arrow-up" size={24} color="#F44336" solid />
          <Text style={styles.statValue}>${formatNumber(totalExpenses)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
      </View>

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
                      color={isIncome ? '#4CAF50' : '#F44336'}
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
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerSubtitle: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 5,
  },
  headerAmount: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  upgradeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginRight: 10,
  },
  premiumSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  budgetCard: {
    margin: 20,
    marginTop: -20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  budgetBar: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetUsed: {
    fontSize: 12,
    color: '#666',
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#4CAF50',
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
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAll: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#333',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#999',
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#F44336',
  },
  emptyRecords: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
  },
  emptyRecordsText: {
    color: '#999',
    fontSize: 14,
  },
});

export default HomeScreen;
