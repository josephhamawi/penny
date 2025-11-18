import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import { formatCurrency } from '../utils/formatNumber';
import PlanHealthScore from './PlanHealthScore';

/**
 * PlanCard Component
 * Displays a single plan with progress, health score, and allocation info
 *
 * Props:
 * - plan: Plan object
 * - onPress: Function to call when card is pressed
 * - showHealthScore: Boolean (default: true)
 */
const PlanCard = ({ plan, onPress, showHealthScore = true }) => {
  // Calculate progress percentage if target amount exists
  const progressPercentage = plan.targetAmount
    ? Math.min(100, (plan.cumulativeTotalForPlan / plan.targetAmount) * 100)
    : 0;

  // Determine status color
  const getStatusColor = () => {
    if (!plan.targetAmount) return colors.primary;

    if (progressPercentage >= 100) return colors.success;
    if (progressPercentage >= 75) return colors.primary;
    if (progressPercentage >= 50) return colors.warning;
    return colors.text.tertiary;
  };

  // Get icon based on plan name/category
  const getIcon = () => {
    const name = plan.planName.toLowerCase();
    const category = (plan.targetCategory || '').toLowerCase();

    if (name.includes('travel') || category.includes('travel')) return 'plane';
    if (name.includes('clothing') || name.includes('clothes')) return 'tshirt';
    if (name.includes('emergency') || name.includes('saving')) return 'shield-alt';
    if (name.includes('home') || name.includes('house')) return 'home';
    if (name.includes('gift')) return 'gift';
    if (name.includes('tech') || category.includes('tech')) return 'laptop';
    if (name.includes('food') || category.includes('food')) return 'utensils';
    if (name.includes('car') || category.includes('transport')) return 'car';

    return 'piggy-bank'; // Default
  };

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.glass.background, colors.glass.backgroundDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Main Row - Icon, Content, Health */}
        <View style={styles.mainRow}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
            <Icon name={getIcon()} size={20} color={statusColor} solid />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <Text style={styles.planName} numberOfLines={1}>
                {plan.planName}
              </Text>
              {!plan.active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Inactive</Text>
                </View>
              )}
            </View>

            {/* Amount Row */}
            <View style={styles.amountRow}>
              <Text style={styles.currentAmount}>
                {formatCurrency(plan.cumulativeTotalForPlan)}
              </Text>
              {plan.targetAmount && (
                <>
                  <Text style={styles.separator}>/</Text>
                  <Text style={styles.targetAmount}>
                    {formatCurrency(plan.targetAmount)}
                  </Text>
                  <Text style={styles.progressBadge}>
                    {progressPercentage.toFixed(0)}%
                  </Text>
                </>
              )}
            </View>

            {/* Meta Row - Percentage, Category, Date */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="percentage" size={10} color={colors.text.tertiary} />
                <Text style={styles.metaText}>{plan.percentageOfIncome}%</Text>
              </View>

              {plan.targetCategory && (
                <>
                  <Text style={styles.metaDivider}>•</Text>
                  <View style={styles.metaItem}>
                    <Icon name="tag" size={10} color={colors.text.tertiary} />
                    <Text style={styles.metaText}>{plan.targetCategory}</Text>
                  </View>
                </>
              )}

              {plan.targetDate && (
                <>
                  <Text style={styles.metaDivider}>•</Text>
                  <View style={styles.metaItem}>
                    <Icon name="calendar" size={10} color={colors.text.tertiary} />
                    <Text style={styles.metaText}>
                      {plan.targetDate.toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit'
                      })}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Health Score */}
          {showHealthScore && (
            <View style={styles.healthContainer}>
              <PlanHealthScore score={plan.healthScore} size="xs" showLabel={false} />
            </View>
          )}
        </View>

        {/* Progress Bar (if target exists) */}
        {plan.targetAmount && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, progressPercentage)}%`, backgroundColor: statusColor }
                ]}
              />
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm
  },
  gradient: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    borderRadius: borderRadius.md
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderLight
  },
  contentContainer: {
    flex: 1,
    gap: 4
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  planName: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: `${colors.error}20`,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.error
  },
  inactiveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.error,
    textTransform: 'uppercase'
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  currentAmount: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700'
  },
  separator: {
    ...typography.body,
    color: colors.text.tertiary,
    fontWeight: '300'
  },
  targetAmount: {
    ...typography.body,
    color: colors.text.secondary
  },
  progressBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    overflow: 'hidden'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  metaText: {
    fontSize: 11,
    color: colors.text.tertiary
  },
  metaDivider: {
    fontSize: 10,
    color: colors.text.tertiary,
    opacity: 0.5
  },
  healthContainer: {
    marginLeft: spacing.xs
  },
  progressBarContainer: {
    marginTop: spacing.sm,
    width: '100%'
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.glass.backgroundDark,
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2
  }
});

export default PlanCard;
