import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/shared/Toast/ToastContext';
import './TenantSettings.css';

export default function TenantSettings({ activeTenant }) {
  const { showToast } = useToast();
  const [tenantName, setTenantName] = useState('Global Retail Corp');
  const [selectedFacility, setSelectedFacility] = useState('UK Facility');
  const [facilities, setFacilities] = useState([]);
  
  // Form for adding new custom plant mapping registries in real-time
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // Fetch resolved facility plant registries dynamically from Django
  const fetchFacilities = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/core/facilities/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': activeTenant
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
      }
    } catch (e) {
      console.error('Failed to load facility registers from API.', e);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [activeTenant]);

  const handleAddFacility = async (e) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/core/facilities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': activeTenant
        },
        body: JSON.stringify({ code: newCode, name: newName })
      });

      if (response.ok) {
        const data = await response.json();
        setFacilities((prev) => [data, ...prev]);
        setNewCode('');
        setNewName('');
        showToast('Custom facility mapping successfully logged in Django SQL registry!', 'success');
      } else {
        showToast('Failed to log facility mapping to backend database.', 'error');
      }
    } catch (err) {
      console.error('Error logging facility:', err);
      showToast('Network error connecting to Django backend.', 'error');
    }
  };

  return (
    <div className="tenant-settings-container">
      <header className="screen-header">
        <h2 className="screen-title">Tenant Settings</h2>
        <p className="screen-subtitle">Manage facility mappings, custom emission factors, and normalizers.</p>
      </header>

      <div className="settings-split-grid">
        {/* Left Side: Create Custom Plant Mapping Codes */}
        <div className="settings-card">
          <h3 className="settings-subheading">Log Custom Facility Mapping</h3>
          <p className="settings-desc">
            Register new ERP code maps directly into your active tenant ledger context.
          </p>
          <form className="settings-form" onSubmit={handleAddFacility}>
            <div className="form-item">
              <label className="form-label">Incoming ERP/Meter Code</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="form-input"
                placeholder="e.g. Werk-HAM"
              />
            </div>
            <div className="form-item">
              <label className="form-label">Canonical Facility Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="form-input"
                placeholder="e.g. Hamburg Assembly Plant"
              />
            </div>
            <button type="submit" className="settings-save-btn">Log Facility Mapping</button>
          </form>
        </div>

        {/* Right Side: Live Mapping registries from Database */}
        <div className="settings-card">
          <h3 className="settings-subheading">Plant Code Mappings</h3>
          <p className="settings-desc">
            Resolves incoming ERP codes and portal meter IDs to canonical organizational locations.
          </p>
          <div className="mapping-list">
            <table className="mapping-table">
              <thead>
                <tr className="mapping-th-row">
                  <th className="mapping-th">Incoming Code</th>
                  <th className="mapping-th">Resolved Facility</th>
                </tr>
              </thead>
              <tbody className="mapping-tbody">
                {facilities.length > 0 ? (
                  facilities.map((reg, idx) => (
                    <tr key={idx} className="mapping-tr">
                      <td className="mapping-td font-mono font-bold">{reg.code}</td>
                      <td className="mapping-td">{reg.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="empty-table-cell">
                      No custom mapping rules logged for this tenant context.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
