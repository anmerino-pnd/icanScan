import React, { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FileImage, 
  FolderOpen, 
  Download, 
  Trash2, 
  Scissors, 
  Image as ImageIcon, 
  Layers, 
  FileText, 
  FileSpreadsheet,
  Presentation,
  RotateCw,
  Sparkles, 
  ArrowLeft,
  GripVertical,
  Check,
  Eye,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import SketchSelect from './SketchSelect';

// --- Interactive Lightbox Modal for Page Inspection ---
function PageLightboxModal({ imageInfo, onClose, onNavigate }) {
  const [zoom, setZoom] = useState(1.0);

  if (!imageInfo) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(30, 30, 30, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        padding: '24px',
        animation: 'modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card-thick" style={{
        maxWidth: '92vw',
        maxHeight: '92vh',
        width: '780px',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflow: 'hidden',
        boxShadow: '8px 8px 0px 0px #1a1a1a'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '12px 20px',
          background: '#f4f1ea',
          borderBottom: '2.5px solid var(--border-lead)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="stamp-badge" style={{ background: 'var(--accent-red)', color: '#ffffff', fontSize: '0.9rem' }}>
              {imageInfo.title || 'Vista Previa'}
            </span>
            {imageInfo.subtitle && (
              <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.15rem', fontWeight: 600 }}>
                {imageInfo.subtitle}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Alejar zoom"
            >
              <span className="icon-centered"><ZoomOut size={16} /></span> Alejar
            </button>
            <span style={{ fontFamily: 'Kalam, cursive', fontSize: '1rem', width: '50px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(3.0, z + 0.25))} 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Acercar zoom"
            >
              <span className="icon-centered"><ZoomIn size={16} /></span> Acercar
            </button>
            <button 
              onClick={onClose} 
              className="btn btn-danger" 
              style={{ padding: '4px 10px', fontSize: '0.9rem', marginLeft: '8px', display: 'inline-flex', alignItems: 'center' }}
              title="Cerrar vista previa"
            >
              <span className="icon-centered"><X size={18} /></span>
            </button>
          </div>
        </div>

        {/* High Res Image View Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          background: '#e5e0d8',
          padding: '24px',
          overflow: 'auto',
          minHeight: '380px',
          maxHeight: '70vh'
        }}>
          <img 
            src={imageInfo.url} 
            alt={imageInfo.title || 'Vista previa'} 
            style={{
              maxWidth: zoom === 1 ? '100%' : 'none',
              maxHeight: zoom === 1 ? '100%' : 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.25)',
              background: '#ffffff',
              border: '2.5px solid var(--border-lead)'
            }}
          />
        </div>

        {/* Footer Navigation Controls */}
        {onNavigate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '10px 20px',
            background: '#ffffff',
            borderTop: '2px solid var(--border-lead)'
          }}>
            <button 
              onClick={() => onNavigate(-1)} 
              className="btn btn-secondary"
              style={{ fontSize: '1rem', padding: '6px 14px' }}
            >
              ← Anterior
            </button>

            <span style={{ fontFamily: 'Kalam, cursive', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Haz clic fuera o presiona ESC para salir
            </span>

            <button 
              onClick={() => onNavigate(1)} 
              className="btn btn-secondary"
              style={{ fontSize: '1rem', padding: '6px 14px' }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper to parse range spec like "1-3, 4, 5-10" into list of page ranges ---
function parseRangeSpec(specStr, totalPages) {
  if (!specStr || specStr.trim().toLowerCase() === 'todas' || specStr.trim().toLowerCase() === 'all') {
    if (!totalPages || totalPages <= 0) return [{ label: '1 - Total', pages: [1] }];
    return Array.from({ length: totalPages }, (_, i) => ({
      label: `Página ${i + 1}`,
      pages: [i + 1]
    }));
  }

  const parts = specStr.split(',').map(p => p.trim()).filter(Boolean);
  const groups = [];

  parts.forEach((part) => {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        if (start > end) [start, end] = [end, start];
        if (totalPages) {
          start = Math.max(1, Math.min(start, totalPages));
          end = Math.max(1, Math.min(end, totalPages));
        }
        const pageNums = [];
        for (let i = start; i <= end; i++) pageNums.push(i);
        groups.push({
          label: `Páginas ${start} a ${end}`,
          pages: pageNums
        });
      }
    } else {
      let pageNum = parseInt(part, 10);
      if (!isNaN(pageNum)) {
        if (totalPages) pageNum = Math.max(1, Math.min(pageNum, totalPages));
        groups.push({
          label: `Página ${pageNum}`,
          pages: [pageNum]
        });
      }
    }
  });

  return groups;
}

// --- Helper to parse range string like "1, 3, 5-9, 10" or "todas"/"all" into page numbers array ---
function parseExtractPageNums(specStr, totalPages) {
  if (!specStr || specStr.trim().toLowerCase() === 'todas' || specStr.trim().toLowerCase() === 'all') {
    if (!totalPages || totalPages <= 0) return [];
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pageNumsSet = new Set();
  const parts = specStr.split(',').map(p => p.trim()).filter(Boolean);
  parts.forEach(part => {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        if (start > end) [start, end] = [end, start];
        if (totalPages) {
          start = Math.max(1, Math.min(start, totalPages));
          end = Math.max(1, Math.min(end, totalPages));
        }
        for (let i = start; i <= end; i++) pageNumsSet.add(i);
      }
    } else {
      let p = parseInt(part, 10);
      if (!isNaN(p)) {
        if (totalPages) p = Math.max(1, Math.min(p, totalPages));
        pageNumsSet.add(p);
      }
    }
  });
  return Array.from(pageNumsSet).sort((a, b) => a - b);
}

// --- Sortable Item component for PDF Page Reordering ---
function SortablePdfPageCard({ page, index, onRotate, onDelete, onInspect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 1
  };

  const API_BASE = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : "http://127.0.0.1:8000";

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '2px solid var(--border-lead)',
        borderRadius: 'var(--wobbly-sm)',
        boxShadow: isDragging ? '6px 6px 0px 0px #2d2d2d' : '3px 3px 0px 0px #2d2d2d',
        overflow: 'hidden'
      }} 
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '8px 12px',
        background: '#f4f1ea',
        borderBottom: '2px solid var(--border-lead)'
      }}>
        <button 
          {...attributes} 
          {...listeners}
          style={{ background: 'transparent', border: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Arrastrar para reordenar página"
        >
          <span className="icon-centered"><GripVertical size={20} color="var(--text-primary)" /></span>
        </button>
        <span className="stamp-badge" style={{ background: 'var(--accent-red)', color: '#ffffff', fontSize: '0.85rem', padding: '2px 8px' }}>
          Pág #{index + 1}
        </span>
        {page.rotation > 0 && (
          <span style={{ fontSize: '0.8rem', background: 'var(--accent-blue)', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontFamily: 'Kalam, cursive' }}>
            {page.rotation}°
          </span>
        )}
      </div>

      <div 
        onClick={() => onInspect(`${API_BASE}${page.url}`, `Página #${index + 1}`)}
        style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          background: '#e5e0d8',
          padding: '10px',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        title="Haz clic para inspeccionar en grande"
      >
        <img 
          src={`${API_BASE}${page.url}`} 
          alt={`Página ${page.page_num}`}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
            transform: `rotate(${page.rotation}deg)`,
            transition: 'transform 0.2s ease',
            background: '#ffffff'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#ffffff', borderTop: '2px solid var(--border-lead)' }}>
        <button 
          onClick={() => onRotate(page.id, 90)}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          title="Rotar 90° en sentido horario"
        >
          <span className="icon-centered"><RotateCw size={16} /></span> +90°
        </button>
        <button 
          onClick={() => onDelete(page.id)}
          className="btn btn-danger"
          style={{ padding: '4px 10px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          title="Eliminar esta página"
        >
          <span className="icon-centered"><Trash2 size={16} /></span>
        </button>
      </div>
    </div>
  );
}

// --- Sortable Item component for Images to PDF List ---
function SortableImageItem({ item, index, onDelete, onInspect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  };

  const filename = item.path.split(/[/\\]/).pop();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        padding: '10px 16px',
        background: '#ffffff',
        border: '2px solid var(--border-lead)',
        borderRadius: 'var(--wobbly-sm)',
        boxShadow: isDragging ? '4px 4px 0px 0px #2d2d2d' : '2px 2px 0px 0px #2d2d2d',
        marginBottom: '12px',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
        <button 
          {...attributes} 
          {...listeners} 
          style={{ background: 'transparent', border: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Arrastrar para reordenar esta imagen"
        >
          <span className="icon-centered"><GripVertical size={24} color="var(--text-primary)" /></span>
        </button>

        <span className="stamp-badge" style={{ background: 'var(--accent-blue)', color: '#ffffff', padding: '3px 8px', fontSize: '0.9rem', flexShrink: 0 }}>
          Foto #{index + 1}
        </span>

        {/* Thumbnail Preview Box */}
        <div 
          onClick={() => item.previewUrl && onInspect(item.previewUrl, filename)}
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '6px',
            border: '1px solid var(--border-lead)',
            overflow: 'hidden',
            background: '#e5e0d8',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0,
            cursor: item.previewUrl ? 'pointer' : 'default'
          }}
          title={item.previewUrl ? 'Haz clic para ampliar en grande' : filename}
        >
          {item.previewUrl ? (
            <img src={item.previewUrl} alt={filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span className="icon-centered"><ImageIcon size={26} color="var(--text-secondary)" /></span>
          )}
        </div>

        <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.2rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {filename}
        </span>
      </div>

      <button 
        onClick={() => onDelete(item.id)} 
        className="btn btn-danger" 
        style={{ padding: '6px 12px', fontSize: '0.95rem', flexShrink: 0, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        title="Quitar esta imagen"
      >
        <span className="icon-centered"><Trash2 size={18} /></span>
      </button>
    </div>
  );
}

// --- Sortable Item component for Merge PDFs List ---
function SortablePdfItem({ item, index, onDelete, apiBase, onInspect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1
  };

  const filename = item.path.split(/[/\\]/).pop();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px',
        background: '#ffffff',
        border: '2px solid var(--border-lead)',
        borderRadius: 'var(--wobbly-sm)',
        boxShadow: isDragging ? '4px 4px 0px 0px #2d2d2d' : '2px 2px 0px 0px #2d2d2d',
        marginBottom: '12px',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
          <button 
            {...attributes} 
            {...listeners} 
            style={{ background: 'transparent', border: 'none', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Arrastrar para reordenar este documento PDF"
          >
            <span className="icon-centered"><GripVertical size={24} color="var(--text-primary)" /></span>
          </button>

          <span className="stamp-badge" style={{ background: '#4f46e5', color: '#ffffff', padding: '3px 8px', fontSize: '0.9rem', flexShrink: 0 }}>
            Doc #{index + 1}
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.25rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filename}
            </span>
            {item.pageCount && (
              <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                {item.pageCount} página(s)
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={() => onDelete(item.id)} 
          className="btn btn-danger" 
          style={{ padding: '6px 12px', fontSize: '0.95rem', flexShrink: 0, marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          title="Quitar este documento PDF"
        >
          <span className="icon-centered"><Trash2 size={18} /></span>
        </button>
      </div>

      {/* Visual Page Thumbnails Horizontal Preview Strip */}
      {item.pages && item.pages.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px 0', borderTop: '1px dashed var(--bg-muted)' }}>
          {item.pages.slice(0, 12).map((pg, pIdx) => (
            <div 
              key={pIdx} 
              onClick={() => onInspect(`${apiBase}${pg.url}`, `${filename} — Pág ${pg.page_num}`)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
              title="Haz clic para inspeccionar en grande"
            >
              <div style={{ width: '42px', height: '56px', borderRadius: '4px', border: '1px solid var(--border-lead)', overflow: 'hidden', background: '#e5e0d8' }}>
                <img src={`${apiBase}${pg.url}`} alt={`Pág ${pg.page_num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontSize: '0.7rem', fontFamily: 'Patrick Hand, cursive', color: 'var(--text-secondary)' }}>P.{pg.page_num}</span>
            </div>
          ))}
          {item.pages.length > 12 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', background: 'var(--bg-muted)', padding: '0 10px', borderRadius: '4px', border: '1px solid var(--border-lead)', flexShrink: 0, fontFamily: 'Kalam, cursive' }}>
              +{item.pages.length - 12}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PdfToolsView({ onShowModal }) {
  const { t, lang } = useLanguage();
  const [activeTool, setActiveTool] = useState(null);

  // Lightbox Modal state for high-res preview inspection
  const [lightboxImage, setLightboxImage] = useState(null);

  // Tool 1: Reorder & Rotate
  const [reorderPdfPath, setReorderPdfPath] = useState('');
  const [reorderPages, setReorderPages] = useState([]);
  const [reorderOutputName, setReorderOutputName] = useState('Documento_Reordenado.pdf');
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [savingReorder, setSavingReorder] = useState(false);
  const [reorderResultUrl, setReorderResultUrl] = useState('');

  // Tool 2: Format Conversions
  const [convertMode, setConvertMode] = useState('pdf_to_word');
  const [convertSourcePath, setConvertSourcePath] = useState('');
  const [convertOutputName, setConvertOutputName] = useState('Documento_Convertido');
  const [convertingFormat, setConvertingFormat] = useState(false);
  const [convertResult, setConvertResult] = useState(null);

  // Tool 3: Extract Images
  const [extractPdfPath, setExtractPdfPath] = useState('');
  const [extractPdfInfo, setExtractPdfInfo] = useState(null);
  const [extractPdfThumbnails, setExtractPdfThumbnails] = useState([]);
  const [extractRange, setExtractRange] = useState('todas');
  const [extractFormat, setExtractFormat] = useState('PNG');
  const [extractDpi, setExtractDpi] = useState(300);
  const [extracting, setExtracting] = useState(false);
  const [extractZipUrl, setExtractZipUrl] = useState('');

  // Tool 4: Images to PDF
  const [selectedImages, setSelectedImages] = useState([]); // [{id, path, previewUrl}]
  const [outputPdfName, setOutputPdfName] = useState('Imagenes_Unidas.pdf');
  const [convertingImages, setConvertingImages] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState('');

  // Tool 5: Split PDF
  const [splitPdfPath, setSplitPdfPath] = useState('');
  const [splitPdfInfo, setSplitPdfInfo] = useState(null);
  const [splitRanges, setSplitRanges] = useState('1-3, 4, 5-10');
  const [splitThumbnails, setSplitThumbnails] = useState([]);
  const [splitting, setSplitting] = useState(false);
  const [splitZipUrl, setSplitZipUrl] = useState('');

  // Tool 6: Merge PDFs
  const [selectedMergePdfs, setSelectedMergePdfs] = useState([]); // [{id, path, pages}]
  const [mergeOutputName, setMergeOutputName] = useState('Documentos_Combinados.pdf');
  const [merging, setMerging] = useState(false);
  const [mergedResult, setMergedResult] = useState(null);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol.startsWith('http')
    ? window.location.origin
    : "http://127.0.0.1:8000";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Dynamic i18n Range Sync Effect
  useEffect(() => {
    if (extractRange === 'todas' || extractRange === 'all') {
      setExtractRange(t('tools.allDefault'));
    }
  }, [lang]);

  const openLightbox = (url, title = '', subtitle = '') => {
    setLightboxImage({ url, title, subtitle });
  };

  const fetchPdfInfo = async (path, setInfoFn) => {
    if (!path) { setInfoFn(null); return; }
    try {
      const res = await fetch(`${API_BASE}/api/tools/pdf-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_path: path })
      });
      if (res.ok) {
        const data = await res.json();
        setInfoFn(data.info || null);
      }
    } catch (err) { console.error(err); }
  };

  const loadExtractPdf = async (pdfPath) => {
    setExtractPdfPath(pdfPath);
    setExtractZipUrl('');
    fetchPdfInfo(pdfPath, setExtractPdfInfo);
    try {
      const res = await fetch(`${API_BASE}/api/tools/pdf-thumbnails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_path: pdfPath })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractPdfThumbnails(data.pages || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleWebUpload = async (fileList, onPathsReady, onInfoDictReady) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const directPaths = files.map(f => f.path).filter(Boolean);
    if (directPaths.length === files.length) {
      onPathsReady(directPaths);
      if (directPaths[0] && directPaths[0].toLowerCase().endsWith('.pdf') && onInfoDictReady) {
        fetchPdfInfo(directPaths[0], onInfoDictReady);
      }
      return;
    }
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      const res = await fetch(`${API_BASE}/api/tools/upload-temp`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paths && data.paths.length > 0) {
          onPathsReady(data.paths);
          if (onInfoDictReady && data.info_dict && data.paths[0]) {
            onInfoDictReady(data.info_dict[data.paths[0]] || null);
          }
        }
      }
    } catch (err) { console.error(err); }
  };

  // Reorder & Rotate Handlers
  const handleSelectReorderPdf = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) loadReorderPdf(paths[0]);
      } catch (err) { console.error(err); }
    } else {
      document.getElementById("reorder-pdf-input").click();
    }
  };

  const loadReorderPdf = async (pdfPath) => {
    setReorderPdfPath(pdfPath);
    setReorderResultUrl('');
    setLoadingReorder(true);
    try {
      const res = await fetch(`${API_BASE}/api/tools/pdf-thumbnails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_path: pdfPath })
      });
      if (res.ok) {
        const data = await res.json();
        setReorderPages(data.pages || []);
      }
    } catch (err) { console.error(err); } finally { setLoadingReorder(false); }
  };

  const handleReorderDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setReorderPages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRotatePage = (pageId, degrees) => {
    setReorderPages(prev => prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + degrees) % 360 } : p));
  };

  const handleDeleteReorderPage = (pageId) => {
    setReorderPages(prev => prev.filter(p => p.id !== pageId));
  };

  const handleSaveReorderedPdf = async () => {
    if (reorderPages.length === 0) return;
    setSavingReorder(true);
    try {
      const res = await fetch(`${API_BASE}/api/tools/reorder-rotate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_path: reorderPdfPath,
          page_items: reorderPages.map(p => ({ original_index: p.original_index, rotation: p.rotation })),
          output_filename: reorderOutputName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReorderResultUrl(data.url);
        if (onShowModal) onShowModal({ title: "PDF Generado Exitosamente", message: `Se reordenaron y rotaron ${reorderPages.length} página(s) correctamente.` });
      }
    } catch (err) { console.error(err); } finally { setSavingReorder(false); }
  };

  // Split PDF Load Thumbnails
  const loadSplitPdf = async (pdfPath) => {
    setSplitPdfPath(pdfPath);
    setSplitZipUrl('');
    fetchPdfInfo(pdfPath, setSplitPdfInfo);
    try {
      const res = await fetch(`${API_BASE}/api/tools/pdf-thumbnails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_path: pdfPath })
      });
      if (res.ok) {
        const data = await res.json();
        setSplitThumbnails(data.pages || []);
      }
    } catch (err) { console.error(err); }
  };

  // Format Conversion Handlers
  const handleSelectConvertSource = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) { setConvertSourcePath(paths[0]); setConvertResult(null); }
      } catch (err) { console.error(err); }
    } else {
      document.getElementById("convert-source-input").click();
    }
  };

  const handleRunConversion = async () => {
    if (!convertSourcePath) return;
    setConvertingFormat(true);
    setConvertResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/tools/convert-format`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_path: convertSourcePath,
          conversion_type: convertMode,
          output_filename: convertOutputName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConvertResult(data);
      }
    } catch (err) { console.error(err); } finally { setConvertingFormat(false); }
  };

  const handleDownloadOutput = async (url, filename) => {
    const saveFn = window.electronAPI?.saveFileDialog || window.pywebview?.api?.save_file_dialog;
    if (saveFn) {
      try {
        const chosenPath = await saveFn(filename);
        if (chosenPath) {
          const res = await fetch(`${API_BASE}/api/tools/save-to-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_url: url, target_path: chosenPath })
          });
          if (res.ok && onShowModal) {
            onShowModal({ title: "Guardado Exitoso", message: `El archivo ha sido guardado en:\n${chosenPath}` });
          }
        }
        return;
      } catch (err) { console.error(err); }
    }

    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) { console.error(err); }
  };

  const addPdfToMergeList = async (paths) => {
    for (const p of paths) {
      let thumbUrl = null;
      let pageCount = null;
      let pages = [];
      try {
        const res = await fetch(`${API_BASE}/api/tools/pdf-thumbnails`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf_path: p })
        });
        if (res.ok) {
          const data = await res.json();
          pages = data.pages || [];
          if (pages.length > 0) {
            thumbUrl = `${API_BASE}${pages[0].url}`;
            pageCount = pages.length;
          }
        }
      } catch (err) { console.error(err); }
      setSelectedMergePdfs(prev => [...prev, {
        id: `pdf_${Date.now()}_${Math.random()}`,
        path: p,
        thumbUrl,
        pageCount,
        pages
      }]);
    }
  };

  const addImageToUnionList = (paths) => {
    const newItems = paths.map(p => ({
      id: `img_${Date.now()}_${Math.random()}`,
      path: p,
      previewUrl: p.startsWith('http') || p.startsWith('blob:') ? p : null
    }));
    setSelectedImages(prev => [...prev, ...newItems]);
  };

  const handleSelectImagesForUnion = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) addImageToUnionList(paths);
      } catch (e) { console.error(e); }
    } else {
      document.getElementById("img-to-pdf-input").click();
    }
  };

  const handleSelectPdfsForMerge = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) addPdfToMergeList(paths);
      } catch (e) { console.error(e); }
    } else {
      document.getElementById("merge-pdf-input").click();
    }
  };

  // Memoized page numbers for Extract Images visual thumbnail gallery
  const selectedExtractPageNums = useMemo(() => {
    return parseExtractPageNums(extractRange, extractPdfInfo?.page_count || extractPdfThumbnails.length);
  }, [extractRange, extractPdfInfo, extractPdfThumbnails]);

  const toolCards = [
    {
      id: 'reorder_rotate',
      title: t('tools.reorderTitle'),
      badge: t('tools.reorderBadge'),
      icon: RotateCw,
      accentColor: '#ff4d4d',
      bgLight: '#fff5f5',
      desc: t('tools.reorderDesc')
    },
    {
      id: 'convert_word',
      title: t('tools.wordTitle'),
      badge: t('tools.wordBadge'),
      icon: FileText,
      accentColor: '#2d5da1',
      bgLight: '#f0f5ff',
      desc: t('tools.wordDesc')
    },
    {
      id: 'convert_excel',
      title: t('tools.excelTitle'),
      badge: t('tools.excelBadge'),
      icon: FileSpreadsheet,
      accentColor: '#16a34a',
      bgLight: '#f0fdf4',
      desc: t('tools.excelDesc')
    },
    {
      id: 'convert_pptx',
      title: t('tools.pptxTitle'),
      badge: t('tools.pptxBadge'),
      icon: Presentation,
      accentColor: '#f59e0b',
      bgLight: '#fffbe6',
      desc: t('tools.pptxDesc')
    },
    {
      id: 'extract_img',
      title: t('tools.extractTitle'),
      badge: t('tools.extractBadge'),
      icon: FileImage,
      accentColor: '#8b5cf6',
      bgLight: '#f5f3ff',
      desc: t('tools.extractDesc')
    },
    {
      id: 'images_to_pdf',
      title: t('tools.unionTitle'),
      badge: t('tools.unionBadge'),
      icon: ImageIcon,
      accentColor: '#0d9488',
      bgLight: '#f0fdfa',
      desc: t('tools.unionDesc')
    },
    {
      id: 'split_pdf',
      title: t('tools.splitTitle'),
      badge: t('tools.splitBadge'),
      icon: Scissors,
      accentColor: '#e11d48',
      bgLight: '#fff1f2',
      desc: t('tools.splitDesc')
    },
    {
      id: 'merge_pdfs',
      title: t('tools.mergeTitle'),
      badge: t('tools.mergeBadge'),
      icon: Layers,
      accentColor: '#4f46e5',
      bgLight: '#eeefeb',
      desc: t('tools.mergeDesc')
    }
  ];

  return (
    <div style={{ padding: '24px', width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg-paper)', boxSizing: 'border-box' }}>
      {/* Lightbox Modal for High-Res Inspection */}
      {lightboxImage && (
        <PageLightboxModal 
          imageInfo={lightboxImage} 
          onClose={() => setLightboxImage(null)} 
        />
      )}

      {/* Hidden File Inputs for Web Mode Fallback */}
      <input id="reorder-pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (p) => loadReorderPdf(p[0]))} />
      <input id="convert-source-input" type="file" accept="*/*" style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (p) => setConvertSourcePath(p[0]))} />
      <input id="extract-pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (p) => loadExtractPdf(p[0]))} />
      <input id="split-pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (p) => loadSplitPdf(p[0]))} />
      <input id="img-to-pdf-input" type="file" accept=".png,.jpg,.jpeg" multiple style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (paths) => addImageToUnionList(paths))} />
      <input id="merge-pdf-input" type="file" accept=".pdf" multiple style={{ display: 'none' }} onChange={(e) => handleWebUpload(e.target.files, (paths) => addPdfToMergeList(paths))} />

      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
        <div>
          <h2 style={{ fontFamily: 'Kalam, cursive', fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="icon-centered"><Sparkles size={32} color="var(--accent-red)" /></span>
            {t('tools.title')}
          </h2>
          <p style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.25rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {t('tools.subtitle')}
          </p>
        </div>

        {activeTool && (
          <button 
            onClick={() => setActiveTool(null)}
            className="btn btn-amber"
            style={{ padding: '10px 20px', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span className="icon-centered"><ArrowLeft size={22} /></span> {t('tools.backBtn')}
          </button>
        )}
      </div>

      {/* ================= VIEW 1: TOOL CATALOG DASHBOARD GRID ================= */}
      {!activeTool && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '24px', width: '100%' }}>
          {toolCards.map((card) => {
            const IconComp = card.icon;
            return (
              <div 
                key={card.id}
                onClick={() => {
                  setActiveTool(card.id);
                  setConvertSourcePath('');
                  setConvertResult(null);
                  if (card.id === 'convert_word') setConvertMode('pdf_to_word');
                  if (card.id === 'convert_excel') setConvertMode('pdf_to_excel');
                  if (card.id === 'convert_pptx') setConvertMode('pdf_to_pptx');
                }}
                className="paper-card-thick tool-card-item"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  background: card.bgLight,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  border: '3px solid var(--border-lead)',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) rotate(0.5deg)';
                  e.currentTarget.style.boxShadow = '8px 8px 0px 0px #2d2d2d';
                  const btn = e.currentTarget.querySelector('.tool-card-btn');
                  if (btn) {
                    btn.style.background = card.accentColor;
                    btn.style.color = '#ffffff';
                    btn.style.transform = 'scale(1.04)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  const btn = e.currentTarget.querySelector('.tool-card-btn');
                  if (btn) {
                    btn.style.background = '#ffffff';
                    btn.style.color = 'var(--text-primary)';
                    btn.style.transform = 'scale(1)';
                  }
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      minWidth: '64px',
                      minHeight: '64px',
                      borderRadius: 'var(--wobbly-sm)',
                      background: '#ffffff',
                      border: '3px solid var(--border-lead)',
                      boxShadow: '3px 3px 0px 0px #2d2d2d',
                      display: 'grid',
                      placeItems: 'center',
                      boxSizing: 'border-box',
                      flexShrink: 0
                    }}>
                      <IconComp 
                        size={36} 
                        color={card.accentColor} 
                        className="icon-geo-centered" 
                        style={{ display: 'block', width: '36px', height: '36px', margin: 0, padding: 0 }} 
                      />
                    </div>
                    <span className="stamp-badge" style={{ background: card.accentColor, color: '#ffffff', fontSize: '0.85rem', padding: '4px 10px' }}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'Kalam, cursive', fontSize: '1.6rem', margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                    {card.title}
                  </h3>

                  <p style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="btn tool-card-btn" style={{ padding: '8px 18px', fontSize: '1.1rem', background: '#ffffff', transition: 'all 0.15s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {t('tools.openToolBtn')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= VIEW 2: TOOL 1 - REORDER & ROTATE PDF ================= */}
      {activeTool === 'reorder_rotate' && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />
          <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px' }}>
            <span className="icon-centered"><RotateCw size={32} color="var(--accent-red)" /></span>
            {t('tools.reorderTitle')}
          </h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('tools.reorderDesc')}
          </p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleSelectReorderPdf} className="btn btn-amber" style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="icon-centered"><FolderOpen size={24} /></span> {reorderPdfPath ? t('tools.changePdfBtn') : t('tools.selectPdfBtn')}
            </button>

            {reorderPdfPath && (
              <span style={{ fontSize: '1.15rem', background: '#f4f1ea', padding: '8px 14px', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--border-lead)', fontWeight: 600 }}>
                {reorderPdfPath.split(/[/\\]/).pop()} ({reorderPages.length} {t('tools.pagesCount', { count: reorderPages.length })})
              </span>
            )}
          </div>

          {loadingReorder && (
            <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.3rem', fontFamily: 'Kalam, cursive' }}>
              Cargando vistas previas de páginas del PDF...
            </div>
          )}

          {reorderPages.length > 0 && !loadingReorder && (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorderDragEnd}>
                <SortableContext items={reorderPages.map(p => p.id)} strategy={rectSortingStrategy}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                    {reorderPages.map((page, index) => (
                      <SortablePdfPageCard 
                        key={page.id} 
                        page={page} 
                        index={index} 
                        onRotate={handleRotatePage} 
                        onDelete={handleDeleteReorderPage} 
                        onInspect={openLightbox}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#fdfbf7', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontWeight: 600, fontSize: '1.15rem' }}>{t('tools.outputNameLabel')}:</label>
                  <input 
                    type="text" 
                    value={reorderOutputName} 
                    onChange={(e) => setReorderOutputName(e.target.value)} 
                    style={{ padding: '8px 12px', fontSize: '1.1rem', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', fontFamily: 'Patrick Hand, cursive' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleSaveReorderedPdf} disabled={savingReorder} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="icon-centered"><Check size={24} /></span> {savingReorder ? 'Generando PDF...' : 'Guardar PDF Reordenado'}
                  </button>

                  {reorderResultUrl && (
                    <button onClick={() => handleDownloadOutput(reorderResultUrl, reorderOutputName)} className="btn btn-amber" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className="icon-centered"><Download size={24} /></span> {t('tools.downloadPdfBtn')}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= VIEW 3: FORMAT CONVERSIONS ================= */}
      {(activeTool === 'convert_word' || activeTool === 'convert_excel' || activeTool === 'convert_pptx') && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />

          {activeTool === 'convert_word' && (
            <>
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="icon-centered"><FileText size={32} color="var(--accent-blue)" /></span> {t('tools.wordTitle')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {t('tools.wordDesc')}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => setConvertMode('pdf_to_word')} className={`btn ${convertMode === 'pdf_to_word' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.pdfToWord')}
                </button>
                <button onClick={() => setConvertMode('word_to_pdf')} className={`btn ${convertMode === 'word_to_pdf' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.wordToPdf')}
                </button>
              </div>
            </>
          )}

          {activeTool === 'convert_excel' && (
            <>
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="icon-centered"><FileSpreadsheet size={32} color="#16a34a" /></span> {t('tools.excelTitle')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {t('tools.excelDesc')}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => setConvertMode('pdf_to_excel')} className={`btn ${convertMode === 'pdf_to_excel' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.pdfToExcel')}
                </button>
                <button onClick={() => setConvertMode('excel_to_pdf')} className={`btn ${convertMode === 'excel_to_pdf' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.excelToPdf')}
                </button>
              </div>
            </>
          )}

          {activeTool === 'convert_pptx' && (
            <>
              <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="icon-centered"><Presentation size={32} color="#f59e0b" /></span> {t('tools.pptxTitle')}
              </h3>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {t('tools.pptxDesc')}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => setConvertMode('pdf_to_pptx')} className={`btn ${convertMode === 'pdf_to_pptx' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.pdfToPptx')}
                </button>
                <button onClick={() => setConvertMode('pptx_to_pdf')} className={`btn ${convertMode === 'pptx_to_pdf' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '1.15rem' }}>
                  {t('tools.pptxToPdf')}
                </button>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#fdfbf7', padding: '24px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '1.2rem', marginBottom: '8px' }}>
                {t('tools.sourceFileLabel')}
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={handleSelectConvertSource} className="btn btn-amber" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="icon-centered"><FolderOpen size={22} /></span> {convertSourcePath ? t('tools.changeFileBtn') : t('tools.selectFileBtn')}
                </button>
              </div>

              {convertSourcePath && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '16px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', boxShadow: '3px 3px 0px 0px #2d2d2d', marginTop: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: 'var(--wobbly-sm)', background: '#f4f1ea', border: '2px solid var(--border-lead)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {convertMode.includes('excel') ? <span className="icon-centered"><FileSpreadsheet size={32} color="#16a34a" /></span> : (convertMode.includes('pptx') ? <span className="icon-centered"><Presentation size={32} color="#f59e0b" /></span> : <span className="icon-centered"><FileText size={32} color="#2d5da1" /></span>)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: 'Kalam, cursive', fontSize: '1.35rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {convertSourcePath.split(/[/\\]/).pop()}
                    </span>
                    <span style={{ fontFamily: 'Patrick Hand, cursive', fontSize: '1.05rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                      {convertSourcePath}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '1.2rem', marginBottom: '8px' }}>
                {t('tools.outputNameLabel')}
              </label>
              <input 
                type="text" 
                value={convertOutputName} 
                onChange={(e) => setConvertOutputName(e.target.value)} 
                style={{ padding: '10px 14px', fontSize: '1.15rem', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', width: '100%', maxWidth: '400px', fontFamily: 'Patrick Hand, cursive' }} 
              />
            </div>

            <div style={{ marginTop: '10px', display: 'flex', gap: '16px' }}>
              <button onClick={handleRunConversion} disabled={convertingFormat} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="icon-centered"><Sparkles size={24} /></span> {convertingFormat ? t('tools.convertingDocBtn') : t('tools.convertDocBtn')}
              </button>

              {convertResult && (
                <button onClick={() => handleDownloadOutput(convertResult.url, convertResult.filename)} className="btn btn-amber" style={{ padding: '12px 28px', fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span className="icon-centered"><Download size={24} /></span> Descargar {convertResult.filename} ({convertResult.size_mb} MB)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: EXTRACT IMAGES ================= */}
      {activeTool === 'extract_img' && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />
          <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="icon-centered"><FileImage size={32} color="#8b5cf6" /></span>
            {t('tools.extractTitle')}
          </h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('tools.extractDesc')}
          </p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => document.getElementById("extract-pdf-input").click()} className="btn btn-amber" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="icon-centered"><FolderOpen size={22} /></span> {extractPdfPath ? t('tools.changePdfBtn') : t('tools.selectPdfBtn')}
            </button>
            {extractPdfPath && (
              <span style={{ fontSize: '1.15rem', background: '#ffffff', padding: '8px 14px', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--border-lead)', fontWeight: 600 }}>
                {extractPdfPath.split(/[/\\]/).pop()} {extractPdfInfo && `(${extractPdfInfo.page_count} págs)`}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', background: '#fdfbf7', padding: '20px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('tools.rangeLabel')}</label>
              <input type="text" value={extractRange} onChange={(e) => setExtractRange(e.target.value)} placeholder={`${t('tools.allDefault')}, 1-3, 5`} style={{ padding: '8px 12px', fontSize: '1.1rem', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('tools.formatLabel')}</label>
              <SketchSelect 
                value={extractFormat} 
                onChange={(val) => setExtractFormat(val)}
                options={[
                  { value: 'PNG', label: 'PNG (Sin Pérdida / Lossless)' },
                  { value: 'JPG', label: 'JPG (Optimizado)' }
                ]}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>{t('tools.dpiLabel')}</label>
              <SketchSelect 
                value={extractDpi} 
                onChange={(val) => setExtractDpi(Number(val))}
                options={[
                  { value: 150, label: '150 DPI (Rápido)' },
                  { value: 300, label: '300 DPI (Estándar)' },
                  { value: 600, label: '600 DPI (Alta Definición)' }
                ]}
              />
            </div>
          </div>

          {/* REAL-TIME INTERACTIVE PAGE THUMBNAIL PREVIEW GALLERY */}
          {extractPdfPath && extractPdfThumbnails.length > 0 && (
            <div style={{ marginBottom: '24px', background: '#fdfbf7', padding: '20px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)' }}>
              <h4 style={{ fontFamily: 'Kalam, cursive', fontSize: '1.4rem', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="icon-centered"><Eye size={24} color="#8b5cf6" /></span>
                {t('tools.previewHeading')} — {t('tools.selectedPagesPreview', { count: selectedExtractPageNums.length })}
              </h4>

              {selectedExtractPageNums.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '14px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                  {selectedExtractPageNums.map((pNum) => {
                    const thumb = extractPdfThumbnails.find(t => t.page_num === pNum);
                    return (
                      <div 
                        key={pNum} 
                        onClick={() => thumb && openLightbox(`${API_BASE}${thumb.url}`, `Página #${pNum}`, 'Haz clic fuera para cerrar')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: '#ffffff',
                          border: '2px solid var(--border-lead)',
                          borderRadius: 'var(--wobbly-sm)',
                          padding: '8px',
                          boxShadow: '2px 2px 0px 0px #2d2d2d',
                          cursor: thumb ? 'pointer' : 'default',
                          transition: 'transform 0.12s ease'
                        }}
                        onMouseOver={(e) => thumb && (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => thumb && (e.currentTarget.style.transform = 'translateY(0)')}
                        title="Haz clic para inspeccionar esta hoja en grande"
                      >
                        <div style={{ width: '100%', height: '110px', border: '1px solid var(--border-lead)', borderRadius: '4px', overflow: 'hidden', background: '#e5e0d8', marginBottom: '6px' }}>
                          {thumb ? (
                            <img src={`${API_BASE}${thumb.url}`} alt={`Pág ${pNum}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'Kalam, cursive' }}>#{pNum}</div>
                          )}
                        </div>
                        <span className="stamp-badge" style={{ background: '#8b5cf6', color: '#ffffff', fontSize: '0.75rem', padding: '1px 6px' }}>
                          {t('tools.pageBadge', { num: pNum })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px', color: 'var(--accent-red)', fontFamily: 'Patrick Hand, cursive', fontSize: '1.1rem' }}>
                  {t('tools.noPagesSelected')}
                </div>
              )}
            </div>
          )}

          <button onClick={async () => {
            if (!extractPdfPath) return;
            setExtracting(true);
            try {
              const res = await fetch(`${API_BASE}/api/tools/extract-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf_path: extractPdfPath, page_range: extractRange, format_type: extractFormat, dpi: extractDpi })
              });
              if (res.ok) {
                const data = await res.json();
                setExtractZipUrl(data.zip_url || '');
              }
            } catch (err) { console.error(err); } finally { setExtracting(false); }
          }} disabled={extracting} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><Sparkles size={24} /></span> {extracting ? t('tools.extractingBtn') : t('tools.extractBtn')}
          </button>

          {extractZipUrl && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => handleDownloadOutput(extractZipUrl, "Imagenes_Extraidas.zip")} className="btn btn-amber" style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="icon-centered"><Download size={22} /></span> {t('tools.downloadZipBtn')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 5: IMAGES TO PDF ================= */}
      {activeTool === 'images_to_pdf' && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />
          <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="icon-centered"><ImageIcon size={32} color="#0d9488" /></span>
            {t('tools.unionTitle')}
          </h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('tools.unionDesc')}
          </p>

          <button onClick={handleSelectImagesForUnion} className="btn btn-amber" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><FolderOpen size={22} /></span> {t('tools.selectImagesBtn')}
          </button>

          {selectedImages.length > 0 && (
            <div style={{ background: '#fdfbf7', padding: '20px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontFamily: 'Kalam, cursive', fontSize: '1.4rem' }}>
                Imágenes a unir ({selectedImages.length}) — Arrastra para reordenar las hojas:
              </h4>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                const { active, over } = e;
                if (active.id !== over?.id) {
                  setSelectedImages((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                  });
                }
              }}>
                <SortableContext items={selectedImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {selectedImages.map((img, idx) => (
                      <SortableImageItem 
                        key={img.id} 
                        item={img} 
                        index={idx} 
                        onDelete={(id) => setSelectedImages(prev => prev.filter(item => item.id !== id))} 
                        onInspect={openLightbox}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          <button onClick={async () => {
            if (selectedImages.length === 0) return;
            setConvertingImages(true);
            try {
              const res = await fetch(`${API_BASE}/api/tools/images-to-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_paths: selectedImages.map(i => i.path), output_filename: outputPdfName })
              });
              if (res.ok) {
                const data = await res.json();
                setConvertedPdfUrl(data.url);
              }
            } catch (err) { console.error(err); } finally { setConvertingImages(false); }
          }} disabled={convertingImages} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><Sparkles size={24} /></span> {convertingImages ? t('tools.convertingBtn') : t('tools.convertBtn')}
          </button>

          {convertedPdfUrl && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => handleDownloadOutput(convertedPdfUrl, outputPdfName)} className="btn btn-amber" style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="icon-centered"><Download size={22} /></span> {t('tools.downloadPdfBtn')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 6: SPLIT PDF ================= */}
      {activeTool === 'split_pdf' && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />
          <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="icon-centered"><Scissors size={32} color="#e11d48" /></span>
            {t('tools.splitTitle')}
          </h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('tools.splitDesc')}
          </p>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => document.getElementById("split-pdf-input").click()} className="btn btn-amber" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span className="icon-centered"><FolderOpen size={22} /></span> {splitPdfPath ? t('tools.changePdfBtn') : t('tools.selectPdfBtn')}
            </button>
            {splitPdfPath && (
              <span style={{ fontSize: '1.15rem', background: '#ffffff', padding: '8px 14px', borderRadius: 'var(--wobbly-sm)', border: '2px solid var(--border-lead)', fontWeight: 600 }}>
                {splitPdfPath.split(/[/\\]/).pop()} {splitPdfInfo && `(${splitPdfInfo.page_count} págs)`}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '24px', background: '#fdfbf7', padding: '20px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '1.2rem', marginBottom: '8px' }}>
              {t('tools.splitRangeLabel')}
            </label>
            <input 
              type="text" 
              value={splitRanges} 
              onChange={(e) => setSplitRanges(e.target.value)} 
              placeholder="1-3, 4, 5-10" 
              style={{ padding: '10px 14px', fontSize: '1.15rem', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', width: '100%', fontFamily: 'Patrick Hand, cursive' }} 
            />
          </div>

          {/* LIVE VISUAL GROUPING PREVIEW CARDS */}
          {splitPdfPath && splitThumbnails.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ fontFamily: 'Kalam, cursive', fontSize: '1.4rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="icon-centered"><Layers size={24} color="var(--accent-red)" /></span>
                {t('tools.groupPreview')}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {parseRangeSpec(splitRanges, splitPdfInfo?.page_count || splitThumbnails.length).map((group, gIdx) => (
                  <div 
                    key={gIdx} 
                    style={{
                      background: '#ffffff',
                      border: '2px solid var(--border-lead)',
                      borderRadius: 'var(--wobbly-sm)',
                      boxShadow: '3px 3px 0px 0px #2d2d2d',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span className="stamp-badge" style={{ background: '#e11d48', color: '#ffffff', fontSize: '0.85rem' }}>
                          PDF #{gIdx + 1}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'Patrick Hand, cursive' }}>
                          {group.pages.length} hoja(s)
                        </span>
                      </div>

                      <h5 style={{ fontFamily: 'Kalam, cursive', fontSize: '1.2rem', margin: '0 0 12px 0' }}>
                        {group.label}
                      </h5>

                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {group.pages.map((pNum) => {
                          const thumb = splitThumbnails.find(t => t.page_num === pNum);
                          return (
                            <div 
                              key={pNum} 
                              onClick={() => thumb && openLightbox(`${API_BASE}${thumb.url}`, `Documento #${gIdx + 1}`, `Página ${pNum}`)}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: thumb ? 'pointer' : 'default' }}
                              title="Haz clic para inspeccionar en grande"
                            >
                              <div style={{ width: '60px', height: '80px', border: '1px solid var(--border-lead)', borderRadius: '4px', overflow: 'hidden', background: '#e5e0d8' }}>
                                {thumb ? (
                                  <img src={`${API_BASE}${thumb.url}`} alt={`Pág ${pNum}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.8rem' }}>
                                    #{pNum}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'Patrick Hand, cursive', marginTop: '2px' }}>Pág {pNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={async () => {
            if (!splitPdfPath) return;
            setSplitting(true);
            try {
              const res = await fetch(`${API_BASE}/api/tools/split-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf_path: splitPdfPath, range_spec: splitRanges })
              });
              if (res.ok) {
                const data = await res.json();
                setSplitZipUrl(data.zip_url || '');
              }
            } catch (err) { console.error(err); } finally { setSplitting(false); }
          }} disabled={splitting} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><Scissors size={24} /></span> {splitting ? t('tools.splittingBtn') : t('tools.splitBtn')}
          </button>

          {splitZipUrl && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => handleDownloadOutput(splitZipUrl, "Extractos_PDF.zip")} className="btn btn-amber" style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="icon-centered"><Download size={22} /></span> {t('tools.downloadSplitZipBtn')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 7: MERGE PDFS ================= */}
      {activeTool === 'merge_pdfs' && (
        <div className="paper-card-thick" style={{ padding: '28px', background: 'var(--bg-surface)', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div className="tack-decoration" />
          <h3 style={{ fontSize: '1.8rem', fontFamily: 'Kalam, cursive', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="icon-centered"><Layers size={32} color="#4f46e5" /></span>
            {t('tools.mergeTitle')}
          </h3>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {t('tools.mergeDesc')}
          </p>

          <button onClick={handleSelectPdfsForMerge} className="btn btn-amber" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><FolderOpen size={22} /></span> {t('tools.addMergePdfsBtn')}
          </button>

          {selectedMergePdfs.length > 0 && (
            <div style={{ background: '#fdfbf7', padding: '20px', border: '2px solid var(--border-lead)', borderRadius: 'var(--wobbly-sm)', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontFamily: 'Kalam, cursive', fontSize: '1.4rem' }}>
                Archivos PDF a combinar ({selectedMergePdfs.length}) — Arrastra para reordenar la secuencia:
              </h4>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => {
                const { active, over } = e;
                if (active.id !== over?.id) {
                  setSelectedMergePdfs((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                  });
                }
              }}>
                <SortableContext items={selectedMergePdfs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {selectedMergePdfs.map((pdf, idx) => (
                      <SortablePdfItem 
                        key={pdf.id} 
                        item={pdf} 
                        index={idx} 
                        onDelete={(id) => setSelectedMergePdfs(prev => prev.filter(item => item.id !== id))} 
                        apiBase={API_BASE}
                        onInspect={openLightbox}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          <button onClick={async () => {
            if (selectedMergePdfs.length < 2) return;
            setMerging(true);
            try {
              const res = await fetch(`${API_BASE}/api/tools/merge-pdfs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdf_paths: selectedMergePdfs.map(p => p.path), output_filename: mergeOutputName })
              });
              if (res.ok) {
                const data = await res.json();
                setMergedResult(data);
              }
            } catch (err) { console.error(err); } finally { setMerging(false); }
          }} disabled={merging} className="btn btn-primary" style={{ fontSize: '1.25rem', padding: '12px 24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="icon-centered"><Layers size={24} /></span> {merging ? t('tools.mergingBtn') : t('tools.mergeBtn')}
          </button>

          {mergedResult && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => handleDownloadOutput(mergedResult.url, mergeOutputName)} className="btn btn-amber" style={{ fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="icon-centered"><Download size={22} /></span> {t('tools.downloadMergedBtn')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
