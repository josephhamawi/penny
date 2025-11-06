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
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses } from '../services/expenseService';
import { exportToExcel } from '../utils/csvExport';
import { importFromGoogleSheets } from '../services/googleSheetsService';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleExport = async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'There are no expenses to export');
      return;
    }

    setExporting(true);
    try {
      await exportToExcel(expenses);
      Alert.alert('Success', 'Expenses exported to Excel successfully');
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export expenses');
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
                visibilityTime: 3000,
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
                visibilityTime: 4000,
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Import Failed',
                text2: error.message || 'Failed to import from Google Sheets',
                position: 'bottom',
                visibilityTime: 4000,
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

  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, styles.refCell]}>Ref#</Text>
      <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
      <Text style={[styles.headerCell, styles.descCell]}>Description</Text>
      <Text style={[styles.headerCell, styles.categoryCell]}>Category</Text>
      <Text style={[styles.headerCell, styles.amountCell]}>In</Text>
      <Text style={[styles.headerCell, styles.amountCell]}>Out</Text>
      <Text style={[styles.headerCell, styles.amountCell]}>Balance</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => navigation.navigate('EditExpense', { expense: item })}
      activeOpacity={0.7}
    >
      <Text style={[styles.cell, styles.refCell]} numberOfLines={1}>
        {item.ref}
      </Text>
      <Text style={[styles.cell, styles.dateCell]} numberOfLines={1}>
        {item.date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </Text>
      <Text style={[styles.cell, styles.descCell]} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={[styles.cell, styles.categoryCell]} numberOfLines={1}>
        {item.category}
      </Text>
      <Text style={[styles.cell, styles.amountCell, item.inAmount > 0 && styles.inAmount]}>
        {item.inAmount > 0 ? `$${item.inAmount.toFixed(2)}` : '-'}
      </Text>
      <Text style={[styles.cell, styles.amountCell, item.outAmount > 0 && styles.outAmount]}>
        {item.outAmount > 0 ? `$${item.outAmount.toFixed(2)}` : '-'}
      </Text>
      <Text style={[styles.cell, styles.amountCell, styles.balanceAmount]}>
        ${item.balance.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No expenses yet</Text>
      <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Expense Monitor</Text>
          <Text style={styles.topBarEmail}>
            {user?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={expenses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={expenses.length === 0 && styles.emptyList}
        />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionButton, importing && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Import</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, exporting && styles.buttonDisabled]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Export</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  topBarEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cell: {
    fontSize: 11,
    color: '#333',
  },
  refCell: {
    width: '10%',
  },
  dateCell: {
    width: '13%',
  },
  descCell: {
    width: '22%',
  },
  categoryCell: {
    width: '15%',
  },
  amountCell: {
    width: '13.33%',
    textAlign: 'right',
  },
  inAmount: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  outAmount: {
    color: '#f44336',
    fontWeight: '600',
  },
  balanceAmount: {
    fontWeight: '700',
    color: '#2196F3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 0.7,
    backgroundColor: '#f5f5f5',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ExpenseListScreen;
