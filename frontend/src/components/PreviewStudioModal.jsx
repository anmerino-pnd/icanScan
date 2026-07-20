import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Sun, 
  Contrast, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  RefreshCcw, 
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function PreviewStudioModal({ page, pageIndex, totalCount = 1, onClose, onUpdatePage, onNavigate }) {
  const [rotation, setRotation] = useState(page.rotation || 0);
  const [brightness, setBrightness] = useState(page.brightness || 0.0);
  const [contrast, setContrast] = useState(page.contrast || 0.0);
  const [bwFilter, setBwFilter] = useState(page.bw_filter || false);
  
  const [previewUrl, setPreviewUrl] = useState(page.preview_url);
  const [isApplying, setIsApplying] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  const API_BASE = "http://localhost:8000";

  // Sync state whenever page changes via navigation arrows
  useEffect(() => {
    setRotation(page.rotation || 0);
    setBrightness(page.brightness || 0.0);
    setContrast(page.contrast || 0.0);
    setBwFilter(page.bw_filter || false);
    setPreviewUrl(page.preview_url);
    setZoom(1.0);
  }, [page.id]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft' && pageIndex > 0 && onNavigate) {
        onNavigate(pageIndex - 1);
      } else if (e.key === 'ArrowRight' && pageIndex < totalCount - 1 && onNavigate) {
        onNavigate(pageIndex + 1);
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageIndex, totalCount, onNavigate, onClose]);

  // Debounced API call to apply real-time adjustments
  useEffect(() => {
    // Skip if values match current page state
    if (
      rotation === (page.rotation || 0) &&
      brightness === (page.brightness || 0.0) &&
      contrast === (page.contrast || 0.0) &&
      bwFilter === (page.bw_filter || false) &&
      previewUrl === page.preview_url
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsApplying(true);
      try {
        const response = await fetch(`${API_BASE}/api/pages/${page.id}/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rotation,
            brightness,
            contrast,
            bw_filter: bwFilter
          })
        });
        if (response.ok) {
          const data = await response.json();
          setPreviewUrl(data.preview_url);
          // Also update parent state so grid card reflects latest
          onUpdatePage(page.id, {
            preview_url: data.preview_url,
            rotation: data.rotation,
            brightness: data.brightness,
            contrast: data.contrast,
            bw_filter: data.bw_filter,
            size_kb: data.size_kb
          });
        }
      } catch (err) {
        console.error("Error applying live adjustment:", err);
      } finally {
        setIsApplying(false);
      }
    }, 300); // 300ms debounce for smooth slider feel

    return () => clearTimeout(timer);
  }, [rotation, brightness, contrast, bwFilter, page.id]);

  const handleRotate = (deg) => {
    setRotation((prev) => (prev + deg) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setBrightness(0.0);
    setContrast(0.0);
    setBwFilter(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.88)',
      backdropFilter: 'blur(16px)',
      zIndex: 1000,
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Center Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'rgba(11, 13, 17, 0.8)',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Navigation Arrows Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => onNavigate && pageIndex > 0 && onNavigate(pageIndex - 1)}
                disabled={pageIndex <= 0}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: pageIndex <= 0 ? 0.4 : 1 }}
                title="Hoja Anterior (Flecha Izquierda)"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'var(--accent-cyan)',
                color: '#0b0d11',
                padding: '4px 12px',
                borderRadius: '6px'
              }}>
                Hoja #{pageIndex + 1} de {totalCount}
              </span>

              <button
                onClick={() => onNavigate && pageIndex < totalCount - 1 && onNavigate(pageIndex + 1)}
                disabled={pageIndex >= totalCount - 1}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.8rem', opacity: pageIndex >= totalCount - 1 ? 0.4 : 1 }}
                title="Hoja Siguiente (Flecha Derecha)"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Estudio de Previsualización</h3>
            {isApplying && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCcw size={14} className="animate-spin" /> Procesando nitidez...
              </span>
            )}
          </div>

          {/* Zoom Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }}
              title="Alejar zoom"
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: '0.85rem', width: '50px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px' }}
              title="Acercar zoom"
            >
              <ZoomIn size={16} />
            </button>
            <button 
              onClick={() => setZoom(1.0)} 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              title="Ajustar a pantalla"
            >
              <Maximize2 size={16} /> Fit
            </button>
          </div>
        </div>

        {/* Canvas Image Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'radial-gradient(circle at center, #181d2a 0%, #0e1118 100%)',
          position: 'relative'
        }}>
          {/* Floating Left Arrow */}
          {pageIndex > 0 && (
            <button
              onClick={() => onNavigate && onNavigate(pageIndex - 1)}
              className="btn btn-secondary"
              style={{
                position: 'absolute',
                left: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                zIndex: 10,
                background: 'rgba(22, 27, 38, 0.85)',
                backdropFilter: 'blur(8px)'
              }}
              title="Anterior (Flecha Izquierda)"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <img 
            src={`${API_BASE}${previewUrl}`} 
            alt="Hoja en previsualización" 
            style={{
              maxHeight: '85vh',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              border: '1px solid var(--border-subtle)'
            }}
          />

          {/* Floating Right Arrow */}
          {pageIndex < totalCount - 1 && (
            <button
              onClick={() => onNavigate && onNavigate(pageIndex + 1)}
              className="btn btn-secondary"
              style={{
                position: 'absolute',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                zIndex: 10,
                background: 'rgba(22, 27, 38, 0.85)',
                backdropFilter: 'blur(8px)'
              }}
              title="Siguiente (Flecha Derecha)"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Right Inspector Panel */}
      <aside className="glass-panel" style={{
        width: '360px',
        borderLeft: '1px solid var(--border-subtle)',
        borderTop: 'none',
        borderBottom: 'none',
        borderRight: 'none',
        borderRadius: 0,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '1.1rem' }}>Parámetros Ópticos</h4>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Page Metadata Box */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Resolución de captura:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{page.dpi} DPI</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Dimensiones físicas:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{page.width} × {page.height} px</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Peso en caché:</span>
            <strong style={{ color: 'var(--accent-cyan)' }}>{page.size_kb} KB</strong>
          </div>
        </div>

        {/* 1. Rotation Controls */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={16} /> Rotación de Hoja ({rotation}°)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <button onClick={() => handleRotate(90)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px' }}>
              +90° CW
            </button>
            <button onClick={() => handleRotate(180)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px' }}>
              +180°
            </button>
            <button onClick={() => handleRotate(270)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px' }}>
              +270°
            </button>
          </div>
        </div>

        {/* 2. Brightness Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sun size={16} /> Brillo</span>
            <strong style={{ color: brightness !== 0 ? 'var(--accent-cyan)' : 'inherit' }}>{brightness > 0 ? `+${brightness}` : brightness}</strong>
          </div>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="5" 
            value={brightness} 
            onChange={(e) => setBrightness(Number(e.target.value))} 
          />
        </div>

        {/* 3. Contrast Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Contrast size={16} /> Contraste</span>
            <strong style={{ color: contrast !== 0 ? 'var(--accent-cyan)' : 'inherit' }}>{contrast > 0 ? `+${contrast}` : contrast}</strong>
          </div>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="5" 
            value={contrast} 
            onChange={(e) => setContrast(Number(e.target.value))} 
          />
        </div>

        {/* 4. B&W Threshold Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: bwFilter ? 'rgba(0, 240, 255, 0.08)' : 'var(--bg-surface)',
          border: bwFilter ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }} onClick={() => setBwFilter(!bwFilter)}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>Filtro Blanco/Negro</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Umbral alto para texto y firmas</span>
          </div>
          <input 
            type="checkbox" 
            checked={bwFilter} 
            onChange={(e) => setBwFilter(e.target.checked)} 
            style={{ width: '18px', height: '18px', pointerEvents: 'none' }}
          />
        </div>

        {/* Bottom Action Bar */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            <Check size={18} />
            Confirmar y Guardar Hoja
          </button>
          <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}>
            <RefreshCcw size={14} />
            Restablecer Valores
          </button>
        </div>
      </aside>
    </div>
  );
}
