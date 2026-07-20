import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, GripVertical, Trash2, Check } from 'lucide-react';

export default function SortablePageCard({ page, index, isSelected, onToggleSelect, onDelete, onInspect }) {
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

  const API_BASE = "http://localhost:8000";

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        transform: `${style.transform ? style.transform : ''} rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`
      }} 
      className={isSelected ? 'postit-card' : 'paper-card'}
    >
      {/* Tape Decoration at Top Center */}
      <div className="tape-decoration" />

      {/* Top Header Row: Drag Handle + Page Number Badge + Checkbox */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 14px 8px 14px', 
        borderBottom: '2px dashed var(--border-lead)'
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
              alignItems: 'center' 
            }}
            title="Arrastrar para reordenar hoja"
          >
            <GripVertical size={20} />
          </button>
          <span className="stamp-badge" style={{ 
            background: isSelected ? 'var(--text-primary)' : 'var(--accent-red)', 
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
          title="Seleccionar hoja para exportar a PDF o eliminar"
        >
          {isSelected && <Check size={18} strokeWidth={3.5} color="#ffffff" />}
        </div>
      </div>

      {/* Thumbnail Preview Area */}
      <div 
        onClick={() => onInspect(page)}
        style={{ 
          height: '240px', 
          background: '#f4f1ea', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '2px solid var(--border-lead)'
        }}
        title="Haz clic para abrir el Estudio de Previsualización y Edición instantánea"
      >
        <img 
          src={`${API_BASE}${page.preview_url}`} 
          alt={`Hoja escaneada #${index + 1}`} 
          style={{ 
            maxWidth: '90%', 
            maxHeight: '90%', 
            objectFit: 'contain', 
            boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-lead)',
            background: '#ffffff',
            transition: 'transform 0.15s ease'
          }} 
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'var(--bg-surface)',
          border: '2px solid var(--border-lead)',
          padding: '2px 8px',
          borderRadius: 'var(--wobbly-sm)',
          fontSize: '0.8rem',
          fontFamily: 'Kalam, cursive',
          fontWeight: 700,
          color: 'var(--text-primary)',
          boxShadow: '1px 1px 0px 0px #2d2d2d',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Eye size={14} color="var(--accent-blue)" />
          {page.dpi} DPI
        </div>
      </div>

      {/* Bottom Footer Info + Quick Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '10px 14px', 
        fontSize: '1rem',
        fontFamily: 'Patrick Hand, cursive',
        color: 'var(--text-secondary)'
      }}>
        <div>
          <span>{page.width}×{page.height} px</span>
          <span style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--accent-blue)' }}>({page.size_kb} KB)</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} 
          className="btn btn-secondary" 
          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
          title="Eliminar esta hoja"
        >
          <Trash2 size={16} color="var(--accent-red)" />
        </button>
      </div>
    </div>
  );
}
