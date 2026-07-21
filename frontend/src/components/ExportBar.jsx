import React from 'react';
import { Download, FileDown, Layers, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ExportBar({ pages = [], selectedIds = [], exportQuality, setExportQuality, onExport, isExporting, onClearSession }) {
  const { t } = useLanguage();
  if (!pages || pages.length === 0) return null;

  const hasSelection = selectedIds.length > 0;
  const targetPages = hasSelection ? pages.filter(p => selectedIds.includes(p.id)) : pages;
  const totalKb = targetPages.reduce((acc, p) => acc + (p.size_kb || 0), 0);
  const totalMb = (totalKb / 1024).toFixed(2);

  return (
    <div className="paper-card-thick export-bar">
      {/* Left Info Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
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
              {hasSelection ? t('export.selectionActive') : t('export.reportComplete')}
            </span>
            <strong style={{ fontSize: '1.25rem', fontFamily: 'Kalam, cursive' }}>
              {hasSelection ? `${selectedIds.length} / ${pages.length} ${t('export.selectedOf')}` : `${pages.length} ${pages.length === 1 ? t('export.sheetReady') : t('export.sheetsReady')}`}
            </strong>
          </div>
        </div>

        <div style={{ height: '36px', width: '2px', background: 'var(--border-lead)', borderLeft: '1px dashed var(--border-lead)' }} />

        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontFamily: 'Patrick Hand, cursive' }}>
            {t('export.estimatedSize')}
          </span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>
            ~{totalMb} MB
          </strong>
        </div>

        <div style={{ height: '36px', width: '2px', background: 'var(--border-lead)', borderLeft: '1px dashed var(--border-lead)' }} />

        {/* Quality Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
            <ShieldCheck size={16} color="var(--accent-red)" /> {t('export.fidelityLabel')}
          </span>
          <select 
            value={exportQuality} 
            onChange={(e) => setExportQuality(e.target.value)}
            style={{ padding: '6px 36px 6px 14px', fontSize: '1rem', background: 'var(--bg-surface)' }}
          >
            <option value="lossless">{t('export.qualityLossless')}</option>
            <option value="high">{t('export.qualityHigh')}</option>
          </select>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onClearSession}
          className="btn btn-secondary"
          style={{ padding: '12px 18px', fontSize: '1rem', color: 'var(--accent-red)' }}
          title={t('export.clearTooltip')}
        >
          <Trash2 size={18} />
          {t('export.clearSession')}
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
              {t('export.generatingPdf')}
            </>
          ) : (
            <>
              <Download size={22} />
              {hasSelection ? `${t('export.exportSelected')} (${selectedIds.length})` : t('export.exportAll')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
