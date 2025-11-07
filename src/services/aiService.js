import OpenAI from 'openai';
import { db, auth } from '../config/firebase';
import { savePersonalityReport, getReportByMonth } from './personalityReportService';

/**
 * AI Service for Expense Personality Reports
 * Uses OpenAI GPT-4 to generate personalized financial personality insights
 *
 * IMPORTANT: Set your OpenAI API key as an environment variable:
 * EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
 *
 * Note: This service requires Agent 1 (Firestore schema) to be completed
 * for full functionality with real expense data
 */

// Initialize OpenAI client
// In production, use environment variable: process.env.EXPO_PUBLIC_OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'your_openai_api_key_here',
  dangerouslyAllowBrowser: true, // Only for development; use backend API in production
});

/**
 * Generate a comprehensive expense personality report for a specific month
 * @param {string} userId - The user ID
 * @param {string} month - Month in format "YYYY-MM" (e.g., "2025-11")
 * @returns {Promise<Object>} The generated personality report
 */
export const generatePersonalityReport = async (userId, month) => {
  try {
    // Step 1: Validate inputs
    if (!userId) throw new Error('User ID is required');
    if (!month) throw new Error('Month is required');

    // Step 2: Check if report already exists for this month
    const existingReport = await getReportByMonth(month);
    if (existingReport) {
      throw new Error(`A report for ${month} already exists. View it in your report history.`);
    }

    // Step 3: Get expenses for the specified month
    const monthDate = new Date(month);
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const expensesSnapshot = await db
      .collection(`users/${userId}/expenses`)
      .where('date', '>=', startOfMonth)
      .where('date', '<=', endOfMonth)
      .get();

    // Step 4: Validate sufficient data
    if (expensesSnapshot.empty || expensesSnapshot.size < 5) {
      throw new Error(
        'Not enough expenses this month to generate a report. Add at least 5 expenses to get meaningful insights.'
      );
    }

    const expenses = expensesSnapshot.docs.map(doc => doc.data());

    // Step 5: Calculate financial statistics
    const stats = calculateMonthlyStats(expenses);

    // Step 6: Get previous month's data for trends
    const prevMonthDate = new Date(monthDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const prevReport = await getReportByMonth(prevMonth);

    // Step 7: Build comprehensive prompt for OpenAI
    const prompt = buildPersonalityPrompt(stats, prevReport);

    // Step 8: Call OpenAI API
    const aiResponse = await callOpenAI(prompt, expenses.length);

    // Step 9: Parse and validate AI response
    const reportData = JSON.parse(aiResponse);

    // Step 10: Add calculated stats to report
    reportData.month = month;
    reportData.monthlyStats = stats.monthlyStats;
    reportData.topCategories = stats.topCategories;

    // Step 11: Save report to Firestore
    const reportId = await savePersonalityReport(reportData);

    return {
      id: reportId,
      ...reportData,
    };
  } catch (error) {
    console.error('Error generating personality report:', error);
    throw error;
  }
};

/**
 * Calculate monthly financial statistics from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} Calculated statistics
 */
const calculateMonthlyStats = (expenses) => {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = {};
  const categoryFrequency = {};

  expenses.forEach(expense => {
    totalIncome += expense.inAmount || 0;
    totalExpenses += expense.outAmount || 0;

    if (expense.outAmount > 0) {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.outAmount;
      categoryFrequency[category] = (categoryFrequency[category] || 0) + 1;
    }
  });

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Get top 5 categories by spending
  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      frequency: categoryFrequency[category],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    monthlyStats: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
    },
    topCategories,
    categoryTotals,
    categoryFrequency,
  };
};

/**
 * Build comprehensive prompt for OpenAI
 * @param {Object} stats - Monthly statistics
 * @param {Object|null} prevReport - Previous month's report (if exists)
 * @returns {string} The prompt
 */
