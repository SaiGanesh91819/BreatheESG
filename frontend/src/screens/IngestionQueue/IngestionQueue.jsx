import React, { useState } from 'react';
import ActiveIntegrations from './components/ActiveIntegrations/ActiveIntegrations';
import ManualUpload from './components/ManualUpload/ManualUpload';
import RawFilePreview from './components/RawFilePreview/RawFilePreview';
import './IngestionQueue.css';

export default function IngestionQueue({ onAddProcessedRecords }) {
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (file) => {
    setUploadedFile(file);
  };

  const handleCancelPreview = () => {
    setUploadedFile(null);
  };

  const handleProcessData = () => {
    // Generate new mock processed records to add to the Review Hub
    const newRecords = [
      {
        id: Date.now(),
        source: 'SAP ERP (Fleet)',
        sourceIcon: 'database',
        ingestDate: '25 May 2026',
        scope: 'Scope 1',
        rawValue: '450.5 L Diesel',
        normalizedValue: '378.42 kg',
        calcEmissions: 1.12,
        status: 'Approved',
        facility: 'München-01',
        comment: '',
        auditTrail: [
          { time: '11:12 AM', user: 'Sai Ganesh', action: 'Uploaded DE_Fleet_Fuel_2023_Q3.csv' },
          { time: '11:12 AM', user: 'System Normalizer', action: 'Mapped "Kraftstoffmenge" to volume' },
          { time: '11:13 AM', user: 'Sai Ganesh', action: 'Approved and committed record' }
        ]
      },
      {
        id: Date.now() + 1,
        source: 'SAP ERP (Fleet)',
        sourceIcon: 'database',
        ingestDate: '25 May 2026',
        scope: 'Scope 1',
        rawValue: '210.0 L Benzin',
        normalizedValue: '157.50 kg',
        calcEmissions: 0.49,
        status: 'Approved',
        facility: 'München-01',
        comment: '',
        auditTrail: [
          { time: '11:12 AM', user: 'Sai Ganesh', action: 'Uploaded DE_Fleet_Fuel_2023_Q3.csv' },
          { time: '11:12 AM', user: 'System Normalizer', action: 'Mapped "Benzin" to gas volume' }
        ]
      },
      {
        id: Date.now() + 2,
        source: 'Berlin Portal',
        sourceIcon: 'database',
        ingestDate: '25 May 2026',
        scope: 'Scope 1',
        rawValue: '1,050.2 L Diesel',
        normalizedValue: 'N/A',
        calcEmissions: 2.62,
        status: 'Failed',
        facility: 'Berlin-HQ',
        comment: 'Invalid Date format (2023-15-08) was rejected by billing validator.',
        auditTrail: [
          { time: '11:12 AM', user: 'Sai Ganesh', action: 'Uploaded DE_Fleet_Fuel_2023_Q3.csv' },
          { time: '11:12 AM', user: 'System Normalizer', action: 'Failed parsing date "2023-15-08"' }
        ]
      }
    ];

    onAddProcessedRecords(newRecords);
    setUploadedFile(null);
    alert('Mock records parsed and uploaded to the Data Review Hub successfully!');
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
          onCancel={handleCancelPreview}
          onProcess={handleProcessData}
        />
      ) : (
        <>
          <ActiveIntegrations />
          <ManualUpload onFileUpload={handleFileUpload} />
        </>
      )}
    </div>
  );
}
