# How to Add Navigation to Personality Reports

This guide shows you exactly how to add buttons/cards to existing screens to navigate to the new AI Personality Reports feature.

---

## Option 1: Add to Settings Screen (RECOMMENDED)

Add a menu item in the Settings screen:

```javascript
// In src/screens/SettingsScreen.js

import { FontAwesome5 as Icon } from '@expo/vector-icons';

// Inside the component, add this menu item:

<View style={styles.section}>
  <Text style={styles.sectionTitle}>AI Features</Text>

  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => navigation.navigate('PersonalityReport')}
  >
    <Icon name="magic" size={20} color="#1976D2" />
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>AI Personality Report</Text>
      <Text style={styles.menuSubtitle}>Get personalized spending insights</Text>
    </View>
    <Icon name="chevron-right" size={16} color="#999" />
  </TouchableOpacity>
</View>

// Add these styles:

const styles = StyleSheet.create({
  // ... existing styles

  section: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
```

---

## Option 2: Add to Home Screen Dashboard

Add a prominent card to the Home screen:

```javascript
// In src/screens/HomeScreen.js

import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

// Inside the ScrollView, add this card:

<TouchableOpacity
  style={styles.aiReportCard}
  onPress={() => navigation.navigate('PersonalityReport')}
  activeOpacity={0.8}
>
  <LinearGradient
    colors={['#1976D2', '#00BFA6']}
    style={styles.gradientCard}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
  >
    <View style={styles.cardHeader}>
      <Icon name="magic" size={30} color="#FFF" />
      <View style={{ flex: 1 }}>
        <Text style={styles.aiCardTitle}>AI Personality Report</Text>
        <Text style={styles.aiCardSubtitle}>Discover your spending personality</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#FFF" />
    </View>

    <View style={styles.cardFeatures}>
      <View style={styles.feature}>
        <Icon name="star" size={16} color="#FFD700" />
        <Text style={styles.featureText}>Personalized insights</Text>
      </View>
      <View style={styles.feature}>
        <Icon name="lightbulb" size={16} color="#FFD700" />
        <Text style={styles.featureText}>AI recommendations</Text>
      </View>
      <View style={styles.feature}>
        <Icon name="chart-line" size={16} color="#FFD700" />
        <Text style={styles.featureText}>Trend analysis</Text>
      </View>
    </View>
  </LinearGradient>
</TouchableOpacity>

// Add these styles:

const styles = StyleSheet.create({
  // ... existing styles

  aiReportCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientCard: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  aiCardSubtitle: {
    fontSize: 12,
    color: '#E0F7FA',
    marginTop: 2,
  },
  cardFeatures: {
    flexDirection: 'row',
    gap: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
});
```

---

## Option 3: Add to Statistics Screen

Add a tab or button at the top of Statistics:

```javascript
// In src/screens/StatisticsScreen.js

// Add a banner at the top:

<View style={styles.aiBanner}>
  <TouchableOpacity
    style={styles.aiButton}
    onPress={() => navigation.navigate('PersonalityReport')}
  >
    <Icon name="magic" size={20} color="#1976D2" />
    <Text style={styles.aiButtonText}>View AI Personality Report</Text>
    <Icon name="arrow-right" size={16} color="#1976D2" />
  </TouchableOpacity>
</View>

// Add these styles:

const styles = StyleSheet.create({
  // ... existing styles

  aiBanner: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    marginBottom: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
});
```

---

## Option 4: Floating Action Button (FAB)

Add a floating button that appears on multiple screens:

```javascript
// In src/screens/HomeScreen.js or any screen

<TouchableOpacity
  style={styles.fab}
  onPress={() => navigation.navigate('PersonalityReport')}
>
  <LinearGradient
    colors={['#1976D2', '#00BFA6']}
    style={styles.fabGradient}
  >
    <Icon name="magic" size={24} color="#FFF" />
  </LinearGradient>
</TouchableOpacity>

// Add these styles:

const styles = StyleSheet.create({
  // ... existing styles

  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

---

## Option 5: Tab Navigator Badge

Add a badge to the Statistics tab:

```javascript
// In App.js, modify the TabNavigator:

<Tab.Screen
  name="Statistics"
  component={StatisticsScreen}
  options={{
    tabBarBadge: 'AI',
    tabBarBadgeStyle: {
      backgroundColor: '#4CAF50',
      color: '#FFF',
      fontSize: 10,
    },
  }}
/>
```

---

## Testing Your Navigation

After adding any of the above:

1. **Reload the app**
   ```bash
   # Shake device or press Cmd+D (iOS) / Cmd+M (Android)
   # Select "Reload"
   ```

2. **Tap the button/card**
   - Should navigate to PersonalityReportScreen
   - You'll see the mock personality report

3. **Test the report screen**
   - Scroll through all sections
   - Tap "Generate New Report" (shows info alert)
   - Tap "Share Report" (opens share dialog)
   - Tap history icon (top right) to see report history

4. **Test report history**
   - See 6 mock reports
   - Tap any report (shows info alert)
   - Tap back button to return

---

## Quick Copy-Paste: Simple Button

Just want to test? Add this anywhere:

```javascript
import { Button } from 'react-native';

<Button
  title="View Personality Report"
  onPress={() => navigation.navigate('PersonalityReport')}
  color="#1976D2"
/>
```

---

## Navigation Props

Both screens use `navigation` prop from React Navigation:

```javascript
// PersonalityReportScreen
navigation.navigate('PersonalityReport')
navigation.navigate('PersonalityReport', { reportId: 'report-123' })

// ReportHistoryScreen
navigation.navigate('ReportHistory')

// Go back
navigation.goBack()
```

---

## Example: Full Settings Integration

Here's a complete example for SettingsScreen:

```javascript
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      {/* Existing settings sections */}

      {/* NEW: AI Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Features</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('PersonalityReport')}
        >
          <Icon name="magic" size={20} color="#1976D2" />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Personality Report</Text>
            <Text style={styles.menuSubtitle}>AI-powered spending insights</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ReportHistory')}
        >
          <Icon name="history" size={20} color="#1976D2" />
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Report History</Text>
            <Text style={styles.menuSubtitle}>View past personality reports</Text>
          </View>
          <Icon name="chevron-right" size={16} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Rest of settings */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  section: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default SettingsScreen;
```

---

## Visual Hierarchy Tips

### Best Practices
1. **Settings Screen**: Use menu items (clean, organized)
2. **Home Screen**: Use gradient cards (eye-catching)
3. **Statistics Screen**: Use banner/tab (contextual)
4. **Multiple Screens**: Use FAB (always accessible)

### Colors
- Primary: `#1976D2` (Blue)
- Secondary: `#00BFA6` (Teal)
- Gradient: `['#1976D2', '#00BFA6']`
- Icons: Use `FontAwesome5` from `@expo/vector-icons`

---

## That's It!

Choose any option above, copy the code, add it to your screen, and reload. You'll have instant access to the beautiful AI Personality Reports feature!

**Recommended**: Start with Option 1 (Settings Screen) for the cleanest integration.
