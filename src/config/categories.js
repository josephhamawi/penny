export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Gas/Fuel',
  'Housing/Rent',
  'Utilities',
  'Shopping',
  'Clothing',
  'Electronics',
  'Entertainment',
  'Healthcare',
  'Pharmacy',
  'Personal Care',
  'Education',
  'Travel',
  'Gifts & Donations',
  'Bills & Subscriptions',
  'Insurance',
  'Pets',
  'Kids/Children',
  'Business Expenses',
  'Investment',
  'Salary/Income',
  'Freelance',
  'Other'
];

export const CATEGORY_CONFIG = {
  'Food & Dining': {
    icon: 'utensils',
    color: '#FF6B6B',
    bgColor: '#FFE5E5',
  },
  'Groceries': {
    icon: 'shopping-cart',
    color: '#4ECDC4',
    bgColor: '#E0F7F6',
  },
  'Transportation': {
    icon: 'car',
    color: '#95E1D3',
    bgColor: '#E8F8F5',
  },
  'Gas/Fuel': {
    icon: 'gas-pump',
    color: '#F38181',
    bgColor: '#FCE8E8',
  },
  'Housing/Rent': {
    icon: 'home',
    color: '#AA96DA',
    bgColor: '#F0EBF8',
  },
  'Utilities': {
    icon: 'bolt',
    color: '#FCBAD3',
    bgColor: '#FEF0F5',
  },
  'Shopping': {
    icon: 'shopping-bag',
    color: '#FFFFD2',
    bgColor: '#FFFFEB',
  },
  'Clothing': {
    icon: 'tshirt',
    color: '#A8D8EA',
    bgColor: '#EAF6F9',
  },
  'Electronics': {
    icon: 'laptop',
    color: '#AA96DA',
    bgColor: '#F0EBF8',
  },
  'Entertainment': {
    icon: 'film',
    color: '#FFCF96',
    bgColor: '#FFF2E0',
  },
  'Healthcare': {
    icon: 'hospital',
    color: '#FF8AAE',
    bgColor: '#FFE9F0',
  },
  'Pharmacy': {
    icon: 'pills',
    color: '#A8E6CF',
    bgColor: '#E9F8F0',
  },
  'Personal Care': {
    icon: 'spa',
    color: '#FFD3B6',
    bgColor: '#FFF3E9',
  },
  'Education': {
    icon: 'graduation-cap',
    color: '#6C63FF',
    bgColor: '#E6E4FF',
  },
  'Travel': {
    icon: 'plane',
    color: '#4A90E2',
    bgColor: '#E3EFF7',
  },
  'Gifts & Donations': {
    icon: 'gift',
    color: '#E05297',
    bgColor: '#F9E0EB',
  },
  'Bills & Subscriptions': {
    icon: 'receipt',
    color: '#50C878',
    bgColor: '#E5F5EC',
  },
  'Insurance': {
    icon: 'shield-alt',
    color: '#3498DB',
    bgColor: '#E1EEF6',
  },
  'Pets': {
    icon: 'paw',
    color: '#F4A460',
    bgColor: '#FBF0E6',
  },
  'Kids/Children': {
    icon: 'baby',
    color: '#FF69B4',
    bgColor: '#FFE9F3',
  },
  'Business Expenses': {
    icon: 'briefcase',
    color: '#708090',
    bgColor: '#ECEEF0',
  },
  'Investment': {
    icon: 'chart-line',
    color: '#32CD32',
    bgColor: '#E6F9E6',
  },
  'Salary/Income': {
    icon: 'dollar-sign',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
  },
  'Freelance': {
    icon: 'briefcase',
    color: '#9C27B0',
    bgColor: '#F3E5F5',
  },
  'Other': {
    icon: 'ellipsis-h',
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
  },
};

export const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];
};
