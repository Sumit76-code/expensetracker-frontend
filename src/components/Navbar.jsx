// frontend/src/components/Navbar.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import AppIcon from '../utils/AppIcons';
import logoImg from '../assets/moneymap.png';
import api from '../utils/api';

const CATEGORY_COLORS = {
  'Food & Dining':  { bg: '#fff7ed', color: '#ea580c' },
  'Transport':      { bg: '#eff6ff', color: '#2563eb' },
  'Shopping':       { bg: '#fdf4ff', color: '#9333ea' },
  'Entertainment':  { bg: '#fff1f2', color: '#e11d48' },
  'Utilities':      { bg: '#fefce8', color: '#ca8a04' },
  'Health':         { bg: '#f0fdf4', color: '#16a34a' },
  'Education':      { bg: '#f0f9ff', color: '#0284c7' },
  'Rent / Housing': { bg: '#fef2f2', color: '#dc2626' },
  'Travel':         { bg: '#ecfdf5', color: '#059669' },
  'Other':          { bg: '#f8fafc', color: '#64748b' },
};

// ── Generate smart notifications from real data ────────────────────────────
const buildNotifications = (expenses, budget) => {
  const notifs = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  const thisMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalSpent = thisMonthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // 1. Budget alert
  if (budget > 0) {
    const pct = Math.round((totalSpent / budget) * 100);
    if (pct >= 100) {
      notifs.push({
        id: 'budget-exceeded',
        type: 'danger',
        icon: 'alert-triangle',
        title: 'Budget Exceeded!',
        msg: `You've spent ₹${totalSpent.toLocaleString('en-IN')} — ${pct}% of your ₹${budget.toLocaleString('en-IN')} budget.`,
        time: 'This month',
        unread: true,
        link: { section: 'show-budget' },
      });
    } else if (pct >= 80) {
      notifs.push({
        id: 'budget-warning',
        type: 'warning',
        icon: 'triangle-alert',
        title: 'Budget Alert',
        msg: `You've used ${pct}% of your monthly budget. ₹${(budget - totalSpent).toLocaleString('en-IN')} remaining.`,
        time: 'This month',
        unread: true,
        link: { section: 'show-budget' },
      });
    } else if (pct >= 50) {
      notifs.push({
        id: 'budget-halfway',
        type: 'info',
        icon: 'info',
        title: 'Halfway Through Budget',
        msg: `You've used ${pct}% of your budget this month. Spending is on track.`,
        time: 'This month',
        unread: false,
        link: { section: 'show-budget' },
      });
    }
  } else {
    notifs.push({
      id: 'no-budget',
      type: 'info',
      icon: 'circle-alert',
      title: 'No Budget Set',
      msg: 'Set a monthly budget to track your spending and get alerts.',
      time: 'Action needed',
      unread: true,
      link: { section: 'edit-budget' },
    });
  }

  // 2. Highest spending category
  const catTotals = {};
  thisMonthExpenses.forEach((e) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount || 0);
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    notifs.push({
      id: 'top-category',
      type: 'insight',
      icon: 'sparkles',
      title: 'Top Spending Category',
      msg: `${topCat[0]} is your highest spend this month — ₹${topCat[1].toLocaleString('en-IN')}.`,
      time: 'Smart Insight',
      unread: false,
      link: { section: 'top-category' },
    });
  }

  // 3. Latest expense added
  const latest = [...thisMonthExpenses].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (latest) {
    const dateLabel = new Date(latest.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    notifs.push({
      id: 'latest-expense',
      type: 'success',
      icon: 'indian-rupee',
      title: 'Latest Expense',
      msg: `₹${Number(latest.amount).toLocaleString('en-IN')} added for "${latest.title}" on ${dateLabel}.`,
      time: dateLabel,
      unread: false,
      link: { section: 'view-expenses' },
    });
  }

  // 4. Large single transaction (> 30% of budget or > ₹5000)
  const threshold = budget > 0 ? budget * 0.3 : 5000;
  const bigExp = thisMonthExpenses.filter((e) => Number(e.amount) >= threshold);
  if (bigExp.length > 0) {
    const b = bigExp[0];
    notifs.push({
      id: 'big-transaction',
      type: 'warning',
      icon: 'arrow-up-circle',
      title: 'Large Transaction',
      msg: `₹${Number(b.amount).toLocaleString('en-IN')} spent on "${b.title}" — a significant expense.`,
      time: new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      unread: true,
      link: { section: 'view-expenses' },
    });
  }

  // 5. No expenses yet this month
  if (thisMonthExpenses.length === 0) {
    notifs.push({
      id: 'no-expenses',
      type: 'info',
      icon: 'inbox',
      title: 'No Expenses Yet',
      msg: `You haven't added any expenses for ${now.toLocaleDateString('en-IN', { month: 'long' })} yet.`,
      time: 'This month',
      unread: false,
      link: { section: 'view-expenses' },
    });
  }

  return notifs;
};

