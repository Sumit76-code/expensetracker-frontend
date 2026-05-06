// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import AppIcon from '../utils/AppIcons';
import video from '../assets/Background1.mp4';

const menuItems = [
  {
    id: 'profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
    label: 'Profile',
    submenu: [
  { id: 'view-profile', label: 'View Profile', icon: 'eye' },
  { id: 'update-profile', label: 'Update Profile', icon: 'user-pen' },
  { id: 'delete-profile', label: 'Delete Profile', icon: 'user-x', danger: true },
],
  },
  {
    id: 'budget',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    label: 'Monthly Budget',
    submenu: [
     { id: 'show-budget', label: 'Show Budget', icon: 'wallet-cards' },
     { id: 'edit-budget', label: 'Edit Budget', icon: 'pencil' },
    ],
  },
  {
    id: 'smart-insight',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    label: 'Smart Insight',
    badge: 'AI',
    submenu: [
      { id: 'top-category', label: 'Top Spending Category', icon: 'flame' },
    ],
  },
  {
    id: 'spending',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    label: 'Spending Insight',
    submenu: [
      { id: 'daily-avg', label: 'Daily Average', icon: 'calendar' },
      { id: 'predicted', label: 'Predicted Monthly', icon: 'sparkles' },
      { id: 'remaining', label: 'Remaining Budget', icon: 'wallet' },
      { id: 'highest', label: 'Highest Spend Day', icon: 'trending-up' },
    ],
  },
  {
    id: 'expenses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    label: 'Expenses',
    submenu: [
      { id: 'add-expense', label: 'Add Expense', icon: 'plus' },
      { id: 'view-expenses', label: 'View Expenses', icon: 'clipboard' },
    ],
  },
  {
    id: 'analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
      </svg>
    ),
    label: 'Analytics',
    submenu: [
      { id: 'charts', label: 'Charts & Graphs', icon: 'chart-pie' },
    ],
  },
  {
    id: 'calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8"  y1="2" x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
      </svg>
    ),
    label: 'Calendar',
    submenu: [
      { id: 'date-wise', label: 'Date-wise Expenses', icon: 'calendar' },
    ],
  },
];

const Sidebar = ({ activeSection, setActiveSection, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { logout } = useAuth();
  const [expandedItem, setExpandedItem] = useState(null);

  const handleItemClick = (itemId) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  const handleSubClick = (subId) => {
    setActiveSection(subId);
    if (window.innerWidth <= 768) setMobileOpen(false);
  };
const handleDashboardClick = () => {
  setActiveSection('dashboard');
  setExpandedItem(null);

  if (window.innerWidth <= 768) {
    setMobileOpen(false);
  }
};
  const handleLogout = () => {
    logout();
  };


  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <video className="sidebar-video-bg" src={video} autoPlay loop muted playsInline />
        <div className="sidebar-video-overlay" />
        <button
  className={`sidebar-nav-item sidebar-dashboard-item ${
    activeSection === 'dashboard' ? 'active-parent' : ''
  }`}
  onClick={handleDashboardClick}
  title={collapsed ? 'Dashboard' : undefined}
>
  <span className="nav-item-icon">
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  </span>

  {!collapsed && <span className="nav-item-label">Dashboard</span>}
</button>

<div className="sidebar-divider" />
        {/* ── Nav ── */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id} className="sidebar-nav-group">
              <button
                className={`sidebar-nav-item ${expandedItem === item.id ? 'expanded' : ''} ${activeSection?.startsWith(item.id) ? 'active-parent' : ''}`}
                onClick={() => handleItemClick(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                    <span className={`nav-chevron ${expandedItem === item.id ? 'open' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </span>
                  </>
                )}
              </button>

              {!collapsed && expandedItem === item.id && (
                <div className="sidebar-submenu">

  {item.submenu.map((sub) => (
                    <button
                      key={sub.id}
                      className={`sidebar-submenu-item ${activeSection === sub.id ? 'active' : ''} ${sub.danger ? 'danger' : ''}`}
                      onClick={() => handleSubClick(sub.id)}
                    >
                      <span className="submenu-icon">
                        <AppIcon name={sub.icon} size={14} strokeWidth={2.1} />
                      </span>
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div className="sidebar-footer">
          <div className="sidebar-divider" />
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;