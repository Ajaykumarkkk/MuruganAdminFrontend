import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import api from '../../services/api';
import InputGroup from '../../components/InputGroup';
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';
import { Tag, AlignLeft, Save, ArrowLeft, AlertCircle } from 'lucide-react';
import './Inventory.css';

const AddCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [initialData, setInitialData] = useState(null);
  const isNavigatingAwayOnPurpose = useRef(false);
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  useEffect(() => {
    if (isEditing) {
      const fetchCategory = async () => {
        try {
          const res = await api.get(`/products/categories/${id}`);
          const data = {
            name: res.data.name || '',
            description: res.data.description || ''
          };
          setFormData(data);
          setInitialData(data);
        } catch (err) {
          setServerError('Failed to fetch category details');
        }
      };
      fetchCategory();
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
        title: 'Discard Category Changes?',
        message: 'You have unsaved changes in this category. Are you sure you want to leave without saving?',
        type: 'warning',
        confirmText: 'DISCARD & LEAVE',
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
      if (!value.trim()) error = 'Category name is required';
      else if (value.length < 2) error = 'Name is too short';
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
    
    const nameError = validateField('name', formData.name);
    if (nameError) {
      setErrors({ name: nameError });
      setTouched({ name: true });
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/products/categories/${id}`, formData);
      } else {
        await api.post('/products/categories', formData);
      }
      isNavigatingAwayOnPurpose.current = true;
      navigate('/admin/inventory?tab=categories');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error saving category');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="form-header">
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-outline back-btn-circle" 
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{isEditing ? 'Edit Category' : 'Add New Category'}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Organize your products for better management</p>
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
            label="Category Name" 
            name="name" 
            icon={Tag} 
            placeholder="e.g. Beverages, Bakery" 
            maxLength={30}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />

          <InputGroup 
            label="Description (Optional)" 
            name="description" 
            icon={AlignLeft} 
            placeholder="Briefly describe this category..." 
            isTextArea
            maxLength={100}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />

          <div className="form-actions-footer">
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
              {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;
