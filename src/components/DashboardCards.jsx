import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import './DashboardCards.css';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const isSameMonth = (dateValue, year, month) => {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === year && d.getMonth() === month;
};

const getChangeMeta = (current, previous, positiveWhenLower = false) => {
  const c = Number(current || 0), p = Number(previous || 0);
  if (p <= 0 && c <= 0) return { change: 'No data yet', changeType: 'warning', changeLabel: 'Add expenses to track' };
  if (p <= 0) return { change: 'New data', changeType: 'up', changeLabel: 'no previous month' };
  const diff = c - p;
  const pct = Math.abs(Math.round((diff / p) * 100));
  if (diff === 0) return { change: '0%', changeType: 'warning', changeLabel: 'same as last month' };
  const isPositive = positiveWhenLower ? diff < 0 : diff > 0;
  return { change: `${diff > 0 ? '+' : '-'}${pct}%`, changeType: isPositive ? 'up' : 'down', changeLabel: diff > 0 ? 'higher than last month' : 'lower than last month' };
};

const ArrowUp   = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const ArrowDown = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;

const IconWallet   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>;
const IconBudget   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
const IconExpense  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const IconClock    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconActivity = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconSpark    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 15l.9 2.6L22 18.5l-2.1.9L19 22l-.9-2.6-2.1-.9 2.1-.9L19 15z"/></svg>;

const PARTICLES = [
  { size: '5px',  left: '8%',  duration: '3.2s', delay: '0s'    },
  { size: '4px',  left: '20%', duration: '2.8s', delay: '0.6s'  },
  { size: '6px',  left: '35%', duration: '3.6s', delay: '1.1s'  },
  { size: '3px',  left: '52%', duration: '2.5s', delay: '0.3s'  },
  { size: '5px',  left: '65%', duration: '3.0s', delay: '1.7s'  },
  { size: '4px',  left: '78%', duration: '2.9s', delay: '0.9s'  },
  { size: '3px',  left: '90%', duration: '3.4s', delay: '0.2s'  },
];

