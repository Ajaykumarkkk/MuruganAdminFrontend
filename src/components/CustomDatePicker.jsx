import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './CustomDatePicker.css';

const CustomDatePicker = ({ 
  label, 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  rangeStart, 
  rangeEnd,
  placeholder = "Select Date"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date(value || new Date()));
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!value) return false;
    const d = new Date(value);
    return date.getDate() === d.getDate() &&
           date.getMonth() === d.getMonth() &&
           date.getFullYear() === d.getFullYear();
  };

  const isInRange = (date) => {
    if (!rangeStart || !rangeEnd) return false;
    const d = new Date(date).setHours(0,0,0,0);
    const start = new Date(rangeStart).setHours(0,0,0,0);
    const end = new Date(rangeEnd).setHours(0,0,0,0);
    return d > start && d < end;
  };

  const isRangeBound = (date) => {
    if (!rangeStart || !rangeEnd) return false;
    const d = new Date(date).setHours(0,0,0,0);
    const start = new Date(rangeStart).setHours(0,0,0,0);
    const end = new Date(rangeEnd).setHours(0,0,0,0);
    return d === start || d === end;
  };

  const handleDateClick = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Validation: if we are setting 'From', it should be <= 'To'
    // This is handled by parent but we can be smart here
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysCount = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const cells = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(year, month, d);
      const is_today = isToday(dateObj);
      const is_selected = isSelected(dateObj);
      const is_in_range = isInRange(dateObj);
      const is_bound = isRangeBound(dateObj);
      
      let className = "calendar-day";
      if (is_today) className += " today";
      if (is_selected) className += " selected";
      if (is_in_range) className += " in-range";
      if (is_bound) className += " range-bound";

      cells.push(
        <div 
          key={d} 
          className={className}
          onClick={(e) => { e.stopPropagation(); handleDateClick(d); }}
        >
          {d}
        </div>
      );
    }

    return cells;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div className="datepicker-label-top">{label}</div>
      <div 
        className={`datepicker-trigger ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={16} className="calendar-icon" />
        <span className={value ? "date-text" : "placeholder-text"}>
          {value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ') : placeholder}
        </span>
        {value && (
          <X 
            size={14} 
            className="clear-icon" 
            onClick={(e) => { e.stopPropagation(); onChange(''); }} 
          />
        )}
      </div>

      {isOpen && (
        <div className="datepicker-calendar-popover">
          <div className="calendar-header">
            <button className="nav-btn" onClick={handlePrevMonth}><ChevronLeft size={18} /></button>
            <div className="month-year-display">
              {monthNames[viewDate.getMonth()]}, {viewDate.getFullYear()}
            </div>
            <button className="nav-btn" onClick={handleNextMonth}><ChevronRight size={18} /></button>
          </div>
          
          <div className="calendar-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="weekday">{d}</div>
            ))}
          </div>
          
          <div className="calendar-days-grid">
            {renderDays()}
          </div>

          <div className="calendar-footer">
            <button className="footer-btn today-btn" onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              onChange(today);
              setIsOpen(false);
            }}>
              Today
            </button>
            <button className="footer-btn clear-btn" onClick={() => {
              onChange('');
              setIsOpen(false);
            }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
