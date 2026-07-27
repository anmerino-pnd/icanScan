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
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t } = useLanguage();

  if (!pages || pages.length === 0) {
    return (
      <div className="page-grid-empty-container">
        <div className="postit-card" style={{ 
          maxWidth: '480px',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'rotate(-1deg)',
          margin: 'auto'
        }}>
          <div className="tape-decoration" />
          <div style={{ 
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            background: 'var(--bg-surface)', 
            border: '3px solid var(--border-lead)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '3px 3px 0px 0px #2d2d2d'
          }}>
            <FileText size={36} color="var(--accent-red)" />
          </div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '10px', fontFamily: 'Kalam, cursive' }}>{t('grid.emptyTitle')}</h2>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.6, fontFamily: 'Patrick Hand, cursive' }}>
            {t('grid.emptyBody')}
          </p>
        </div>
      </div>
    );
  }

  const allSelected = pages.length > 0 && selectedIds.length === pages.length;

  return (
    <div className="page-grid-container">
      {/* Top Bulk Action Bar */}
      <div className="paper-card page-grid-topbar" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px', 
        marginBottom: '10px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="btn btn-secondary" 
            style={{ padding: '7px 14px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {allSelected ? <span className="icon-centered"><CheckSquare size={18} color="var(--accent-red)" /></span> : <span className="icon-centered"><Square size={18} /></span>}
            {allSelected ? t('grid.deselectAll') : t('grid.selectAll')}
          </button>
          <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'Patrick Hand, cursive' }}>
            <strong style={{ fontFamily: 'Kalam, cursive', fontSize: '1.2rem' }}>{pages.length}</strong> {pages.length === 1 ? t('grid.pagesCountSingular') : t('grid.pagesCountPlural')} 
            {selectedIds.length > 0 && ` (${selectedIds.length} ${t('grid.selectedCount')})`}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <button 
            onClick={onDeleteSelected}
            className="btn btn-danger" 
            style={{ padding: '7px 14px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="icon-centered"><Trash2 size={16} /></span>
            {t('grid.deleteSelected')} ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Grid of Sortable Cards (Only this area scrolls when scanning 50 sheets!) */}
      <div className="thumbnails-scroll-area">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={onDragEnd}
        >
          <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', 
              gap: '22px',
              paddingBottom: '16px'
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
      </div>
    </div>
  );
}
