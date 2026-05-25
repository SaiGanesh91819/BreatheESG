import React from 'react';
import './RawFilePreview.css';

export default function RawFilePreview({ fileName, onCancel, onProcess }) {
  const mockHeaders = [
    'Datum (Billing Date)',
    'Werk (Facility)',
    'Kraftstoffart (Fuel Type)',
    'Kraftstoffmenge (Volume)',
    'Einheit (Unit)',
    'Status',
  ];

  const mockRows = [
    {
      date: '2023-07-01',
      facility: 'München-01',
      fuel: 'Diesel',
      volume: '450.5',
      unit: 'Liter',
      status: 'Raw',
      statusType: 'raw',
    },
    {
      date: '2023-07-05',
      facility: 'München-01',
      fuel: 'Benzin E10',
      volume: '210.0',
      unit: 'Liter',
      status: 'Raw',
      statusType: 'raw',
    },
    {
      date: '2023-15-08', // Dirty date
      facility: 'Berlin-HQ',
      fuel: 'Diesel',
      volume: '1,050.2',
      unit: 'Liter',
      status: 'Invalid Date',
      statusType: 'error',
    },
    {
      date: '2023-07-12',
      facility: 'Berlin-HQ',
      fuel: 'Strom (EV)',
      volume: '45.8',
      unit: 'kWh',
      status: 'Raw',
      statusType: 'raw',
    },
  ];

  return (
    <section className="preview-section animate-slide-up">
      <div className="preview-header">
        <div>
          <h3 className="preview-title">Raw File Preview</h3>
          <p className="preview-subtitle">
            <span className="material-symbols-outlined file-icon">description</span>
            {fileName || 'DE_Fleet_Fuel_2023_Q3.csv'}
          </p>
        </div>
        <div className="preview-actions">
          <button className="preview-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="preview-btn-primary" onClick={onProcess}>
            Process Data
          </button>
        </div>
      </div>

      <div className="preview-table-card">
        <div className="preview-table-wrapper">
          <table className="preview-table">
            <thead>
              <tr className="preview-table-header-row">
                {mockHeaders.map((header, idx) => (
                  <th key={idx} className="preview-th">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="preview-tbody">
              {mockRows.map((row, index) => (
                <tr key={index} className="preview-tr">
                  <td className={`preview-td ${row.statusType === 'error' ? 'text-error' : ''}`}>
                    {row.date}
                  </td>
                  <td className="preview-td">{row.facility}</td>
                  <td className="preview-td">{row.fuel}</td>
                  <td className="preview-td text-right font-semibold">{row.volume}</td>
                  <td className="preview-td">{row.unit}</td>
                  <td className="preview-td">
                    <span className={`preview-status-badge ${row.statusType}`}>
                      {row.statusType === 'raw' && <span className="preview-status-dot"></span>}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
