import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

const AdminMonitoringPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [evaluationNotes, setEvaluationNotes] = useState('');

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
      await api.put(`/admin/monitoring/${reportId}`, { status: 'reviewed', evaluationNotes });
      toast.success('Report reviewed successfully');
      fetchReports();
      setShowDetailsModal(false);
      setEvaluationNotes('');
    } catch (error) {
      toast.error('Failed to complete review');
    }
  };

  const getStatusBadge = (status) => {
    return status === 'pending' ? 
      <span className="status-badge status-pending"><i className="fas fa-clock"></i> PENDING REVIEW</span> :
      <span className="status-badge status-approved"><i className="fas fa-check-circle"></i> REVIEWED</span>;
  };

  const filteredReports = reports.filter(report => {
    if (searchTerm && !report.userName?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !report.petName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="admin-wrapper">
        <AdminSidebar />
        <div className="admin-loading">Loading monitoring reports...</div>
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
            <span className="stat-badge pending-count">
              <i className="fas fa-clock"></i> Pending: {reports.filter(r => r.status === 'pending').length}
            </span>
            <span className="stat-badge verified-count">
              <i className="fas fa-check-circle"></i> Reviewed: {reports.filter(r => r.status === 'reviewed').length}
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
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Pet</th>
                <th>Month</th>
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
                  <td>{report.month} {report.month === 1 ? 'Month' : 'Months'}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>
                    <button 
                      className="action-btn view"
                      onClick={() => {
                        setSelectedReport(report);
                        setEvaluationNotes(report.evaluationNotes || '');
                        setShowDetailsModal(true);
                      }}
                    >
                      <i className="fas fa-eye"></i> Review Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div className="no-data">No monitoring reports found</div>
          )}
        </div>
      </main>

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal-overlay active" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <i className="fas fa-times modal-close" onClick={() => setShowDetailsModal(false)}></i>
            <h2><i className="fas fa-clipboard-list"></i> Monitoring Report Details</h2>
            
            <div className="detail-section">
              <h3><i className="fas fa-paw"></i> Pet Information</h3>
              <div className="detail-row"><span className="detail-label">Pet Name:</span> {selectedReport.petName}</div>
              <div className="detail-row"><span className="detail-label">Adoption Date:</span> {new Date(selectedReport.adoptionDate).toLocaleDateString()}</div>
              <div className="detail-row"><span className="detail-label">Reporting Month:</span> {selectedReport.month} month(s) post-adoption</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-user-check"></i> Adopter Information</h3>
              <div className="detail-row"><span className="detail-label">Name:</span> {selectedReport.userName}</div>
              <div className="detail-row"><span className="detail-label">Email:</span> {selectedReport.userEmail}</div>
              <div className="detail-row"><span className="detail-label">Verified:</span> {selectedReport.isVerified ? 'Yes' : 'No'}</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-file-medical"></i> Report Details</h3>
              <div className="detail-row"><span className="detail-label">Health Status:</span> {selectedReport.healthStatus}</div>
              <div className="detail-row"><span className="detail-label">Living Environment:</span> {selectedReport.livingEnvironment}</div>
            </div>

            <div className="detail-section">
              <h3><i className="fas fa-clipboard"></i> Admin Evaluation</h3>
              <textarea
                rows="3"
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder="Type your evaluation notes here..."
                style={{ width: '100%', padding: '10px', borderRadius: '20px', border: '1px solid #FFDDD0', resize: 'vertical' }}
              />
            </div>

            <button className="complete-btn" onClick={() => completeReport(selectedReport._id)}>
              <i className="fas fa-check-circle"></i> Complete Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringPage;
