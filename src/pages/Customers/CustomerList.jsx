import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import {
  Users, Search, Plus, Mail, Phone, MapPin, Edit2, Trash2, UserCheck, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import './Customers.css';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        alert('Error deleting customer');
      }
    }
  };

  const processedCustomers = useMemo(() => {
    let result = [...customers];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
    });

    return result;
  }, [customers, searchTerm, sortBy]);

  const totalPages = Math.ceil(processedCustomers.length / itemsPerPage) || 1;
  const currentData = processedCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Name: A-Z', value: 'name_asc' },
    { label: 'Name: Z-A', value: 'name_desc' }
  ];

  return (
    <div className="fade-in">
      <div className="customer-header">
        <div className="customer-header-title">
          <h1>Customer Directory</h1>
          <p>Manage your customer relationships and contact details.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/customers/add')} style={{ padding: '0.65rem 1.25rem', borderRadius: '12px' }}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="card customer-card-list">
        {/* Search & Filters Bar */}
        <div className="customer-filters-bar">
          <div className="search-wrapper-cust">
            <Search size={18} className="search-icon-cust" />
            <input
              type="text"
              placeholder="Search customers by name, phone or email..."
              className="input-pretty"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <CustomSelect
              icon={ArrowUpDown}
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              minWidth="160px"
              label="Sort"
            />
          </div>
        </div>

        {/* Premium Data Table */}
        <div style={{ overflowX: 'auto', minHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'white', color: 'var(--text-muted)', fontSize: '0.75rem', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Details</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Info</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</th>
                <th style={{ padding: '1.25rem 1.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Loading customer directory...</p>
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map(customer => (
                  <tr key={customer.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', background: 'white' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="customer-avatar">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>{customer.name}</div>
                          <div className="status-badge-active">
                            <UserCheck size={12} /> Active Customer
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div className="contact-info-list">
                        {customer.phone ? (
                          <div className="contact-item">
                            <Phone size={14} color="var(--text-muted)" /> {customer.phone}
                          </div>
                        ) : null}
                        {customer.email ? (
                          <div className="contact-item-muted">
                            <Mail size={14} style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-all' }}>{customer.email}</span>
                          </div>
                        ) : null}
                        {!customer.phone && !customer.email && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No contact info.</span>}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {customer.address ? (
                        <div className="address-box">
                          <MapPin size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                          <span>{customer.address}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => navigate(`/admin/customers/edit/${customer.id}`)}
                          className="btn-outline"
                          style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white' }}
                          title="Edit Customer"
                        >
                          <Edit2 size={16} color="var(--text-main)" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="btn-outline"
                          style={{ padding: '0.5rem', color: 'var(--error)', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2' }}
                          title="Delete Customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Users size={28} color="#cbd5e1" />
                    </div>
                    <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>No Customers Found</h4>
                    {customers.length === 0 ? (
                      <p style={{ fontSize: '0.85rem' }}>Your customer directory is empty. Add your first customer!</p>
                    ) : (
                      <p style={{ fontSize: '0.85rem' }}>No customers found matching "{searchTerm}".</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-footer-cust">
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing <span style={{ color: 'var(--text-main)' }}>{((currentPage - 1) * itemsPerPage) + 1}</span> to <span style={{ color: 'var(--text-main)' }}>{Math.min(currentPage * itemsPerPage, processedCustomers.length)}</span> of <span style={{ color: 'var(--text-main)' }}>{processedCustomers.length}</span> customers
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn-cust"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`page-number-cust ${currentPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn-cust"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
