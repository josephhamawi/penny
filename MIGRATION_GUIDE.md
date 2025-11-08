# Spensely Design System Migration Guide
## Upgrading to iOS 19-Inspired Floating UI

This guide will help you migrate from the current design to the new floating UI design system.

---

## Prerequisites

Ensure you have the required dependencies installed:

```bash
# Required packages (should already be installed)
expo install expo-linear-gradient
expo install @expo/vector-icons
expo install expo-haptics
expo install expo-blur
expo install react-native-safe-area-context

# Verify versions
npm list expo-linear-gradient expo-haptics expo-blur
```

---

## Migration Steps

### Step 1: Update App.js to Use FloatingTabBar

**Current Implementation:**
```javascript
// App.js - OLD
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        // ... icon logic
      },
      tabBarStyle: {
        position: 'absolute',
        backgroundColor: colors.background,
        // ... old styles
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    {/* ... */}
  </Tab.Navigator>
);
```

**New Implementation:**
```javascript
// App.js - NEW
import FloatingTabBar from './src/components/FloatingTabBar';

const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <FloatingTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Records" component={RecordsScreen} />
    <Tab.Screen name="Statistics" component={StatisticsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);
```

### Step 2: Update Screen Layouts for Floating Tab Bar

All screens need to account for the floating tab bar at the bottom.

**Add padding to ScrollViews:**
```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizes, spacing } from '../theme/colors';

const MyScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom,
      }}
    >
      {/* content */}
    </ScrollView>
  );
};
```

### Step 3: Replace Card Components

**Old:**
```javascript
<View style={styles.card}>
  <Text>Content</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    // ...
  },
});
```

**New:**
```javascript
import GlassCard from '../components/GlassCard';

<GlassCard>
  <Text>Content</Text>
</GlassCard>

// Or with gradient
<GlassCard variant="gradient" gradient={colors.primaryGradient}>
  <Text>Featured Content</Text>
</GlassCard>
```

### Step 4: Update Button Components

**Old:**
```javascript
<TouchableOpacity
  onPress={handlePress}
  style={styles.button}
>
  <LinearGradient
    colors={colors.primaryGradient}
    style={styles.buttonGradient}
  >
    <Text style={styles.buttonText}>Submit</Text>
  </LinearGradient>
</TouchableOpacity>
```

**New:**
```javascript
import PrimaryButton from '../components/PrimaryButton';

<PrimaryButton
  title="Submit"
  onPress={handlePress}
  icon="check"
/>
```

### Step 5: Update Input Fields

**Old:**
```javascript
<View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Enter amount"
    // ...
  />
</View>

const styles = StyleSheet.create({
  inputContainer: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderLight,
  },
  input: {
    padding: 16,
    color: colors.text.primary,
  },
});
```

**New:**
```javascript
import GlassInput from '../components/GlassInput';

<GlassInput
  placeholder="Enter amount"
  value={amount}
  onChangeText={setAmount}
  variant="currency"
  icon="dollar-sign"
/>
```

### Step 6: Update Typography

**Old:**
```javascript
const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
```

**New:**
```javascript
import { typography } from '../theme/colors';

const styles = StyleSheet.create({
  title: typography.h1,
  body: typography.bodySecondary,
  amount: typography.currency.large,
});
```

### Step 7: Update Color References

**Old:**
```javascript
backgroundColor: '#0A0E27'
color: '#00D9FF'
borderColor: 'rgba(255, 255, 255, 0.1)'
```

**New:**
```javascript
import { colors } from '../theme/colors';

backgroundColor: colors.background.base
color: colors.primary
borderColor: colors.glass.borderLight
```

### Step 8: Add Multi-layer Backgrounds

**Old:**
```javascript
<View style={styles.container}>
  <ScrollView>
    {/* content */}
  </ScrollView>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
```

