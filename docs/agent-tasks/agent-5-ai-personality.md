# Agent 5: AI Features Developer (Personality Reports)

## 🎯 Mission
Build the AI Expense Personality Reports system that analyzes users' spending patterns monthly and generates engaging, personalized financial personality reports using OpenAI with actionable insights in a conversational tone.

---

## 📋 Assignment Overview

**Epic:** Epic 5 - AI Expense Personality Reports
**Timeline:** 2 weeks (10 business days)
**Priority:** HIGH - Flagship premium engagement feature
**Dependencies:**
- Requires Agent 1 complete (user-scoped Firestore)
- Requires Agent 2 complete (subscription service to gate feature)
- Requires Agent 3 complete (paywall for non-subscribers)

---

## 🔨 Stories Assigned

### ✅ Story 5.1: Create Personality Reports Data Model

**As a** developer,
**I want** a Firestore schema for storing generated personality reports,
**so that** reports are cached and can be viewed later without regenerating.

#### Acceptance Criteria
1. ✓ Reports stored at `/users/{userId}/personalityReports/{reportId}`
2. ✓ Report document structure includes all required fields
3. ✓ Firestore security rules allow only authenticated user to read/write their reports
4. ✓ Index created for querying reports by `userId` and `month`
5. ✓ Service methods: `generatePersonalityReport()`, `getLatestReport()`, `getReportHistory()`

#### Implementation Guidance

**Firestore Schema:**
```
/users/{userId}/personalityReports/{reportId}
  - id: string
  - userId: string
  - month: string (e.g., "2025-11")
  - generatedAt: Timestamp
  - personalityType: string (e.g., "Conscious Spender")
  - summary: string (AI-generated paragraph)
  - strengths: string[] (e.g., ["Consistent with groceries", "Good rent control"])
  - improvements: string[] (e.g., ["Spontaneous with tech purchases"])
  - recommendations: string[] (actionable tips)
  - categoryInsights: [
      { category: string, insight: string, trend: 'up' | 'down' | 'stable' }
    ]
  - topCategories: [
      { category: string, amount: number, percentage: number }
    ]
  - monthlyStats: {
      totalIncome: number,
      totalExpenses: number,
      netSavings: number,
      savingsRate: number
    }
```

**Update Firestore Security Rules:**
```javascript
// Add to existing rules
match /users/{userId}/personalityReports/{reportId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Create `/src/services/personalityReportService.js`:**
```javascript
import { firestore, auth } from '../config/firebase';

const getUserReportsCollection = (userId) => {
  return firestore.collection(`users/${userId}/personalityReports`);
};

export const getLatestReport = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const snapshot = await getUserReportsCollection(user.uid)
    .orderBy('generatedAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    generatedAt: doc.data().generatedAt?.toDate(),
  };
};

export const getReportHistory = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const snapshot = await getUserReportsCollection(user.uid)
    .orderBy('generatedAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    generatedAt: doc.data().generatedAt?.toDate(),
  }));
};

export const getReportByMonth = async (month) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const snapshot = await getUserReportsCollection(user.uid)
    .where('month', '==', month)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    generatedAt: doc.data().generatedAt?.toDate(),
  };
};

export const savePersonalityReport = async (reportData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const reportRef = getUserReportsCollection(user.uid).doc();

  await reportRef.set({
    id: reportRef.id,
    userId: user.uid,
    ...reportData,
    generatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return reportRef.id;
};

export const deleteReport = async (reportId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await getUserReportsCollection(user.uid).doc(reportId).delete();
};
```

**Files to Create:**
- `/src/services/personalityReportService.js`

**Files to Modify:**
- `firestore.rules`

---

### ✅ Story 5.2: Build AI Prompt Template for Personality Analysis

**As a** developer,
**I want** a well-structured OpenAI prompt that generates personality reports,
**so that** AI output is consistent, engaging, and actionable.

#### Acceptance Criteria
1. ✓ Prompt template includes user's expense summary
2. ✓ Prompt specifies tone: "Conversational, encouraging, personal"
3. ✓ Prompt includes examples of good output
4. ✓ Prompt uses GPT-4 for high-quality language
5. ✓ Max tokens: 800

#### Implementation Guidance

**Update `/src/services/aiService.js`:**
```javascript
export const generatePersonalityReport = async (userId, month) => {
  try {
    // Get expenses for the month
    const monthDate = new Date(month);
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const expensesSnapshot = await firestore
      .collection(`users/${userId}/expenses`)
      .where('date', '>=', firestore.Timestamp.fromDate(startOfMonth))
      .where('date', '<=', firestore.Timestamp.fromDate(endOfMonth))
      .get();

    if (expensesSnapshot.empty || expensesSnapshot.size < 5) {
      throw new Error('Not enough expenses this month to generate a report. Add at least 5 expenses.');
    }

    const expenses = expensesSnapshot.docs.map(doc => doc.data());

    // Calculate statistics
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};
    const categoryFrequency = {};

    expenses.forEach(expense => {
      totalIncome += expense.inAmount || 0;
      totalExpenses += expense.outAmount || 0;

      if (expense.outAmount > 0) {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.outAmount;
        categoryFrequency[expense.category] = (categoryFrequency[expense.category] || 0) + 1;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Get top 5 categories by spending
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpenses) * 100,
        frequency: categoryFrequency[category],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Get previous month's data for trends
    const prevMonthDate = new Date(monthDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const prevReport = await getReportByMonth(prevMonth);

    let trendInfo = '';
    if (prevReport) {
      const expensesChange = ((totalExpenses - prevReport.monthlyStats.totalExpenses) / prevReport.monthlyStats.totalExpenses) * 100;
      trendInfo = `Compared to last month: ${expensesChange > 0 ? 'increased' : 'decreased'} spending by ${Math.abs(expensesChange).toFixed(1)}%`;
    }

    // Build detailed prompt for OpenAI
    const prompt = `You are an empathetic financial advisor analyzing a user's spending patterns to create an engaging "Expense Personality" report.

Monthly Financial Summary (${month}):
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${netSavings.toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%
${trendInfo}

Top Spending Categories:
${topCategories.map(c => `- ${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}% of spending, ${c.frequency} transactions)`).join('\n')}

Task: Create a personalized "Expense Personality" report with the following structure:

1. **Personality Type Name**: A creative, memorable 2-3 word personality type (e.g., "Conscious Spender", "Strategic Saver", "Balanced Budgeter")

2. **Summary**: A warm, encouraging 2-3 sentence summary of their overall financial behavior this month. Make it personal and conversational (use "you" and "your").

3. **Strengths** (3-5 items): Identify positive patterns in their spending. Focus on:
   - Categories where they show consistency
   - Good saving habits
   - Improvements from last month
   - Low-spending categories

4. **Areas for Improvement** (2-3 items): Gently point out opportunities to improve:
   - High-spending categories that could be reduced
   - Spontaneous or irregular spending patterns
   - Categories that increased from last month

5. **Recommendations** (3-5 items): Specific, actionable tips tailored to their spending patterns

6. **Category Insights**: For each top category, provide a short insight (1 sentence) and trend indicator:
   - "up" if spending increased
   - "down" if spending decreased
   - "stable" if relatively consistent

Tone Guidelines:
- Be warm, friendly, and encouraging (NOT judgmental)
- Use conversational language like you're talking to a friend
- Celebrate wins and progress
- Frame improvements as opportunities, not failures
- Add personality and be engaging (this should be fun to read!)
- Avoid financial jargon

Example Output Format:
{
  "personalityType": "Conscious Spender",
  "summary": "You're doing great this month! You've shown impressive consistency with your grocery budget while treating yourself to some well-deserved tech upgrades. Your transport spending has improved significantly — that's progress worth celebrating!",
  "strengths": [
    "Consistent with groceries - sticking to your weekly budget",
    "Excellent rent control - no surprises here",
    "Reduced transport costs by 15% from last month"
  ],
  "improvements": [
    "Spontaneous with tech purchases - consider a monthly tech budget",
    "Restaurant spending spiked this month - maybe meal prep 2x per week?"
  ],
  "recommendations": [
    "Set aside $50/month for tech purchases to avoid impulse buys",
    "Try cooking at home 2 extra times per week to save $60/month",
    "Consider a carpooling app to cut transport costs further",
    "You're saving ${savingsRate}% - aim for 20% next month!"
  ],
  "categoryInsights": [
    { "category": "Groceries", "insight": "Solid and consistent - you're a meal planning pro!", "trend": "stable" },
    { "category": "Tech", "insight": "A few splurges this month - maybe set a tech budget?", "trend": "up" },
    { "category": "Transport", "insight": "Great improvement from last month!", "trend": "down" }
  ]
}

Now generate the personality report as valid JSON:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: expenses.length >= 50 ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly, empathetic financial advisor. Respond ONLY with valid JSON matching the specified format.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const reportData = JSON.parse(completion.choices[0].message.content);

    // Add calculated stats
    reportData.month = month;
    reportData.monthlyStats = {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
    };
    reportData.topCategories = topCategories;

    // Save to Firestore
    await savePersonalityReport(reportData);

    return reportData;
  } catch (error) {
    console.error('Error generating personality report:', error);
    throw error;
  }
};
```

**Files to Modify:**
- `/src/services/aiService.js`

---

### ✅ Story 5.3: Implement Personality Report Generation Service

(Already covered in Story 5.2 above)

---

### ✅ Story 5.4: Create Personality Report Screen UI

**As a** premium user,
**I want** a beautiful screen to view my personality report,
**so that** I enjoy reading and sharing my insights.

#### Implementation Guidance

**Create `/src/screens/PersonalityReportScreen.js`:**
```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { FontAwesome5 as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { getLatestReport } from '../services/personalityReportService';
import { generatePersonalityReport } from '../services/aiService';

const PersonalityReportScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      navigation.replace('Paywall');
      return;
    }

    loadReport();
  }, [isPremium]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const latestReport = await getLatestReport();
      setReport(latestReport);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const newReport = await generatePersonalityReport(user.uid, currentMonth);
      setReport(newReport);
      Alert.alert('Success', 'Your personality report is ready! 🎉');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My Expense Personality: ${report.personalityType}\n\n${report.summary}\n\nGenerated by Expense Monitor`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personality Report</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyState}>
          <Icon name="chart-pie" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>No Report Yet</Text>
          <Text style={styles.emptyText}>
            Generate your first Expense Personality report to get personalized insights!
          </Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Report</Text>
            )}
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>
          {new Date(report.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ReportHistory')}>
          <Icon name="history" size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Personality Type Badge */}
        <View style={styles.personalityBadge}>
          <Icon name="star" size={40} color="#FFD700" />
          <Text style={styles.personalityType}>{report.personalityType}</Text>
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.summary}>{report.summary}</Text>
        </View>

        {/* Monthly Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.statsRow}>
            <StatItem
              icon="arrow-down"
              label="Income"
              value={`$${report.monthlyStats.totalIncome.toFixed(0)}`}
              color="#4CAF50"
            />
            <StatItem
              icon="arrow-up"
              label="Expenses"
              value={`$${report.monthlyStats.totalExpenses.toFixed(0)}`}
              color="#F44336"
            />
          </View>
          <View style={styles.statsRow}>
            <StatItem
              icon="piggy-bank"
              label="Saved"
              value={`$${report.monthlyStats.netSavings.toFixed(0)}`}
              color="#1976D2"
            />
            <StatItem
              icon="percent"
              label="Savings Rate"
              value={`${report.monthlyStats.savingsRate.toFixed(1)}%`}
              color="#00BFA6"
            />
          </View>
        </View>

        {/* Strengths */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Your Strengths</Text>
          </View>
          {report.strengths.map((strength, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="check" size={16} color="#4CAF50" />
              <Text style={styles.listItemText}>{strength}</Text>
            </View>
          ))}
        </View>

        {/* Improvements */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="arrow-up" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>Areas to Improve</Text>
          </View>
          {report.improvements.map((improvement, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="lightbulb" size={16} color="#FF9800" />
              <Text style={styles.listItemText}>{improvement}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="magic" size={24} color="#1976D2" />
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
          </View>
          {report.recommendations.map((rec, index) => (
            <View key={index} style={styles.listItem}>
              <Icon name="chevron-right" size={16} color="#1976D2" />
              <Text style={styles.listItemText}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Category Insights */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Category Insights</Text>
          {report.categoryInsights.map((insight, index) => (
            <View key={index} style={styles.categoryInsightCard}>
              <View style={styles.categoryInsightHeader}>
                <Text style={styles.categoryName}>{insight.category}</Text>
                <Icon
                  name={insight.trend === 'up' ? 'arrow-up' : insight.trend === 'down' ? 'arrow-down' : 'minus'}
                  size={16}
                  color={insight.trend === 'up' ? '#F44336' : insight.trend === 'down' ? '#4CAF50' : '#999'}
                />
              </View>
              <Text style={styles.categoryInsightText}>{insight.insight}</Text>
            </View>
          ))}
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Icon name="share-alt" size={20} color="#1976D2" />
          <Text style={styles.shareButtonText}>Share Report</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const StatItem = ({ icon, label, value, color }) => (
  <View style={styles.statItem}>
    <Icon name={icon} size={20} color={color} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

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
  personalityBadge: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    marginBottom: 10,
  },
  personalityType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  categoryInsightCard: {
    backgroundColor: '#F5F6FA',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  categoryInsightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryInsightText: {
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  generateButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonalityReportScreen;
```

**Files to Create:**
- `/src/screens/PersonalityReportScreen.js`

---

### ✅ Story 5.5: Add Report History View

**Create `/src/screens/ReportHistoryScreen.js`:**
[Standard list screen showing all past reports]

---

### ✅ Story 5.6: Implement Social Share Functionality

**Use `react-native-view-shot` or `expo-sharing`:**
[Already included in PersonalityReportScreen share button]

---

### ✅ Story 5.7: Schedule Monthly Report Generation Reminder

**Use Expo Notifications and TaskManager:**
```javascript
// In App.js or notification service
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const MONTHLY_REPORT_TASK = 'monthly-report-reminder';

TaskManager.defineTask(MONTHLY_REPORT_TASK, async () => {
  const user = auth.currentUser;
  if (!user) return;

  const { status } = await checkSubscriptionStatus();
  if (status === 'none') return;

  // Send notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your Monthly Report is Ready! 🌟',
      body: 'Check out your Expense Personality insights for this month',
      data: { screen: 'PersonalityReport' },
    },
    trigger: null, // Immediate
  });
});
```

---

## 📦 Deliverables

1. **Personality Report Data Model**
2. **AI Prompt Template & Generation Service**
3. **Personality Report Screen UI**
4. **Report History Screen**
5. **Social Share Functionality**
6. **Monthly Notification System**

---

## 🚦 Definition of Done

- [ ] All 7 stories completed
- [ ] AI reports are engaging and personalized
- [ ] Report generation working reliably
- [ ] Beautiful, shareable UI
- [ ] Monthly notifications working
- [ ] Code reviewed and merged

---

**Ready to start? Questions?**

Contact: Product Manager (John)
PRD Reference: `/docs/prd.md` - Epic 5
