import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import './InputGroup.css';

const InputGroup = ({ 
  label, name, type = 'text', icon: Icon, placeholder, isTextArea = false, 
  maxLength, formData, touched, errors, handleChange, handleBlur,
  trailingIcon: TrailingIcon, onTrailingIconClick,
  options = [], // For select inputs
  labelAction // NEW: Component or element next to label
}) => {
  const hasError = touched[name] && errors[name];
  const isSuccess = touched[name] && !errors[name] && formData[name];
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    // Mimic usual event object for handleChange
    handleChange({
      target: { name, value }
    });
    setIsOpen(false);
    
    // Also trigger blur to show success/error
    if (handleBlur) {
      handleBlur({ target: { name, value } });
    }
  };

  const selectedOption = options.find(opt => opt.value === formData[name]);

  return (
    <div className="input-group-container">
      <div className="input-label-wrapper">
        <label className="input-label">
          {label}
        </label>
        {labelAction && <div className="input-label-action">{labelAction}</div>}
      </div>
      
      <div className="input-relative" ref={dropdownRef}>
        {Icon && (
          <div className={`input-icon-wrapper ${isTextArea ? 'textarea-icon' : ''} ${hasError ? 'has-error' : ''}`}>
            <Icon size={18} />
          </div>
        )}
        
        {isTextArea ? (
          <textarea
            name={name}
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            rows="3"
            className={`input-base input-textarea ${Icon ? 'has-icon' : ''} ${hasError ? 'has-error' : ''} ${isSuccess ? 'has-success' : ''}`}
          />
        ) : type === 'select' ? (
          <div className="input-relative">
            {/* Custom Select Trigger */}
            <div
              onClick={() => setIsOpen(!isOpen)}
              className={`input-base input-select-trigger premium-select ${Icon ? 'has-icon' : ''} ${hasError ? 'has-error' : ''} ${isSuccess ? 'has-success' : ''} ${formData[name] ? 'has-value' : ''} ${isOpen ? 'is-open' : ''}`}
            >
              {selectedOption ? selectedOption.label : (placeholder || 'Select an option')}
            </div>
            
            <div className={`input-select-arrow ${isOpen ? 'is-open' : ''}`}>
              <ChevronDown size={18} />
            </div>

            {/* Custom Options List */}
            {isOpen && (
              <div className="input-select-options-list">
                {options.length === 0 ? (
                  <div className="input-select-no-options">
                    No options available
                  </div>
                ) : (
                  options.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      className={`input-select-option ${formData[name] === opt.value ? 'is-selected' : ''}`}
                    >
                      {opt.label}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <input
            name={name}
            type={type}
            value={formData[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`input-base input-text ${Icon ? 'has-icon' : ''} ${TrailingIcon ? 'has-trailing' : ''} ${hasError ? 'has-error' : ''} ${isSuccess ? 'has-success' : ''}`}
          />
        )}

        <div className="input-trailing-wrapper">
          {TrailingIcon && (
            <button 
              type="button" 
              onClick={onTrailingIconClick}
              className="input-trailing-btn"
            >
              <TrailingIcon size={18} />
            </button>
          )}
          {touched[name] && !TrailingIcon && !isTextArea && type !== 'select' && (
            <div style={{ display: 'flex' }}>
              {hasError ? <AlertCircle size={16} color="var(--error)" /> : isSuccess ? <CheckCircle2 size={16} color="var(--success)" /> : null}
            </div>
          )}
        </div>
      </div>
      {hasError && <div className="input-error-msg">{errors[name]}</div>}
    </div>
  );
};

export default InputGroup;
