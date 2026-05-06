import React, { useState } from 'react';
import { CATEGORIES, PAYMENT_MODES } from '../utils/categories';
import api from '../utils/api';
import AppIcon from '../utils/AppIcons';
import './AddExpensePage.css';

const BLANK_FORM = {
  title: '', amount: '', date: '', category: 'Food & Dining', mode: 'UPI', note: ''
};

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
  <div className="aep-picker-grid">
    {CATEGORIES.map((c) => {
      const isActive = value === c.label;
      return (
        <button key={c.id} type="button"
          className={`aep-picker-item ${isActive ? 'active' : ''}`}
          style={{
            '--picker-color': c.color, '--picker-bg': c.bg,
            borderColor: isActive ? c.color : 'var(--border)',
            background: isActive ? c.bg : 'var(--bg-card-2)'
          }}
          onClick={() => onChange(c.label)}>
          <AppIcon name={CATEGORY_ICON_MAP[c.label] || 'package'} size={16}
            color={isActive ? c.color : 'var(--text-muted)'} strokeWidth={2} />
          <span style={{ color: isActive ? c.color : 'var(--text-secondary)' }}>{c.label}</span>
        </button>
      );
    })}
  </div>
);

const ModePicker = ({ value, onChange }) => (
  <div className="aep-mode-row">
    {PAYMENT_MODES.map((m) => {
      const isActive = value === m;
      return (
        <button key={m} type="button"
          className={`aep-mode-item ${isActive ? 'active' : ''}`}
          onClick={() => onChange(m)}>
          <AppIcon name={MODE_ICON_MAP[m] || 'wallet'} size={15}
            color={isActive ? 'var(--blue)' : 'var(--text-muted)'} strokeWidth={2} />
          <span>{m}</span>
        </button>
      );
    })}
  </div>
);

const AddExpensePage = () => {
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(BLANK_FORM);
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.amount || !form.date) return;
    setSaving(true);
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) });
      notifyExpenseChanged();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setForm(BLANK_FORM);
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aep-root">
      {!showForm ? (
        <div className="aep-landing">
          <p className="aep-landing-title">Add a new expense</p>
          <p className="aep-landing-sub">Track your spending by adding expenses manually</p>

          <button className="aep-split-main" onClick={() => setShowForm(true)}>
            <AppIcon name="plus" size={15} color="white" strokeWidth={2.5} />
            Add Expense
          </button>
        </div>
      ) : (
        <div className="aep-form-wrap">
          <div className="aep-form-header">
            <button className="aep-back-btn" onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}>
              <AppIcon name="arrow-left" size={15} color="var(--text-secondary)" />
              Back
            </button>
            <p className="aep-form-title">New Expense</p>
          </div>

          <div className="aep-form-card card">
            <div className="aep-form-body">
              <div className="aep-form-group">
                <label>Title *</label>
                <input type="text" className="input-field" placeholder="e.g. Zomato Order"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="aep-form-row">
                <div className="aep-form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" className="input-field" placeholder="0.00" min="0"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div className="aep-form-group">
                  <label>Date *</label>
                  <input type="date" className="input-field"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>

              <div className="aep-form-group">
                <label>Category</label>
                <CategoryPicker value={form.category} onChange={val => setForm({ ...form, category: val })} />
              </div>

              <div className="aep-form-group">
                <label>Payment Mode</label>
                <ModePicker value={form.mode} onChange={val => setForm({ ...form, mode: val })} />
              </div>

              <div className="aep-form-group">
                <label>Note (optional)</label>
                <input type="text" className="input-field" placeholder="Add a note..."
                  value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>

            <div className="aep-form-footer">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(BLANK_FORM); }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || success}>
                {success
                  ? <><AppIcon name="check" size={14} color="white" /> Saved!</>
                  : saving
                  ? 'Saving…'
                  : <><AppIcon name="plus" size={14} color="white" /> Add Expense</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExpensePage;