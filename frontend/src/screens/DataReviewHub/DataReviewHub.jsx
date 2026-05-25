import React, { useState } from 'react';
import ReviewTable from './components/ReviewTable/ReviewTable';
import RecordInspector from './components/RecordInspector/RecordInspector';
import './DataReviewHub.css';

export default function DataReviewHub({ records, onApproveRecord, onFlagRecord }) {
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  return (
    <div className="datareview-hub-container">
      <header className="screen-header">
        <h2 className="screen-title">Data Review Hub</h2>
        <p className="screen-subtitle">
          Review and validate incoming emissions data before committing to the general ledger.
        </p>
      </header>

      {/* Grid review component */}
      <ReviewTable records={records} onRowClick={handleRowClick} />

      {/* Record Inspector Right side glide-over drawer */}
      {selectedRecord && (
        <RecordInspector
          record={selectedRecord}
          onClose={handleCloseInspector}
          onApprove={handleApprove}
          onFlag={handleFlag}
        />
      )}
    </div>
  );
}
