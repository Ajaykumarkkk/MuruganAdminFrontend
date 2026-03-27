import React, { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCcw, 
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import './DataManagement.css';

const DataManagement = () => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [file, setFile] = useState(null);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gravitypos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      showToast('Backup downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to create backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRestore = async () => {
    if (!file) {
      showToast('Please select a backup file first', 'error');
      return;
    }

    if (!window.confirm("WARNING: This will replace your current store data. Are you absolutely sure?")) {
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('backup', file);

    try {
      await api.post('/settings/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Data restored successfully! The page will refresh.', 'success');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to restore data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-mgmt-container">
      <header className="page-header">
        <div className="header-title-section">
          <div className="header-icon-wrapper data-icon">
            <Database size={24} />
          </div>
          <div>
            <h1 className="page-title">Data Management</h1>
            <p className="page-subtitle">Backup and recover your store information</p>
          </div>
        </div>
      </header>

      <div className="mgmt-grid">
        {/* Backup Section */}
        <div className="mgmt-card">
          <div className="mgmt-card-header">
            <div className="card-icon-circle blue">
              <Download size={22} />
            </div>
            <h3>Cloud Backup</h3>
          </div>
          <p className="mgmt-card-desc">
            Download a secure copy of all your products, categories, customers, and orders. 
            We recommend doing this weekly to keep your data safe.
          </p>
          <div className="mgmt-card-footer">
            <button 
              onClick={handleBackup} 
              disabled={loading}
              className="btn btn-primary mgmt-btn"
            >
              {loading ? <RefreshCcw className="spinner" size={18} /> : <FileJson size={18} />}
              <span>Export Data (JSON)</span>
            </button>
          </div>
        </div>

        {/* Restore Section */}
        <div className="mgmt-card">
          <div className="mgmt-card-header">
            <div className="card-icon-circle amber">
              <Upload size={22} />
            </div>
            <h3>Data Recovery</h3>
          </div>
          <p className="mgmt-card-desc">
            Restore your store information from a previously downloaded JSON backup file. 
            <span style={{ color: '#ef4444', fontWeight: 800, display: 'block', marginTop: '0.5rem' }}>
              <AlertTriangle size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              This will overwrite existing data!
            </span>
          </p>
          <div className="mgmt-card-footer">
            <div className="restore-upload">
              <input 
                type="file" 
                id="restore-file" 
                accept=".json" 
                onChange={handleFileChange}
                className="hidden-input"
              />
              <label htmlFor="restore-file" className="file-label">
                {file ? file.name : "Choose backup file"}
              </label>
              <button 
                onClick={handleRestore} 
                disabled={loading || !file}
                className="btn btn-outline mgmt-btn-restore"
              >
                {loading ? <RefreshCcw className="spinner" size={18} /> : <Upload size={18} />}
                <span>Import & Sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mgmt-warning-box">
        <AlertTriangle size={32} />
        <div className="warning-text">
          <h4>Safety Precautions</h4>
          <p>Always verify your backup file contains the correct store data before attempting a restore. GravityPOS Cloud backups are encrypted but should be stored in a safe, private location.</p>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
