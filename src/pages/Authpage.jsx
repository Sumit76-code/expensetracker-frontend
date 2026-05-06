import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/moneymap.png';
import bgVideo from '../assets/Background1.mp4';
import AppIcon from '../utils/AppIcons';
import './AuthPage.css';

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: a + b };
};

const useTypewriter = (lines, speed = 55, pauseMs = 1200) => {
  const [display, setDisplay] = useState({ lineIndex: 0, charIndex: 0, done: false });
  useEffect(() => {
    if (display.done) return;
    const { lineIndex, charIndex } = display;
    const currentLine = lines[lineIndex];
    if (charIndex < currentLine.length) {
      const t = setTimeout(() => setDisplay(p => ({ ...p, charIndex: p.charIndex + 1 })), speed);
      return () => clearTimeout(t);
    }
    if (lineIndex < lines.length - 1) {
      const t = setTimeout(() => setDisplay(p => ({ lineIndex: p.lineIndex + 1, charIndex: 0, done: false })), pauseMs);
      return () => clearTimeout(t);
    }
    setDisplay(p => ({ ...p, done: true }));
  }, [display, lines, speed, pauseMs]);
  return lines.map((line, i) => {
    if (i < display.lineIndex) return line;
    if (i === display.lineIndex) return line.slice(0, display.charIndex);
    return '';
  });
};

/* ── Modal content ──────────────────────────────────────── */
const MODAL_CONTENT = {
  about: {
    title: 'About MoneyMap',
    body: (
      <>
        <p>MoneyMap is a smart expense tracker designed to help users manage their money more effectively. It allows users to track expenses, set budgets, view spending insights, and understand their financial habits through a simple and professional dashboard.</p>
        <ul>
          <li>
            <span className="modal-list-icon"><AppIcon name="rupee" size={14} strokeWidth={2.2} /></span>
            Log daily expenses in seconds
          </li>
          <li>
            <span className="modal-list-icon"><AppIcon name="wallet" size={14} strokeWidth={2.2} /></span>
            Set and manage monthly budgets
          </li>
          <li>
            <span className="modal-list-icon"><AppIcon name="chart-pie" size={14} strokeWidth={2.2} /></span>
            Visual spending breakdowns
          </li>
          <li>
            <span className="modal-list-icon"><AppIcon name="trending-up" size={14} strokeWidth={2.2} /></span>
            Track trends over time
          </li>
          <li>
            <span className="modal-list-icon"><AppIcon name="lightbulb" size={14} strokeWidth={2.2} /></span>
            Smart insights into your habits
          </li>
          <li>
            <span className="modal-list-icon"><AppIcon name="sparkles" size={14} strokeWidth={2.2} /></span>
            Plan better, save more every month
          </li>
        </ul>
        <p className="modal-footer-note">
          <AppIcon name="info" size={12} strokeWidth={2} /> MoneyMap — Your Financial GPS
        </p>
      </>
    ),
  },
  help: {
    title: 'Help & Support',
    body: (
      <div className="modal-help-list">
        <div className="modal-help-item">
          <span className="modal-help-icon"><AppIcon name="shield" size={18} strokeWidth={2} /></span>
          <div>
            <strong>Forgot your password? </strong>
            <p>Go to Login page click on "Forgot Password".</p>
          </div>
        </div>
        <div className="modal-help-item">
          <span className="modal-help-icon"><AppIcon name="inbox" size={18} strokeWidth={2} /></span>
          <div>
            <strong>Still Stuck?</strong>
            <p>Email <a href="mailto:moneymap2026@gmail.com">moneymap2026@gmail.com</a> — we reply within 24 hrs.</p>
          </div>
        </div>
      </div>
    ),
  },
  contact: {
    title: 'Contact Us',
    body: (
      <>
        <p>Questions or feedback — we're here for you.</p>
        <div className="modal-contact-grid modal-contact-grid--2">
          <div className="modal-contact-card">
            <span className="modal-contact-icon"><AppIcon name="inbox" size={22} strokeWidth={1.8} /></span>
            <strong>Email</strong>
            <a href="mailto:moneymap2026@gmail.com">moneymap2026@gmail.com</a>
          </div>
          <div className="modal-contact-card">
            <span className="modal-contact-icon"><AppIcon name="clipboard" size={22} strokeWidth={1.8} /></span>
            <strong>Feedback</strong>
            <a href="mailto:moneymap2026@gmail.com">Drop a note</a>
          </div>
        </div>
        <p className="modal-footer-note">
          <AppIcon name="success" size={12} strokeWidth={2} /> Avg. response time: under 24 hours
        </p>
      </>
    ),
  },
};

