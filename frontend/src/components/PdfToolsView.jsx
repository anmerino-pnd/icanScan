import React, { useState } from 'react';
import { 
  FileImage, 
  FolderOpen, 
  Download, 
  Trash2, 
  Archive, 
  Scissors, 
  Image as ImageIcon, 
  Layers, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  RefreshCcw,
  Plus
} from 'lucide-react';

export default function PdfToolsView({ onShowModal }) {
  const [activeSubTab, setActiveSubTab] = useState('extract_img'); // 'extract_img', 'images_to_pdf', 'split_pdf'

  // Tab 1 State: Extract Images
  const [extractPdfPath, setExtractPdfPath] = useState('');
  const [extractRange, setExtractRange] = useState('todas');
  const [extractFormat, setExtractFormat] = useState('PNG');
  const [extractDpi, setExtractDpi] = useState(300);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [extractZipUrl, setExtractZipUrl] = useState('');

  // Tab 2 State: Images to PDF
  const [selectedImages, setSelectedImages] = useState([]);
  const [outputPdfName, setOutputPdfName] = useState('Imagenes_Unidas.pdf');
  const [converting, setConverting] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState('');
  const [convertedSizeMb, setConvertedSizeMb] = useState(0);

  // Tab 3 State: Split/Multi-Extract PDF
  const [splitPdfPath, setSplitPdfPath] = useState('');
  const [splitRanges, setSplitRanges] = useState('1-3, 4, 5-10');
  const [splitting, setSplitting] = useState(false);
  const [splitItems, setSplitItems] = useState([]);
  const [splitZipUrl, setSplitZipUrl] = useState('');

  const API_BASE = "http://localhost:8000";

  // --- Handlers for Tab 1: Extract Images ---
  const handleSelectExtractPdf = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) {
          setExtractPdfPath(paths[0]);
          setExtractedItems([]);
          setExtractZipUrl('');
        }
      } catch (err) {
        console.error("Dialog error:", err);
      }
    } else {
      document.getElementById("extract-pdf-input").click();
    }
  };

  const handleExtractSubmit = async () => {
    if (!extractPdfPath) {
      onShowModal && onShowModal({ title: "Aviso", message: "Selecciona primero un documento PDF para extraer sus páginas." });
      return;
    }
    setExtracting(true);
    setExtractedItems([]);
    try {
      const res = await fetch(`${API_BASE}/api/tools/extract-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_path: extractPdfPath,
          page_range: extractRange,
          format_type: extractFormat,
          dpi: Number(extractDpi)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExtractedItems(data.items || []);
        setExtractZipUrl(data.zip_url || '');
      } else {
        const err = await res.json();
        onShowModal && onShowModal({ title: "Error al extraer", message: err.detail || "No se pudo procesar el rango indicado." });
      }
    } catch (err) {
      console.error(err);
      onShowModal && onShowModal({ title: "Error de conexión", message: "No se pudo conectar con el motor de herramientas PDF." });
    } finally {
      setExtracting(false);
    }
  };

  // --- Handlers for Tab 2: Images to PDF ---
  const handleSelectImages = async () => {
    const openFn = window.electronAPI?.openImageDialog || window.pywebview?.api?.open_image_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) {
          setSelectedImages(prev => [...prev, ...paths]);
          setConvertedPdfUrl('');
        }
      } catch (err) {
        console.error("Image dialog error:", err);
      }
    } else {
      document.getElementById("img-to-pdf-input").click();
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImagesToPdfSubmit = async () => {
    if (selectedImages.length === 0) {
      onShowModal && onShowModal({ title: "Aviso", message: "Añade al menos una imagen (PNG o JPG) para unirla en un PDF." });
      return;
    }
    setConverting(true);
    setConvertedPdfUrl('');
    try {
      const res = await fetch(`${API_BASE}/api/tools/images-to-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_paths: selectedImages,
          output_filename: outputPdfName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setConvertedPdfUrl(data.url);
        setConvertedSizeMb(data.size_mb);
      } else {
        const err = await res.json();
        onShowModal && onShowModal({ title: "Error al convertir", message: err.detail || "No se pudo generar el PDF con las imágenes." });
      }
    } catch (err) {
      console.error(err);
      onShowModal && onShowModal({ title: "Error de conexión", message: "No se pudo comunicar con el servidor." });
    } finally {
      setConverting(false);
    }
  };

  // --- Handlers for Tab 3: Split PDF ---
  const handleSelectSplitPdf = async () => {
    const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
    if (openFn) {
      try {
        const paths = await openFn();
        if (paths && paths.length > 0) {
          setSplitPdfPath(paths[0]);
          setSplitItems([]);
          setSplitZipUrl('');
        }
      } catch (err) {
        console.error("Dialog error:", err);
      }
    } else {
      document.getElementById("split-pdf-input").click();
    }
  };

  const handleSplitSubmit = async () => {
    if (!splitPdfPath) {
      onShowModal && onShowModal({ title: "Aviso", message: "Selecciona un documento PDF para dividirlo." });
      return;
    }
    setSplitting(true);
    setSplitItems([]);
    try {
      const res = await fetch(`${API_BASE}/api/tools/split-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_path: splitPdfPath,
          range_spec: splitRanges
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSplitItems(data.items || []);
        setSplitZipUrl(data.zip_url || '');
      } else {
        const err = await res.json();
        onShowModal && onShowModal({ title: "Error al dividir", message: err.detail || "Revisa la sintaxis de los rangos de páginas." });
      }
    } catch (err) {
      console.error(err);
      onShowModal && onShowModal({ title: "Error de conexión", message: "No se pudo conectar con el servidor." });
    } finally {
      setSplitting(false);
    }
  };

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = `${API_BASE}${url}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '28px 40px', background: 'var(--bg-paper)' }}>
      {/* Hidden Web Inputs fallback */}
      <input id="extract-pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0]?.path && setExtractPdfPath(e.target.files[0].path)} />
      <input id="split-pdf-input" type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0]?.path && setSplitPdfPath(e.target.files[0].path)} />
      <input id="img-to-pdf-input" type="file" accept=".png,.jpg,.jpeg" multiple style={{ display: 'none' }} onChange={(e) => {
        const paths = Array.from(e.target.files || []).map(f => f.path).filter(Boolean);
        if (paths.length > 0) setSelectedImages(prev => [...prev, ...paths]);
      }} />

      {/* Header Banner */}
      <div style={{ marginBottom: '26px' }}>
        <h2 style={{ fontFamily: 'Kalam, cursive', fontSize: '2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          Caja de Herramientas y Extracción PDF
        </h2>
        <p style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-secondary)', fontFamily: 'Patrick Hand, cursive' }}>
          Convierte, extrae y divide páginas de tus documentos de manera rápida, clara y sin complicaciones.
        </p>
      </div>

      {/* Sub-Tabs / Category Navigation */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '28px', borderBottom: '3px solid var(--border-lead)', paddingBottom: '14px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('extract_img')}
          className={`btn ${activeSubTab === 'extract_img' ? 'btn-amber' : 'btn-primary'}`}
          style={{ padding: '12px 22px', fontSize: '1.15rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
        >
          <FileImage size={20} color="var(--accent-red)" />
          1. Extraer Imágenes de PDF
        </button>

        <button
          onClick={() => setActiveSubTab('images_to_pdf')}
          className={`btn ${activeSubTab === 'images_to_pdf' ? 'btn-amber' : 'btn-primary'}`}
          style={{ padding: '12px 22px', fontSize: '1.15rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
        >
          <ImageIcon size={20} color="var(--accent-blue)" />
          2. Unir Imágenes en un PDF
        </button>

        <button
          onClick={() => setActiveSubTab('split_pdf')}
          className={`btn ${activeSubTab === 'split_pdf' ? 'btn-amber' : 'btn-primary'}`}
          style={{ padding: '12px 22px', fontSize: '1.15rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
        >
          <Scissors size={20} color="var(--accent-red)" />
          3. Dividir y Extraer Multi-PDF
        </button>
      </div>

      {/* ================= SECTION 1: EXTRACT IMAGES FROM PDF ================= */}
      {activeSubTab === 'extract_img' && (
        <div className="paper-card-thick" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-surface)' }}>
          <div className="tack-decoration" />
          
          <div>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'Kalam, cursive', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileImage size={24} color="var(--accent-red)" />
              Extraer páginas de un PDF en formato PNG o JPG
            </h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'Patrick Hand, cursive' }}>
              Elige un PDF, indica si deseas todas las páginas o solo algunas en específico (ej. <strong>1-3, 5</strong>) y obtén imágenes de alta resolución.
            </p>
          </div>

          {/* Form Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Documento PDF de Entrada
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={extractPdfPath || 'Ningún archivo seleccionado...'} 
                  placeholder="Seleccionar archivo..."
                  style={{ flex: 1, background: '#f4f1ea', cursor: 'pointer', fontSize: '1rem' }} 
                  onClick={handleSelectExtractPdf}
                />
                <button onClick={handleSelectExtractPdf} className="btn btn-secondary" style={{ padding: '10px 14px' }} title="Elegir PDF">
                  <FolderOpen size={18} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Páginas a Extraer (ej: todas, o 1-3, 5)
              </label>
              <input 
                type="text" 
                value={extractRange} 
                onChange={(e) => setExtractRange(e.target.value)} 
                placeholder="todas  ó  1-3, 5, 8"
                style={{ width: '100%', fontSize: '1.05rem' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Formato y Calidad
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={extractFormat} onChange={(e) => setExtractFormat(e.target.value)} style={{ flex: 1 }}>
                  <option value="PNG">PNG (Sin Pérdida)</option>
                  <option value="JPG">JPG (Ligero)</option>
                </select>
                <select value={extractDpi} onChange={(e) => setExtractDpi(Number(e.target.value))} style={{ width: '120px' }}>
                  <option value={150}>150 DPI</option>
                  <option value={300}>300 DPI</option>
                  <option value={600}>600 DPI</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleExtractSubmit} 
              disabled={extracting}
              className="btn btn-amber"
              style={{ padding: '12px 24px', fontSize: '1.2rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
            >
              {extracting ? (
                <>
                  <RefreshCcw size={20} className="animate-spin" /> Extraendo...
                </>
              ) : (
                <>
                  <Sparkles size={20} color="var(--accent-red)" /> Extraer Imágenes
                </>
              )}
            </button>
          </div>

          {/* Results Area */}
          {extractedItems.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '2px dashed var(--border-lead)', paddingTop: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '1.35rem', fontFamily: 'Kalam, cursive', margin: 0 }}>
                  ¡Listo! {extractedItems.length} {extractedItems.length === 1 ? 'imagen extraída' : 'imágenes extraídas'} con éxito:
                </h4>
                {extractZipUrl && (
                  <button 
                    onClick={() => triggerDownload(extractZipUrl, `Imagenes_Extraidas_${extractFormat}.zip`)}
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
                  >
                    <Archive size={18} /> Descargar Todas en Archivo .ZIP
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
                {extractedItems.map((item, idx) => (
                  <div key={idx} className="paper-card" style={{ padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '160px', background: '#f8f6f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-lead)' }}>
                      <img src={`${API_BASE}${item.url}`} alt={item.filename} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                      <strong style={{ fontFamily: 'Kalam, cursive' }}>Página #{item.page_num}</strong>
                      <span style={{ color: 'var(--accent-blue)' }}>{item.size_kb} KB</span>
                    </div>
                    <button 
                      onClick={() => triggerDownload(item.url, item.filename)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '6px', fontSize: '0.95rem' }}
                    >
                      <Download size={16} /> Descargar {extractFormat}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 2: IMAGES TO PDF ================= */}
      {activeSubTab === 'images_to_pdf' && (
        <div className="paper-card-thick" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-surface)' }}>
          <div className="tack-decoration" />
          
          <div>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'Kalam, cursive', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ImageIcon size={24} color="var(--accent-blue)" />
              Concatenar y unir varias imágenes en un solo documento PDF
            </h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'Patrick Hand, cursive' }}>
              Añade archivos PNG o JPG, organiza el orden de las páginas y genera un archivo PDF unificado limpio.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={handleSelectImages} className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
              <Plus size={18} color="var(--accent-red)" /> Seleccionar Imágenes (PNG/JPG)
            </button>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                Nombre del archivo PDF resultante
              </label>
              <input 
                type="text" 
                value={outputPdfName} 
                onChange={(e) => setOutputPdfName(e.target.value)} 
                placeholder="Documento_Unido.pdf"
                style={{ width: '100%' }}
              />
            </div>

            {selectedImages.length > 0 && (
              <button 
                onClick={handleImagesToPdfSubmit} 
                disabled={converting}
                className="btn btn-amber"
                style={{ padding: '12px 28px', fontSize: '1.2rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
              >
                {converting ? (
                  <>
                    <RefreshCcw size={20} className="animate-spin" /> Uniendo...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="var(--accent-red)" /> Convertir a PDF ({selectedImages.length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* Selected Images List */}
          {selectedImages.length === 0 ? (
            <div className="postit-card" style={{ padding: '40px', textAlign: 'center', transform: 'rotate(-0.5deg)' }}>
              <ImageIcon size={44} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
              <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', margin: 0 }}>
                No hay imágenes seleccionadas aún. Pulsa el botón <strong>+ Seleccionar Imágenes</strong> para agregar tus archivos PNG o JPG.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '1.2rem', fontFamily: 'Kalam, cursive', margin: 0 }}>
                Lista de imágenes por unir ({selectedImages.length} {selectedImages.length === 1 ? 'página' : 'páginas'}):
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {selectedImages.map((imgPath, i) => (
                  <div key={i} className="paper-card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span className="stamp-badge" style={{ background: 'var(--border-lead)', color: '#ffffff', padding: '2px 8px', fontSize: '0.85rem' }}>
                        #{i + 1}
                      </span>
                      <span style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Patrick Hand, cursive' }} title={imgPath}>
                        {imgPath.split(/[\\/]/).pop()}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveImage(i)} className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--accent-red)' }} title="Quitar imagen">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Converted PDF Result */}
          {convertedPdfUrl && (
            <div className="postit-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-postit)', transform: 'rotate(0.5deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <FileText size={32} color="var(--accent-red)" />
                <div>
                  <strong style={{ fontSize: '1.3rem', display: 'block', fontFamily: 'Kalam, cursive' }}>
                    ¡PDF Generado con Éxito!
                  </strong>
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    Archivo: <strong>{outputPdfName}</strong> (~{convertedSizeMb} MB)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => triggerDownload(convertedPdfUrl, outputPdfName)}
                className="btn btn-primary"
                style={{ background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontWeight: 700, padding: '12px 26px' }}
              >
                <Download size={20} /> Descargar PDF Unido
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 3: SPLIT / MULTI-EXTRACT PDF ================= */}
      {activeSubTab === 'split_pdf' && (
        <div className="paper-card-thick" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-surface)' }}>
          <div className="tack-decoration" />
          
          <div>
            <h3 style={{ fontSize: '1.6rem', fontFamily: 'Kalam, cursive', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Scissors size={24} color="var(--accent-red)" />
              Dividir y extraer múltiples archivos PDF de un solo documento
            </h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'Patrick Hand, cursive' }}>
              ¿Tienes un archivo largo y quieres separarlo? Escribe los rangos separados por comas (ejemplo: <strong>1-3, 4, 5-10</strong> generará exactamente 3 archivos PDF individuales).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Documento PDF Original por Dividir
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={splitPdfPath || 'Ningún archivo seleccionado...'} 
                  placeholder="Seleccionar PDF..."
                  style={{ flex: 1, background: '#f4f1ea', cursor: 'pointer', fontSize: '1rem' }} 
                  onClick={handleSelectSplitPdf}
                />
                <button onClick={handleSelectSplitPdf} className="btn btn-secondary" style={{ padding: '10px 14px' }} title="Elegir PDF">
                  <FolderOpen size={18} />
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Rangos por extraer (separados por coma)
              </label>
              <input 
                type="text" 
                value={splitRanges} 
                onChange={(e) => setSplitRanges(e.target.value)} 
                placeholder="1-3, 4, 5-10"
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600 }} 
              />
            </div>

            <button 
              onClick={handleSplitSubmit} 
              disabled={splitting}
              className="btn btn-amber"
              style={{ padding: '12px 24px', fontSize: '1.2rem', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
            >
              {splitting ? (
                <>
                  <RefreshCcw size={20} className="animate-spin" /> Dividiendo...
                </>
              ) : (
                <>
                  <Scissors size={20} color="var(--accent-red)" /> Dividir y Extraer PDFs
                </>
              )}
            </button>
          </div>

          {/* Helper note */}
          <div className="postit-card" style={{ padding: '12px 18px', fontSize: '0.98rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', transform: 'rotate(-0.5deg)' }}>
            <span className="stamp-badge" style={{ background: 'var(--border-lead)', color: '#fff', fontSize: '0.8rem' }}>EJEMPLO PRÁCTICO</span>
            Si tu documento tiene 10 páginas y escribes <strong>1-3, 4, 5-10</strong>, recibirás un archivo con las páginas 1 a 3, otro solo con la 4 y un tercero con las páginas 5 a la 10.
          </div>

          {/* Split Results */}
          {splitItems.length > 0 && (
            <div style={{ marginTop: '14px', borderTop: '2px dashed var(--border-lead)', paddingTop: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '1.35rem', fontFamily: 'Kalam, cursive', margin: 0 }}>
                  ¡Éxito! Se han creado {splitItems.length} {splitItems.length === 1 ? 'archivo PDF extraído' : 'archivos PDF extraídos'}:
                </h4>
                {splitZipUrl && (
                  <button 
                    onClick={() => triggerDownload(splitZipUrl, `Extractos_PDF_Divididos.zip`)}
                    className="btn btn-primary"
                    style={{ background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
                  >
                    <Archive size={18} /> Descargar Todos en Paquete .ZIP
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                {splitItems.map((pdfItem, idx) => (
                  <div key={idx} className="paper-card" style={{ padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--wobbly-sm)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border-lead)' }}>
                        <FileText size={22} color="var(--accent-red)" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '1.15rem', display: 'block', fontFamily: 'Kalam, cursive', color: 'var(--text-primary)' }}>
                          {pdfItem.label}
                        </strong>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {pdfItem.page_count} {pdfItem.page_count === 1 ? 'pág' : 'págs'} — {pdfItem.size_kb} KB
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => triggerDownload(pdfItem.url, pdfItem.filename)}
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '8px', fontSize: '1rem', marginTop: 'auto' }}
                    >
                      <Download size={18} color="var(--accent-blue)" /> Descargar PDF Extraído
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
