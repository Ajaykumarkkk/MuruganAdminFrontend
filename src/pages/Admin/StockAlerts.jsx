import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  Bell, 
  User, 
  Package, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Mail,
  AlertCircle
} from 'lucide-react';
import './StockAlerts.css';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.get('/products/stock-alerts');
      setAlerts(response.data);
    } catch (error) {
      showToast('Error fetching alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsNotified = async (id) => {
    try {
      await api.put(`/products/stock-alerts/${id}/notified`);
      showToast('Marked as notified', 'success');
      fetchAlerts(); // Refresh list
    } catch (error) {
      showToast('Error updating status', 'error');
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div className="stock-alerts-container">
      <header className="page-header">
        <div className="header-title-section">
          <div className="header-icon-wrapper notification-icon">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="page-title">Stock Notifications</h1>
            <p className="page-subtitle">Customers waiting for products to be back in stock</p>
          </div>
        </div>
      </header>

      <div className="alerts-grid">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div key={alert.id} className="alert-card">
              <div className="alert-card-header">
                <div className="product-info">
                  <Package size={20} className="text-primary" />
                  <span className="product-name">{alert.Product?.name}</span>
                </div>
                <div className={`stock-badge ${alert.Product?.stock_quantity === null ? 'stock-in' : (alert.Product?.stock_quantity > 0 ? 'stock-in' : 'stock-out')}`}>
                  {alert.Product?.stock_quantity === null ? 'Unlimited Stock' : (alert.Product?.stock_quantity > 0 ? `${alert.Product.stock_quantity} ${alert.Product.measure_unit} available` : 'Still Out of Stock')}
                </div>
              </div>

              <div className="customer-info-section">
                <div className="info-row">
                  <User size={16} />
                  <span>{alert.Customer?.name}</span>
                </div>
                <div className="info-row">
                  <Phone size={16} />
                  <span>{alert.Customer?.phone}</span>
                </div>
                {alert.Customer?.email && (
                  <div className="info-row">
                    <Mail size={16} />
                    <span>{alert.Customer.email}</span>
                  </div>
                )}
              </div>

              <div className="alert-card-footer">
                <div className="timestamp">
                  <Clock size={14} />
                  <span>Requested on {new Date(alert.created_at).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => markAsNotified(alert.id)}
                  className="btn btn-primary btn-sm mark-btn"
                >
                  <CheckCircle2 size={16} />
                  Mark Notified
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-alerts">
            <AlertCircle size={48} />
            <h3>No Pending Notifications</h3>
            <p>Your customers haven't requested any stock alerts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlerts;
