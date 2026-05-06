// frontend/src/components/MonthlyBudget.jsx
import React, { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import AppIcon from '../utils/AppIcons';
import MiniMonthPicker from './MonthYearPicker';
import './MonthlyBudget.css';

const formatINR = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

const MonthlyBudget = ({ defaultEditing = false, selectedMonth, selectedYear }) => {
  const [editing, setEditing] = useState(defaultEditing);
  const [budget, setBudget] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [spent, setSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [localMonth, setLocalMonth] = useState(selectedMonth !== undefined ? selectedMonth : now.getMonth());
  const [localYear,  setLocalYear]  = useState(selectedYear  !== undefined ? selectedYear  : now.getFullYear());

  const filterMonth = localMonth;
  const filterYear  = localYear;

  const fetchBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, expensesRes] = await Promise.all([
        api.get('/expenses/budget'),
        api.get('/expenses?limit=500'),
      ]);
      const budgetAmount = Number(budgetRes.data?.budget || 0);
      const expenses = expensesRes.data?.expenses || [];
      const currentMonthSpent = expenses
        .filter((expense) => {
          if (!expense.date) return false;
          const date = new Date(expense.date);
          if (Number.isNaN(date.getTime())) return false;
          return date.getFullYear() === filterYear && date.getMonth() === filterMonth;
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      setBudget(budgetAmount);
      setInputVal(String(budgetAmount));
      setSpent(currentMonthSpent);
    } catch (err) {
      console.error('Budget data fetch failed:', err.response?.data || err.message);
      setBudget(0);
      setInputVal('');
      setSpent(0);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  useEffect(() => {
    setEditing(defaultEditing);
  }, [defaultEditing]);

  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const rawPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remaining = budget - spent;

  const progressColor =
    rawPct >= 90 ? '#ff4757' : rawPct >= 70 ? '#f5a623' : '#00c9a7';

  const monthLabel = new Date(filterYear, filterMonth).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const handleSave = async () => {
    const value = Number(inputVal);
    if (Number.isNaN(value) || value < 0) return;
    setSaving(true);
    try {
      const res = await api.put('/expenses/budget', { budget: value });
      const updatedBudget = Number(res.data?.budget ?? value);
      setBudget(updatedBudget);
      setInputVal(String(updatedBudget));
      setEditing(false);
      await fetchBudgetData();
    } catch (err) {
      console.error('Budget update failed:', err.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card monthly-budget-card">
      <div className="card-header">
        <div>
          <p className="section-title">Monthly Budget</p>
          <p className="section-subtitle">{monthLabel}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MiniMonthPicker
            selectedMonth={localMonth}
            selectedYear={localYear}
            onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }}
          />
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 12px' }}
            onClick={() => setEditing(!editing)}
            disabled={loading || saving}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="budget-edit-form">
          <label className="budget-edit-label">Set Monthly Budget (₹)</label>
          <div className="budget-edit-row">
            <input
              type="number"
              className="input-field"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter budget amount"
              min="0"
            />
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="budget-amounts">
            <div className="budget-amount-item">
              <span className="budget-amount-label">Total Budget</span>
              <span className="budget-amount-value">
                {loading ? 'Loading...' : formatINR(budget)}
              </span>
            </div>
            <div className="budget-amount-divider" />
            <div className="budget-amount-item">
              <span className="budget-amount-label">Spent</span>
              <span className="budget-amount-value spent">
                {loading ? 'Loading...' : formatINR(spent)}
              </span>
            </div>
            <div className="budget-amount-divider" />
            <div className="budget-amount-item">
              <span className="budget-amount-label">Remaining</span>
              <span className="budget-amount-value remaining">
                {loading ? 'Loading...' : formatINR(remaining)}
              </span>
            </div>
          </div>

          {!loading && budget <= 0 ? (
            <div className="budget-alert">
              <AppIcon name="warning" size={16} strokeWidth={2.2} />
              <span>Please set your monthly budget first.</span>
            </div>
          ) : (
            !loading && (
              <>
                <div className="budget-progress-wrap">
                  <div className="budget-progress-header">
                    <span className="budget-progress-label">Budget Used</span>
                    <span className="budget-progress-pct" style={{ color: progressColor }}>
                      {rawPct}%
                    </span>
                  </div>
                  <div className="budget-progress-bar-bg">
                    <div className="budget-progress-bar-fill"
                      style={{ width: `${pct}%`, background: progressColor }}>
                      <div className="progress-glow" style={{ background: progressColor }} />
                    </div>
                  </div>
                  <div className="budget-progress-ticks">
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <span key={tick} className={`budget-tick ${pct >= tick ? 'active' : ''}`}>
                        {tick}%
                      </span>
                    ))}
                  </div>
                </div>

                {rawPct >= 80 && (
                  <div className="budget-alert">
                    <AppIcon name="warning" size={16} strokeWidth={2.2} />
                    <span>
                      You've used <strong>{rawPct}%</strong> of your budget.
                      Consider reducing expenses.
                    </span>
                  </div>
                )}
              </>
            )
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyBudget;