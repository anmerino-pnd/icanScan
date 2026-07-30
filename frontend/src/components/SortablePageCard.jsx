import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, GripVertical, Trash2, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function SortablePageCard({ page, index, isSelected, onToggleSelect, onDelete, onInspect }) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 1
  };

  const API_BASE = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : "http://127.0.0.1:8000";

  const sizeMb = ((page.size_kb || 0) / 1024).toFixed(2);

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        background: isSelected ? 'var(--bg-postit)' : '#ffffff',
        border: '2.5px solid var(--border-lead)',
        borderRadius: '10px',
        boxShadow: isSelected ? '5px 5px 0px 0px var(--accent-red)' : '4px 4px 0px 0px #2d2d2d',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }} 
    >
      {/* Dedicated Header Bar: Drag Handle + Page Badge + Checkbox */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '10px 14px', 
        background: '#fbf9f5',
        borderBottom: '2px solid var(--border-lead)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            {...attributes} 
            {...listeners} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              cursor: 'grab', 
              padding: '2px', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center' 
            }}
            title={t('card.dragTooltip')}
          >
            <span className="icon-centered"><GripVertical size={20} /></span>
          </button>
          <span className="stamp-badge" style={{ 
            background: isSelected ? 'var(--accent-red)' : '#2d2d2d', 
            color: '#ffffff', 
            padding: '2px 10px', 
            fontSize: '0.9rem' 
          }}>
            #{index + 1}
          </span>
        </div>

        <div 
          onClick={() => onToggleSelect(page.id)}
          className={`wobbly-checkbox ${isSelected ? 'checked' : ''}`}
          title={t('card.checkboxTooltip')}
        >
          {isSelected && <Check size={18} strokeWidth={3.5} color="#ffffff" />}
        </div>
      </div>

      {/* Thumbnail Preview Area - Rectangular Portrait Sheet Frame */}
      <div 
        onClick={() => onInspect(page)}
        style={{ 
          height: '290px', 
          background: '#f4efea', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          padding: '14px',
          boxSizing: 'border-box'
        }}
        title={t('card.previewTooltip')}
      >
        <img 
          src={`${API_BASE}${page.thumbnail_url || page.preview_url}`} 
          alt={`Hoja escaneada #${index + 1}`} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain', 
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.18)',
            border: '2px solid var(--border-lead)',
            background: '#ffffff',
            display: 'block',
            margin: 'auto'
          }} 
        />

        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: '#ffffff',
          border: '2px solid var(--border-lead)',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontFamily: 'Kalam, cursive',
          fontWeight: 700,
          color: 'var(--text-primary)',
          boxShadow: '1px 1px 0px 0px #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span className="icon-centered"><Eye size={14} color="var(--accent-blue)" /></span>
          {page.dpi} DPI
        </div>
      </div>

      {/* Dedicated Footer Info Bar: Dimensions, MB Weight & Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '10px 14px', 
        fontSize: '1rem',
        fontFamily: 'Patrick Hand, cursive',
        color: 'var(--text-secondary)',
        background: '#ffffff',
        borderTop: '2px solid var(--border-lead)',
        flexShrink: 0
      }}>
        <div>
          <span>{page.width}×{page.height} px</span>
          <span style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--accent-blue)' }}>({sizeMb} MB)</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} 
          className="btn btn-secondary" 
          style={{ padding: '6px 10px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          title={t('card.deleteTooltip')}
        >
          <span className="icon-centered"><Trash2 size={16} color="var(--accent-red)" /></span>
        </button>
      </div>
    </div>
  );
}
