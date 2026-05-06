import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CATEGORY_MAP, CATEGORIES, getCategoryConfig } from '../utils/categories';
import api from '../utils/api';
import AppIcon from '../utils/AppIcons';
import MiniMonthPicker from './MonthYearPicker';
import './CalendarView.css';

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const getDateKey = (dateValue) => {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getDateKeyFromParts = (year, month, day) =>
  `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

const isSameDate = (a, b) => getDateKey(a) === getDateKey(b);

const getCategoryIcon = (cat) => {
  const conf = CATEGORY_MAP[cat] || getCategoryConfig?.(cat);
  if (conf?.icon) return conf.icon;
  const l = String(cat || '').toLowerCase();
  if (l.includes('food') || l.includes('dining')) return 'utensils';
  if (l.includes('transport')) return 'car';
  if (l.includes('shopping')) return 'shopping-bag';
  if (l.includes('health')) return 'heart-pulse';
  if (l.includes('travel')) return 'plane';
  return 'package';
};

const getCategoryColor = (cat) => {
  const conf = CATEGORY_MAP[cat] || getCategoryConfig?.(cat) || CATEGORIES[CATEGORIES.length - 1];
  return conf?.color || '#1a6cff';
};

const CalendarView = ({ expenses: expensesFromProps, onExpensesChange, selectedMonth, selectedYear }) => {
  const [expenses, setExpenses] = useState(Array.isArray(expensesFromProps) ? expensesFromProps : []);
  const [loading, setLoading]   = useState(!Array.isArray(expensesFromProps));

  const now         = new Date();
  const targetMonth = selectedMonth ?? now.getMonth();
  const targetYear  = selectedYear  ?? now.getFullYear();

  const [localMonth, setLocalMonth] = useState(targetMonth);
  const [localYear,  setLocalYear]  = useState(targetYear);

  // Sync calendar view to selected month/year from picker
  const [viewDate, setViewDate]     = useState(new Date(targetYear, targetMonth, 1));
  const [selectedDate, setSelectedDate] = useState(new Date());

  // When picker changes month/year, update calendar view
  useEffect(() => {
    setViewDate(new Date(targetYear, targetMonth, 1));
    setLocalMonth(targetMonth);
    setLocalYear(targetYear);
  }, [targetMonth, targetYear]);

  const handlePickerChange = (m, y) => {
    setLocalMonth(m);
    setLocalYear(y);
    setViewDate(new Date(y, m, 1));
  };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all expenses (calendar shows all months, just navigates)
      const res = await api.get('/expenses?limit=500');
      const data = res.data?.expenses || [];
      setExpenses(data);
      if (onExpensesChange) onExpensesChange(data);
    } catch (err) {
      console.error(err);
      setExpenses([]);
    } finally { setLoading(false); }
  }, [onExpensesChange]);

  useEffect(() => {
    if (Array.isArray(expensesFromProps)) { setExpenses(expensesFromProps); setLoading(false); return; }
    fetchExpenses();
  }, [expensesFromProps, fetchExpenses]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel    = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const expensesByDate = useMemo(() => expenses.reduce((acc, e) => {
    const key = getDateKey(e.date);
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {}), [expenses]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate      = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let day = 1; day <= lastDate; day++) {
      const key = getDateKeyFromParts(year, month, day);
      const dayExpenses = expensesByDate[key] || [];
      cells.push({ day, key, date: new Date(year, month, day), expenses: dayExpenses, total: dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0) });
    }
    return cells;
  }, [year, month, expensesByDate]);

  const selectedExpenses = useMemo(() => expensesByDate[getDateKey(selectedDate)] || [], [expensesByDate, selectedDate]);
  const selectedTotal    = selectedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="card calendar-card">
      <div className="card-header">
        <div>
          <p className="section-title">Calendar</p>
          <p className="section-subtitle">{loading ? 'Loading...' : 'Date-wise expense tracking'}</p>
        </div>
        <MiniMonthPicker
          selectedMonth={localMonth}
          selectedYear={localYear}
          onChange={handlePickerChange}
        />
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <p className="cal-month-label">{monthLabel}</p>
            <button className="cal-nav-btn" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="cal-days-header">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-day-name">{d}</div>)}
          </div>

          <div className="cal-grid">
            {calendarDays.map((dayObj, i) => {
              if (!dayObj) return <div key={`e-${i}`} className="cal-cell empty" />;
              const isToday    = isSameDate(dayObj.date, new Date());
              const isSelected = isSameDate(dayObj.date, selectedDate);
              return (
                <button key={dayObj.key} type="button"
                  className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dayObj.date)}>
                  <span className="cal-date-num">{dayObj.day}</span>
                  {dayObj.expenses.length > 0 && <>
                    <span className="cal-exp-dot" />
                    <span className="cal-exp-amount">{formatINR(dayObj.total)}</span>
                  </>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="cal-side">
          <div className="cal-side-header">
            <p className="cal-side-date">{selectedLabel}</p>
            <p className="cal-side-total">{formatINR(selectedTotal)}</p>
          </div>
          <div className="cal-exp-list">
            {selectedExpenses.length > 0 ? selectedExpenses.map((e, i) => {
              const color = getCategoryColor(e.category);
              const icon  = getCategoryIcon(e.category);
              return (
                <div key={e._id || i} className="cal-exp-item">
                  <span className="cal-exp-emoji" style={{ color }}><AppIcon name={icon} size={14} color={color} strokeWidth={2.1} /></span>
                  <span className="cal-exp-title">{e.title || 'Untitled'}</span>
                  <span className="cal-exp-amt">{formatINR(e.amount)}</span>
                </div>
              );
            }) : (
              <div className="cal-no-exp">
                <AppIcon name="calendar" size={24} strokeWidth={1.9} />
                <p>No expenses on this date</p>
              </div>
            )}
          </div>
          <div className="cal-legend">
            <div className="cal-legend-item"><span className="cal-legend-dot today-dot" />Today</div>
            <div className="cal-legend-item"><span className="cal-legend-dot expense-dot" />Expense recorded</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CalendarView;