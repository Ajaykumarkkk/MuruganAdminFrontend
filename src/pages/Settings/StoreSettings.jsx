import React, { useState, useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import InputGroup from '../../components/InputGroup';
import CustomModal from '../../components/CustomModal';
import { 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  CheckCircle2, 
  UserCircle,
  FileText,
  BarChart3,
  Globe,
  Info,
  Download,
  Upload,
  LogOut,
  DatabaseZap,
  Crown,
  ArrowLeft,
  Loader2,
  Truck,
  Package
} from 'lucide-react';
import './Settings.css';

const StoreSettings = () => {
  const { user, store, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('menu'); // 'menu' or 'profile'
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    pickup_address: '',
    enable_pickup: true,
    enable_delivery: true,
    show_price_default: true,
    stock_management_enabled: true
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [showInternalBlocker, setShowInternalBlocker] = useState(false);
  const { showToast } = useToast();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/auth/store');
        const storeData = {
          name: res.data.name || '',
          phone: res.data.phone || '',
          email: res.data.email || '',
          address: res.data.address || '',
          pickup_address: res.data.pickup_address || '',
          enable_pickup: res.data.enable_pickup !== false,
          enable_delivery: res.data.enable_delivery !== false,
          show_price_default: res.data.show_price_default !== false,
          stock_management_enabled: res.data.stock_management_enabled !== false
        };
        setFormData(storeData);
        setOriginalData(storeData);
      } catch (err) {
        setServerError('Failed to load store settings');
      }
      setFetching(false);
    };
    fetchStore();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name' && !value.trim()) error = 'Store name is required';
    if (name === 'phone' && value && !/^[0-9]{10}$/.test(value)) error = 'Enter 10-digit phone number';
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) error = 'Enter a valid email address';
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setIsDirty(true);
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleToggle = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
    setIsDirty(true);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess(false);
    
    const nameErr = validateField('name', formData.name);
    if (nameErr) {
      setErrors({ name: nameErr });
      setTouched({ name: true });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/store', formData);
      setSuccess(true);
      setIsDirty(false);
      showToast('Store profile updated successfully!', 'success');
      setTimeout(() => setActiveSection('menu'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating settings';
      setServerError(msg);
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (isDirty) {
      setShowInternalBlocker(true);
    } else {
      setActiveSection('menu');
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to delete all data? This action cannot be undone.')) {
      try {
        alert('Data reset functionality scheduled for next update.');
      } catch (err) {
        alert('Failed to reset data');
      }
    }
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      icon: UserCircle,
      color: '#2563EB',
      onPress: () => setActiveSection('profile')
    },
    {
      id: 'bill',
      title: 'Bill Settings',
      icon: FileText,
      color: '#F59E0B',
      onPress: () => navigate('/admin/settings/bill')
    },
    {
      id: 'reports',
      title: 'Analytics',
      icon: BarChart3,
      color: '#8B5CF6',
      freePremium: true,
      onPress: () => navigate('/admin')
    },
    {
      id: 'domain',
      title: 'Domain Config',
      icon: Globe,
      color: '#10B981',
      onPress: () => navigate('/admin/settings/domain')
    },
    {
      id: 'about',
      title: 'About App',
      icon: Info,
      color: '#6366F1',
      onPress: () => navigate('/admin/settings/about')
    },
    {
      id: 'backup',
      title: 'Data Management',
      icon: Download,
      color: '#0EA5E9',
      onPress: () => navigate('/admin/settings/data')
    }
  ];

  if (fetching) return <div className="spinner" style={{ marginTop: '10rem' }}></div>;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <CustomModal 
        isOpen={blocker.state === 'blocked' || showInternalBlocker}
        onClose={() => {
          if (blocker.state === 'blocked') blocker.reset();
          setShowInternalBlocker(false);
        }}
        onConfirm={() => {
          setIsDirty(false);
          if (originalData) setFormData(originalData); // Reset form to original values
          const wasInternal = showInternalBlocker;
          setShowInternalBlocker(false);
          if (blocker.state === 'blocked') blocker.proceed();
          if (wasInternal) setActiveSection('menu');
        }}
        title="Unsaved Changes"
        message="You have unsaved changes in your store profile. Are you sure you want to leave? Your changes will be lost."
        type="warning"
        confirmText="Discard & Leave"
        cancelText="Stay & Save"
        showCancel={true}
        variant="discard"
      />
      {activeSection === 'menu' ? (
        <>
          {/* Profile Card */}
          <div className="card settings-profile-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div className="profile-avatar-settings">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{user?.name}</h2>
                <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>{store?.name}</p>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem', paddingLeft: '0.25rem' }}>Master Menu</h3>

          {/* Menu Grid */}
          <div className="settings-menu-grid">
            {menuItems.map(item => (
              <div 
                key={item.id} 
                onClick={item.onPress}
                className="settings-menu-item"
              >
                <div 
                  className="settings-menu-icon-wrapper" 
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <item.icon size={28} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</span>
                {item.freePremium && (
                  <div className="premium-badge-settings">
                    <Crown size={10} /> FREE
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <button 
              onClick={() => { if(window.confirm('Logout?')) { logout(); navigate('/login'); } }}
              className="logout-btn"
            >
              <LogOut size={20} /> Logout Session
            </button>
            <button 
              onClick={handleResetData}
              className="reset-db-btn"
            >
              <DatabaseZap size={18} /> Reset Database
            </button>
          </div>
        </>
      ) : (
        /* Edit Profile Section */
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={handleBack} 
              className="btn btn-outline" 
              style={{ padding: '0.4rem', borderRadius: '50%', width: '40px', height: '40px' }}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Edit Store Profile</h1>
          </div>

          {success && (
            <div style={{ backgroundColor: '#f0fdf4', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #dcfce7' }}>
              <CheckCircle2 size={18} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="card" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <InputGroup 
                  label="Store Name" 
                  name="name" 
                  icon={Store} 
                  placeholder="Your Business Name" 
                  maxLength={50}
                  formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <InputGroup 
                    label="Phone" 
                    name="phone" 
                    icon={Phone} 
                    placeholder="10-digit number" 
                    maxLength={10}
                    formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                  />
                  <InputGroup 
                    label="Email" 
                    name="email" 
                    icon={Mail} 
                    placeholder="contact@store.com" 
                    maxLength={50}
                    formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                  />
                </div>

                <InputGroup 
                  label="Store Address" 
                  name="address" 
                  icon={MapPin} 
                  placeholder="Complete address..." 
                  isTextArea
                  maxLength={200}
                  formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                />
              </div>

              {/* Fulfillment Options */}
              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DatabaseZap size={20} color="var(--primary)" />
                  Fulfillment Options
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className={`fulfillment-toggle-card ${formData.enable_pickup ? 'active' : ''}`} onClick={() => handleToggle('enable_pickup')}>
                    <div className="fulfillment-icon">
                      <Package size={24} />
                    </div>
                    <div className="fulfillment-info">
                      <span className="fulfillment-label">Self Pickup</span>
                      <span className="fulfillment-status">{formData.enable_pickup ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="fulfillment-switch">
                      <div className={`switch-thumb ${formData.enable_pickup ? 'on' : ''}`} />
                    </div>
                  </div>

                  <div className={`fulfillment-toggle-card ${formData.enable_delivery ? 'active' : ''}`} onClick={() => handleToggle('enable_delivery')}>
                    <div className="fulfillment-icon">
                      <Truck size={24} />
                    </div>
                    <div className="fulfillment-info">
                      <span className="fulfillment-label">Home Delivery</span>
                      <span className="fulfillment-status">{formData.enable_delivery ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="fulfillment-switch">
                      <div className={`switch-thumb ${formData.enable_delivery ? 'on' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={20} color="var(--primary)" />
                  Storefront Display Settings
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className={`fulfillment-toggle-card ${formData.show_price_default ? 'active' : ''}`} onClick={() => handleToggle('show_price_default')}>
                    <div className="fulfillment-icon">
                      <Info size={24} />
                    </div>
                    <div className="fulfillment-info">
                      <span className="fulfillment-label">Show Price by Default</span>
                      <span className="fulfillment-status">{formData.show_price_default ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="fulfillment-switch">
                      <div className={`switch-thumb ${formData.show_price_default ? 'on' : ''}`} />
                    </div>
                  </div>

                  <div className={`fulfillment-toggle-card ${formData.stock_management_enabled ? 'active' : ''}`} onClick={() => handleToggle('stock_management_enabled')}>
                    <div className="fulfillment-icon">
                      <Package size={24} />
                    </div>
                    <div className="fulfillment-info">
                      <span className="fulfillment-label">Stock Management</span>
                      <span className="fulfillment-status">{formData.stock_management_enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="fulfillment-switch">
                      <div className={`switch-thumb ${formData.stock_management_enabled ? 'on' : ''}`} />
                    </div>
                  </div>
                </div>

                {formData.enable_pickup && (
                  <div className="fade-in">
                    <InputGroup 
                      label="Pickup Address" 
                      name="pickup_address" 
                      icon={MapPin} 
                      placeholder="Address where customers can collect orders..." 
                      isTextArea
                      maxLength={200}
                      formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                    />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', paddingLeft: '0.5rem' }}>
                      <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      If empty, the main store address will be used for pickup.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={handleBack} className="btn btn-outline" style={{ minWidth: '120px' }} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSettings;
