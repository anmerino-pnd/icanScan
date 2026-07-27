import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function SketchSelect({ value, onChange, options = [], style, className = '', minWidth }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 240);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div 
      ref={containerRef} 
      className={`sketch-select-container ${className}`} 
      style={{ position: 'relative', width: style?.width || '100%', minWidth: minWidth || style?.minWidth || 'auto', ...style }}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="sketch-select-box"
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
          {selectedOption?.label || selectedOption?.name || value}
        </span>
        <ChevronDown 
          size={18} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
            transition: 'transform 0.15s ease',
            flexShrink: 0 
          }} 
        />
      </button>

      {isOpen && (
        <div 
          className="sketch-select-dropdown"
          style={{
            top: openUpward ? 'auto' : 'calc(100% + 6px)',
            bottom: openUpward ? 'calc(100% + 6px)' : 'auto'
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`sketch-select-option ${isSelected ? 'active' : ''}`}
              >
                <span>{opt.label || opt.name}</span>
                {isSelected && <Check size={16} color="var(--accent-red)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
