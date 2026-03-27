import React, { useState, useEffect } from 'react';
import { useNavigate, useBlocker, useParams } from 'react-router-dom';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import { useToast } from '../../context/ToastContext';
import { useAlert } from '../../context/AlertContext';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Package,
  IndianRupee,
  Clock
} from 'lucide-react';
import './Orders.css';

const Overlay = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;
  return (
    <div className="overlay-backdrop" onClick={onClose}>
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

const CartItemRow = ({ item, removeFromCart, setExactQuantity, updateItemDisplayUnit, updateItemPrice }) => {
  const { showToast } = useToast();
  const isKg = item.measure_unit?.toLowerCase() === 'kg';
  const displayUnit = item.display_unit || item.measure_unit || 'pcs';

  const getDisplayValue = (qty, unit) => {
    if (qty === null || qty === undefined || isNaN(qty)) return '';
    if (unit === 'g') return String(qty * 1000);
    return String(qty || 0);
  };

  const [inputVal, setInputVal] = useState(() => getDisplayValue(item.quantity, displayUnit));
  const [priceInputVal, setPriceInputVal] = useState(() => String(item.price || 0));

  useEffect(() => {
    const activeDisplayVal = getDisplayValue(item.quantity, displayUnit);
    if (parseFloat(inputVal) !== parseFloat(activeDisplayVal)) {
      setInputVal(activeDisplayVal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.quantity, displayUnit]);

  useEffect(() => {
    if (parseFloat(priceInputVal) !== parseFloat(item.price)) {
      setPriceInputVal(String(item.price || 0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.price]);

  const handlePriceBlur = () => {
    const parsed = parseFloat(priceInputVal);
    if (!isNaN(parsed) && parsed >= 0) {
      updateItemPrice(item.cartId, parsed);
      setPriceInputVal(String(parsed));
    } else {
      setPriceInputVal(String(item.price || 0));
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      let baseQty = parsed;
      if (displayUnit === 'g') {
        baseQty = parsed / 1000;
      }
      
      if (item.stock_management_enabled && item.stock_quantity !== null && baseQty > item.stock_quantity) {
        showToast(`Only ${item.stock_quantity} ${item.measure_unit || 'pcs'} in stock.`, 'warning');
        return;
      }
      setExactQuantity(item.cartId, baseQty);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputVal);
    if (!inputVal || isNaN(parsed) || parsed <= 0) {
      removeFromCart(item.cartId);
    } else {
      setInputVal(getDisplayValue(item.quantity, displayUnit));
    }
  };

  const handleUnitChange = (newUnit) => {
    updateItemDisplayUnit(item.cartId, newUnit);
  };

  const handleIncrement = (dir) => {
    let step = 1;
    if (displayUnit === 'g') step = 50;
    else if (displayUnit === 'kg') step = 0.5;
    
    let currentDisplayQty = parseFloat(inputVal) || 0;
    let newDisplayQty = currentDisplayQty + (dir * step);
    if (newDisplayQty <= 0) return;
    
    let newBaseQty = displayUnit === 'g' ? newDisplayQty / 1000 : newDisplayQty;
    if (item.stock_management_enabled && item.stock_quantity !== null && newBaseQty > item.stock_quantity) {
      showToast(`Only ${item.stock_quantity} ${item.measure_unit || 'pcs'} in stock.`, 'warning');
      return;
    }
    setExactQuantity(item.cartId, newBaseQty);
  };

  return (
    <div className="fade-in cart-item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{item.name}</div>
          {item.brand && (
            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800, marginTop: '0.1rem', textTransform: 'uppercase' }}>
              {item.brand}
            </div>
          )}
        </div>
        <button onClick={() => removeFromCart(item.cartId)} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cart-qty-control">
          <button onClick={() => handleIncrement(-1)} style={{ border: 'none', background: 'white', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Minus size={14} /></button>
          <input
            type="number"
            step="any"
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="qty-input"
          />
          {isKg ? (
            <CustomSelect
              value={displayUnit}
              onChange={handleUnitChange}
              options={[
                { label: 'kg', value: 'kg' },
                { label: 'g', value: 'g' }
              ]}
              variant="small"
              minWidth="60px"
            />
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginRight: '8px', marginLeft: '4px' }}>{item.measure_unit || 'pcs'}</span>
          )}
          <button onClick={() => handleIncrement(1)} style={{ border: 'none', background: 'white', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}><Plus size={14} /></button>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
          <div className="price-input-wrapper">
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>₹</span>
            <input 
              type="number"
              step="any"
              min="0"
              value={priceInputVal}
              onChange={e => setPriceInputVal(e.target.value)}
              onBlur={handlePriceBlur}
              className="price-input"
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {item.measure_unit || 'pcs'}</span>
          </div>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
    </div>
  );
};

const CreateOrder = () => {
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);

  // Navigation Guard / Blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      cart.length > 0 && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      showAlert({
        title: 'Discard Unsaved Order?',
        message: 'You have items in your cart. Leaving this page will discard your current order progress. This action cannot be undone.',
        type: 'warning',
        confirmText: 'DISCARD & LEAVE',
        cancelText: 'STAY & COMPLETE ORDER',
        onConfirm: () => blocker.proceed(),
        onCancel: () => blocker.reset(),
        variant: 'discard'
      });
    }
  }, [blocker.state, showAlert, blocker.proceed, blocker.reset]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Advanced States
  const [paymentType, setPaymentType] = useState('cash');
  const [taxType, setTaxType] = useState('percent'); // 'percent' or 'flat'
  const [taxValue, setTaxValue] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [printBill, setPrintBill] = useState(true);
  const [stockManagementEnabled, setStockManagementEnabled] = useState(true);
  const [isApproved, setIsApproved] = useState(true); // Default true for admin

  // Quick Add Customer State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [phoneError, setPhoneError] = useState(''); // Stores error message
  const [nameError, setNameError] = useState('');   // Stores error message

  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, custRes, catRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
          api.get('/products/categories')
        ]);
        
        const fetchedProducts = prodRes.data.map(p => ({
          ...p,
          price: parseFloat(p.price) || 0,
          stock_quantity: (p.stock_quantity === null || p.stock_quantity === 'null' || p.stock_quantity === undefined) ? null : (parseFloat(p.stock_quantity) || 0)
        }));
        
        // Fetch store settings for stock management toggle
        const storeRes = await api.get('/auth/store');
        if (storeRes.data) {
          setStockManagementEnabled(storeRes.data.stock_management_enabled !== false);
        }
        
        setProducts(fetchedProducts);
        setCustomers(custRes.data);
        setCategories(catRes.data);

        // If editing, fetch order details
        if (isEditing) {
          const orderRes = await api.get(`/orders/${id}`);
          const order = orderRes.data;
          
          setSelectedCustomerId(order.customer_id || '');
          setPaymentType(order.payment_type || 'cash');
          setDiscountValue(order.discount_amount || 0);
          setIsApproved(order.is_approved !== false);
          
          // Calculate tax value/type from tax_amount
          setTaxValue(order.tax_amount || 0);
          setTaxType('flat'); 

          // Map order items to cart
          const orderItems = order.items.map(item => {
            const p = fetchedProducts.find(prod => prod.id === item.product_id);
            return {
              cartId: item.id || `cart_${item.product_id}_${Math.random().toString(36).substr(2, 9)}`,
              id: item.id,
              product_id: item.product_id,
              brand: item.selected_brand,
              brand_list: p?.brand || [],
              brand_prices: p?.brand_prices || {},
              name: item.Product?.name || p?.name || 'Unknown Product',
              price: parseFloat(item.unit_price) || 0,
              quantity: parseFloat(item.quantity) || 0,
              stock_quantity: p ? ((p.stock_quantity === null || p.stock_quantity === 'null' || p.stock_quantity === undefined) ? null : (parseFloat(p.stock_quantity) + parseFloat(item.quantity))) : parseFloat(item.quantity), // Add back current item qty to stock for editing
              measure_unit: p?.measure_unit || 'pcs',
              display_unit: item.selected_unit || p?.measure_unit || 'pcs'
            };
          });
          setCart(orderItems);
        }
      } catch (err) {
        setError('Failed to load store data');
        console.error(err);
      }
      setFetching(false);
    };
    fetchData();
  }, [id, isEditing]);

  const addToCart = (product, selectedBrand = null) => {
    // Determine effective price based on brand
    let effectivePrice = parseFloat(product.price) || 0;
    if (selectedBrand && product.brand_prices && product.brand_prices[selectedBrand]) {
      effectivePrice = parseFloat(product.brand_prices[selectedBrand]);
    }

    const existing = cart.find(item => item.product_id === product.id && item.brand === selectedBrand);
    if (existing) {
      if (stockManagementEnabled && product.stock_quantity !== null && existing.quantity >= product.stock_quantity) {
        showToast('Stock limit reached for this item.', 'warning');
        return;
      }
      let increment = 1;
      if (existing.measure_unit?.toLowerCase() === 'kg') increment = 0.5;
      
      let nextQty = (parseFloat(existing.quantity) || 0) + increment;
      if (stockManagementEnabled && product.stock_quantity !== null && nextQty > product.stock_quantity) nextQty = product.stock_quantity;

      setCart(cart.map(item =>
        (item.product_id === product.id && item.brand === selectedBrand) ? { ...item, quantity: nextQty } : item
      ));
    } else {
      if (stockManagementEnabled && product.stock_quantity !== null && product.stock_quantity <= 0) {
        showToast('This item is currently out of stock.', 'error');
        return;
      }

      let initialQty = 1;
      if (product.measure_unit?.toLowerCase() === 'kg' && product.stock_quantity !== null && product.stock_quantity < 1) {
        initialQty = product.stock_quantity;
      } else if (product.measure_unit?.toLowerCase() === 'kg') {
        initialQty = 0.5; // Default for KG if > 1 or unlimited
      }

      setCart([...cart, {
        cartId: `cart_${product.id}_${Math.random().toString(36).substr(2, 9)}`,
        product_id: product.id,
        name: product.name,
        price: effectivePrice,
        quantity: initialQty,
        stock_quantity: product.stock_quantity,
        measure_unit: product.measure_unit || 'pcs',
        display_unit: product.measure_unit || 'pcs',
        brand: selectedBrand || (Array.isArray(product.brand) ? product.brand[0] : (product.brand || null)),
        brand_list: product.brand || [],
        brand_prices: product.brand_prices || {},
        stock_management_enabled: stockManagementEnabled
      }]);
    }
  };

  const setExactQuantity = (cartId, newQty) => {
    const parsedQty = parseFloat(newQty) || 0;
    if (parsedQty <= 0) return;

    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        if (stockManagementEnabled && item.stock_quantity !== null && parsedQty > item.stock_quantity) {
          showToast(`Only ${item.stock_quantity} ${item.measure_unit || 'pcs'} in stock.`, 'warning');
          return { ...item, quantity: item.stock_quantity };
        }
        return { ...item, quantity: parsedQty };
      }
      return item;
    }));
  };

  const updateItemDisplayUnit = (cartId, newUnit) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        return { ...item, display_unit: newUnit };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateItemPrice = (cartId, newPrice) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart]);

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    
    let hasError = false;
    if (!newCustomer.name.trim()) {
      setNameError('REQUIRED');
      hasError = true;
    } else if (newCustomer.name.length > 20) {
      setNameError('MAX 20 CHARACTERS');
      hasError = true;
    }
    
    if (!newCustomer.phone.trim()) {
      setPhoneError('REQUIRED');
      hasError = true;
    } else if (newCustomer.phone.length !== 10) {
      setPhoneError('INVALID');
      hasError = true;
    }
    
    if (hasError) return;
    
    setNameError('');
    setPhoneError('');
    setLoading(true);
    try {
      const res = await api.post('/customers', newCustomer);
      const added = res.data;
      setCustomers([...customers, added]);
      setSelectedCustomerId(added.id);
      setIsAddingCustomer(false);
      setNewCustomer({ name: '', phone: '' });
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already exists')) {
        setPhoneError('ALREADY EXISTS');
      } else {
        showToast(err.response?.data?.message || 'Failed to add customer', 'error');
      }
    }
    setLoading(false);
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const handleProcessOrder = async () => {
    setLoading(true);
    setError('');

    const subtotal = calculateSubtotal();
    const taxAmount = taxType === 'percent' ? (subtotal * (parseFloat(taxValue) || 0)) / 100 : (parseFloat(taxValue) || 0);
    const discountAmount = parseFloat(discountValue) || 0;
    const finalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    const orderData = {
      customer_id: selectedCustomerId || null,
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        selected_brand: item.brand,
        selected_unit: item.display_unit
      })),
      total_amount: subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      final_amount: finalAmount,
      payment_type: paymentType,
      payment_status: paymentType === 'pending' ? 'pending' : 'paid',
      is_approved: isApproved
    };

    try {
      if (isEditing) {
        await api.put(`/orders/${id}`, orderData);
        showToast('Order updated successfully', 'success');
      } else {
        await api.post('/orders', orderData);
        showToast('Order placed successfully', 'success');
      }
      setPreviewModalOpen(false);
      setCart([]); // Clear cart to bypass blocker
      setTimeout(() => navigate('/admin/orders'), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty. Add products to proceed.', 'warning');
      return;
    }
    setPreviewModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    // Use loose equality for IDs to handle potential string/int mismatches
    const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (fetching) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><div className="spinner"></div></div>;

  const subtotal = calculateSubtotal();
  const taxAmount = taxType === 'percent' ? (subtotal * (parseFloat(taxValue) || 0)) / 100 : (parseFloat(taxValue) || 0);
  const discountAmount = parseFloat(discountValue) || 0;
  const finalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
      {/* Responsive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/admin/orders')}
            className="btn btn-outline"
            style={{ padding: '0.5rem', borderRadius: '12px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              {isEditing ? `Edit Order #${id}` : 'New Sale'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Terminal #01 • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div style={{ padding: '0.4rem 0.75rem', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534' }}>SYSTEM ONLINE</span>
        </div>
      </div>

      <div className="pos-main-layout">
        {/* Left: Product Browser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          {/* Search and Category Filter triggers Modal */}
          <div className="card" style={{ padding: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Scan SKU or search items..."
                className="input-pretty"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.9rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setCategoryModalOpen(true)}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <ShoppingBag size={18} />
              {selectedCategory === 'all' ? 'All Items' : categories.find(c => String(c.id) === String(selectedCategory))?.name || 'Category'}
            </button>
          </div>

          {/* Product Grid */}
          <div className="pos-scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem', alignContent: 'start' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.flatMap(product => {
                const brands = (typeof product.brand === 'string') 
                  ? product.brand.split(',').map(b => b.trim()).filter(b => b) 
                  : (Array.isArray(product.brand) ? product.brand : []);

                // If no brands, return just one item
                if (brands.length === 0) {
                  return [{ ...product, displayBrand: null }];
                }

                // If brands exist, return one item for each brand
                return brands.map(brand => ({
                  ...product,
                  displayBrand: brand,
                  price: (product.brand_prices && product.brand_prices[brand]) ? parseFloat(product.brand_prices[brand]) : product.price
                }));
              }).map(displayItem => {
                const productQtyInCart = cart.filter(item => item.product_id === displayItem.id && item.brand === displayItem.displayBrand).reduce((sum, item) => sum + item.quantity, 0);
                const hasItemInCart = productQtyInCart > 0;
                
                // When editing, the "available" stock for a product is its current stock + what's already in the cart for this order
                const availableStock = (displayItem.stock_quantity === null || displayItem.stock_quantity === undefined) ? null : 
                  (isEditing ? (displayItem.stock_quantity + productQtyInCart) : displayItem.stock_quantity);
                
                const isUnlimited = availableStock === null;
                const isOutOfStock = !isUnlimited && availableStock <= 0;

                return (
                  <div
                    key={`${displayItem.id}-${displayItem.displayBrand || 'no-brand'}`}
                    onClick={() => {
                      if (!isOutOfStock) {
                        addToCart(displayItem, displayItem.displayBrand);
                      }
                    }}
                    className="product-card-premium"
                    style={{
                      opacity: isOutOfStock ? 0.6 : 1,
                      borderColor: hasItemInCart ? 'var(--primary)' : 'var(--border)'
                    }}
                  >
                    {hasItemInCart && <div className="qty-badge">{productQtyInCart}</div>}

                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', color: 'var(--primary)', borderRadius: '16px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                      <Package size={32} />
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }}>
                      {displayItem.name}
                      {displayItem.displayBrand && (
                        <span style={{ color: 'var(--primary)', fontSize: '0.75rem', display: 'block', marginTop: '0.1rem' }}>
                          [{displayItem.displayBrand}]
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                      ₹{parseFloat(displayItem.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    {isOutOfStock ? (
                      <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, background: '#fee2e2', padding: '0.25rem', borderRadius: '4px', textAlign: 'center' }}>OUT OF STOCK</div>
                    ) : availableStock !== null && availableStock <= (displayItem.low_stock_threshold || 5) ? (
                      <div style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 800, background: '#fef3c7', padding: '0.25rem', borderRadius: '4px', textAlign: 'center' }}>LOW STOCK: {availableStock}</div>
                    ) : (
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>
                        {availableStock === null ? 'UNLIMITED' : `STOCK: ${availableStock} ${displayItem.measure_unit || 'pcs'}`}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 0', background: '#f8fafc', borderRadius: '24px', border: '2px dashed var(--border)' }}>
                <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>No items match your criteria</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Try choosing a different category or clearing search</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Checkout Sidebar */}
        <div className="pos-sidebar">
          {/* Customer Section triggers Modal */}
          <div className="sidebar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span className="sidebar-title">CUSTOMER</span>
              <button
                onClick={() => { setCustomerModalOpen(true); setIsAddingCustomer(true); }}
                style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + QUICK ADD
              </button>
            </div>
            <button
              onClick={() => setCustomerModalOpen(true)}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} color="var(--text-muted)" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedCustomerId ? customers.find(c => String(c.id) === String(selectedCustomerId))?.name : 'Walk-in Customer'}
                </span>
              </div>
              <Plus size={16} color="var(--text-muted)" />
            </button>
          </div>

          {/* Cart Section */}
          <div className="pos-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>Cart 🛍️</h3>
              <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>{cart.length} items</span>
            </div>

            {cart.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {cart.map(item => (
                  <CartItemRow
                    key={`${item.product_id}-${item.brand}`}
                    item={item}
                    setExactQuantity={setExactQuantity}
                    updateItemDisplayUnit={updateItemDisplayUnit}
                    updateItemPrice={updateItemPrice}
                    removeFromCart={removeFromCart}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
                <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <ShoppingBag size={40} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Your cart is empty</p>
                <p style={{ fontSize: '0.8125rem' }}>Select items to start a sale</p>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setPaymentModalOpen(true)}
                style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IndianRupee size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>PAYMENT: {paymentType.toUpperCase()}</span>
                </div>
                <Plus size={14} color="var(--text-muted)" />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', borderRadius: '12px', border: '1px solid var(--border)', background: isApproved ? '#f0fdf4' : '#fffbeb', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={16} color={isApproved ? '#10b981' : '#f59e0b'} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>ORDER APPROVED</span>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={isApproved} 
                    onChange={e => setIsApproved(e.target.checked)} 
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="summary-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Discount (₹)</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  value={discountValue || ''} 
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '80px', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'right', outline: 'none', background: '#f8fafc', fontWeight: 700, color: '#ef4444' }}
                />
              </div>

              <div className="summary-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Tax</span>
                  <CustomSelect
                    value={taxType}
                    onChange={val => setTaxType(val)}
                    options={[
                      { label: '%', value: 'percent' },
                      { label: '₹', value: 'flat' }
                    ]}
                    variant="small"
                    minWidth="50px"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    value={taxValue || ''} 
                    onChange={e => setTaxValue(e.target.value)}
                    placeholder="0"
                    style={{ width: '60px', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'right', outline: 'none', background: '#f8fafc', fontWeight: 700, color: 'var(--text-main)' }}
                  />
                  {taxType === 'percent' && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>}
                </div>
              </div>

              <div className="total-order-banner">
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '0.05em' }}>TOTAL PAYABLE</span>
                <span style={{ fontWeight: 800, fontSize: '1.75rem', color: '#38bdf8' }}>₹{finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', color: 'var(--error)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || cart.length === 0}
              className="btn-confirm"
              style={{
                opacity: (loading || cart.length === 0) ? 0.6 : 1
              }}
            >
              <CheckCircle2 size={24} />
              {loading ? 'Processing...' : (isEditing ? 'Update Order' : 'Complete Payment')}
            </button>
          </div>
        </div>
      </div>

      {/* --- SELECTION OVERLAYS --- */}

      {/* Category Modal */}
      <Overlay isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Select Category">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => { setSelectedCategory('all'); setCategoryModalOpen(false); }}
            className={`modal-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setCategoryModalOpen(false); }}
              className={`modal-btn ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </Overlay>

      {/* Payment Modal */}
      <Overlay isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Payment Method">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {['cash', 'card', 'upi', 'pending'].map(type => (
            <button
              key={type}
              onClick={() => { setPaymentType(type); setPaymentModalOpen(false); }}
              className={`modal-btn ${paymentType === type ? 'active' : ''}`}
              style={{ padding: '2rem', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div style={{ width: '48px', height: '48px', background: paymentType === type ? 'white' : '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                {type === 'pending' ? <Clock size={24} /> : <IndianRupee size={24} />}
              </div>
              <span>{type.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </Overlay>

      {/* Customer Modal */}
      <Overlay isOpen={customerModalOpen} onClose={() => { setCustomerModalOpen(false); setIsAddingCustomer(false); }} title={isAddingCustomer ? "Add New Customer" : "Select Customer"}>
        {isAddingCustomer ? (
          <form onSubmit={handleQuickAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.6rem', marginLeft: '0.2rem', letterSpacing: '0.05em' }}>CUSTOMER NAME</label>
              <input
                autoFocus
                type="text"
                className="input-pretty"
                placeholder="Enter full name"
                value={newCustomer.name}
                onChange={e => {
                  if (e.target.value.length <= 20) {
                    setNewCustomer({ ...newCustomer, name: e.target.value });
                    setNameError('');
                  } else {
                    setNameError('MAX 20 CHARACTERS');
                  }
                }}
                maxLength={20}
                style={{ 
                  borderColor: nameError ? '#ef4444' : (newCustomer.name.length > 0 ? '#10b981' : '#e2e8f0'),
                  boxShadow: nameError ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none'
                }}
              />
              {nameError && (
                <div className="fade-in" style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginTop: '0.4rem', marginLeft: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={10} /> {nameError === 'REQUIRED' ? 'NAME REQUIRED' : 'MAX 20 CHARACTERS'}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.6rem', marginLeft: '0.2rem', letterSpacing: '0.05em' }}>PHONE NUMBER</label>
              <input
                type="tel"
                className="input-pretty"
                placeholder="Enter 10-digit number"
                value={newCustomer.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) {
                    setNewCustomer({ ...newCustomer, phone: val });
                    if (val.length === 10) setPhoneError('');
                  }
                }}
                maxLength={10}
                style={{ 
                  borderColor: phoneError ? '#ef4444' : (newCustomer.phone.length === 10 ? '#10b981' : '#e2e8f0'),
                  boxShadow: phoneError ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none'
                }}
              />
              {phoneError && (
                <div className="fade-in" style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, marginTop: '0.4rem', marginLeft: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={10} /> 
                  {phoneError === 'REQUIRED' ? 'PHONE REQUIRED' : 
                   phoneError === 'ALREADY EXISTS' ? 'ALREADY REGISTERED!' : 
                   'MUST BE EXACTLY 10 DIGITS'}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsAddingCustomer(false)} className="btn btn-outline" style={{ flex: 1, borderRadius: '12px', height: '52px', fontWeight: 700 }}>Back</button>
              <button type="submit" disabled={loading} className="btn" style={{ flex: 1, color: 'white', borderRadius: '12px', height: '52px', fontWeight: 800, background: 'var(--primary)' }}>{loading ? 'Adding...' : 'Add & Select'}</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => { setSelectedCustomerId(''); setCustomerModalOpen(false); }}
              className={`modal-btn ${!selectedCustomerId ? 'active' : ''}`}
            >
              Walk-in Customer
            </button>
            <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            {customers.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCustomerId(c.id); setCustomerModalOpen(false); }}
                className={`modal-btn ${String(selectedCustomerId) === String(c.id) ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{c.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</span>
                </div>
              </button>
            ))}
            <button
              onClick={() => setIsAddingCustomer(true)}
              style={{ marginTop: '1rem', padding: '1rem', border: '2px dashed var(--border)', borderRadius: '12px', background: '#f8fafc', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}
            >
              + ADD NEW CUSTOMER
            </button>
          </div>
        )}
      </Overlay>

      {/* Bill Preview Modal */}
      <Overlay isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title="Confirm Order & Pay" maxWidth="400px">
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.25rem' }}>GRAVITY POS</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Terminal #01</p>
          </div>

          <div style={{ borderBottom: '1px dashed var(--border)', marginBottom: '1rem' }} />

          <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATE:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CUSTOMER:</span>
              <span>{selectedCustomerId ? customers.find(c => String(c.id) === String(selectedCustomerId))?.name.toUpperCase() : 'WALK-IN'}</span>
            </div>
          </div>

          <div style={{ borderBottom: '1px dashed var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100px' }}>
            {cart.map(item => {
              const isGram = item.display_unit === 'g';
              const displayQty = isGram ? item.quantity * 1000 : item.quantity;
              const displayUnit = item.display_unit || item.measure_unit || 'pcs';

              return (
                <div key={item.id || item.product_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ flex: 1 }}>
                    {item.name} {item.brand && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', background: '#eff6ff', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', marginLeft: '0.5rem' }}>{item.brand}</span>} x {displayQty} {displayUnit}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div style={{ borderBottom: '1px dashed var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUBTOTAL:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                <span>DISCOUNT:</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TAX {taxType === 'percent' ? `(${parseFloat(taxValue) || 0}%)` : ''}:</span>
                <span>+ ₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ borderBottom: '1px dashed var(--border)', margin: '1rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
            <span>TOTAL:</span>
            <span>₹{finalAmount.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            PAYMENT VIA: {paymentType.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.75rem', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <input type="checkbox" checked={printBill} onChange={e => setPrintBill(e.target.checked)} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#166534' }}>Print Receipt Automatically</span>
          </div>
          <button
            onClick={handleProcessOrder}
            disabled={loading}
            className="btn-confirm"
          >
            <CheckCircle2 size={22} />
            {loading ? 'Processing...' : 'CONFIRM & PAY'}
          </button>
        </div>
      </Overlay>

      {/* Modals are handled by showAlert service for guards */}
    </div>
  );
};

export default CreateOrder;
