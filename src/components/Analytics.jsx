// frontend/src/components/Analytics.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getCategoryConfig } from '../utils/categories';
import AppIcon from '../utils/AppIcons';
import api from '../utils/api';
import MiniMonthPicker from './MonthYearPicker';
import './Analytics.css';

const formatShortINR = (value) => {
  const amount = Number(value || 0);
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const getStoredBudget = () => {
  const keys = ['moneyMapMonthlyBudget', 'monthlyBudget', 'budget', 'monthly_budget'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && !Number.isNaN(Number(value))) return Number(value);
  }
  return 0;
};

const isSameMonth = (dateValue, year, month) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === year && date.getMonth() === month;
};

const getMonthLabel = (date) =>
  date.toLocaleDateString('en-IN', { month: 'short' });

const getLastMonths = (count = 6) => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) =>
    new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
  );
};

const getCategoryIcon = (label) => {
  const config = getCategoryConfig(label);
  if (config?.icon) return config.icon;
  const value = String(label || '').toLowerCase();
  if (value.includes('food') || value.includes('dining')) return 'utensils';
  if (value.includes('transport')) return 'car';
  if (value.includes('shopping')) return 'shopping-bag';
  if (value.includes('entertainment')) return 'clapperboard';
  if (value.includes('utilit')) return 'zap';
  if (value.includes('health')) return 'heart-pulse';
  if (value.includes('education')) return 'book-open';
  if (value.includes('rent') || value.includes('housing')) return 'home';
  if (value.includes('travel')) return 'plane';
  return 'package';
};

