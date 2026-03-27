import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Users, 
  Clock,
  AlertCircle
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, store } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [statsData, setStatsData] = useState({
    todaysSales: 0,
    totalOrders: 0,
    activeProducts: 0,
    newCustomers: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          api.get('/orders'),
          api.get('/products'),
          api.get('/customers')
        ]);
        
        const orders = ordersRes.data;
        const products = productsRes.data;
        const customers = customersRes.data;

        // Today's boundaries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysOrders = orders.filter(o => new Date(o.createdAt || o.created_at) >= today);
        const todaysSales = todaysOrders.reduce((sum, o) => sum + parseFloat(o.final_amount), 0);
        
        const activeProducts = products.filter(p => p.is_active !== false).length;
        const newCustomers = customers.filter(c => new Date(c.createdAt || c.created_at) >= today).length;

        setStatsData({
          todaysSales,
          totalOrders: orders.length,
          activeProducts,
          newCustomers
        });

        const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
        const recent = sortedOrders.slice(0, 4).map(o => {
          const minDiff = Math.floor((new Date() - new Date(o.createdAt || o.created_at)) / 60000);
          let timeStr = `${minDiff} mins ago`;
          if (minDiff > 60) timeStr = `${Math.floor(minDiff / 60)} hours ago`;
          if (minDiff > 1440) timeStr = `${Math.floor(minDiff / 1440)} days ago`;
          if (minDiff < 1) timeStr = `Just now`;

          return {
            id: o.id,
            action: 'New order received',
            detail: `Order #${o.id} - ₹${parseFloat(o.final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            time: timeStr
          };
        });
        setRecentActivity(recent);

        // Chart Data (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          return d;
        }).reverse();

        const cData = last7Days.map(date => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const dayOrders = orders.filter(o => {
            const d = new Date(o.createdAt || o.created_at);
            return d >= date && d < nextDay;
          });
          const amount = dayOrders.reduce((sum, o) => sum + parseFloat(o.final_amount), 0);
          
          return {
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            amount,
            fullDate: date.toLocaleDateString()
          };
        });
        
        setChartData(cData);
      } catch (err) {
        console.error("Dashboard data load error", err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const stats = [
    { 
      label: 'Today\'s Sales', 
      value: `₹${statsData.todaysSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
      icon: TrendingUp, 
      color: '#6366f1', 
      bg: '#eef2ff',
    },
    { 
      label: 'Total Orders', 
      value: statsData.totalOrders.toLocaleString(), 
      icon: ShoppingBag, 
      color: '#10b981', 
      bg: '#ecfdf5',
    },
    { 
      label: 'Active Products', 
      value: statsData.activeProducts.toLocaleString(), 
      icon: Package, 
      color: '#f59e0b', 
      bg: '#fffbeb',
    },
    { 
      label: 'New Customers Today', 
      value: statsData.newCustomers.toLocaleString(), 
      icon: Users, 
      color: '#64748b', 
      bg: '#f8fafc',
    },
  ];

  const maxSale = Math.max(...chartData.map(d => d.amount));
  const maxChartAmount = maxSale > 1000 ? maxSale * 1.2 : 5000;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#fef2f2', color: 'var(--error)', padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
        <AlertCircle size={24} /> {error}
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="dashboard-subtitle">
          Here's what's happening at <strong>{store?.name}</strong> today.
        </p>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="card stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-info">
              <h4>{stat.label}</h4>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header-row">
            <h3 className="card-title">Sales Performance</h3>
            <div className="badge-muted">
              Last 7 Days
            </div>
          </div>
          
          <div className="chart-container">
            {chartData.map((day, idx) => {
              const heightPercent = Math.max((day.amount / maxChartAmount) * 100, 5); 
              const isToday = idx === chartData.length - 1;
              
              return (
                <div key={idx} className="chart-bar-column">
                  <div className="chart-value-label">
                    ₹{day.amount >= 1000 ? (day.amount/1000).toFixed(1) + 'k' : day.amount}
                  </div>
                  <div className="chart-bar-wrapper">
                    <div className={`chart-bar ${isToday ? 'active' : 'inactive'}`} style={{ height: `${heightPercent}%` }} />
                  </div>
                  <div className={`chart-day-label ${isToday ? 'active' : ''}`}>
                    {day.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ marginBottom: '1.5rem' }}>Recent Orders</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-content">
                  <p className="activity-action">{activity.action}</p>
                  <p className="activity-detail">{activity.detail}</p>
                  <div className="activity-time-wrapper">
                    <Clock size={12} />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <Package size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>No recent orders.</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/admin/orders')} className="btn btn-outline" style={{ marginTop: 'auto', width: '100%', fontSize: '0.85rem', padding: '0.75rem', borderRadius: '12px', fontWeight: 700 }}>View All Orders</button>
        </div>
      </div>
    
    </div>
  );
};

export default Dashboard;
