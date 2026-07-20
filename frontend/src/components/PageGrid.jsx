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
        distance: 5,
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
        textAlign: 'center'
      }}>
        <div className="postit-card" style={{ 
          maxWidth: '480px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'rotate(-1deg)'
        }}>
          <div className="tape-decoration" />
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'var(--bg-surface)', 
            border: '3px solid var(--border-lead)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '3px 3px 0px 0px #2d2d2d'
          }}>
            <FileText size={40} color="var(--accent-red)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px', fontFamily: 'Kalam, cursive' }}>¡Lienzo de Escaneo Vacío!</h2>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.15rem', lineHeight: 1.6, fontFamily: 'Patrick Hand, cursive' }}>
            Conecta tu escáner WIA y haz clic en el botón <strong>+ Escanear Nueva Hoja</strong> de la izquierda para pegar aquí tus documentos digitalizados.
          </p>
        </div>
      </main>
    );
  }

  const allSelected = pages.length > 0 && selectedIds.length === pages.length;

  return (
    <main className="page-grid-area">
      {/* Top Bulk Action Bar */}
      <div className="paper-card" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 20px', 
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '1rem' }}
          >
            {allSelected ? <CheckSquare size={18} color="var(--accent-red)" /> : <Square size={18} />}
            {allSelected ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'Patrick Hand, cursive' }}>
            <strong style={{ fontFamily: 'Kalam, cursive', fontSize: '1.25rem' }}>{pages.length}</strong> {pages.length === 1 ? 'hoja en el cuaderno' : 'hojas en el cuaderno'} 
            {selectedIds.length > 0 && ` (${selectedIds.length} seleccionadas)`}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <button 
            onClick={onDeleteSelected}
            className="btn btn-danger" 
            style={{ padding: '8px 16px', fontSize: '1rem' }}
          >
            <Trash2 size={18} />
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', 
            gap: '24px',
            paddingBottom: '120px'
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