const NOTIF_ICON_COLOR = {
  danger:  '#ff4757',
  warning: '#f5a623',
  info:    '#38bdf8',
  success: '#00c9a7',
  insight: '#a78bfa',
};

const getInitials = (name = '') =>
  name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'MM';

const Navbar = ({ collapsed, setMobileOpen, profileImage: profileImageProp }) => {
  const profileImage = profileImageProp || localStorage.getItem('mm_profile_image') || '';
  const { user, logout } = useAuth();

  // ── Tell DashboardPage which section to show ──────────────────────────────
  const handleNotifClick = (n) => {
    setNotifOpen(false);
    if (n.link?.section) {
      window.dispatchEvent(new CustomEvent('navigate-section', { detail: n.link.section }));
    }
  };

  const [notifOpen,    setNotifOpen]    = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [searchFocus,  setSearchFocus]  = useState(false);
  const [activeInfo,   setActiveInfo]   = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [notifLoading,  setNotifLoading]  = useState(false);

  // Search state
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);

  const notifRef    = useRef();
  const profileRef  = useRef();
  const searchRef   = useRef();
  const debounceRef = useRef();

  const initials = getInitials(user?.name);

  // ── Fetch real notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const [expRes, budgetRes] = await Promise.all([
        api.get('/expenses?limit=500'),
        api.get('/expenses/budget'),
      ]);
      const expenses = expRes.data?.expenses || [];
      const budget   = Number(budgetRes.data?.budget || 0);
      setNotifications(buildNotifications(expenses, budget));
    } catch (err) {
      console.error('Notifications fetch failed:', err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // ── On mount: fetch once ─────────────────────────────────────────────────
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Listen for expense changes from ExpensesTable ────────────────────────
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('expense-added', handler);
    return () => window.removeEventListener('expense-added', handler);
  }, [fetchNotifications]);

  const handleNotifToggle = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setProfileOpen(false);
    setActiveInfo(null);
    if (opening) fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // ── Live search with debounce ────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const res = await api.get('/expenses?limit=500');
      const all = res.data.expenses || [];
      const lower = q.toLowerCase();
      const filtered = all.filter((e) =>
        (e.title    || '').toLowerCase().includes(lower) ||
        (e.category || '').toLowerCase().includes(lower) ||
        (e.note     || '').toLowerCase().includes(lower) ||
        String(e.amount).includes(lower)
      ).slice(0, 8);
      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, doSearch]);

  // ── Outside click handler ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target))  setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInfoClick = (section) => {
    setActiveInfo(activeInfo === section ? null : section);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  return (
    <>
      <header className={`navbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="navbar-left">
          <button className="navbar-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="navbar-brand">
            <img src={logoImg} alt="MoneyMap" className="navbar-logo-img" />
            <span className="navbar-logo-text">MoneyMap</span>
          </div>

          <nav className="navbar-links">
            {['about', 'help', 'contact'].map((key) => (
              <button key={key} type="button"
                className={`navbar-link navbar-info-btn ${activeInfo === key ? 'active' : ''}`}
                onClick={() => handleInfoClick(key)}>
                {key === 'about' ? 'About Us' : key === 'help' ? 'Help & Support' : 'Contact'}
              </button>
            ))}
          </nav>
        </div>

        <div className="navbar-right">

          {/* ── Search ── */}
          <div className="navbar-search-wrap" ref={searchRef}>
            <div className={`navbar-search ${searchFocus ? 'focused' : ''}`}>
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search expenses, category..."
                className="navbar-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocus(true); if (searchQuery.trim()) setSearchOpen(true); }}
                onBlur={() => setSearchFocus(false)}
              />
              {searchQuery
                ? <button className="search-clear-btn" onMouseDown={clearSearch}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                : <kbd className="search-kbd">⌘K</kbd>
              }
            </div>

            {/* Search Popup */}
            {searchOpen && (
              <div className="search-popup">
                <div className="search-popup-header">
                  <span className="search-popup-label">
                    {searchLoading ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                  </span>
                </div>
                {searchLoading && (
                  <div className="search-popup-loading"><div className="search-spinner" /></div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="search-popup-empty">
                    <AppIcon name="inbox" size={28} color="var(--text-muted)" />
                    <p>No expenses found</p>
                    <span>Try a different keyword or category</span>
                  </div>
                )}
                {!searchLoading && searchResults.map((exp) => {
                  const conf = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS['Other'];
                  return (
                    <div key={exp._id} className="search-result-item">
                      <span className="search-result-dot" style={{ background: conf.color }} />
                      <div className="search-result-info">
                        <p className="search-result-title">{exp.title}</p>
                        <span className="search-result-cat" style={{ background: conf.bg, color: conf.color }}>{exp.category}</span>
                        {exp.note && <span className="search-result-note">{exp.note}</span>}
                      </div>
                      <div className="search-result-right">
                        <span className="search-result-amount">₹{Number(exp.amount || 0).toLocaleString('en-IN')}</span>
                        <span className="search-result-date">
                          {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Notifications ── */}
          <div className="navbar-notif-wrap" ref={notifRef}>
            <button className="navbar-icon-btn" onClick={handleNotifToggle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <span className="notif-title">Notifications</span>
                  {unreadCount > 0
                    ? <span className="notif-unread-tag">{unreadCount} new</span>
                    : <span className="notif-unread-tag" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8' }}>All read</span>
                  }
                </div>

                <div className="notif-list">
                  {notifLoading ? (
                    <div className="notif-loading">
                      <div className="search-spinner" />
                      <span>Loading...</span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notif-empty">
                      <AppIcon name="bell" size={28} color="var(--text-muted)" />
                      <p>All caught up!</p>
                      <span>No notifications right now</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${n.unread ? 'unread' : ''} ${n.link ? 'clickable' : ''}`}
                        onClick={() => handleNotifClick(n)}
                        style={{ cursor: n.link ? 'pointer' : 'default' }}
                      >
                        <span className="notif-icon"
                          style={{ background: `${NOTIF_ICON_COLOR[n.type]}18`, color: NOTIF_ICON_COLOR[n.type] }}>
                          <AppIcon name={n.icon} size={15} strokeWidth={2.2} />
                        </span>
                        <div className="notif-item-content">
                          <p className="notif-item-title">{n.title}</p>
                          <p className="notif-item-msg">{n.msg}</p>
                          <p className="notif-item-time">{n.time}</p>
                        </div>
                        {n.unread && <div className="notif-dot" style={{ background: NOTIF_ICON_COLOR[n.type] }} />}
                      </div>
                    ))
                  )}
                </div>

                <div className="notif-footer">
                  <button className="btn btn-ghost" onClick={fetchNotifications}
                    style={{ fontSize: 12, padding: '6px 12px', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AppIcon name="refresh-cw" size={12} />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Profile ── */}
          <div className="navbar-profile-wrap" ref={profileRef}>
            <button className="navbar-profile-btn" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setActiveInfo(null); }}>
              <div className="navbar-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {profileImage
                  ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  : initials}
              </div>
              <div className="navbar-profile-info">
                <span className="navbar-profile-name">{user?.name || 'User'}</span>
              </div>
              <svg className={`profile-chevron ${profileOpen ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {profileImage
                    ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    : initials}
                </div>
                  <div>
                    <p className="profile-dropdown-name">{user?.name || 'User'}</p>
                    <p className="profile-dropdown-email">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="profile-dropdown-divider" />
                {[
                  { icon: 'eye',      label: 'View Profile', section: 'view-profile',   expandParent: 'profile' },
                  { icon: 'settings', label: 'Settings',     section: 'update-profile', expandParent: 'profile' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileOpen(false);
                      window.dispatchEvent(
                        new CustomEvent('navigate-section', {
                          detail: { section: item.section, expandParent: item.expandParent },
                        })
                      );
                    }}
                  >
                    <AppIcon name={item.icon} size={15} strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="profile-dropdown-divider" />
                <button className="profile-dropdown-item danger" onClick={logout}>
                  <AppIcon name="logout" size={15} strokeWidth={2.1} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Info Panels ── */}
      {activeInfo && (
        <div className="navbar-info-panel">
          <div className="navbar-info-card">
            <button type="button" className="navbar-info-close" onClick={() => setActiveInfo(null)} aria-label="Close">×</button>
            {activeInfo === 'about'   && (<><h3>About MoneyMap</h3><p>MoneyMap is a modern expense tracking platform designed to help users manage their money in a smarter and simpler way.</p><p>Track daily expenses, set monthly budgets, analyze spending patterns, and understand where your money is being spent.</p></>)}
            {activeInfo === 'help'    && (<><h3>Help & Support</h3><p>Use MoneyMap to add expenses, manage monthly budgets, view analytics, check smart insights, and track your spending through the calendar.</p><p>If something is not showing correctly, check your expense details, selected month/year, and monthly budget settings.</p></>)}
            {activeInfo === 'contact' && (<><h3>Contact Us</h3><p>Need help, want to give feedback, or facing a technical issue? Reach out to the MoneyMap support team.</p><p><strong>Email:</strong> moneymap2026@gmail.com</p><p><strong>Response Time:</strong> Within 24 hours</p></>)}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;