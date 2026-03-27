import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import api from '../../services/api';
import InputGroup from '../../components/InputGroup';
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import './Customers.css';

const AddCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [initialData, setInitialData] = useState(null);
  const isNavigatingAwayOnPurpose = useRef(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isEditing) {
      const fetchCustomer = async () => {
        try {
          const res = await api.get(`/customers`);
          const customer = res.data.find(c => c.id === parseInt(id));
          if (customer) {
            const data = {
              name: customer.name || '',
              phone: customer.phone || '',
              email: customer.email || '',
              address: customer.address || ''
            };
            setFormData(data);
            setInitialData(data); // Save for dirty check
          }
        } catch (err) {
          setServerError('Failed to fetch customer details');
        }
      };
      fetchCustomer();
    } else {
      setInitialData(formData);
    }
  }, [id, isEditing]);

  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isNavigatingAwayOnPurpose.current && isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      showAlert({
        title: 'Discard Changes?',
        message: 'You have unsaved changes that will be lost if you leave this page. Are you sure you want to discard them?',
        type: 'warning',
        confirmText: 'DISCARD',
        cancelText: 'KEEP EDITING',
        onConfirm: () => blocker.proceed(),
        onCancel: () => blocker.reset(),
        variant: 'discard'
      });
    }
  }, [blocker.state, showAlert, blocker.proceed, blocker.reset]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) error = 'Name is required';
      else if (value.length > 20) error = 'Maximum 20 characters allowed';
    }
    if (name === 'phone' && value && !/^[0-9]{10}$/.test(value)) error = 'Enter exact 10-digit phone number';
    if (name === 'email' && value && !/\S+@\S+\.\S+/.test(value)) error = 'Enter a valid email address';
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
    
    // Validate required fields
    const nameErr = validateField('name', formData.name);
    if (nameErr) {
      setErrors({ name: nameErr });
      setTouched({ name: true });
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/customers/${id}`, formData);
        showToast('Customer updated successfully!', 'success');
      } else {
        await api.post('/customers', formData);
        showToast('Customer created successfully!', 'success');
      }
      isNavigatingAwayOnPurpose.current = true;
      navigate('/admin/customers');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving customer';
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('exists')) {
        showToast(msg, 'error');
      } else {
        setServerError(msg);
      }
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="customer-form-header">
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-outline back-btn-cust" 
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Save customer information for orders and loyalty</p>
        </div>
      </div>

      {serverError && (
        <div style={{ backgroundColor: '#fef2f2', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <InputGroup 
            label="Full Name" 
            name="name" 
            icon={User} 
            placeholder="e.g. Ajay Kumar" 
            maxLength={20}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <InputGroup 
              label="Phone Number" 
              name="phone" 
              icon={Phone} 
              placeholder="10-digit number" 
              maxLength={10}
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
            />

            <InputGroup 
              label="Email Address" 
              name="email" 
              icon={Mail} 
              placeholder="name@example.com" 
              maxLength={50}
              formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
            />
          </div>

          <InputGroup 
            label="Address" 
            name="address" 
            icon={MapPin} 
            placeholder="Street name, City, State..." 
            isTextArea
            maxLength={150}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />

          <div className="form-actions-cust">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn btn-outline" 
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 2 }}
              disabled={loading}
            >
              <Save size={18} />
              {loading ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>

      {/* Alert is handled by AlertService via useAlert */}
    </div>
  );
};

export default AddCustomer;
