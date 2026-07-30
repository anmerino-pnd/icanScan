import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronRight,
  AlertTriangle,
  Save,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PreviewStudioModal({ page, pageIndex, totalCount = 1, onClose, onUpdatePage, onNavigate }) {
  const { t } = useLanguage();
  const [rotation, setRotation] = useState(page.rotation || 0);
  const [brightness, setBrightness] = useState(page.brightness || 0.0);
  const [contrast, setContrast] = useState(page.contrast || 0.0);
  const [bwFilter, setBwFilter] = useState(page.bw_filter || false);
  
  const [isApplying, setIsApplying] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  // Fix 1: Discard confirmation dialog state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Fix 2: LQIP — thumbnail as instant placeholder, full-res loads in background
  const [displaySrc, setDisplaySrc] = useState(page.thumbnail_url || page.preview_url);
  const [isFullResLoaded, setIsFullResLoaded] = useState(false);

  // Sequence guard: tracks the latest request to discard stale responses (H7/Priority 4)
  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef(null);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : "http://127.0.0.1:8000";

  // Fix 1: Extract hasChanges to component level via useMemo
  const hasChanges = useMemo(() =>
    rotation !== (page.rotation || 0) ||
    brightness !== (page.brightness || 0.0) ||
    contrast !== (page.contrast || 0.0) ||
    bwFilter !== (page.bw_filter || false)
  , [rotation, brightness, contrast, bwFilter, page.rotation, page.brightness, page.contrast, page.bw_filter]);

  // Sync state whenever page changes via navigation arrows
  useEffect(() => {
    setRotation(page.rotation || 0);
    setBrightness(page.brightness || 0.0);
    setContrast(page.contrast || 0.0);
    setBwFilter(page.bw_filter || false);
    setZoom(1.0);
    setIsApplying(false);
    setShowDiscardConfirm(false);

    // Abort any in-flight /adjust request from the previous page (Priority 4 / H6)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Fix 2: LQIP — show thumbnail immediately, preload full-res in background
    const thumbUrl = page.thumbnail_url || page.preview_url;
    const fullUrl = page.preview_url;
    setDisplaySrc(thumbUrl);
    setIsFullResLoaded(false);

    const fullImg = new window.Image();
    const fullSrc = `${API_BASE}${fullUrl.includes('?') ? fullUrl : `${fullUrl}?v=${page.id}`}`;
    fullImg.src = fullSrc;
    fullImg.onload = () => {
      setDisplaySrc(fullUrl);
      setIsFullResLoaded(true);
    };

    return () => { fullImg.onload = null; };
  }, [page.id]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      // Don't navigate while discard dialog is open
      if (showDiscardConfirm) return;
      if (e.key === 'ArrowLeft' && pageIndex > 0 && onNavigate) {
        onNavigate(pageIndex - 1);
      } else if (e.key === 'ArrowRight' && pageIndex < totalCount - 1 && onNavigate) {
        onNavigate(pageIndex + 1);
      } else if (e.key === 'Escape') {
        handleCloseAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageIndex, totalCount, onNavigate, onClose, hasChanges, showDiscardConfirm]);

  const handleRotate = (deg) => {
    setRotation((prev) => (prev + deg) % 360);
  };

  const handleReset = () => {
    setRotation(page.rotation || 0);
    setBrightness(page.brightness || 0.0);
    setContrast(page.contrast || 0.0);
    setBwFilter(page.bw_filter || false);
  };

  // Fix 1: Close attempt — shows discard dialog if there are unsaved changes
  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // "Confirm & Save Sheet" — bakes adjustments via backend, then closes
  const handleConfirmSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    // Abort any previous in-flight request (Priority 4)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const thisSeq = ++requestSeqRef.current;

    setIsApplying(true);
    setShowDiscardConfirm(false);
    try {
      const response = await fetch(`${API_BASE}/api/pages/${page.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rotation,
          brightness,
          contrast,
          bw_filter: bwFilter
        }),
        signal: controller.signal
      });

      // Priority 4: Discard stale response if a newer request was sent
      if (thisSeq !== requestSeqRef.current) return;

      if (response.ok) {
        const data = await response.json();
        // Priority 3: Propagate thumbnail_url to workspace thumbnails (H3)
        onUpdatePage(page.id, {
          preview_url: data.preview_url,
          thumbnail_url: data.thumbnail_url,
          rotation: data.rotation,
          brightness: data.brightness,
          contrast: data.contrast,
          bw_filter: data.bw_filter,
          size_kb: data.size_kb
        });
        // Close modal after successful save
        onClose();
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("Error applying adjustment to disk:", err);
    } finally {
      if (thisSeq === requestSeqRef.current) {
        setIsApplying(false);
      }
    }
  };

  // CSS-only preview — rotation/filter applied ONLY via GPU CSS transforms
  // The "delta" between what's already baked in the page and the current local state
  const bakedRotation = page.rotation || 0;
  const deltaRotation = rotation - bakedRotation;
  const bakedBrightness = page.brightness || 0.0;
  const deltaBrightness = brightness - bakedBrightness;
  const bakedContrast = page.contrast || 0.0;
  const deltaContrast = contrast - bakedContrast;
  const bakedBw = page.bw_filter || false;

  const cssFilterParts = [];
  cssFilterParts.push(`brightness(${100 + deltaBrightness}%)`);
  cssFilterParts.push(`contrast(${100 + deltaContrast}%)`);
  if (bwFilter && !bakedBw) {
    cssFilterParts.push('grayscale(100%) contrast(220%)');
  }
  const cssFilter = cssFilterParts.join(' ');
  const cssTransform = `scale(${zoom}) rotate(${deltaRotation}deg)`;

  // Build image src — use LQIP displaySrc
  const resolvedSrc = (displaySrc || page.preview_url);
  const imgSrc = `${API_BASE}${resolvedSrc.includes('?') ? resolvedSrc : `${resolvedSrc}?v=${page.id}`}`;

  return (
    <div className="studio-modal-container">
      {/* Center Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: 'var(--bg-paper)',
          borderBottom: '3px solid var(--border-lead)',
          boxShadow: '0 4px 0px 0px rgba(0,0,0,0.2)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page Counter Badge */}
            <span className="stamp-badge" style={{
              background: 'var(--accent-red)',
              color: '#ffffff',
              padding: '6px 16px',
              fontSize: '1.05rem'
            }}>
              {t('studio.sheetCounter', { current: pageIndex + 1, total: totalCount })}
            </span>

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

        {/* Canvas Image Area — fixed-size container, image scales inside */}
        <div className="studio-canvas-area" style={{
          background: 'radial-gradient(circle at center, #3d3d3d 0%, #1e1e1e 100%)'
        }}>
          {/* Floating Left Arrow */}
          {pageIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onNavigate) onNavigate(pageIndex - 1);
              }}
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
                zIndex: 100,
                background: 'var(--bg-surface)',
                cursor: 'pointer'
              }}
              title="Anterior (Flecha Izquierda)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Polaroid Container around Image */}
          <div className="paper-card" style={{ padding: '16px', background: '#ffffff', border: '3px solid var(--border-lead)', boxShadow: '10px 10px 0px 0px #111111', maxWidth: '80%', maxHeight: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src={imgSrc} 
              alt="Hoja en previsualización" 
              className={isFullResLoaded ? '' : 'loading-fullres'}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: cssFilter,
                transform: cssTransform,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease, filter 0.15s ease',
                display: 'block'
              }}
            />
          </div>

          {/* Floating Right Arrow */}
          {pageIndex < totalCount - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onNavigate) onNavigate(pageIndex + 1);
              }}
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
                zIndex: 100,
                background: 'var(--bg-surface)',
                cursor: 'pointer'
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
          <button onClick={handleCloseAttempt} className="btn btn-secondary" style={{ padding: '8px' }} title={t('modal.close')}>
            <X size={20} />
          </button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasChanges && !showDiscardConfirm && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-postit)',
            borderRadius: '8px',
            border: '2px solid var(--border-lead)',
            fontSize: '0.9rem',
            fontFamily: 'Patrick Hand, cursive',
            color: 'var(--text-primary)',
            fontWeight: 600
          }}>
            <AlertTriangle size={16} color="var(--accent-red)" />
            {t('studio.unsavedChanges')}
          </div>
        )}

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
            <strong style={{ color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>{((page.size_kb || 0) / 1024).toFixed(2)} MB</strong>
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
          <button
            onClick={handleConfirmSave}
            disabled={isApplying}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontSize: '1.25rem', fontWeight: 700, boxShadow: '4px 4px 0px 0px #2d2d2d', opacity: isApplying ? 0.7 : 1 }}
          >
            {isApplying ? (
              <><RefreshCcw size={22} className="animate-spin" /> {t('studio.syncing')}</>
            ) : (
              <><Check size={22} /> {t('studio.confirmSave')}</>
            )}
          </button>
          <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '1rem' }}>
            <RefreshCcw size={16} />
            {t('studio.resetValues')}
          </button>
        </div>
      </aside>

      {/* Fix 1: Discard Confirmation Dialog Overlay */}
      {showDiscardConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 30, 30, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="paper-card-thick" style={{
            padding: '32px',
            maxWidth: '420px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: 'var(--bg-paper)',
            boxShadow: '8px 8px 0px 0px #2d2d2d',
            transform: 'rotate(-0.5deg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={28} color="var(--accent-red)" />
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Kalam, cursive', margin: 0 }}>
                {t('studio.discardTitle')}
              </h3>
            </div>

            <p style={{ fontSize: '1.05rem', fontFamily: 'Patrick Hand, cursive', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {t('studio.discardMessage')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Save & Exit */}
              <button
                onClick={handleConfirmSave}
                disabled={isApplying}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent-red)',
                  color: '#ffffff',
                  fontFamily: 'Kalam, cursive',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  boxShadow: '3px 3px 0px 0px #2d2d2d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={20} />
                {t('studio.saveAndExit')}
              </button>

              {/* Discard Changes */}
              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1.05rem',
                  fontFamily: 'Patrick Hand, cursive',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: 'var(--accent-red)'
                }}
              >
                <Trash2 size={18} />
                {t('studio.discardChanges')}
              </button>

              {/* Cancel — stay in editor */}
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  fontFamily: 'Patrick Hand, cursive'
                }}
              >
                {t('studio.cancelClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
