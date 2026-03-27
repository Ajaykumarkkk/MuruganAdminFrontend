import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Store,
  ChevronRight,
  Menu,
  X,
  Bell,
  Database,
  Info,
  AlertTriangle
} from 'lucide-react';

import './AdminLayout.css';

const AdminLayout = () => {
  const { user, store, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [lastOrderId, setLastOrderId] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const prevDataRef = React.useRef({ count: 0, id: null });

  // Order Notifications Polling
  React.useEffect(() => {
    if (!user || !store?.id) return;

    // Initial fetch for count
    const fetchInitialCount = async (isFirstLoad = false) => {
      try {
        const res = await api.get('/orders/latest');
        const { unreadCount: apiCount, id: apiLastId } = res.data;
        
        const countChanged = apiCount !== prevDataRef.current.count;
        const idChanged = apiLastId !== prevDataRef.current.id;

        if (countChanged || idChanged) {
          const prevCount = prevDataRef.current.count;
          const prevId = prevDataRef.current.id;
          
          setUnreadCount(apiCount || 0);
          setLastOrderId(apiLastId);
          prevDataRef.current = { count: apiCount || 0, id: apiLastId };

          // Notify other components (like OrdersList) if state changed
          if (!isFirstLoad) {
            window.dispatchEvent(new CustomEvent('orders-updated'));
            
            // Show toast if it's a NEW unread order (not just marked viewed)
            if (apiCount > prevCount && apiLastId !== prevId && prevId !== null) {
              showToast('🔔 New Order Received!', 'success');
              // Play sound (optional, might need to memoize Audio again)
            }
          }
        }
      } catch (err) {
        console.error('Initial count fetch failed:', err);
      }
    };
    
    fetchInitialCount(true);

    // Listen for local view event from OrdersList or other actions
    const handleSync = () => {
      fetchInitialCount(false);
    };

    window.addEventListener('orders-updated', handleSync);
    window.addEventListener('orders-viewed', handleSync);

    // Poll for new orders (e.g., every 30 seconds)
    const pollInterval = setInterval(() => fetchInitialCount(false), 30000);

    return () => {
      window.removeEventListener('orders-updated', handleSync);
      window.removeEventListener('orders-viewed', handleSync);
      clearInterval(pollInterval);
    };
  }, [user, store?.id, showToast]);

  // Keep-alive for Render Free Tier (Pings every 3 minutes)
  React.useEffect(() => {
    if (!user) return;

    const pingServer = async () => {
      try {
        await api.get('/auth/store');
        // console.log('[Keep-Alive] Server pinged successfully');
      } catch (err) {
        // Silent fail, just a ping
      }
    };

    // Set interval for pinging
    const interval = setInterval(pingServer, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Inventory', path: '/admin/inventory', icon: Package },
    { name: 'Insufficient Stock', path: '/admin/inventory/insufficient', icon: AlertTriangle },
    { name: 'Stock Alerts', path: '/admin/inventory/alerts', icon: Bell },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Data Backup', path: '/admin/settings/data', icon: Database },
    { name: 'About App', path: '/admin/settings/about', icon: Info },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';

    // Check if there is a more specific nav item that matches the current location
    const otherMatches = navItems.filter(item =>
      item.path !== path && location.pathname.startsWith(item.path)
    );

    // If the current path is a prefix of shorter length than another match, it's not the active one
    if (otherMatches.some(m => m.path.length > path.length)) return false;

    return location.pathname.startsWith(path);
  };


  return (
    <div className="admin-layout">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to={store?.slug ? `/${store.slug}` : "/"} className="sidebar-logo-link">
            <div className="sidebar-logo-icon-wrapper">
              <Store size={20} />
            </div>
            <span>GravityPOS</span>
          </Link>
          {unreadCount > 0 && (
            <Link 
              to="/admin/orders"
              className="notification-bell-btn pulse-animation"
              title={`${unreadCount} new orders`}
            >
              <Bell size={18} />
              <span className="notification-badge-sidebar">{unreadCount}</span>
            </Link>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              <span style={{ flex: 1 }}>{item.name}</span>
              {item.name === 'Orders' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
              {isActive(item.path) && <ChevronRight size={16} className="sidebar-nav-active-icon" />}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-wrapper">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="store-name-small">{store?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-link logout-btn-sidebar"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <h1 style={{ fontSize: '1.25rem' }}>{store?.name}</h1>
          <div style={{ width: '24px' }} />
        </header>

        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
