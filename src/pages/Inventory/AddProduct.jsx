import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import api from '../../services/api';
import InputGroup from '../../components/InputGroup';
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';
import {
  Package,
  Tag,
  IndianRupee,
  Layers,
  Barcode,
  Bookmark,
  ArrowLeft,
  Save,
  AlertCircle,
  FileText,
  Plus,
  X
} from 'lucide-react';
import './Inventory.css';

const AddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    brand: '', // In UI it will be comma-separated, in DB it's array
    category_id: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    measure_unit: 'pcs',
    sku: '',
    low_stock_threshold: '10',
    description: '',
    show_price: true,
    brand_prices: {}
  });

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [initialData, setInitialData] = useState(null);
  const isNavigatingAwayOnPurpose = useRef(false);
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [trackStock, setTrackStock] = useState(true);
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');

  // Unit Modal State
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [unitLoading, setUnitLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data.map(c => ({ label: c.name, value: c.id })));
      return res.data;
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/products/units');
      // If no units exist yet, provide defaults for the UI but don't save them to DB automatically
      const dbUnits = res.data.map(u => ({ label: u.name, value: u.name }));
      const defaultUnits = [
        { label: 'Piece (pcs)', value: 'pcs' },
        { label: 'Kilogram (kg)', value: 'kg' },
        { label: 'Gram (g)', value: 'g' },
        { label: 'Litre (l)', value: 'l' },
        { label: 'Packet (pkt)', value: 'pkt' }
      ];

      // Combine but prioritize DB units
      const combined = [...dbUnits];
      defaultUnits.forEach(def => {
        if (!combined.find(c => c.value === def.value)) {
          combined.push(def);
        }
      });

      setUnits(combined);
      return res.data;
    } catch (err) {
      console.error('Error fetching units', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [cats, uns] = await Promise.all([fetchCategories(), fetchUnits()]);

      if (isEditing) {
        try {
          const res = await api.get(`/products/${id}`);
          const data = {
            name: res.data.name || '',
            brand: Array.isArray(res.data.brand) ? res.data.brand.join(', ') : (res.data.brand || ''),
            category_id: res.data.category_id || '',
            price: res.data.price || '',
            cost_price: res.data.cost_price || '',
            stock_quantity: res.data.stock_quantity || '',
            measure_unit: res.data.measure_unit || 'pcs',
            sku: res.data.sku || '',
            low_stock_threshold: res.data.low_stock_threshold || '10',
            description: res.data.description || '',
            show_price: res.data.show_price !== false,
            brand_prices: res.data.brand_prices || {}
          };
          // Also fetch store settings for management enabled toggle even when editing
          const storeRes = await api.get('/auth/store');
          if (storeRes.data) {
            setStockManagementEnabled(storeRes.data.stock_management_enabled !== false);
          }

          setFormData(data);
          setInitialData(data);
          setTrackStock(res.data.stock_quantity !== null);
          if (res.data.image_url) {
            setImagePreview(res.data.image_url);
          }
        } catch (err) {
          setServerError('Failed to fetch product details');
        }
      } else {
        // Fetch store settings for default display and stock management toggle
        try {
          const res = await api.get('/auth/store');
          if (res.data) {
            setStockManagementEnabled(res.data.stock_management_enabled !== false);
            const initialForm = {
              ...formData,
              show_price: res.data.show_price_default !== false
            };
            setFormData(initialForm);
            setInitialData(initialForm);
          }
        } catch (err) {
          console.error('Error fetching store settings', err);
          setInitialData(formData);
        }
      }
    };

    fetchData();
  }, [id, isEditing]);

  const isDirty = initialData ? JSON.stringify(formData) !== JSON.stringify(initialData) : false;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isNavigatingAwayOnPurpose.current && isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      showAlert({
        title: 'Discard Product Changes?',
        message: 'You have unsaved changes in this product. Are you sure you want to leave without saving?',
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
    if (name === 'name' && !value.trim()) error = 'Product name is required';
    if (name === 'price') {
      const hasBrandPrices = Object.values(formData.brand_prices).some(p => p !== '' && p > 0);
      if (!hasBrandPrices && (!value || parseFloat(value) <= 0)) {
        error = 'Enter a valid price';
      }
    }
    if (name === 'stock_quantity' && trackStock && (value === '' || value < 0)) error = 'Stock cannot be negative';
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If brand list changes, update brand_prices keys
      if (name === 'brand') {
        const brands = value.split(',').map(b => b.trim()).filter(b => b !== '');
        const newBrandPrices = { ...prev.brand_prices };
        
        // Remove prices for brands that are no longer present
        Object.keys(newBrandPrices).forEach(b => {
          if (!brands.includes(b)) delete newBrandPrices[b];
        });
        
        // Add keys for new brands
        brands.forEach(b => {
          if (!newBrandPrices[b]) newBrandPrices[b] = prev.price || 0;
        });
        
        newData.brand_prices = newBrandPrices;
      }
      
      return newData;
    });
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert({
          title: 'File Too Large',
          message: 'Product image size should be less than 5MB for optimal performance.',
          type: 'error',
          confirmText: 'Got it'
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setCatLoading(true);
    setCatError('');
    try {
      // Check if exists first
      const check = await api.get(`/products/categories/exists?name=${encodeURIComponent(catName)}`);
      if (check.data.exists) {
        setCatError('Category name already exists');
        setCatLoading(false);
        return;
      }

      await api.post('/products/categories', {
        name: catName,
        description: catDescription
      });

      const updatedCats = await fetchCategories();
      const newCat = updatedCats.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (newCat) {
        setFormData(prev => ({ ...prev, category_id: newCat.id }));
      }

      setCatName('');
      setCatDescription('');
      setShowCatModal(false);
    } catch (error) {
      setCatError('Error creating category');
    }
    setCatLoading(false);
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    setUnitLoading(true);
    try {
      await api.post('/products/units', { name: unitName });

      await fetchUnits();
      setFormData(prev => ({ ...prev, measure_unit: unitName }));

      setUnitName('');
      setShowUnitModal(false);
    } catch (error) {
      showAlert({
        title: 'Save Failed',
        message: 'There was an error creating the unit. Please try again.',
        type: 'error'
      });
    }
    setUnitLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Validate all required fields
    const required = ['name', 'price', ...(trackStock && stockManagementEnabled ? ['stock_quantity'] : [])];
    const newErrors = {};
    required.forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(required.reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'brand') {
          // Convert comma-separated string back to array
          const brandArray = formData[key]
            ? formData[key].split(',').map(b => b.trim()).filter(b => b !== '')
            : [];

          // Sequelize expects array for column type ARRAY. 
          // But FormData appends strings. For JSON field or ARRAY, we might need a different approach.
          // However, with multer and express.json, we can send it as parts.
          // Better: just join it back or stringify it if the backend handles it.
          // In Sequelize, ARRAY requires actual JS array.
          // For multipart/form-data, we append each element or the whole thing.
          brandArray.forEach(b => data.append('brand[]', b));
        } else if (key === 'brand_prices') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (isEditing) {
        await api.put(`/products/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Product updated successfully', 'success');
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Product added successfully', 'success');
      }
      isNavigatingAwayOnPurpose.current = true;
      navigate('/admin/inventory');
    } catch (err) {
      console.error('Save Product Error:', err);
      setServerError(err.response?.data?.message || 'Error saving product. Please check all fields.');
      showToast(err.response?.data?.message || 'Error saving product', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fade-in form-container-md">
      <div className="form-header">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline back-btn-circle"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            List your items professionally in the inventory
          </p>
        </div>
      </div>

      {serverError && (
        <div style={{ backgroundColor: '#fef2f2', color: 'var(--error)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
          <AlertCircle size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{serverError}</span>
        </div>
      )}

      <div className="card" style={{ padding: '2rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit}>
          {/* Section 1: General Info */}
          <div className="form-section">
            <div className="form-section-title">
              <Package size={18} /> General Information
            </div>
            <div className="form-grid form-grid-2">
              <InputGroup
                label="Product Name"
                name="name"
                icon={Package}
                placeholder="e.g. Arabica Coffee Beans"
                maxLength={50}
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />

              <InputGroup
                label="Brands (Comma separated)"
                name="brand"
                icon={Bookmark}
                placeholder="e.g. Starbucks, Nestle"
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                helperText="Use commas to add multiple brands"
              />

              <InputGroup
                label="Category"
                name="category_id"
                type="select"
                icon={Tag}
                placeholder="Select Category"
                options={categories}
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                labelAction={(
                  <button
                    type="button"
                    onClick={() => setShowCatModal(true)}
                    style={{
                      border: 'none', background: 'none', color: 'var(--primary)',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem'
                    }}
                  >
                    <Plus size={14} /> New
                  </button>
                )}
              />
            </div>

            {/* Brand Prices List */}
            {formData.brand && formData.brand.split(',').map(b => b.trim()).filter(b => b !== '').length > 0 && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IndianRupee size={16} /> Brand-Specific Pricing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {formData.brand.split(',').map(b => b.trim()).filter(b => b !== '').map((b, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{b} Price (₹)</label>
                      <input 
                        type="number" 
                        value={formData.brand_prices[b] || ''} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const newBrandPrices = {
                            ...formData.brand_prices,
                            [b]: val
                          };
                          setFormData(prev => ({
                            ...prev,
                            brand_prices: newBrandPrices
                          }));

                          // If price was erroring out, re-validate it now that brand_prices changed
                          if (errors.price) {
                            const hasAnyBrandPrice = Object.values(newBrandPrices).some(p => p !== '' && parseFloat(p) > 0);
                            if (hasAnyBrandPrice) {
                              setErrors(prev => {
                                const newErrs = { ...prev };
                                delete newErrs.price;
                                return newErrs;
                              });
                            }
                          }
                        }}
                        className="input-pretty"
                        placeholder="0.00"
                        style={{ width: '100%', borderRadius: '8px', fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="form-section">
            <div className="form-section-title">
              <IndianRupee size={18} /> Pricing & Stock
            </div>
            <div className="form-grid form-grid-3">
              <InputGroup
                label="Price (₹)"
                name="price"
                type="number"
                icon={IndianRupee}
                placeholder="0.00"
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />

              <InputGroup
                label="Cost (₹)"
                name="cost_price"
                type="number"
                icon={IndianRupee}
                placeholder="0.00"
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />

              {stockManagementEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Current Stock</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: trackStock ? 'var(--text-muted)' : 'var(--primary)', fontWeight: 600 }}>Unlimited</span>
                      <input
                        type="checkbox"
                        checked={!trackStock}
                        onChange={(e) => {
                          setTrackStock(!e.target.checked);
                          if (e.target.checked) setFormData({ ...formData, stock_quantity: '' });
                        }}
                      />
                    </div>
                  </div>
                  {trackStock && (
                    <InputGroup
                      label=""
                      name="stock_quantity"
                      type="number"
                      icon={Layers}
                      placeholder="0"
                      formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                    />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: formData.show_price ? 'var(--primary)' : 'var(--text-muted)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <IndianRupee size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Show Price</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visible in Storefront</div>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.show_price}
                      onChange={() => setFormData(prev => ({ ...prev, show_price: !prev.show_price }))}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Inventory Details */}
          <div className="form-section">
            <div className="form-section-title">
              <Barcode size={18} /> Inventory Details
            </div>
            <div className="form-grid form-grid-3">
              <InputGroup
                label="SKU / Barcode"
                name="sku"
                icon={Barcode}
                placeholder="e.g. COF-001"
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />

              <InputGroup
                label="Unit"
                name="measure_unit"
                type="select"
                icon={Bookmark}
                placeholder="Select Unit"
                options={units}
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                labelAction={(
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(true)}
                    style={{
                      border: 'none', background: 'none', color: 'var(--primary)',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem'
                    }}
                  >
                    <Plus size={14} /> New
                  </button>
                )}
              />

              {stockManagementEnabled && (
                <InputGroup
                  label="Low Stock Alert"
                  name="low_stock_threshold"
                  type="number"
                  icon={AlertCircle}
                  placeholder="10"
                  formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
                />
              )}
            </div>
          </div>

          <InputGroup
            label="Product Description"
            name="description"
            icon={FileText}
            placeholder="Additional details about the product..."
            isTextArea
            maxLength={250}
            formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
          />

          {/* Image Upload Section */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Product Media</label>
            <div className="image-upload-container">
              <div className="image-preview-box">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={48} color="#cbd5e1" strokeWidth={1} />
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>No Image Attached</span>
                  </div>
                )}
              </div>
              <div style={{ flexGrow: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="product-image"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="product-image"
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700 }}
                >
                  <Plus size={18} />
                  {imagePreview ? 'Change Media' : 'Add Media'}
                </label>
                <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Square images (min 500x500px) look best. <br />Max file size: 5MB.
                </p>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    style={{ border: 'none', background: 'none', color: 'var(--error)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', marginTop: '0.5rem', padding: 0 }}
                  >
                    Remove Current Image
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-actions-footer">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              style={{ flex: 1, borderRadius: '14px', height: '48px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, borderRadius: '14px', height: '48px', fontWeight: 800 }}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderColor: 'white', borderTopColor: 'transparent' }}></div>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Update Product Details' : 'Save & List Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Category Modal */}
      {showCatModal && (
        <div className="modal-backdrop-blur">
          <div className="card fade-in modal-content-card" style={{ borderRadius: '24px', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Quick Category</h3>
              <button onClick={() => setShowCatModal(false)} style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategory}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Category Name</label>
                <input
                  autoFocus
                  className="input-pretty"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Beverages"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    borderColor: catError ? 'var(--error)' : 'var(--border)'
                  }}
                />
                {catError && <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 600 }}>{catError}</div>}
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  className="input-pretty"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="What is this category for?"
                  rows="3"
                  style={{ width: '100%', resize: 'none', borderRadius: '12px' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn btn-outline" style={{ flex: 1, borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '12px', fontWeight: 700 }} disabled={catLoading || !catName.trim()}>
                  {catLoading ? 'Creating...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Unit Modal */}
      {showUnitModal && (
        <div className="modal-backdrop-blur">
          <div className="card fade-in modal-content-card" style={{ borderRadius: '24px', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Quick Unit</h3>
              <button onClick={() => setShowUnitModal(false)} style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUnit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>Unit Name</label>
                <input
                  autoFocus
                  className="input-pretty"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Box, Bundle, Dozen"
                  style={{ width: '100%', borderRadius: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowUnitModal(false)} className="btn btn-outline" style={{ flex: 1, borderRadius: '12px' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '12px', fontWeight: 700 }} disabled={unitLoading || !unitName.trim()}>
                  {unitLoading ? 'Creating...' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProduct;
