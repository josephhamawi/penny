import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExpenses, deleteExpense } from '../services/expenseService';
import { exportToExcel } from '../utils/csvExport';
import { importFromGoogleSheets } from '../services/googleSheetsService';
import { colors, shadows, typography } from '../theme/colors';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [showProgressModal, setShowProgressModal] = useState(false);
  const importAbortController = React.useRef(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
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

  const handleCancelImport = () => {
    if (importAbortController.current) {
      importAbortController.current.abort();
      importAbortController.current = null;
      setImporting(false);
      setShowProgressModal(false);
      Toast.show({
        type: 'info',
        text1: 'Import Cancelled',
        text2: 'Import has been stopped',
        position: 'bottom',
        visibilityTime: 3000,
      });
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
            setShowProgressModal(true);
            setImportProgress({ current: 0, total: 0 });
            importAbortController.current = new AbortController();

            try {
              const count = await importFromGoogleSheets(
                url.trim(),
                user.uid,
                (current, total) => {
                  setImportProgress({ current, total });
                },
                importAbortController.current.signal
              );

              setShowProgressModal(false);
              Toast.show({
                type: 'success',
                text1: 'Import Successful',
                text2: `Imported ${count} expense${count !== 1 ? 's' : ''} from Google Sheets`,
                position: 'bottom',
                visibilityTime: 4000,
              });
            } catch (error) {
              setShowProgressModal(false);
              if (error.name === 'AbortError') {
                // User cancelled - already shown toast in handleCancelImport
                return;
              }
              Toast.show({
                type: 'error',
                text1: 'Import Failed',
                text2: error.message || 'Failed to import from Google Sheets',
                position: 'bottom',
                visibilityTime: 4000,
              });
            } finally {
              setImporting(false);
              importAbortController.current = null;
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

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedExpenses(new Set());
  };

  const toggleExpenseSelection = (expenseId) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const selectAll = () => {
    if (selectedExpenses.size === expenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(expenses.map(e => e.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedExpenses.size === 0) return;

    Alert.alert(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenses.size} expense${selectedExpenses.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              let deletedCount = 0;
              for (const expenseId of selectedExpenses) {
                await deleteExpense(expenseId);
                deletedCount++;
              }
              Toast.show({
                type: 'success',
                text1: 'Deleted Successfully',
                text2: `${deletedCount} expense${deletedCount > 1 ? 's' : ''} deleted`,
                position: 'bottom',
                visibilityTime: 3000,
              });
              setSelectedExpenses(new Set());
              setSelectionMode(false);
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.message || 'Failed to delete expenses',
                position: 'bottom',
                visibilityTime: 3000,
              });
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
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

  const renderItem = ({ item }) => {
    const isSelected = selectedExpenses.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.selectedRow]}
        onPress={() => {
          if (selectionMode) {
            toggleExpenseSelection(item.id);
          } else {
            navigation.navigate('EditExpense', { expense: item });
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleExpenseSelection(item.id);
          }
        }}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <Icon
              name={isSelected ? 'check-square' : 'square'}
              size={20}
              color={isSelected ? colors.primary : colors.text.tertiary}
              solid={isSelected}
            />
          </View>
        )}
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
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
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
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      >
        <View style={styles.topBarLeft}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../public/newicon.png')}
              style={styles.logoImageExpense}
              resizeMode="contain"
            />
          </View>
          <View style={styles.topBarTextContainer}>
            <Text style={styles.topBarTitle}>Penny</Text>
            <Text style={styles.topBarEmail}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </LinearGradient>

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
        {selectionMode ? (
          <>
            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={toggleSelectionMode}
            >
              <Text style={styles.selectionActionButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={selectAll}
            >
              <Text style={styles.selectionActionButtonText}>
                {selectedExpenses.size === expenses.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, (selectedExpenses.size === 0 || deleting) && styles.buttonDisabled]}
              onPress={handleDeleteSelected}
              disabled={selectedExpenses.size === 0 || deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.text.primary} size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  Delete ({selectedExpenses.size})
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      {/* Import Progress Modal */}
      <Modal
        visible={showProgressModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Importing Expenses</Text>
            <Text style={styles.modalProgress}>
              {importProgress.total > 0
                ? `${importProgress.current} of ${importProgress.total} expenses`
                : 'Preparing...'}
            </Text>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: importProgress.total > 0
                      ? `${(importProgress.current / importProgress.total) * 100}%`
                      : '0%'
                  }
                ]}
              />
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelImport}
            >
              <Text style={styles.cancelButtonText}>Cancel Import</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoImageExpense: {
    width: '100%',
    height: '100%',
  },
  topBarTextContainer: {
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  topBarEmail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  headerCell: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  cell: {
    fontSize: 11,
    color: colors.text.primary,
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
    color: colors.income,
    fontWeight: '600',
  },
  outAmount: {
    color: colors.expense,
    fontWeight: '600',
  },
  balanceAmount: {
    fontWeight: '700',
    color: colors.primary,
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
    color: colors.text.tertiary,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.disabled,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
  },
  actionButton: {
    flex: 0.7,
    backgroundColor: colors.glass.background,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 15,
    padding: 30,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalProgress: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text.secondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.glass.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  cancelButton: {
    backgroundColor: colors.expense,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    paddingRight: 8,
    paddingLeft: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRow: {
    backgroundColor: colors.glass.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  selectionActionButton: {
    flex: 1,
    backgroundColor: colors.glass.background,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionActionButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.expense,
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExpenseListScreen;
