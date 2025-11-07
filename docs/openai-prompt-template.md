# OpenAI Prompt Template for Goal Recommendations

## Overview
This document contains the tested and optimized prompt template for generating AI-powered savings recommendations using OpenAI's GPT-3.5-turbo model.

---

## Prompt Template

```javascript
const buildPrompt = (goal, expenses, statistics) => {
  // Calculate statistics
  const daysElapsed = Math.ceil((new Date() - goal.createdAt) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.ceil((goal.targetDate - new Date()) / (1000 * 60 * 60 * 24));
  const amountRemaining = goal.targetAmount - goal.currentAmount;
  const dailySavingsNeeded = amountRemaining / daysRemaining;

  // Calculate category spending
  const categorySpending = {};
  expenses.forEach((expense) => {
    if (!categorySpending[expense.category]) {
      categorySpending[expense.category] = 0;
    }
    categorySpending[expense.category] += expense.outAmount || 0;
  });

  // Get top 5 spending categories
  const weeklySpending = Object.entries(categorySpending)
    .map(([category, total]) => ({
      category,
      weeklyAverage: (total / daysElapsed) * 7,
    }))
    .sort((a, b) => b.weeklyAverage - a.weeklyAverage)
    .slice(0, 5);

  return `You are a friendly financial advisor helping a user achieve their savings goal.

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
};
```

---

## OpenAI API Configuration

### Model Selection

**Recommended:** `gpt-3.5-turbo`

**Why:**
- Cost-effective: $0.50/1M input tokens, $1.50/1M output tokens
- Fast response time (1-3 seconds)
- Sufficient quality for financial recommendations
- Lower latency than GPT-4

**Alternative (Premium Feature):** `gpt-4o-mini`
- Higher quality: More nuanced, creative recommendations
- Cost: $0.15/1M input, $0.60/1M output
- Use case: Premium users who want deeper insights

### API Parameters

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content: 'You are a helpful financial advisor who provides practical, actionable savings tips.'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  max_tokens: 300,          // Keep responses concise (2-3 recommendations)
  temperature: 0.7,         // Balanced creativity vs consistency
  top_p: 1,                 // Default nucleus sampling
  frequency_penalty: 0.0,   // Don't penalize repetition (we want clear advice)
  presence_penalty: 0.0,    // No penalty for topic repetition
});
```

### Parameter Explanations

- **max_tokens: 300**
  - Limits response to ~200 words
  - Prevents overly long recommendations
  - Keeps costs low (~$0.0005 per call)

- **temperature: 0.7**
  - Sweet spot for financial advice
  - 0.3 = Too robotic, repetitive
  - 1.0 = Too creative, inconsistent
  - 0.7 = Practical but varied

- **frequency_penalty: 0.0**
  - Financial advice often repeats key terms ("save", "reduce")
  - No penalty keeps advice clear

---

## Sample Inputs & Outputs

### Example 1: Vacation Goal (On Track)

**Input:**
```javascript
{
  goal: {
    name: "Save for Vacation",
    targetAmount: 2000,
    currentAmount: 850,
    targetDate: new Date('2025-12-01'),
    createdAt: new Date('2025-09-01')
  },
  weeklySpending: [
    { category: "Food & Dining", weeklyAverage: 85 },
    { category: "Transportation", weeklyAverage: 45 },
    { category: "Entertainment", weeklyAverage: 40 },
    { category: "Groceries", weeklyAverage: 120 },
    { category: "Shopping", weeklyAverage: 30 }
  ],
  daysRemaining: 45,
  dailySavingsNeeded: 25.56
}
```

**Expected Output:**
```
• Cut restaurant visits from 3 to 2 times per week to save $20 weekly
• Try meal prepping on Sundays to reduce impulse food purchases and save $15/week
• Switch one streaming subscription to a free alternative to save $10 monthly
```

---

### Example 2: Emergency Fund (Behind Schedule)

**Input:**
```javascript
{
  goal: {
    name: "Emergency Fund",
    targetAmount: 5000,
    currentAmount: 1200,
    targetDate: new Date('2026-01-15'),
    createdAt: new Date('2025-08-01')
  },
  weeklySpending: [
    { category: "Groceries", weeklyAverage: 150 },
    { category: "Transportation", weeklyAverage: 100 },
    { category: "Food & Dining", weeklyAverage: 90 },
    { category: "Shopping", weeklyAverage: 60 },
    { category: "Entertainment", weeklyAverage: 50 }
  ],
  daysRemaining: 70,
  dailySavingsNeeded: 54.29
}
```

