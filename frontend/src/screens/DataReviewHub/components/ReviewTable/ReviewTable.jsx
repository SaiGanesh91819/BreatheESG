import React, { useState } from 'react';
import './ReviewTable.css';

export default function ReviewTable({ records, onRowClick }) {
  const [scopeFilter, setScopeFilter] = useState('All Scopes');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredRecords = records.filter((rec) => {
    const matchesScope = scopeFilter === 'All Scopes' || rec.scope === scopeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || rec.status === statusFilter;
    const matchesSearch =
      rec.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rawValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.facility.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesScope && matchesStatus && matchesSearch;
  });

  return (
    <div className="review-table-container">
      {/* Filters bar */}
      <div className="filters-bar">
        <div className="filters-group">
          <div className="select-wrapper">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="filter-select"
            >
              <option>All Scopes</option>
              <option>Scope 1</option>
              <option>Scope 2</option>
              <option>Scope 3</option>
            </select>
            <span className="material-symbols-outlined select-arrow">expand_more</span>
          </div>

          <div className="select-wrapper">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option>All Statuses</option>
              <option>Approved</option>
              <option>Suspicious</option>
              <option>Failed</option>
            </select>
            <span className="material-symbols-outlined select-arrow">expand_more</span>
          </div>
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search Records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
          <span className="material-symbols-outlined search-icon">search</span>
        </div>
      </div>

      {/* Grid Table Card */}
      <div className="table-card">
        <div className="table-scroll-wrapper">
          <table className="review-grid-table">
            <thead>
              <tr className="grid-header-row">
                <th className="grid-th th-source">Source</th>
                <th className="grid-th th-date">Ingest Date</th>
                <th className="grid-th th-scope">Scope Category</th>
                <th className="grid-th th-raw">Raw Value</th>
                <th className="grid-th th-norm text-right">Normalized Value</th>
                <th className="grid-th th-emissions text-right">
                  Calc Emissions <span className="lowercase-unit">(t CO2e)</span>
                </th>
                <th className="grid-th th-status text-center">Status</th>
                <th className="grid-th th-actions text-center">Action</th>
              </tr>
            </thead>
            <tbody className="grid-tbody">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onRowClick(rec)}
                    className={`grid-tr hover-row cursor-pointer ${
                      rec.status === 'Suspicious' ? 'row-suspicious' : ''
                    } ${rec.status === 'Failed' ? 'row-failed' : ''}`}
                  >
                    <td className="grid-td">
                      <div className="source-cell">
                        <div className="source-icon-container">
                          <span className="material-symbols-outlined">
                            {rec.sourceIcon || 'database'}
                          </span>
                        </div>
                        <span className="source-name">{rec.source}</span>
                      </div>
                    </td>
                    <td className="grid-td text-secondary font-mono">{rec.ingestDate}</td>
                    <td className="grid-td">
                      <span className="scope-badge">{rec.scope}</span>
                    </td>
                    <td className="grid-td font-medium">{rec.rawValue}</td>
                    <td
                      className={`grid-td text-right font-mono ${
                        rec.normalizedValue === 'N/A' ? 'text-danger' : ''
                      }`}
                    >
                      {rec.normalizedValue}
                    </td>
                    <td
                      className={`grid-td text-right font-mono font-semibold ${
                        rec.status === 'Failed' ? 'text-danger' : ''
                      }`}
                    >
                      {rec.calcEmissions}
                    </td>
                    <td className="grid-td text-center">
                      <span className={`status-badge-pill ${rec.status.toLowerCase()}`}>
                        <span className="status-pill-dot"></span>
                        {rec.status}
                      </span>
                    </td>
                    <td className="grid-td text-center">
                      <button className="grid-actions-btn">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-table-cell">
                    No records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grid Pagination Footer */}
        <div className="grid-footer">
          <span className="footer-stats">
            Showing {filteredRecords.length} of {records.length} records
          </span>
          <div className="pagination-btns">
            <button className="pagination-nav-btn" disabled>
              <span className="material-symbols-outlined font-sm">chevron_left</span>
            </button>
            <button className="pagination-num-btn active">1</button>
            <button className="pagination-num-btn">2</button>
            <button className="pagination-nav-btn">
              <span className="material-symbols-outlined font-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
