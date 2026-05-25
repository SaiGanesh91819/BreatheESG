import React, { useState } from 'react';
import './TenantSettings.css';

export default function TenantSettings() {
  const [tenantName, setTenantName] = useState('Global Retail Corp');
  const [selectedFacility, setSelectedFacility] = useState('UK Facility');

  const facilityRegistries = [
    { code: ' Werk-MUC', facility: 'München-01 Plant', scope: 'Scope 1 (Stationary)' },
    { code: 'Werk-BER', facility: 'Berlin-HQ Office', scope: 'Scope 1 (Fleet) & Scope 2' },
    { code: 'Meter-UK-04', facility: 'National Grid UK Meter', scope: 'Scope 2 (Electricity)' },
    { code: 'Concur-DE', facility: 'Corporate Travel Account', scope: 'Scope 3 (Business Travel)' },
  ];

  return (
    <div className="tenant-settings-container">
      <header className="screen-header">
        <h2 className="screen-title">Tenant Settings</h2>
        <p className="screen-subtitle">Manage facility mappings, custom emission factors, and normalizers.</p>
      </header>

      <div className="settings-split-grid">
        {/* Left Side: General config */}
        <div className="settings-card">
          <h3 className="settings-subheading">General Parameters</h3>
          <form className="settings-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-item">
              <label className="form-label">Enterprise Name</label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-item">
              <label className="form-label">Active Hub Segment</label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="form-select"
              >
                <option>UK Facility</option>
                <option>German Plant segment</option>
                <option>US Headquarters</option>
              </select>
            </div>
            <button className="settings-save-btn">Save Changes</button>
          </form>
        </div>

        {/* Right Side: Mapping registries (crucial for SAP code mapping) */}
        <div className="settings-card">
          <h3 className="settings-subheading">Plant Code Mappings</h3>
          <p className="settings-desc">
            Resolves unlabelled ERP codes and portal meter IDs to canonical organizational scopes.
          </p>
          <div className="mapping-list">
            <table className="mapping-table">
              <thead>
                <tr className="mapping-th-row">
                  <th className="mapping-th">Incoming Code</th>
                  <th className="mapping-th">Resolved Facility</th>
                  <th className="mapping-th">Assigned Scope</th>
                </tr>
              </thead>
              <tbody className="mapping-tbody">
                {facilityRegistries.map((reg, idx) => (
                  <tr key={idx} className="mapping-tr">
                    <td className="mapping-td font-mono font-bold">{reg.code}</td>
                    <td className="mapping-td">{reg.facility}</td>
                    <td className="mapping-td">
                      <span className="scope-badge">{reg.scope}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
