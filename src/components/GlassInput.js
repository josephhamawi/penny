/**
 * GlassInput - Modern Input Field with Glass Effect
 *
 * Features:
 * - Glassmorphism background
 * - Animated focus state with cyan glow
 * - Icon support (left/right)
 * - Currency input variant
 * - Error state
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, shadows, typography, spacing, borderRadius, sizes, animation } from '../theme/colors';

const GlassInput = ({
  placeholder,
  value,
  onChangeText,
  icon,
  rightIcon,
  error,
  errorMessage,
  variant = 'default', // 'default', 'currency'
  currencySymbol = '$',
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: 1,
        duration: animation.timing.normal,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: animation.timing.normal,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(borderColorAnim, {
        toValue: 0,
        duration: animation.timing.normal,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: animation.timing.normal,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.glass.borderMedium,
      colors.primary,
    ],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            shadowColor: colors.primary,
            shadowOpacity,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 0 },
            elevation: isFocused ? 8 : 2,
          },
        ]}
      >
        {/* Left Icon */}
        {icon && (
          <Icon
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        {/* Currency Symbol */}
        {variant === 'currency' && (
          <Text style={styles.currencySymbol}>{currencySymbol}</Text>
        )}

        {/* Input Field */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.text.disabled}
          style={[
            styles.input,
            variant === 'currency' && styles.currencyInput,
          ]}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <Icon
            name={rightIcon}
            size={20}
            color={isFocused ? colors.primary : colors.text.tertiary}
            style={styles.rightIcon}
          />
        )}
      </Animated.View>

      {/* Error Message */}
      {error && errorMessage && (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={14} color={colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.background,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    height: sizes.input.height,
    paddingHorizontal: spacing.md,
  },

  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 0, // Remove default padding
  },

  currencyInput: {
    ...typography.currency.medium,
    fontSize: 20,
  },

  currencySymbol: {
    ...typography.currency.medium,
    fontSize: 20,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },

  leftIcon: {
    marginRight: spacing.sm,
  },

  rightIcon: {
    marginLeft: spacing.sm,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs,
  },
});

export default GlassInput;
