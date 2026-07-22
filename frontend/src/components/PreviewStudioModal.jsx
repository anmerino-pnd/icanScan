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
import { useLanguage } from '../i18n/LanguageContext';

export default function PreviewStudioModal({ page, pageIndex, totalCount = 1, onClose, onUpdatePage, onNavigate }) {
  const { t } = useLanguage();
  const [rotation, setRotation] = useState(page.rotation || 0);
  const [brightness, setBrightness] = useState(page.brightness || 0.0);
  const [contrast, setContrast] = useState(page.contrast || 0.0);
  const [bwFilter, setBwFilter] = useState(page.bw_filter || false);
  
  const [previewUrl, setPreviewUrl] = useState(page.preview_url);
  const [isApplying, setIsApplying] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : "http://127.0.0.1:8000";

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

  // Background / debounced API call (600ms) to sync high-res disk image after slider settles
  useEffect(() => {
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
        console.error("Error applying adjustment to disk:", err);
      } finally {
        setIsApplying(false);
      }
    }, 600); // 600ms debounce ensures zero network interruption while actively sliding

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

  // Instantaneous GPU CSS Filters & Transforms (0ms Latency / 60 FPS)
  // While sliding, the user gets immediate visual feedback right in the browser viewport
  const cssFilter = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) ${bwFilter ? 'grayscale(100%) contrast(220%)' : ''}`;
  const cssTransform = `scale(${zoom}) rotate(${rotation}deg)`;

  return (
    <div className="studio-modal-container">
      {/* Center Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: 'var(--bg-paper)',
          borderBottom: '3px solid var(--border-lead)',
          boxShadow: '0 4px 0px 0px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Navigation Arrows Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-surface)', padding: '6px', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--border-lead)', boxShadow: '2px 2px 0px 0px #2d2d2d' }}>
              <button
                onClick={() => onNavigate && pageIndex > 0 && onNavigate(pageIndex - 1)}
                disabled={pageIndex <= 0}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.95rem' }}
                title="Hoja Anterior (Flecha Izquierda)"
              >
                <ChevronLeft size={18} /> {t('studio.prev')}
              </button>
              
              <span className="stamp-badge" style={{
                background: 'var(--accent-red)',
                color: '#ffffff',
                padding: '4px 14px',
                fontSize: '1rem'
              }}>
                {t('studio.sheetCounter', { current: pageIndex + 1, total: totalCount })}
              </span>

              <button
                onClick={() => onNavigate && pageIndex < totalCount - 1 && onNavigate(pageIndex + 1)}
                disabled={pageIndex >= totalCount - 1}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.95rem' }}
                title="Hoja Siguiente (Flecha Derecha)"
              >
                {t('studio.next')} <ChevronRight size={18} />
              </button>
            </div>

            <h3 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'Kalam, cursive' }}>{t('studio.title')}</h3>
            {isApplying && (
              <span style={{ fontSize: '0.95rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontFamily: 'Patrick Hand, cursive' }}>
                <RefreshCcw size={16} className="animate-spin" /> {t('studio.syncing')}
              </span>
            )}
          </div>

          {/* Zoom Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px' }}
              title={t('studio.zoomOut')}
            >
              <ZoomOut size={18} />
            </button>
            <span style={{ fontSize: '1.1rem', width: '60px', textAlign: 'center', fontWeight: 700, fontFamily: 'Kalam, cursive' }}>{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px' }}
              title={t('studio.zoomIn')}
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={() => setZoom(1.0)} 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '0.95rem' }}
              title={t('studio.fit')}
            >
              <Maximize2 size={18} /> {t('studio.fit')}
            </button>
          </div>
        </div>

        {/* Canvas Image Area - Drafting Table */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: 'radial-gradient(circle at center, #3d3d3d 0%, #1e1e1e 100%)',
          position: 'relative'
        }}>
          {/* Floating Left Arrow */}
          {pageIndex > 0 && (
            <button
              onClick={() => onNavigate && onNavigate(pageIndex - 1)}
              className="btn btn-secondary"
              style={{
                position: 'absolute',
                left: '28px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px 0px #111111',
                zIndex: 10,
                background: 'var(--bg-surface)'
              }}
              title="Anterior (Flecha Izquierda)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Polaroid Container around Image */}
          <div className="paper-card" style={{ padding: '16px', background: '#ffffff', border: '3px solid var(--border-lead)', boxShadow: '10px 10px 0px 0px #111111' }}>
            <img 
              src={`${API_BASE}${previewUrl}`} 
              alt="Hoja en previsualización" 
              style={{
                maxHeight: '78vh',
                maxWidth: '75vw',
                filter: cssFilter,
                transform: cssTransform,
                transformOrigin: 'center center',
                transition: isApplying ? 'none' : 'transform 0.15s ease, filter 0.05s ease',
                display: 'block'
              }}
            />
          </div>

          {/* Floating Right Arrow */}
          {pageIndex < totalCount - 1 && (
            <button
              onClick={() => onNavigate && onNavigate(pageIndex + 1)}
              className="btn btn-secondary"
              style={{
                position: 'absolute',
                right: '28px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px 0px #111111',
                zIndex: 10,
                background: 'var(--bg-surface)'
              }}
              title="Siguiente (Flecha Derecha)"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      </div>

      {/* Right Inspector Panel - Sketchbook Notes */}
      <aside className="paper-card-thick studio-modal-aside">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '1.4rem', fontFamily: 'Kalam, cursive' }}>{t('studio.opticalParams')}</h4>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px' }} title={t('modal.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Page Metadata Box */}
        <div className="postit-card" style={{
          padding: '14px',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          transform: 'rotate(1deg)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>{t('studio.captureRes')}</span>
            <strong style={{ fontFamily: 'Kalam, cursive' }}>{page.dpi} DPI</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>{t('studio.physDim')}</span>
            <strong style={{ fontFamily: 'Kalam, cursive' }}>{page.width} × {page.height} px</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('studio.cacheWeight')}</span>
            <strong style={{ color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>{page.size_kb} KB</strong>
          </div>
        </div>

        {/* 1. Rotation Controls */}
        <div>
          <label style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <RotateCw size={18} color="var(--accent-red)" /> {t('studio.rotationLabel')} ({rotation}°)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
            <button onClick={() => handleRotate(90)} className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '8px' }}>
              +90° CW
            </button>
            <button onClick={() => handleRotate(180)} className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '8px' }}>
              +180°
            </button>
            <button onClick={() => handleRotate(270)} className="btn btn-secondary" style={{ fontSize: '0.95rem', padding: '8px' }}>
              +270°
            </button>
          </div>
        </div>

        {/* 2. Brightness Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sun size={18} color="var(--accent-blue)" /> {t('studio.brightnessLabel')}</span>
            <strong style={{ color: brightness !== 0 ? 'var(--accent-red)' : 'inherit', fontFamily: 'Kalam, cursive', fontSize: '1.15rem' }}>{brightness > 0 ? `+${brightness}` : brightness}</strong>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Contrast size={18} color="var(--accent-blue)" /> {t('studio.contrastLabel')}</span>
            <strong style={{ color: contrast !== 0 ? 'var(--accent-red)' : 'inherit', fontFamily: 'Kalam, cursive', fontSize: '1.15rem' }}>{contrast > 0 ? `+${contrast}` : contrast}</strong>
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
        <div className="paper-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px',
          background: bwFilter ? 'var(--bg-postit)' : 'var(--bg-surface)',
          cursor: 'pointer'
        }} onClick={() => setBwFilter(!bwFilter)}>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, display: 'block', fontFamily: 'Kalam, cursive' }}>{t('studio.bwLabel')}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('studio.bwSub')}</span>
          </div>
          <div className={`wobbly-checkbox ${bwFilter ? 'checked' : ''}`}>
            {bwFilter && <Check size={18} strokeWidth={3.5} color="#ffffff" />}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '14px', background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontSize: '1.25rem', fontWeight: 700, boxShadow: '4px 4px 0px 0px #2d2d2d' }}>
            <Check size={22} />
            {t('studio.confirmSave')}
          </button>
          <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '1rem' }}>
            <RefreshCcw size={16} />
            {t('studio.resetValues')}
          </button>
        </div>
      </aside>
    </div>
  );
}