/* ── Modal component ────────────────────────────────────── */
const InfoModal = ({ modalKey, onClose }) => {
  const content = MODAL_CONTENT[modalKey];
  if (!content) return null;
  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3 className="auth-modal-title">{content.title}</h3>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            <AppIcon name="x" size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="auth-modal-body">{content.body}</div>
      </div>
    </div>
  );
};

/* ── Main component ─────────────────────────────────────── */
const AuthPage = () => {
  const [mode, setMode]               = useState('register');
  const [activeModal, setActiveModal] = useState(null);

  // ── Register state ──
  const [regForm, setRegForm]                 = useState({ name: '', email: '', password: '', confirm: '' });
  const [regErrors, setRegErrors]             = useState({});
  const [regCaptcha, setRegCaptcha]           = useState(generateCaptcha());
  const [regCaptchaInput, setRegCaptchaInput] = useState('');
  const [regLoading, setRegLoading]           = useState(false);
  const [showRegPass, setShowRegPass]         = useState(false);
  const [showRegConfirm, setShowRegConfirm]   = useState(false);

  // ── Login state ──
  const [loginForm, setLoginForm]                 = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors]             = useState({});
  const [loginCaptcha, setLoginCaptcha]           = useState(generateCaptcha());
  const [loginCaptchaInput, setLoginCaptchaInput] = useState('');
  const [loginLoading, setLoginLoading]           = useState(false);
  const [showLoginPass, setShowLoginPass]         = useState(false);

  // ── Forgot password state ──
  const [forgotStep, setForgotStep]         = useState(1);          // 1 = email, 2 = code+new pwd
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotCode, setForgotCode]         = useState('');
  const [forgotNewPwd, setForgotNewPwd]     = useState('');
  const [forgotConfirm, setForgotConfirm]   = useState('');
  const [forgotErrors, setForgotErrors]     = useState({});
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [showForgotPwd, setShowForgotPwd]   = useState(false);
  const [showForgotCfm, setShowForgotCfm]   = useState(false);
  // Simulated OTP (in real app comes from backend)
  const [sentCode, setSentCode]             = useState('');

  const { login, register, forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const twLines      = useTypewriter(['Take control of your money with', ' MoneyMap.'], 55, 900);
  const twLoginLines = useTypewriter(['Track every ', 'rupee,', ' effortlessly.'], 55, 900);

  const refreshRegCaptcha   = () => { setRegCaptcha(generateCaptcha());   setRegCaptchaInput(''); };
  const refreshLoginCaptcha = () => { setLoginCaptcha(generateCaptcha()); setLoginCaptchaInput(''); };
  const clearErrors = () => { setRegErrors({}); setLoginErrors({}); setForgotErrors({}); };

  const openForgot = () => {
    clearErrors();
    setForgotStep(1);
    setForgotEmail('');
    setForgotCode('');
    setForgotNewPwd('');
    setForgotConfirm('');
    setSentCode('');
    setMode('forgot');
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setActiveModal(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Register validation ──
  const validateReg = () => {
    const e = {};
    if (!regForm.name.trim()) e.name = 'Name is required';
    if (!regForm.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Enter a valid email';
    if (regForm.password.length < 6) e.password = 'Min. 6 characters';
    if (regForm.password !== regForm.confirm) e.confirm = 'Passwords do not match';
    if (parseInt(regCaptchaInput) !== regCaptcha.answer) {
      e.captcha = 'Wrong answer';
      refreshRegCaptcha();
    }
    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!validateReg()) return;
    setRegLoading(true);
    try {
      await register(regForm.name, regForm.email, regForm.password);
      toast.success('Welcome to MoneyMap!', {
        icon: <AppIcon name="sparkles" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.', {
        icon: <AppIcon name="warning" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      refreshRegCaptcha();
    } finally { setRegLoading(false); }
  };

  // ── Login validation ──
  const validateLogin = () => {
    const e = {};
    if (!loginForm.email.match(/^\S+@\S+\.\S+$/)) e.email = 'Enter a valid email';
    if (!loginForm.password) e.password = 'Password is required';
    if (parseInt(loginCaptchaInput) !== loginCaptcha.answer) {
      e.captcha = 'Wrong answer';
      refreshLoginCaptcha();
    }
    setLoginErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoginLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!', {
        icon: <AppIcon name="hand" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.', {
        icon: <AppIcon name="warning" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      refreshLoginCaptcha();
    } finally { setLoginLoading(false); }
  };

  // ── Forgot — Step 1: send reset code ──
  const handleForgotSend = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!forgotEmail.match(/^\S+@\S+\.\S+$/)) errs.email = 'Enter a valid email';
    setForgotErrors(errs);
    if (Object.keys(errs).length) return;
    setForgotLoading(true);
    try {
      // Call your backend — it emails the code
      const code = await forgotPassword(forgotEmail);
      // If backend returns the code (dev mode), store it; otherwise user checks email
      if (code) setSentCode(String(code));
      toast.success('Reset code sent!', {
        icon: <AppIcon name="inbox" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      setForgotStep(2);
    } catch (err) {
      setForgotErrors({ email: err.response?.data?.message || 'Email not found.' });
    } finally { setForgotLoading(false); }
  };

  // ── Forgot — Step 2: verify code + set new password ──
  const handleForgotReset = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!forgotCode.trim()) errs.code = 'Enter the reset code';
    else if (sentCode && forgotCode.trim() !== sentCode) errs.code = 'Incorrect code';
    if (forgotNewPwd.length < 6) errs.newPwd = 'Min. 6 characters';
    if (forgotNewPwd !== forgotConfirm) errs.confirm = 'Passwords do not match';
    setForgotErrors(errs);
    if (Object.keys(errs).length) return;
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail, forgotCode, forgotNewPwd);
      toast.success('Password reset!', {
        icon: <AppIcon name="success" size={18} strokeWidth={2.4} />,
        duration: 3000,
      });
      clearErrors();
      setMode('log-open');
    } catch (err) {
      setForgotErrors({ code: err.response?.data?.message || 'Reset failed.' });
    } finally { setForgotLoading(false); }
  };

  const isLogoOnly  = mode === 'register' || mode === 'login';
  const isRegOpen   = mode === 'reg-open';
  const isLogOpen   = mode === 'log-open';
  const isForgot    = mode === 'forgot';
  const isFormOpen  = isRegOpen || isLogOpen || isForgot;
  const isRegSide   = isRegOpen || mode === 'register';

  return (
    <div className="auth-page">
      <video className="auth-video-bg" src={bgVideo} autoPlay loop muted playsInline />
      <div className="auth-overlay" />

      {/* ── TOP-RIGHT TEXT BUTTONS ─────────────────────── */}
      <div className="auth-top-links">
        <button className="auth-top-link" onClick={() => setActiveModal('about')}>About Us</button>
        <button className="auth-top-link" onClick={() => setActiveModal('help')}>Help</button>
        <button className="auth-top-link" onClick={() => setActiveModal('contact')}>Contact</button>
      </div>

      {/* ── MODAL ─────────────────────────────────────── */}
      {activeModal && <InfoModal modalKey={activeModal} onClose={() => setActiveModal(null)} />}

      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-brand">
          <img src={logo} alt="MoneyMap" />
          <span className="auth-left-brand-small">MoneyMap</span>
        </div>

        <div className="auth-left-middle">
          {isRegSide ? (
            <>
              <h1 className="auth-left-heading">
                {twLines[0]}
                <span className="tw-highlight">{twLines[1]}</span>
                {twLines[2]}
                <span className="tw-cursor" />
              </h1>
              <p className="auth-left-sub">
                Track your daily expenses in real-time.{'\n'}
                Set and manage your monthly budget easily.{'\n'}
                Get smart insights into your spending habits.{'\n'}
                View analytics with clean charts and reports.{'\n'}
                Understand where your money is going.{'\n'}
                Plan better and save more every month.
              </p>
            </>
          ) : (
            <>
              <h1 className="auth-left-heading">
                {twLoginLines[0]}
                <span className="tw-highlight">{twLoginLines[1]}</span>
                {twLoginLines[2]}
                <span className="tw-cursor" />
              </h1>
              <p className="auth-left-sub">
                Track smarter. Spend better. Save more.
Your money, your map, your control.
Manage expenses. Understand spending. Save better.
A smarter way to track your money.
Plan your budget, track your expenses, grow your savings.

              </p>
            </>
          )}
        </div>

        <div className="auth-left-footer">MoneyMap......</div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">

        {isLogoOnly && (
          <div className="auth-right-logo">
            <button
              className="auth-logo-btn"
              onClick={() => setMode(mode === 'register' ? 'reg-open' : 'log-open')}
              aria-label="Open form"
            >
              <div className="auth-logo-wrap">
                <img src={logo} alt="MoneyMap" className="auth-logo-img" />
              </div>
              <span className="auth-splash-name">MoneyMap</span>
            </button>
            <p className="auth-splash-tagline">Your Financial GPS</p>
          </div>
        )}

        {/* FORM CARD */}
        <div className={`auth-form-wrap${isFormOpen ? '' : ' auth-form-wrap--out'}`}>
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isRegOpen ? 'active' : ''}`}
              onClick={() => { clearErrors(); setMode('reg-open'); }}
            >
              Create Account
            </button>
            <button
              className={`auth-tab ${isLogOpen ? 'active' : ''}`}
              onClick={() => { clearErrors(); setMode('log-open'); }}
            >
              Sign In
            </button>
          </div>

          {/* ── REGISTER FORM ── */}
          {isRegOpen ? (
            <>
              <h2 className="auth-form-title">Create account</h2>
              <p className="auth-form-sub">Get started with MoneyMap for free</p>
              <form onSubmit={handleRegSubmit}>

                <div className="auth-form-group">
                  <label>Full Name</label>
                  <input
                    name="name"
                    value={regForm.name}
                    onChange={e => { setRegForm(p => ({ ...p, name: e.target.value })); if (regErrors.name) setRegErrors(p => ({ ...p, name: '' })); }}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  {regErrors.name && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {regErrors.name}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={regForm.email}
                    onChange={e => { setRegForm(p => ({ ...p, email: e.target.value })); if (regErrors.email) setRegErrors(p => ({ ...p, email: '' })); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {regErrors.email && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {regErrors.email}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <input
                      name="password"
                      type={showRegPass ? 'text' : 'password'}
                      value={regForm.password}
                      onChange={e => { setRegForm(p => ({ ...p, password: e.target.value })); if (regErrors.password) setRegErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowRegPass(p => !p)} tabIndex={-1}>
                      <AppIcon name={showRegPass ? 'eye' : 'eye'} size={15} strokeWidth={2} />
                    </button>
                  </div>
                  {regErrors.password && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {regErrors.password}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <label>Confirm Password</label>
                  <div className="auth-input-wrap">
                    <input
                      name="confirm"
                      type={showRegConfirm ? 'text' : 'password'}
                      value={regForm.confirm}
                      onChange={e => { setRegForm(p => ({ ...p, confirm: e.target.value })); if (regErrors.confirm) setRegErrors(p => ({ ...p, confirm: '' })); }}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowRegConfirm(p => !p)} tabIndex={-1}>
                      <AppIcon name={showRegConfirm ? 'eye' : 'eye'} size={15} strokeWidth={2} />
                    </button>
                  </div>
                  {regErrors.confirm && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {regErrors.confirm}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <label className="auth-captcha-label">
                    Verify you're human
                    <AppIcon name="shield" size={20} strokeWidth={2.3} />
                  </label>
                  <div className="auth-captcha-row">
                    <div className="auth-captcha-q">{regCaptcha.question}</div>
                    <input
                      type="number"
                      value={regCaptchaInput}
                      onChange={e => { setRegCaptchaInput(e.target.value); if (regErrors.captcha) setRegErrors(p => ({ ...p, captcha: '' })); }}
                      placeholder="Answer"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="auth-captcha-refresh" onClick={refreshRegCaptcha} title="New question">
                      <AppIcon name="refresh" size={16} strokeWidth={2.3} />
                    </button>
                  </div>
                  {regErrors.captcha && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {regErrors.captcha}
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-submit-btn" disabled={regLoading}>
                  {regLoading
                    ? <><span className="auth-spinner" /> Creating...</>
                    : <><AppIcon name="rocket" size={16} strokeWidth={2.3} /> Create Account</>
                  }
                </button>
              </form>

              <p className="auth-footer-text">
                Already have an account?{' '}
                <button onClick={() => { clearErrors(); setMode('log-open'); }}>Sign in</button>
              </p>
            </>

          ) : isForgot ? (
            /* ── FORGOT PASSWORD ── */
            <>
              {forgotStep === 1 ? (
                <>
                  <div className="auth-back-row">
                    <button className="auth-back-btn" type="button" onClick={() => { clearErrors(); setMode('log-open'); }}>
                      <AppIcon name="chevron-left" size={15} strokeWidth={2.5} /> Back to Sign In
                    </button>
                  </div>
                  <h2 className="auth-form-title">Forgot password?</h2>
                  <p className="auth-form-sub">Enter your email and we'll send a reset code.</p>
                  <form onSubmit={handleForgotSend}>
                    <div className="auth-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={e => { setForgotEmail(e.target.value); if (forgotErrors.email) setForgotErrors(p => ({ ...p, email: '' })); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                      {forgotErrors.email && (
                        <div className="auth-error">
                          <AppIcon name="warning" size={13} strokeWidth={2.4} />
                          {forgotErrors.email}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={forgotLoading}>
                      {forgotLoading
                        ? <><span className="auth-spinner" /> Sending...</>
                        : <><AppIcon name="inbox" size={16} strokeWidth={2.3} /> Send Reset Code</>
                      }
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="auth-back-row">
                    <button className="auth-back-btn" type="button" onClick={() => { setForgotStep(1); setForgotErrors({}); }}>
                      <AppIcon name="chevron-left" size={15} strokeWidth={2.5} /> Back
                    </button>
                  </div>
                  <h2 className="auth-form-title">Reset password</h2>
                  <p className="auth-form-sub">Enter the code sent to <strong>{forgotEmail}</strong></p>
                  <form onSubmit={handleForgotReset}>
                    <div className="auth-form-group">
                      <label>Reset Code</label>
                      <div className="auth-input-wrap">
                        <input
                          type="text"
                          value={forgotCode}
                          onChange={e => { setForgotCode(e.target.value); if (forgotErrors.code) setForgotErrors(p => ({ ...p, code: '' })); }}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                      </div>
                      {forgotErrors.code && (
                        <div className="auth-error">
                          <AppIcon name="warning" size={13} strokeWidth={2.4} />
                          {forgotErrors.code}
                        </div>
                      )}
                    </div>
                    <div className="auth-form-group">
                      <label>New Password</label>
                      <div className="auth-input-wrap">
                        <input
                          type={showForgotPwd ? 'text' : 'password'}
                          value={forgotNewPwd}
                          onChange={e => { setForgotNewPwd(e.target.value); if (forgotErrors.newPwd) setForgotErrors(p => ({ ...p, newPwd: '' })); }}
                          placeholder="Min. 6 characters"
                          autoComplete="new-password"
                        />
                        <button type="button" className="auth-eye-btn" onClick={() => setShowForgotPwd(p => !p)} tabIndex={-1}>
                          <AppIcon name="eye" size={15} strokeWidth={2} />
                        </button>
                      </div>
                      {forgotErrors.newPwd && (
                        <div className="auth-error">
                          <AppIcon name="warning" size={13} strokeWidth={2.4} />
                          {forgotErrors.newPwd}
                        </div>
                      )}
                    </div>
                    <div className="auth-form-group">
                      <label>Confirm New Password</label>
                      <div className="auth-input-wrap">
                        <input
                          type={showForgotCfm ? 'text' : 'password'}
                          value={forgotConfirm}
                          onChange={e => { setForgotConfirm(e.target.value); if (forgotErrors.confirm) setForgotErrors(p => ({ ...p, confirm: '' })); }}
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                        />
                        <button type="button" className="auth-eye-btn" onClick={() => setShowForgotCfm(p => !p)} tabIndex={-1}>
                          <AppIcon name="eye" size={15} strokeWidth={2} />
                        </button>
                      </div>
                      {forgotErrors.confirm && (
                        <div className="auth-error">
                          <AppIcon name="warning" size={13} strokeWidth={2.4} />
                          {forgotErrors.confirm}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={forgotLoading}>
                      {forgotLoading
                        ? <><span className="auth-spinner" /> Resetting...</>
                        : <><AppIcon name="success" size={16} strokeWidth={2.3} /> Reset Password</>
                      }
                    </button>
                  </form>
                </>
              )}
            </>

          ) : (
            /* ── LOGIN FORM ── */
            <>
              <h2 className="auth-form-title">Welcome back</h2>
              <p className="auth-form-sub">Sign in to your MoneyMap account</p>
              <form onSubmit={handleLoginSubmit} autoComplete="off">

                <div className="auth-form-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={loginForm.email}
                    onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); if (loginErrors.email) setLoginErrors(p => ({ ...p, email: '' })); }}
                    placeholder="you@example.com"
                    autoComplete="new-email"
                  />
                  {loginErrors.email && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {loginErrors.email}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <div className="auth-label-row">
                    <label>Password</label>
                    <button type="button" className="auth-forgot-link" onClick={openForgot}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="auth-input-wrap">
                    <input
                      name="password"
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); if (loginErrors.password) setLoginErrors(p => ({ ...p, password: '' })); }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-eye-btn" onClick={() => setShowLoginPass(p => !p)} tabIndex={-1}>
                      <AppIcon name="eye" size={15} strokeWidth={2} />
                    </button>
                  </div>
                  {loginErrors.password && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {loginErrors.password}
                    </div>
                  )}
                </div>

                <div className="auth-form-group">
                  <label className="auth-captcha-label">
                    Verify you're human
                    <AppIcon name="shield" size={20} strokeWidth={2.3} />
                  </label>
                  <div className="auth-captcha-row">
                    <div className="auth-captcha-q">{loginCaptcha.question}</div>
                    <input
                      type="number"
                      value={loginCaptchaInput}
                      onChange={e => { setLoginCaptchaInput(e.target.value); if (loginErrors.captcha) setLoginErrors(p => ({ ...p, captcha: '' })); }}
                      placeholder="Answer"
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="auth-captcha-refresh" onClick={refreshLoginCaptcha} title="New question">
                      <AppIcon name="refresh" size={16} strokeWidth={2.3} />
                    </button>
                  </div>
                  {loginErrors.captcha && (
                    <div className="auth-error">
                      <AppIcon name="warning" size={13} strokeWidth={2.4} />
                      {loginErrors.captcha}
                    </div>
                  )}
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loginLoading}>
                  {loginLoading
                    ? <><span className="auth-spinner" /> Signing in...</>
                    : <><AppIcon name="trending-up" size={16} strokeWidth={2.3} /> Sign In</>
                  }
                </button>
              </form>

              <p className="auth-footer-text">
                Don't have an account?{' '}
                <button onClick={() => { clearErrors(); setMode('reg-open'); }}>Create one</button>
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthPage;