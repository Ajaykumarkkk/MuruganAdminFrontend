import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, icon: Icon, label, minWidth = '140px', variant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`custom-select-container ${variant || ''}`} ref={dropdownRef} style={{ minWidth }}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {Icon && <Icon size={14} className="select-icon" />}
          <span className="custom-select-label">
            {label ? `${label}: ` : ''} 
            <span className="selected-value-text">{selectedOption.label}</span>
          </span>
        </div>
        <ChevronDown size={14} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`custom-select-option ${value === option.value ? 'selected' : ''} ${option.className || ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {option.icon && <option.icon size={14} />}
                {option.label}
              </div>
              {value === option.value && <CheckCircle2 size={12} color="var(--primary)" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
