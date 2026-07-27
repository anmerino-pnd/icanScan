import React from 'react';
import { Printer, RefreshCw, Sliders, Plus, Layers, ShieldCheck, Trash2, CheckCircle2, Download, FileDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import SketchSelect from './SketchSelect';

export default function ScannerControls({
  scanners,
  selectedDevice,
  setSelectedDevice,
  dpi,
  setDpi,
  colorMode,
  setColorMode,
  paperSize,
  setPaperSize,
  onScan,
  isScanning,
  onRefreshScanners,
  width,
  pages = [],
  selectedIds = [],
  exportQuality,
  setExportQuality,
  onClearSession,
  onExport,
  isExporting
}) {
  const { t } = useLanguage();

  const currentScanner = scanners.find(s => s.id === selectedDevice) || scanners[0];
  const isVirtual = currentScanner?.type === 'virtual' || selectedDevice === 'virtual-scanner-sim';

  const scannerOptions = scanners.map(s => ({ value: s.id, label: s.name }));
  const dpiOptions = [
    { value: 150, label: t('scanner.dpi150') },
    { value: 300, label: t('scanner.dpi300') },
    { value: 600, label: t('scanner.dpi600') }
  ];
  const colorOptions = [
    { value: 'Color', label: t('scanner.modeColor') },
    { value: 'Grayscale', label: t('scanner.modeGrayscale') },
    { value: 'B&W', label: t('scanner.modeBw') }
  ];
  const paperOptions = [
    { value: 'Letter', label: t('scanner.paperLetter') },
    { value: 'Legal', label: t('scanner.paperLegal') },
    { value: 'A4', label: t('scanner.paperA4') },
    { value: 'A3', label: t('scanner.paperA3') },
    { value: 'A5', label: t('scanner.paperA5') },
    { value: 'Photo4x6', label: t('scanner.paperPhoto') },
    { value: 'Custom', label: t('scanner.paperCustom') }
  ];

  const hasSelection = selectedIds.length > 0;
  const targetPages = hasSelection ? pages.filter(p => selectedIds.includes(p.id)) : pages;
  const totalKb = targetPages.reduce((acc, p) => acc + (p.size_kb || 0), 0);
  const totalMb = (totalKb / 1024).toFixed(2);

  return (
    <aside 
      className="paper-card-thick scanner-sidebar"
      style={{ 
        width: '380px', 
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Scrollable Parameters & Report Area */}
      <div className="scanner-sidebar-scrollable">
        {/* Header & Device Selection (Spacious layout, no border on printer icon) */}
        <div style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justify: 'space-between', 
            marginBottom: '10px',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            gap: '10px'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              {/* Clean Printer Icon without border */}
              <span className="icon-centered" style={{ display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Printer size={22} color="var(--accent-red)" />
              </span>
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                fontWeight: 700
              }}>
                {t('scanner.title')}
              </span>
            </h2>
            <button 
              onClick={onRefreshScanners} 
              className="btn btn-secondary" 
              style={{ 
                padding: '6px 10px', 
                fontSize: '0.85rem', 
                flexShrink: 0,
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center'
              }}
              title={t('scanner.refreshTooltip')}
            >
              <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><RefreshCw size={15} /></span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
            <SketchSelect 
              value={selectedDevice}
              onChange={(val) => setSelectedDevice(val)}
              options={scannerOptions}
            />

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem', 
              color: isVirtual ? '#d97706' : 'var(--accent-green)', 
              marginTop: '2px', 
              fontWeight: 600,
              minWidth: 0
            }}>
              <span 
                className="status-dot-idle"
                style={{ 
                  width: '9px', 
                  height: '9px', 
                  borderRadius: '50%', 
                  backgroundColor: isVirtual ? '#fbbf24' : 'var(--accent-green)',
                  border: '1.5px solid var(--border-lead)',
                  display: 'inline-block',
                  flexShrink: 0
                }} 
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isVirtual ? t('scanner.virtualActive') : t('scanner.usbActive')}
              </span>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px dashed var(--border-lead)', margin: '6px 0' }} />

        {/* Capture Parameters (Always visible section, accordion removed) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, margin: 0 }}>
            <span className="icon-centered" style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              <Sliders size={16} color="var(--accent-blue)" />
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t('scanner.captureParams')}
            </span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
            {/* DPI Resolution */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('scanner.dpiLabel')}
              </label>
              <SketchSelect 
                value={dpi}
                onChange={(val) => setDpi(Number(val))}
                options={dpiOptions}
              />
            </div>

            {/* Color Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('scanner.colorModeLabel')}
              </label>
              <SketchSelect 
                value={colorMode}
                onChange={(val) => setColorMode(val)}
                options={colorOptions}
              />
            </div>

            {/* Paper Size */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '3px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('scanner.paperSizeLabel')}
              </label>
              <SketchSelect 
                value={paperSize}
                onChange={(val) => setPaperSize(val)}
                options={paperOptions}
              />
            </div>

            {/* + Scan New Page Button (Placed DIRECTLY BELOW Paper Size) */}
            <div style={{ paddingTop: '6px' }}>
              <button 
                onClick={onScan} 
                disabled={isScanning}
                className="btn btn-amber" 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  fontSize: '1.2rem', 
                  fontFamily: 'Kalam, cursive', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isScanning ? (
                  <>
                    <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><RefreshCw className="animate-spin" size={18} /></span>
                    {t('scanner.scanningBtn')}
                  </>
                ) : (
                  <>
                    <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><Plus size={20} strokeWidth={3} color="var(--accent-red)" /></span>
                    {t('scanner.scanBtn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notebook Report Section & Export PDF CTA Button */}
        {pages && pages.length > 0 && (
          <>
            <hr style={{ border: 'none', borderTop: '1.5px dashed var(--border-lead)', margin: '12px 0' }} />
            
            <div className="postit-card" style={{ padding: '14px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '5px',
                  background: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  border: '1.5px solid var(--border-lead)',
                  boxShadow: '1px 1px 0px 0px #2d2d2d',
                  flexShrink: 0
                }}>
                  {hasSelection ? <CheckCircle2 size={16} color="var(--accent-red)" /> : <Layers size={16} color="var(--accent-blue)" />}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: hasSelection ? 'var(--accent-red)' : 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontFamily: 'Kalam, cursive', fontWeight: 700 }}>
                    {hasSelection ? t('export.selectionActive') : t('export.reportComplete')}
                  </span>
                  <strong style={{ fontSize: '0.95rem', fontFamily: 'Kalam, cursive' }}>
                    {hasSelection ? `${selectedIds.length} / ${pages.length} ${t('export.selectedOf')}` : `${pages.length} ${pages.length === 1 ? t('export.sheetReady') : t('export.sheetsReady')}`}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontFamily: 'Patrick Hand, cursive' }}>{t('export.estimatedSize')}:</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>~{totalMb} MB</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontFamily: 'Kalam, cursive', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="var(--accent-red)" /> {t('export.fidelityLabel')}:
                </span>
                <SketchSelect 
                  value={exportQuality} 
                  onChange={(val) => setExportQuality(val)}
                  minWidth="120px"
                  options={[
                    { value: 'lossless', label: t('export.qualityLossless') },
                    { value: 'high', label: t('export.qualityHigh') }
                  ]}
                />
              </div>

              {/* Clear Session Secondary Button */}
              <button 
                onClick={onClearSession}
                className="btn btn-secondary export-clear-btn"
                style={{ 
                  width: '100%', 
                  padding: '6px 10px', 
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '6px', 
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
                title={t('export.clearTooltip')}
              >
                <span className="icon-centered" style={{ display: 'grid', placeItems: 'center' }}><Trash2 size={14} /></span>
                <span>{t('export.clearSession')}</span>
              </button>

              {/* Primary Export All to PDF Button */}
              {onExport && (
                <button 
                  onClick={() => onExport(targetPages.map(p => p.id))} 
                  disabled={isExporting}
                  className="btn btn-primary export-main-btn"
                  style={{ 
                    width: '100%',
                    padding: '12px 14px', 
                    fontSize: '1.2rem', 
                    fontFamily: 'Kalam, cursive', 
                    fontWeight: 700,
                    background: 'var(--accent-red)',
                    color: '#ffffff',
                    boxShadow: '4px 4px 0px 0px #2d2d2d',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px',
                    boxSizing: 'border-box'
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
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
