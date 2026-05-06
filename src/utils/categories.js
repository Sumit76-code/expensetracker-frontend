// frontend/src/utils/categories.js

export const CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Dining',
    icon: 'utensils',
    color: '#ff6b35',
    bg: 'rgba(255,107,53,0.1)',
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: 'car',
    color: '#1a6cff',
    bg: 'rgba(26,108,255,0.1)',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'shopping-bag',
    color: '#7c5cbf',
    bg: 'rgba(124,92,191,0.1)',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'clapperboard',
    color: '#00c9a7',
    bg: 'rgba(0,201,167,0.1)',
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: 'zap',
    color: '#f5a623',
    bg: 'rgba(245,166,35,0.1)',
  },
  {
    id: 'health',
    label: 'Health',
    icon: 'heart-pulse',
    color: '#2ed573',
    bg: 'rgba(46,213,115,0.1)',
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'book-open',
    color: '#0097e6',
    bg: 'rgba(0,151,230,0.1)',
  },
  {
    id: 'rent',
    label: 'Rent / Housing',
    icon: 'home',
    color: '#e84393',
    bg: 'rgba(232,67,147,0.1)',
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: 'plane',
    color: '#8c7ae6',
    bg: 'rgba(140,122,230,0.1)',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'package',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
  },
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.label] = cat;
  acc[cat.id] = cat;
  return acc;
}, {});

export const getCategoryConfig = (key) =>
  CATEGORY_MAP[key] || CATEGORIES[CATEGORIES.length - 1];

export const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

export const PAYMENT_MODES = ['UPI', 'Card', 'Cash', 'Net Banking', 'Wallet'];

export const PAYMENT_MODE_ICONS = {
  UPI: 'smartphone',
  Card: 'credit-card',
  Cash: 'banknote',
  'Net Banking': 'landmark',
  Wallet: 'wallet',
};