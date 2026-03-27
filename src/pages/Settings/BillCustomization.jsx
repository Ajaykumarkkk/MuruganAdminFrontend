import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  MessageSquare, 
  CheckCircle2, 
  Printer, 
  Store
} from 'lucide-react';
import './Settings.css';

const BillCustomization = () => {
  const navigate = useNavigate();
  const { store } = useAuth();
  const [settings, setSettings] = useState({
    bill_header: '',
    bill_footer: '',
    print_default: true,
    save_bill_pdf: false
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/auth/store');
        const data = res.data;
        
        // Pre-fill header if empty
        let header = data.bill_header;
        if (!header) {
          header = `${data.name}\n${data.address || 'Address not set'}\nPh: ${data.phone || 'Phone not set'}`;
        }

        setSettings({
          bill_header: header,
          bill_footer: data.bill_footer || 'Thank you for your business!',
          print_default: data.print_default ?? true,
          save_bill_pdf: data.save_bill_pdf ?? false
        });
      } catch (err) {
        setError('Failed to load settings');
      }
      setFetching(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await api.put('/auth/store', settings);
      setSuccess(true);
      setTimeout(() => navigate('/admin/settings'), 1500);
    } catch (err) {
      setError('Failed to save settings');
    }
    setLoading(false);
  };

  if (fetching) return <div className="spinner" style={{ marginTop: '10rem' }}></div>;

  return (
    <div className="fade-in settings-page-bg">
      <div className="settings-container">
        
        {/* Navigation Breadcrumb */}
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button 
              onClick={() => navigate('/admin/settings')} 
              className="btn btn-outline"
              style={{ padding: '0.4rem', borderRadius: '50%', width: '40px', height: '40px' }}
            >
              <ArrowLeft size={20} color="#1f2937" />
            </button>
            <div>
              <div className="breadcrumb-label">Store Settings</div>
              <h1 className="page-title">Bill Customization</h1>
            </div>
          </div>
          <button 
            className="btn-save-top" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <div className="spinner-small" /> : <Save size={18} />}
            <span>Save Settings</span>
          </button>
        </div>

        <div className="settings-grid">
          
          {/* Main Configuration area */}
          <div className="settings-main-col">
            
            {success && (
              <div className="alert-success-premium">
                <div className="success-icon-bg">
                  <CheckCircle2 size={18} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Changes Saved</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Your receipt format has been updated globally.</div>
                </div>
              </div>
            )}

            {/* Header Configuration */}
            <section className="settings-section-card">
              <div className="settings-section-header">
                <div className="settings-icon-container"><Store size={22} color="var(--primary)" /></div>
                <div>
                  <h3 className="settings-section-title">Invoice Header</h3>
                  <p className="settings-section-subtitle">Enter your business address and contact details as they should appear on top.</p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                 <textarea 
                  className="premium-textarea"
                  value={settings.bill_header}
                  onChange={(e) => setSettings({...settings, bill_header: e.target.value})}
                  placeholder="Business Name\nAddress Line\nGST/Tax ID"
                />
              </div>
            </section>

            {/* Footer Configuration */}
            <section className="settings-section-card">
              <div className="settings-section-header">
                <div className="settings-icon-container"><MessageSquare size={22} color="var(--primary)" /></div>
                <div>
                  <h3 className="settings-section-title">Receipt Footer Message</h3>
                  <p className="settings-section-subtitle">Add a personalized thank you note, return policy, or social handle.</p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                 <textarea 
                  className="premium-textarea"
                  style={{ minHeight: '100px' }}
                  value={settings.bill_footer}
                  onChange={(e) => setSettings({...settings, bill_footer: e.target.value})}
                  placeholder="e.g. Visit us again at www.gravitypos.cloud"
                />
              </div>
            </section>

            {/* Printing Logic */}
            <section className="settings-section-card">
              <div className="settings-section-header">
                <div className="settings-icon-container"><Printer size={22} color="var(--primary)" /></div>
                <div>
                  <h3 className="settings-section-title">Transactional Behavior</h3>
                  <p className="settings-section-subtitle">Configure how the system handles receipts during the checkout process.</p>
                </div>
              </div>
              
              <div className="preferences-grid">
                <div className="preference-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Print by Default</div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>Show print dialog immediately.</p>
                  </div>
                  <label className="switch-web">
                    <input type="checkbox" checked={settings.print_default} onChange={(e) => setSettings({...settings, print_default: e.target.checked})} />
                    <span className="slider-web round"></span>
                  </label>
                </div>

                <div className="preference-card">
                   <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Auto-Save PDF</div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>Keep digital copies of every bill.</p>
                  </div>
                  <label className="switch-web">
                    <input type="checkbox" checked={settings.save_bill_pdf} onChange={(e) => setSettings({...settings, save_bill_pdf: e.target.checked})} />
                    <span className="slider-web round"></span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Receipt Visualization Column */}
          <aside className="settings-sidebar">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="visualization-label">Real-time Visualization</span>
            </div>
            
            <div className="paper-container">
              <div className="receipt-paper">
                {/* Receipt Header */}
                <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#111827', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {settings.bill_header || 'Business Name\nStore Address\nPh: +91 00000 00000'}
                  </div>
                </header>

                <div className="receipt-divider-dashed" />

                {/* Sample Items */}
                <div style={{ margin: '1rem 0' }}>
                  {[
                    { name: 'Cold Brew Coffee', qty: 2, price: 240 },
                    { name: 'Cinnamon Roll', qty: 1, price: 120 },
                    { name: 'Blueberry Muffin', qty: 1, price: 95 }
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#374151' }}>{item.name} x {item.qty}</span>
                      <span style={{ fontWeight: 600 }}>₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider-dashed" />

                {/* Calculations */}
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#111827' }}>
                    <span>TOTAL AMOUNT</span>
                    <span>₹455.00</span>
                  </div>
                </div>

                <div className="receipt-divider-dashed" />

                {/* Footer Message */}
                <footer style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <p style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'pre-wrap', fontStyle: 'italic', lineHeight: '1.5' }}>
                    {settings.bill_footer || 'Thank you for your visit!\nVisit us again.'}
                  </p>
                  <div style={{ marginTop: '2rem', fontSize: '10px', color: '#9ca3af', letterSpacing: '1px' }}>
                    ORD#1024 | 20-MAR-2026 | 12:45 PM
                  </div>
                </footer>
              </div>
              <div className="receipt-zigzag" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BillCustomization;
