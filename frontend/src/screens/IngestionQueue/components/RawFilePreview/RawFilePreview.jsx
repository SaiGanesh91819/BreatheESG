import React from 'react';
import './RawFilePreview.css';

export default function RawFilePreview({ fileName, headers = [], rows = [], onCancel, onProcess }) {
  return (
    <section className="preview-section animate-slide-up">
      <div className="preview-header">
        <div>
          <h3 className="preview-title">Raw File Preview</h3>
          <p className="preview-subtitle">
            <span className="material-symbols-outlined file-icon">description</span>
            {fileName || 'sustainability_export.csv'}
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
                {headers.length > 0 ? (
                  headers.map((header, idx) => (
                    <th key={idx} className="preview-th">
                      {header}
                    </th>
                  ))
                ) : (
                  <th className="preview-th">Raw Data Columns</th>
                )}
                <th className="preview-th">Parser Status</th>
              </tr>
            </thead>
            <tbody className="preview-tbody">
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={index} className="preview-tr">
                    {row.cols.map((col, idx) => (
                      <td key={idx} className="preview-td">
                        {col}
                      </td>
                    ))}
                    <td className="preview-td">
                      <span className={`preview-status-badge ${row.statusType}`}>
                        {row.statusType === 'raw' && <span className="preview-status-dot"></span>}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty-table-cell" colSpan={headers.length + 1}>
                    No rows could be read from this file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
