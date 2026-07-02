// Reports.jsx - Reports Search, Filter, and Export Page
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Download, FileText, Calendar, ArrowUpDown } from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'productivityScore' | 'totalTime'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = `?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (search) query += `&search=${search}`;

      const response = await api.get(`/reports${query}`);
      setReports(response.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort reports locally (or double-back on backend)
  const getSortedReports = () => {
    return [...reports].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Convert seconds -> minutes helper
  const toMin = (secs) => (secs ? (secs / 60).toFixed(1) : '0.0');

  // Export to CSV
  const handleExportCSV = () => {
    if (reports.length === 0) return;

    const headers = [
      'Date', 
      'Total Time (Min)', 
      'Productive Time (Min)', 
      'Neutral Time (Min)', 
      'Distracting Time (Min)', 
      'Most Visited Domain', 
      'Productivity Score (%)', 
      'Completed Focus Sessions', 
      'Blocked Site Attempt Count'
    ];

    const rows = reports.map((r) => [
      r.date,
      toMin(r.totalTime),
      toMin(r.productiveTime),
      toMin(r.neutralTime),
      toMin(r.distractingTime),
      r.mostVisitedSite || 'N/A',
      r.productivityScore,
      r.focusSessionsCount,
      r.blockedAttemptsCount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FocusPulse_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF (Printer Friendly Popup Window)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    const tableRows = reports.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${toMin(r.totalTime)}m</td>
        <td>${toMin(r.productiveTime)}m</td>
        <td>${toMin(r.neutralTime)}m</td>
        <td>${toMin(r.distractingTime)}m</td>
        <td>${r.mostVisitedSite || 'None'}</td>
        <td style="font-weight: bold; color: ${r.productivityScore > 70 ? '#10b981' : r.productivityScore > 40 ? '#f59e0b' : '#ef4444'}">${r.productivityScore}%</td>
        <td>${r.focusSessionsCount}</td>
        <td>${r.blockedAttemptsCount}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>FocusPulse Productivity Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #1e1b4b; }
            p { font-size: 13px; color: #666; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
            tr:nth-child(even) { background-color: #fcfdfe; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>FocusPulse Daily Productivity Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()} | Total Logs: ${reports.length}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Duration</th>
                <th>Productive</th>
                <th>Neutral</th>
                <th>Distracting</th>
                <th>Most Visited Site</th>
                <th>Score</th>
                <th>Focus Blocks</th>
                <th>Blocked Hits</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const sortedReports = getSortedReports();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Search and Filters Bar */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end'
        }}>
          {/* Search bar */}
          <div style={{ flex: 2, minWidth: '240px' }}>
            <span className="form-label">Search Websites</span>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search domain (e.g., github.com)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          {/* Date range filter */}
          <div style={{ flex: 1, minWidth: '140px' }}>
            <span className="form-label">Start Date</span>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <span className="form-label">End Date</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearch('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Export buttons and summary details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Showing {sortedReports.length} reports
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '8px 16px' }} disabled={reports.length === 0}>
            <Download size={14} />
            Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn btn-secondary" style={{ padding: '8px 16px' }} disabled={reports.length === 0}>
            <FileText size={14} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Table details */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', backgroundColor: 'var(--bg-tertiary)' }}>
              <th onClick={() => handleSort('date')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Date <ArrowUpDown size={12} />
                </span>
              </th>
              <th onClick={() => handleSort('totalTime')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Total Duration <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '16px' }}>Productive</th>
              <th style={{ padding: '16px' }}>Neutral</th>
              <th style={{ padding: '16px' }}>Distracting</th>
              <th style={{ padding: '16px' }}>Most Visited Site</th>
              <th onClick={() => handleSort('productivityScore')} style={{ padding: '16px', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Score <ArrowUpDown size={12} />
                </span>
              </th>
              <th style={{ padding: '16px' }}>Focus blocks</th>
              <th style={{ padding: '16px' }}>Blocked Hits</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading report logs...
                </td>
              </tr>
            ) : sortedReports.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No reports matching the filters were found.
                </td>
              </tr>
            ) : (
              sortedReports.map((report) => (
                <tr key={report._id} style={{
                  borderBottom: '1px solid var(--card-border)',
                  transition: 'background-color var(--transition-fast)'
                }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{report.date}</td>
                  <td style={{ padding: '16px' }}>{toMin(report.totalTime)}m</td>
                  <td style={{ padding: '16px', color: 'var(--color-productive)' }}>{toMin(report.productiveTime)}m</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{toMin(report.neutralTime)}m</td>
                  <td style={{ padding: '16px', color: 'var(--color-distracting)' }}>{toMin(report.distractingTime)}m</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{report.mostVisitedSite || 'N/A'}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>
                    <span style={{
                      backgroundColor: report.productivityScore >= 75 ? 'rgba(16, 185, 129, 0.1)' : report.productivityScore >= 45 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: report.productivityScore >= 75 ? 'var(--color-productive)' : report.productivityScore >= 45 ? 'var(--color-neutral)' : 'var(--color-distracting)',
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {report.productivityScore}%
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>{report.focusSessionsCount}</td>
                  <td style={{ padding: '16px' }}>{report.blockedAttemptsCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
