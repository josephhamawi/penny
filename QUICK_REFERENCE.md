# Spensely Design System - Quick Reference
## Cheat Sheet for Developers

---

## Import Statements

```javascript
// Theme tokens
import {
  colors,
  shadows,
  typography,
  spacing,
  borderRadius,
  animation,
  sizes,
} from '../theme/colors';

// Components
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import GlassInput from '../components/GlassInput';
import FloatingTabBar from '../components/FloatingTabBar';

// Expo libraries
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

---

## Color Palette

### Primary
```javascript
colors.primary              // #00D9FF (Cyan)
colors.primaryDark          // #00B8D4 (Deep turquoise)
colors.primaryLight         // #33E0FF (Cyan glow)
colors.primaryGradient      // ['#00D9FF', '#00B8D4']
```

### Semantic
```javascript
colors.income               // #00FFA3 (Mint green)
colors.incomeGradient       // ['#00FFA3', '#00E891']

colors.expense              // #FF6B9D (Coral pink)
colors.expenseGradient      // ['#FF6B9D', '#FF4D7D']

colors.analytics            // #A855F7 (Purple)
colors.analyticsGradient    // ['#A855F7', '#7C3AED', '#00D9FF']

colors.savings              // #FFD700 (Gold)
colors.savingsGradient      // ['#FFD700', '#FFA500']

colors.success              // #00FFA3
colors.error                // #FF4D4D
colors.warning              // #FFB84D
```

### Backgrounds
```javascript
colors.background.base      // #0A0E27 (Main background)
colors.background.layer1    // #141937 (Content bg)
colors.background.layer2    // #1E2547 (Elevated cards)
colors.background.layer3    // #2A3157 (Modals)

colors.background.glass.light    // rgba(255, 255, 255, 0.08)
colors.background.glass.medium   // rgba(255, 255, 255, 0.12)
colors.background.glass.heavy    // rgba(255, 255, 255, 0.18)
```

### Text
```javascript
colors.text.primary         // #FFFFFF
colors.text.secondary       // rgba(255, 255, 255, 0.75)
colors.text.tertiary        // rgba(255, 255, 255, 0.55)
colors.text.disabled        // rgba(255, 255, 255, 0.35)
```

---

## Typography

### Headings
```javascript
typography.display          // 48px, 800 weight
typography.h1               // 32px, 700 weight
typography.h2               // 24px, 600 weight
typography.h3               // 20px, 600 weight
```

### Body
```javascript
typography.body             // 16px, 400 weight
typography.bodyBold         // 16px, 600 weight
typography.bodySecondary    // 16px, secondary color
typography.caption          // 14px, 500 weight
typography.small            // 12px, 500 weight
```

### Special
```javascript
typography.currency.large   // 36px, Menlo font
typography.currency.medium  // 24px, Menlo font
typography.currency.small   // 16px, Menlo font
typography.tab              // 11px, 600 weight
typography.button           // 16px, 600 weight
```

### Usage
```javascript
<Text style={typography.h1}>Title</Text>
<Text style={typography.currency.large}>$1,234.56</Text>
```

---

## Spacing

```javascript
spacing.xxs     // 2px
spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 16px (default)
spacing.lg      // 24px
spacing.xl      // 32px
spacing.xxl     // 48px
spacing.xxxl    // 64px
```

### Usage
```javascript
marginBottom: spacing.lg
paddingHorizontal: spacing.md
gap: spacing.sm
```

---

## Border Radius

```javascript
borderRadius.xs     // 8px
borderRadius.sm     // 12px
borderRadius.md     // 16px (cards)
borderRadius.lg     // 20px
borderRadius.xl     // 24px
borderRadius.xxl    // 28px (pill buttons)
borderRadius.full   // 9999px (circles)
```

---

## Shadows

```javascript
shadows.subtle              // Light shadow
shadows.elevated            // Medium shadow
shadows.floating            // Heavy shadow (tab bar)
shadows.modal               // Extra heavy

