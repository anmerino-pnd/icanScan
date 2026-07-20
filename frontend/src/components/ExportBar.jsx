import React from 'react';
import { Download, FileDown, Layers, ShieldCheck, Trash2, CheckCircle2, FileText } from 'lucide-react';

export default function ExportBar({ pages = [], selectedIds = [], exportQuality, setExportQuality, onExport, isExporting, onClearSession }) {
  if (!pages || pages.length === 0) return null;

  const hasSelection = selectedIds.length > 0;
  const targetPages = hasSelection ? pages.filter(p => selectedIds.includes(p.id)) : pages;
  const totalKb = targetPages.reduce((acc, p) => acc + (p.size_kb || 0), 0);
  const totalMb = (totalKb / 1024).toFixed(2);

  return (
    <div className="glass-panel" style={{
      position: 'fixed',
      bottom: '20px',
      left: '344px',
      right: '24px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 50,
      background: 'rgba(11, 13, 17, 0.94)',
      boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.12)'
    }}>
      {/* Left Info Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            background: hasSelection ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 240, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: hasSelection ? '1px solid var(--accent-cyan)' : 'none'
          }}>
            {hasSelection ? <CheckCircle2 size={20} color="var(--accent-cyan)" /> : <Layers size={20} color="var(--accent-cyan)" />}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: hasSelection ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: hasSelection ? 700 : 500 }}>
              {hasSelection ? 'Selección Activa' : 'Reporte Completo'}
            </span>
            <strong style={{ fontSize: '1.05rem', fontFamily: 'Outfit, sans-serif' }}>
              {hasSelection ? `${selectedIds.length} de ${pages.length} hojas seleccionadas` : `${pages.length} ${pages.length === 1 ? 'Hoja en orden' : 'Hojas en orden'}`}
            </strong>
          </div>
        </div>

        <div style={{ height: '30px', width: '1px', background: 'var(--border-subtle)' }} />

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            Peso Estimado
          </span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            ~{totalMb} MB
          </strong>
        </div>

        <div style={{ height: '30px', width: '1px', background: 'var(--border-subtle)' }} />

        {/* Quality Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="var(--accent-cyan)" /> Fidelidad Óptica PDF
          </span>
          <select 
            value={exportQuality} 
            onChange={(e) => setExportQuality(e.target.value)}
            style={{ padding: '6px 32px 6px 12px', fontSize: '0.85rem', background: '#161b26', fontWeight: 600 }}
          >
            <option value="lossless">Lossless Máximo (100% Sin Pérdida img2pdf)</option>
            <option value="high">Alta Calidad Optimizado (JPEG 95% Archivo)</option>
          </select>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button 
          onClick={onClearSession}
          className="btn btn-secondary"
          style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--accent-danger)' }}
          title="Eliminar todas las hojas del caché y comenzar un nuevo reporte desde cero"
        >
          <Trash2 size={16} />
          Limpiar Sesión
        </button>

        <button 
          onClick={() => onExport(targetPages.map(p => p.id))} 
          disabled={isExporting}
          className="btn btn-primary"
          style={{ padding: '14px 28px', fontSize: '1.05rem' }}
        >
          {isExporting ? (
            <>
              <FileDown className="animate-spin" size={20} />
              Generando PDF...
            </>
          ) : (
            <>
              <Download size={20} />
              {hasSelection ? `Exportar ${selectedIds.length} Seleccionados a PDF` : 'Exportar Todo a PDF de Alta Calidad'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
