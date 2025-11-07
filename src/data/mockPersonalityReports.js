/**
 * Mock Personality Reports Data
 * For UI development and testing before Firestore integration
 */

export const PERSONALITY_TYPES = [
  'Conscious Spender',
  'Strategic Saver',
  'Balanced Budgeter',
  'Mindful Manager',
  'Frugal Friend',
  'Smart Splurger',
  'Savvy Investor',
  'Prudent Planner',
];

export const MOCK_REPORT_CURRENT = {
  id: 'mock-report-current',
  userId: 'mock-user',
  month: '2025-11',
  generatedAt: new Date('2025-11-01'),
  personalityType: 'Conscious Spender',
  summary: "You're doing great this month! You've shown impressive consistency with your grocery budget while treating yourself to some well-deserved tech upgrades. Your transport spending has improved significantly - that's progress worth celebrating!",
  strengths: [
    'Consistent with groceries - sticking to your weekly budget of around $100/week',
    'Excellent rent control - no surprises here, staying right on target',
    'Reduced transport costs by 15% from last month, saving you $45',
    'Smart meal planning is helping you save money on restaurants',
    'Building a healthy emergency fund with your 25% savings rate',
  ],
  improvements: [
    'Spontaneous with tech purchases - consider setting aside a monthly tech budget of $50 to avoid impulse buys',
    'Restaurant spending spiked to $280 this month - maybe meal prep 2x per week to save about $60/month?',
    'Entertainment subscriptions could be consolidated - review and cancel unused ones to save $30/month',
  ],
  recommendations: [
    'Set aside $50/month for tech purchases to avoid impulse buys and stay within budget',
    'Try cooking at home 2 extra times per week to save approximately $60/month on restaurants',
    'Consider carpooling or public transit 2-3 days per week to cut transport costs by another $30/month',
    "You're saving 25% - aim for 27% next month by reducing dining out",
    'Review your subscriptions and cancel unused ones - potential savings of $30-50/month',
  ],
  categoryInsights: [
    {
      category: 'Groceries',
      insight: 'Solid and consistent - you\'re a meal planning pro!',
      trend: 'stable'
    },
    {
      category: 'Tech',
      insight: 'A few splurges this month - maybe set a tech budget?',
      trend: 'up'
    },
    {
      category: 'Transport',
      insight: 'Great improvement from last month!',
      trend: 'down'
    },
    {
      category: 'Restaurants',
      insight: 'Higher than usual - try meal prepping to save money!',
      trend: 'up'
    },
    {
      category: 'Utilities',
      insight: 'Consistent and well-managed - no surprises here!',
      trend: 'stable'
    },
  ],
  topCategories: [
    { category: 'Rent', amount: 1200, percentage: 40, frequency: 1 },
    { category: 'Groceries', amount: 450, percentage: 15, frequency: 12 },
    { category: 'Transport', amount: 300, percentage: 10, frequency: 8 },
    { category: 'Restaurants', amount: 280, percentage: 9.3, frequency: 14 },
    { category: 'Tech', amount: 250, percentage: 8.3, frequency: 3 },
  ],
  monthlyStats: {
    totalIncome: 4000,
    totalExpenses: 3000,
    netSavings: 1000,
    savingsRate: 25,
  },
};

export const MOCK_REPORT_HISTORY = [
  {
    id: 'mock-report-1',
    month: '2025-11',
    generatedAt: new Date('2025-11-01'),
    personalityType: 'Conscious Spender',
    savingsRate: 25,
    totalExpenses: 3000,
  },
  {
    id: 'mock-report-2',
    month: '2025-10',
    generatedAt: new Date('2025-10-01'),
    personalityType: 'Strategic Saver',
    savingsRate: 28,
    totalExpenses: 2800,
  },
  {
    id: 'mock-report-3',
    month: '2025-09',
    generatedAt: new Date('2025-09-01'),
    personalityType: 'Balanced Budgeter',
    savingsRate: 22,
    totalExpenses: 3200,
  },
  {
    id: 'mock-report-4',
    month: '2025-08',
    generatedAt: new Date('2025-08-01'),
    personalityType: 'Mindful Manager',
    savingsRate: 20,
    totalExpenses: 3300,
  },
  {
    id: 'mock-report-5',
    month: '2025-07',
    generatedAt: new Date('2025-07-01'),
    personalityType: 'Frugal Friend',
    savingsRate: 30,
    totalExpenses: 2700,
  },
  {
    id: 'mock-report-6',
    month: '2025-06',
    generatedAt: new Date('2025-06-01'),
    personalityType: 'Smart Splurger',
    savingsRate: 18,
    totalExpenses: 3400,
  },
];

export const MOCK_INSIGHTS_TEMPLATES = {
  groceries: {
    stable: [
      'Solid and consistent - you\'re a meal planning pro!',
      'Great routine - your grocery budget is rock solid!',
      'Maintaining excellent consistency with food shopping!',
    ],
    up: [
      'Grocery spending increased this month - maybe bulk buying?',
      'A bit higher on groceries - check for unnecessary extras!',
    ],
    down: [
      'Nice reduction in grocery spending - meal planning paying off!',
      'Excellent job cutting grocery costs this month!',
    ],
  },
  transport: {
    stable: [
      'Consistent transport costs - you have a good routine!',
      'Transportation expenses are predictable and stable!',
    ],
    up: [
      'Transport costs increased - consider carpooling to save!',
      'Higher transport spending - time to explore transit options?',
    ],
    down: [
      'Great improvement on transport costs!',
      'Nice work reducing transportation expenses!',
    ],
  },
  restaurants: {
    stable: [
      'Balanced dining out habits - treating yourself mindfully!',
      'Restaurant spending is consistent - you know your limit!',
    ],
    up: [
      'Restaurant spending spiked - try meal prepping!',
      'Dining out more this month - consider cooking at home!',
    ],
    down: [
      'Nice work cutting restaurant costs!',
      'Great job reducing dining out expenses!',
    ],
  },
};

export const generateMockReport = (month) => {
  const randomType = PERSONALITY_TYPES[Math.floor(Math.random() * PERSONALITY_TYPES.length)];
  const randomSavingsRate = 15 + Math.random() * 20; // 15-35%
  const randomExpenses = 2500 + Math.random() * 1500; // $2500-$4000

  return {
    id: `mock-report-${month}`,
    month,
    generatedAt: new Date(month),
    personalityType: randomType,
    savingsRate: parseFloat(randomSavingsRate.toFixed(1)),
    totalExpenses: parseFloat(randomExpenses.toFixed(0)),
  };
};

export default {
  PERSONALITY_TYPES,
  MOCK_REPORT_CURRENT,
  MOCK_REPORT_HISTORY,
  MOCK_INSIGHTS_TEMPLATES,
  generateMockReport,
};
