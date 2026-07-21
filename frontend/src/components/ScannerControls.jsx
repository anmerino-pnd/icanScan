import React from 'react';
import { Printer, RefreshCw, Sliders, Zap } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

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
  onRefreshScanners
}) {
  const { t } = useLanguage();
  const currentScanner = scanners.find(s => s.id === selectedDevice) || scanners[0];
  const isVirtual = currentScanner?.type === 'virtual' || selectedDevice === 'virtual-scanner-sim';

  return (
    <aside className="paper-card-thick scanner-sidebar">
      {/* Tack Decoration at Top Center */}
      <div className="tack-decoration" />

      {/* Header & Device Selection */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={22} color="var(--accent-red)" />
            {t('scanner.title')}
          </h2>
          <button 
            onClick={onRefreshScanners} 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
            title={t('scanner.refreshTooltip')}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)}
            style={{ width: '100%', fontWeight: 600 }}
          >
            {scanners.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: isVirtual ? '#d97706' : 'var(--accent-green)', marginTop: '4px', fontWeight: 600 }}>
            <span style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: isVirtual ? '#fbbf24' : 'var(--accent-green)',
              border: '2px solid var(--border-lead)',
              display: 'inline-block'
            }} className="animate-pulse-bounce" />
            {isVirtual ? t('scanner.virtualActive') : t('scanner.usbActive')}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px dashed var(--border-lead)', margin: '4px 0' }} />

      {/* Optical Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-blue)" /> {t('scanner.captureParams')}
        </h3>

        {/* DPI Resolution */}
        <div>
          <label style={{ display: 'block', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('scanner.dpiLabel')}
          </label>
          <select 
            value={dpi} 
            onChange={(e) => setDpi(Number(e.target.value))}
            style={{ width: '100%' }}
          >
            <option value={150}>{t('scanner.dpi150')}</option>
            <option value={300}>{t('scanner.dpi300')}</option>
            <option value={600}>{t('scanner.dpi600')}</option>
          </select>
        </div>

        {/* Color Mode */}
        <div>
          <label style={{ display: 'block', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('scanner.colorModeLabel')}
          </label>
          <select 
            value={colorMode} 
            onChange={(e) => setColorMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Color">{t('scanner.modeColor')}</option>
            <option value="Grayscale">{t('scanner.modeGrayscale')}</option>
            <option value="B&W">{t('scanner.modeBw')}</option>
          </select>
        </div>

        {/* Paper Size */}
        <div>
          <label style={{ display: 'block', fontSize: '1rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {t('scanner.paperSizeLabel')}
          </label>
          <select 
            value={paperSize} 
            onChange={(e) => setPaperSize(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Letter">{t('scanner.paperLetter')}</option>
            <option value="Legal">{t('scanner.paperLegal')}</option>
            <option value="A4">{t('scanner.paperA4')}</option>
            <option value="A3">{t('scanner.paperA3')}</option>
            <option value="A5">{t('scanner.paperA5')}</option>
            <option value="Photo4x6">{t('scanner.paperPhoto')}</option>
            <option value="Custom">{t('scanner.paperCustom')}</option>
          </select>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '2px dashed var(--border-lead)', margin: '4px 0' }} />

      {/* Main Action Button */}
      <div style={{ marginTop: 'auto' }}>
        <button 
          onClick={onScan} 
          disabled={isScanning}
          className="btn btn-amber" 
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '1.35rem', 
            fontFamily: 'Kalam, cursive', 
            fontWeight: 700,
            transform: 'rotate(-1deg)',
            boxShadow: '4px 4px 0px 0px #2d2d2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          {isScanning ? (
            <>
              <RefreshCw className="animate-spin" size={24} />
              {t('scanner.scanningBtn')}
            </>
          ) : (
            <>
              {t('scanner.scanBtn')}
            </>
          )}
        </button>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px', fontFamily: 'Patrick Hand, cursive' }}>
          {t('scanner.footerHint')}
        </p>
      </div>
    </aside>
  );
}