shadows.glow.cyan           // Cyan glow
shadows.glow.green          // Green glow
shadows.glow.pink           // Pink glow
shadows.glow.purple         // Purple glow
```

### Usage
```javascript
...shadows.floating
...shadows.glow.cyan
```

---

## Animation

### Timing
```javascript
animation.timing.fast       // 150ms
animation.timing.normal     // 250ms
animation.timing.slow       // 400ms
animation.timing.verySlow   // 600ms
```

### Spring Configs
```javascript
animation.spring.gentle     // Soft bounce
animation.spring.bouncy     // Medium bounce
animation.spring.stiff      // Sharp bounce
```

### Usage
```javascript
Animated.timing(value, {
  toValue: 1,
  duration: animation.timing.normal,
  useNativeDriver: true,
}).start();

Animated.spring(value, {
  toValue: 1,
  ...animation.spring.bouncy,
  useNativeDriver: true,
}).start();
```

---

## Component Sizes

```javascript
// Tab Bar
sizes.tabBar.height                    // 76
sizes.tabBar.bottomMargin              // 24
sizes.tabBar.iconSize.active           // 24
sizes.tabBar.iconSize.inactive         // 20

// Buttons
sizes.button.height                    // 56
sizes.button.iconSize                  // 20

// Inputs
sizes.input.height                     // 56
sizes.input.padding                    // 16

// FAB
sizes.fab.size                         // 56
sizes.fab.iconSize                     // 24
```

---

## Common Patterns

### Screen Layout
```javascript
const MyScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom,
          paddingHorizontal: spacing.lg,
        }}
      >
        {/* Content */}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
});
```

### Glass Card
```javascript
<GlassCard>
  <Text>Standard glass card</Text>
</GlassCard>

<GlassCard variant="elevated">
  <Text>Higher elevation</Text>
</GlassCard>

<GlassCard variant="gradient" gradient={colors.primaryGradient}>
  <Text>Gradient background</Text>
</GlassCard>
```

### Button
```javascript
<PrimaryButton
  title="Save"
  onPress={handleSave}
  icon="check"
/>

<PrimaryButton
  title="Delete"
  gradient={colors.expenseGradient}
  onPress={handleDelete}
  loading={isDeleting}
/>
```

### Input
```javascript
<GlassInput
  placeholder="Email"
  value={email}
  onChangeText={setEmail}
  icon="envelope"
  keyboardType="email-address"
/>

<GlassInput
  variant="currency"
  placeholder="0.00"
  value={amount}
  onChangeText={setAmount}
  keyboardType="decimal-pad"
/>

<GlassInput
  placeholder="Password"
  value={password}
  onChangeText={setPassword}
  icon="lock"
  error={passwordError}
  errorMessage="Password required"
  secureTextEntry
/>
```

### Gradient Background
```javascript
<LinearGradient
  colors={colors.primaryGradient}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
>
  <Text>Content</Text>
</LinearGradient>
```

### Category Icon
```javascript
<LinearGradient
  colors={colors.incomeGradient}
  style={styles.categoryIcon}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  <Icon name="shopping-cart" size={20} color={colors.text.primary} />
</LinearGradient>

