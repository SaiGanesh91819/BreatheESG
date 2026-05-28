import React, { useState, useEffect } from 'react';
import SideNavBar from './components/shared/SideNavBar/SideNavBar';
import TopAppBar from './components/shared/TopAppBar/TopAppBar';
import AuthPortal from './components/shared/AuthPortal/AuthPortal';
import IngestionQueue from './screens/IngestionQueue/IngestionQueue';
import DataReviewHub from './screens/DataReviewHub/DataReviewHub';
import EmissionsLedger from './screens/EmissionsLedger/EmissionsLedger';
import TenantSettings from './screens/TenantSettings/TenantSettings';
import { useToast } from './components/shared/Toast/ToastContext';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/core';
const AUTH_API_URL = API_BASE_URL.replace('/api/core', '/api/auth');

const TENANTS = [
  { id: 'uk', name: 'Global Retail Corp - UK Facility' },
  { id: 'de', name: 'Global Retail Corp - Germany Plant' },
  { id: 'us', name: 'Global Retail Corp - US HQ' }
];

export default function App() {
  const { showToast } = useToast();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('esg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeScreen, setActiveScreen] = useState('ingestion'); // Default to Ingestion Queue as the starting step
  const [records, setRecords] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTenant, setActiveTenant] = useState('uk');
  const [loading, setLoading] = useState(false);
  
  // Helper to fetch all records for the active tenant from the Django REST API
  const fetchRecords = async (tenantSlug) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/records/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenantSlug
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else {
        console.error('Failed to load records from Django API.');
      }

      const fileResponse = await fetch(`${API_BASE_URL}/files/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': tenantSlug
        }
      });
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        setFiles(fileData);
      }
    } catch (err) {
      console.error('Error connecting to Django backend server.', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch records whenever the active tenant switches or user logs in
  useEffect(() => {
    fetchRecords(activeTenant);
  }, [activeTenant, user]);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setActiveScreen('ingestion');
  };

  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_API_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    localStorage.removeItem('esg_user');
    setUser(null);
  };

  // Database operations callbacks synced directly to Django API endpoints
  const handleAddProcessedRecords = async (file, sourceType) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    try {
      const response = await fetch(`${API_BASE_URL}/ingest/`, {
        method: 'POST',
        headers: {
          'X-Tenant-Slug': activeTenant
        },
        body: formData
      });

      if (response.ok) {
        const newlyCreatedRecords = await response.json();
        // Append newly created records to the grid
        setRecords((prev) => [...newlyCreatedRecords, ...prev]);
        // Also refetch files to get the new raw_log
        fetchRecords(activeTenant);
        showToast(`Successfully ingested raw ${sourceType} file into Django DB! Mapped records added to Data Review Hub.`, 'success');
      } else {
        const errorData = await response.json();
        showToast(`Ingestion failed on Django server: ${errorData.detail || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Failed to connect to Django API for file upload:', err);
      showToast('Network error connecting to Django backend server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRecord = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': activeTenant
        }
      });

      if (response.ok) {
        const updatedRecord = await response.json();
        // Update record in state
        setRecords((prev) =>
          prev.map((rec) => (rec.id === id ? updatedRecord : rec))
        );
        showToast('Record approved and locked successfully!', 'success');
      } else {
        showToast('Failed to approve record on Django server.', 'error');
      }
    } catch (err) {
      console.error('Error approving record:', err);
      showToast('Network error connecting to Django backend.', 'error');
    }
  };

  const handleFlagRecord = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}/flag/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': activeTenant
        }
      });

      if (response.ok) {
        const updatedRecord = await response.json();
        // Update record in state
        setRecords((prev) =>
          prev.map((rec) => (rec.id === id ? updatedRecord : rec))
        );
        showToast('Record successfully flagged as suspicious anomaly.', 'warning');
      } else {
        showToast('Failed to flag record on Django server.', 'error');
      }
    } catch (err) {
      console.error('Error flagging record:', err);
      showToast('Network error connecting to Django backend.', 'error');
    }
  };

  const handleEditRecord = async (id, newValue) => {
    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}/edit_raw/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': activeTenant
        },
        body: JSON.stringify({ raw_value: newValue })
      });

      if (response.ok) {
        const updatedRecord = await response.json();
        // Update record in state
        setRecords((prev) =>
          prev.map((rec) => (rec.id === id ? updatedRecord : rec))
        );
        showToast('Raw field successfully edited and logged in audit trail.', 'success');
      } else {
        showToast('Failed to edit record on Django server.', 'error');
      }
    } catch (err) {
      console.error('Error editing record:', err);
      showToast('Network error connecting to Django backend.', 'error');
    }
  };

  // If user is not authenticated, show the elegant Login & Signup portal
  if (!user) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation shared component */}
      <SideNavBar 
        activeScreen={activeScreen} 
        setActiveScreen={setActiveScreen} 
        user={user}
        onLogout={handleLogout}
      />

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
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p className="loading-text">Processing Carbon Calculations...</p>
            </div>
          )}
          
          {activeScreen === 'ingestion' && (
            <IngestionQueue onAddProcessedRecords={handleAddProcessedRecords} />
          )}
          {activeScreen === 'review' && (
            <DataReviewHub
              records={records}
              files={files}
              onApproveRecord={handleApproveRecord}
              onFlagRecord={handleFlagRecord}
              onEditRecord={handleEditRecord}
            />
          )}
          {activeScreen === 'ledger' && (
            <EmissionsLedger records={records} files={files} activeTenant={activeTenant} />
          )}
          {activeScreen === 'settings' && (
            <TenantSettings activeTenant={activeTenant} />
          )}
        </main>
      </div>
    </div>
  );
}
