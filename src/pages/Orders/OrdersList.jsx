import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';
import CustomSelect from '../../components/CustomSelect';
import CustomDatePicker from '../../components/CustomDatePicker';
import { 
  ShoppingBag, Search, Filter, MoreVertical, ExternalLink, 
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Plus, X, ChevronLeft, ChevronRight,
  Printer, Trash2, CreditCard, Download
} from 'lucide-react';
import './Orders.css';

const Overlay = ({ isOpen, onClose, title, children, maxWidth = '500px', className = '' }) => {
  if (!isOpen) return null;
  return (
    <div className={`overlay-backdrop ${className}`} onClick={onClose}>
      <div
        className="overlay-container"
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        <div className="overlay-header">
          <h2 className="overlay-title">{title}</h2>
          <button onClick={onClose} className="overlay-close-btn">
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
        <div className="overlay-body">
          {children}
        </div>
      </div>
    </div>
  );
};

const OrdersList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(null); // stores order ID
  const receiptRef = useRef(null);

  // Filters and Pagination
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all_time'); 
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (dateFilter === 'custom' && !customDateStart && !customDateEnd) {
      const today = new Date().toISOString().split('T')[0];
      setCustomDateStart(today);
      setCustomDateEnd(today);
    }
  }, [dateFilter, customDateStart, customDateEnd]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders', err);
      showToast('Failed to fetch orders', 'error');
    }
    setLoading(false);
  };

  const fetchStore = async () => {
    try {
      const res = await api.get('/auth/store');
      setStore(res.data);
    } catch (err) {
      console.error('Error fetching store info', err);
    }
  };

  const markAsViewed = async () => {
    try {
      await api.patch('/orders/mark-viewed/all');
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('orders-viewed'));
    } catch (err) {
      console.error('Error marking orders as viewed', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStore();
    // REMOVED markAsViewed() from here - only mark as viewed when handled

    // Listen for new orders from AdminLayout socket
    const handleNewOrder = () => {
      fetchOrders();
    };

    const handleSync = () => {
      fetchOrders();
    };

    window.addEventListener('new-order-received', handleNewOrder);
    window.addEventListener('orders-updated', handleSync);
    return () => {
      window.removeEventListener('new-order-received', handleNewOrder);
      window.removeEventListener('orders-updated', handleSync);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterOrderStatus, filterPaymentStatus, dateFilter, searchTerm, customDateStart, customDateEnd]);

  const getOrderStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return { class: 'status-completed', icon: CheckCircle2, bg: '#ecfdf4', text: '#065f46', border: '#a7f3d0' };
      case 'pending': return { class: 'status-pending', icon: Clock, bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'cancelled': return { class: 'status-cancelled', icon: XCircle, bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
      default: return { class: 'status-default', icon: AlertCircle, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const getPaymentStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { class: 'payment-paid', icon: CheckCircle2, bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
      case 'pending': return { class: 'payment-pending', icon: Clock, bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' };
      case 'failed': return { class: 'payment-failed', icon: XCircle, bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      default: return { class: 'payment-default', icon: AlertCircle, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const handleUpdateStatus = async (orderId, updates) => {
    try {
      await api.patch(`/orders/${orderId}/status`, updates);
      showToast('Order updated successfully', 'success');
      fetchOrders();
      setActionMenuOpen(null);
      // Notify other components (like sidebar) to update count
      window.dispatchEvent(new CustomEvent('orders-updated'));
    } catch (err) {
      showToast('Failed to update order', 'error');
    }
  };

  const handleMarkViewed = async (orderId) => {
    try {
      await api.patch(`/orders/mark-viewed/${orderId}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_viewed: true } : o));
    } catch (err) {
      console.error('Failed to mark as viewed', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: '#fff',
        style: {
          borderRadius: 0,
          boxShadow: 'none'
        }
      });
      const link = document.createElement('a');
      link.download = `receipt-${selectedOrder.id}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Receipt image downloaded!', 'success');
    } catch (err) {
      showToast('Failed to generate image', 'error');
    }
  };

  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (filterOrderStatus !== 'all') {
      result = result.filter(o => o.status?.toLowerCase() === filterOrderStatus);
    }

    if (filterPaymentStatus !== 'all') {
      result = result.filter(o => o.payment_status?.toLowerCase() === filterPaymentStatus);
    }

    if (dateFilter !== 'all_time') {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      const pastDate = new Date();
      pastDate.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        // pastDate is today 00:00:00
      } else if (dateFilter === 'last_7_days') {
        pastDate.setDate(pastDate.getDate() - 7);
      } else if (dateFilter === 'this_month') {
        pastDate.setDate(1);
      } else if (dateFilter === 'custom' && customDateStart && customDateEnd) {
        pastDate.setTime(new Date(customDateStart).getTime());
        pastDate.setHours(0, 0, 0, 0);
        now.setTime(new Date(customDateEnd).getTime());
        now.setHours(23, 59, 59, 999);
      }

      result = result.filter(o => {
        const d = new Date(o.createdAt || o.created_at);
        return d >= pastDate && d <= now;
      });
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(order => 
        String(order.id).includes(searchTerm) || 
        (order.Customer?.name || '').toLowerCase().includes(searchLower) ||
        (order.Customer?.phone || '').includes(searchTerm)
      );
    }

    result.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

    return result;
  }, [orders, filterOrderStatus, filterPaymentStatus, dateFilter, searchTerm, customDateStart, customDateEnd]);

  const totalPages = Math.ceil(processedOrders.length / itemsPerPage) || 1;
  const currentData = processedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalFilteredRevenue = processedOrders.reduce((sum, order) => sum + parseFloat(order.final_amount || 0), 0);

  const orderStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  const paymentStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid / Pending', value: 'pending' },
    { label: 'Failed', value: 'failed' }
  ];

  const dateFilterOptions = [
    { label: 'All Time', value: 'all_time' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Custom Range', value: 'custom' }
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Track and analyze your store's sales transactions history.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/admin/orders/create')}
            style={{ padding: '0.65rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
          >
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      <div className="card orders-list-card">
        
        {/* Comprehensive Filters Bar */}
        <div className="filters-bar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search ID, Name or Phone..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <CustomSelect 
              icon={Filter}
              label="Order"
              value={filterOrderStatus}
              onChange={setFilterOrderStatus}
              options={orderStatusOptions}
            />
            <CustomSelect 
              icon={CreditCard}
              label="Payment"
              value={filterPaymentStatus}
              onChange={setFilterPaymentStatus}
              options={paymentStatusOptions}
            />
            <CustomSelect 
              icon={Calendar}
              value={dateFilter}
              onChange={setDateFilter}
              options={dateFilterOptions}
            />
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === 'custom' && (
          <div className="custom-date-container" style={{ 
            display: 'flex', gap: '1.5rem', padding: '1.25rem 1.5rem', background: '#f8fafc', 
            borderBottom: '1px solid var(--border)', alignItems: 'flex-end', animation: 'fadeIn 0.3s ease-out' 
          }}>
            <CustomDatePicker 
              label="From Date"
              value={customDateStart}
              onChange={(date) => {
                if (customDateEnd && date > customDateEnd) {
                  showToast('Start date cannot be after end date', 'warning');
                  return;
                }
                setCustomDateStart(date);
              }}
              rangeStart={customDateStart}
              rangeEnd={customDateEnd}
            />
            <CustomDatePicker 
              label="To Date"
              value={customDateEnd}
              onChange={(date) => {
                if (customDateStart && date < customDateStart) {
                  showToast('End date cannot be before start date', 'warning');
                  return;
                }
                setCustomDateEnd(date);
              }}
              rangeStart={customDateStart}
              rangeEnd={customDateEnd}
            />
            
            <div style={{ paddingBottom: '0.4rem' }}>
              {(customDateStart || customDateEnd) && (
                <button 
                  className="btn-text" 
                  style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => { setCustomDateStart(''); setCustomDateEnd(''); }}
                >
                  <X size={14} /> Clear Range
                </button>
              )}
            </div>
          </div>
        )}

        {/* Aggregate Banner */}
        <div className="aggregate-banner">
          <div>
            <div className="aggregate-item-label">Found Orders</div>
            <div className="aggregate-item-value">{processedOrders.length}</div>
          </div>
          <div>
            <div className="aggregate-item-label">Total Revenue</div>
            <div className="aggregate-item-value primary">₹{totalFilteredRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {/* Modern Data Table */}
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order Info</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Fulfillment</th>
                <th>Payment</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '5rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading transactions...</p>
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map(order => {
                  const orderStatusInfo = getOrderStatusInfo(order.status);
                  const payStatusInfo = getPaymentStatusInfo(order.payment_status);
                  const OrderStatusIcon = orderStatusInfo.icon;
                  const PayStatusIcon = payStatusInfo.icon;
                  const orderDate = new Date(order.createdAt || order.created_at);
                  
                  return (
                    <tr key={order.id} className="order-row">
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="order-id-badge">
                            #{order.id}
                            {!order.is_viewed && <span className="new-order-indicator">NEW</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>ID: {order.id}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.items?.length || 0} items</span>
                              {order.items?.length > 0 && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', fontStyle: 'italic' }}>
                                  {order.items.slice(0, 2).map((it, i) => (
                                    <span key={i}>
                                      {it.Product?.name}{it.selected_brand ? ` (${it.selected_brand})` : ''}{i < 1 && order.items.length > 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                  {order.items.length > 2 && ' ...'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {order.Customer?.name || 'Walk-in Customer'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {order.Customer?.phone || 'No phone'}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>
                          {orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} />
                          {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <span 
                            className="status-badge" 
                            style={{ 
                              backgroundColor: order.order_type === 'delivery' ? '#f5f3ff' : '#eff6ff', 
                              color: order.order_type === 'delivery' ? '#5b21b6' : '#1e40af', 
                              borderColor: order.order_type === 'delivery' ? '#ddd6fe' : '#bfdbfe',
                              width: 'fit-content',
                              fontWeight: 800
                            }}
                          >
                            {order.order_type === 'delivery' ? 'DELIVERY' : 'PICKUP'}
                          </span>
                          {order.order_type === 'delivery' && order.delivery_address && (
                            <div 
                              style={{ 
                                fontSize: '0.7rem', 
                                color: 'var(--text-muted)', 
                                maxWidth: '180px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                fontStyle: 'italic'
                              }}
                              title={order.delivery_address}
                            >
                              {order.delivery_address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                            ₹{parseFloat(order.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                            <span 
                              className="status-badge" 
                              style={{ 
                                backgroundColor: payStatusInfo.bg, 
                                color: payStatusInfo.text, 
                                borderColor: payStatusInfo.border,
                                padding: '0.1rem 0.4rem',
                                fontSize: '0.65rem'
                              }}
                            >
                              <PayStatusIcon size={10} />
                              {order.payment_status?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              {order.payment_type || 'cash'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span className="status-badge" style={{ backgroundColor: orderStatusInfo.bg, color: orderStatusInfo.text, borderColor: orderStatusInfo.border, width: 'fit-content' }}>
                            <OrderStatusIcon size={14} />
                            {order.status || 'pending'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label className="switch">
                              <input 
                                type="checkbox" 
                                checked={order.is_approved} 
                                onChange={(e) => handleUpdateStatus(order.id, { is_approved: e.target.checked })}
                              />
                              <span className="slider round"></span>
                            </label>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: order.is_approved ? '#10b981' : '#f59e0b' }}>
                              {order.is_approved ? 'APPROVED' : 'APPROVE'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', position: 'relative' }}>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} 
                            title="View Receipt"
                            onClick={() => { 
                               setSelectedOrder(order); 
                               setReceiptModalOpen(true); 
                               // Removed auto-mark-viewed on view receipt
                             }}
                          >
                            <ExternalLink size={16} color="var(--text-muted)" />
                          </button>
                          <button 
                            className="btn-outline" 
                            style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                            onClick={() => {
                               setActionMenuOpen(actionMenuOpen === order.id ? null : order.id);
                               // Removed auto-mark-viewed on action menu open
                             }}
                          >
                            <MoreVertical size={16} color="var(--text-muted)" />
                          </button>

                          {/* Action Popover */}
                          {actionMenuOpen === order.id && (
                            <div className="action-popover" style={{ minWidth: '180px' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0.25rem 0.5rem', textTransform: 'uppercase' }}>Update Order Status</div>
                              {order.status !== 'cancelled' && (
                                <button 
                                  className="action-menu-btn danger" 
                                  onClick={() => {
                                    showAlert({
                                      title: 'Cancel Order?',
                                      message: `Are you sure you want to cancel Order #${order.id}?${store?.stock_management_enabled !== false ? ' This action will revert stock levels.' : ''}`,
                                      type: 'warning',
                                      confirmText: 'YES, CANCEL ORDER',
                                      cancelText: 'NO, KEEP IT',
                                      showCancel: true,
                                      onConfirm: () => handleUpdateStatus(order.id, { status: 'cancelled' }),
                                      variant: 'discard'
                                    });
                                  }}
                                >
                                  <Trash2 size={14} /> Cancel Order
                                </button>
                              )}
                                <button 
                                  className="action-menu-btn success" 
                                  onClick={() => handleUpdateStatus(order.id, { status: 'completed' })}
                                >
                                  <CheckCircle2 size={14} /> Mark Completed
                                </button>

                              <button 
                                className="action-menu-btn" 
                                onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                                style={{ color: 'var(--primary)' }}
                              >
                                <ExternalLink size={14} /> Edit Order
                              </button>

                              <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0.25rem 0.5rem', textTransform: 'uppercase' }}>Update Payment</div>
                              
                              {order.payment_status !== 'paid' && (
                                <button 
                                  className="action-menu-btn success" 
                                  onClick={() => handleUpdateStatus(order.id, { payment_status: 'paid' })}
                                >
                                  <CreditCard size={14} /> Mark as Paid
                                </button>
                              )}
                              {order.payment_status === 'paid' && (
                                <button 
                                  className="action-menu-btn danger" 
                                  onClick={() => handleUpdateStatus(order.id, { payment_status: 'pending' })}
                                >
                                  <Clock size={14} /> Mark as Unpaid
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <ShoppingBag size={28} color="#cbd5e1" />
                    </div>
                    <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No Orders Found</h4>
                    {orders.length === 0 ? (
                      <p style={{ fontSize: '0.85rem' }}>You haven't processed any transactions yet.</p>
                    ) : (
                      <p style={{ fontSize: '0.85rem' }}>No orders found matching your filters.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-footer">
            <div className="pagination-info">
              Showing <span style={{ color: 'var(--text-main)' }}>{((currentPage - 1) * itemsPerPage) + 1}</span> to <span style={{ color: 'var(--text-main)' }}>{Math.min(currentPage * itemsPerPage, processedOrders.length)}</span> of <span style={{ color: 'var(--text-main)' }}>{processedOrders.length}</span> orders
            </div>
            <div className="pagination-btns">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                  }
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details / Receipt Modal */}
      <Overlay 
        isOpen={receiptModalOpen} 
        onClose={() => setReceiptModalOpen(false)} 
        title={`Order Details #${selectedOrder?.id}`}
        maxWidth="450px"
        className="print-area-wrapper"
      >
        {selectedOrder && (
          <div className="print-area">
            <div className="receipt-container premium" ref={receiptRef}>
              <div className="receipt-header-premium">
                <h2>{store?.name || 'GRAVITY POS'}</h2>
                <p>{store?.address || 'Terminal #01'}</p>
                {store?.phone && <p>Ph: {store.phone}</p>}
                {store?.email && <p>{store.email}</p>}
              </div>

              <div className="receipt-info-grid">
                <div className="receipt-info-item">
                  <label>Order ID</label>
                  <span>#{selectedOrder.id}</span>
                </div>
                <div className="receipt-info-item">
                  <label>Date & Time</label>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div className="receipt-info-item">
                  <label>Customer</label>
                  <span>{selectedOrder.Customer?.name || 'WALK-IN'}</span>
                </div>
                <div className="receipt-info-item">
                  <label>Status</label>
                  <span style={{ color: selectedOrder.payment_status === 'paid' ? 'var(--success)' : 'var(--error)' }}>
                    {selectedOrder.payment_status?.toUpperCase()}
                  </span>
                </div>
                <div className="receipt-info-item">
                  <label>Fulfillment</label>
                  <span>{selectedOrder.order_type?.toUpperCase() || 'PICKUP'}</span>
                </div>
                {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
                  <div className="receipt-info-item" style={{ gridColumn: 'span 2' }}>
                    <label>Delivery Address</label>
                    <span style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>{selectedOrder.delivery_address}</span>
                  </div>
                )}
              </div>

              <div className="receipt-table-premium">
                <div className="receipt-table-header">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="receipt-item-row">
                    <div className="receipt-item-main">
                      <div className="receipt-item-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800 }}>{item.Product?.name}</span>
                        {item.selected_brand && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                            ({item.selected_brand})
                          </span>
                        )}
                        {item.selected_unit && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {item.selected_unit}
                          </span>
                        )}
                      </div>
                      <div className="receipt-item-meta">{item.quantity} x ₹{parseFloat(item.unit_price).toFixed(2)}</div>
                    </div>
                    <div className="receipt-item-total">₹{parseFloat(item.subtotal).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="receipt-summary-premium">
                <div className="receipt-summary-row">
                  <span>Subtotal</span>
                  <span>₹{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
                {parseFloat(selectedOrder.discount_amount) > 0 && (
                  <div className="receipt-summary-row" style={{ color: 'var(--error)' }}>
                    <span>Discount</span>
                    <span>-₹{parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="receipt-summary-row grand-total">
                  <span>TOTAL</span>
                  <span>₹{parseFloat(selectedOrder.final_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="receipt-footer-premium">
                <p>Thank you for your business!</p>
                <p style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.7rem' }}>
                  Method: {selectedOrder.payment_type?.toUpperCase()} | Powered by GravityPOS
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }} className="no-print">
              <button 
                onClick={handleDownloadImage} 
                className="btn btn-primary" 
                style={{ flex: 1.5, height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Download size={20} /> Download Receipt
              </button>
              <button 
                onClick={handlePrint} 
                className="btn btn-outline" 
                style={{ flex: 1, height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Printer size={18} /> Print
              </button>
              <button 
                onClick={() => setReceiptModalOpen(false)} 
                className="btn btn-outline" 
                style={{ height: '48px', padding: '0 1rem', borderRadius: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Overlay>
    </div>
  );
};

export default OrdersList;
