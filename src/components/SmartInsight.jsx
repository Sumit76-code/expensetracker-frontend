import React, { useEffect, useMemo, useState } from 'react';
import { getCategoryConfig } from '../utils/categories';
import api from '../utils/api';
import AppIcon from '../utils/AppIcons';
import MiniMonthPicker from './MonthYearPicker';
import './SmartInsight.css';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const getIconName = (categoryLabel) => {
  const conf = getCategoryConfig(categoryLabel);
  if (conf?.icon) return conf.icon;
  const label = String(categoryLabel || '').toLowerCase();
  if (label.includes('food') || label.includes('dining')) return 'utensils';
  if (label.includes('transport')) return 'car';
  if (label.includes('shopping')) return 'shopping-bag';
  if (label.includes('entertainment')) return 'clapperboard';
  if (label.includes('utilit')) return 'zap';
  if (label.includes('health')) return 'heart-pulse';
  if (label.includes('education')) return 'book-open';
  if (label.includes('rent') || label.includes('housing')) return 'home';
  if (label.includes('travel')) return 'plane';
  return 'package';
};

const SmartInsight = ({ expenses: expensesFromProps, selectedMonth, selectedYear }) => {
  const [expenses, setExpenses] = useState(Array.isArray(expensesFromProps) ? expensesFromProps : []);
  const [loading, setLoading]   = useState(!Array.isArray(expensesFromProps));

  const now          = new Date();
  const [localMonth, setLocalMonth] = useState(selectedMonth ?? now.getMonth());
  const [localYear,  setLocalYear]  = useState(selectedYear  ?? now.getFullYear());

  const targetMonth  = localMonth;
  const targetYear   = localYear;

  useEffect(() => {
    if (Array.isArray(expensesFromProps)) { setExpenses(expensesFromProps); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const startDate = new Date(targetYear, targetMonth, 1).toISOString();
        const endDate   = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString();
        const res = await api.get(`/expenses?limit=500&startDate=${startDate}&endDate=${endDate}`);
        setExpenses(res.data?.expenses || []);
      } catch (err) { console.error(err); setExpenses([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [expensesFromProps, targetMonth, targetYear]);

  const { categorySpend, monthLabel } = useMemo(() => {
    const label = new Date(targetYear, targetMonth, 1)
      .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Filter expenses for selected month
    const filtered = expenses.filter(e => {
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const categoryMap = filtered.reduce((acc, e) => {
      const cat = e.category || 'Other';
      if (!acc[cat]) acc[cat] = { label: cat, amount: 0 };
      acc[cat].amount += Number(e.amount || 0);
      return acc;
    }, {});

    const total = Object.values(categoryMap).reduce((s, i) => s + i.amount, 0);
    const spend = Object.values(categoryMap)
      .map(i => ({ ...i, pct: total > 0 ? Math.round((i.amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { categorySpend: spend, monthLabel: label };
  }, [expenses, targetMonth, targetYear]);

  if (loading) return (
    <div className="card smart-insight-card">
      <div className="card-header">
        <div><p className="section-title">Smart Insight</p><p className="section-subtitle">Loading...</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniMonthPicker selectedMonth={localMonth} selectedYear={localYear} onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }} />
          <span className="ai-chip"><AppIcon name="sparkles" size={12} strokeWidth={2.2} />AI Analysis</span>
        </div>
      </div>
      <div className="smart-tip"><span className="tip-icon"><AppIcon name="refresh" size={16} strokeWidth={2.2} /></span><span>Fetching data...</span></div>
    </div>
  );

  if (!categorySpend.length) return (
    <div className="card smart-insight-card">
      <div className="card-header">
        <div><p className="section-title">Smart Insight</p><p className="section-subtitle">No expenses for {monthLabel}</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniMonthPicker selectedMonth={localMonth} selectedYear={localYear} onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }} />
          <span className="ai-chip"><AppIcon name="sparkles" size={12} strokeWidth={2.2} />AI Analysis</span>
        </div>
      </div>
      <div className="smart-tip"><span className="tip-icon"><AppIcon name="lightbulb" size={16} strokeWidth={2.2} /></span><span>No expenses found for {monthLabel}. Try selecting a different month.</span></div>
    </div>
  );

  const top = categorySpend[0];
  const topConf  = getCategoryConfig(top.label);
  const topColor = topConf?.color || '#1a6cff';
  const topIcon  = getIconName(top.label);

  return (
    <div className="card smart-insight-card">
      <div className="card-header">
        <div><p className="section-title">Smart Insight</p><p className="section-subtitle">Category-wise analysis for {monthLabel}</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniMonthPicker selectedMonth={localMonth} selectedYear={localYear} onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }} />
          <span className="ai-chip"><AppIcon name="sparkles" size={12} strokeWidth={2.2} />AI Analysis</span>
        </div>
      </div>

      <div className="top-category-banner" style={{ background: `${topColor}12`, borderColor: `${topColor}28` }}>
        <div className="top-category-icon" style={{ color: topColor }}>
          <AppIcon name={topIcon} size={28} strokeWidth={2.1} />
        </div>
        <div>
          <p className="top-category-label">Highest Spending Category</p>
          <p className="top-category-name">{top.label}</p>
          <p className="top-category-stat">{formatINR(top.amount)} — {top.pct}% of {monthLabel} expenses</p>
        </div>
      </div>

      <div className="categories-list">
        {categorySpend.map((cat) => {
          const conf = getCategoryConfig(cat.label);
          const color = conf?.color || '#1a6cff';
          return (
            <div key={cat.label} className="category-row">
              <div className="category-row-left">
                <span className="category-emoji"><AppIcon name={getIconName(cat.label)} size={15} color={color} strokeWidth={2.1} /></span>
                <span className="category-name">{cat.label}</span>
              </div>
              <div className="category-row-right">
                <div className="category-bar-wrap">
                  <div className="category-bar" style={{ width: `${cat.pct}%`, background: color }} />
                </div>
                <div className="category-meta">
                  <span className="category-pct" style={{ color }}>{cat.pct}%</span>
                  <span className="category-amount">{formatINR(cat.amount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="smart-tip">
        <span className="tip-icon"><AppIcon name="lightbulb" size={16} strokeWidth={2.2} /></span>
        <span>Your highest spending in <strong>{monthLabel}</strong> is <strong>{top.label}</strong> at {formatINR(top.amount)}. Reducing it by 25% could save you <strong>{formatINR(Math.round(top.amount * 0.25))}</strong>.</span>
      </div>
    </div>
  );
};

export default SmartInsight;