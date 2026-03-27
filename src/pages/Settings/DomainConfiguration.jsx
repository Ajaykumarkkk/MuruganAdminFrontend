import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import InputGroup from '../../components/InputGroup';
import { 
  Globe, 
  Link as LinkIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Info
} from 'lucide-react';
import './Settings.css';

const DomainConfiguration = () => {
  const { store } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    domain: '',
    slug: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/auth/store');
        setFormData({
          domain: res.data.domain || '',
          slug: res.data.slug || ''
        });
      } catch (err) {
        setServerError('Failed to load domain settings');
      }
      setFetching(false);
    };
    fetchStore();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'slug' && value) {
      if (!/^[a-z0-9-]+$/.test(value)) {
        error = 'Only lowercase letters, numbers, and hyphens allowed';
      }
    }
    if (name === 'domain' && value) {
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)) {
        error = 'Enter a valid domain (e.g., myshop.com)';
      }
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
    setSuccess(false);
    
    const domainErr = validateField('domain', formData.domain);
    const slugErr = validateField('slug', formData.slug);
    
    if (domainErr || slugErr) {
      setErrors({ domain: domainErr, slug: slugErr });
      setTouched({ domain: true, slug: true });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/store', formData);
      setSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error updating domain settings');
    }
    setLoading(false);
  };

  const previewUrl = formData.slug ? `${window.location.origin}/${formData.slug}` : `${window.location.origin}`;

  if (fetching) return <div className="spinner" style={{ marginTop: '10rem' }}></div>;

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate('/admin/settings')} 
          className="btn btn-outline" 
          style={{ padding: '0.4rem', borderRadius: '50%', width: '40px', height: '40px' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Domain Configuration</h1>
      </div>

      {success && (
        <div style={{ backgroundColor: '#f0fdf4', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #dcfce7' }}>
          <CheckCircle2 size={18} />
          <span>Domain settings updated successfully!</span>
        </div>
      )}

      {serverError && (
        <div style={{ backgroundColor: '#fef2f2', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fee2e2' }}>
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            
            {/* Slug Section */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <LinkIcon size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Store Slug (for localhost)</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', margin: '0.25rem 0 1.5rem 0' }}>
                Set a unique slug to access your storefront on localhost or subfolder. 
                Example: <code>{window.location.host}/my-shop</code>
              </p>
              
              <InputGroup 
                label="Store Slug" 
                name="slug" 
                icon={LinkIcon} 
                placeholder="e.g. ajay" 
                maxLength={30}
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />
              
              {formData.slug && !errors.slug && (
                <div className="preview-url-box">
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Preview: <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{previewUrl}</span>
                  </div>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={16} />
                  </a>
                </div>
              )}
            </section>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Custom Domain Section */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Globe size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Custom Domain (Production)</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem', margin: '0.25rem 0 1.5rem 0' }}>
                Enter your registered domain name. Ensure your domain's DNS is pointed to our servers.
                Example: <code>ajay.shop</code>
              </p>
              
              <InputGroup 
                label="Custom Domain" 
                name="domain" 
                icon={Globe} 
                placeholder="e.g. ajay.shop" 
                maxLength={100}
                formData={formData} touched={touched} errors={errors} handleChange={handleChange} handleBlur={handleBlur}
              />

              <div className="dns-info-box">
                <Info size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#1e40af', lineHeight: 1.5 }}>
                  <strong>DNS Settings:</strong> Point your domain's A record to our IP <code>123.123.123.123</code> (replace with actual IP) or use a CNAME record pointing to our main domain.
                </div>
              </div>
            </section>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={() => navigate('/admin/settings')} className="btn btn-outline" style={{ minWidth: '120px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '180px' }} disabled={loading}>
              <Save size={18} /> {loading ? 'Saving Settings...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DomainConfiguration;