const buildPersonalityPrompt = (stats, prevReport) => {
  const { monthlyStats, topCategories } = stats;

  let trendInfo = '';
  if (prevReport) {
    const expensesChange =
      ((monthlyStats.totalExpenses - prevReport.monthlyStats.totalExpenses) /
        prevReport.monthlyStats.totalExpenses) *
      100;
    trendInfo = `\n\nTrend Analysis:\n- Compared to last month: ${
      expensesChange > 0 ? 'increased' : 'decreased'
    } spending by ${Math.abs(expensesChange).toFixed(1)}%\n- Last month's personality: ${
      prevReport.personalityType
    }`;
  }

  return `You are an empathetic financial advisor analyzing a user's spending patterns to create an engaging "Expense Personality" report.

Monthly Financial Summary:
- Total Income: $${monthlyStats.totalIncome.toFixed(2)}
- Total Expenses: $${monthlyStats.totalExpenses.toFixed(2)}
- Net Savings: $${monthlyStats.netSavings.toFixed(2)}
- Savings Rate: ${monthlyStats.savingsRate.toFixed(1)}%${trendInfo}

Top Spending Categories:
${topCategories.map(c => `- ${c.category}: $${c.amount.toFixed(2)} (${c.percentage.toFixed(1)}% of spending, ${c.frequency} transactions)`).join('\n')}

Task: Create a personalized "Expense Personality" report with the following structure:

1. **Personality Type Name**: A creative, memorable 2-3 word personality type (e.g., "Conscious Spender", "Strategic Saver", "Balanced Budgeter", "Mindful Manager", "Frugal Friend", "Smart Splurger")
   - Make it unique and engaging
   - Should reflect their overall financial behavior
   - Keep it positive and empowering

2. **Summary**: A warm, encouraging 2-3 sentence summary of their overall financial behavior this month
   - Make it personal and conversational (use "you" and "your")
   - Highlight key achievements or patterns
   - Keep the tone friendly and supportive

3. **Strengths** (3-5 items): Identify positive patterns in their spending
   Focus on:
   - Categories where they show consistency
   - Good saving habits
   - Improvements from last month
   - Low-spending categories
   - Smart financial decisions
   - Each item should be 1-2 sentences

4. **Areas for Improvement** (2-3 items): Gently point out opportunities to improve
   Consider:
   - High-spending categories that could be reduced
   - Spontaneous or irregular spending patterns
   - Categories that increased from last month
   - Opportunities to optimize spending
   - Frame as opportunities, not failures
   - Each item should be 1-2 sentences

5. **Recommendations** (3-5 items): Specific, actionable tips tailored to their spending patterns
   - Provide concrete dollar amounts where possible
   - Make suggestions practical and achievable
   - Include both short-term and long-term recommendations
   - Reference specific categories from their spending
   - Each item should be specific and actionable

6. **Category Insights**: For each top category, provide:
   - A short insight (1 sentence)
   - Trend indicator:
     * "up" if spending increased
     * "down" if spending decreased
     * "stable" if relatively consistent

Tone Guidelines:
- Be warm, friendly, and encouraging (NOT judgmental)
- Use conversational language like you're talking to a friend
- Celebrate wins and progress
- Frame improvements as opportunities, not failures
- Add personality and be engaging (this should be fun to read!)
- Avoid financial jargon
- Use emojis sparingly (no more than 1-2 in the entire report)
- Be specific with numbers and examples

Example Output Format:
{
  "personalityType": "Conscious Spender",
  "summary": "You're doing great this month! You've shown impressive consistency with your grocery budget while treating yourself to some well-deserved tech upgrades. Your transport spending has improved significantly—that's progress worth celebrating!",
  "strengths": [
    "Consistent with groceries - sticking to your weekly budget of around $100/week",
    "Excellent rent control - no surprises here, staying right on target",
    "Reduced transport costs by 15% from last month, saving you $45",
    "Smart meal planning is helping you save money on restaurants",
    "Building a healthy emergency fund with your savings rate"
  ],
  "improvements": [
    "Spontaneous with tech purchases - consider setting aside a monthly tech budget of $50 to avoid impulse buys",
    "Restaurant spending spiked to $280 this month - maybe meal prep 2x per week to save about $60/month?",
    "Entertainment subscriptions could be consolidated - review and cancel unused ones to save $30/month"
  ],
  "recommendations": [
    "Set aside $50/month for tech purchases to avoid impulse buys and stay within budget",
    "Try cooking at home 2 extra times per week to save approximately $60/month on restaurants",
    "Consider carpooling or public transit 2-3 days per week to cut transport costs by another $30/month",
    "You're saving ${monthlyStats.savingsRate.toFixed(1)}% - aim for ${(monthlyStats.savingsRate + 2).toFixed(1)}% next month by reducing dining out",
    "Review your subscriptions and cancel unused ones - potential savings of $30-50/month"
  ],
  "categoryInsights": [
    { "category": "Groceries", "insight": "Solid and consistent - you're a meal planning pro!", "trend": "stable" },
    { "category": "Tech", "insight": "A few splurges this month - maybe set a tech budget?", "trend": "up" },
    { "category": "Transport", "insight": "Great improvement from last month!", "trend": "down" },
    { "category": "Restaurants", "insight": "Higher than usual - try meal prepping to save money!", "trend": "up" },
    { "category": "Utilities", "insight": "Consistent and well-managed - no surprises here!", "trend": "stable" }
  ]
}

IMPORTANT: Respond ONLY with valid JSON matching the specified format. Do not include any additional text, explanations, or markdown formatting.`;
};

/**
 * Call OpenAI API to generate report
 * @param {string} prompt - The prompt
 * @param {number} expenseCount - Number of expenses (determines model selection)
 * @returns {Promise<string>} The AI response (JSON string)
 */
const callOpenAI = async (prompt, expenseCount) => {
  try {
    // Use GPT-4 for users with many expenses (>= 50), otherwise GPT-3.5-turbo
    const model = expenseCount >= 50 ? 'gpt-4' : 'gpt-3.5-turbo';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly, empathetic financial advisor. Respond ONLY with valid JSON matching the specified format. Be conversational, encouraging, and specific with your advice.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.8, // Higher temperature for more creative responses
      response_format: { type: 'json_object' },
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate personality report. Please try again later.');
  }
};

/**
 * Test the AI prompt with sample data (for development/testing)
 * @returns {Promise<Object>} Sample report
 */
