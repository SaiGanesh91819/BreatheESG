import React from 'react';
import './SideNavBar.css';

export default function SideNavBar({ activeScreen, setActiveScreen, user, onLogout }) {
  const navItems = [
    { id: 'ingestion', label: 'Ingestion Queue', icon: 'queue' },
    { id: 'review', label: 'Data Review Hub', icon: 'fact_check' },
    { id: 'ledger', label: 'Emissions Ledger', icon: 'account_balance_wallet' },
    { id: 'settings', label: 'Tenant Settings', icon: 'settings' },
  ];

  return (
    <nav className="sidenav-container" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidenav-brand-header">
        <div className="sidenav-logo-box">B</div>
        <div>
          <h1 className="sidenav-title">Breathe ESG</h1>
          <p className="sidenav-subtitle">Sustainability Hub</p>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="sidenav-list">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => setActiveScreen(item.id)}
                className={`sidenav-btn ${isActive ? 'active' : ''}`}
              >
                <span 
                  className="material-symbols-outlined" 
                  style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
                >
                  {item.icon}
                </span>
                <span className="sidenav-btn-text">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom User Info & Sign Out Trigger */}
      <div className="sidenav-user-footer">
        <div 
          className="sidenav-user-card" 
          onClick={onLogout} 
          title="Click to Sign Out" 
          style={{ cursor: 'pointer' }}
        >
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD02W4VGf1Lf2CgHT-4tMkVMN-c5TCLHSY0efBwg52G5lyFecayCk_QepzBQ2h8etGsLwwinlatgXTJ5GfMQ0m2U_epBFeJWRUdrCidYEIEgLttdwJ5H7rOp04xgSF3ohkmMq8FF8DY18LA-QLkhcKkif84KfLNq33UM4sBmUIwV6F0CYtahZbnf-ciswoKj5UYDQ-CF5T8rbSfop5wM2yaJNvUxUgYqBkYEFuR4VZYJJMpQGNNL9WVbQ-3vCW7RnJn4BqI-UX6rw4"
            alt="User Profile"
            className="sidenav-avatar"
          />
          <div className="sidenav-user-info">
            <p className="sidenav-username">
              {user ? `${user.first_name} ${user.last_name}` : 'Sai Ganesh'}
            </p>
            <p className="sidenav-user-role">
              {user 
                ? (user.role === 'analyst' ? 'Sustainability Analyst' : user.role === 'auditor' ? 'Auditor' : 'Administrator') 
                : 'Sustainability Analyst'}
            </p>
            <span className="signout-tooltip">Sign Out</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
