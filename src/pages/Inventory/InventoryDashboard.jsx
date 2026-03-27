import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import { useAlert } from '../../context/AlertContext';
import { Plus, Edit2, Trash2, Package, Tag, AlertCircle, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown } from 'lucide-react';
import './Inventory.css';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'products';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products`),
        api.get(`/products/categories`)
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching inventory data', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, sortBy, filterCategory]);

  const handleTabChange = (tab) => {
    navigate(`/admin/inventory?tab=${tab}`);
  };

  return (
    <div className="fade-in">
      <div className="inventory-header">
        <div className="inventory-header-title">
          <h1>Inventory Management</h1>
          <p>Monitor and organize your store's comprehensive active stock.</p>
        </div>
        <div className="tab-group">
          <button 
            className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => handleTabChange('products')}
          >
            <Package size={18} /> Products
          </button>
          <button 
            className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabChange('categories')}
          >
            <Tag size={18} /> Categories
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading inventory data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'products' ? (
            <ProductListView 
              products={products}
              categories={categories}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              refetch={fetchData} 
            />
          ) : (
            <CategoryListView 
              categories={categories} 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              refetch={fetchData} 
            />
          )}
        </>
      )}
    </div>
  );
};

const ProductListView = ({ products, categories, searchTerm, setSearchTerm, sortBy, setSortBy, filterCategory, setFilterCategory, currentPage, setCurrentPage, itemsPerPage, refetch }) => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleDelete = (id) => {
    showAlert({
      title: 'Delete Product?',
      message: 'Are you sure you want to permanently delete this product? This action cannot be undone.',
      type: 'error',
      confirmText: 'YES, DELETE',
      cancelText: 'CANCEL',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/products/${id}`);
          refetch();
        } catch (error) {
          showAlert({
            title: 'Delete Failed',
            message: 'There was an error deleting the product. Please try again.',
            type: 'error'
          });
        }
      },
      variant: 'discard'
    });
  };

  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(p => String(p.category_id) === String(filterCategory));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'price_high': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'price_low': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case 'stock_low': 
          const stockA = a.stock_quantity === null ? Infinity : parseFloat(a.stock_quantity);
          const stockB = b.stock_quantity === null ? Infinity : parseFloat(b.stock_quantity);
          return stockA - stockB;
        case 'newest':
        default:
          return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
      }
    });

    return result;
  }, [products, searchTerm, filterCategory, sortBy]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage) || 1;
  const currentData = processedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    ...categories.map(c => ({ label: c.name, value: String(c.id) }))
  ];

  const sortOptions = [
    { label: 'Newest Added', value: 'newest' },
    { label: 'Name: A-Z', value: 'name_asc' },
    { label: 'Name: Z-A', value: 'name_desc' },
    { label: 'Price: High to Low', value: 'price_high' },
    { label: 'Price: Low to High', value: 'price_low' },
    { label: 'Stock: Lowest First', value: 'stock_low' }
  ];

  return (
    <div className="card inventory-card">
      <div className="inventory-filters-bar">
        <div className="search-wrapper-pos">
          <Search size={18} className="search-icon-pos" />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..."
            className="input-pretty"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <CustomSelect 
            icon={Filter}
            value={filterCategory}
            onChange={setFilterCategory}
            options={categoryOptions}
            minWidth="180px"
          />
          <CustomSelect 
            icon={ArrowUpDown}
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            minWidth="160px"
          />
          <button className="btn btn-primary" onClick={() => navigate('/admin/inventory/products/add')} style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', minHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'white', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Details</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Level</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? currentData.map(product => {
              const isUnlimited = product.stock_quantity === null;
              const stock = isUnlimited ? null : parseFloat(product.stock_quantity);
              const isLowStock = !isUnlimited && stock <= (product.low_stock_threshold || 5);
              const isOutOfStock = !isUnlimited && stock <= 0;

              return (
                <tr key={product.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: 'white' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="product-img-wrapper" style={{ opacity: product.is_active ? 1 : 0.4 }}>
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <Package size={24} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {product.name}
                          {!product.is_active && <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>INACTIVE</span>}
                        </div>
                        <div className="sku-text">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="category-badge-pill">
                      {product.category_name || 'Uncategorized'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {product.price ? `₹${parseFloat(product.price).toFixed(2)}` : 
                        (product.brand_prices && Object.keys(product.brand_prices).length > 0) ? 
                        `₹${Math.min(...Object.values(product.brand_prices).filter(p => !isNaN(parseFloat(p))).map(p => parseFloat(p))).toFixed(2)}+` : 
                        'Price Varies'}
                    </div>
                    {product.tax_rate > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+ {product.tax_rate}% Tax</div>}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                      <span className={`stock-status-pill ${isUnlimited ? 'in-stock' : isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                        {(isLowStock || isOutOfStock) && <AlertCircle size={14} />}
                        {isUnlimited ? 'UNLIMITED' : `${stock} ${product.measure_unit || 'pcs'}`}
                      </span>
                      {isOutOfStock ? (
                        <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600, marginLeft: '0.25rem' }}>Out of Stock</span>
                      ) : isLowStock ? (
                        <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600, marginLeft: '0.25rem' }}>Low Stock Alert</span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/admin/inventory/products/edit/${product.id}`)} className="btn-outline" style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} title="Edit">
                        <Edit2 size={16} color="var(--text-main)" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="btn-outline" style={{ padding: '0.5rem', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2' }} title="Delete">
                        <Trash2 size={16} color="var(--error)" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="5" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Package size={28} color="#94a3b8" />
                  </div>
                  <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No Products Found</h4>
                  <p style={{ fontSize: '0.85rem' }}>
                    {products.length === 0 ? "You haven't added any products to your inventory yet." : `No matches found for "${searchTerm}".`}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-footer">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing <span style={{ color: 'var(--text-main)' }}>{((currentPage - 1) * itemsPerPage) + 1}</span> to <span style={{ color: 'var(--text-main)' }}>{Math.min(currentPage * itemsPerPage, processedProducts.length)}</span> of <span style={{ color: 'var(--text-main)' }}>{processedProducts.length}</span> entries
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">
              <ChevronLeft size={16} /> Prev
            </button>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`page-number-btn ${currentPage === i + 1 ? 'active' : ''}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryListView = ({ categories, searchTerm, setSearchTerm, sortBy, setSortBy, currentPage, setCurrentPage, itemsPerPage, refetch }) => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleDelete = (id) => {
    showAlert({
      title: 'Delete Category?',
      message: 'Are you sure you want to delete this category? Products linked to this will become uncategorized.',
      type: 'warning',
      confirmText: 'YES, DELETE',
      cancelText: 'CANCEL',
      showCancel: true,
      onConfirm: async () => {
        try {
          await api.delete(`/products/categories/${id}`);
          refetch();
        } catch (error) {
          showAlert({
            title: 'Delete Failed',
            message: 'There was an error deleting the category. Please try again.',
            type: 'error'
          });
        }
      },
      variant: 'discard'
    });
  };

  const processedCategories = useMemo(() => {
    let result = [...categories];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
    });
    return result;
  }, [categories, searchTerm, sortBy]);

  const totalPages = Math.ceil(processedCategories.length / itemsPerPage) || 1;
  const currentData = processedCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sortOptions = [
    { label: 'Newest Added', value: 'newest' },
    { label: 'Name: A-Z', value: 'name_asc' },
    { label: 'Name: Z-A', value: 'name_desc' }
  ];

  return (
    <div className="card inventory-card">
      <div className="inventory-filters-bar">
        <div className="search-wrapper-pos">
          <Search size={18} className="search-icon-pos" />
          <input 
            type="text" 
            placeholder="Search categories by name..."
            className="input-pretty"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <CustomSelect 
            icon={ArrowUpDown}
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
            minWidth="160px"
          />
          <button className="btn btn-primary" onClick={() => navigate('/admin/inventory/categories/add')} style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}>
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', minHeight: '400px' }}>
        <div className="category-grid">
          {currentData.length > 0 ? currentData.map(cat => (
            <div key={cat.id} className="category-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="category-icon-box">
                  <Tag size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => navigate(`/admin/inventory/categories/edit/${cat.id}`)} className="btn-outline" style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }} title="Edit"><Edit2 size={14} color="var(--text-main)" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="btn-outline" style={{ padding: '0.4rem', color: 'var(--error)', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2' }} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>{cat.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                  {cat.description || 'No description provided.'}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Tag size={28} color="#94a3b8" />
              </div>
              <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No Categories Found</h4>
              <p style={{ fontSize: '0.85rem' }}>
                {categories.length === 0 ? "You haven't added any categories yet." : `No categories found matching "${searchTerm}".`}
              </p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination-footer">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing <span style={{ color: 'var(--text-main)' }}>{((currentPage - 1) * itemsPerPage) + 1}</span> to <span style={{ color: 'var(--text-main)' }}>{Math.min(currentPage * itemsPerPage, processedCategories.length)}</span> of <span style={{ color: 'var(--text-main)' }}>{processedCategories.length}</span> entries
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="pagination-btn">
              <ChevronLeft size={16} /> Prev
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="pagination-btn">
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
