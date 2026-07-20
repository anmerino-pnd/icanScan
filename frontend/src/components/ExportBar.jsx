import React from 'react';
import { Download, FileDown, Layers, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';

export default function ExportBar({ pages = [], selectedIds = [], exportQuality, setExportQuality, onExport, isExporting, onClearSession }) {
  if (!pages || pages.length === 0) return null;

  const hasSelection = selectedIds.length > 0;
  const targetPages = hasSelection ? pages.filter(p => selectedIds.includes(p.id)) : pages;
  const totalKb = targetPages.reduce((acc, p) => acc + (p.size_kb || 0), 0);
  const totalMb = (totalKb / 1024).toFixed(2);

  return (
    <div className="paper-card-thick" style={{
      position: 'fixed',
      bottom: '24px',
      left: '368px',
      right: '28px',
      padding: '18px 26px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 50,
      background: 'var(--bg-postit)',
      boxShadow: '0 -4px 0px 0px #2d2d2d, 6px -6px 0px 0px #2d2d2d'
    }}>
      {/* Left Info Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--wobbly-sm)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--border-lead)',
            boxShadow: '2px 2px 0px 0px #2d2d2d'
          }}>
            {hasSelection ? <CheckCircle2 size={24} color="var(--accent-red)" /> : <Layers size={24} color="var(--accent-blue)" />}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: hasSelection ? 'var(--accent-red)' : 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
              {hasSelection ? 'Selección de Recorte Activa' : 'Reporte Completo de Libreta'}
            </span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'Kalam, cursive' }}>
              {hasSelection ? `${selectedIds.length} de ${pages.length} hojas seleccionadas` : `${pages.length} ${pages.length === 1 ? 'Hoja lista' : 'Hojas listas'}`}
            </strong>
          </div>
        </div>

        <div style={{ height: '36px', width: '2px', background: 'var(--border-lead)', borderLeft: '1px dashed var(--border-lead)' }} />

        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontFamily: 'Patrick Hand, cursive' }}>
            Peso Estimado
          </span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>
            ~{totalMb} MB
          </strong>
        </div>

        <div style={{ height: '36px', width: '2px', background: 'var(--border-lead)', borderLeft: '1px dashed var(--border-lead)' }} />

        {/* Quality Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
            <ShieldCheck size={16} color="var(--accent-red)" /> Fidelidad Óptica PDF
          </span>
          <select 
            value={exportQuality} 
            onChange={(e) => setExportQuality(e.target.value)}
            style={{ padding: '6px 36px 6px 14px', fontSize: '1rem', background: 'var(--bg-surface)' }}
          >
            <option value="lossless">Lossless Máximo (100% Sin Pérdida img2pdf)</option>
            <option value="high">Alta Calidad Optimizado (JPEG 95% Archivo)</option>
          </select>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onClearSession}
          className="btn btn-secondary"
          style={{ padding: '12px 18px', fontSize: '1rem', color: 'var(--accent-red)' }}
          title="Eliminar todas las hojas del cuaderno y comenzar uno nuevo"
        >
          <Trash2 size={18} />
          Limpiar Sesión
        </button>

        <button 
          onClick={() => onExport(targetPages.map(p => p.id))} 
          disabled={isExporting}
          className="btn btn-primary"
          style={{ 
            padding: '14px 30px', 
            fontSize: '1.25rem', 
            fontFamily: 'Kalam, cursive', 
            fontWeight: 700,
            background: 'var(--accent-red)',
            color: '#ffffff',
            boxShadow: '4px 4px 0px 0px #2d2d2d'
          }}
        >
          {isExporting ? (
            <>
              <FileDown className="animate-spin" size={22} />
              Generando PDF...
            </>
          ) : (
            <>
              <Download size={22} />
              {hasSelection ? `Exportar ${selectedIds.length} a PDF` : 'Exportar Todo a PDF'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
