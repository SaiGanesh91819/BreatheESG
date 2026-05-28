import React, { useState } from 'react';
import ReviewTable from './components/ReviewTable/ReviewTable';
import RecordInspector from './components/RecordInspector/RecordInspector';
import './DataReviewHub.css';

export default function DataReviewHub({ records, files, onApproveRecord, onFlagRecord, onEditRecord }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleRowClick = (record) => {
    setSelectedRecord(record);
  };

  const handleCloseInspector = () => {
    setSelectedRecord(null);
  };

  const handleApprove = (id) => {
    onApproveRecord(id);
    // Refresh selected record details in active drawer
    setSelectedRecord((prev) => (prev ? { ...prev, status: 'Approved' } : null));
  };

  const handleFlag = (id) => {
    onFlagRecord(id);
    // Refresh selected record details in active drawer
    setSelectedRecord((prev) => (prev ? { ...prev, status: 'Suspicious', comment: 'Anomalous deviation in volumes detected. Under engineering review.' } : null));
  };

  // Filter records by selected file
  const displayRecords = selectedFile 
    ? records.filter(r => r.rawLog && r.rawLog.id === selectedFile.id)
    : records;

  return (
    <div className="datareview-hub-container">
      {/* Main Review Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <header className="screen-header">
          <h2 className="screen-title">Data Review Hub</h2>
          <p className="screen-subtitle">
            Review and validate incoming emissions data before committing to the general ledger.
          </p>
        </header>

        {/* Horizontal File Selector */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5d5f5d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filter by Upload
          </h3>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            <div 
              onClick={() => setSelectedFile(null)}
              style={{ 
                padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap',
                background: selectedFile === null ? '#1c2d24' : '#f1f5f9', 
                color: selectedFile === null ? '#ffffff' : '#334155',
                fontWeight: '500', fontSize: '14px', transition: 'all 0.2s ease',
                border: '1px solid transparent'
              }}
            >
              All Records
            </div>
            {files && files.map(file => {
              const isSelected = selectedFile && selectedFile.id === file.id;
              return (
                <div 
                  key={file.id} 
                  onClick={() => setSelectedFile(file)}
                  style={{ 
                    padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
                    background: isSelected ? '#e0f2fe' : '#ffffff', 
                    border: isSelected ? '1px solid #bae6fd' : '1px solid #e2e8f0', 
                    color: isSelected ? '#0284c7' : '#475569',
                    fontWeight: '500', fontSize: '14px', transition: 'all 0.2s ease'
                  }}
                >
                  {file.file_name} <span style={{ fontSize: '11px', opacity: 0.7, background: isSelected ? 'rgba(2,132,199,0.1)' : '#f1f5f9', padding: '2px 6px', borderRadius: '10px' }}>{file.source_type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid review component */}
        <ReviewTable records={displayRecords} onRowClick={handleRowClick} />
      </div>

      {/* Record Inspector Right side glide-over drawer */}
      {selectedRecord && (
        <RecordInspector
          record={selectedRecord}
          onClose={handleCloseInspector}
          onApprove={handleApprove}
          onFlag={handleFlag}
          onEdit={onEditRecord}
        />
      )}
    </div>
  );
}