**New:**
```javascript
import { colors } from '../theme/colors';

<View style={styles.container}>
  {/* Background layers */}
  <View style={styles.backgroundLayer1} />
  <View style={styles.backgroundLayer2} />

  <ScrollView>
    {/* content */}
  </ScrollView>
</View>

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  backgroundLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: colors.background.layer1,
    opacity: 0.5,
  },
  backgroundLayer2: {
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

### Step 9: Update Animations

**Old:**
```javascript
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

**New:**
```javascript
import { animation } from '../theme/colors';

// For smooth transitions
Animated.timing(value, {
  toValue: 1,
  duration: animation.timing.normal,
  useNativeDriver: true,
}).start();

// For bouncy interactions
Animated.spring(value, {
  toValue: 1,
  ...animation.spring.bouncy,
  useNativeDriver: true,
}).start();
```

### Step 10: Add Haptic Feedback

**Add to button presses:**
```javascript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const handlePress = () => {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  // ... rest of handler
};
```

---

## Screen-Specific Migrations

### HomeScreen Migration

**Changes needed:**
1. Replace balance card with gradient variant
2. Add floating action button
3. Update transaction cards
4. Add bottom padding for tab bar

**Example:**
```javascript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import { colors, spacing, sizes } from '../theme/colors';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom,
        }}
      >
        {/* Balance Card - Now with gradient */}
        <GlassCard variant="gradient" style={styles.balanceCard}>
          <Text style={typography.h3}>Total Balance</Text>
          <Text style={typography.currency.large}>
            ${balance.toFixed(2)}
          </Text>
        </GlassCard>

        {/* Rest of content */}
      </ScrollView>

      {/* Add Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: sizes.tabBar.height + spacing.xl + insets.bottom }
        ]}
      >
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={24} color={colors.text.primary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};
```

### RecordsScreen Migration

**Changes needed:**
1. Update filter pills
2. Replace transaction list items
3. Add pull-to-refresh indicator

### StatisticsScreen Migration

**Changes needed:**
1. Update chart containers with glass cards
2. Add gradient fills to charts
3. Update insight cards

### SettingsScreen Migration

**Changes needed:**
1. Replace list items with glass cards
2. Update section headers
3. Add haptic feedback to toggles

---

## Breaking Changes

### 1. Colors Object Structure

**Before:**
```javascript
colors.background          // Single value
colors.glass.shadow        // Shadow color
```

**After:**
```javascript
colors.background.base     // Nested object
colors.glass.shadowDark    // Renamed property
```

**Fix:**
Use legacy support properties or update to new structure.

### 2. Tab Bar Height

**Before:** 85px
**After:** 76px + 24px bottom margin

**Fix:**
Update all bottom padding calculations:
```javascript
// OLD
paddingBottom: 105

// NEW
paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom
```

### 3. Shadow Presets

**Before:** `shadows.sm`, `shadows.md`, `shadows.lg`
**After:** `shadows.subtle`, `shadows.elevated`, `shadows.floating`

**Fix:**
Update shadow references (legacy names still work).

---

## Testing Checklist

After migration, test:

- [ ] All screens render correctly
- [ ] Floating tab bar appears on all tab screens
- [ ] Tab bar doesn't overlap content
- [ ] Tab animations work smoothly
- [ ] Haptic feedback works on iOS
- [ ] Safe area insets handled correctly (notch, home indicator)
- [ ] Gradient cards display correctly
- [ ] Input fields show focus animations
- [ ] Buttons have press animations
- [ ] No console warnings about deprecated props
- [ ] Performance is acceptable (60fps scrolling)

---

## Common Issues & Solutions

### Issue 1: Content Hidden Behind Tab Bar

**Problem:** Bottom content is hidden by the floating tab bar.

**Solution:**
Add proper bottom padding using safe area insets:
```javascript
const insets = useSafeAreaInsets();

<ScrollView
  contentContainerStyle={{
    paddingBottom: sizes.tabBar.height + spacing.xl + insets.bottom,
  }}
>
```

### Issue 2: Tab Bar Icons Not Showing

**Problem:** Icons appear as boxes or don't render.

