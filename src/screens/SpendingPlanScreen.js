import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useAuth } from '../contexts/AuthContext';
import {
  getSpendingPlan,
  saveSpendingPlan,
  updateAllocation,
  updateMonthlyIncome,
  createDefaultSpendingPlan,
  getTotalAllocatedPercentage,
  isOverBudget,
  subscribeToSpendingPlan
} from '../services/spendingPlanService';
import { getCategoryConfig, CATEGORIES } from '../config/categories';
import { formatCurrency } from '../utils/formatNumber';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import Toast from 'react-native-toast-message';
import { subscribeToExpenses } from '../services/expenseService';

const SpendingPlanScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [allocations, setAllocations] = useState([]);
  const [spendingPlan, setSpendingPlan] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const { user } = useAuth();

  // Debounce timer for saving
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Track if user is currently editing to prevent subscription overwrites
  const [isEditing, setIsEditing] = useState(false);

  // Modal and category selection state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Helper function to check if date is in current month
  const isCurrentMonth = (date) => {
    const now = new Date();
    const expenseDate = date instanceof Date ? date : date.toDate();
    return expenseDate.getMonth() === now.getMonth() &&
           expenseDate.getFullYear() === now.getFullYear();
  };

  // Calculate progress for a category
  const calculateProgress = (allocation) => {
    const planned = allocation.targetAmount || 0;
    const actual = expenses
      .filter(e => e.category === allocation.categoryName)
      .filter(e => isCurrentMonth(e.date))
      .reduce((sum, e) => sum + (e.outAmount || 0), 0);

    const remaining = planned - actual;
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;

    let status = 'No Spending';
    if (actual > 0) {
      if (percentage <= 80) {
        status = 'On Track';
      } else if (percentage <= 100) {
        status = 'Near Limit';
      } else {
        status = 'Over Budget';
      }
    }

    return {
      planned,
      actual,
      remaining,
      percentage,
      status
    };
  };

  // Get color based on progress status
  const getProgressColor = (percentage) => {
    if (percentage <= 80) return colors.success;
    if (percentage <= 100) return colors.warning;
    return colors.error;
  };

  useEffect(() => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    loadSpendingPlan();

    // Subscribe to real-time updates
    const unsubscribePlan = subscribeToSpendingPlan(user.uid, (updatedPlan) => {
      if (updatedPlan) {
        // Only update if user is not actively editing (prevents slider reset)
        if (!isEditing) {
          setSpendingPlan(updatedPlan);
          setMonthlyIncome(updatedPlan.monthlyIncome.toString());
          setAllocations(updatedPlan.allocations);
        }
      }
      setLoading(false);
    });

    // Subscribe to expenses for progress tracking
    const unsubscribeExpenses = subscribeToExpenses(user.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses);
    });

    return () => {
      if (unsubscribePlan) unsubscribePlan();
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (saveTimeout) clearTimeout(saveTimeout);
    };
  }, [user]);

  const loadSpendingPlan = async () => {
    try {
      const plan = await getSpendingPlan();
      if (plan) {
        setSpendingPlan(plan);
        setMonthlyIncome(plan.monthlyIncome.toString());
        // Filter to only show allocations with percentage > 0 (user-added categories)
        setAllocations(plan.allocations.filter(alloc => alloc.percentage > 0));
      } else {
        // Start with empty allocations - user will add categories manually
        setAllocations([]);
        setMonthlyIncome('0');
      }
    } catch (error) {
      console.error('Error loading spending plan:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load spending plan',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeChange = (value) => {
    setMonthlyIncome(value);
  };

  const handleIncomeSave = async () => {
    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(async () => {
      try {
        setSaving(true);
        const income = parseFloat(monthlyIncome) || 0;
        await updateMonthlyIncome(null, income);
        Toast.show({
          type: 'success',
          text1: 'Saved',
          text2: 'Monthly income updated',
          position: 'top',
          topOffset: 60,
        });
      } catch (error) {
        console.error('Error saving monthly income:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to save monthly income',
          position: 'top',
          topOffset: 60,
        });
      } finally {
        setSaving(false);
      }
    }, 500);

    setSaveTimeout(timeout);
  };

  const handleAllocationChange = async (categoryId, newPercentage) => {
    console.log('[SpendingPlan] Updating allocation:', categoryId, newPercentage);

    // Mark as editing to prevent subscription updates
    setIsEditing(true);

    // Update local state immediately for smooth UI
    const updatedAllocations = allocations.map(alloc =>
      alloc.categoryId === categoryId
        ? { ...alloc, percentage: newPercentage }
        : alloc
    );
    setAllocations(updatedAllocations);

    // Debounced save
    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(async () => {
      try {
        console.log('[SpendingPlan] Saving allocation to Firestore...');
        await updateAllocation(null, categoryId, newPercentage);
        console.log('[SpendingPlan] Allocation saved successfully');
        // Allow subscription updates again after successful save
        setTimeout(() => setIsEditing(false), 100);
      } catch (error) {
        console.error('[SpendingPlan] Error updating allocation:', error);
        console.error('[SpendingPlan] Error details:', JSON.stringify(error));
        // Allow subscription updates even on error
        setIsEditing(false);
        // Don't reload - it causes UI reset. User's local changes remain visible.
        // Data will sync on next successful save or screen reload.
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to save changes',
          position: 'top',
          topOffset: 60,
        });
      }
    }, 500);

    setSaveTimeout(timeout);
  };

  // Add a new category to the spending plan
  const handleAddCategory = async (categoryName) => {
    try {
      const categoryId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Check if category already exists
      if (allocations.some(alloc => alloc.categoryId === categoryId)) {
        Toast.show({
          type: 'info',
          text1: 'Already Added',
          text2: `${categoryName} is already in your plan`,
          position: 'top',
          topOffset: 60,
        });
        return;
      }

      // Create new allocation
      const newAllocation = {
        categoryId,
        categoryName,
        percentage: 0,
        targetAmount: 0
      };

      // Add to local state
      const updatedAllocations = [...allocations, newAllocation];
      setAllocations(updatedAllocations);

      // Save to Firestore (with all existing allocations)
      await saveSpendingPlan(null, {
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        allocations: updatedAllocations,
        createdAt: spendingPlan?.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      setShowCategoryModal(false);
      setCategorySearch('');

      Toast.show({
        type: 'success',
        text1: 'Category Added',
        text2: `${categoryName} added to your plan`,
        position: 'top',
        topOffset: 60,
      });
    } catch (error) {
      console.error('Error adding category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add category',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  // Remove a category from the spending plan
  const handleRemoveCategory = async (categoryId, categoryName) => {
    try {
      // Remove from local state
      const updatedAllocations = allocations.filter(alloc => alloc.categoryId !== categoryId);
      setAllocations(updatedAllocations);

      // Save to Firestore
      await saveSpendingPlan(null, {
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        allocations: updatedAllocations,
        createdAt: spendingPlan?.createdAt || new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      Toast.show({
        type: 'success',
        text1: 'Category Removed',
        text2: `${categoryName} removed from your plan`,
        position: 'top',
        topOffset: 60,
      });
    } catch (error) {
      console.error('Error removing category:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove category',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  // Get available categories (not yet added)
  const getAvailableCategories = () => {
    const addedCategoryIds = allocations.map(alloc => alloc.categoryId);
    return CATEGORIES
      .filter(cat => cat !== 'Salary/Income' && cat !== 'Freelance') // Exclude income categories
      .filter(cat => {
        const catId = cat.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return !addedCategoryIds.includes(catId);
      })
      .filter(cat => {
        if (!categorySearch) return true;
        return cat.toLowerCase().includes(categorySearch.toLowerCase());
      });
  };

  const totalAllocated = getTotalAllocatedPercentage(allocations);
  const isOver = isOverBudget(allocations);
  const income = parseFloat(monthlyIncome) || 0;

  // Calculate overall spending summary
  const calculateOverallSummary = () => {
    const currentMonthExpenses = expenses.filter(e => isCurrentMonth(e.date));
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + (e.outAmount || 0), 0);
    const totalPlanned = allocations.reduce((sum, alloc) => sum + (alloc.targetAmount || 0), 0);
    const remaining = totalPlanned - totalSpent;
    const overallPercentage = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

    return {
      totalSpent,
      totalPlanned,
      remaining,
      percentage: overallPercentage
    };
  };

  const overallSummary = calculateOverallSummary();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Spending Plan</Text>
          <Text style={styles.headerSubtitle}>Allocate your monthly income</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Income Card */}
        <View style={[styles.card, styles.incomeCard]}>
          <View style={styles.cardHeader}>
            <Icon name="wallet" size={20} color={colors.primary} solid />
            <Text style={styles.cardTitle}>Monthly Income</Text>
          </View>

          <View style={styles.incomeInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.incomeInput}
              value={monthlyIncome}
              onChangeText={handleIncomeChange}
              onBlur={handleIncomeSave}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.text.disabled}
            />
            {saving && (
              <ActivityIndicator size="small" color={colors.primary} style={styles.savingIndicator} />
            )}
          </View>
        </View>

        {/* Empty State */}
        {income === 0 && (
          <View style={styles.emptyState}>
            <Icon name="hand-holding-usd" size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyStateText}>Set your monthly income to start planning</Text>
          </View>
        )}

        {/* Overall Spending Summary */}
        {income > 0 && overallSummary.totalPlanned > 0 && (
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.summaryHeader}>
              <Icon name="chart-pie" size={20} color={colors.primary} solid />
              <Text style={styles.cardTitle}>This Month's Progress</Text>
            </View>

            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={[styles.summaryValue, { color: getProgressColor(overallSummary.percentage) }]}>
                  {formatCurrency(overallSummary.totalSpent)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Planned</Text>
                <Text style={styles.summaryValue}>{formatCurrency(overallSummary.totalPlanned)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: overallSummary.remaining >= 0 ? colors.success : colors.error }
                ]}>
                  {formatCurrency(Math.abs(overallSummary.remaining))}
                  {overallSummary.remaining < 0 && ' over'}
                </Text>
              </View>
            </View>

            {/* Circular Progress Indicator */}
            <View style={styles.circularProgress}>
              <View style={styles.circularProgressContent}>
                <Text style={[styles.circularProgressText, { color: getProgressColor(overallSummary.percentage) }]}>
                  {overallSummary.percentage.toFixed(0)}%
                </Text>
                <Text style={styles.circularProgressLabel}>Used</Text>
              </View>
            </View>

            {/* Overall Progress Bar */}
            <View style={styles.overallProgressBar}>
              <View style={[
                styles.overallProgressFill,
                {
                  width: `${Math.min(overallSummary.percentage, 100)}%`,
                  backgroundColor: getProgressColor(overallSummary.percentage)
                }
              ]} />
            </View>
          </View>
        )}

        {/* Category Allocations */}
        {income > 0 && (
          <View style={styles.allocationsContainer}>
            <Text style={styles.sectionTitle}>Category Allocations</Text>

            {allocations.map((allocation) => {
              const categoryConfig = getCategoryConfig(allocation.categoryName);
              const targetAmount = (income * allocation.percentage) / 100;
              const progress = calculateProgress(allocation);

              return (
                <View key={allocation.categoryId} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryIconContainer, { backgroundColor: categoryConfig.bgColor }]}>
                      <Icon name={categoryConfig.icon} size={16} color={categoryConfig.color} solid />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{allocation.categoryName}</Text>
                      <Text style={styles.categoryTarget}>{formatCurrency(targetAmount)} planned</Text>
                    </View>
                    <View style={styles.percentageContainer}>
                      <Text style={styles.percentageText}>{allocation.percentage.toFixed(0)}%</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveCategory(allocation.categoryId, allocation.categoryName)}
                      style={styles.removeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="times" size={16} color={colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>

                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={allocation.percentage}
                    onValueChange={(value) => handleAllocationChange(allocation.categoryId, value)}
                    minimumTrackTintColor={categoryConfig.color}
                    maximumTrackTintColor={colors.glass.backgroundMedium}
                    thumbTintColor={categoryConfig.color}
                  />

                  {/* Progress Tracking */}
                  {targetAmount > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <View style={styles.progressAmounts}>
                          <Text style={styles.progressLabel}>Spent: </Text>
                          <Text style={[styles.progressAmount, { color: getProgressColor(progress.percentage) }]}>
                            {formatCurrency(progress.actual)}
                          </Text>
                          <Text style={styles.progressSeparator}> / </Text>
                          <Text style={styles.progressTarget}>{formatCurrency(progress.planned)}</Text>
                          <Text style={styles.progressPercentage}>
                            {' '}({progress.percentage.toFixed(0)}%)
                          </Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          {
                            backgroundColor: progress.status === 'On Track'
                              ? 'rgba(0, 255, 163, 0.15)'
                              : progress.status === 'Near Limit'
                              ? 'rgba(255, 184, 77, 0.15)'
                              : progress.status === 'Over Budget'
                              ? 'rgba(255, 77, 77, 0.15)'
                              : 'rgba(136, 153, 166, 0.15)'
                          }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            {
                              color: progress.status === 'On Track'
                                ? colors.success
                                : progress.status === 'Near Limit'
                                ? colors.warning
                                : progress.status === 'Over Budget'
                                ? colors.error
                                : colors.text.tertiary
                            }
                          ]}>
                            {progress.status}
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressBarContainer}>
                        <View style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(progress.percentage, 100)}%`,
                            backgroundColor: getProgressColor(progress.percentage)
                          }
                        ]} />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Empty State */}
            {allocations.length === 0 && (
              <View style={styles.emptyAllocationState}>
                <Icon name="folder-open" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyAllocationTitle}>No Categories Yet</Text>
                <Text style={styles.emptyAllocationText}>
                  Add categories to start planning your budget
                </Text>
              </View>
            )}

            {/* Add Category Button */}
            <TouchableOpacity
              onPress={() => setShowCategoryModal(true)}
              style={styles.addCategoryButton}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addCategoryButtonGradient}
              >
                <Icon name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addCategoryButtonText}>Add Category</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Total Allocation Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Allocated</Text>
            <Text style={[styles.totalPercentage, isOver && styles.totalPercentageOver]}>
              {totalAllocated.toFixed(1)}%
            </Text>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressRing}>
            <View style={[
              styles.progressRingFill,
              {
                width: `${Math.min(totalAllocated, 100)}%`,
                backgroundColor: isOver ? colors.warning : colors.primary,
              }
            ]} />
          </View>

          {/* Warning Message */}
          {isOver && (
            <View style={styles.warningContainer}>
              <Icon name="exclamation-triangle" size={14} color={colors.warning} solid />
              <Text style={styles.warningText}>You've allocated more than 100%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCategoryModal(false);
                  setCategorySearch('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="times" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={16} color={colors.text.tertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search categories..."
                placeholderTextColor={colors.text.tertiary}
                value={categorySearch}
                onChangeText={setCategorySearch}
                autoCapitalize="none"
              />
            </View>

            {/* Category List */}
            <FlatList
              data={getAvailableCategories()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const categoryConfig = getCategoryConfig(item);
                return (
                  <TouchableOpacity
                    style={styles.categoryOption}
                    onPress={() => handleAddCategory(item)}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: categoryConfig.bgColor }]}>
                      <Icon name={categoryConfig.icon} size={20} color={categoryConfig.color} solid />
                    </View>
                    <Text style={styles.categoryOptionText}>{item}</Text>
                    <Icon name="plus-circle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={styles.emptySearchState}>
                  <Icon name="search" size={48} color={colors.text.tertiary} />
                  <Text style={styles.emptySearchText}>No categories found</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySecondary,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.elevated,
  },
  incomeCard: {
    borderColor: colors.glass.border,
  },
  summaryCard: {
    borderColor: colors.glass.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryContent: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  circularProgress: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  circularProgressContent: {
    alignItems: 'center',
  },
  circularProgressText: {
    ...typography.h1,
    fontSize: 40,
  },
  circularProgressLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  overallProgressBar: {
    height: 10,
    backgroundColor: colors.glass.backgroundMedium,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
  },
  incomeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.layer1,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    padding: spacing.md,
  },
  currencySymbol: {
    ...typography.currency.large,
    marginRight: spacing.xs,
    color: colors.text.secondary,
  },
  incomeInput: {
    ...typography.currency.large,
    flex: 1,
    color: colors.text.primary,
    padding: 0,
  },
  savingIndicator: {
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  allocationsContainer: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  categoryCard: {
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  categoryName: {
    ...typography.bodyBold,
  },
  categoryTarget: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  percentageContainer: {
    backgroundColor: colors.background.layer1,
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 50,
    alignItems: 'center',
  },
  percentageText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  progressSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
    flexWrap: 'wrap',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 12,
  },
  progressAmount: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  progressSeparator: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  progressTarget: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 13,
  },
  progressPercentage: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    marginLeft: spacing.xs,
  },
  statusText: {
    ...typography.small,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.glass.backgroundMedium,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 14, 39, 0.90)',
    borderTopWidth: 1,
    borderTopColor: colors.glass.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.modal,
  },
  footerContent: {
    gap: spacing.sm,
  },
  totalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h3,
  },
  totalPercentage: {
    ...typography.h2,
    color: colors.primary,
  },
  totalPercentageOver: {
    color: colors.warning,
  },
  progressRing: {
    height: 8,
    backgroundColor: colors.glass.backgroundMedium,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressRingFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderRadius: borderRadius.xs,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
    flex: 1,
  },
  // Remove button styles
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  // Empty allocation state
  emptyAllocationState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyAllocationTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyAllocationText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Add category button
  addCategoryButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  addCategoryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  addCategoryButtonText: {
    ...typography.buttonMedium,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.layer1,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxxl : spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.borderLight,
  },
  categoryOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOptionText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptySearchText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});

export default SpendingPlanScreen;
