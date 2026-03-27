import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Store, User, Mail, Phone, Lock, MapPin, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import InputGroup from '../../components/InputGroup';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    store_name: '',
    admin_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '', // Added confirm password
    address: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle state
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [storeCount, setStoreCount] = useState(null);
  const [checkingStore, setCheckingStore] = useState(true);

  useEffect(() => {
    const fetchStoreCount = async () => {
      try {
        const res = await api.get('/auth/check-store-count');
        setStoreCount(res.data.count);
      } catch (err) {
        console.error('Error checking store count:', err);
      } finally {
        setCheckingStore(false);
      }
    };
    fetchStoreCount();
  }, []);

  // Handle email uniqueness check with debounce
  useEffect(() => {
    const checkEmailUnique = async () => {
      if (!formData.email || errors.email || !/\S+@\S+\.\S+/.test(formData.email)) return;
      
      try {
        const res = await api.post('/auth/check-email', { email: formData.email });
        if (res.data.exists) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.email === 'This email is already registered') {
              delete newErrors.email;
            }
            return newErrors;
          });
        }
      } catch (err) {
        console.error('Error checking emailUnique', err);
      }
    };

    const timer = setTimeout(() => {
      checkEmailUnique();
    }, 600); // 600ms debounce

    return () => clearTimeout(timer);
  }, [formData.email]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'store_name':
        if (!value.trim()) error = 'Store name is required';
        else if (value.length < 3) error = 'Store name must be at least 3 characters';
        break;
      case 'admin_name':
        if (!value.trim()) error = 'Admin name is required';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'Invalid email address';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d{10}$/.test(value.replace(/\D/g, ''))) error = 'Enter a valid 10-digit phone number';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Password must be at least 6 characters';
        break;
      case 'confirm_password':
        if (!value) error = 'Confirm password is required';
        else if (value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
      
      // If password changes, re-validate confirm_password
      if (name === 'password' && touched.confirm_password) {
        setErrors(prev => ({ ...prev, confirm_password: value === formData.confirm_password ? '' : 'Passwords do not match' }));
      }
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setLoading(true);
    const result = await register(formData);
    if (result.success) {
      navigate('/admin');
    } else {
      setServerError(result.message);
    }
    setLoading(false);
  };

  if (checkingStore) {
    return <div className="fade-in auth-container"><div className="spinner"></div></div>;
  }

  if (storeCount > 0) {
    return (
      <div className="fade-in auth-container">
        <div className="card auth-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="auth-icon-wrapper" style={{ background: '#fffbeb', color: '#d97706', marginBottom: '1.5rem' }}>
            <AlertCircle size={40} />
          </div>
          <h2 className="auth-title" style={{ color: '#92400e' }}>Registration Closed</h2>
          <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>
            A store is already registered in this system. This version of GravityPOS Cloud supports only one store per installation.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '0.75rem 2rem' }}>
            Go to Login Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in auth-container wide">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Store size={32} />
          </div>
          <h2 className="auth-title">Open Your Store</h2>
          <p className="auth-subtitle">Get started with GravityPOS Cloud today</p>
        </div>
        
        {serverError && (
          <div className="alert-wrapper alert-error">
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{serverError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid-2-col">
            <InputGroup 
              label="Store Name" 
              name="store_name" 
              icon={Store} 
              placeholder="e.g. My Cafe" 
              maxLength={30}
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
            />
            <InputGroup 
              label="Admin Name" 
              name="admin_name" 
              icon={User} 
              placeholder="Your full name" 
              maxLength={30}
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
            />
          </div>
          
          <InputGroup label="Email Address" name="email" type="email" icon={Mail} placeholder="name@example.com" formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />
          <InputGroup label="Phone Number" name="phone" icon={Phone} placeholder="10-digit mobile number" maxLength={10} formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />
          
          <div className="grid-2-col">
            <InputGroup 
              label="Password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              icon={Lock} 
              placeholder="Min. 6 chars" 
              maxLength={15} 
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur} 
              trailingIcon={showPassword ? EyeOff : Eye}
              onTrailingIconClick={() => setShowPassword(!showPassword)}
            />
            <InputGroup 
              label="Confirm" 
              name="confirm_password" 
              type={showConfirmPassword ? 'text' : 'password'} 
              icon={Lock} 
              placeholder="Match password" 
              maxLength={15} 
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur} 
              trailingIcon={showConfirmPassword ? EyeOff : Eye}
              onTrailingIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </div>
          
          <InputGroup label="Store Address (Optional)" name="address" icon={MapPin} placeholder="Physical store location" isTextArea maxLength={100} formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur} />
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Setting up your store...' : 'Create My Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already using GravityPOS? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login to Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
