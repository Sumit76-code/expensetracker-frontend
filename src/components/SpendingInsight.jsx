import React, { useEffect, useMemo, useState } from 'react';
import './Analytics.css';
import './SpendingInsight.css';
import AppIcon from '../utils/AppIcons';
import api from '../utils/api';
import MiniMonthPicker from './MonthYearPicker';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const NOW = new Date();

const getHighestSpendDay = (expenses) => {
  const daily = expenses.reduce((acc, e) => {
    if (!e.date) return acc;
    const d = new Date(e.date);
    if (isNaN(d.getTime())) return acc;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    acc[key] = (acc[key] || 0) + Number(e.amount || 0);
    return acc;
  }, {});
  const highest = Object.entries(daily).sort((a, b) => b[1] - a[1])[0];
  if (!highest) return { amount: 0, label: 'No data' };
  const [y, m, day] = highest[0].split('-').map(Number);
  return { amount: highest[1], label: new Date(y, m-1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
};

const SpendingInsight = ({ expenses: expensesFromProps, budget: budgetFromProps, selectedMonth, selectedYear, activeSection }) => {
  const [expenses, setExpenses] = useState(Array.isArray(expensesFromProps) ? expensesFromProps : []);
  const [budget, setBudget]     = useState(Number(budgetFromProps || 0));
  const [loading, setLoading]   = useState(!Array.isArray(expensesFromProps));
  const [activeKey, setActiveKey] = useState(activeSection || null);

  const [localMonth, setLocalMonth] = useState(selectedMonth ?? NOW.getMonth());
  const [localYear,  setLocalYear]  = useState(selectedYear  ?? NOW.getFullYear());

  // Sync props
  useEffect(() => {
    if (selectedMonth != null) setLocalMonth(selectedMonth);
    if (selectedYear  != null) setLocalYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  // Sync activeSection from sidebar
  useEffect(() => {
    if (activeSection) setActiveKey(activeSection);
  }, [activeSection]);

  useEffect(() => {
    if (Array.isArray(expensesFromProps)) {
      setExpenses(expensesFromProps);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      const startDate = new Date(localYear, localMonth, 1).toISOString();
      const endDate   = new Date(localYear, localMonth + 1, 0, 23, 59, 59).toISOString();
      const [expRes, budRes] = await Promise.allSettled([
        api.get(`/expenses?limit=1000&startDate=${startDate}&endDate=${endDate}`),
        api.get('/expenses/budget'),
      ]);
      if (!cancelled) {
        setExpenses(expRes.status === 'fulfilled' ? expRes.value.data?.expenses || [] : []);
        setBudget(budRes.status === 'fulfilled' ? Number(budRes.value.data?.budget || 0) : 0);
        setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [expensesFromProps, localMonth, localYear]);

  useEffect(() => {
    if (budgetFromProps !== undefined) setBudget(Number(budgetFromProps || 0));
  }, [budgetFromProps]);

  const { insights, monthLabel } = useMemo(() => {
    const label = new Date(localYear, localMonth, 1)
      .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const filtered = expenses.filter(e => {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d.getFullYear() === localYear && d.getMonth() === localMonth;
    });

    const isCurrentMonth = localMonth === NOW.getMonth() && localYear === NOW.getFullYear();
    const daysInMonth    = new Date(localYear, localMonth + 1, 0).getDate();
    const daysElapsed    = isCurrentMonth ? NOW.getDate() : daysInMonth;

    const totalSpent = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
    const dailyAvg   = daysElapsed > 0 ? Math.round(totalSpent / daysElapsed) : 0;
    const predicted  = dailyAvg * daysInMonth;
    const remaining  = budget > 0 ? budget - totalSpent : 0;
    const highestDay = getHighestSpendDay(filtered);

    return {
      monthLabel: label,
      insights: [
        {
          key: 'daily-avg',
          label: 'Daily Average',
          value: filtered.length ? formatINR(dailyAvg) : '₹0',
          sub: filtered.length ? `Based on ${label}` : 'No expenses yet',
          icon: 'calendar', color: '#9b8cff',
        },
        {
          key: 'predicted',
          label: 'Predicted Monthly',
          value: filtered.length ? formatINR(predicted) : '₹0',
          sub: filtered.length ? 'Based on current pace' : 'Need data',
          icon: 'sparkles', color: '#1a6cff', ai: true,
        },
        {
          key: 'remaining',
          label: 'Remaining Budget',
          value: budget > 0 ? formatINR(remaining) : 'Not set',
          sub: budget > 0 ? `${label} budget` : 'Set monthly budget',
          icon: 'wallet', color: '#00c9a7',
        },
        {
          key: 'highest',
          label: 'Highest Spend Day',
          value: highestDay.amount > 0 ? formatINR(highestDay.amount) : '₹0',
          sub: highestDay.label,
          icon: 'trending-up', color: '#ff6b35',
        },
      ],
    };
  }, [expenses, budget, localMonth, localYear]);

  return (
    <div className="card spending-insight-card">
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div>
          <p className="section-title">Spending Insight</p>
          <p className="section-subtitle">{loading ? 'Loading metrics...' : `${monthLabel} — Key metrics`}</p>
        </div>
        <MiniMonthPicker
          selectedMonth={localMonth}
          selectedYear={localYear}
          onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }}
        />
      </div>

      {/* ── 4 cards grid ── */}
      <div className="spending-grid">
        {insights.map((ins) => (
          <div
            key={ins.key}
            className={`spending-item spending-item-clickable ${activeKey === ins.key ? 'spending-item-active' : ''}`}
            style={{ '--ins-color': ins.color }}
            onClick={() => setActiveKey(prev => prev === ins.key ? null : ins.key)}
          >
            <div className="spending-item-icon">
              <AppIcon name={ins.icon} size={18} color={ins.color} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="spending-item-label">{ins.label}</p>
              <p className="spending-item-value" style={{ color: ins.color }}>{loading ? '...' : ins.value}</p>
              <p className="spending-item-sub">{loading ? 'Fetching data' : ins.sub}</p>
            </div>
            {ins.ai && <span className="spending-ai-badge">AI</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpendingInsight;