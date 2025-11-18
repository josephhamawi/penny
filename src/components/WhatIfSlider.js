import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, shadows, typography, spacing, borderRadius } from '../theme/colors';
import { formatCurrency } from '../utils/formatNumber';
import { calculateWhatIfScenario } from '../services/planProjectionService';

/**
 * WhatIfSlider Component
 * Interactive slider for simulating different allocation percentages
 *
 * Props:
 * - userId: User ID
 * - planId: Plan ID
 * - currentPercentage: Current allocation percentage
 * - onScenarioChange: Callback when scenario changes (optional)
 */
const WhatIfSlider = ({ userId, planId, currentPercentage, onScenarioChange }) => {
  const [sliderValue, setSliderValue] = useState(currentPercentage);
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debounce scenario calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sliderValue !== currentPercentage) {
        calculateScenario(sliderValue);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [sliderValue]);

  const calculateScenario = async (percentage) => {
    try {
      setLoading(true);
      const result = await calculateWhatIfScenario(userId, planId, percentage);
      setScenario(result);

      if (onScenarioChange) {
        onScenarioChange(result);
      }
    } catch (error) {
      console.error('[WhatIfSlider] Error calculating scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSliderValue(currentPercentage);
    setScenario(null);
  };

  const getDifference = () => {
    if (!scenario || !scenario.projections || scenario.projections.length === 0) return 0;

    const lastProjection = scenario.projections[scenario.projections.length - 1];
    const projectedAmount = lastProjection.cumulativeTotal;

    // Calculate what current percentage would yield
    const currentRatio = currentPercentage / sliderValue;
    const currentAmount = projectedAmount * currentRatio;

    return projectedAmount - currentAmount;
  };

  const difference = getDifference();
  const isIncrease = difference > 0;
  const isDifferent = sliderValue !== currentPercentage;

  return (
    <LinearGradient
      colors={[colors.glass.background, colors.glass.backgroundDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Icon name="sliders-h" size={20} color={colors.primary} />
        <Text style={styles.title}>What-If Simulator</Text>
        {isDifferent && (
          <Text style={styles.resetButton} onPress={handleReset}>
            Reset
          </Text>
        )}
      </View>

      {/* Slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Allocation Percentage</Text>
        <View style={styles.sliderRow}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={sliderValue}
            onValueChange={setSliderValue}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.glass.backgroundDark}
            thumbTintColor={colors.primary}
          />
          <Text style={styles.percentageValue}>{sliderValue}%</Text>
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Calculating...</Text>
        </View>
      ) : scenario && scenario.message ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultRow}>
            <Icon
              name={isIncrease ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={isIncrease ? colors.success : colors.error}
            />
            <Text style={styles.resultMessage}>{scenario.message}</Text>
          </View>

          {isDifferent && Math.abs(difference) > 0 && (
            <View style={[styles.differenceContainer, isIncrease ? styles.increaseBox : styles.decreaseBox]}>
              <Text style={[styles.differenceText, { color: isIncrease ? colors.success : colors.error }]}>
                {isIncrease ? '+' : ''}{formatCurrency(difference)}
              </Text>
              <Text style={styles.differenceLabel}>
                vs. current allocation
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Adjust the slider to see projected outcomes
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Icon name="info-circle" size={12} color={colors.text.tertiary} />
        <Text style={styles.infoText}>
          Simulation based on your recent income history
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    ...shadows.sm
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1
  },
  resetButton: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600'
  },
  sliderContainer: {
    marginBottom: spacing.lg
  },
  sliderLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.sm
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  slider: {
    flex: 1,
    height: 40
  },
  percentageValue: {
    ...typography.h3,
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right',
    fontWeight: '700'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary
  },
  resultsContainer: {
    marginBottom: spacing.md
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  resultMessage: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1
  },
  differenceContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1
  },
  increaseBox: {
    backgroundColor: `${colors.success}10`,
    borderColor: colors.success
  },
  decreaseBox: {
    backgroundColor: `${colors.error}10`,
    borderColor: colors.error
  },
  differenceText: {
    ...typography.h2,
    fontWeight: '700'
  },
  differenceLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2
  },
  placeholderContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center'
  },
  placeholderText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center'
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glass.borderLight
  },
  infoText: {
    ...typography.caption,
    color: colors.text.tertiary,
    flex: 1
  }
});

export default WhatIfSlider;
