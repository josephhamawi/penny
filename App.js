import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { initializeRevenueCat, loginUser } from './src/services/subscriptionService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import SubscriptionManagementScreen from './src/screens/SubscriptionManagementScreen';
import PersonalityReportScreen from './src/screens/PersonalityReportScreen';
import ReportHistoryScreen from './src/screens/ReportHistoryScreen';
import GoalsDashboardScreen from './src/screens/GoalsDashboardScreen';
import CreateGoalScreen from './src/screens/CreateGoalScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Records') {
          iconName = 'receipt';
        } else if (route.name === 'Statistics') {
          iconName = 'chart-pie';
        } else if (route.name === 'Settings') {
          iconName = 'cog';
        }

        return <Icon name={iconName} size={size - 2} color={color} solid />;
      },
      tabBarActiveTintColor: '#6C63FF',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Records" component={RecordsScreen} />
    <Tab.Screen name="Statistics" component={StatisticsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen
      name="AddExpense"
      component={AddExpenseScreen}
      options={{
        presentation: 'modal',
        animation: 'slide_from_bottom'
      }}
    />
    <Stack.Screen
      name="EditExpense"
      component={EditExpenseScreen}
      options={{
        presentation: 'modal',
        animation: 'slide_from_bottom'
      }}
    />
    <Stack.Screen
      name="Paywall"
      component={PaywallScreen}
      options={{
        presentation: 'modal',
        headerShown: false
      }}
    />
    <Stack.Screen
      name="SubscriptionManagement"
      component={SubscriptionManagementScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="PersonalityReport"
      component={PersonalityReportScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="ReportHistory"
      component={ReportHistoryScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="GoalsDashboard"
      component={GoalsDashboardScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="CreateGoal"
      component={CreateGoalScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="GoalDetail"
      component={GoalDetailScreen}
      options={{
        headerShown: false
      }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user, loading } = useAuth();

  // Initialize RevenueCat on app launch
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // TODO: Replace with actual API key from .env or app.config.js
        // For now, we'll just log that initialization is needed
        console.log('[App] RevenueCat initialization needed');
        console.log('[App] Please add REVENUECAT_IOS_API_KEY to .env file');

        // Uncomment when API key is available:
        // const REVENUECAT_IOS_API_KEY = 'your_api_key_here';
        // await initializeRevenueCat(REVENUECAT_IOS_API_KEY);
      } catch (error) {
        console.error('[App] Failed to initialize RevenueCat:', error);
      }
    };

    initRevenueCat();
  }, []);

  // Log in user to RevenueCat when authenticated
  useEffect(() => {
    const loginToRevenueCat = async () => {
      if (user && user.uid) {
        try {
          console.log('[App] Logging user into RevenueCat:', user.uid);
          // Uncomment when RevenueCat is initialized:
          // await loginUser(user.uid);
        } catch (error) {
          console.error('[App] RevenueCat login error:', error);
        }
      }
    };

    loginToRevenueCat();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <RootNavigator />
      <Toast />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
