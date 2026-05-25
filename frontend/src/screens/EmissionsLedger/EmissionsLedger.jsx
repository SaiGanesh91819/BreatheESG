import React from 'react';
import './EmissionsLedger.css';

export default function EmissionsLedger({ records }) {
  const approvedRecords = records.filter(rec => rec.status === 'Approved');
  
  // Calculate summaries
  const totalEmissions = approvedRecords.reduce((sum, rec) => sum + rec.calcEmissions, 0).toFixed(2);
  const scope1Emissions = approvedRecords.filter(rec => rec.scope === 'Scope 1').reduce((sum, rec) => sum + rec.calcEmissions, 0).toFixed(2);
  const scope2Emissions = approvedRecords.filter(rec => rec.scope === 'Scope 2').reduce((sum, rec) => sum + rec.calcEmissions, 0).toFixed(2);
  const scope3Emissions = approvedRecords.filter(rec => rec.scope === 'Scope 3').reduce((sum, rec) => sum + rec.calcEmissions, 0).toFixed(2);

  return (
    <div className="emissions-ledger-container">
      <header className="screen-header">
        <h2 className="screen-title">Emissions Ledger</h2>
        <p className="screen-subtitle">Auditable repository of signed-off carbon calculations.</p>
      </header>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Total Verified Emissions</span>
          <span className="metric-val">{totalEmissions} <span className="metric-unit">t CO2e</span></span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Scope 1 (Direct)</span>
          <span className="metric-val">{scope1Emissions} <span className="metric-unit">t CO2e</span></span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Scope 2 (Indirect)</span>
          <span className="metric-val">{scope2Emissions} <span className="metric-unit">t CO2e</span></span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Scope 3 (Value Chain)</span>
          <span className="metric-val">{scope3Emissions} <span className="metric-unit">t CO2e</span></span>
        </div>
      </div>

      {/* Ledger Table */}
      <h3 className="ledger-subheading">Audited Entries</h3>
      <div className="table-card">
        <div className="table-scroll-wrapper">
          <table className="ledger-table">
            <thead>
              <tr className="ledger-th-row">
                <th className="ledger-th">Record ID</th>
                <th className="ledger-th">Source</th>
                <th className="ledger-th">Facility</th>
                <th className="ledger-th">Scope</th>
                <th className="ledger-th text-right">Activity Quantity</th>
                <th className="ledger-th text-right">Calculated Emissions</th>
                <th className="ledger-th text-center">Audit Lock</th>
              </tr>
            </thead>
            <tbody className="ledger-tbody">
              {approvedRecords.length > 0 ? (
                approvedRecords.map((rec) => (
                  <tr key={rec.id} className="ledger-tr">
                    <td className="ledger-td font-mono font-bold">#ESG-{rec.id.toString().slice(-4)}</td>
                    <td className="ledger-td">{rec.source}</td>
                    <td className="ledger-td">{rec.facility}</td>
                    <td className="ledger-td">
                      <span className="scope-badge">{rec.scope}</span>
                    </td>
                    <td className="ledger-td text-right font-medium">{rec.rawValue}</td>
                    <td className="ledger-td text-right font-mono font-bold text-primary">{rec.calcEmissions} t</td>
                    <td className="ledger-td text-center">
                      <span className="material-symbols-outlined lock-icon text-success">lock</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No approved entries in the general ledger yet. Approve items in the Data Review Hub first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
