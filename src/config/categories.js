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
    color: '#FF6B9D',
    bgColor: 'rgba(255, 107, 157, 0.15)',
  },
  'Groceries': {
    icon: 'shopping-cart',
    color: '#00FFA3',
    bgColor: 'rgba(0, 255, 163, 0.15)',
  },
  'Transportation': {
    icon: 'car',
    color: '#00D9FF',
    bgColor: 'rgba(0, 217, 255, 0.15)',
  },
  'Gas/Fuel': {
    icon: 'gas-pump',
    color: '#FF6B6B',
    bgColor: 'rgba(255, 107, 107, 0.15)',
  },
  'Housing/Rent': {
    icon: 'home',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
  'Utilities': {
    icon: 'bolt',
    color: '#FFB84D',
    bgColor: 'rgba(255, 184, 77, 0.15)',
  },
  'Shopping': {
    icon: 'shopping-bag',
    color: '#FFD93D',
    bgColor: 'rgba(255, 217, 61, 0.15)',
  },
  'Clothing': {
    icon: 'tshirt',
    color: '#6DD5FA',
    bgColor: 'rgba(109, 213, 250, 0.15)',
  },
  'Electronics': {
    icon: 'laptop',
    color: '#00D9FF',
    bgColor: 'rgba(0, 217, 255, 0.15)',
  },
  'Entertainment': {
    icon: 'film',
    color: '#FF6B9D',
    bgColor: 'rgba(255, 107, 157, 0.15)',
  },
  'Healthcare': {
    icon: 'hospital',
    color: '#FF4D7D',
    bgColor: 'rgba(255, 77, 125, 0.15)',
  },
  'Pharmacy': {
    icon: 'pills',
    color: '#00FFA3',
    bgColor: 'rgba(0, 255, 163, 0.15)',
  },
  'Personal Care': {
    icon: 'spa',
    color: '#FFB8D8',
    bgColor: 'rgba(255, 184, 216, 0.15)',
  },
  'Education': {
    icon: 'graduation-cap',
    color: '#00D9FF',
    bgColor: 'rgba(0, 217, 255, 0.15)',
  },
  'Travel': {
    icon: 'plane',
    color: '#6DD5FA',
    bgColor: 'rgba(109, 213, 250, 0.15)',
  },
  'Gifts & Donations': {
    icon: 'gift',
    color: '#FF6B9D',
    bgColor: 'rgba(255, 107, 157, 0.15)',
  },
  'Bills & Subscriptions': {
    icon: 'receipt',
    color: '#00FFA3',
    bgColor: 'rgba(0, 255, 163, 0.15)',
  },
  'Insurance': {
    icon: 'shield-alt',
    color: '#00B8D4',
    bgColor: 'rgba(0, 184, 212, 0.15)',
  },
  'Pets': {
    icon: 'paw',
    color: '#FFB84D',
    bgColor: 'rgba(255, 184, 77, 0.15)',
  },
  'Kids/Children': {
    icon: 'baby',
    color: '#FF8AAE',
    bgColor: 'rgba(255, 138, 174, 0.15)',
  },
  'Business Expenses': {
    icon: 'briefcase',
    color: '#8899A6',
    bgColor: 'rgba(136, 153, 166, 0.15)',
  },
  'Investment': {
    icon: 'chart-line',
    color: '#00FFA3',
    bgColor: 'rgba(0, 255, 163, 0.15)',
  },
  'Salary/Income': {
    icon: 'dollar-sign',
    color: '#00FFA3',
    bgColor: 'rgba(0, 255, 163, 0.15)',
  },
  'Freelance': {
    icon: 'briefcase',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
  'Other': {
    icon: 'ellipsis-h',
    color: '#8899A6',
    bgColor: 'rgba(136, 153, 166, 0.15)',
  },
};

export const getCategoryConfig = (category) => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];
};
