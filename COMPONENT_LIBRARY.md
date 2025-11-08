# Spensely Component Library
## iOS 19-Inspired Design System Components

---

## Table of Contents
1. [Navigation Components](#navigation-components)
2. [Layout Components](#layout-components)
3. [Input Components](#input-components)
4. [Button Components](#button-components)
5. [Display Components](#display-components)
6. [Feedback Components](#feedback-components)

---

## Navigation Components

### FloatingTabBar
**Location:** `/src/components/FloatingTabBar.js`

iOS 19-inspired floating navigation bar with glassmorphism and animated orb indicators.

#### Features
- Floating design (24px from bottom)
- Animated gradient orb for active tab
- Spring physics animations
- Haptic feedback
- Safe area aware
- Accessibility support

#### Usage
```javascript
import FloatingTabBar from '../components/FloatingTabBar';

// Replace default tabBar in navigation
<Tab.Navigator
  tabBar={(props) => <FloatingTabBar {...props} />}
>
  {/* screens */}
</Tab.Navigator>
```

#### Customization
Edit tab configurations in theme:
```javascript
colors.tabs.home.gradient = ['#00D9FF', '#00B8D4'];
colors.tabs.home.glow = 'rgba(0, 217, 255, 0.4)';
```

---

## Layout Components

### GlassCard
**Location:** `/src/components/GlassCard.js`

Versatile card component with glassmorphism effects.

#### Variants
- **glass** (default): Standard glassmorphism
- **elevated**: Higher elevation with stronger shadow
- **gradient**: Gradient background with glow

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | 'glass' | Card style variant |
| gradient | array | colors.primaryGradient | Gradient colors (for gradient variant) |
| style | object | - | Additional styles |

#### Usage
```javascript
import GlassCard from '../components/GlassCard';

// Standard glass card
<GlassCard>
  <Text>Content here</Text>
</GlassCard>

// Gradient card with custom colors
<GlassCard
  variant="gradient"
  gradient={colors.incomeGradient}
>
  <Text>Balance: $1,234.56</Text>
</GlassCard>

// Elevated card
<GlassCard variant="elevated">
  <Text>Important content</Text>
</GlassCard>
```

---

## Input Components

### GlassInput
**Location:** `/src/components/GlassInput.js`

Modern input field with glass effect and animated focus states.

#### Features
- Glassmorphism background
- Animated focus state with cyan glow
- Icon support (left/right)
- Currency input variant
- Error state with message
- Accessibility labels

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placeholder | string | - | Placeholder text |
| value | string | - | Input value |
| onChangeText | function | - | Change handler |
| icon | string | - | Left icon name (FontAwesome5) |
| rightIcon | string | - | Right icon name |
| error | boolean | false | Error state |
| errorMessage | string | - | Error message to display |
| variant | string | 'default' | Input variant ('default', 'currency') |
| currencySymbol | string | '$' | Currency symbol (for currency variant) |

#### Usage
```javascript
import GlassInput from '../components/GlassInput';

// Standard input with icon
<GlassInput
  placeholder="Email address"
  value={email}
  onChangeText={setEmail}
  icon="envelope"
  keyboardType="email-address"
/>

// Currency input
<GlassInput
  variant="currency"
  placeholder="0.00"
  value={amount}
  onChangeText={setAmount}
  keyboardType="decimal-pad"
/>

// Input with error
<GlassInput
  placeholder="Password"
  value={password}
  onChangeText={setPassword}
  icon="lock"
  rightIcon="eye"
  error={passwordError}
  errorMessage="Password must be at least 8 characters"
  secureTextEntry
/>
```

---

## Button Components

### PrimaryButton
**Location:** `/src/components/PrimaryButton.js`

Modern gradient button with haptic feedback and animations.

#### Features
- Gradient background with glow effect
- Scale animation on press
- Haptic feedback (iOS)
- Loading state
- Disabled state
- Icon support

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Button text |
| onPress | function | - | Press handler |
| icon | string | - | Icon name (FontAwesome5) |
| gradient | array | colors.primaryGradient | Gradient colors |
| loading | boolean | false | Loading state |
| disabled | boolean | false | Disabled state |
| style | object | - | Container style |
| textStyle | object | - | Text style |

#### Usage
```javascript
import PrimaryButton from '../components/PrimaryButton';

// Standard button
<PrimaryButton
  title="Save Changes"
  onPress={handleSave}
/>

// Button with icon
<PrimaryButton
  title="Add Expense"
  icon="plus"
  onPress={handleAddExpense}
  gradient={colors.expenseGradient}
/>

// Loading state
<PrimaryButton
  title="Submitting..."
  loading={true}
/>

// Disabled state
<PrimaryButton
  title="Submit"
  disabled={!formValid}
  onPress={handleSubmit}
/>
```

### SecondaryButton
Create a variant with glass background instead of gradient:

```javascript
// Custom implementation
<TouchableOpacity
  onPress={onPress}
  style={styles.secondaryButton}
>
  <View style={styles.glassBackground}>
    <Text style={styles.buttonText}>{title}</Text>
  </View>
</TouchableOpacity>

const styles = StyleSheet.create({
  secondaryButton: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  glassBackground: {
    backgroundColor: colors.glass.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
    height: sizes.button.height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    ...typography.button,
    color: colors.primary,
  },
});
```

---

## Display Components

### BalanceCard
Create a reusable balance display component:

```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors, typography, spacing } from '../theme/colors';

const BalanceCard = ({ balance, income, expenses }) => (
  <LinearGradient
    colors={colors.primaryGradient}
    style={styles.card}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <View style={styles.header}>
      <Icon name="piggy-bank" size={24} color={colors.text.primary} />
      <Text style={styles.label}>Total Balance</Text>
    </View>

    <Text style={styles.amount}>
      ${balance.toFixed(2)}
    </Text>

    <View style={styles.footer}>
      <View style={styles.stat}>
        <Icon name="arrow-down" size={14} color={colors.income} />
        <Text style={styles.statLabel}>Income</Text>
        <Text style={styles.statValue}>${income.toFixed(2)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Icon name="arrow-up" size={14} color={colors.expense} />
        <Text style={styles.statLabel}>Expenses</Text>
        <Text style={styles.statValue}>${expenses.toFixed(2)}</Text>
      </View>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: spacing.lg,
    // Add glow shadow
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  amount: {
    ...typography.currency.large,
    marginVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: spacing.md,
  },
  statLabel: {
    ...typography.small,
    marginLeft: spacing.xs,
    flex: 1,
  },
  statValue: {
    ...typography.bodyBold,
    fontSize: 14,
  },
});

export default BalanceCard;
```

### TransactionCard
Reusable transaction list item:

```javascript
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { colors, typography, spacing } from '../theme/colors';

const TransactionCard = ({ transaction, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <GlassCard style={styles.card}>
      <View style={styles.left}>
        <LinearGradient
          colors={transaction.type === 'expense'
            ? colors.expenseGradient
            : colors.incomeGradient
          }
          style={styles.icon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon
            name={transaction.icon}
            size={20}
            color={colors.text.primary}
          />
        </LinearGradient>
        <View style={styles.info}>
          <Text style={styles.title}>{transaction.title}</Text>
          <Text style={styles.date}>{transaction.date}</Text>
        </View>
      </View>
      <Text style={[
        styles.amount,
        { color: transaction.type === 'expense'
          ? colors.expense
          : colors.income
        }
      ]}>
        {transaction.type === 'expense' ? '-' : '+'}
        ${transaction.amount.toFixed(2)}
      </Text>
    </GlassCard>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  date: {
    ...typography.small,
  },
  amount: {
    ...typography.currency.small,
    fontSize: 18,
  },
});

export default TransactionCard;
```

### CategoryIcon
Gradient icon for categories:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const CategoryIcon = ({
  icon,
  gradient = colors.primaryGradient,
  size = 48,
  iconSize = 20,
}) => (
  <LinearGradient
    colors={gradient}
    style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <Icon name={icon} size={iconSize} color={colors.text.primary} />
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryIcon;
```

---

## Feedback Components

### LoadingSpinner
Glass loading indicator:

```javascript
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme/colors';

const LoadingSpinner = ({ size = 48 }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ rotate }] }
      ]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        style={[styles.spinner, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    opacity: 0.8,
  },
});

export default LoadingSpinner;
```

### EmptyState
Empty state with piggy bank illustration:

```javascript
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import PrimaryButton from './PrimaryButton';
import { colors, typography, spacing } from '../theme/colors';

const EmptyState = ({
  icon = 'inbox',
  title = 'No items yet',
  message = 'Get started by adding your first item',
  actionTitle,
  onAction,
}) => (
  <View style={styles.container}>
    <View style={styles.iconContainer}>
      <Image
        source={require('../assets/newicon.png')}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionTitle && onAction && (
      <PrimaryButton
        title={actionTitle}
        onPress={onAction}
        style={styles.button}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});

export default EmptyState;
```

---

## Usage Examples

### Complete Screen Template

```javascript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import GlassInput from '../components/GlassInput';
import { colors, typography, spacing } from '../theme/colors';

const ExampleScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + 120, // Space for tab bar
          }
        ]}
      >
        <Text style={styles.title}>Screen Title</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Card Content</Text>
          <Text style={styles.cardText}>
            Your content here
          </Text>
        </GlassCard>

        <PrimaryButton
          title="Action Button"
          onPress={() => {}}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  cardText: {
    ...typography.body,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default ExampleScreen;
```

---

## Best Practices

### 1. Consistent Spacing
Always use spacing tokens from the theme:
```javascript
marginBottom: spacing.lg  // ✅ Good
marginBottom: 24          // ❌ Avoid magic numbers
```

### 2. Typography
Use typography tokens for all text:
```javascript
<Text style={typography.h1}>Title</Text>        // ✅ Good
<Text style={{ fontSize: 32 }}>Title</Text>    // ❌ Avoid
```

### 3. Colors
Reference colors from theme:
```javascript
color: colors.primary           // ✅ Good
color: '#00D9FF'                // ❌ Avoid hardcoding
```

### 4. Shadows
Use predefined shadow presets:
```javascript
...shadows.floating            // ✅ Good
shadowRadius: 16              // ❌ Avoid custom shadows
```

### 5. Accessibility
Always add accessibility props:
```javascript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add expense"
  accessibilityHint="Opens form to add new expense"
>
```

---

## Performance Tips

1. **Memoize components** that don't need frequent re-renders
2. **Use FlatList** for long lists instead of ScrollView + map
3. **Enable native driver** for animations when possible
4. **Avoid inline styles** - use StyleSheet.create
5. **Optimize images** - use appropriate sizes

---

## Testing Components

```javascript
import { render, fireEvent } from '@testing-library/react-native';
import PrimaryButton from '../PrimaryButton';

test('button calls onPress when pressed', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <PrimaryButton title="Test" onPress={onPress} />
  );

  fireEvent.press(getByText('Test'));
  expect(onPress).toHaveBeenCalled();
});
```

---

## Contributing

When adding new components:
1. Follow the existing naming conventions
2. Add proper TypeScript/PropTypes
3. Include accessibility props
4. Document props and usage
5. Add example implementation
6. Test on iOS and Android
