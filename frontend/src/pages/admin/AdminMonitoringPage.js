import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';
import './AdminPetsPage.css';

const AdminMonitoringPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [filters, setFilters] = useState({ status: [] });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    fetchReports();
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      const response = await api.get('/admin/monitoring');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const completeReport = async (reportId) => {
    try {
      await api.put(`/admin/monitoring/${reportId}`, {
        status: 'reviewed',
        evaluationNotes
      });
      toast.success('Report reviewed successfully');
      fetchReports();
      setShowDetailsModal(false);
      setSelectedReport(null);
      setEvaluationNotes('');
    } catch (error) {
      toast.error('Failed to complete review');
    }
  };

  const toggleFilterOption = (group, value) => {
    setFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(value)
        ? prev[group].filter(v => v !== value)
        : [...prev[group], value]
    }));
  };

  const openDetailsModal = (report) => {
    setSelectedReport(report);
    setEvaluationNotes(report.evaluationNotes || '');
    setShowDetailsModal(true);
  };

  const filteredReports = reports
    .filter(report => {
      if (searchTerm &&
        !report.userName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !report.petName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filters.status.length && !filters.status.includes(report.status)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const reviewedCount = reports.filter(r => r.status === 'reviewed').length;

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <main className="admin-content">
          <div className="no-data">Loading monitoring reports...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <AdminSidebar />
      <main className="admin-content">
        <div className="page-header">
          <h1><i className="fas fa-chart-line"></i> MONITORING REPORTS</h1>
          <div className="stats-summary">
            <span className="stat-badge">
              <i className="fas fa-clipboard-list"></i> Total: {reports.length}
            </span>
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {pendingCount}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Reviewed: {reviewedCount}
            </span>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by user or pet name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={() => setShowFilterModal(true)}>
            <i className="fas fa-sliders-h"></i> Filter
          </button>
        </div>

        <div className="pets-table-container">
          <table className="pets-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pet</th>
                <th>Month</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report._id}>
                  <td>
                    <strong>{report.userName}</strong><br />
                    <small style={{ color: '#A98978' }}>{report.userEmail}</small>
                  </td>
                  <td><strong>{report.petName}</strong></td>
                  <td>{report.month} {report.month === 1 ? 'month' : 'months'}</td>
                  <td>
                    {report.submittedAt
                      ? new Date(report.submittedAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    {report.status === 'reviewed' ? (
                      <span className="badge-verified">
                        <i className="fas fa-check-circle"></i> REVIEWED
                      </span>
                    ) : (
                      <span className="badge-pending">
                        <i className="fas fa-clock"></i> PENDING
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => openDetailsModal(report)}>
                        <i className="fas fa-eye"></i> Review
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="no-data">
              <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#DDCAC0' }}></i>
              <p>No monitoring reports found</p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal-container filter-modal" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowFilterModal(false)}></i>
            <h2><i className="fas fa-filter"></i> Filter Reports</h2>
            <div className="filter-group">
              <label>Report Status</label>
              <div className="filter-options">
                {[['pending', 'Pending Review'], ['reviewed', 'Reviewed']].map(([val, label]) => (
                  <label key={val}>
                    <input
                      type="checkbox"
                      checked={filters.status.includes(val)}
                      onChange={() => toggleFilterOption('status', val)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button className="apply-filter-btn" onClick={() => setShowFilterModal(false)}>
              <i className="fas fa-check"></i> Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-clipboard-list"></i> MONITORING REPORT</h2>

            <div className="user-details">
              <div className="detail-row">
                <span className="detail-label">Pet Name:</span>
                <span className="detail-value">{selectedReport.petName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Reporting Month:</span>
                <span className="detail-value">
                  {selectedReport.month} {selectedReport.month === 1 ? 'month' : 'months'} post-adoption
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Adopter:</span>
                <span className="detail-value">{selectedReport.userName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{selectedReport.userEmail}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Submitted:</span>
                <span className="detail-value">
                  {selectedReport.submittedAt
                    ? new Date(selectedReport.submittedAt).toLocaleString()
                    : '—'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {selectedReport.status === 'reviewed' ? (
                    <span className="badge-verified"><i className="fas fa-check-circle"></i> REVIEWED</span>
                  ) : (
                    <span className="badge-pending"><i className="fas fa-clock"></i> PENDING</span>
                  )}
                </span>
              </div>
            </div>

            <div className="id-preview">
              <i className="fas fa-heartbeat" style={{ fontSize: '1.5rem', color: '#C28A7A' }}></i>
              <p><strong>Health Status</strong></p>
              <p style={{ color: '#7F665A', marginTop: '0.3rem' }}>
                {selectedReport.healthStatus || 'No health status provided'}
              </p>
            </div>

            <div className="id-preview">
              <i className="fas fa-home" style={{ fontSize: '1.5rem', color: '#C28A7A' }}></i>
              <p><strong>Living Environment</strong></p>
              <p style={{ color: '#7F665A', marginTop: '0.3rem' }}>
                {selectedReport.livingEnvironment || 'No living environment details provided'}
              </p>
            </div>

            <div className="admin-notes">
              <label><strong>ADMIN EVALUATION NOTES</strong></label>
              <textarea
                rows="3"
                value={evaluationNotes}
                onChange={e => setEvaluationNotes(e.target.value)}
                placeholder="Type your evaluation notes here..."
              />
            </div>

            <div className="modal-actions">
              <button
                className="approve-btn"
                onClick={() => completeReport(selectedReport._id)}
                disabled={selectedReport.status === 'reviewed'}
              >
                <i className="fas fa-check-circle"></i>
                {selectedReport.status === 'reviewed' ? 'Already Reviewed' : 'Complete Review'}
              </button>
              <button className="reject-btn" onClick={() => setShowDetailsModal(false)}>
                <i className="fas fa-times"></i> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringPage;
