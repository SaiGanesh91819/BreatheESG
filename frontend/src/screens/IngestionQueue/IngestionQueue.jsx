import React, { useState } from 'react';
import ManualUpload from './components/ManualUpload/ManualUpload';
import RawFilePreview from './components/RawFilePreview/RawFilePreview';
import './IngestionQueue.css';

export default function IngestionQueue({ onAddProcessedRecords }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);

  const handleFileUpload = (file) => {
    setUploadedFile(file);

    // Dynamic Client-side CSV Reader and Parser (Standard Industry Practice)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 0) {
        // Parse raw headers from the first row
        const rawHeaders = lines[0].split(',').map(h => h.trim());
        
        // Parse the first 100 raw data rows dynamically to enable a scrollable preview
        const rawRows = lines.slice(1, 101).map((line) => {
          const cols = line.split(',').map(c => c.trim());
          return {
            cols: cols,
            status: 'Raw',
            statusType: 'raw'
          };
        });

        setParsedHeaders(rawHeaders);
        setParsedRows(rawRows);
      }
    };
    reader.readAsText(file);
  };

  const handleCancelPreview = () => {
    setUploadedFile(null);
    setParsedHeaders([]);
    setParsedRows([]);
  };

  const handleProcessData = () => {
    // Smart source type detector based on file name
    let sourceType = 'SAP';
    const name = uploadedFile.name.toLowerCase();
    if (name.includes('utility') || name.includes('electricity') || name.includes('grid')) {
      sourceType = 'UTILITY';
    } else if (name.includes('travel') || name.includes('flight') || name.includes('concur')) {
      sourceType = 'TRAVEL';
    }

    onAddProcessedRecords(uploadedFile, sourceType);
    setUploadedFile(null);
    setParsedHeaders([]);
    setParsedRows([]);
  };

  return (
    <div className="ingestion-queue-container">
      <header className="screen-header">
        <h2 className="screen-title">Ingestion Queue</h2>
        <p className="screen-subtitle">Connect data sources or manually upload raw files for parsing.</p>
      </header>

      {/* Dynamic Screen Area */}
      {uploadedFile ? (
        <RawFilePreview
          fileName={uploadedFile.name}
          headers={parsedHeaders}
          rows={parsedRows}
          onCancel={handleCancelPreview}
          onProcess={handleProcessData}
        />
      ) : (
        <>
          <ManualUpload onFileUpload={handleFileUpload} />
        </>
      )}
    </div>
  );
}