**Solution:**
Ensure `@expo/vector-icons` is installed and imported correctly:
```javascript
import { FontAwesome5 as Icon } from '@expo/vector-icons';
```

### Issue 3: Blur Effect Not Working

**Problem:** BlurView shows as solid background.

**Solution:**
1. Check `expo-blur` is installed
2. On Android, use fallback:
```javascript
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

{Platform.OS === 'ios' ? (
  <BlurView intensity={80} tint="dark">
    {/* content */}
  </BlurView>
) : (
  <View style={{ backgroundColor: colors.tabs.container.background }}>
    {/* content */}
  </View>
)}
```

### Issue 4: Animations Laggy

**Problem:** Spring animations feel slow or janky.

**Solution:**
1. Always use `useNativeDriver: true` when possible
2. Reduce `shadowRadius` on Android
3. Memoize animated components

### Issue 5: Colors Look Different

**Problem:** Colors don't match design.

**Solution:**
1. Clear Metro bundler cache: `expo start -c`
2. Verify you're importing from the updated theme file
3. Check for inline color values overriding theme

---

## Rollback Plan

If you need to rollback:

1. **Revert App.js changes:**
   ```bash
   git checkout HEAD -- App.js
   ```

2. **Remove new components:**
   ```bash
   rm src/components/FloatingTabBar.js
   rm src/components/GlassCard.js
   rm src/components/PrimaryButton.js
   rm src/components/GlassInput.js
   ```

3. **Revert theme file:**
   ```bash
   git checkout HEAD -- src/theme/colors.js
   ```

4. **Restart Metro:**
   ```bash
   expo start -c
   ```

---

## Gradual Migration Strategy

You don't have to migrate everything at once. Here's a recommended order:

### Phase 1: Foundation (Week 1)
- [ ] Update theme file
- [ ] Add FloatingTabBar
- [ ] Test on all screens

### Phase 2: Components (Week 2)
- [ ] Create GlassCard, PrimaryButton, GlassInput
- [ ] Update HomeScreen
- [ ] Update one other screen

### Phase 3: Full Migration (Week 3)
- [ ] Migrate remaining screens
- [ ] Update all buttons and inputs
- [ ] Add haptic feedback

### Phase 4: Polish (Week 4)
- [ ] Add animations
- [ ] Test on devices
- [ ] Performance optimization
- [ ] Bug fixes

---

## Support

For issues or questions:
1. Check the COMPONENT_LIBRARY.md for usage examples
2. Review DESIGN_PROPOSAL.md for design rationale
3. See EXAMPLE_IMPLEMENTATION.js for working code

---

## Performance Considerations

### Memory Usage
- Glass effects add minimal overhead
- Gradients are lightweight
- Blur effects can impact Android performance

### Optimization Tips
1. **Memoize static components:**
   ```javascript
   const BalanceCard = React.memo(({ balance }) => {
     // ...
   });
   ```

2. **Use FlatList for long lists:**
   ```javascript
   <FlatList
     data={transactions}
     renderItem={({ item }) => <TransactionCard transaction={item} />}
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
   />
   ```

3. **Reduce shadow complexity on Android:**
   ```javascript
   ...Platform.select({
     ios: shadows.floating,
     android: shadows.elevated,
   })
   ```

4. **Cache animated values:**
   ```javascript
   const scaleAnim = useRef(new Animated.Value(1)).current; // Not in render
   ```

---

## Accessibility Improvements

The new design system includes better accessibility:

### Enhanced Contrast
- All text meets WCAG AAA standards
- Focus states are more visible
- Error states include icons + text

### Screen Reader Support
- All interactive elements have labels
- Buttons announce their state
- Cards have proper roles

### Dynamic Type Support
To support iOS text size settings:
```javascript
import { useAccessibilityInfo } from 'react-native';

const { fontSize } = useAccessibilityInfo();
// Adjust typography scales based on user preference
```

---

## Next Steps

After migration:
1. Gather user feedback
2. Monitor crash reports
3. Track performance metrics
4. Iterate on animations
5. Add more components as needed

Good luck with your migration!
