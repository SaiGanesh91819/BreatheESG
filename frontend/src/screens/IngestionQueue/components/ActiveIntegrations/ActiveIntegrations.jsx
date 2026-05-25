import React from 'react';
import './ActiveIntegrations.css';

export default function ActiveIntegrations() {
  const integrations = [
    {
      id: 'sap',
      title: 'SAP Portal Ingestion',
      category: 'Fuel & Procurement',
      status: 'Connected',
      statusType: 'success',
      icon: 'dataset',
      iconBg: 'var(--primary-container)',
      iconColor: '#ffffff',
    },
    {
      id: 'utility',
      title: 'Utility Portal CSV Parser',
      category: 'Electricity & Water',
      status: 'Syncing',
      statusType: 'info',
      icon: 'bolt',
      iconBg: 'var(--surface-variant)',
      iconColor: '#071810',
    },
    {
      id: 'concur',
      title: 'Concur API Feed',
      category: 'Travel & Flights',
      status: 'Auth Required',
      statusType: 'error',
      icon: 'flight_takeoff',
      iconBg: 'var(--surface-variant)',
      iconColor: '#071810',
    },
  ];

  return (
    <div className="active-integrations-section">
      <h3 className="integrations-title">Active Integrations</h3>
      <div className="integrations-grid">
        {integrations.map((item) => (
          <div key={item.id} className="integration-card group">
            <div className="card-bg-accent"></div>
            <div className="card-content">
              <div className="card-header">
                <div 
                  className="card-icon-box"
                  style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <span className={`status-badge ${item.statusType}`}>
                  {item.statusType === 'info' && <span className="status-dot"></span>}
                  {item.status}
                </span>
              </div>
              <div className="card-body">
                <h4 className="card-title">{item.title}</h4>
                <p className="card-category">{item.category}</p>
              </div>
            </div>
            <div className="card-footer">
              <span>Configure Source</span>
              <span className="material-symbols-outlined footer-arrow">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
