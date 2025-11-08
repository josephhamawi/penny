/**
 * GlassCard - iOS 19 Glassmorphism Card Component
 *
 * A versatile card component with glass effects, gradients,
 * and multiple elevation levels.
 *
 * Variants:
 * - glass: Standard glassmorphism (default)
 * - gradient: Gradient background with glow
 * - elevated: Higher elevation with stronger shadow
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, spacing, borderRadius } from '../theme/colors';

const GlassCard = ({
  children,
  variant = 'glass',
  gradient = colors.primaryGradient,
  style,
  ...props
}) => {
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
        {...props}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' ? styles.elevatedCard : styles.glassCard,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },

  glassCard: {
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
    ...shadows.subtle,
  },

  elevatedCard: {
    backgroundColor: colors.glass.backgroundMedium,
    borderWidth: 1,
    borderColor: colors.glass.borderMedium,
    ...shadows.elevated,
  },

  gradientCard: {
    borderWidth: 0,
    ...shadows.glow.cyan,
  },
});

export default GlassCard;
