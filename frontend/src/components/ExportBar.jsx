import React from 'react';
import { Download, FileDown, Layers, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import SketchSelect from './SketchSelect';

export default function ExportBar({ 
  pages = [], 
  selectedIds = [], 
  exportQuality, 
  setExportQuality, 
  onExport, 
  isExporting, 
  onClearSession,
  showReport = false 
}) {
  const { t } = useLanguage();
  if (!pages || pages.length === 0) return null;

  const hasSelection = selectedIds.length > 0;
  const targetPages = hasSelection ? pages.filter(p => selectedIds.includes(p.id)) : pages;
  const totalKb = targetPages.reduce((acc, p) => acc + (p.size_kb || 0), 0);
  const totalMb = (totalKb / 1024).toFixed(2);

  return (
    <div className="export-bar" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Row 1: Summary Info & Quality Configuration (Only rendered when showReport is true on compact viewports) */}
      {showReport && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justify: 'space-between', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          width: '100%', 
          paddingBottom: '6px', 
          borderBottom: '1.5px dashed var(--border-lead)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--bg-surface)',
                display: 'grid',
                placeItems: 'center',
                border: '1.5px solid var(--border-lead)',
                boxShadow: '1.5px 1.5px 0px 0px #2d2d2d',
                flexShrink: 0
              }}>
                {hasSelection ? (
                  <span className="icon-centered" style={{ display: 'grid', placeItems: 'center', margin: 0, padding: 0 }}>
                    <CheckCircle2 size={18} color="var(--accent-red)" />
                  </span>
                ) : (
                  <span className="icon-centered" style={{ display: 'grid', placeItems: 'center', margin: 0, padding: 0 }}>
                    <Layers size={18} color="var(--accent-blue)" />
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: hasSelection ? 'var(--accent-red)' : 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
                  {hasSelection ? t('export.selectionActive') : t('export.reportComplete')}
                </span>
                <strong style={{ fontSize: '1rem', fontFamily: 'Kalam, cursive' }}>
                  {hasSelection ? `${selectedIds.length} / ${pages.length} ${t('export.selectedOf')}` : `${pages.length} ${pages.length === 1 ? t('export.sheetReady') : t('export.sheetsReady')}`}
                </strong>
              </div>
            </div>

            <div className="export-bar-divider" style={{ height: '24px', width: '1px', background: 'var(--border-lead)', opacity: 0.3 }} />

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontFamily: 'Patrick Hand, cursive' }}>
                {t('export.estimatedSize')}
              </span>
              <strong style={{ fontSize: '1rem', color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>
                ~{totalMb} MB
              </strong>
            </div>
          </div>

          {/* Quality Mode Configuration Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
              <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><ShieldCheck size={15} color="var(--accent-red)" /></span> {t('export.fidelityLabel')}:
            </span>
            <SketchSelect 
              value={exportQuality} 
              onChange={(val) => setExportQuality(val)}
              minWidth="140px"
              options={[
                { value: 'lossless', label: t('export.qualityLossless') },
                { value: 'high', label: t('export.qualityHigh') }
              ]}
            />
          </div>
        </div>
      )}

      {/* Row 2: Pure Action Buttons (Clear Session Left, Export All Right) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: showReport ? '2px' : '0px', gap: '1rem' }}>
        {/* Secondary Outline Clear Session Button (Left, only rendered if showReport is true in footer) */}
        {showReport ? (
          <button 
            onClick={onClearSession}
            className="btn btn-secondary export-clear-btn"
            style={{ padding: '6px 14px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}
            title={t('export.clearTooltip')}
          >
            <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><Trash2 size={14} /></span>
            <span>{t('export.clearSession')}</span>
          </button>
        ) : (
          <div /> /* Empty placeholder so flex justify-between pushes Export button to the right */
        )}

        {/* Dominant Primary Export Button (Right) */}
        <button 
          onClick={() => onExport(targetPages.map(p => p.id))} 
          disabled={isExporting}
          className="btn btn-primary export-main-btn"
          style={{ 
            padding: '10px 24px', 
            fontSize: '1.15rem', 
            fontFamily: 'Kalam, cursive', 
            fontWeight: 700,
            background: 'var(--accent-red)',
            color: '#ffffff',
            boxShadow: '3px 3px 0px 0px #2d2d2d',
            display: 'inline-flex',
            alignItems: 'center',
            justify: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {isExporting ? (
            <>
              <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><FileDown className="animate-spin" size={20} /></span>
              <span>{t('export.generatingPdf')}</span>
            </>
          ) : (
            <>
              <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><Download size={20} /></span>
              <span>{hasSelection ? `${t('export.exportSelected')} (${selectedIds.length})` : t('export.exportAll')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
