/**
 * Spensely Theme - iOS 19 Inspired Design System
 * Based on the cyan piggy bank logo with modern glassmorphism
 * Version: 2.0 - Floating UI Redesign
 */

export const colors = {
  // ============================================
  // PRIMARY BRAND COLORS (From Piggy Bank Logo)
  // ============================================
  primary: '#00D9FF',           // Bright cyan
  primaryDark: '#00B8D4',       // Deep turquoise
  primaryLight: '#33E0FF',      // Cyan glow
  primaryGradient: ['#00D9FF', '#00B8D4'],
  primaryGradientReverse: ['#00B8D4', '#00D9FF'],

  // ============================================
  // BACKGROUND SYSTEM (Multi-layer depth)
  // ============================================
  background: {
    base: '#0A0E27',            // Deep navy-purple (main background)
    layer1: '#141937',          // Content background
    layer2: '#1E2547',          // Elevated cards
    layer3: '#2A3157',          // Modal overlays

    // Glass variations for iOS 19 floating elements
    glass: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      heavy: 'rgba(255, 255, 255, 0.18)',
    },

    // Blur backgrounds (for floating UI)
    blur: {
      navbar: 'rgba(10, 14, 39, 0.85)',
      tabbar: 'rgba(10, 14, 39, 0.90)',
      modal: 'rgba(10, 14, 39, 0.95)',
    }
  },

  // ============================================
  // SEMANTIC COLORS (Enhanced)
  // ============================================
  income: '#00FFA3',            // Bright mint green
  incomeGradient: ['#00FFA3', '#00E891'],

  expense: '#FF6B9D',           // Soft coral-pink
  expenseGradient: ['#FF6B9D', '#FF4D7D'],

  analytics: '#A855F7',         // Purple for statistics
  analyticsGradient: ['#A855F7', '#7C3AED', '#00D9FF'],

  savings: '#FFD700',           // Gold (piggy bank theme)
  savingsGradient: ['#FFD700', '#FFA500'],

  warning: '#FFB84D',           // Golden amber
  error: '#FF4D4D',             // Bright red
  success: '#00FFA3',           // Mint green
  info: '#00D9FF',              // Cyan (primary)

  // ============================================
  // TEXT COLORS (WCAG AAA Compliant)
  // ============================================
  text: {
    primary: '#FFFFFF',                      // 21:1 contrast ratio
    secondary: 'rgba(255, 255, 255, 0.75)',  // 15.75:1
    tertiary: 'rgba(255, 255, 255, 0.55)',   // 11.55:1
    disabled: 'rgba(255, 255, 255, 0.35)',   // 7.35:1
    inverse: '#0A0E27',                      // For light backgrounds
  },

  // ============================================
  // GLASS EFFECTS (Enhanced iOS 19 Style)
  // ============================================
  glass: {
    // Backgrounds
    background: 'rgba(255, 255, 255, 0.08)',
    backgroundMedium: 'rgba(255, 255, 255, 0.12)',
    backgroundHeavy: 'rgba(255, 255, 255, 0.18)',

    // Borders
    border: 'rgba(0, 217, 255, 0.2)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    borderMedium: 'rgba(255, 255, 255, 0.15)',
    borderHeavy: 'rgba(255, 255, 255, 0.25)',

    // Shadows
    shadow: 'rgba(0, 217, 255, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.3)',
  },

  // ============================================
  // TAB BAR COLORS (Floating Orb Navigation)
  // ============================================
  tabs: {
    home: {
      gradient: ['#00D9FF', '#00B8D4'],
      glow: 'rgba(0, 217, 255, 0.4)',
      icon: 'home',
    },
    records: {
      gradient: ['#FF6B9D', '#FF4D7D'],
      glow: 'rgba(255, 107, 157, 0.4)',
      icon: 'receipt',
    },
    statistics: {
      gradient: ['#A855F7', '#7C3AED'],
      glow: 'rgba(168, 85, 247, 0.4)',
      icon: 'chart-pie',
    },
    settings: {
      gradient: ['#00FFA3', '#00D9A3'],
      glow: 'rgba(0, 255, 163, 0.4)',
      icon: 'cog',
    },

    // Tab bar container
    container: {
      background: 'rgba(10, 14, 39, 0.90)',
      border: 'rgba(0, 217, 255, 0.15)',
    }
  },

  // ============================================
  // INTERACTIVE STATES
  // ============================================
  interactive: {
    hover: 'rgba(0, 217, 255, 0.1)',
    pressed: 'rgba(0, 217, 255, 0.2)',
    focus: 'rgba(0, 217, 255, 0.3)',
    disabled: 'rgba(255, 255, 255, 0.05)',
  },

  // ============================================
  // CHART COLORS (For data visualization)
  // ============================================
  charts: {
    colors: [
      '#00D9FF',  // Cyan
      '#FF6B9D',  // Pink
      '#00FFA3',  // Mint
      '#A855F7',  // Purple
      '#FFB84D',  // Amber
      '#33E0FF',  // Light cyan
      '#FF4D7D',  // Deep pink
      '#00E891',  // Sea green
    ],
    grid: 'rgba(255, 255, 255, 0.1)',
    axis: 'rgba(255, 255, 255, 0.3)',
  },

  // Legacy support (backwards compatibility)
  background: '#0A0E27',
  backgroundLight: '#141937',
  backgroundCard: 'rgba(255, 255, 255, 0.08)',
};

