import React, { useEffect, useState, useCallback } from 'react';
import { CATEGORIES, CATEGORY_MAP, PAYMENT_MODES } from '../utils/categories';
import api from '../utils/api';
import './ExpensesTable.css';
import AppIcon from '../utils/AppIcons';
import MiniMonthPicker from './MonthYearPicker';

const BLANK_FORM = { title: '', amount: '', date: '', category: 'Food & Dining', mode: 'UPI', note: '' };

const CATEGORY_ICON_MAP = {
  'Food & Dining': 'utensils', 'Transport': 'car', 'Shopping': 'shopping-bag',
  'Entertainment': 'clapperboard', 'Utilities': 'zap', 'Health': 'heart-pulse',
  'Education': 'book-open', 'Rent / Housing': 'home', 'Travel': 'plane', 'Other': 'package',
};

const MODE_ICON_MAP = {
  'UPI': 'smartphone', 'Card': 'credit-card', 'Cash': 'banknote',
  'Net Banking': 'landmark', 'Wallet': 'wallet',
};

const notifyExpenseChanged = () => window.dispatchEvent(new Event('expense-added'));

const CategoryPicker = ({ value, onChange }) => (
  <div className="custom-picker-grid">
    {CATEGORIES.map((c) => {
      const isActive = value === c.label;
      return (
        <button key={c.id} type="button" className={`picker-item ${isActive ? 'active' : ''}`}
          style={{ '--picker-color': c.color, '--picker-bg': c.bg, borderColor: isActive ? c.color : 'var(--border)', background: isActive ? c.bg : 'var(--bg-card)' }}
          onClick={() => onChange(c.label)}>
          <span className="picker-icon"><AppIcon name={CATEGORY_ICON_MAP[c.label] || 'package'} size={18} color={isActive ? c.color : 'var(--text-muted)'} strokeWidth={2} /></span>
          <span className="picker-label" style={{ color: isActive ? c.color : 'var(--text-secondary)' }}>{c.label}</span>
        </button>
      );
    })}
  </div>
);

const ModePicker = ({ value, onChange }) => (
  <div className="custom-picker-row">
    {PAYMENT_MODES.map((m) => {
      const isActive = value === m;
      return (
        <button key={m} type="button" className={`mode-item ${isActive ? 'active' : ''}`} onClick={() => onChange(m)}>
          <AppIcon name={MODE_ICON_MAP[m] || 'wallet'} size={16} color={isActive ? 'var(--blue)' : 'var(--text-muted)'} strokeWidth={2} />
          <span>{m}</span>
        </button>
      );
    })}
  </div>
);

