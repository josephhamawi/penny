import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { exportToExcel } from '../utils/csvExport';
import { getCategoryConfig } from '../config/categories';
import { formatCurrency } from '../utils/formatNumber';
import { colors, shadows, typography } from '../theme/colors';

const RecordsScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setLoading(false);
      setRefreshing(false);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleExport = async () => {
    if (expenses.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Data',
        text2: 'There are no expenses to export',
        position: 'bottom',
      });
      return;
    }

    setExporting(true);
    try {
      await exportToExcel(expenses);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Expenses exported to Excel',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Export Error',
        text2: 'Failed to export expenses',
        position: 'bottom',
      });
    } finally {
      setExporting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
  };

  const renderItem = ({ item }) => {
    const config = getCategoryConfig(item.category);
    const isIncome = item.inAmount > 0;

    return (
      <TouchableOpacity
        style={styles.recordCard}
        onPress={() => navigation.navigate('EditExpense', { expense: item })}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Icon name={config.icon} size={28} color={config.color} />
          <View style={styles.arrowIndicator}>
            <Icon
              name={isIncome ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={isIncome ? colors.income : colors.expense}
              solid
            />
          </View>
        </View>

        <View style={styles.recordDetails}>
          <Text style={styles.recordDescription}>{item.description}</Text>
          <View style={styles.recordMeta}>
            <Text style={styles.recordCategory}>{item.category}</Text>
            <Text style={styles.recordDot}>•</Text>
            <Text style={styles.recordDate}>
              {item.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.recordRight}>
          <Text style={[styles.recordAmount, isIncome ? styles.income : styles.expense]}>
            {isIncome ? '+' : '-'}${formatCurrency(isIncome ? item.inAmount : item.outAmount)}
          </Text>
          <View style={[styles.statusBadge, isIncome ? styles.incomeBadge : styles.expenseBadge]}>
            <Text style={[styles.statusText, isIncome ? styles.incomeText : styles.expenseText]}>
              {isIncome ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt" size={80} color={colors.glass.borderLight} />
      <Text style={styles.emptyText}>No expenses yet</Text>
      <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Records</Text>
          <Text style={styles.headerSubtitle}>{expenses.length} transactions</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Icon name="file-upload" size={20} color={colors.text.primary} solid />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* List */}
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        contentContainerStyle={[
          styles.listContent,
          expenses.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Icon name="plus" size={24} color="#FFF" solid />
      </TouchableOpacity>
    </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 28,
  },
  headerSubtitle: {
    ...typography.caption,
    opacity: 0.9,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    ...shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  recordDetails: {
    flex: 1,
  },
  recordDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordCategory: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  recordDot: {
    fontSize: 13,
    color: colors.text.secondary,
    marginHorizontal: 6,
  },
  recordDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incomeBadge: {
    backgroundColor: 'rgba(0, 255, 163, 0.15)',
  },
  expenseBadge: {
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  incomeText: {
    color: colors.income,
  },
  expenseText: {
    color: colors.expense,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
});

export default RecordsScreen;
