import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  ComposedChart,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import './EmissionsLedger.css';

export default function EmissionsLedger({ records = [], files = [], activeTenant }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, APPROVED, PENDING, SUSPICIOUS, FAILED
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Reset pagination when filter conditions change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFile, statusFilter]);

  // Determine probable status helper
  const getProbableStatus = (rec) => {
    const val = parseFloat(rec.calc_emissions || rec.calcEmissions) || 0;
    if (rec.status === 'Failed') return 'Failed';
    if (rec.status === 'Suspicious') return 'Suspicious';
    if (rec.status === 'Approved') return 'Approved';
    
    // For pending, predict probable status
    const isSuspicious = val > 50.0 || val <= 0.0 || (rec.comment && rec.comment.toLowerCase().includes('auto-flagged'));
    return isSuspicious ? 'Suspicious Anomaly' : 'Approved (Auto-Valid)';
  };

  // Base list of records filtered by selected file upload
  const fileFilteredRecords = useMemo(() => {
    if (!selectedFile) return records;
    return records.filter(rec => rec.rawLog && rec.rawLog.id === selectedFile.id);
  }, [records, selectedFile]);

  // Further filter records by selected status filter
  const finalFilteredRecords = useMemo(() => {
    if (statusFilter === 'ALL') return fileFilteredRecords;
    if (statusFilter === 'APPROVED') return fileFilteredRecords.filter(rec => rec.status === 'Approved');
    if (statusFilter === 'PENDING') return fileFilteredRecords.filter(rec => rec.status === 'Pending');
    if (statusFilter === 'SUSPICIOUS') return fileFilteredRecords.filter(rec => rec.status === 'Suspicious');
    if (statusFilter === 'FAILED') return fileFilteredRecords.filter(rec => rec.status === 'Failed');
    return fileFilteredRecords;
  }, [fileFilteredRecords, statusFilter]);

  // Deep Analytical Metrics Calculation
  const metrics = useMemo(() => {
    let totalEmissions = 0;
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    let suspiciousCount = 0;
    let failedCount = 0;

    const sourceEmissionsMap = {};
    const facilityEmissionsMap = {};

    fileFilteredRecords.forEach(rec => {
      const val = parseFloat(rec.calc_emissions || rec.calcEmissions) || 0;
      totalEmissions += val;

      // Group by scope
      if (rec.scope === 'Scope 1') s1 += val;
      else if (rec.scope === 'Scope 2') s2 += val;
      else if (rec.scope === 'Scope 3') s3 += val;

      // Count by status
      if (rec.status === 'Approved') approvedCount++;
      else if (rec.status === 'Pending') pendingCount++;
      else if (rec.status === 'Suspicious') suspiciousCount++;
      else if (rec.status === 'Failed') failedCount++;

      // Ingestion Source aggregation
      const src = rec.source || 'Unknown';
      sourceEmissionsMap[src] = (sourceEmissionsMap[src] || 0) + val;

      // Facility aggregation
      const facName = rec.facility ? (rec.facility.name || rec.facility.code) : 'Unassigned Facility';
      facilityEmissionsMap[facName] = (facilityEmissionsMap[facName] || 0) + val;
    });

    const totalCount = fileFilteredRecords.length || 1;
    const integrityRate = ((approvedCount / totalCount) * 100).toFixed(1);
    const anomalyRate = (((suspiciousCount + failedCount) / totalCount) * 100).toFixed(1);
    const avgEmissions = (totalEmissions / totalCount).toFixed(2);

    // Find largest facility contributor
    let maxFacilityName = 'N/A';
    let maxFacilityVal = 0;
    Object.entries(facilityEmissionsMap).forEach(([name, val]) => {
      if (val > maxFacilityVal) {
        maxFacilityVal = val;
        maxFacilityName = name;
      }
    });

    return {
      total: totalEmissions.toFixed(2),
      scope1: s1.toFixed(2),
      scope2: s2.toFixed(2),
      scope3: s3.toFixed(2),
      scope3Ratio: totalEmissions > 0 ? ((s3 / totalEmissions) * 100).toFixed(1) : '0.0',
      approved: approvedCount,
      pending: pendingCount,
      suspicious: suspiciousCount,
      failed: failedCount,
      integrityRate,
      anomalyRate,
      avg: avgEmissions,
      largestFacilityName: maxFacilityName,
      largestFacilityVal: maxFacilityVal.toFixed(2),
      facilityEmissionsMap,
      sourceEmissionsMap
    };
  }, [fileFilteredRecords]);

  // Data Source 1: Scope Distribution (Donut PieChart)
  const scopeChartData = useMemo(() => {
    return [
      { name: 'Scope 1 (Direct)', value: parseFloat(metrics.scope1) || 0, color: '#3b82f6' },
      { name: 'Scope 2 (Indirect)', value: parseFloat(metrics.scope2) || 0, color: '#06b6d4' },
      { name: 'Scope 3 (Value Chain)', value: parseFloat(metrics.scope3) || 0, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [metrics]);

  // Data Source 2: Facility Distribution (Horizontal BarChart)
  const facilityChartData = useMemo(() => {
    return Object.entries(metrics.facilityEmissionsMap).map(([name, val]) => ({
      name,
      emissions: parseFloat(val.toFixed(2))
    })).sort((a, b) => b.emissions - a.emissions).slice(0, 8); // Top 8 facilities
  }, [metrics]);

  // Data Source 3: Cumulative Timeline Volatility Trend (AreaChart with smooth gradient)
  const timelineChartData = useMemo(() => {
    let runningSum = 0;
    // Map records chronologically (oldest to newest)
    return fileFilteredRecords.slice().reverse().map((rec, idx) => {
      const val = parseFloat(rec.calc_emissions || rec.calcEmissions) || 0;
      runningSum += val;
      return {
        index: idx + 1,
        recordId: `#ESG-${rec.id}`,
        source: rec.source || 'Ingest',
        emissions: val,
        cumulative: parseFloat(runningSum.toFixed(2))
      };
    });
  }, [fileFilteredRecords]);

  // Data Source 4: Category Emissions Source Breakdown (Composed Bar/Line Chart)
  const categoryChartData = useMemo(() => {
    return Object.entries(metrics.sourceEmissionsMap).map(([source, val]) => ({
      name: source,
      emissions: parseFloat(val.toFixed(2))
    }));
  }, [metrics]);

  // Data Source 5: Anomaly Scatter & Limit Reference Chart
  const anomalyScatterData = useMemo(() => {
    return fileFilteredRecords.map((rec, idx) => {
      const val = parseFloat(rec.calc_emissions || rec.calcEmissions) || 0;
      return {
        id: rec.id,
        label: `#ESG-${rec.id}`,
        source: rec.source,
        emissions: val,
        status: rec.status,
        limit: 50.0
      };
    });
  }, [fileFilteredRecords]);

  // Pagination Logic
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = useMemo(() => {
    return finalFilteredRecords.slice(startIndex, startIndex + pageSize);
  }, [finalFilteredRecords, startIndex, pageSize]);

  const totalPages = Math.ceil(finalFilteredRecords.length / pageSize) || 1;

  // Compute visible page numbers: only previous, current, and next
  const visiblePages = useMemo(() => {
    const pages = [];
    for (let p = currentPage - 1; p <= currentPage + 1; p++) {
      if (p >= 1 && p <= totalPages) {
        pages.push(p);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  // Render Source Category Icons
  const renderSourceIcon = (src) => {
    const s = src ? src.toLowerCase() : '';
    if (s.includes('travel') || s.includes('flight')) return 'local_airport';
    if (s.includes('utility') || s.includes('electricity') || s.includes('power')) return 'bolt';
    return 'database';
  };

  return (
    <div className="emissions-ledger-container animate-fade-in">
      {/* Premium Screen Header */}
      <header className="screen-header glass-header">
        <div className="header-badge">Compliance & Audits</div>
        <h2 className="screen-title">Emissions Ledger</h2>
        <p className="screen-subtitle">
          Auditable carbon general ledger mapped dynamically from raw transactional records. Meticulously parsed, validated, and signed-off.
        </p>
      </header>

      {/* File Ingestion Filtering Section */}
      <div className="filter-section-wrapper card-premium">
        <div className="filter-header">
          <span className="material-symbols-outlined filter-icon">filter_alt</span>
          <h3>DYNAMIC FILE FILTER</h3>
          <span className="filter-desc">Isolate specific batches to inspect ledger integrity and carbon metrics dynamically</span>
        </div>
        
        <div className="file-tabs-scroll">
          <button 
            onClick={() => setSelectedFile(null)}
            className={`file-tab-btn ${selectedFile === null ? 'active-all' : ''}`}
          >
            <span className="material-symbols-outlined">analytics</span>
            All Active Uploads
          </button>
          {files && files.map(file => {
            const isSelected = selectedFile && selectedFile.id === file.id;
            return (
              <button 
                key={file.id} 
                onClick={() => setSelectedFile(file)}
                className={`file-tab-btn ${isSelected ? 'active-single' : ''}`}
              >
                <span className="material-symbols-outlined tab-icon-small">
                  {renderSourceIcon(file.source_type)}
                </span>
                <span className="tab-filename">{file.file_name}</span>
                <span className="tab-source-badge">{file.source_type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Grade ESG KPI Metrics Dashboard */}
      <div className="metrics-dashboard-grid">
        <div className="kpi-card animated-kpi emissions-main-card">
          <div className="kpi-icon-wrapper main-accent-bg">
            <span className="material-symbols-outlined">eco</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">TOTAL VERIFIED EMISSIONS</span>
            <span className="kpi-value">{metrics.total} <span className="kpi-unit">t CO2e</span></span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill" style={{ width: '100%', backgroundColor: '#10b981' }}></div>
            </div>
            <span className="kpi-subtext text-success">
              <span className="material-symbols-outlined text-icon-tiny">check_circle</span> Mapped ledger entries
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper s1-bg">
            <span className="material-symbols-outlined">factory</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">SCOPE 1 (DIRECT)</span>
            <span className="kpi-value">{metrics.scope1} <span className="kpi-unit">t CO2e</span></span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill s1-fill" style={{ width: `${metrics.total > 0 ? (parseFloat(metrics.scope1)/parseFloat(metrics.total)*100) : 0}%` }}></div>
            </div>
            <span className="kpi-subtext">
              {metrics.total > 0 ? ((parseFloat(metrics.scope1)/parseFloat(metrics.total))*100).toFixed(1) : 0}% of total emissions
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper s2-bg">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">SCOPE 2 (INDIRECT)</span>
            <span className="kpi-value">{metrics.scope2} <span className="kpi-unit">t CO2e</span></span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill s2-fill" style={{ width: `${metrics.total > 0 ? (parseFloat(metrics.scope2)/parseFloat(metrics.total)*100) : 0}%` }}></div>
            </div>
            <span className="kpi-subtext">
              {metrics.total > 0 ? ((parseFloat(metrics.scope2)/parseFloat(metrics.total))*100).toFixed(1) : 0}% grid electricity usage
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper s3-bg">
            <span className="material-symbols-outlined">share</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">SCOPE 3 (VALUE CHAIN)</span>
            <span className="kpi-value">{metrics.scope3} <span className="kpi-unit">t CO2e</span></span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill s3-fill" style={{ width: `${metrics.total > 0 ? (parseFloat(metrics.scope3)/parseFloat(metrics.total)*100) : 0}%` }}></div>
            </div>
            <span className="kpi-subtext">
              {metrics.scope3Ratio}% logistics & business travel
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper integrity-bg">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">DATA INTEGRITY RATE</span>
            <span className="kpi-value">{metrics.integrityRate}%</span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill integrity-fill" style={{ width: `${metrics.integrityRate}%` }}></div>
            </div>
            <span className="kpi-subtext">
              {metrics.approved} approved out of {fileFilteredRecords.length} records
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi alert-theme-kpi">
          <div className="kpi-icon-wrapper danger-bg">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label" style={{ color: '#ef4444' }}>ANOMALY RISK RATE</span>
            <span className="kpi-value" style={{ color: '#dc2626' }}>{metrics.anomalyRate}%</span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill danger-fill" style={{ width: `${metrics.anomalyRate}%` }}></div>
            </div>
            <span className="kpi-subtext text-danger font-semibold">
              {metrics.suspicious} suspicious & {metrics.failed} failed items flagged
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper avg-bg">
            <span className="material-symbols-outlined">tag</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">AVERAGE EMISSIONS / ENTRY</span>
            <span className="kpi-value">{metrics.avg} <span className="kpi-unit">t CO2e</span></span>
            <div className="kpi-progress-bar-bg">
              <div className="kpi-progress-fill avg-fill" style={{ width: '100%' }}></div>
            </div>
            <span className="kpi-subtext">
              Spread density across reporting entries
            </span>
          </div>
        </div>

        <div className="kpi-card animated-kpi">
          <div className="kpi-icon-wrapper facility-kpi-bg">
            <span className="material-symbols-outlined">apartment</span>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">LARGEST FACILITY CONTRIBUTOR</span>
            <span className="kpi-value" style={{ fontSize: '18px', padding: '4px 0' }}>
              {metrics.largestFacilityName.length > 22 ? `${metrics.largestFacilityName.substring(0, 20)}...` : metrics.largestFacilityName}
            </span>
            <span className="kpi-subtext text-primary font-semibold" style={{ marginTop: 'auto' }}>
              Contributed {metrics.largestFacilityVal} t CO2e
            </span>
          </div>
        </div>
      </div>

      {/* Five-Chart ESG Analytical Grid Suite */}
      <div className="charts-main-grid-suite">
        
        {/* Chart 1: Scope Distribution Donut (Sleek design) */}
        <div className="chart-card-premium animate-hover">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-card-title">Scope Contribution Allocation</h4>
              <span className="chart-card-subtitle">Detailed categorization of Greenhouse Gas protocol scopes</span>
            </div>
            <span className="material-symbols-outlined chart-header-icon">pie_chart</span>
          </div>
          <div className="chart-wrapper-flex">
            {scopeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie 
                    data={scopeChartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={90} 
                    paddingAngle={6} 
                    dataKey="value"
                  >
                    {scopeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tCO2e`, 'Calculated Emissions']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">No emissions data recorded for Scope Allocation</div>
            )}
          </div>
        </div>

        {/* Chart 2: Top Emitting Facilities Bar Chart */}
        <div className="chart-card-premium animate-hover">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-card-title">Facility Emission Rankings</h4>
              <span className="chart-card-subtitle">Highest carbon emitting corporate facilities (tonnes CO2e)</span>
            </div>
            <span className="material-symbols-outlined chart-header-icon">bar_chart</span>
          </div>
          <div className="chart-wrapper-flex">
            {facilityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={facilityChartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" width={110} stroke="#94a3b8" tick={{ fontSize: 10, fontWeight: '500' }} />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} formatter={(value) => [`${value} tCO2e`, 'Emissions']} />
                  <Bar dataKey="emissions" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={16}>
                    {facilityChartData.map((entry, idx) => (
                      <Cell key={`facility-${idx}`} fill={idx === 0 ? '#ef4444' : idx < 3 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">No facility information associated with active records</div>
            )}
          </div>
        </div>

        {/* Chart 3: Volatility Cumulative Carbon Timeline Ingestion (Full Width Area Chart) */}
        <div className="chart-card-premium wide-premium-chart animate-hover">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-card-title">Carbon Accrual Volatility & Ingestion Curve</h4>
              <span className="chart-card-subtitle">Timeline tracking of individual transaction spikes alongside cumulative ESG liabilities</span>
            </div>
            <span className="material-symbols-outlined chart-header-icon">monitoring</span>
          </div>
          <div className="chart-wrapper-flex" style={{ height: '300px' }}>
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 15, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorIndividual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="recordId" stroke="#94a3b8" tick={{ fontSize: 10 }} label={{ value: "Chronological Ledger Sequence", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#8b5cf6" tick={{ fontSize: 10 }} label={{ value: "Cumulative Emissions (t)", angle: -90, position: "insideLeft", offset: 10, fill: "#8b5cf6", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} label={{ value: "Single Entry Emissions (t)", angle: 90, position: "insideRight", offset: 10, fill: "#10b981", fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} 
                    formatter={(value, name) => {
                      if (name === "cumulative") return [`${value} tCO2e`, 'Cumulative Total'];
                      return [`${value} tCO2e`, 'Entry Weight'];
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area yAxisId="left" type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                  <Area yAxisId="right" type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorIndividual)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">Ingest sustainability files to visualize compliance timeline</div>
            )}
          </div>
        </div>

        {/* Chart 4: Ingestion Source Comparison (Composed Bar) */}
        <div className="chart-card-premium animate-hover">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-card-title">Category Ingestion Source Intensity</h4>
              <span className="chart-card-subtitle">Aggregate CO2 output of corporate systems (SAP, Travel, Utilities)</span>
            </div>
            <span className="material-symbols-outlined chart-header-icon">category</span>
          </div>
          <div className="chart-wrapper-flex">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ fill: 'rgba(241,245,249,0.3)' }} formatter={(value) => [`${value} tCO2e`, 'Volume']} />
                  <Bar dataKey="emissions" fill="#8b5cf6" barSize={36} radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-cat-${index}`} fill={index % 2 === 0 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">Ingest transactional logs to populate sources</div>
            )}
          </div>
        </div>

        {/* Chart 5: Anomaly Scatter & Threshold Analysis */}
        <div className="chart-card-premium animate-hover">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-card-title">Anomaly Variance & Threshold Control</h4>
              <span className="chart-card-subtitle">Audit limits (50t threshold) plotted against raw emission inputs</span>
            </div>
            <span className="material-symbols-outlined chart-header-icon">rule</span>
          </div>
          <div className="chart-wrapper-flex">
            {anomalyScatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={anomalyScatterData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`${value} tCO2e`, 'Emissions Weight']} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Line type="monotone" dataKey="limit" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" label="Limit Threshold" dot={false} legendType="line" name="Anomalous Threshold (50.0t)" />
                  <Bar dataKey="emissions" fill="#93c5fd" barSize={12} radius={[4, 4, 0, 0]} name="Normal Value">
                    {anomalyScatterData.map((entry, index) => {
                      const isHigh = entry.emissions > 50.0 || entry.emissions <= 0.0;
                      return (
                        <Cell key={`cell-anomaly-${index}`} fill={isHigh ? '#dc2626' : '#bae6fd'} />
                      );
                    })}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart-state">No transaction logs available for control charting</div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Audited Entries segment */}
      <div className="ledger-table-segment-wrapper card-premium">
        
        {/* Segment Sub-Header containing view filtering */}
        <div className="ledger-table-actions-header">
          <div className="ledger-title-group">
            <h3 className="ledger-subheading">Audited Emissions Registry</h3>
            <p className="ledger-sub-desc">Compliance record list mapped recursively from audited batches</p>
          </div>

          {/* Interactive Status Segment Filters */}
          <div className="status-segment-controls">
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`status-segment-btn ${statusFilter === 'ALL' ? 'active-segment' : ''}`}
            >
              All Registry ({fileFilteredRecords.length})
            </button>
            <button 
              onClick={() => setStatusFilter('APPROVED')}
              className={`status-segment-btn ${statusFilter === 'APPROVED' ? 'active-segment' : ''}`}
              style={{ color: statusFilter === 'APPROVED' ? '#15803d' : '' }}
            >
              Approved ({metrics.approved})
            </button>
            <button 
              onClick={() => setStatusFilter('PENDING')}
              className={`status-segment-btn ${statusFilter === 'PENDING' ? 'active-segment' : ''}`}
              style={{ color: statusFilter === 'PENDING' ? '#b45309' : '' }}
            >
              Pending ({metrics.pending})
            </button>
            <button 
              onClick={() => setStatusFilter('SUSPICIOUS')}
              className={`status-segment-btn ${statusFilter === 'SUSPICIOUS' ? 'active-segment' : ''}`}
              style={{ color: statusFilter === 'SUSPICIOUS' ? '#b91c1c' : '' }}
            >
              Suspicious ({metrics.suspicious})
            </button>
            <button 
              onClick={() => setStatusFilter('FAILED')}
              className={`status-segment-btn ${statusFilter === 'FAILED' ? 'active-segment' : ''}`}
              style={{ color: statusFilter === 'FAILED' ? '#4b5563' : '' }}
            >
              Failed ({metrics.failed})
            </button>
          </div>
        </div>

        {/* Ledger Table Canvas */}
        <div className="table-card">
          <div className="table-scroll-wrapper">
            <table className="ledger-table">
              <thead>
                <tr className="ledger-th-row">
                  <th className="ledger-th">ID</th>
                  <th className="ledger-th">Category</th>
                  <th className="ledger-th">Raw Data Input</th>
                  <th className="ledger-th">Normalized Quantity</th>
                  <th className="ledger-th">Scope</th>
                  <th className="ledger-th">Calculated Output</th>
                  <th className="ledger-th">Verification Status / Probable State</th>
                  <th className="ledger-th">Anomaly Auditing Notes</th>
                  <th className="ledger-th">Trace Auditor</th>
                  <th className="ledger-th">Ingested Date</th>
                </tr>
              </thead>
              <tbody className="ledger-tbody">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((rec) => {
                    const emissionsVal = parseFloat(rec.calc_emissions || rec.calcEmissions) || 0;
                    const isHighVal = emissionsVal > 50.0 || emissionsVal <= 0.0;
                    const probable = getProbableStatus(rec);

                    return (
                      <tr key={rec.id} className="ledger-tr">
                        <td className="ledger-td font-semibold" style={{ color: '#64748b' }}>
                          #ESG-{rec.id}
                        </td>
                        <td className="ledger-td font-medium text-dark">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined icon-category-styled" style={{ fontSize: '18px', color: '#64748b' }}>
                              {renderSourceIcon(rec.source)}
                            </span>
                            {rec.source}
                          </div>
                        </td>
                        <td className="ledger-td font-medium" style={{ color: '#475569' }}>
                          {rec.raw_value || rec.rawValue}
                        </td>
                        <td className="ledger-td" style={{ color: '#64748b', fontSize: '13px' }}>
                          {rec.normalized_value || rec.normalizedValue}
                        </td>
                        <td className="ledger-td">
                          <span className={`scope-badge-premium ${rec.scope ? rec.scope.replace(/\s+/g, '-').toLowerCase() : ''}`}>
                            {rec.scope}
                          </span>
                        </td>
                        <td className="ledger-td font-semibold calculated-val-emissions">
                          {emissionsVal.toFixed(2)} t CO2e
                        </td>
                        
                        {/* Elegant Verification Status badge showing Probable Status also */}
                        <td className="ledger-td">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={`status-badge-premium ${rec.status ? rec.status.toLowerCase() : 'pending'}`}>
                              <span className="material-symbols-outlined status-icon-small">
                                {rec.status === 'Approved' ? 'verified' : rec.status === 'Suspicious' ? 'warning' : rec.status === 'Failed' ? 'cancel' : 'hourglass_empty'}
                              </span>
                              {rec.status === 'Approved' ? 'Approved & Locked' : rec.status === 'Suspicious' ? 'Suspicious' : rec.status === 'Failed' ? 'Ingest Failed' : 'Pending Review'}
                            </span>
                            
                            {/* Probable Status Tag for Pending items */}
                            {rec.status === 'Pending' && (
                              <span className={`probable-status-sub-pill ${probable.includes('Suspicious') ? 'probable-danger' : 'probable-valid'}`}>
                                <span className="material-symbols-outlined font-thin" style={{ fontSize: '10px' }}>
                                  {probable.includes('Suspicious') ? 'report' : 'check'}
                                </span>
                                Probable: {probable}
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Auto-flag Anomaly comment auditing cell */}
                        <td className="ledger-td anomaly-comment-cell" style={{ maxWidth: '240px', whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '12px' }}>
                          {rec.comment ? (
                            <div className={`anomaly-cell-alert ${isHighVal || rec.status === 'Suspicious' ? 'danger-alert-box' : 'info-alert-box'}`}>
                              <span className="material-symbols-outlined warning-alert-icon">
                                {isHighVal || rec.status === 'Suspicious' ? 'error' : 'info'}
                              </span>
                              <span>{rec.comment}</span>
                            </div>
                          ) : (
                            <span className="text-muted-italics">No anomalies detected. Auto-valid.</span>
                          )}
                        </td>

                        <td className="ledger-td auditor-name" style={{ fontSize: '13px', color: '#334155' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', color: '#16a34a' }}>verified_user</span>
                          {rec.auditTrails && rec.auditTrails.length > 0 ? rec.auditTrails[rec.auditTrails.length - 1].user_id : 'Sai Ganesh'}
                        </td>
                        <td className="ledger-td timestamp" style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(rec.ingest_date || rec.ingestDate || Date.now()).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="empty-table-cell" style={{ padding: '64px 24px', textAlign: 'center', color: '#64748b' }}>
                      <span className="material-symbols-outlined empty-state-icon" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }}>
                        inventory_2
                      </span>
                      <p style={{ fontWeight: '500', fontSize: '15px', margin: '0' }}>No audited ledger records match this query.</p>
                      <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.8 }}>Try selecting an alternative upload source or adjusting the status tags filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Information Dense Pagination Footer Controls */}
          <div className="grid-footer-premium">
            <span className="footer-stats">
              Showing <strong style={{ color: '#1e293b' }}>{finalFilteredRecords.length === 0 ? 0 : startIndex + 1}</strong> - <strong style={{ color: '#1e293b' }}>{Math.min(startIndex + pageSize, finalFilteredRecords.length)}</strong> of <strong style={{ color: '#1e293b' }}>{finalFilteredRecords.length}</strong> compliance records
            </span>
            
            <div className="pagination-controls-dense">
              <button 
                className="page-btn-premium" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined btn-arrow-icon">arrow_back_ios</span>
                Previous
              </button>
              
              {/* Render dynamic page numbers */}
              <div className="page-numbers-container">
                {visiblePages.map(pg => {
                  const isCurrent = pg === currentPage;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`page-number-btn ${isCurrent ? 'active-number' : ''}`}
                    >
                      {pg}
                    </button>
                  );
                })}
              </div>

              <button 
                className="page-btn-premium" 
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next
                <span className="material-symbols-outlined btn-arrow-icon">arrow_forward_ios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
