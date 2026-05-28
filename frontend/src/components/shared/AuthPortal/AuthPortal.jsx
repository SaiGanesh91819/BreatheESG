import React, { useState } from 'react';
import './AuthPortal.css';

const AUTH_API_URL = 'http://127.0.0.1:8000/api/auth';

export default function AuthPortal({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('analyst');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const payload = isLogin
      ? { username, password }
      : { username, password, email, first_name: firstName, last_name: lastName, role };

    const endpoint = isLogin ? 'login' : 'register';

    try {
      const response = await fetch(`${AUTH_API_URL}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Success
        localStorage.setItem('esg_user', JSON.stringify(data));
        onLoginSuccess(data);
      } else {
        // Handle field-specific validation errors dynamically
        if (data && typeof data === 'object') {
          const errors = [];
          for (const [key, val] of Object.entries(data)) {
            const field = key.charAt(0).toUpperCase() + key.slice(1);
            if (Array.isArray(val)) {
              errors.push(`${field}: ${val.join(' ')}`);
            } else if (typeof val === 'string') {
              errors.push(`${field}: ${val}`);
            }
          }
          if (errors.length > 0) {
            setErrorMsg(errors.join(' | '));
            setLoading(false);
            return;
          }
        }
        setErrorMsg(data.detail || 'Failed to authenticate. Please check your credentials.');
      }
    } catch (err) {
      console.error('Authentication connection error:', err);
      setErrorMsg('Failed to connect to backend server. Make sure your Django API is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-overlay">
      <div className="auth-card animate-slide-up">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">B</div>
          <h2 className="auth-title">Breathe ESG</h2>
          <p className="auth-subtitle">Sustainability & Ingestion General Ledger</p>
        </div>

        <h3 className="auth-action-title">
          {isLogin ? 'Sign In to Workspace' : 'Create Auditor Account'}
        </h3>

        {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              placeholder="e.g. saiganesh"
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-row">
                <div className="form-item flex-1">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input"
                    placeholder="Sai"
                  />
                </div>
                <div className="form-item flex-1">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input"
                    placeholder="Ganesh"
                  />
                </div>
              </div>

              <div className="form-item">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="name@breatheesg.com"
                />
              </div>

              <div className="form-item">
                <label className="form-label">Workspace Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  <option value="analyst">Sustainability Analyst</option>
                  <option value="auditor">Auditor (Read & Lock Only)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div className="form-item">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle-link">
          {isLogin ? (
            <p>
              New to Breathe ESG?{' '}
              <button onClick={() => setIsLogin(false)} className="link-btn">
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)} className="link-btn">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