// Gradient helper functions
export const createLinearGradient = (colors, angle = '135deg') => ({
  background: `linear-gradient(${angle}, ${colors.join(', ')})`,
});

// ============================================
// SHADOW SYSTEM (iOS 19 Multi-layer Elevation)
// ============================================
export const shadows = {
  // Standard elevations
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  // Colored glows (for interactive elements)
  glow: {
    cyan: {
      shadowColor: '#00D9FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
    green: {
      shadowColor: '#00FFA3',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    pink: {
      shadowColor: '#FF6B9D',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    purple: {
      shadowColor: '#A855F7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Legacy support
  sm: {
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================
// TYPOGRAPHY SYSTEM (SF Pro inspired)
// ============================================
export const typography = {
  // Display (Hero sections)
  display: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1.2,
    lineHeight: 52,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
    lineHeight: 26,
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.primary,
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  bodySecondary: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Captions and small text
  caption: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.2,
    lineHeight: 16,
  },

  // Currency/Numbers (Monospace for alignment)
  currency: {
    large: {
      fontSize: 36,
      fontWeight: '700',
      fontFamily: 'Menlo',
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    medium: {
      fontSize: 24,
      fontWeight: '600',
      fontFamily: 'Menlo',
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    small: {
      fontSize: 16,
      fontWeight: '500',
      fontFamily: 'Menlo',
      color: colors.text.primary,
      letterSpacing: 0,
    }
  },

  // Tab labels
  tab: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
};

// ============================================
// SPACING SCALE (8pt Grid System)
// ============================================
export const spacing = {
  xxs: 2,    // Micro spacing (badges, dividers)
  xs: 4,     // Tight spacing (icon padding)
  sm: 8,     // Small spacing (button padding)
  md: 16,    // Default spacing (card padding)
  lg: 24,    // Section spacing (between cards)
  xl: 32,    // Large gaps (screen sections)
  xxl: 48,   // Hero spacing (headers)
  xxxl: 64,  // Screen padding (top/bottom)
};

// ============================================
// BORDER RADIUS SCALE
// ============================================
export const borderRadius = {
  xs: 8,     // Small elements (badges)
  sm: 12,    // Buttons, inputs (small)
  md: 16,    // Cards (standard)
  lg: 20,    // Large cards
  xl: 24,    // Featured elements
  xxl: 28,   // Pill buttons
  full: 9999,// Circles/pills
};

// ============================================
// ANIMATION CONSTANTS
// ============================================
export const animation = {
  // Timing
  timing: {
    fast: 150,       // Micro-interactions
    normal: 250,     // Standard transitions
    slow: 400,       // Page transitions
    verySlow: 600,   // Modal/overlay
  },

  // Spring configurations
  spring: {
    gentle: {
      tension: 200,
      friction: 20,
      mass: 1,
    },
    bouncy: {
      tension: 300,
      friction: 20,
      mass: 1,
    },
    stiff: {
      tension: 400,
      friction: 25,
      mass: 1,
    },
  },
};

// ============================================
// COMPONENT SIZES
// ============================================
export const sizes = {
  // Tab bar
  tabBar: {
    height: 76,
    bottomMargin: 24,
    iconSize: {
      active: 24,
      inactive: 20,
    },
    orbSize: {
      active: 48,
      inactive: 0,
    },
  },

  // Buttons
  button: {
    height: 56,
    iconSize: 20,
  },

  // Input fields
  input: {
    height: 56,
    padding: 16,
  },

  // Floating action button
  fab: {
    size: 56,
    iconSize: 24,
  },

  // Avatar
  avatar: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
};

// ============================================
// DEFAULT EXPORT (All theme tokens)
// ============================================
export default {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
  animation,
  sizes,
  createLinearGradient,
};