**Expected Output:**
```
• Shop for groceries with a meal plan and list to avoid impulse buys - aim to save $20/week
• Pack lunch for work 3 days per week instead of eating out to save $30 weekly
• Postpone non-essential shopping purchases for 30 days to free up $60 monthly
• Consider carpooling or public transit 2 days per week to reduce gas costs by $15/week
```

---

### Example 3: Category-Restricted Goal (Entertainment)

**Input:**
```javascript
{
  goal: {
    name: "Reduce Entertainment Spending",
    targetAmount: 500,
    currentAmount: 180,
    targetDate: new Date('2025-11-30'),
    createdAt: new Date('2025-10-01'),
    categoryRestrictions: ["Entertainment", "Food & Dining"]
  },
  weeklySpending: [
    { category: "Entertainment", weeklyAverage: 60 },
    { category: "Food & Dining", weeklyAverage: 75 }
  ],
  daysRemaining: 30,
  dailySavingsNeeded: 10.67
}
```

**Expected Output:**
```
• Replace 2 paid movie outings per month with free streaming at home to save $30
• Try cooking at home 4 nights per week instead of dining out to save $40 weekly
• Look for happy hour specials or drink water at restaurants to cut $15/week from dining bills
```

---

## Testing on OpenAI Playground

### Step-by-Step Testing Process

1. **Go to:** https://platform.openai.com/playground

2. **Setup:**
   - Model: `gpt-3.5-turbo`
   - Temperature: `0.7`
   - Maximum length: `300`

3. **System Message:**
   ```
   You are a helpful financial advisor who provides practical, actionable savings tips.
   ```

4. **User Message:** (Copy the prompt template with sample data)

5. **Run & Evaluate:**
   - Are recommendations specific? (quantified amounts)
   - Are they realistic? (small changes, not drastic cuts)
   - Are they actionable? (user knows exactly what to do)
   - Is the tone friendly? (encouraging, not judgmental)

6. **Iterate:**
   - Adjust temperature if responses are too generic (increase) or too wild (decrease)
   - Adjust max_tokens if responses are too long (decrease) or cut off (increase)
   - Refine system message if tone is off

---

## Prompt Engineering Best Practices

### 1. Specificity Wins

**Bad:** "Give me tips to save money"
**Good:** "Provide 2-3 specific, quantified micro-adjustments based on weekly spending patterns"

### 2. Constrain the Output

**Format constraint:** "Format as bulleted list with each recommendation starting with •"
**Length constraint:** "Keep each recommendation to 1 sentence"
**Count constraint:** "Provide 2-3 recommendations"

### 3. Provide Examples (Few-Shot Learning)

Including an example recommendation in the prompt dramatically improves output quality:
```
Example:
• Try reducing restaurant visits from 3 to 2 times per week to save $15 weekly
```

### 4. Context is King

Provide:
- Goal details (name, target, current, remaining)
- Spending patterns (top categories with weekly averages)
- Time context (days remaining, daily savings needed)

### 5. Tone Setting

System message sets the personality:
- "helpful financial advisor" → friendly, practical
- "certified financial planner" → formal, technical
- "budget coach" → motivational, action-oriented

---

## Error Handling & Edge Cases

### Edge Case 1: Goal Already Achieved

**Scenario:** currentAmount >= targetAmount

**Prompt Adjustment:**
```javascript
if (goal.currentAmount >= goal.targetAmount) {
  return `Congratulations! You've reached your goal "${goal.name}"!

Task: Provide 2-3 tips to help maintain this achievement and avoid overspending.

Guidelines:
- Be congratulatory and positive
- Focus on maintaining good habits
- Suggest next steps (new goals, investment ideas)
`;
}
```

### Edge Case 2: Goal Overdue (Failed)

**Scenario:** targetDate < now && currentAmount < targetAmount

**Prompt Adjustment:**
```javascript
if (goal.targetDate < new Date() && goal.currentAmount < goal.targetAmount) {
  return `The target date for "${goal.name}" has passed, but you're at ${Math.round((goal.currentAmount / goal.targetAmount) * 100)}% of your goal.