const DashboardCards = ({ expenses: expensesFromProps, budget: budgetFromProps, monthlyBudget, summary, selectedMonth, selectedYear }) => {
  const [expenses,  setExpenses]  = useState(Array.isArray(expensesFromProps) ? expensesFromProps : []);
  const [loading,   setLoading]   = useState(!Array.isArray(expensesFromProps));
  const [apiBudget, setApiBudget] = useState(0);

  const now         = new Date();
  const targetMonth = selectedMonth ?? now.getMonth();
  const targetYear  = selectedYear  ?? now.getFullYear();

  // ── Fetch budget from same API endpoint as MonthlyBudget.jsx ──────────────
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await api.get('/expenses/budget');
        setApiBudget(Number(res.data?.budget || 0));
      } catch (err) {
        console.error('DashboardCards: budget fetch failed', err);
      }
    };
    fetchBudget();
  }, []);

  // ── Fetch expenses for selected month ─────────────────────────────────────
  useEffect(() => {
    if (Array.isArray(expensesFromProps)) { setExpenses(expensesFromProps); setLoading(false); return; }
    const fetchExpenses = async () => {
      try {
        const startDate = new Date(targetYear, targetMonth, 1).toISOString();
        const endDate   = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString();
        const res = await api.get(`/expenses?limit=500&startDate=${startDate}&endDate=${endDate}`);
        setExpenses(res.data.expenses || []);
      } catch (err) { console.error(err); setExpenses([]); }
      finally { setLoading(false); }
    };
    fetchExpenses();
  }, [expensesFromProps, targetMonth, targetYear]);

  const data = useMemo(() => {
    const prevDate  = new Date(targetYear, targetMonth - 1, 1);
    const prevYear  = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const daysInMonth    = new Date(targetYear, targetMonth + 1, 0).getDate();
    const isCurrentMonth = targetMonth === now.getMonth() && targetYear === now.getFullYear();
    const daysElapsed    = isCurrentMonth ? now.getDate() : daysInMonth;

    const currentTotal = expenses
      .filter(e => isSameMonth(e.date, targetYear, targetMonth))
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const prevTotal = expenses
      .filter(e => isSameMonth(e.date, prevYear, prevMonth))
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const currentCount = expenses.filter(e => isSameMonth(e.date, targetYear, targetMonth)).length;

    // API budget takes priority over any prop-passed value
    const budgetValue = apiBudget || Number(summary?.budget || budgetFromProps || monthlyBudget || 0);
    const remaining   = budgetValue > 0 ? budgetValue - currentTotal : 0;
    const budgetUsed  = budgetValue > 0 ? Math.min(Math.round((currentTotal / budgetValue) * 100), 999) : 0;
    const dailyAvg    = daysElapsed > 0 ? Math.round(currentTotal / daysElapsed) : 0;
    const predicted   = dailyAvg > 0 ? Math.round(dailyAvg * daysInMonth) : 0;
    const trend       = getChangeMeta(currentTotal, prevTotal, true);

    return { budgetValue, remaining, budgetUsed, currentTotal, currentCount, dailyAvg, predicted, trend };
  }, [expenses, apiBudget, budgetFromProps, monthlyBudget, summary, targetMonth, targetYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const cards = [
    // Card 1 — purple-blue dark (logo color)
    { id: 'budget',       title: 'Monthly Budget',    value: formatINR(data.budgetValue),
      change: data.budgetValue > 0 ? `${data.budgetUsed}% used` : 'Not set',
      changeType: data.budgetUsed >= 80 ? 'warning' : 'up',
      changeLabel: data.budgetValue > 0 ? `${formatINR(data.remaining)} remaining` : 'set your budget',
      icon: <IconWallet />, light: false, cardStyle: 'logo-purple' },

    // Card 2 — light/white card
    { id: 'expenses',     title: 'Total Expenses',     value: formatINR(data.currentTotal),
      change: data.trend.change, changeType: data.trend.changeType, changeLabel: data.trend.changeLabel,
      icon: <IconExpense />, light: true, accent: '#E040FB' },

    // Card 3 — same purple-blue dark as Card 1
    { id: 'remaining',    title: 'Remaining Budget',   value: formatINR(data.remaining),
      change: data.budgetValue > 0 ? (data.remaining >= 0 ? 'Available' : 'Over budget') : 'No budget',
      changeType: data.remaining >= 0 ? 'up' : 'down',
      changeLabel: data.budgetValue > 0 ? 'current month' : 'budget not set',
      icon: <IconBudget />, light: false, cardStyle: 'logo-purple' },

    // Card 4 — light, blue accent
    { id: 'daily',        title: 'Daily Average',      value: formatINR(data.dailyAvg),
      change: data.currentTotal > 0 ? 'Live avg' : 'No data', changeType: 'warning',
      changeLabel: 'based on this month',
      icon: <IconActivity />, light: true, accent: '#4A6CF7' },

    // Card 5 — pink/magenta dark (logo color)
    { id: 'predicted',    title: 'Predicted Monthly',  value: formatINR(data.predicted),
      change: data.budgetValue > 0 ? `${Math.round((data.predicted / data.budgetValue) * 100)}% of budget` : 'Need budget',
      changeType: data.budgetValue > 0 && data.predicted > data.budgetValue ? 'down' : 'up',
      changeLabel: 'based on current pace',
      icon: <IconSpark />, light: false, cardStyle: 'logo-pink' },

    // Card 6 — light, cyan accent
    { id: 'transactions', title: 'Transactions',       value: loading ? '...' : String(data.currentCount),
      change: data.currentCount > 0 ? 'This month' : 'No entries',
      changeType: data.currentCount > 0 ? 'up' : 'warning', changeLabel: 'real expense records',
      icon: <IconClock />, light: true, accent: '#00BCD4' },
  ];

  return (
    <div className="dashboard-cards-grid">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className={`dash-card ${card.light ? 'dash-card-light' : `dash-card-dark dash-card-${card.cardStyle}`}`}
          style={{ '--accent': card.accent, animationDelay: `${i * 0.06}s` }}
        >
          <div className="dash-card-header">
            <div
              className={`dash-card-icon-wrap ${card.light ? 'light' : 'dark'}`}
              style={card.accent ? { background: `${card.accent}18`, color: card.accent } : {}}
            >
              {card.icon}
            </div>
            {card.id === 'predicted' && (
              <span className="dash-card-ai-tag">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                AI
              </span>
            )}
          </div>
          <div className="dash-card-body">
            <p className={`dash-card-title ${card.light ? '' : 'white'}`}>{card.title}</p>
            <p className={`dash-card-value ${card.light ? '' : 'white'}`}>{card.value}</p>
          </div>
          <div className="dash-card-footer">
            <span className={`dash-card-change ${card.changeType}`}>
              {card.changeType === 'up'   && <ArrowUp />}
              {card.changeType === 'down' && <ArrowDown />}
              {card.change}
            </span>
            <span className={`dash-card-label ${card.light ? '' : 'white'}`}>{card.changeLabel}</span>
          </div>
          {!card.light && PARTICLES.map((p, pi) => (
            <div key={pi} className="dash-card-particle" style={{
              width:  p.size, height: p.size,
              left:   p.left,
              animationDuration: p.duration,
              animationDelay:    p.delay,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;