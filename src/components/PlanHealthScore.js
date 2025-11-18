import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme/colors';

/**
 * PlanHealthScore Component
 * Displays a plan's health score (0-100) with color-coded indicator
 *
 * Props:
 * - score: Number (0-100)
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - showLabel: Boolean (default: true)
 */
const PlanHealthScore = ({ score, size = 'medium', showLabel = true }) => {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.error;
  };

  // Get icon based on score
  const getIcon = () => {
    if (score >= 80) return 'check-circle';
    if (score >= 60) return 'heart';
    if (score >= 40) return 'exclamation-circle';
    return 'exclamation-triangle';
  };

  // Get label text
  const getLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const scoreColor = getScoreColor();
  const iconName = getIcon();
  const label = getLabel();

  // Size configurations
  const sizeConfig = {
    xs: {
      containerSize: 32,
      fontSize: 10,
      iconSize: 11,
      labelSize: 9
    },
    small: {
      containerSize: 40,
      fontSize: 12,
      iconSize: 14,
      labelSize: 10
    },
    medium: {
      containerSize: 56,
      fontSize: 16,
      iconSize: 18,
      labelSize: 12
    },
    large: {
      containerSize: 80,
      fontSize: 24,
      iconSize: 28,
      labelSize: 14
    }
  };

  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      {/* Circular Score Indicator */}
      <View
        style={[
          styles.scoreCircle,
          {
            width: config.containerSize,
            height: config.containerSize,
            borderRadius: config.containerSize / 2,
            borderColor: scoreColor,
            backgroundColor: `${scoreColor}15`
          }
        ]}
      >
        <Icon name={iconName} size={config.iconSize} color={scoreColor} solid />
        <Text style={[styles.scoreText, { fontSize: config.fontSize, color: scoreColor }]}>
          {score}
        </Text>
      </View>

      {/* Label */}
      {showLabel && (
        <Text style={[styles.label, { fontSize: config.labelSize }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  scoreCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    gap: 2
  },
  scoreText: {
    fontWeight: '700'
  },
  label: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4,
    fontWeight: '600'
  }
});

export default PlanHealthScore;