/* ── Donut Chart ── */
const DonutChart = ({ data, total }) => {
  if (!data.length || total <= 0) {
    return (
      <div className="donut-wrap">
        <div className="smart-tip" style={{ width: '100%' }}>
          <span className="tip-icon">
            <AppIcon name="chart-pie" size={16} strokeWidth={2.2} />
          </span>
          <span>Add expenses to see category-wise chart.</span>
        </div>
      </div>
    );
  }

  const cx = 80; const cy = 80; const r = 55; const ir = 35;
  let angle = -Math.PI / 2;

  const slices = data.map((item) => {
    const sweep = (item.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);   const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep); const y2 = cy + r * Math.sin(angle + sweep);
    const ix1 = cx + ir * Math.cos(angle); const iy1 = cy + ir * Math.sin(angle);
    const ix2 = cx + ir * Math.cos(angle + sweep); const iy2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = sweep === 0 ? '' :
      `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    angle += sweep;
    return { ...item, path };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" width="160" height="160">
        {slices.map((slice) => (
          <path key={slice.label} d={slice.path} fill={slice.color} className="donut-slice" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="donut-center-label">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="donut-center-value">
          {formatShortINR(total)}
        </text>
      </svg>
      <div className="donut-legend">
        {data.map((item) => (
          <div key={item.label} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }} />
            <span className="legend-label">{item.label}</span>
            <span className="legend-pct">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Line Chart ── */
const LineChart = ({ monthlyData, budget }) => {
  const hasData = monthlyData.some((item) => item.spent > 0);
  if (!hasData) {
    return (
      <div className="smart-tip">
        <span className="tip-icon"><AppIcon name="trending-up" size={16} strokeWidth={2.2} /></span>
        <span>Add expenses to see monthly spending trend.</span>
      </div>
    );
  }

  const values = monthlyData.map((item) => item.spent);
  const W = 500; const H = 180; const pX = 44; const pY = 16; const pRight = 52;
  const cW = W - pX - pRight; const cH = H - pY * 2 - 20;
  const max = Math.max(...values, Number(budget || 0), 1) * 1.15;

  // Y-axis tick values
  const yTicks = [0.25, 0.5, 0.75, 1];

  const points = values.map((value, index) => ({
    x: pX + (index / Math.max(values.length - 1, 1)) * cW,
    y: pY + cH - (value / max) * cH,
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${pY + cH} L ${pX} ${pY + cH} Z`;
  const budgetY = budget > 0 ? pY + cH - (budget / max) * cH : null;

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', maxHeight: 200 }}>
        <defs>
          <linearGradient id="analyticsAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a6cff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1a6cff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="analyticsLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a6cff" />
            <stop offset="100%" stopColor="#00c9a7" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yTicks.map((tick) => {
          const y = pY + cH * (1 - tick);
          return (
            <g key={tick}>
              <line x1={pX} y1={y} x2={pX + cW} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <text x={pX - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
                {formatShortINR(max * tick)}
              </text>
            </g>
          );
        })}

        {/* Budget line */}
        {budgetY !== null && (
          <g>
            <line x1={pX} y1={budgetY} x2={pX + cW} y2={budgetY}
              stroke="#f5a623" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.8" />
            <rect x={pX + cW + 4} y={budgetY - 8} width={44} height={14} rx="3"
              fill="rgba(245,166,35,0.12)" />
            <text x={pX + cW + 26} y={budgetY + 3} textAnchor="middle" fontSize="8" fill="#f5a623" fontWeight="600">
              Budget
            </text>
          </g>
        )}

        {/* Area + line */}
        <path d={area} fill="url(#analyticsAreaGrad)" />
        <path d={line} fill="none" stroke="url(#analyticsLineGrad)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={monthlyData[index].label}>
            <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#1a6cff" strokeWidth="2" />
            {/* Value tooltip above point */}
            {values[index] > 0 && (
              <text x={point.x} y={point.y - 9} textAnchor="middle" fontSize="8" fill="#5a6a85" fontWeight="600">
                {formatShortINR(values[index])}
              </text>
            )}
          </g>
        ))}

        {/* X-axis labels */}
        {monthlyData.map((item, index) => (
          <text key={item.label}
            x={pX + (index / Math.max(monthlyData.length - 1, 1)) * cW}
            y={pY + cH + 16} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="500">
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

/* ── Bar Chart ── */
const BarChart = ({ monthlyData, budget }) => {
  const hasData = monthlyData.some((item) => item.spent > 0) || budget > 0;
  if (!hasData) {
    return (
      <div className="smart-tip">
        <span className="tip-icon"><AppIcon name="chart-column" size={16} strokeWidth={2.2} /></span>
        <span>Set a budget and add expenses to compare budget vs spend.</span>
      </div>
    );
  }

  const W = 500; const H = 200; const pX = 44; const pY = 16; const pRight = 16;
  const cW = W - pX - pRight; const cH = H - pY - 36;
  const max = Math.max(...monthlyData.map((item) => item.spent), Number(budget || 0), 1) * 1.15;
  const groupWidth = cW / monthlyData.length;
  const barWidth = Math.min(groupWidth * 0.32, 22);
  const gap = 3;

  return (
    <div className="line-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxHeight: 220 }}>
        <defs>
          <linearGradient id="analyticsBudgetBarG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a6cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1a6cff" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="analyticsSpentBarG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c9a7" />
            <stop offset="100%" stopColor="#008f77" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {[0.25, 0.5, 0.75, 1].map((tick) => {
          const y = pY + cH * (1 - tick);
          return (
            <g key={tick}>
              <line x1={pX} y1={y} x2={pX + cW} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
              <text x={pX - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">
                {formatShortINR(max * tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {monthlyData.map((item, index) => {
          const groupCenterX = pX + index * groupWidth + groupWidth / 2;
          const totalBarW = barWidth * 2 + gap;
          const startX = groupCenterX - totalBarW / 2;
          const budgetHeight = budget > 0 ? (budget / max) * cH : 0;
          const spentHeight = (item.spent / max) * cH;
          return (
            <g key={item.label}>
              {/* Budget bar */}
              <rect x={startX} y={pY + cH - budgetHeight} width={barWidth} height={budgetHeight}
                fill="url(#analyticsBudgetBarG)" rx="3" stroke="#1a6cff" strokeWidth="1" strokeOpacity="0.25" />
              {/* Spent bar */}
              <rect x={startX + barWidth + gap} y={pY + cH - spentHeight} width={barWidth} height={spentHeight}
                fill="url(#analyticsSpentBarG)" rx="3" />
              {/* X label */}
              <text x={groupCenterX} y={pY + cH + 14} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="500">
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Legend — bottom center */}
        <g transform={`translate(${W / 2 - 60}, ${H - 14})`}>
          <rect x={0} y={-7} width={10} height={10} rx="2"
            fill="url(#analyticsBudgetBarG)" stroke="#1a6cff" strokeWidth="1" strokeOpacity="0.4" />
          <text x={14} y={3} fontSize="9" fill="#5a6a85" fontWeight="500">Budget</text>
          <circle cx={72} cy={-2} r="4" fill="#00c9a7" />
          <text x={80} y={3} fontSize="9" fill="#5a6a85" fontWeight="500">Spent</text>
        </g>
      </svg>
    </div>
  );
};

/* ── Main Analytics Component ── */
const Analytics = ({ expenses: expensesFromProps, budget: budgetFromProps, selectedMonth, selectedYear }) => {
  const [activeChart, setActiveChart] = useState('category');
  const [expenses, setExpenses] = useState(Array.isArray(expensesFromProps) ? expensesFromProps : []);
  const [budget, setBudget] = useState(Number(budgetFromProps || 0));
  const [loading, setLoading] = useState(!Array.isArray(expensesFromProps));

  const now = new Date();
  const [localMonth, setLocalMonth] = useState(selectedMonth !== undefined ? selectedMonth : now.getMonth());
  const [localYear,  setLocalYear]  = useState(selectedYear  !== undefined ? selectedYear  : now.getFullYear());

  const filterMonth = localMonth;
  const filterYear  = localYear;

  useEffect(() => {
    if (Array.isArray(expensesFromProps)) {
      setExpenses(expensesFromProps);
      setLoading(false);
      return;
    }

    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const [expensesResult, budgetResult] = await Promise.allSettled([
          api.get('/expenses?limit=500'),
          api.get('/expenses/budget'),
        ]);
        setExpenses(expensesResult.status === 'fulfilled' ? expensesResult.value.data?.expenses || [] : []);
        setBudget(budgetResult.status === 'fulfilled'
          ? Number(budgetResult.value.data?.budget || 0)
          : getStoredBudget());
      } catch (err) {
        console.error('Analytics fetch failed:', err.response?.data || err.message);
        setExpenses([]);
        setBudget(getStoredBudget());
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [expensesFromProps, filterMonth, filterYear]); // re-fetch on month/year change

  useEffect(() => {
    if (budgetFromProps !== undefined && budgetFromProps !== null) {
      setBudget(Number(budgetFromProps || 0));
    }
  }, [budgetFromProps]);

  const analyticsData = useMemo(() => {
    // Category chart: filter by selected month
    const selectedMonthExpenses = expenses.filter((expense) =>
      isSameMonth(expense.date, filterYear, filterMonth)
    );

    const categoryMap = selectedMonthExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      const amount = Number(expense.amount || 0);
      if (!acc[category]) {
        const config = getCategoryConfig(category);
        acc[category] = { label: category, amount: 0, color: config?.color || '#1a6cff', icon: getCategoryIcon(category) };
      }
      acc[category].amount += amount;
      return acc;
    }, {});

    const categoryTotal = Object.values(categoryMap).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const categoryData = Object.values(categoryMap)
      .map((item) => ({ ...item, pct: categoryTotal > 0 ? Math.round((item.amount / categoryTotal) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly trend: always last 6 months (not filtered by picker)
    const months = getLastMonths(6);
    const monthlyData = months.map((monthDate) => ({
      label: getMonthLabel(monthDate),
      spent: expenses
        .filter((expense) => isSameMonth(expense.date, monthDate.getFullYear(), monthDate.getMonth()))
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    }));

    return { selectedMonthExpenses, categoryData, categoryTotal, monthlyData };
  }, [expenses, filterMonth, filterYear]);

  const selectedMonthLabel = new Date(filterYear, filterMonth).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });

  const tabs = [
    { id: 'category', label: 'Category' },
    { id: 'monthly',  label: 'Monthly' },
    { id: 'budget',   label: 'Budget vs Spent' },
  ];

  return (
    <div className="card analytics-card">
      <div className="analytics-header">
        <div>
          <p className="section-title">Analytics</p>
          <p className="section-subtitle">
            {loading ? 'Loading real spending data...' : 'Visual spending breakdown'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniMonthPicker
            selectedMonth={localMonth}
            selectedYear={localYear}
            onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }}
          />
          <div className="chart-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
                onClick={() => setActiveChart(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-area">
        {activeChart === 'category' && (
          <div className="chart-container animate-fade">
            <p className="chart-sub-title">Expense by Category — {selectedMonthLabel}</p>
            <DonutChart data={analyticsData.categoryData} total={analyticsData.categoryTotal} />
          </div>
        )}

        {activeChart === 'monthly' && (
          <div className="chart-container animate-fade">
            <p className="chart-sub-title">Monthly Spending Trend — Last 6 Months</p>
            <LineChart monthlyData={analyticsData.monthlyData} budget={budget} />
          </div>
        )}

        {activeChart === 'budget' && (
          <div className="chart-container animate-fade">
            <p className="chart-sub-title">Budget vs Actual Spend — Last 6 Months</p>
            <BarChart monthlyData={analyticsData.monthlyData} budget={budget} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;