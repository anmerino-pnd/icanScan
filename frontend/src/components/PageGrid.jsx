import React from 'react';
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';
import { CheckSquare, FileText, Square, Trash2 } from 'lucide-react';
import SortablePageCard from './SortablePageCard';

export default function PageGrid({ 
  pages, 
  selectedIds, 
  onToggleSelect, 
  onSelectAll, 
  onDeselectAll, 
  onDeleteSelected, 
  onDeleteSingle, 
  onInspect,
  onDragEnd 
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before starting drag to allow clicking checkboxes easily
      },
    })
  );

  if (!pages || pages.length === 0) {
    return (
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.04) 0%, transparent 70%)'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'var(--bg-surface-elevated)', 
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <FileText size={40} color="var(--accent-cyan)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Lienzo de Escaneo Vacío</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem' }}>
          Conecta tu escáner WIA y haz clic en el botón <strong>+ Escanear Nueva Hoja</strong> de la izquierda para comenzar a digitalizar tus documentos en máxima fidelidad.
        </p>
      </main>
    );
  }

  const allSelected = pages.length > 0 && selectedIds.length === pages.length;

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
      {/* Top Bulk Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 20px', 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: 'var(--radius-md)', 
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            {allSelected ? <CheckSquare size={16} color="var(--accent-cyan)" /> : <Square size={16} />}
            {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <strong>{pages.length}</strong> {pages.length === 1 ? 'hoja escaneada' : 'hojas escaneadas'} 
            {selectedIds.length > 0 && ` (${selectedIds.length} seleccionadas)`}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <button 
            onClick={onDeleteSelected}
            className="btn btn-danger" 
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <Trash2 size={16} />
            Borrar Seleccionadas ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Grid of Sortable Cards */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={onDragEnd}
      >
        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
            gap: '20px',
            paddingBottom: '100px' // Space for bottom Export Bar
          }}>
            {pages.map((page, idx) => (
              <SortablePageCard 
                key={page.id} 
                page={page} 
                index={idx} 
                isSelected={selectedIds.includes(page.id)}
                onToggleSelect={onToggleSelect}
                onDelete={onDeleteSingle}
                onInspect={onInspect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </main>
  );
}