export const testPersonalityPrompt = async () => {
  const sampleStats = {
    monthlyStats: {
      totalIncome: 4000,
      totalExpenses: 3000,
      netSavings: 1000,
      savingsRate: 25,
    },
    topCategories: [
      { category: 'Rent', amount: 1200, percentage: 40, frequency: 1 },
      { category: 'Groceries', amount: 450, percentage: 15, frequency: 12 },
      { category: 'Transport', amount: 300, percentage: 10, frequency: 8 },
      { category: 'Restaurants', amount: 280, percentage: 9.3, frequency: 14 },
      { category: 'Tech', amount: 250, percentage: 8.3, frequency: 3 },
    ],
  };

  const prompt = buildPersonalityPrompt(sampleStats, null);
  const response = await callOpenAI(prompt, 45);

  return JSON.parse(response);
};

/**
 * Validate OpenAI API key
 * @returns {Promise<boolean>} True if API key is valid
 */
export const validateOpenAIKey = async () => {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('Invalid OpenAI API key:', error);
    return false;
  }
};

/**
 * Get available OpenAI models
 * @returns {Promise<Array>} Array of available models
 */
export const getAvailableModels = async () => {
  try {
    const response = await openai.models.list();
    return response.data.map(model => model.id);
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
};

/**
 * Estimate cost of generating a report
 * @param {number} expenseCount - Number of expenses
 * @returns {number} Estimated cost in USD
 */
export const estimateReportCost = (expenseCount) => {
  // GPT-4: ~$0.03 per report
  // GPT-3.5-turbo: ~$0.002 per report
  return expenseCount >= 50 ? 0.03 : 0.002;
};

/**
 * Generate AI-powered goal recommendations
 * @param {Object} goal - The goal object
 * @param {Array} expenses - User's expense history
 * @returns {Promise<string>} AI-generated recommendations
 */
export const generateGoalRecommendations = async (goal, expenses) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    // Check if recommendations exist and are still valid (< 24 hours old)
    if (goal.aiRecommendations) {
      const expiresAt = goal.aiRecommendations.expiresAt?.toDate();
      if (expiresAt && expiresAt > new Date()) {
        // Cache still valid
        return goal.aiRecommendations.text;
      }
    }

    // Calculate statistics for prompt
    const daysElapsed = Math.ceil((new Date() - goal.createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((goal.targetDate - new Date()) / (1000 * 60 * 60 * 24));
    const amountRemaining = goal.targetAmount - goal.currentAmount;
    const dailySavingsNeeded = amountRemaining / daysRemaining;

    // Calculate average weekly spending by category
    const categorySpending = {};
    expenses.forEach((expense) => {
      if (!categorySpending[expense.category]) {
        categorySpending[expense.category] = 0;
      }
      categorySpending[expense.category] += expense.outAmount || 0;
    });

    const weeklySpending = Object.entries(categorySpending)
      .map(([category, total]) => ({
        category,
        weeklyAverage: (total / daysElapsed) * 7,
      }))
      .sort((a, b) => b.weeklyAverage - a.weeklyAverage)
      .slice(0, 5);

    // Build prompt
    const prompt = `You are a friendly financial advisor helping a user achieve their savings goal.

Goal Details:
- Goal Name: "${goal.name}"
- Target Amount: $${goal.targetAmount}
- Current Progress: $${goal.currentAmount.toFixed(2)} saved (${Math.round((goal.currentAmount / goal.targetAmount) * 100)}%)
- Amount Remaining: $${amountRemaining.toFixed(2)}
- Days Remaining: ${daysRemaining}
- Daily Savings Needed: $${dailySavingsNeeded.toFixed(2)}

Current Spending Patterns (weekly average):
${weeklySpending.map(s => `- ${s.category}: $${s.weeklyAverage.toFixed(2)}/week`).join('\n')}

Task: Provide 2-3 specific, actionable micro-adjustments to help the user reach their goal on time. Focus on small, realistic changes they can make to their spending habits.

Guidelines:
- Be encouraging and positive
- Make recommendations specific and quantified (e.g., "Cut restaurant spending by $5/week")
- Focus on high-spending categories
- Keep recommendations short (1 sentence each)
- Use friendly, conversational tone
- Format as a bulleted list with each recommendation on a new line starting with "•"

Example:
• Try reducing restaurant visits from 3 to 2 times per week to save $15 weekly
• Consider carpooling or taking public transit 2 days per week to cut transport costs by $10
• Shop for groceries with a list to avoid impulse buys and save $8 per trip

Now provide recommendations for this user:`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Cost-effective model
      messages: [
        { role: 'system', content: 'You are a helpful financial advisor.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const recommendations = completion.choices[0].message.content.trim();

    // Save to Firestore cache via goalService
    const { saveAIRecommendations } = require('./goalService');
    await saveAIRecommendations(goal.id, recommendations);

    return recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
};

export default {
  generatePersonalityReport,
  generateGoalRecommendations,
  testPersonalityPrompt,
  validateOpenAIKey,
  getAvailableModels,
  estimateReportCost,
};
