import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './MonthYearPicker.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MonthYearPicker = ({ selectedMonth, selectedYear, onChange }) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close on outside click — checks both trigger and portal dropdown
  useEffect(() => {
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setOpen(o => !o);
  };

  const handleSelect = (monthIndex) => {
    onChange(monthIndex, viewYear);
    setOpen(false);
  };

  const isCurrentMonth = (m, y) => m === selectedMonth && y === selectedYear;
  const isToday = (m, y) => {
    const now = new Date();
    return m === now.getMonth() && y === now.getFullYear();
  };

  const dropdown = open && ReactDOM.createPortal(
    <div
      className="myp-dropdown"
      ref={dropdownRef}
      style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left }}
    >
      {/* Year navigation */}
      <div className="myp-year-nav">
        <button className="myp-year-btn" onClick={() => setViewYear(y => y - 1)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="myp-year-label">{viewYear}</span>
        <button
          className="myp-year-btn"
          onClick={() => setViewYear(y => y + 1)}
          disabled={viewYear >= new Date().getFullYear()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Month grid */}
      <div className="myp-months-grid">
        {MONTHS_SHORT.map((m, i) => {
          const isFuture = viewYear === new Date().getFullYear() && i > new Date().getMonth();
          return (
            <button
              key={m}
              className={`myp-month-btn ${isCurrentMonth(i, viewYear) ? 'selected' : ''} ${isToday(i, viewYear) ? 'today' : ''}`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => !isFuture && handleSelect(i)}
              disabled={isFuture}
              title={MONTHS[i]}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Quick: current month */}
      <div className="myp-footer">
        <button
          className="myp-today-btn"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => { const n = new Date(); handleSelect(n.getMonth()); setViewYear(n.getFullYear()); }}
        >
          This month
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <div className="myp-root">
      <button className="myp-trigger" ref={triggerRef} onClick={handleOpen}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{MONTHS_SHORT[selectedMonth]} {selectedYear}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {dropdown}
    </div>
  );
};

export default MonthYearPicker;