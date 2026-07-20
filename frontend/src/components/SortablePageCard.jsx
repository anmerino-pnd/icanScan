import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, GripVertical, Trash2 } from 'lucide-react';

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
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 1
  };

  const API_BASE = "http://localhost:8000";

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`glass-card ${isSelected ? 'selected-card' : ''}`}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isSelected ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? 'var(--shadow-cyan)' : 'var(--shadow-sm)'
      }}
    >
      {/* Top Header Row: Drag Handle + Page Number Badge + Checkbox */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '8px 12px', 
        background: 'rgba(0, 0, 0, 0.4)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            {...attributes} 
            {...listeners} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'grab', 
              padding: '2px', 
              display: 'flex', 
              alignItems: 'center' 
            }}
            title="Arrastrar para reordenar (Pick & Drop)"
          >
            <GripVertical size={16} />
          </button>
          <span style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontWeight: 700, 
            fontSize: '0.85rem', 
            background: 'var(--accent-cyan)', 
            color: '#0b0d11', 
            padding: '2px 8px', 
            borderRadius: '4px' 
          }}>
            #{index + 1}
          </span>
        </div>

        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={() => onToggleSelect(page.id)}
          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#00f0ff' }}
          title="Seleccionar hoja para exportar a PDF o eliminar"
        />
      </div>

      {/* Thumbnail Preview Area */}
      <div 
        onClick={() => onInspect(page)}
        style={{ 
          height: '240px', 
          background: '#1a1f2c', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        title="Haz clic para abrir el Estudio de Previsualización y Edición"
      >
        <img 
          src={`${API_BASE}${page.preview_url}`} 
          alt={`Hoja escaneada #${index + 1}`} 
          style={{ 
            maxWidth: '92%', 
            maxHeight: '92%', 
            objectFit: 'contain', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            transition: 'transform 0.2s ease'
          }} 
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Eye size={12} color="var(--accent-cyan)" />
          {page.dpi} DPI
        </div>
      </div>

      {/* Bottom Footer Info + Quick Actions */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '10px 12px', 
        background: 'rgba(0, 0, 0, 0.25)',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
      }}>
        <div>
          <span>{page.width}×{page.height} px</span>
          <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>({page.size_kb} KB)</span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(page.id); }} 
          className="btn btn-danger" 
          style={{ padding: '6px 8px', fontSize: '0.75rem' }}
          title="Eliminar esta hoja"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
