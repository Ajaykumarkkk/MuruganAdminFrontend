import React from 'react';
import { 
  Info, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Code,
  Heart,
  ExternalLink,
  Smartphone,
  Mail,
  User,
  MessageCircle,
  Briefcase
} from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <header className="page-header">
        <div className="header-title-section">
          <div className="header-icon-wrapper about-icon">
            <Info size={24} />
          </div>
          <div>
            <h1 className="page-title">About App</h1>
            <p className="page-subtitle">Learn more about GravityPOS Cloud Version 2.0.0</p>
          </div>
        </div>
      </header>

      <div className="about-content">
        <div className="about-brand-card">
          <div className="brand-logo-large">G</div>
          <div className="brand-info">
            <h2>GravityPOS Cloud</h2>
            <p className="version-badge">Premium v2.0.0 (Latest)</p>
            <p className="app-description">
              A high-performance, cloud-native Point of Sale solution designed for modern businesses. 
              GravityPOS 2.0 offers seamless inventory management, real-time analytics, and an elite 
              storefront experience for your customers.
            </p>
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Zap className="feature-icon" color="#6366f1" />
            <h3>Speed & Agility</h3>
            <p>Built with React & Node.js for ultra-fast performance and real-time updates.</p>
          </div>
          <div className="feature-card">
            <ShieldCheck className="feature-icon" color="#10b981" />
            <h3>Secure Data</h3>
            <p>Enterprise-grade security for your transactions, customers, and store settings.</p>
          </div>
          <div className="feature-card">
            <Globe className="feature-icon" color="#3b82f6" />
            <h3>Cloud Native</h3>
            <p>Access your store dashboard from anywhere in the world on any device.</p>
          </div>
          <div className="feature-card">
            <Smartphone className="feature-icon" color="#f59e0b" />
            <h3>Mobile Ready</h3>
            <p>Fully responsive storefront and admin dashboard optimized for tablets and phones.</p>
          </div>
        </div>

        <div className="developer-info-section">
          <div className="section-glow"></div>
          <div className="developer-card">
            <div className="dev-header">
              <div className="dev-avatar">
                <User size={40} />
              </div>
              <div className="dev-title-info">
                <h3>Lead Developer</h3>
                <h2>K. AJAY KUMAR</h2>
              </div>
            </div>
            
            <div className="dev-contact-grid">
              <a href="https://wa.me/919345682746" target="_blank" rel="noopener noreferrer" className="contact-item whatsapp">
                <div className="contact-icon">
                  <MessageCircle size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">WhatsApp</span>
                  <span className="contact-value">+91 93456 82746</span>
                </div>
              </a>
              
              <a href="mailto:ajayzendeveloper@gmail.com" className="contact-item email">
                <div className="contact-icon">
                  <Mail size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Email Address</span>
                  <span className="contact-value">ajayzendeveloper@gmail.com</span>
                </div>
              </a>
              
              <div className="contact-item experience">
                <div className="contact-icon">
                  <Briefcase size={20} />
                </div>
                <div className="contact-details">
                  <span className="contact-label">Role</span>
                  <span className="contact-value">Full Stack Developer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="developer-footer">
          <Heart size={16} fill="#ef4444" color="#ef4444" />
          <span>Developed with passion by Team Gravity</span>
          <a href="#" className="dev-link">
            Visit Website <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
