import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { 
  AlertTriangle, 
  Package, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import '../Orders/Orders.css'; // Reusing orders styles

const InsufficientStock = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [stockInputs, setStockInputs] = useState({});
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchInsufficientOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/insufficient');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching insufficient orders', err);
      showToast('Failed to fetch data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInsufficientOrders();
  }, []);

  const handleStockUpdate = async (productId, currentStock) => {
    const newVal = stockInputs[productId];
    if (newVal === undefined || newVal === '') {
      showToast('Please enter a valid stock quantity', 'warning');
      return;
    }

    setUpdatingId(productId);
    try {
      // Fetch current product to get full data or just update stock
      await api.patch(`/products/${productId}`, { stock_quantity: parseFloat(newVal) });
      showToast('Stock updated successfully', 'success');
      fetchInsufficientOrders();
      // Clear input
      const newInputs = { ...stockInputs };
      delete newInputs[productId];
      setStockInputs(newInputs);
    } catch (err) {
      console.error('Stock update error', err);
      showToast('Failed to update stock', 'error');
    }
    setUpdatingId(null);
  };

  const handleInputChange = (productId, val) => {
    setStockInputs({
      ...stockInputs,
      [productId]: val
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insufficient Stock Management</h1>
          <p className="page-subtitle">Restock products to fulfill pending orders with deficits.</p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={fetchInsufficientOrders}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="insufficient-orders-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Checking inventory levels...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map(order => (
            <div key={order.id} className="card insufficient-order-card" style={{ padding: 0, overflow: 'hidden', borderLeft: '5px solid var(--error)' }}>
              {/* Order Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#fff1f2', borderBottom: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="order-id-badge" style={{ background: 'var(--error)', color: 'white' }}>#{order.id}</div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} /> {order.Customer?.name || 'Walk-in Customer'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>{order.Customer?.phone || 'No phone'} • Pending</div>
                  </div>
                </div>
                <button 
                  className="btn-text" 
                  onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                  style={{ color: '#b91c1c', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  View Order <ChevronRight size={14} />
                </button>
              </div>

              {/* Insufficient Items */}
              <div style={{ padding: '1rem 1.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Items Needing Restock</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {order.items?.filter(item => item.Product?.stock_quantity < 0).map(item => (
                    <div key={item.id} className="insufficient-item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                          <Package size={20} color="var(--error)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.Product?.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--error)' }}>Stock: {item.Product?.stock_quantity}</span>
                            <ArrowRight size={12} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>Need {Math.abs(item.Product?.stock_quantity)} more</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stock Update */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="number" 
                            step="any"
                            className="input-pretty" 
                            placeholder="Add New Stock"
                            style={{ width: '130px', height: '42px', paddingRight: '2rem' }}
                            value={stockInputs[item.product_id] || ''}
                            onChange={(e) => handleInputChange(item.product_id, e.target.value)}
                          />
                          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            {item.Product?.measure_unit || 'pcs'}
                          </span>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ height: '42px', borderRadius: '10px', padding: '0 1rem' }}
                          onClick={() => handleStockUpdate(item.product_id, item.Product?.stock_quantity)}
                          disabled={updatingId === item.product_id}
                        >
                          {updatingId === item.product_id ? <div className="spinner-small"></div> : 'Update'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: '5rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid #dcfce7' }}>
              <CheckCircle2 size={40} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Inventory is Sufficient</h3>
            <p style={{ color: 'var(--text-muted)' }}>There are no pending orders with stock deficits at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsufficientStock;
