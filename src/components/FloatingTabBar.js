/**
 * FloatingTabBar - iOS 19 Inspired Floating Navigation
 *
 * A modern, floating tab bar with glassmorphism effects,
 * animated orb indicators, and haptic feedback.
 *
 * Features:
 * - Floating design (detached from screen edge)
 * - Animated gradient orb for active tab
 * - Spring physics animations
 * - Haptic feedback on tab press
 * - Safe area aware (iPhone notch/home indicator)
 * - Accessibility support
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows, typography, spacing, borderRadius, animation, sizes } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH * 0.9;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

const TABS = [
  {
    name: 'Home',
    icon: 'home',
    gradient: colors.tabs.home.gradient,
    glow: colors.tabs.home.glow,
  },
  {
    name: 'Records',
    icon: 'receipt',
    gradient: colors.tabs.records.gradient,
    glow: colors.tabs.records.glow,
  },
  {
    name: 'Statistics',
    icon: 'chart-pie',
    gradient: colors.tabs.statistics.gradient,
    glow: colors.tabs.statistics.glow,
  },
  {
    name: 'Settings',
    icon: 'cog',
    gradient: colors.tabs.settings.gradient,
    glow: colors.tabs.settings.glow,
  },
];

const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const focusedIndex = state.index;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: spacing.lg + insets.bottom,
          paddingBottom: insets.bottom > 0 ? 0 : spacing.sm,
        }
      ]}
    >
      {/* Glass background with blur */}
      <BlurView
        intensity={80}
        tint="dark"
        style={styles.blurContainer}
      >
        <View style={styles.tabBarBackground} />
      </BlurView>

      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TABS[index];

          const onPress = () => {
            // Haptic feedback
            if (Platform.OS === 'ios') {
              Haptics.selectionAsync();
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={tab.icon}
              label={tab.name}
              gradient={tab.gradient}
              glowColor={tab.glow}
            />
          );
        })}
      </View>
    </View>
  );
};

const TabButton = ({ isFocused, onPress, onLongPress, icon, label, gradient, glowColor }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.8)).current;
  const orbScaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const labelOpacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const iconColorAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    // Spring animation for scale
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0.8,
      ...animation.spring.bouncy,
      useNativeDriver: true,
    }).start();

    // Orb scale animation
    Animated.spring(orbScaleAnim, {
      toValue: isFocused ? 1 : 0,
      ...animation.spring.bouncy,
      useNativeDriver: true,
    }).start();

    // Label opacity
    Animated.timing(labelOpacityAnim, {
      toValue: isFocused ? 1 : 0,
      duration: animation.timing.normal,
      useNativeDriver: true,
    }).start();

    // Icon color transition
    Animated.timing(iconColorAnim, {
      toValue: isFocused ? 1 : 0,
      duration: animation.timing.normal,
      useNativeDriver: false, // Color animations can't use native driver
    }).start();
  }, [isFocused]);

  const iconColor = iconColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.text.tertiary, colors.text.primary],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${label} tab`}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated orb background (only visible when focused) */}
        <Animated.View
          style={[
            styles.orbContainer,
            {
              transform: [{ scale: orbScaleAnim }],
              opacity: orbScaleAnim,
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.orb,
              {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 20,
                elevation: 10,
              },
            ]}
          />
        </Animated.View>

        {/* Icon */}
        <Animated.View style={styles.iconContainer}>
          <Icon
            name={icon}
            size={isFocused ? sizes.tabBar.iconSize.active : sizes.tabBar.iconSize.inactive}
            color={isFocused ? colors.text.primary : colors.text.tertiary}
            solid={isFocused}
          />
        </Animated.View>

        {/* Label (only visible when focused) */}
        <Animated.Text
          style={[
            styles.label,
            {
              opacity: labelOpacityAnim,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },

  blurContainer: {
    position: 'absolute',
    top: 0,
    left: (SCREEN_WIDTH - TAB_BAR_WIDTH) / 2,
    right: (SCREEN_WIDTH - TAB_BAR_WIDTH) / 2,
    bottom: 0,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.floating,
  },

  tabBarBackground: {
    flex: 1,
    backgroundColor: colors.tabs.container.background,
    borderWidth: 1,
    borderColor: colors.tabs.container.border,
  },

  tabsContainer: {
    flexDirection: 'row',
    height: sizes.tabBar.height,
    width: TAB_BAR_WIDTH,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },

  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  orbContainer: {
    position: 'absolute',
    top: -spacing.xs,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  orb: {
    width: sizes.tabBar.orbSize.active,
    height: sizes.tabBar.orbSize.active,
    borderRadius: sizes.tabBar.orbSize.active / 2,
  },

  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    zIndex: 1,
  },

  label: {
    ...typography.tab,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
});

export default FloatingTabBar;
