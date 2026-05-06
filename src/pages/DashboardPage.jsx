import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar         from '../components/Sidebar';
import Navbar          from '../components/Navbar';
import DashboardCards  from '../components/DashboardCards';
import MonthlyBudget   from '../components/MonthlyBudget';
import SmartInsight    from '../components/SmartInsight';
import Analytics       from '../components/Analytics';
import ExpensesTable   from '../components/ExpensesTable';
import AddExpensePage  from '../components/AddExpensePage';   // ← NEW
import CalendarView    from '../components/CalendarView';
import SpendingInsight from '../components/SpendingInsight';
import MonthYearPicker from '../components/MonthYearPicker';
import AppIcon from '../utils/AppIcons';
import './DashboardPage.css';

const PROFILE_TYPES = [
  'Student', 'Salaried Employee', 'Business Owner',
  'Freelancer', 'Self-Employed', 'Retired', 'Other',
];

const UpdateProfileSection = ({ user, updateUser, profileImage, setProfileImage }) => {
  const [name,         setName]         = useState(user?.name    || '');
  const [email,        setEmail]        = useState(user?.email   || '');
  const [phone,        setPhone]        = useState(user?.phone   || '');
  const [profileType,  setProfileType]  = useState(user?.profileType || '');
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');

  const initials = (name || 'User').trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  // ✅ FIX: use user-scoped localStorage keys so images/data don't leak between accounts
  const imgKey   = `mm_profile_image_${user?.id || user?._id}`;
  const extraKey = `mm_profile_extra_${user?.id || user?._id}`;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem(imgKey, reader.result);   // ✅ user-scoped key
      setProfileImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    localStorage.removeItem(imgKey);                 // ✅ user-scoped key
    setProfileImage('');
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      // ✅ FIX: actually save name + email to the database
      await api.put('/auth/update', { name: name.trim(), email: email.trim() });

      // phone & profileType are local-only fields (not in DB schema yet)
      localStorage.setItem(extraKey, JSON.stringify({ phone: phone.trim(), profileType })); // ✅ user-scoped

      const updated = { ...user, name: name.trim(), email: email.trim(), phone: phone.trim(), profileType };
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card profile-placeholder-card">
      <div className="profile-placeholder-icon" style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => document.getElementById('profile-img-input').click()}>
        {profileImage ? (
          <img src={profileImage} alt="Profile"
            style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontWeight: 800 }}>{initials}</span>
        )}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', opacity: 0, transition: 'opacity .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>

      <input id="profile-img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

      <p className="section-title" style={{ marginBottom: 4 }}>Update Profile</p>
      <p className="section-subtitle" style={{ marginBottom: 6 }}>Changes apply everywhere your profile is shown.</p>

      {profileImage && (
        <button onClick={handleRemoveImage}
          style={{ fontSize: 12, color: 'var(--red, #ef4444)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18 }}>
          Remove photo
        </button>
      )}

      <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'left', width: '100%' }}>
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" className="input-field" placeholder="Enter your name"
            value={name} onChange={e => setName(e.target.value)}
            style={{ color: 'var(--text-primary, #1e293b)', background: 'var(--bg-input, #fff)' }} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="input-field" placeholder="Enter your email"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ color: 'var(--text-primary, #1e293b)', background: 'var(--bg-input, #fff)' }} />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" className="input-field" placeholder="e.g. +91 98765 43210"
            value={phone} onChange={e => setPhone(e.target.value)}
            style={{ color: 'var(--text-primary, #1e293b)', background: 'var(--bg-input, #fff)' }} />
        </div>
        <div className="form-group">
          <label>Profile Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {PROFILE_TYPES.map((type) => {
              const isActive = profileType === type;
              return (
                <button key={type} type="button"
                  onClick={() => setProfileType(isActive ? '' : type)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', transition: 'all .18s',
                    border: isActive ? '1.5px solid var(--blue, #3b82f6)' : '1.5px solid var(--border)',
                    background: isActive ? 'var(--blue, #3b82f6)' : 'var(--bg-card)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                  }}>
                  {type}
                </button>
              );
            })}
          </div>
        </div>
        {error && (
          <p style={{ fontSize: 12, color: 'var(--red, #ef4444)', marginBottom: 8 }}>{error}</p>
        )}
        <button className="btn btn-primary" style={{ marginTop: 12, minWidth: 140 }}
          onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};


