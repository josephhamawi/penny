/**
 * PrimaryButton - Modern Gradient Button with Haptic Feedback
 *
 * Features:
 * - Gradient background with glow effect
 * - Scale animation on press
 * - Haptic feedback
 * - Loading state
 * - Disabled state
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, shadows, typography, spacing, borderRadius, sizes } from '../theme/colors';

const PrimaryButton = ({
  onPress,
  title,
  icon,
  gradient = colors.primaryGradient,
  loading = false,
  disabled = false,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        {...props}
      >
        <LinearGradient
          colors={disabled ? [colors.interactive.disabled, colors.interactive.disabled] : gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <>
              {icon && (
                <Icon
                  name={icon}
                  size={sizes.button.iconSize}
                  color={colors.text.primary}
                  style={styles.icon}
                />
              )}
              <Text style={[styles.text, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.glow.cyan,
  },

  gradient: {
    height: sizes.button.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  icon: {
    marginRight: spacing.sm,
  },

  text: {
    ...typography.button,
    color: colors.text.primary,
  },
});

export default PrimaryButton;
