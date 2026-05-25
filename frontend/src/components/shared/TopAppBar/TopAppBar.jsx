import React from 'react';
import './TopAppBar.css';

export default function TopAppBar({ activeTenant, setActiveTenant, tenants }) {
  return (
    <header className="topbar-header">
      {/* Mobile Menu Toggle button space */}
      <button className="topbar-mobile-menu">
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Tenant Dropdown switcher */}
      <div className="topbar-tenant-selector">
        <span className="topbar-tenant-label">Tenant:</span>
        <select
          value={activeTenant}
          onChange={(e) => setActiveTenant(e.target.value)}
          className="topbar-select"
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Utility Action Buttons */}
      <div className="topbar-actions">
        <button className="topbar-icon-btn" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="topbar-badge-dot"></span>
        </button>
        <button className="topbar-icon-btn" title="Help & Documentation">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </div>
    </header>
  );
}
