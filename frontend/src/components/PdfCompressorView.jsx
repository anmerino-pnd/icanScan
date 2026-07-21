import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FolderOpen, 
  Download, 
  Trash2, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function PdfCompressorView({ onShowModal }) {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [globalMode, setGlobalMode] = useState("drive_25mb");

  const API_BASE = "http://localhost:8000";

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/compress/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching compressor files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSelectFiles = async () => {
    if (
      (window.electronAPI && window.electronAPI.openFileDialog) ||
      (window.pywebview && window.pywebview.api && window.pywebview.api.open_pdf_dialog)
    ) {
      const openFn = window.electronAPI?.openFileDialog || window.pywebview?.api?.open_pdf_dialog;
      setLoading(true);
      try {
        const paths = await openFn({ title: 'Seleccionar Documentos PDF para Reducir' });
        if (paths && paths.length > 0) {
          const res = await fetch(`${API_BASE}/api/compress/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_paths: paths })
          });
          if (res.ok) {
            const data = await res.json();
            setFiles(data.files || []);
          }
        }
      } catch (err) {
        console.error("Error in native open dialog:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    document.getElementById("pdf-upload-input").click();
  };

  const handleWebFileInput = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setLoading(true);
    const filePaths = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].path) {
        filePaths.push(selectedFiles[i].path);
      }
    }

    if (filePaths.length > 0) {
      try {
        const res = await fetch(`${API_BASE}/api/compress/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_paths: filePaths })
        });
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      onShowModal && onShowModal({
        title: "Aviso de Selección",
        message: "Por favor utiliza la aplicación de escritorio para poder procesar archivos pesados del sistema operativo en caché de manera rápida."
      });
    }
    setLoading(false);
    e.target.value = "";
  };

  const handleCompress = async (targetFileIds) => {
    if (!targetFileIds || targetFileIds.length === 0) return;
    setCompressing(true);
    try {
      const res = await fetch(`${API_BASE}/api/compress/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_ids: targetFileIds,
          mode: globalMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        onShowModal && onShowModal({
          title: "Compresión Exitosa",
          message: `Se ha procesado y optimizado el tamaño de ${targetFileIds.length} documento(s) para Google Drive exitosamente.`
        });
      } else {
        const err = await res.json();
        onShowModal && onShowModal({
          title: "Error de Compresión",
          message: err.detail || "Hubo un problema al reducir los archivos PDF."
        });
      }
    } catch (err) {
      console.error(err);
      onShowModal && onShowModal({
        title: "Error de Conexión",
        message: "No se pudo conectar con el motor de optimización PDF."
      });
    } finally {
      setCompressing(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      const res = await fetch(`${API_BASE}/api/compress/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSingle = async (file) => {
    const url = `/api/compress/download/${file.id}`;
    const filename = file.compressed_path ? `comprimido_${file.filename}` : file.filename;

    const saveFn = window.electronAPI?.saveFileDialog || window.pywebview?.api?.save_file_dialog || window.pywebview?.api?.save_pdf_dialog;
    if (saveFn) {
      try {
        const chosenPath = await saveFn(filename);
        if (chosenPath) {
          const res = await fetch(`${API_BASE}/api/tools/save-to-path`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_url: url, target_path: chosenPath })
          });
          if (res.ok) {
            onShowModal && onShowModal({ title: "PDF Guardado", message: `El documento comprimido se ha guardado exitosamente en:\n${chosenPath}` });
          }
        }
        return;
      } catch (err) {
        console.error("Save dialog error:", err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) return;
      const blob = await res.blob();
      
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'Documento PDF', accept: { 'application/pdf': ['.pdf'] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') return;
        }
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const handleDownloadZip = async () => {
    const processedFiles = files.filter(f => f.compressed_path || f.status === "compressed" || f.original_path);
    if (processedFiles.length === 0) {
      onShowModal && onShowModal({
        title: "Sin Archivos para ZIP",
        message: "Por favor selecciona y procesa al menos un documento PDF antes de generar el paquete ZIP."
      });
      return;
    }

    const fileIds = processedFiles.map(f => f.id);
    const url = `${API_BASE}/api/compress/download-zip`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: fileIds })
      });

      if (res.ok) {
        const blob = await res.blob();
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await window.showSaveFilePicker({
              suggestedName: "Documentos_Drive_Comprimidos.zip",
              types: [{
                description: 'Archivo ZIP de Documentos PDF',
                accept: { 'application/zip': ['.zip'] }
              }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (pickerErr) {
            if (pickerErr.name === 'AbortError') return;
          }
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = "Documentos_Drive_Comprimidos.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (err) {
      console.error("Error downloading ZIP:", err);
    }
  };

  const totalOriginalMb = files.reduce((acc, f) => acc + (f.original_size_mb || 0), 0).toFixed(2);
  const totalFinalMb = files.reduce((acc, f) => acc + (f.compressed_size_mb || f.original_size_mb || 0), 0).toFixed(2);
  const exceedsCount = files.filter(f => f.exceeds_drive_25mb && (!f.compressed_size_mb || f.compressed_size_mb > 25.0)).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '28px 40px', background: 'var(--bg-paper)' }}>
      <input 
        id="pdf-upload-input" 
        type="file" 
        multiple 
        accept=".pdf" 
        style={{ display: 'none' }} 
        onChange={handleWebFileInput} 
      />

      {/* Top Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'Kalam, cursive', fontSize: '2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            {t('compressor.title')}
          </h2>
          <p style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-secondary)', fontFamily: 'Patrick Hand, cursive' }}>
            {t('compressor.subTitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={handleSelectFiles} 
            disabled={loading}
            className="btn btn-amber"
            style={{ padding: '12px 26px', fontSize: '1.15rem', fontFamily: 'Kalam, cursive', fontWeight: 700, transform: 'rotate(1deg)' }}
          >
            <FolderOpen size={20} />
            {t('tools.selectPdfBtn')}
          </button>
        </div>
      </div>

      {/* Profile Selector & Metrics Bar */}
      <div className="paper-card" style={{ padding: '20px 26px', marginBottom: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sliders size={20} color="var(--accent-red)" />
          <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Kalam, cursive' }}>{t('compressor.modeLabel')}:</span>
          <select 
            value={globalMode} 
            onChange={(e) => setGlobalMode(e.target.value)}
            style={{ minWidth: '320px' }}
          >
            <option value="drive_25mb">{t('compressor.modeDrive')}</option>
            <option value="extreme">{t('compressor.modeExtreme')}</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '26px', fontFamily: 'Patrick Hand, cursive' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Peso Original Total</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontFamily: 'Kalam, cursive' }}>{totalOriginalMb} MB</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Peso Final Optimizado</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--accent-blue)', fontFamily: 'Kalam, cursive' }}>{totalFinalMb} MB</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Alerta Drive (&gt; 25MB)</span>
            <strong style={{ fontSize: '1.3rem', color: exceedsCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontFamily: 'Kalam, cursive' }}>
              {exceedsCount} {exceedsCount === 1 ? 'documento excede' : 'documentos exceden'}
            </strong>
          </div>
          {files.length > 0 && (
            <button 
              onClick={() => handleCompress(files.map(f => f.id))} 
              disabled={compressing}
              className="btn btn-primary"
              style={{ padding: '12px 22px', fontSize: '1.1rem', background: 'var(--accent-red)', color: '#ffffff', fontFamily: 'Kalam, cursive', fontWeight: 700 }}
            >
              {compressing ? (
                <>
                  <RefreshCcw size={18} className="animate-spin" /> {t('compressor.compressingBtn')}
                </>
              ) : (
                <>
                  <Sparkles size={18} /> {t('compressor.compressBtn')}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Files Grid / Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '60px' }}>
        {files.length === 0 ? (
          <div className="postit-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', transform: 'rotate(-0.5deg)' }}>
            <div className="tape-decoration" />
            <FileText size={56} color="var(--accent-red)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'Kalam, cursive', fontSize: '1.6rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              No hay documentos PDF seleccionados en este momento
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '460px', textAlign: 'center', margin: '0 0 24px 0', fontFamily: 'Patrick Hand, cursive' }}>
              Añade tus archivos PDF para verificar cuánto peso ocupan y comprimirlos en grupo para que quepan en Google Drive o correo.
            </p>
            <button onClick={handleSelectFiles} className="btn btn-secondary" style={{ padding: '12px 24px' }}>
              <FolderOpen size={18} /> Abrir Documentos PDF
            </button>
          </div>
        ) : (
          files.map((file, i) => {
            const isCompressed = file.status === "compressed" && file.compressed_size_mb;
            const currentMb = isCompressed ? file.compressed_size_mb : file.original_size_mb;
            const exceeds = currentMb > 25.0;
            const reductionPct = isCompressed ? Math.round((1 - file.compressed_size_bytes / file.original_size_bytes) * 100) : 0;

            return (
              <div key={file.id} className="paper-card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', transform: `rotate(${i % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: 'var(--wobbly-sm)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--border-lead)' }}>
                    <FileText size={24} color="var(--accent-red)" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Kalam, cursive' }}>
                      {file.filename}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1rem', fontFamily: 'Patrick Hand, cursive', flexWrap: 'wrap' }}>
                      {file.page_count > 0 && (
                        <span style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-lead)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          TOTAL: {file.page_count} PÁG{file.page_count !== 1 ? 'S' : ''}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-secondary)' }}>Original: {file.original_size_mb} MB</span>
                      {isCompressed && (
                        <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                          Final: {file.compressed_size_mb} MB ({reductionPct}% reducido)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  {exceeds ? (
                    <span className="stamp-badge" style={{ background: 'rgba(255, 77, 77, 0.15)', color: 'var(--accent-red)', transform: 'rotate(-2deg)' }}>
                      <AlertTriangle size={16} /> Mayor a 25 MB (Drive)
                    </span>
                  ) : (
                    <span className="stamp-badge" style={{ background: 'rgba(22, 163, 74, 0.15)', color: 'var(--accent-green)', transform: 'rotate(1deg)' }}>
                      <CheckCircle2 size={16} /> Apto para Drive (&lt; 25 MB)
                    </span>
                  )}

                  {/* Individual Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => handleCompress([file.id])}
                      disabled={compressing}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.95rem' }}
                      title={t('compressor.compressBtn')}
                    >
                      <Sparkles size={16} /> {t('compressor.compressBtn')}
                    </button>

                    <button 
                      onClick={() => handleDownloadSingle(file)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.95rem' }}
                      title={t('compressor.downloadBtn')}
                    >
                      <Download size={16} /> {t('compressor.downloadBtn')}
                    </button>

                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', color: 'var(--accent-red)' }}
                      title={t('compressor.deleteBtn')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom ZIP Action Bar */}
      {files.length > 0 && (
        <div className="postit-card" style={{ marginTop: '20px', padding: '18px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'rotate(0.5deg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Archive size={28} color="var(--accent-blue)" />
            <div>
              <strong style={{ fontSize: '1.3rem', display: 'block', color: 'var(--text-primary)', fontFamily: 'Kalam, cursive' }}>
                Paquete Consolidado .ZIP
              </strong>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'Patrick Hand, cursive' }}>
                Descarga en un solo archivo todos los documentos PDF optimizados para subir o enviar juntos.
              </span>
            </div>
          </div>

          <button 
            onClick={handleDownloadZip}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1.25rem', fontFamily: 'Kalam, cursive', fontWeight: 700, background: 'var(--accent-red)', color: '#ffffff', boxShadow: '4px 4px 0px 0px #2d2d2d' }}
          >
            <Archive size={20} />
            Descargar Archivo .ZIP ({files.length} {files.length === 1 ? 'doc' : 'docs'})
          </button>
        </div>
      )}
    </div>
  );
}
