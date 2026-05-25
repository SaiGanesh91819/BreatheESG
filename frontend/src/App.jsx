import React, { useState } from 'react';
import SideNavBar from './components/shared/SideNavBar/SideNavBar';
import TopAppBar from './components/shared/TopAppBar/TopAppBar';
import IngestionQueue from './screens/IngestionQueue/IngestionQueue';
import DataReviewHub from './screens/DataReviewHub/DataReviewHub';
import EmissionsLedger from './screens/EmissionsLedger/EmissionsLedger';
import TenantSettings from './screens/TenantSettings/TenantSettings';
import './App.css';

// Initial high-fidelity realistic mock data
const INITIAL_RECORDS = [
  {
    id: 1,
    source: 'SAP ERP',
    sourceIcon: 'database',
    ingestDate: '12 Feb 2024',
    scope: 'Scope 1',
    rawValue: '4,500 L Diesel',
    normalizedValue: '3,780 kg',
    calcEmissions: 11.23,
    status: 'Approved',
    facility: 'München-01',
    comment: '',
    auditTrail: [
      { time: '10:14 AM', user: 'Sai Ganesh', action: 'Raw data parsed from SAP file export_q1.csv' },
      { time: '10:15 AM', user: 'System Anomaly Engine', action: 'Flagged: Fuel volume is 42% higher than rolling average.' },
      { time: '10:17 AM', user: 'Sai Ganesh', action: 'Approved and committed to general ledger segment.' }
    ]
  },
  {
    id: 2,
    source: 'National Grid',
    sourceIcon: 'bolt',
    ingestDate: '11 Feb 2024',
    scope: 'Scope 2',
    rawValue: '12,800 kWh',
    normalizedValue: '12,800 kWh',
    calcEmissions: 4.56,
    status: 'Suspicious',
    facility: 'London Office',
    comment: 'Billing period exceeds standard 30 days (35 days). Normalizer recommends split proration.',
    auditTrail: [
      { time: '09:44 AM', user: 'System Ingest', action: 'Parsed utility API payload' },
      { time: '09:45 AM', user: 'System Prorator', action: 'Flagged: Billing interval bridges across calendar months' }
    ]
  },
  {
    id: 3,
    source: 'Concur Travel',
    sourceIcon: 'flight',
    ingestDate: '10 Feb 2024',
    scope: 'Scope 3',
    rawValue: 'JFK ➔ LHR (Economy)',
    normalizedValue: 'N/A',
    calcEmissions: 1.12,
    status: 'Failed',
    facility: 'Corporate Account',
    comment: 'Missing distance calculation metric. Airport coordinates could not be resolved from raw ticket API payload.',
    auditTrail: [
      { time: '04:12 PM', user: 'System Travel API', action: 'Parsed ticket log JFK-LHR' },
      { time: '04:12 PM', user: 'System Distances', action: 'Failed resolving Great-Circle distance dictionary.' }
    ]
  },
  {
    id: 4,
    source: 'DHL Logistics',
    sourceIcon: 'local_shipping',
    ingestDate: '09 Feb 2024',
    scope: 'Scope 3',
    rawValue: '1,200 ton-km',
    normalizedValue: '1,200 tkm',
    calcEmissions: 0.85,
    status: 'Approved',
    facility: 'Berlin segment',
    comment: '',
    auditTrail: [
      { time: '11:15 AM', user: 'System Ingest', action: 'Parsed DHL flat file shipment export' },
      { time: '11:17 AM', user: 'Sai Ganesh', action: 'Approved and committed to ledger.' }
    ]
  }
];

const TENANTS = [
  { id: 'uk', name: 'Global Retail Corp - UK Facility' },
  { id: 'de', name: 'Global Retail Corp - Germany Plant' },
  { id: 'us', name: 'Global Retail Corp - US HQ' }
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState('review'); // Default screen in Stitch
  const [records, setRecords] = useState(INITIAL_RECORDS);
  const [activeTenant, setActiveTenant] = useState('uk');

  // Database operations callbacks
  const handleAddProcessedRecords = (newRecords) => {
    setRecords((prev) => [ ...newRecords, ...prev ]);
  };

  const handleApproveRecord = (id) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: 'Approved',
              auditTrail: [
                ...rec.auditTrail,
                { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: 'Sai Ganesh', action: 'Approved and locked record manually' }
              ]
            }
          : rec
      )
    );
  };

  const handleFlagRecord = (id) => {
    setRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: 'Suspicious',
              comment: 'Anomalous deviation in volumes detected. Under engineering review.',
              auditTrail: [
                ...rec.auditTrail,
                { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: 'Sai Ganesh', action: 'Flagged as suspicious anomaly manually' }
              ]
            }
          : rec
      )
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation shared component */}
      <SideNavBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* Main Panel Content */}
      <div className="main-viewport">
        {/* Top Header layout component */}
        <TopAppBar
          activeTenant={activeTenant}
          setActiveTenant={setActiveTenant}
          tenants={TENANTS}
        />

        {/* Core Canvas View */}
        <main className="content-canvas">
          {activeScreen === 'ingestion' && (
            <IngestionQueue onAddProcessedRecords={handleAddProcessedRecords} />
          )}
          {activeScreen === 'review' && (
            <DataReviewHub
              records={records}
              onApproveRecord={handleApproveRecord}
              onFlagRecord={handleFlagRecord}
            />
          )}
          {activeScreen === 'ledger' && (
            <EmissionsLedger records={records} />
          )}
          {activeScreen === 'settings' && (
            <TenantSettings />
          )}
        </main>
      </div>
    </div>
  );
}
