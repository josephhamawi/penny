import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { getCategoryConfig } from '../config/categories';
import { formatCurrency, formatNumber } from '../utils/formatNumber';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // month, year
  const { user } = useAuth();

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

  // Calculate current period expenses
  const getPeriodExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(expense => {
      const expenseDate = expense.date;
      if (period === 'month') {
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
      } else {
        return expenseDate.getFullYear() === currentYear;
      }
    });
  };

  const periodExpenses = getPeriodExpenses();

  const totalExpenses = periodExpenses.reduce((sum, exp) => sum + exp.outAmount, 0);
  const totalIncome = periodExpenses.reduce((sum, exp) => sum + exp.inAmount, 0);

  // Calculate category breakdown
  const getCategoryBreakdown = () => {
    const breakdown = {};
    periodExpenses.forEach(expense => {
      if (expense.outAmount > 0) {
        breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.outAmount;
      }
    });
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();
  const sortedCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1] - a[1]);

  // Prepare chart data - round amounts to 3 digits
  const chartData = sortedCategories.slice(0, 6).map(([category, amount]) => ({
    name: category.length > 15 ? category.substring(0, 12) + '...' : category,
    amount: Math.round(amount * 1000) / 1000, // Round to 3 decimal places
    color: getCategoryConfig(category).color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 11,
  }));

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
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>
            {period === 'month' ? 'This Month' : 'This Year'}
          </Text>
        </View>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'year' && styles.periodButtonActive]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[styles.periodText, period === 'year' && styles.periodTextActive]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.summaryIcon}>
            <Icon name="arrow-down" size={24} color="#4CAF50" solid />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
              ${formatCurrency(totalIncome)}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <View style={styles.summaryIcon}>
            <Icon name="arrow-up" size={24} color="#F44336" solid />
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#F44336' }]}>
              ${formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
      </View>

      {/* Pie Chart */}
      {chartData.length > 0 ? (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expense Breakdown</Text>
          <PieChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Icon name="chart-pie" size={60} color="#E0E0E0" />
          <Text style={styles.emptyChartText}>No expenses to show</Text>
        </View>
      )}

      {/* Category List */}
      {sortedCategories.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {sortedCategories.map(([category, amount]) => {
            const config = getCategoryConfig(category);
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);

            return (
              <View key={category} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: config.bgColor }]}>
                  <Icon name={config.icon} size={22} color={config.color} />
                </View>
                <View style={styles.categoryContent}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryAmount}>${formatCurrency(amount)}</Text>
                  </View>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryBarFill,
                        { width: `${percentage}%`, backgroundColor: config.color }
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>{percentage}% of total</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 30 }} />
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
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#6C63FF',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  periodTextActive: {
    color: '#FFF',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: 20,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyChart: {
    margin: 20,
    padding: 60,
    backgroundColor: '#FFF',
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
    marginTop: 15,
  },
  categorySection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#999',
  },
});

export default StatisticsScreen;
