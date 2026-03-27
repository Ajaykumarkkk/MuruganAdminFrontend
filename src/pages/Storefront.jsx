import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useBlocker } from 'react-router-dom';
import { 
  ShoppingCart, ShoppingBag, Package, Plus, Minus, Trash2, Search, ArrowRight, X, 
  Phone, MapPin, Mail, Clock, ShieldCheck, Truck, RotateCcw, User, LogOut, CheckCircle2 
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CustomModal from '../components/CustomModal';
import './Storefront.css';

const Storefront = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      cart.length > 0 && !orderComplete && currentLocation.pathname !== nextLocation.pathname
  );
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartShake, setCartShake] = useState(false);
  
  // Filters
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Customer Auth State
  const [customerInfo, setCustomerInfo] = useState(() => {
    const saved = localStorage.getItem('customer_session');
    return saved ? JSON.parse(saved) : { name: '', phone: '', email: '' };
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState('phone'); 
  const [tempPhone, setTempPhone] = useState('');
  const [tempName, setTempName] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Global Modal State
  const [alertModal, setAlertModal] = useState({ 
    isOpen: false, title: '', message: '', type: 'info', onConfirm: null 
  });

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertModal({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    fetchStoreData();
  }, [user, slug]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (cart.length > 0 && !orderComplete) {
        e.preventDefault();
        e.returnValue = 'You have items in your box! Refreshing will discard your selection. Are you sure?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart, orderComplete]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      let identifier = slug;
      const hostname = window.location.hostname;
      if (!identifier && hostname !== 'localhost' && hostname !== '127.0.0.1') {
          identifier = hostname;
      }
      if (!identifier && user) identifier = user.store_id;
      if (!identifier) identifier = 1;

      const infoRes = await api.get(`/public/store/${identifier}`);
      const storeData = infoRes.data;
      setStoreInfo(storeData);
      
      const realStoreId = storeData.id;
      const isOwner = user && user.store_id === realStoreId;
      
      const baseUrl = isOwner ? '/products' : `/public/products/${realStoreId}`;
      const catUrl = isOwner ? '/products/categories' : `/public/categories/${realStoreId}`;

      const [prodRes, catRes] = await Promise.all([
        api.get(baseUrl),
        api.get(catUrl)
      ]);

      setProducts(isOwner ? prodRes.data.filter(p => p.is_active) : prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load store catalog', err);
    }
    setLoading(false);
  };

  const handleCheckPhone = async (e) => {
    e.preventDefault();
    if (!tempPhone || tempPhone.length < 10) return;
    
    setIsAuthLoading(true);
    try {
      const res = await api.get(`/public/customer/check/${tempPhone}?store_id=${storeInfo.id}`);
      if (res.data.exists) {
        setFoundCustomer(res.data.customer);
        setAuthStep('welcome');
      } else {
        setAuthStep('register');
      }
    } catch (err) {
      console.error('Auth error', err);
      showToast('Account check failed. Try again.', 'error');
    }
    setIsAuthLoading(false);
  };

  const handleAuthComplete = (customer) => {
    const sessionData = { 
      id: customer.id, 
      name: customer.name, 
      phone: customer.phone, 
      email: customer.email || '' 
    };
    setCustomerInfo(sessionData);
    localStorage.setItem('customer_session', JSON.stringify(sessionData));
    setIsAuthModalOpen(false);
    setAuthStep('phone');
    setTempPhone('');
    setTempName('');
    setIsCartOpen(true);
  };

  const logoutCustomer = () => {
    if (cart.length > 0) {
      showAlert(
        'Discard Unsaved Order?', 
        'You have items in your cart. Leaving or logging out will discard your current order progress. This action cannot be undone.', 
        'warning', 
        () => {
          localStorage.removeItem('customer_session');
          setCustomerInfo({ name: '', phone: '', email: '' });
          setCart([]);
        }
      );
    } else {
      localStorage.removeItem('customer_session');
      setCustomerInfo({ name: '', phone: '', email: '' });
    }
  };

  const clearCart = () => {
    showAlert(
      'Discard Unsaved Order?', 
      'Are you sure you want to leave? This will discard your current order progress.', 
      'warning', 
      () => setCart([]),
      'Discard' 
    );
  };

  const addToCart = (product, initialUnit = null) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        // If it exists, just increase by the appropriate step
        const step = existing.selectedUnit === 'gm' ? 100 : 1;
        const newQ = existing.quantity + step;
        const maxAvailable = existing.selectedUnit === 'gm' ? existing.stock_quantity * 1000 : existing.stock_quantity;
        
        if (newQ > maxAvailable) {
          showToast(`Maximum stock reached`, 'info');
          return prev;
        }
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: newQ } : item);
      }
      
      const unit = initialUnit || product.measure_unit || 'pcs';
      let qty = 1;
      if (product.measure_unit === 'kg' && unit === 'gm') qty = 1000;
      
      // Stock safety check
      if (qty > product.stock_quantity) {
        qty = product.stock_quantity;
        showToast(`Added maximum available stock`, 'info');
      }

      if (qty <= 0) {
        showToast('Item out of stock', 'info');
        return prev;
      }

      return [...prev, { 
        product_id: product.id, 
        name: product.name, 
        price: parseFloat(product.price), 
        baseUnit: product.measure_unit || 'pcs',
        selectedUnit: unit,
        quantity: qty,
        stock_quantity: product.stock_quantity,
        tax_rate: parseFloat(product.tax_rate) || 0,
        image_url: product.image_url
      }];
    });
    showToast(`${product.name} added to box!`, 'success', 2000);
    setCartShake(true);
    setTimeout(() => setCartShake(false), 500);
  };

  const updateCartItemUnit = (id, unit) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        if (item.selectedUnit === unit) return item;
        
        // Quantity Scaling: 1kg <-> 1000g
        let newQty = item.quantity;
        if (item.selectedUnit === 'kg' && unit === 'gm') {
          newQty = item.quantity * 1000;
        } else if (item.selectedUnit === 'gm' && unit === 'kg') {
          newQty = item.quantity / 1000;
        }
        
        return { ...item, selectedUnit: unit, quantity: newQty };
      }
      return item;
    }));
  };

  const handleQtyChange = (id, val) => {
    const num = parseFloat(val);
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        let newQty = isNaN(num) || num <= 0 ? 0 : num;
        const maxAvailable = item.selectedUnit === 'gm' ? item.stock_quantity * 1000 : item.stock_quantity;
        if (newQty > maxAvailable) {
          newQty = maxAvailable;
          showToast(`Maximum available selected`, 'info');
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateCartQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        const step = item.selectedUnit === 'gm' ? 100 : 1;
        let newQ = item.quantity + (delta * step);
        const maxAvailable = item.selectedUnit === 'gm' ? item.stock_quantity * 1000 : item.stock_quantity;
        if (newQ > maxAvailable) {
          newQ = maxAvailable;
          showToast(`Maximum stock reached`, 'info');
        }
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.product_id !== id));
  };

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    cart.forEach(item => {
      let itemPrice = item.price;
      if (item.baseUnit === 'kg' && item.selectedUnit === 'gm') {
        itemPrice = item.price / 1000;
      }
      const lineTotal = itemPrice * item.quantity;
      subtotal += lineTotal;
      taxAmount += lineTotal * (item.tax_rate / 100);
    });
    const finalAmount = subtotal + taxAmount;
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      finalAmount: finalAmount.toFixed(2),
      itemCount: cart.length // Distinct items count for badge
    };
  }, [cart]);

  const placeOrder = async () => {
    if (cart.length === 0) return showToast('Your box is empty!', 'info');
    if (!customerInfo.name || !customerInfo.phone) {
        setIsAuthModalOpen(true);
        setIsCartOpen(false);
        return;
    }
    
    setIsCheckingOut(true);
    try {
      const payload = {
        store_id: storeInfo.id,
        customer: customerInfo,
        items: cart.map(i => {
          let unitPrice = i.price;
          if (i.baseUnit === 'kg' && i.selectedUnit === 'gm') {
            unitPrice = i.price / 1000;
          }
          return {
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: unitPrice,
            unit: i.selectedUnit
          };
        }),
        tax_amount: parseFloat(cartTotals.taxAmount),
        final_amount: parseFloat(cartTotals.finalAmount),
        payment_type: 'cash'
      };

      await api.post('/public/orders', payload);
      setOrderComplete(true);
      setCart([]);
      showAlert(
        'Success!', 
        'Your order has been placed successfully. We will contact you soon!', 
        'success',
        () => {
          setIsCartOpen(false);
          setOrderComplete(false);
        }
      );
    } catch (error) {
      console.error('Checkout error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to place order. Please try again.';
      
      // Auto-correct cart if stock error
      if (msg.includes('Insufficient stock')) {
        const match = msg.match(/Available: ([\d.]+)(\w+)/);
        if (match) {
          const availableVal = parseFloat(match[1]);
          const availableUnit = match[2];
          const productName = msg.split('Insufficient stock for ')[1]?.split('.')[0];
          if (productName) {
            setCart(prev => prev.map(item => {
              if (item.name === productName) {
                const stockInKg = availableUnit === 'gm' ? availableVal / 1000 : availableVal;
                const maxInCurrentUnit = item.selectedUnit === 'gm' ? stockInKg * 1000 : stockInKg;
                return { ...item, stock_quantity: stockInKg, quantity: Math.min(item.quantity, maxInCurrentUnit) };
              }
              return item;
            }));
            showToast(`Adjusted ${productName} to available stock`, 'info');
          }
        }
      }
      
      showAlert('Order Error', msg, 'error');
    }
    setIsCheckingOut(false);
  };

  const handleNotifyMe = async (productId) => {
    if (!customerInfo.name || !customerInfo.phone) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const payload = {
        store_id: storeInfo.id,
        product_id: productId,
        customer_id: customerInfo.id
      };
      const response = await api.post('/public/inventory/notify-me', payload);
      showAlert('Success!', response.data.message, 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error creating notification request';
      showAlert('Notify Me', msg, 'info');
    }
  };

  const isProductInCart = (id) => {
    return cart.find(item => item.product_id === id);
  };

  const displayedProducts = useMemo(() => {
    let filtered = [...products];
    if (activeCategory !== 'all') filtered = filtered.filter(p => String(p.category_id) === String(activeCategory));
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return filtered;
  }, [products, activeCategory, searchTerm]);

  return (
    <div className="fade-in storefront-wrapper">
      
      <nav className="storefront-nav">
        <div className="nav-container">
          <div className="nav-logo-wrapper">
            <div className="nav-logo-icon">G</div>
            <span className="nav-logo-text">{storeInfo?.name || "GravityPOS"}</span>
          </div>

          <div className="nav-actions">
            {customerInfo.name ? (
              <div className="nav-user-info">
                <span className="nav-username">Hi, {customerInfo.name.split(' ')[0]}</span>
                <button onClick={logoutCustomer} className="logout-icon-btn" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="nav-merchant-link" 
                onClick={() => setIsAuthModalOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Customer Login
              </button>
            )}

            {user ? (
               <Link to="/admin" className="btn btn-outline nav-admin-link">Admin Dashboard</Link>
            ) : (
               <Link to="/login" className="nav-merchant-link">Merchant Login</Link>
            )}
            
            <button onClick={() => setIsCartOpen(true)} className={`nav-cart-btn ${cartShake ? 'cart-shake' : ''}`}>
              <ShoppingCart size={24} />
              {cartTotals.itemCount > 0 && <span className="cart-badge">{cartTotals.itemCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">Welcome to Our Official Store</div>
          <h1 className="hero-title">Elevate Your <span className="hero-title-gradient">Daily Experience</span></h1>
          <p className="hero-description">Browse our curated collection of premium products at {storeInfo?.name || "GravityPOS"}.</p>
          <div className="hero-btns">
             <button onClick={() => {document.getElementById('catalog').scrollIntoView({behavior: 'smooth'})}} className="btn btn-primary hero-btn-primary">Shop Catalog</button>
             <button onClick={() => {document.getElementById('footer').scrollIntoView({behavior: 'smooth'})}} className="btn btn-outline hero-btn-outline">Learn More</button>
          </div>
        </div>
      </div>

      <div id="catalog" className="catalog-container">
        <div style={{ marginBottom: '3rem' }}>
          <div className="catalog-header">
            <div>
              <h2 className="catalog-title">Explore Catalog</h2>
              <p className="catalog-subtitle">Find exactly what you're looking for</p>
            </div>
            <div className="catalog-search-wrapper">
              <Search size={20} className="catalog-search-icon" />
              <input 
                type="text" placeholder="Search products..." className="catalog-search-input"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="category-tabs">
            <button onClick={() => setActiveCategory('all')} className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}>All Items</button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`category-btn ${String(activeCategory) === String(cat.id) ? 'active' : ''}`}>{cat.name}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}><div className="spinner"></div></div>
        ) : (
          <div className="product-grid">
            {displayedProducts.length > 0 ? displayedProducts.map(product => {
              const cartItem = isProductInCart(product.id);
              const inCart = !!cartItem;
              
              return (
                <div key={product.id} className={`card storefront-product-card ${inCart ? 'in-cart' : ''}`}>
                  <div 
                    className="product-image-wrapper" 
                    onClick={() => product.stock_quantity > 0 && addToCart(product)}
                    style={{ cursor: product.stock_quantity > 0 ? 'pointer' : 'default' }}
                  >
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="product-image" /> : <Package size={80} strokeWidth={1} />}
                    {product.stock_quantity <= 0 && <div className="out-of-stock-overlay"><span className="out-of-stock-badge">Out of Stock</span></div>}
                    {inCart && (
                      <div className="in-cart-badge">
                        <CheckCircle2 size={14} /> {cartItem.quantity} In Box
                      </div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-category">{product.category_name}</div>
                    <h3 
                      className="product-card-name" 
                      onClick={() => product.stock_quantity > 0 && addToCart(product)}
                      style={{ cursor: product.stock_quantity > 0 ? 'pointer' : 'default' }}
                    >
                      {product.name}
                    </h3>
                    <p className="product-card-description">{product.description || 'Premium store catalog listing.'}</p>
                    <div className="product-card-footer">
                      <div className="product-card-price">
                        ₹{parseFloat(product.price).toFixed(2)}
                        {product.measure_unit && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}> / {product.measure_unit}</span>}
                      </div>

                      {product.measure_unit === 'kg' && (
                        <div className="unit-selector-pills catalog-unit-pills">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCart) updateCartItemUnit(product.id, 'kg');
                              else addToCart(product, 'kg');
                            }} 
                            className={`unit-pill ${(!inCart || cartItem.selectedUnit === 'kg') ? 'active' : ''}`}
                          >kg</button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCart) updateCartItemUnit(product.id, 'gm');
                              else addToCart(product, 'gm');
                            }} 
                            className={`unit-pill ${(inCart && cartItem.selectedUnit === 'gm') ? 'active' : ''}`}
                          >gm</button>
                        </div>
                      )}

                      {product.stock_quantity <= 0 ? (
                        <button 
                          onClick={() => handleNotifyMe(product.id)} 
                          className="btn btn-outline notify-btn"
                        >
                          Notify Me
                        </button>
                      ) : (
                        <button 
                          onClick={() => inCart ? setIsCartOpen(true) : addToCart(product)} 
                          disabled={product.stock_quantity <= 0} 
                          className={`btn ${inCart ? 'btn-primary' : 'btn-outline'} add-to-cart-btn`}
                          style={{ opacity: product.stock_quantity <= 0 ? 0.3 : 1 }}
                        >
                          {inCart ? <ShoppingCart size={22} /> : <Plus size={24} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : <div className="empty-catalog"><h3>No Products Found</h3></div>}
          </div>
        )}
      </div>

      <footer id="footer" className="storefront-footer">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <div className="footer-logo-section"><div className="footer-logo-icon">G</div><span className="footer-logo-text">{storeInfo?.name || "GravityPOS"}</span></div>
              <p>Elite Cloud-based Point of Sale and inventory solutions.</p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '1.5rem' }}>Store Contact</h4>
              <ul className="footer-contact-list">
                <li className="footer-contact-item"><MapPin size={18} color="var(--primary)" /> {storeInfo?.address}</li>
                <li className="footer-contact-item"><Phone size={18} color="var(--primary)" /> {storeInfo?.phone}</li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">&copy; 2026 {storeInfo?.name} Cloud. All Rights Reserved.</div>
        </div>
      </footer>

      {isCartOpen && (
        <div className="cart-overlay">
          <div onClick={() => setIsCartOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <div className="cart-sidebar fade-in">
            <div className="cart-header">
              <h2 className="cart-title">Shopping Box</h2>
              <div className="cart-header-actions">
                {cart.length > 0 && !orderComplete && (
                  <button onClick={clearCart} className="btn-clear-cart">CLEAR BOX</button>
                )}
                <button onClick={() => setIsCartOpen(false)} className="cart-close-btn"><X size={20} /></button>
              </div>
            </div>
            <div className="cart-body">
              {cart.length === 0 ? (
                <div className="cart-empty"><p>Your box is empty.</p></div>
              ) : orderComplete ? (
                <div className="cart-order-complete">
                  <div className="cart-success-icon"><ShieldCheck size={40} /></div>
                  <h3>Order Placed!</h3>
                  <button onClick={() => {setOrderComplete(false); setIsCartOpen(false)}} className="btn btn-primary" style={{ width: '100%', borderRadius: '12px' }}>Close</button>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.product_id} className="cart-item">
                      <div className="cart-item-image-wrapper">
                         {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={24} />}
                      </div>
                      <div className="cart-item-info">
                        <div className="cart-item-header">
                          <h4 className="cart-item-name">{item.name}</h4>
                          <button onClick={() => removeFromCart(item.product_id)} style={{ color: '#ef4444', background: 'none' }}><Trash2 size={16} /></button>
                        </div>
                        <div className="cart-item-actions">
                          <div className="qty-selector">
                             <button onClick={() => updateCartQty(item.product_id, -1)} className="qty-btn"><Minus size={14} /></button>
                             <input 
                                type="number" 
                                className="qty-input" 
                                value={item.quantity} 
                                onChange={(e) => handleQtyChange(item.product_id, e.target.value)}
                                min="0"
                             />
                             <button 
                                onClick={() => updateCartQty(item.product_id, 1)} 
                                className="qty-btn"
                                disabled={item.quantity >= (item.selectedUnit === 'gm' ? item.stock_quantity * 1000 : item.stock_quantity)}
                                style={{ opacity: item.quantity >= (item.selectedUnit === 'gm' ? item.stock_quantity * 1000 : item.stock_quantity) ? 0.5 : 1 }}
                             >
                                <Plus size={14} />
                             </button>
                          </div>
                          
                          {item.baseUnit === 'kg' && (
                            <div className="unit-selector-pills">
                              <button 
                                onClick={() => updateCartItemUnit(item.product_id, 'kg')} 
                                className={`unit-pill ${item.selectedUnit === 'kg' ? 'active' : ''}`}
                              >kg</button>
                              <button 
                                onClick={() => updateCartItemUnit(item.product_id, 'gm')} 
                                className={`unit-pill ${item.selectedUnit === 'gm' ? 'active' : ''}`}
                              >gm</button>
                            </div>
                          )}

                          <div className="cart-item-price-total" style={{ fontWeight: 900 }}>
                            ₹{((item.baseUnit === 'kg' && item.selectedUnit === 'gm' ? item.price / 1000 : item.price) * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && !orderComplete && (
              <div className="cart-footer">
                {customerInfo.name && (
                  <div className="customer-chip" style={{ marginBottom: '1rem' }}>
                    <div className="chip-avatar"><User size={14} /></div>
                    <div className="chip-info">
                      <span className="chip-name">{customerInfo.name}</span>
                      <span className="chip-phone">({customerInfo.phone})</span>
                    </div>
                  </div>
                )}
                
                <div className="cart-total-row"><span>Final Total</span><span style={{ color: 'var(--primary)', fontWeight: 900 }}>₹{cartTotals.finalAmount}</span></div>
                
                <button 
                  onClick={customerInfo.name ? placeOrder : () => {setIsAuthModalOpen(true); setIsCartOpen(false);}} 
                  disabled={isCheckingOut} 
                  className={`btn ${customerInfo.name ? 'btn-primary' : 'btn-outline'} place-order-btn`}
                >
                  {isCheckingOut ? (
                    <div className="spinner"></div>
                  ) : (
                    <>
                      {customerInfo.name ? 'Place Order Now' : 'Create or Login to Place Order'} 
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="auth-modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <div className="auth-icon-circle"><User size={32} /></div>
              <h2 className="auth-modal-title">Customer Login</h2>
              <p className="auth-modal-subtitle">Secure access to your customer profile</p>
            </div>

            <div className="auth-modal-body">
              {authStep === 'phone' && (
                <form onSubmit={handleCheckPhone}>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Mobile Number</label>
                    <input 
                      type="tel" className="auth-input" placeholder="e.g. 9876543210" autoFocus
                      value={tempPhone} onChange={e => setTempPhone(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={isAuthLoading || tempPhone.length < 10} className="btn btn-primary auth-action-btn">
                    {isAuthLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderColor: 'white', borderTopColor: 'transparent' }}></div> : 'Check Profile'}
                  </button>
                  <button type="button" onClick={() => setIsAuthModalOpen(false)} className="btn btn-text auth-action-btn" style={{ color: 'var(--text-muted)' }}>Cancel</button>
                </form>
              )}

              {authStep === 'welcome' && foundCustomer && (
                <div className="fade-in">
                  <div className="welcome-back-card">
                    <div className="welcome-avatar">{foundCustomer.name.charAt(0)}</div>
                    <div>
                      <div className="welcome-text-main">Welcome back, {foundCustomer.name}!</div>
                      <div className="welcome-text-sub">We've found your account with {foundCustomer.phone}</div>
                    </div>
                  </div>
                  <button onClick={() => handleAuthComplete(foundCustomer)} className="btn btn-primary auth-action-btn">
                    Continue as {foundCustomer.name.split(' ')[0]} <CheckCircle2 size={18} />
                  </button>
                  <button onClick={() => setAuthStep('phone')} className="btn btn-text auth-action-btn" style={{ color: 'var(--text-muted)' }}>Not you? Switch account</button>
                </div>
              )}

              {authStep === 'register' && (
                <div className="fade-in">
                  <p className="auth-modal-subtitle" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    Looks like you're new here! Let's get you set up.
                  </p>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Your Full Name</label>
                    <input 
                      type="text" className="auth-input" placeholder="Enter your name" autoFocus
                      value={tempName} onChange={e => setTempName(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => handleAuthComplete({ name: tempName, phone: tempPhone })} 
                    disabled={!tempName} className="btn btn-primary auth-action-btn"
                  >
                    Register & Continue
                  </button>
                  <button onClick={() => setAuthStep('phone')} className="btn btn-text auth-action-btn" style={{ color: 'var(--text-muted)' }}>Back</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CustomModal 
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset()}
        onConfirm={() => {
          setCart([]);
          localStorage.removeItem(`cart_${storeInfo?.id}`);
          blocker.proceed();
        }}
        title="Discard Cart?"
        message="You have items in your box. Leaving this page will clear your selection. Are you sure?"
        type="warning"
        confirmText="Clear & Leave"
        cancelText="Stay & Shop"
        variant="discard"
      />

      <CustomModal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({...alertModal, isOpen: false})}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        variant={alertModal.title.includes('Discard') ? 'discard' : 'default'}
        confirmText={alertModal.title.includes('Discard') ? 'DISCARD & LEAVE' : 'Okay'}
        cancelText={alertModal.title.includes('Discard') ? 'STAY & COMPLETE ORDER' : 'Cancel'}
      />
    </div>
  );
};

export default Storefront;
