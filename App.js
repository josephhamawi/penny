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
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './src/theme/colors';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import SpendingPlanScreen from './src/screens/SpendingPlanScreen';
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
import PlanOverviewScreen from './src/screens/PlanOverviewScreen';
import CreatePlanScreen from './src/screens/CreatePlanScreen';
import PlanDetailScreen from './src/screens/PlanDetailScreen';

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
        } else if (route.name === 'SpendingPlan') {
          iconName = 'wallet';
        } else if (route.name === 'Settings') {
          iconName = 'cog';
        }

        return (
          <View style={{
            width: focused ? 56 : 48,
            height: focused ? 56 : 48,
            borderRadius: 28,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: focused ? 'rgba(0, 217, 255, 0.15)' : 'transparent',
          }}>
            <Icon
              name={iconName}
              size={focused ? 24 : 20}
              color={focused ? colors.primary : colors.text.tertiary}
              solid={focused}
            />
          </View>
        );
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.text.tertiary,
      tabBarStyle: {
        position: 'absolute',
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.glass.borderLight,
        height: 85,
        paddingBottom: 20,
        paddingTop: 8,
        paddingHorizontal: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: -4,
      },
      tabBarBackground: () => (
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(10, 14, 39, 0.95)',
          borderTopWidth: 1,
          borderTopColor: colors.glass.border,
        }} />
      ),
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Records" component={RecordsScreen} />
    <Tab.Screen name="Statistics" component={StatisticsScreen} />
    <Tab.Screen
      name="SpendingPlan"
      component={SpendingPlanScreen}
      options={{ tabBarLabel: 'Plan' }}
    />
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
    <Stack.Screen
      name="PlanOverview"
      component={PlanOverviewScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="CreatePlan"
      component={CreatePlanScreen}
      options={{
        headerShown: false
      }}
    />
    <Stack.Screen
      name="PlanDetail"
      component={PlanDetailScreen}
      options={{
        headerShown: false
      }}
    />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user, loading } = useAuth();

  // Initialize RevenueCat on app launch
  // DISABLED in Expo Go - only works in EAS Build
  useEffect(() => {
    const initRevenueCat = async () => {
      // Skip RevenueCat in development/Expo Go
      // RevenueCat requires native modules not available in Expo Go
      if (__DEV__) {
        console.log('[App] Skipping RevenueCat initialization in development');
        console.log('[App] Subscription features will be unavailable');
        console.log('[App] To test subscriptions: use EAS Build (eas build -p ios)');
        return;
      }

      try {
        const REVENUECAT_IOS_API_KEY = process.env.REVENUECAT_IOS_API_KEY || 'test_kPJQuUnNcPqdAlnYATBQGahqFKX';
        console.log('[App] Initializing RevenueCat...');
        const success = await initializeRevenueCat(REVENUECAT_IOS_API_KEY);
        if (success) {
          console.log('[App] RevenueCat initialized successfully');
        } else {
          console.warn('[App] RevenueCat initialization failed - continuing without subscriptions');
        }
      } catch (error) {
        console.error('[App] RevenueCat initialization error:', error.message);
        console.warn('[App] App will continue without subscription features');
      }
    };

    initRevenueCat();
  }, []);

  // Log in user to RevenueCat when authenticated
  // DISABLED in Expo Go - only works in EAS Build
  useEffect(() => {
    const loginToRevenueCat = async () => {
      // Skip RevenueCat in development/Expo Go
      if (__DEV__) {
        return;
      }

      if (user && user.uid) {
        try {
          console.log('[App] Logging user into RevenueCat:', user.uid);
          await loginUser(user.uid);
          console.log('[App] User logged into RevenueCat successfully');
        } catch (error) {
          console.error('[App] RevenueCat login error:', error);
        }
      }
    };

    loginToRevenueCat();
  }, [user]);

  if (loading) {
    return <SplashScreen />;
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
    backgroundColor: colors.background,
  },
});
