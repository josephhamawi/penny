import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import { formatCurrency } from '../utils/formatNumber';
import { useAuth } from '../contexts/AuthContext';
import { usePlanAllocations } from '../hooks/usePlanAllocations';
import PlanCard from '../components/PlanCard';
import Toast from 'react-native-toast-message';

/**
 * PlanOverviewScreen
 * Dashboard showing all plans with summary statistics
 */
const PlanOverviewScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { plans, loading, processAllocations, allocationSummary, processing } = usePlanAllocations();
  const [refreshing, setRefreshing] = useState(false);

  // Filter active plans
  const activePlans = plans.filter(p => p.active);
  const inactivePlans = plans.filter(p => !p.active);

  // Calculate total percentage allocated
  const totalPercentage = activePlans.reduce((sum, p) => sum + p.percentageOfIncome, 0);
  const totalAllocated = activePlans.reduce((sum, p) => sum + p.cumulativeTotalForPlan, 0);

  // Get average health score
  const avgHealthScore = activePlans.length > 0
    ? Math.round(activePlans.reduce((sum, p) => sum + p.healthScore, 0) / activePlans.length)
    : 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await processAllocations();
      Toast.show({
        type: 'success',
        text1: 'Plans Updated',
        text2: 'Allocations processed successfully'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.message
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreatePlan = () => {
    navigation.navigate('CreatePlan');
  };

  const handlePlanPress = (plan) => {
    navigation.navigate('PlanDetail', { planId: plan.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Plans</Text>
        <Text style={styles.headerSubtitle}>
          Automatic savings allocation from income
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Summary Cards */}
        {activePlans.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              {/* Total Allocated */}
              <LinearGradient
                colors={[colors.glass.background, colors.glass.backgroundDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Icon name="piggy-bank" size={24} color={colors.primary} solid />
                <Text style={styles.summaryValue}>{formatCurrency(totalAllocated)}</Text>
                <Text style={styles.summaryLabel}>Total Allocated</Text>
              </LinearGradient>

              {/* Allocation Percentage */}
              <LinearGradient
                colors={[colors.glass.background, colors.glass.backgroundDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Icon name="percentage" size={24} color={colors.success} solid />
                <Text style={styles.summaryValue}>{totalPercentage}%</Text>
                <Text style={styles.summaryLabel}>of Income</Text>
              </LinearGradient>
            </View>

            <View style={styles.summaryRow}>
              {/* Active Plans */}
              <LinearGradient
                colors={[colors.glass.background, colors.glass.backgroundDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Icon name="layer-group" size={24} color={colors.warning} solid />
                <Text style={styles.summaryValue}>{activePlans.length}</Text>
                <Text style={styles.summaryLabel}>Active Plans</Text>
              </LinearGradient>

              {/* Health Score */}
              <LinearGradient
                colors={[colors.glass.background, colors.glass.backgroundDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <Icon
                  name={avgHealthScore >= 80 ? 'heart' : avgHealthScore >= 60 ? 'heart-broken' : 'exclamation-triangle'}
                  size={24}
                  color={avgHealthScore >= 80 ? colors.success : avgHealthScore >= 60 ? colors.warning : colors.error}
                  solid
                />
                <Text style={styles.summaryValue}>{avgHealthScore}</Text>
                <Text style={styles.summaryLabel}>Avg Health</Text>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Warning if over-allocated */}
        {totalPercentage > 80 && (
          <LinearGradient
            colors={[`${colors.warning}20`, `${colors.warning}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.warningBox}
          >
            <Icon name="exclamation-triangle" size={20} color={colors.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>High Allocation</Text>
              <Text style={styles.warningText}>
                You're allocating {totalPercentage}% of income. This may limit day-to-day spending.
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Active Plans Section */}
        {activePlans.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Plans</Text>
              <Text style={styles.sectionCount}>{activePlans.length}</Text>
            </View>

            {activePlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onPress={() => handlePlanPress(plan)}
              />
            ))}
          </View>
        ) : (
          <LinearGradient
            colors={[colors.glass.background, colors.glass.backgroundDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyState}
          >
            <Icon name="piggy-bank" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Plans Yet</Text>
            <Text style={styles.emptyText}>
              Create your first plan to automatically allocate income towards future goals
            </Text>
            <TouchableOpacity onPress={handleCreatePlan} style={styles.emptyButton}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyButtonGradient}
              >
                <Icon name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Create First Plan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* Inactive Plans Section */}
        {inactivePlans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Inactive Plans</Text>
              <Text style={styles.sectionCount}>{inactivePlans.length}</Text>
            </View>

            {inactivePlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onPress={() => handlePlanPress(plan)}
              />
            ))}
          </View>
        )}

        {/* Info Box */}
        <LinearGradient
          colors={[colors.glass.background, colors.glass.backgroundDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoBox}
        >
          <Icon name="info-circle" size={20} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How Plans Work</Text>
            <Text style={styles.infoText}>
              Every time income hits your account, we automatically allocate a percentage to each active plan. This creates a virtual savings ledger without affecting your visible balance.
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Create Plan FAB */}
      {activePlans.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePlan}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={24} color="#FFFFFF" solid />
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  header: {
    padding: spacing.xl,
    paddingTop: spacing.xxl
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
    paddingBottom: 100
  },
  summaryContainer: {
    marginBottom: spacing.lg
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    alignItems: 'center',
    ...shadows.sm
  },
  summaryValue: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: 2
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.text.tertiary
  },
  warningBox: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning
  },
  warningContent: {
    flex: 1
  },
  warningTitle: {
    ...typography.h4,
    color: colors.warning,
    marginBottom: 4
  },
  warningText: {
    ...typography.body,
    color: colors.text.secondary
  },
  section: {
    marginBottom: spacing.xl
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary
  },
  sectionCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600'
  },
  emptyState: {
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    alignItems: 'center',
    ...shadows.sm
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl
  },
  emptyButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden'
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm
  },
  emptyButtonText: {
    ...typography.button,
    color: '#FFFFFF'
  },
  infoBox: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    ...shadows.sm
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 4
  },
  infoText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
    borderRadius: 28,
    ...shadows.lg
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default PlanOverviewScreen;