const styles = StyleSheet.create({
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Haptic Feedback
```javascript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const handlePress = () => {
  if (Platform.OS === 'ios') {
    // Light feedback for tab switches
    Haptics.selectionAsync();

    // Medium feedback for button presses
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Heavy feedback for destructive actions
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Notification feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Rest of handler
};
```

### Animated Press Effect
```javascript
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
    ...animation.spring.bouncy,
    useNativeDriver: true,
  }).start();
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity
    onPressIn={handlePressIn}
    onPressOut={handlePressOut}
    onPress={handlePress}
  >
    {/* Content */}
  </TouchableOpacity>
</Animated.View>
```

### Multi-layer Background
```javascript
<View style={styles.container}>
  <View style={styles.bgLayer1} />
  <View style={styles.bgLayer2} />
  <ScrollView>{/* Content */}</ScrollView>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  bgLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.background.layer1,
    opacity: 0.5,
  },
  bgLayer2: {
    position: 'absolute',
    top: 0,
    left: -100,
    right: 100,
    height: 200,
    backgroundColor: colors.primary,
    opacity: 0.05,
    borderRadius: 200,
    transform: [{ scaleX: 2 }],
  },
});
```

---

## Icon Names (FontAwesome5)

### Common Icons
```javascript
// Finance
'piggy-bank'
'dollar-sign'
'money-bill-wave'
'credit-card'
'wallet'
'chart-line'
'chart-pie'

// Actions
'plus'
'minus'
'check'
'times'
'edit'
'trash'
'share'

// Categories
'shopping-cart'
'utensils'
'coffee'
'car'
'home'
'plane'
'film'
'heartbeat'

// Navigation
'home'
'receipt'
'cog'
'user'
'bell'
'search'

// UI
'chevron-right'
'chevron-left'
'ellipsis-h'
'filter'
```

---

## Gradients by Purpose

```javascript
// Primary actions
colors.primaryGradient          // Cyan gradient
colors.primaryGradientReverse   // Reversed

// Income
colors.incomeGradient           // Mint green

// Expenses
colors.expenseGradient          // Coral pink

// Analytics
colors.analyticsGradient        // Purple-cyan

// Savings
colors.savingsGradient          // Gold-orange

// Tabs
colors.tabs.home.gradient
colors.tabs.records.gradient
colors.tabs.statistics.gradient
colors.tabs.settings.gradient
```

---

## Accessibility

### Labels
```javascript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add expense"
  accessibilityHint="Opens form to add new expense"
>
```

### States
```javascript
<TouchableOpacity
  accessibilityState={{ selected: isActive }}
>

<TouchableOpacity
  accessibilityState={{ disabled: isDisabled }}
>
```

---

## Format Helpers

### Currency
```javascript
const formatCurrency = (amount) => {
  return `$${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Usage
<Text style={typography.currency.large}>
  {formatCurrency(1234.56)}
</Text>
// Output: $1,234.56
```

### Date
```javascript
const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};
```

---

## Performance Tips

1. **Memoize static components**
   ```javascript
   const Card = React.memo(({ data }) => { /* ... */ });
   ```

2. **Use native driver**
   ```javascript
   useNativeDriver: true  // Always when possible
   ```

3. **FlatList over map**
   ```javascript
   <FlatList
     data={items}
     renderItem={({ item }) => <Item {...item} />}
     removeClippedSubviews={true}
   />
   ```

4. **Avoid inline styles**
   ```javascript
   // Bad
   <View style={{ marginTop: 20 }} />

   // Good
   <View style={styles.container} />
   ```

---

## Common Mistakes

### ❌ Wrong
```javascript
// Hardcoded colors
backgroundColor: '#00D9FF'

// Magic numbers
marginTop: 24

// Inline styles
<View style={{ flex: 1, padding: 20 }} />

// Missing safe area
<ScrollView contentContainerStyle={{ paddingBottom: 100 }} />
```

### ✅ Correct
```javascript
// Use theme
backgroundColor: colors.primary

// Use spacing tokens
marginTop: spacing.lg

// StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
});

// Use safe area insets
const insets = useSafeAreaInsets();
<ScrollView
  contentContainerStyle={{
    paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom
  }}
/>
```

---

## File Structure

```
src/
├── theme/
│   └── colors.js           # Theme tokens (import from here)
├── components/
│   ├── FloatingTabBar.js
│   ├── GlassCard.js
│   ├── PrimaryButton.js
│   └── GlassInput.js
├── screens/
│   ├── HomeScreen.js
│   ├── RecordsScreen.js
│   ├── StatisticsScreen.js
│   └── SettingsScreen.js
└── utils/
    ├── formatNumber.js
    └── formatDate.js
```

---

## Quick Commands

```bash
# Start development server
expo start

# Clear cache and restart
expo start -c

# Run on iOS simulator
expo start --ios

# Run on Android emulator
expo start --android

# Check for issues
expo doctor

# Update dependencies
expo install --fix
```

---

## Resources

- **Design Proposal:** DESIGN_PROPOSAL.md
- **Component Library:** COMPONENT_LIBRARY.md
- **Migration Guide:** MIGRATION_GUIDE.md
- **Example Implementation:** EXAMPLE_IMPLEMENTATION.js

---

**Print this guide or bookmark it for quick reference during development!**
