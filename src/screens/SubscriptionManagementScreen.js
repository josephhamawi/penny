import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '../hooks/useSubscription';

/**
 * Subscription Management Screen
 * Allows premium users to view and manage their subscription
 *
 * CURRENT STATE: Using mock data
 * NEXT STEP: Wire up to Agent 2's subscription service when ready
 *
 * Features:
 * - Premium status display
 * - Subscription details
 * - Manage subscription options
 * - Support links
 */
const SubscriptionManagementScreen = ({ navigation }) => {
  const { isPremium, subscriptionStatus } = useSubscription();
  const [loading, setLoading] = useState(false);

  // MOCK DATA - Will be replaced with real data
  const mockSubscriptionData = {
    planName: isPremium ? 'Monthly Premium' : 'Free Plan',
    price: isPremium ? '$10.00/month' : '$0.00',
    nextBillingDate: isPremium ? 'December 7, 2025' : null,
    status: isPremium ? 'Active' : 'Free',
    trialEndsDate: null, // Set if in trial
    features: [
      { name: 'AI Saving Goals Engine', enabled: isPremium },
      { name: 'Expense Personality Reports', enabled: isPremium },
      { name: 'Smart Recommendations', enabled: isPremium },
      { name: 'Unlimited Goal Tracking', enabled: isPremium },
    ],
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'This will open the App Store subscription management when connected to RevenueCat.\n\nFor now, this is just a UI demo.'
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your premium subscription?',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Mock Cancel',
              'This will cancel the subscription when connected to RevenueCat.'
            );
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@expensemonitor.app\n\nIn production, this would open your email client.'
    );
  };

  if (!isPremium) {
    // Show upgrade prompt for free users
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.freeUserContainer}>
            <LinearGradient
              colors={['#1976D2', '#00BFA6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCircle}
            >
              <Icon name="gem" size={40} color="#FFF" solid />
            </LinearGradient>
            <Text style={styles.freeUserTitle}>You're on the Free Plan</Text>
            <Text style={styles.freeUserSubtitle}>
              Upgrade to Premium to unlock all features
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Paywall')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>

            {/* Features Preview */}
            <View style={styles.featuresPreview}>
              <Text style={styles.featuresTitle}>Premium Features:</Text>
              {mockSubscriptionData.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Icon
                    name={feature.enabled ? 'check-circle' : 'lock'}
                    size={20}
                    color={feature.enabled ? '#00BFA6' : '#999'}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feature.enabled && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Premium user view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Premium Status Card */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={['#1976D2', '#00BFA6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <Icon name="gem" size={30} color="#FFF" solid />
            <Text style={styles.statusTitle}>Premium Active</Text>
            <Text style={styles.statusSubtitle}>{mockSubscriptionData.planName}</Text>
          </LinearGradient>
        </View>

        {/* Subscription Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{mockSubscriptionData.planName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>{mockSubscriptionData.price}</Text>
          </View>

          {mockSubscriptionData.nextBillingDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Billing Date</Text>
              <Text style={styles.detailValue}>
                {mockSubscriptionData.nextBillingDate}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {mockSubscriptionData.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Your Features</Text>
          {mockSubscriptionData.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Icon name="check-circle" size={20} color="#00BFA6" />
              <Text style={styles.featureText}>{feature.name}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleManageSubscription}
          >
            <Icon name="cog" size={20} color="#1976D2" />
            <Text style={styles.actionButtonText}>Manage Subscription</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Icon name="question-circle" size={20} color="#1976D2" />
            <Text style={styles.actionButtonText}>Contact Support</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleCancelSubscription}
          >
            <Icon name="times-circle" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Cancel Subscription
            </Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Mock Data Notice */}
        <View style={styles.mockNotice}>
          <Icon name="info-circle" size={16} color="#FF9800" />
          <Text style={styles.mockNoticeText}>
            Using mock data - Will connect to real subscriptions when Agent 2 is ready
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statusGradient: {
    padding: 30,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 15,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 5,
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  featureTextDisabled: {
    color: '#999',
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#F44336',
  },
  freeUserContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  gradientCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  freeUserTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  freeUserSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  upgradeButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 40,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresPreview: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  mockNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    marginBottom: 20,
  },
  mockNoticeText: {
    fontSize: 12,
    color: '#F57C00',
    marginLeft: 10,
    flex: 1,
  },
});

export default SubscriptionManagementScreen;