const ExpensesTable = ({ selectedMonth, selectedYear }) => {
  const [expenses, setExpenses]           = useState([]);
  const [search, setSearch]               = useState('');
  const [filterCat, setFilterCat]         = useState('All');
  const [sortBy, setSortBy]               = useState('date');
  const [showModal, setShowModal]         = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(BLANK_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const now         = new Date();
  const [localMonth, setLocalMonth] = useState(selectedMonth ?? now.getMonth());
  const [localYear,  setLocalYear]  = useState(selectedYear  ?? now.getFullYear());

  // Sync when parent changes selectedMonth / selectedYear
  useEffect(() => {
    if (selectedMonth != null) setLocalMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedYear != null) setLocalYear(selectedYear);
  }, [selectedYear]);

  const targetMonth = localMonth;
  const targetYear  = localYear;

  const fetchExpenses = useCallback(async () => {
    try {
      const startDate = new Date(targetYear, targetMonth, 1).toISOString();
      const endDate   = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).toISOString();
      // Send date params to backend (for DB-level filtering if supported)
      // Frontend filter below handles it regardless
      const res = await api.get(`/expenses?limit=1000&startDate=${startDate}&endDate=${endDate}`);
      setExpenses(res.data.expenses || []);
    } catch (err) { console.error(err); }
  }, [targetMonth, targetYear]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Re-fetch when a new expense is added elsewhere (e.g. AddExpensePage)
  useEffect(() => {
    const handler = () => fetchExpenses();
    window.addEventListener('expense-added', handler);
    return () => window.removeEventListener('expense-added', handler);
  }, [fetchExpenses]);

  const displayed = expenses
    .filter(e => {
      const q = search.toLowerCase();
      // Frontend month filter — guarantees correct month even if backend ignores date params
      const expDate = new Date(e.date);
      const inMonth = expDate.getFullYear() === targetYear && expDate.getMonth() === targetMonth;
      return inMonth &&
        ((e.title || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q)) &&
        (filterCat === 'All' || e.category === filterCat);
    })
    .sort((a, b) => sortBy === 'amount' ? Number(b.amount) - Number(a.amount) : new Date(b.date) - new Date(a.date));

  const totalShown = displayed.reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthLabel = new Date(targetYear, targetMonth, 1)
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const closeModal = () => { setShowModal(false); setEditingId(null); setForm(BLANK_FORM); };
  const openEdit   = (exp) => {
    setEditingId(exp._id);
    setForm({ title: exp.title || '', amount: exp.amount || '', date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '', category: exp.category || 'Food & Dining', mode: exp.mode || 'UPI', note: exp.note || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount || !form.date) return;
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) await api.put(`/expenses/${editingId}`, payload);
      else           await api.post('/expenses', payload);
      await fetchExpenses();
      notifyExpenseChanged();
      closeModal();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses();
      notifyExpenseChanged();
      setDeleteConfirm(null);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="card expenses-table-card">
      <div className="expenses-header">
        <div>
          <p className="section-title">Expenses — {monthLabel}</p>
          <p className="section-subtitle">{displayed.length} transactions · ₹{totalShown.toLocaleString('en-IN')} total</p>
        </div>
        {/* Month picker only — no Add Expense button */}
        <MiniMonthPicker
          selectedMonth={localMonth}
          selectedYear={localYear}
          onChange={(m, y) => { setLocalMonth(m); setLocalYear(y); }}
        />
      </div>

      <div className="expenses-filters">
        <div className="expenses-search">
          <AppIcon name="search" size={13} color="var(--text-muted)" />
          <input type="text" placeholder="Search expenses..." className="expenses-search-input"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="expenses-cat-filters">
          {['All', ...CATEGORIES.map(c => c.label)].slice(0, 6).map(cat => {
            const conf = CATEGORY_MAP[cat];
            const isActive = filterCat === cat;
            return (
              <button key={cat} className={`cat-filter-btn ${isActive ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>
                {conf?.icon && <AppIcon name={CATEGORY_ICON_MAP[cat] || conf.icon} size={13} color={isActive ? 'white' : conf.color} />}
                {cat}
              </button>
            );
          })}
        </div>
        <select className="expenses-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      <div className="expenses-table-wrap">
        <table className="expenses-table">
          <thead><tr><th>#</th><th>Description</th><th>Category</th><th>Amount</th><th>Date</th><th>Mode</th><th>Actions</th></tr></thead>
          <tbody>
            {displayed.map((exp, idx) => {
              const conf = CATEGORY_MAP[exp.category] || CATEGORIES[CATEGORIES.length - 1];
              return (
                <tr key={exp._id} className="expense-row" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <td className="exp-serial">{idx + 1}</td>
                  <td className="exp-title-cell"><p className="exp-title">{exp.title}</p>{exp.note && <p className="exp-note">{exp.note}</p>}</td>
                  <td><span className="exp-category-tag" style={{ background: conf.bg, color: conf.color }}><AppIcon name={CATEGORY_ICON_MAP[exp.category] || 'package'} size={12} color={conf.color} />{exp.category}</span></td>
                  <td className="exp-amount">₹{Number(exp.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="exp-date">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="exp-mode"><span className="exp-mode-tag"><AppIcon name={MODE_ICON_MAP[exp.mode] || 'wallet'} size={12} color="var(--text-muted)" />{exp.mode}</span></td>
                  <td className="exp-actions">
                    <button className="exp-action-btn edit" onClick={() => openEdit(exp)}><AppIcon name="pencil" size={13} /></button>
                    <button className="exp-action-btn delete" onClick={() => setDeleteConfirm(exp._id)}><AppIcon name="trash" size={13} /></button>
                  </td>
                </tr>
              );
            })}
            {displayed.length === 0 && (
              <tr><td colSpan="7" className="exp-empty">
                <div className="exp-empty-state">
                  <AppIcon name="inbox" size={32} color="var(--text-muted)" />
                  <p>No expenses for {monthLabel}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <p className="section-title">Edit Expense</p>
              <button className="btn-icon" onClick={closeModal}><AppIcon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Title *</label><input type="text" className="input-field" placeholder="e.g. Zomato Order" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Amount (₹) *</label><input type="number" className="input-field" placeholder="0.00" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="form-group"><label>Date *</label><input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Category</label><CategoryPicker value={form.category} onChange={val => setForm({ ...form, category: val })} /></div>
              <div className="form-group"><label>Payment Mode</label><ModePicker value={form.mode} onChange={val => setForm({ ...form, mode: val })} /></div>
              <div className="form-group"><label>Note (optional)</label><input type="text" className="input-field" placeholder="Add a note..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><p className="section-title">Delete Expense?</p></div>
            <div className="modal-body"><p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This action cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => handleDelete(deleteConfirm)}><AppIcon name="trash" size={13} color="white" /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesTable;