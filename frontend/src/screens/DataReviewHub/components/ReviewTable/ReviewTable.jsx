import React, { useState, useEffect } from 'react';
import './ReviewTable.css';

export default function ReviewTable({ records, onRowClick }) {
  const [scopeFilter, setScopeFilter] = useState('All Scopes');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, statusFilter, searchTerm, records]);

  const getProbableStatus = (rec) => {
    const emissions = parseFloat(rec.calcEmissions || rec.calc_emissions);
    if (emissions > 50.0 || emissions <= 0.0) return 'Suspicious';
    return 'Approved';
  };

  // Filter Logic
  const filteredRecords = records.filter((rec) => {
    const matchesScope = scopeFilter === 'All Scopes' || rec.scope === scopeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || rec.status === statusFilter;
    
    const facilityStr = typeof rec.facility === 'object' && rec.facility 
      ? rec.facility.name 
      : (rec.facility || '');

    const matchesSearch =
      rec.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.rawValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facilityStr.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesScope && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

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
              {currentRecords.length > 0 ? (
                currentRecords.map((rec) => (
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span className={`status-badge-pill ${rec.status.toLowerCase()}`}>
                          <span className="status-pill-dot"></span>
                          {rec.status}
                        </span>
                        {rec.status === 'Pending' && (
                          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>
                            Probable: <span className={getProbableStatus(rec) === 'Suspicious' ? 'text-danger' : 'text-success'}>{getProbableStatus(rec)}</span>
                          </span>
                        )}
                      </div>
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
            Showing {filteredRecords.length === 0 ? 0 : startIndex + 1} - {Math.min(startIndex + pageSize, filteredRecords.length)} of {filteredRecords.length} records
          </span>
          <div className="pagination-btns">
            <button 
              className="pagination-nav-btn" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <span className="material-symbols-outlined font-sm">chevron_left</span>
            </button>
            <button className="pagination-num-btn active">{currentPage}</button>
            <span style={{color: '#5d5f5d', margin: 'auto 8px'}}>of {totalPages || 1}</span>
            <button 
              className="pagination-nav-btn" 
              disabled={currentPage >= totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <span className="material-symbols-outlined font-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
