// frontend/src/utils/AppIcons.jsx
import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Clapperboard,
  Zap,
  HeartPulse,
  BookOpen,
  Home,
  Plane,
  Package,

  Smartphone,
  CreditCard,
  Banknote,
  Landmark,
  Wallet,

  Inbox,
  Search,
  Lightbulb,
  Hand,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  X,
  Sparkles,
  Bell,
  User,
  LogOut,
  Settings,
  Eye,
  UserRoundPen,
  UserRoundX,
  ChartColumn,
  ChartPie,
  WalletCards,
  TrendingUp,
  IndianRupee,
  BadgeInfo,
  CircleCheck,
  TriangleAlert,
  RefreshCw,
  Rocket,
  Menu,
  ChevronLeft,
  ChevronRight,
  Palette,
  ShieldCheck,
  ClipboardList,
  Flame,
  Sun,
Moon,
} from 'lucide-react';

const ICONS = {
  // Expense categories
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  clapperboard: Clapperboard,
  zap: Zap,
  'heart-pulse': HeartPulse,
  'book-open': BookOpen,
  home: Home,
  plane: Plane,
  package: Package,

  // Payment modes
  smartphone: Smartphone,
  'credit-card': CreditCard,
  banknote: Banknote,
  landmark: Landmark,
  wallet: Wallet,

  // Common UI
  inbox: Inbox,
  search: Search,
  lightbulb: Lightbulb,
  hand: Hand,
  plus: Plus,
  pencil: Pencil,
  trash: Trash2,
  calendar: CalendarDays,
  x: X,
  sparkles: Sparkles,
  bell: Bell,
  user: User,
  logout: LogOut,
  settings: Settings,
  eye: Eye,
  'user-pen': UserRoundPen,
  'user-x': UserRoundX,
  'chart-column': ChartColumn,
  'chart-pie': ChartPie,
  'wallet-cards': WalletCards,
  'trending-up': TrendingUp,
  rupee: IndianRupee,
  info: BadgeInfo,
  success: CircleCheck,
  warning: TriangleAlert,
  refresh: RefreshCw,
  rocket: Rocket,
  menu: Menu,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  palette: Palette,
  shield: ShieldCheck,
  clipboard: ClipboardList,
  flame: Flame,
  sun: Sun,
  moon: Moon,
};

const AppIcon = ({
  name,
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}) => {
  const Icon = ICONS[name] || BadgeInfo;

  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
};

export default AppIcon;