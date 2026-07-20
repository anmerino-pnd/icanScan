import React from 'react';
import { Printer, RefreshCw, Settings, Sliders, Zap } from 'lucide-react';

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
  const currentScanner = scanners.find(s => s.id === selectedDevice) || scanners[0];
  const isVirtual = currentScanner?.type === 'virtual' || selectedDevice === 'virtual-scanner-sim';

  return (
    <aside className="glass-panel" style={{ width: '320px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
      {/* Header & Device Selection */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Printer size={20} color="var(--accent-cyan)" />
            Escáner WIA
          </h2>
          <button 
            onClick={onRefreshScanners} 
            className="btn btn-secondary" 
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            title="Refrescar lista de escáneres USB"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <select 
            value={selectedDevice} 
            onChange={(e) => setSelectedDevice(e.target.value)}
            style={{ width: '100%', fontWeight: 500 }}
          >
            {scanners.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isVirtual ? 'var(--accent-amber)' : '#22c55e', marginTop: '4px' }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isVirtual ? 'var(--accent-amber)' : '#22c55e',
              display: 'inline-block'
            }} className="animate-pulse-glow" />
            {isVirtual ? 'Modo Simulación Inteligente' : 'Escáner USB Conectado y Listo'}
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

      {/* Optical Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sliders size={16} /> Parámetros de Captura
        </h3>

        {/* DPI Resolution */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Resolución Óptica (DPI)
          </label>
          <select 
            value={dpi} 
            onChange={(e) => setDpi(Number(e.target.value))}
            style={{ width: '100%' }}
          >
            <option value={150}>150 DPI — Borrador Rápido</option>
            <option value={300}>300 DPI — Recomendado Alta Calidad</option>
            <option value={600}>600 DPI — Ultra Precisión y Archivo</option>
          </select>
        </div>

        {/* Color Mode */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Modo de Color
          </label>
          <select 
            value={colorMode} 
            onChange={(e) => setColorMode(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Color">Color (RGB - Alta Fidelidad)</option>
            <option value="Grayscale">Escala de Grises (256 niveles)</option>
            <option value="B&W">Blanco y Negro (Documentos de Texto)</option>
          </select>
        </div>

        {/* Paper Size */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Tamaño de Papel
          </label>
          <select 
            value={paperSize} 
            onChange={(e) => setPaperSize(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="Letter">Carta / Letter (8.5 × 11 in)</option>
            <option value="A4">A4 Internacional (210 × 297 mm)</option>
            <option value="Custom">Completo / Cama Plana Máxima</option>
          </select>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

      {/* Main Action Button */}
      <div style={{ marginTop: 'auto' }}>
        <button 
          onClick={onScan} 
          disabled={isScanning}
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', fontSize: '1.05rem', boxShadow: 'var(--shadow-cyan)' }}
        >
          {isScanning ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Capturando Hoja...
            </>
          ) : (
            <>
              <Zap size={20} />
              + Escanear Nueva Hoja
            </>
          )}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
          La captura preserva nitidez 100% sin pérdida de compresión.
        </p>
      </div>
    </aside>
  );
}