const DeleteProfileSection = ({ user, logout }) => {
  const [step,     setStep]     = useState('idle'); // idle | confirm | deleting | done
  const [error,    setError]    = useState('');
  const [inputVal, setInputVal] = useState('');

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

  const handleDelete = async () => {
    if (inputVal.trim() !== CONFIRM_PHRASE) {
      setError(`Type exactly: ${CONFIRM_PHRASE}`);
      return;
    }
    setError('');
    setStep('deleting');
    try {
      await api.delete('/auth/delete');
      localStorage.clear();
      setStep('done');
      setTimeout(() => logout(), 1800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setStep('confirm');
    }
  };

  if (step === 'done') {
    return (
      <div className="card profile-placeholder-card">
        <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
        <p className="section-title" style={{ marginBottom: 6 }}>Account Deleted</p>
        <p className="section-subtitle">All your data has been removed. Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="card profile-placeholder-card">
      <div style={{
        width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
        background: 'rgba(239,68,68,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AppIcon name="trash-2" size={28} color="#ef4444" strokeWidth={2} />
      </div>

      <p className="section-title" style={{ marginBottom: 6, color: 'var(--text-primary)' }}>
        Delete Account
      </p>
      <p className="section-subtitle" style={{ marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
        This will permanently delete your account and <strong>all your expenses</strong>.
        This action cannot be undone.
      </p>

      {step === 'idle' && (
        <button
          className="btn"
          style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: '1.5px solid rgba(239,68,68,0.3)',
            padding: '10px 28px', fontWeight: 600, borderRadius: 10,
            cursor: 'pointer', transition: 'all .18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
          onClick={() => setStep('confirm')}
        >
          I want to delete my account
        </button>
      )}

      {(step === 'confirm' || step === 'deleting') && (
        <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'left',
          }}>
            <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 6 }}>
              ⚠️ You will lose:
            </p>
            <ul style={{ fontSize: 12.5, color: 'var(--text-secondary)', paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
              <li>Your account — <strong>{user?.email}</strong></li>
              <li>All expense records</li>
              <li>Budget settings</li>
              <li>Profile information</li>
            </ul>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'left' }}>
            Type <strong style={{ color: '#ef4444', letterSpacing: 0.5 }}>DELETE MY ACCOUNT</strong> to confirm:
          </p>
          <input
            type="text"
            className="input-field"
            placeholder="DELETE MY ACCOUNT"
            value={inputVal}
            onChange={e => { setInputVal(e.target.value); setError(''); }}
            disabled={step === 'deleting'}
            style={{
              marginBottom: 8, fontFamily: 'monospace', letterSpacing: 1,
              borderColor: inputVal && inputVal !== CONFIRM_PHRASE ? '#ef4444' : '',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 10, textAlign: 'left' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="btn"
              style={{
                flex: 1, background: 'var(--bg-card-2)', color: 'var(--text-secondary)',
                border: '1.5px solid var(--border)', borderRadius: 10,
                padding: '10px 0', fontWeight: 500, cursor: 'pointer',
              }}
              onClick={() => { setStep('idle'); setInputVal(''); setError(''); }}
              disabled={step === 'deleting'}
            >
              Cancel
            </button>
            <button
              className="btn"
              style={{
                flex: 1,
                background: inputVal === CONFIRM_PHRASE ? '#ef4444' : 'rgba(239,68,68,0.3)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 0', fontWeight: 600,
                cursor: inputVal === CONFIRM_PHRASE ? 'pointer' : 'not-allowed',
                transition: 'background .18s',
                opacity: step === 'deleting' ? 0.7 : 1,
              }}
              onClick={handleDelete}
              disabled={step === 'deleting'}
            >
              {step === 'deleting' ? 'Deleting…' : 'Delete Forever'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const { user, updateUser, logout } = useAuth();

  useEffect(() => {
    if (!user?.id && !user?._id) return;
    try {
      // ✅ FIX: user-scoped key so phone/profileType don't leak to other accounts
      const extraKey = `mm_profile_extra_${user?.id || user?._id}`;
      const extra = JSON.parse(localStorage.getItem(extraKey) || '{}');
      if (extra && user) updateUser({ ...user, ...extra });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [activeSection, setActiveSection]       = useState('dashboard');
  const [expandedItem, setExpandedItem]         = useState(null);
  const [openExpenseModal, setOpenExpenseModal]  = useState(false);
  const [profileImage, setProfileImage] = useState('');

  // ✅ FIX: load profile image scoped to this user only, not shared across accounts
  useEffect(() => {
    if (!user?.id && !user?._id) return;
    const imgKey = `mm_profile_image_${user?.id || user?._id}`;
    setProfileImage(localStorage.getItem(imgKey) || '');
  }, [user?.id, user?._id]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      if (!detail) return;
      if (typeof detail === 'string') {
        setActiveSection(detail);
      } else {
        if (detail.section)      setActiveSection(detail.section);
        if (detail.expandParent) setExpandedItem(detail.expandParent);
      }
    };
    window.addEventListener('navigate-section', handler);
    return () => window.removeEventListener('navigate-section', handler);
  }, []);

  const handleMonthChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingIcon = hour < 12 ? 'sun' : hour < 17 ? 'sparkles' : 'moon';
  const firstName    = user?.name?.split(' ')[0] || 'there';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ← CHANGED: navigate to add-expense page instead of opening modal
  const openAddExpense = () => setActiveSection('add-expense');

  return (
    <div className={`dashboard-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        profileImage={profileImage}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        expandedItem={expandedItem}
        setExpandedItem={setExpandedItem}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="dashboard-wrapper">
        <Navbar
          profileImage={profileImage}
          collapsed={sidebarCollapsed}
          setMobileOpen={setMobileOpen}
        />

        <main className="dashboard-main">

          {/* ── Page header — dashboard only ── */}
          {activeSection === 'dashboard' && (
            <div className="dashboard-page-header animate-fade-up">
              <div>
                <h1 className="dashboard-page-title">
                  {greeting}, {firstName}
                  <AppIcon name={greetingIcon} size={22} strokeWidth={2.2} className="greeting-icon" />
                </h1>
                <p className="dashboard-page-sub">
                  Here's your financial overview — <strong>{today}</strong>
                </p>
              </div>
              <div className="dashboard-page-header-actions">
                <MonthYearPicker
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onChange={handleMonthChange}
                />
                <button className="btn btn-primary" onClick={openAddExpense}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Expense
                </button>
              </div>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activeSection === 'dashboard' && (
            <DashboardCards selectedMonth={selectedMonth} selectedYear={selectedYear} />
          )}

          {/* ── ADD EXPENSE — dedicated page with big button + file upload ── */}
          {activeSection === 'add-expense' && (        // ← CHANGED
            <AddExpensePage />
          )}

          {/* ── VIEW EXPENSES — table only, no Add Expense button ── */}
          {activeSection === 'view-expenses' && (      // ← CHANGED: removed isExpensesSection
            <ExpensesTable
              openExpenseModal={openExpenseModal}
              setOpenExpenseModal={setOpenExpenseModal}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}

          {/* ── BUDGET ── */}
          {(activeSection === 'show-budget' || activeSection === 'edit-budget') && (
            <MonthlyBudget
              defaultEditing={activeSection === 'edit-budget'}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}

          {/* ── SMART INSIGHT ── */}
          {activeSection === 'top-category' && (
            <SmartInsight selectedMonth={selectedMonth} selectedYear={selectedYear} />
          )}

          {/* ── SPENDING INSIGHT ── */}
          {['daily-avg', 'predicted', 'remaining', 'highest'].includes(activeSection) && (
            <SpendingInsight
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              activeSection={activeSection}
            />
          )}

          {/* ── ANALYTICS ── */}
          {activeSection === 'charts' && (
            <Analytics selectedMonth={selectedMonth} selectedYear={selectedYear} />
          )}

          {/* ── CALENDAR ── */}
          {activeSection === 'date-wise' && (
            <CalendarView selectedMonth={selectedMonth} selectedYear={selectedYear} />
          )}

          {/* ── VIEW PROFILE ── */}
          {activeSection === 'view-profile' && (
            <div className="card profile-placeholder-card">
              <div className="profile-placeholder-icon">
                {profileImage ? (
                  <img src={profileImage} alt="Profile"
                    style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontWeight: 800 }}>
                    {(user?.name || 'User').trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>
              <p className="section-title" style={{ marginBottom: 4 }}>{user?.name || 'User'}</p>
              {user?.profileType && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 20,
                  background: 'var(--blue-light, #eff6ff)', color: 'var(--blue, #3b82f6)', marginBottom: 8, display: 'inline-block' }}>
                  {user.profileType}
                </span>
              )}
              <p className="section-subtitle" style={{ marginBottom: 4 }}>{user?.email || 'No email available'}</p>
              {user?.phone && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{user.phone}</p>
              )}
            </div>
          )}

          {/* ── UPDATE PROFILE ── */}
          {activeSection === 'update-profile' && (
            <UpdateProfileSection
              user={user}
              updateUser={updateUser}
              profileImage={profileImage}
              setProfileImage={setProfileImage}
            />
          )}

          {/* ── DELETE PROFILE ── */}
          {activeSection === 'delete-profile' && (
            <DeleteProfileSection user={user} logout={logout} />
          )}

          {/* ── Footer ── */}
          <footer className="dashboard-footer">
            <span> {new Date().getFullYear()} MoneyMap.......</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;