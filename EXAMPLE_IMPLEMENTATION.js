/**
 * EXAMPLE: Modern Home Screen with New Design System
 *
 * This is an example implementation showing how to use the new
 * design tokens, components, and floating UI patterns.
 *
 * Key Features Demonstrated:
 * - Multi-layer background system
 * - GlassCard components with variants
 * - Budget ring with gradient
 * - Floating action button
 * - New typography system
 * - Currency display with monospace font
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import new components
import GlassCard from './src/components/GlassCard';
import PrimaryButton from './src/components/PrimaryButton';
import GlassInput from './src/components/GlassInput';

// Import theme
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
  sizes,
} from './src/theme/colors';

const ExampleHomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [monthlyBudget] = useState(5000);
  const [totalExpenses] = useState(3247.50);
  const [currentBalance] = useState(12847.32);
  const [totalIncome] = useState(6500);

  const budgetUsed = (totalExpenses / monthlyBudget) * 100;
  const budgetRemaining = monthlyBudget - totalExpenses;

  return (
    <View style={styles.container}>
      {/* Multi-layer Background */}
      <View style={styles.backgroundLayer1} />
      <View style={styles.backgroundLayer2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Balance */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, User</Text>
          <Text style={styles.headerSubtitle}>Welcome back to Spensely</Text>

          {/* Current Balance Card - Gradient */}
          <GlassCard variant="gradient" style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Icon name="piggy-bank" size={24} color={colors.text.primary} />
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {formatCurrency(currentBalance)}
            </Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceItem}>
                <Icon name="arrow-down" size={14} color={colors.income} />
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={styles.balanceItemValue}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Icon name="arrow-up" size={14} color={colors.expense} />
                <Text style={styles.balanceItemLabel}>Expenses</Text>
                <Text style={styles.balanceItemValue}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Budget Ring Section */}
        <GlassCard variant="elevated" style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <TouchableOpacity>
              <Icon name="ellipsis-h" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.budgetRingContainer}>
            {/* Budget Ring (would use Svg or react-native-circular-progress) */}
            <View style={styles.budgetRing}>
              <View style={styles.budgetRingCenter}>
                <Text style={styles.budgetPercentage}>
                  {Math.round(budgetUsed)}%
                </Text>
                <Text style={styles.budgetLabel}>Used</Text>
              </View>
            </View>

            {/* Budget Stats */}
            <View style={styles.budgetStats}>
              <View style={styles.budgetStat}>
                <View style={[styles.budgetDot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={styles.budgetStatLabel}>Budget</Text>
                  <Text style={styles.budgetStatValue}>
                    {formatCurrency(monthlyBudget)}
                  </Text>
                </View>
              </View>
              <View style={styles.budgetStat}>
                <View style={[styles.budgetDot, { backgroundColor: colors.success }]} />
                <View>
                  <Text style={styles.budgetStatLabel}>Remaining</Text>
                  <Text style={styles.budgetStatValue}>
                    {formatCurrency(budgetRemaining)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={colors.incomeGradient}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="plus" size={20} color={colors.text.primary} />
              </LinearGradient>
              <Text style={styles.actionButtonLabel}>Add Income</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={colors.expenseGradient}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="minus" size={20} color={colors.text.primary} />
              </LinearGradient>
              <Text style={styles.actionButtonLabel}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={colors.savingsGradient}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="piggy-bank" size={20} color={colors.text.primary} />
              </LinearGradient>
              <Text style={styles.actionButtonLabel}>Savings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Cards */}
          {mockTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </View>

        {/* Spacer for floating tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: sizes.tabBar.height + spacing.xl + insets.bottom }]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="plus" size={24} color={colors.text.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const TransactionCard = ({ transaction }) => (
  <TouchableOpacity activeOpacity={0.7}>
    <GlassCard style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <LinearGradient
          colors={transaction.type === 'expense' ? colors.expenseGradient : colors.incomeGradient}
          style={styles.transactionIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon
            name={transaction.icon}
            size={20}
            color={colors.text.primary}
          />
        </LinearGradient>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{transaction.title}</Text>
          <Text style={styles.transactionDate}>{transaction.date}</Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: transaction.type === 'expense' ? colors.expense : colors.income }
      ]}>
        {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
      </Text>
    </GlassCard>
  </TouchableOpacity>
);

// Helper function
const formatCurrency = (amount) => {
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Mock data
const mockTransactions = [
  {
    id: 1,
    title: 'Grocery Shopping',
    date: 'Today, 2:30 PM',
    amount: 127.50,
    type: 'expense',
    icon: 'shopping-cart',
  },
  {
    id: 2,
    title: 'Salary Deposit',
    date: 'Yesterday, 9:00 AM',
    amount: 3500.00,
    type: 'income',
    icon: 'money-bill-wave',
  },
  {
    id: 3,
    title: 'Coffee',
    date: 'Nov 6, 8:15 AM',
    amount: 5.50,
    type: 'expense',
    icon: 'coffee',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },

  backgroundLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.background.layer1,
    opacity: 0.5,
  },

  backgroundLayer2: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 100,
    height: 200,
    backgroundColor: colors.primary,
    opacity: 0.05,
    borderRadius: 200,
    transform: [{ scaleX: 2 }],
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    marginBottom: spacing.xl,
  },

  greeting: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },

  headerSubtitle: {
    ...typography.bodySecondary,
    marginBottom: spacing.lg,
  },

  balanceCard: {
    marginTop: spacing.md,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  balanceLabel: {
    ...typography.caption,
    marginLeft: spacing.sm,
    color: colors.text.primary,
  },

  balanceAmount: {
    ...typography.currency.large,
    marginVertical: spacing.sm,
  },

  balanceFooter: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },

  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: spacing.md,
  },

  balanceItemLabel: {
    ...typography.small,
    marginLeft: spacing.xs,
    flex: 1,
  },

  balanceItemValue: {
    ...typography.bodyBold,
    fontSize: 14,
  },

  budgetCard: {
    marginBottom: spacing.lg,
  },

  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    ...typography.h3,
  },

  budgetRingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  budgetRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },

  budgetRingCenter: {
    alignItems: 'center',
  },

  budgetPercentage: {
    ...typography.h2,
    color: colors.primary,
  },

  budgetLabel: {
    ...typography.small,
  },

  budgetStats: {
    flex: 1,
  },

  budgetStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  budgetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },

  budgetStatLabel: {
    ...typography.caption,
    marginBottom: 2,
  },

  budgetStatValue: {
    ...typography.bodyBold,
  },

  quickActions: {
    marginBottom: spacing.lg,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },

  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.xs,
  },

  actionButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.glow.cyan,
  },

  actionButtonLabel: {
    ...typography.caption,
    textAlign: 'center',
  },

  recentSection: {
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  seeAllLink: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 14,
  },

  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionTitle: {
    ...typography.bodyBold,
    marginBottom: 2,
  },

  transactionDate: {
    ...typography.small,
  },

  transactionAmount: {
    ...typography.currency.small,
    fontSize: 18,
  },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: sizes.fab.size,
    height: sizes.fab.size,
    borderRadius: sizes.fab.size / 2,
    overflow: 'hidden',
    ...shadows.floating,
  },

  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ExampleHomeScreen;
