import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

// Mock history data for development
const MOCK_REPORTS = [
  {
    id: 'report-1',
    month: '2025-11',
    generatedAt: new Date('2025-11-01'),
    personalityType: 'Conscious Spender',
    savingsRate: 25,
    totalExpenses: 3000,
  },
  {
    id: 'report-2',
    month: '2025-10',
    generatedAt: new Date('2025-10-01'),
    personalityType: 'Strategic Saver',
    savingsRate: 28,
    totalExpenses: 2800,
  },
  {
    id: 'report-3',
    month: '2025-09',
    generatedAt: new Date('2025-09-01'),
    personalityType: 'Balanced Budgeter',
    savingsRate: 22,
    totalExpenses: 3200,
  },
  {
    id: 'report-4',
    month: '2025-08',
    generatedAt: new Date('2025-08-01'),
    personalityType: 'Mindful Manager',
    savingsRate: 20,
    totalExpenses: 3300,
  },
  {
    id: 'report-5',
    month: '2025-07',
    generatedAt: new Date('2025-07-01'),
    personalityType: 'Frugal Friend',
    savingsRate: 30,
    totalExpenses: 2700,
  },
];

const ReportHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [loading, setLoading] = useState(false);

  const formatMonthYear = (monthString) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getSavingsColor = (rate) => {
    if (rate >= 25) return '#4CAF50';
    if (rate >= 15) return '#FF9800';
    return '#F44336';
  };

  const handleReportPress = (report) => {
    // Navigate to the specific report details
    navigation.navigate('PersonalityReport', { reportId: report.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1976D2', '#00BFA6']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report History</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Journey</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Icon name="file-alt" size={24} color="#1976D2" />
              <Text style={styles.summaryValue}>{reports.length}</Text>
              <Text style={styles.summaryLabel}>Reports</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Icon name="chart-line" size={24} color="#4CAF50" />
              <Text style={styles.summaryValue}>
                {(reports.reduce((sum, r) => sum + r.savingsRate, 0) / reports.length).toFixed(1)}%
              </Text>
              <Text style={styles.summaryLabel}>Avg Savings</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Icon name="star" size={24} color="#FFD700" />
              <Text style={styles.summaryValue}>{Math.max(...reports.map(r => r.savingsRate)).toFixed(0)}%</Text>
              <Text style={styles.summaryLabel}>Best Month</Text>
            </View>
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Reports</Text>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="inbox" size={60} color="#CCC" />
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyText}>
              Generate your first personality report to start tracking your financial journey!
            </Text>
          </View>
        ) : (
          reports.map((report, index) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => handleReportPress(report)}
              activeOpacity={0.7}
            >
              {/* Month Badge */}
              <View style={styles.monthBadge}>
                <Text style={styles.monthText}>{formatMonthYear(report.month)}</Text>
                <Text style={styles.dateText}>Generated {formatDate(report.generatedAt)}</Text>
              </View>

              {/* Personality Type */}
              <View style={styles.personalityRow}>
                <Icon name="star" size={20} color="#FFD700" />
                <Text style={styles.personalityText}>{report.personalityType}</Text>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Icon name="dollar-sign" size={16} color="#666" />
                  <Text style={styles.statValue}>${report.totalExpenses.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Expenses</Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="piggy-bank" size={16} color={getSavingsColor(report.savingsRate)} />
                  <Text style={[styles.statValue, { color: getSavingsColor(report.savingsRate) }]}>
                    {report.savingsRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Savings Rate</Text>
                </View>
              </View>

              {/* View Button */}
              <View style={styles.viewButtonRow}>
                <Text style={styles.viewButtonText}>View Full Report</Text>
                <Icon name="chevron-right" size={16} color="#1976D2" />
              </View>

              {/* Trend Indicator */}
              {index < reports.length - 1 && (
                <View style={styles.trendIndicator}>
                  {report.savingsRate > reports[index + 1].savingsRate ? (
                    <View style={styles.trendBadge}>
                      <Icon name="arrow-up" size={12} color="#4CAF50" />
                      <Text style={[styles.trendText, { color: '#4CAF50' }]}>Improved</Text>
                    </View>
                  ) : report.savingsRate < reports[index + 1].savingsRate ? (
                    <View style={styles.trendBadge}>
                      <Icon name="arrow-down" size={12} color="#F44336" />
                      <Text style={[styles.trendText, { color: '#F44336' }]}>Decreased</Text>
                    </View>
                  ) : (
                    <View style={styles.trendBadge}>
                      <Icon name="minus" size={12} color="#999" />
                      <Text style={[styles.trendText, { color: '#999' }]}>Stable</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  reportCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  monthBadge: {
    marginBottom: 15,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  personalityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
  },
  personalityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  viewButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  trendIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ReportHistoryScreen;
