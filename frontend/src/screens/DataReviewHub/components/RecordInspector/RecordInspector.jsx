import React from 'react';
import './RecordInspector.css';

export default function RecordInspector({ record, onClose, onApprove, onFlag }) {
  if (!record) return null;

  return (
    <>
      {/* Background Overlay */}
      <div className="inspector-overlay active animate-fade-in" onClick={onClose}></div>

      {/* Drawer Container */}
      <div className="inspector-drawer active animate-slide-in">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-info">
            <h3 className="drawer-title">Record Inspector</h3>
            <p className="drawer-subtitle">
              {record.scope} - {record.scope === 'Scope 1' ? 'Direct' : record.scope === 'Scope 2' ? 'Indirect' : 'Value Chain'} Emissions
            </p>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close Inspector">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Details Section */}
          <div className="drawer-section">
            <h4 className="section-heading">Source Details</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Source System</span>
                <span className="detail-val">{record.source}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Facility/Plant</span>
                <span className="detail-val">{record.facility}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ingest Date</span>
                <span className="detail-val">{record.ingestDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`status-badge-pill ${record.status.toLowerCase()}`}>
                  <span className="status-pill-dot"></span>
                  {record.status}
                </span>
              </div>
            </div>
          </div>

          {record.comment && (
            <div className="drawer-section anomaly-comment-box">
              <h4 className="section-heading text-warning">Anomaly Flag Detail</h4>
              <p className="anomaly-text">{record.comment}</p>
            </div>
          )}

          <hr className="drawer-divider" />

          {/* Normalization Ledger */}
          <div className="drawer-section">
            <h4 className="section-heading">Normalization Ledger</h4>
            <div className="timeline-trail">
              <div className="trail-line"></div>
              <div className="trail-nodes">
                <div className="trail-node">
                  <div className="node-dot bg-dim"></div>
                  <div className="node-info">
                    <span className="node-label">Raw Input</span>
                    <span className="node-val font-semibold">{record.rawValue}</span>
                  </div>
                </div>

                <div className="trail-node">
                  <div className="node-dot bg-dim"></div>
                  <div className="node-info">
                    <span className="node-label">Conversion Metric</span>
                    <span className="node-val">
                      {record.scope === 'Scope 1' ? '0.84 kg/L density factor' : 'Standard SI metrics'}
                    </span>
                  </div>
                </div>

                <div className="trail-node">
                  <div className="node-dot bg-dim"></div>
                  <div className="node-info">
                    <span className="node-label">Emission Factor</span>
                    <span className="node-val">
                      {record.scope === 'Scope 1' ? '3.15 kg CO2e / kg fuel' : record.scope === 'Scope 2' ? '0.35 kg CO2e / kWh grid' : 'DEFRA standard values'}
                    </span>
                  </div>
                </div>

                <div className="trail-node">
                  <div className="node-dot bg-primary"></div>
                  <div className="node-info">
                    <span className="node-label">Calculated Total</span>
                    <span className="node-val font-bold text-lg">{record.calcEmissions} tonnes CO2e</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* Audit Trail */}
          <div className="drawer-section">
            <h4 className="section-heading">Audit Trail</h4>
            <div className="timeline-trail">
              <div className="trail-line"></div>
              <div className="trail-nodes">
                {record.auditTrail && record.auditTrail.map((audit, idx) => (
                  <div key={idx} className="trail-node">
                    <div className={`node-dot ${idx === record.auditTrail.length - 1 ? 'bg-primary' : 'bg-dim'}`}></div>
                    <div className="node-info">
                      <span className="node-time font-mono">{audit.time}</span>
                      <span className="node-val font-medium">{audit.action}</span>
                      <span className="node-user">by {audit.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Actions */}
        <div className="drawer-footer">
          {record.status !== 'Approved' && (
            <button className="btn-approve-lock" onClick={() => onApprove(record.id)}>
              <span className="material-symbols-outlined btn-icon">lock</span>
              Approve &amp; Lock
            </button>
          )}
          <div className="footer-subactions">
            {record.status !== 'Suspicious' && (
              <button className="btn-flag-anomaly" onClick={() => onFlag(record.id)}>
                Flag as Anomaly
              </button>
            )}
            <button className="btn-edit-fields">
              Edit Raw Fields
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
