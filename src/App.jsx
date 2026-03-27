import React from 'react';
import { 
  createHashRouter, 
  createRoutesFromElements, 
  Route, 
  RouterProvider, 
  Link, 
  useNavigate, 
  useLocation, 
  Outlet 
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import InventoryDashboard from './pages/Inventory/InventoryDashboard';
import InsufficientStock from './pages/Inventory/InsufficientStock';
import AddProduct from './pages/Inventory/AddProduct';
import AddCategory from './pages/Inventory/AddCategory';
import OrdersList from './pages/Orders/OrdersList';
import CustomerList from './pages/Customers/CustomerList';
import AddCustomer from './pages/Customers/AddCustomer';
import StockAlerts from './pages/Admin/StockAlerts';
import StoreSettings from './pages/Settings/StoreSettings';
import BillCustomization from './pages/Settings/BillCustomization';
import DomainConfiguration from './pages/Settings/DomainConfiguration';
import About from './pages/Settings/About';
import DataManagement from './pages/Settings/DataManagement';
import CreateOrder from './pages/Orders/CreateOrder';
import { ToastContainer } from './components/common/Toast';
import PrettyAlert from './components/common/PrettyAlert';
import Storefront from './pages/Storefront';
import './App.css';

const NotFound = () => (
  <div className="not-found-container">
    <h1>404 - Not Found</h1>
    <p>The page you are looking for doesn't exist.</p>
    <Link to="/" className="btn btn-primary not-found-link">Go Home</Link>
  </div>
);

const RootLayout = () => {
  const { user, store, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCustomDomain = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const isStorefrontSlug = location.pathname !== '/' && !isAdminRoute && !['/login', '/register'].includes(location.pathname);

  return (
    <div>
      {!isAdminRoute && !isCustomDomain && !isStorefrontSlug && (
        <nav className="navbar">
          <Link to="/" className="navbar-logo">GravityPOS Cloud</Link>
          <Link to={store?.slug ? `/${store.slug}` : "/"} className="btn btn-outline nav-link-no-border">Storefront</Link>
          
          {user ? (
            <>
              <Link to="/admin" className="btn btn-outline nav-link-no-border">Dashboard</Link>
              <button onClick={handleLogout} className="btn btn-primary btn-logout">Logout</button>
            </>
          ) : (
            <div style={{ flex: 1 }}></div>
          )}
        </nav>
      )}
      
      <main className={`${!isAdminRoute ? "container" : ""} app-main ${!isAdminRoute ? "with-padding" : "no-padding"}`}>
        <Outlet />
      </main>
      <ToastContainer />
      <PrettyAlert />
    </div>
  );
};

const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<Storefront />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      
      <Route 
        path="admin" 
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        } 
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<InventoryDashboard />} />
        <Route path="inventory/insufficient" element={<InsufficientStock />} />
        <Route path="inventory/products/add" element={<AddProduct />} />
        <Route path="inventory/products/edit/:id" element={<AddProduct />} />
        <Route path="inventory/categories/add" element={<AddCategory />} />
        <Route path="inventory/categories/edit/:id" element={<AddCategory />} />
        <Route path="inventory/alerts" element={<StockAlerts />} />
        
        <Route path="orders" element={<OrdersList />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="orders/edit/:id" element={<CreateOrder />} />
        
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/add" element={<AddCustomer />} />
        <Route path="customers/edit/:id" element={<AddCustomer />} />
        
        <Route path="settings" element={<StoreSettings />} />
        <Route path="settings/bill" element={<BillCustomization />} />
        <Route path="settings/domain" element={<DomainConfiguration />} />
        <Route path="settings/about" element={<About />} />
        <Route path="settings/data" element={<DataManagement />} />
      </Route>

      <Route path=":slug" element={<Storefront />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
