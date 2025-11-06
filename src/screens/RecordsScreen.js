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
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { exportToExcel } from '../utils/csvExport';
import { importFromGoogleSheets } from '../services/googleSheetsService';
import { getCategoryConfig } from '../config/categories';
import { formatCurrency } from '../utils/formatNumber';

const RecordsScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
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

  const handleImport = () => {
    Alert.prompt(
      'Import from Google Sheets',
      'Enter the Google Sheets URL:\n\nMake sure the sheet is shared publicly with "Anyone with the link can view".\n\nExpected columns:\n• Date (format: mm/dd/YYYY)\n• Description\n• Category (optional, defaults to "Other")\n• In\n• Out',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Import',
          onPress: async (url) => {
            if (!url || !url.trim()) {
              Toast.show({
                type: 'error',
                text1: 'Invalid URL',
                text2: 'Please enter a valid Google Sheets URL',
                position: 'bottom',
              });
              return;
            }

            setImporting(true);
            try {
              const count = await importFromGoogleSheets(url.trim(), user.uid);
              Toast.show({
                type: 'success',
                text1: 'Import Successful',
                text2: `Imported ${count} expense${count !== 1 ? 's' : ''} from Google Sheets`,
                position: 'bottom',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Import Failed',
                text2: error.message || 'Failed to import from Google Sheets',
                position: 'bottom',
              });
            } finally {
              setImporting(false);
            }
          }
        }
      ],
      'plain-text'
    );
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
              color={isIncome ? '#4CAF50' : '#F44336'}
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
      <Icon name="receipt" size={80} color="#E0E0E0" />
      <Text style={styles.emptyText}>No expenses yet</Text>
      <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Records</Text>
          <Text style={styles.headerSubtitle}>{expenses.length} transactions</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#6C63FF" />
            ) : (
              <Icon name="cloud-download-alt" size={20} color="#6C63FF" solid />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#6C63FF" />
            ) : (
              <Icon name="file-upload" size={20} color="#6C63FF" solid />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6C63FF']} />
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
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
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
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#333',
    marginBottom: 6,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordCategory: {
    fontSize: 13,
    color: '#999',
  },
  recordDot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  recordDate: {
    fontSize: 13,
    color: '#999',
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
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  incomeBadge: {
    backgroundColor: '#E8F5E9',
  },
  expenseBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
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
    color: '#999',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RecordsScreen;
