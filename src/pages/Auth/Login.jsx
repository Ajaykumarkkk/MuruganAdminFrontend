import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import InputGroup from '../../components/InputGroup';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [storeCount, setStoreCount] = useState(0);

  useEffect(() => {
    const fetchStoreCount = async () => {
      try {
        const { default: api } = await import('../../services/api');
        const res = await api.get('/auth/check-store-count');
        setStoreCount(res.data.count);
      } catch (err) {
        console.error('Error checking store count:', err);
      }
    };
    fetchStoreCount();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'identifier') {
      if (!value.trim()) error = 'Email or Phone is required';
    } else if (name === 'password') {
      if (!value) error = 'Password is required';
      else if (value.length < 6) error = 'Password must be at least 6 characters';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    // Validate all
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ identifier: true, password: true });
      return;
    }

    setLoading(true);
    const result = await login(formData.identifier, formData.password);
    if (result.success) {
      navigate('/admin');
    } else {
      setServerError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="fade-in auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <LogIn size={32} />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to manage your store</p>
        </div>
        
        {successMessage && (
          <div className="alert-wrapper alert-success">
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.875rem' }}>{successMessage}</span>
          </div>
        )}
        
        {serverError && (
          <div className="alert-wrapper alert-error">
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{serverError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <InputGroup 
            label="Email or Phone" 
            name="identifier" 
            icon={User} 
            placeholder="name@example.com or 10-digit phone" 
            maxLength={50}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />
          
          <InputGroup 
            label="Password" 
            name="password" 
            type={showPassword ? 'text' : 'password'} 
            icon={Lock} 
            placeholder="••••••••" 
            maxLength={15}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
            trailingIcon={showPassword ? EyeOff : Eye}
            onTrailingIconClick={() => setShowPassword(!showPassword)}
          />
          
          <button 
            type="submit" 
            className="btn btn-primary auth-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        {storeCount === 0 && (
          <div className="auth-footer">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              New to GravityPOS? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create an Account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