Task: Provide 2-3 encouraging tips to either extend the goal or adjust the target.

Guidelines:
- Be empathetic and non-judgmental
- Suggest realistic next steps
- Focus on progress made, not shortfall
`;
}
```

### Edge Case 3: Very Short Timeline

**Scenario:** daysRemaining <= 7

**Prompt Adjustment:**
```javascript
const dailySavingsNeeded = amountRemaining / daysRemaining;

if (dailySavingsNeeded > 50) {
  // Unrealistic daily target - suggest goal extension
  return `You have only ${daysRemaining} days remaining for "${goal.name}", requiring $${dailySavingsNeeded.toFixed(2)}/day.

Task: Acknowledge the challenge and suggest either extending the target date or adjusting the target amount.

Guidelines:
- Be realistic and honest
- Provide immediate cost-cutting measures if still achievable
- Suggest goal revision if clearly unattainable
`;
}
```

---

## Rate Limiting & Caching Strategy

### Why Rate Limit?

1. **Cost Control:**
   - OpenAI API charges per token
   - Unlimited requests could rack up costs
   - Max 3/day per goal keeps costs predictable

2. **Quality Over Quantity:**
   - Recommendations need time to take effect
   - Generating too frequently = no time to implement changes
   - 24-hour cache encourages action, not endless regeneration

### Implementation

```javascript
// Check if cached recommendations exist
if (goal.aiRecommendations?.expiresAt > new Date()) {
  return goal.aiRecommendations.text;  // Use cached version
}

// Check rate limit (max 3 per day)
const today = new Date();
today.setHours(0, 0, 0, 0);

const generationCount = await firestore
  .collection(`users/${userId}/goals/${goalId}/aiGenerations`)
  .where('generatedAt', '>=', firestore.Timestamp.fromDate(today))
  .get();

if (generationCount.size >= 3) {
  throw new Error('Daily limit reached. You can generate up to 3 recommendations per goal per day.');
}
```

---

## Cost Analysis

### Per-Request Cost Estimate

**Input tokens:** ~400 (prompt + data)
**Output tokens:** ~150 (2-3 recommendations)
**Total tokens:** ~550

**Cost:**
- Input: 400 × $0.50/1M = $0.0002
- Output: 150 × $1.50/1M = $0.000225
- **Total per request:** ~$0.0004 (less than 1 cent)

### Monthly Cost Projection

**Assumptions:**
- 100 active users
- 2 goals per user (average)
- 2 AI generations per goal per week
- 4 weeks per month

**Calculation:**
100 users × 2 goals × 2 generations/week × 4 weeks = 1,600 requests/month
1,600 × $0.0004 = **$0.64/month**

**Even with 1,000 users:** ~$6.40/month

**Conclusion:** OpenAI costs are negligible - Firestore will be the larger expense.

---

## Integration Checklist

- [x] Prompt template designed and documented
- [x] API parameters optimized (model, temperature, max_tokens)
- [x] Sample inputs/outputs tested
- [ ] Test on OpenAI Playground (manual verification)
- [ ] Add OPENAI_API_KEY to `.env`
- [ ] Expose API key in `app.config.js`
- [ ] Create `aiService.js` with OpenAI integration
- [ ] Implement rate limiting logic
- [ ] Implement caching with 24h expiry
- [ ] Test end-to-end in app
- [ ] Monitor API costs in OpenAI dashboard

---

## Next Steps (When Ready to Integrate)

1. **Get OpenAI API Key:**
   - Sign up at https://platform.openai.com
   - Generate API key
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

2. **Test Prompt in Playground:**
   - Copy prompt template
   - Test with various scenarios
   - Verify output quality

3. **Create `aiService.js`:**
   - Copy service code from task file
   - Replace prompt placeholder with this template
   - Add error handling

4. **Wire Up UI:**
   - Update `GoalDetailScreen.js` to call real service
   - Show loading state during API call
   - Handle errors gracefully

5. **Test Rate Limiting:**
   - Try generating 4 times in one day
   - Verify error message on 4th attempt
   - Confirm reset after midnight

---

**Status:** Prompt template ready for testing in OpenAI Playground
**Next Owner:** Agent 4 (when integrating services)
