// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';          // ← pulls in dashboard.css via @import
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);