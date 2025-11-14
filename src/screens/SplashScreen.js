import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={[colors.background.base, colors.primaryDark, colors.background.base]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../public/newicon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <Text style={styles.appName}>Penny</Text>
        <Text style={styles.tagline}>Smarter Spending. Powered By AI</Text>
      </View>

      {/* Decorative glow effect */}
      <View style={styles.glowContainer}>
        <View style={[styles.glow, styles.glow1]} />
        <View style={[styles.glow, styles.glow2]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.base,
  },
  logoContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1.2,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: 0.5,
    opacity: 0.9,
  },
  glowContainer: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: -1,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
  },
  glow1: {
    backgroundColor: colors.primary,
    top: '30%',
    left: -100,
  },
  glow2: {
    backgroundColor: colors.primaryDark,
    bottom: '20%',
    right: -100,
  },
});

export default SplashScreen;
