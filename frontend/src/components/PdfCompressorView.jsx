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

export default function PdfCompressorView({ onShowModal }) {
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

  // Handle picking PDF files natively or via web file input
  const handleSelectFiles = async () => {
    // 1. Check native Desktop API
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

    // 2. Web fallback trigger hidden file input
    document.getElementById("pdf-upload-input").click();
  };

  const handleWebFileInput = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setLoading(true);
    // Since browser doesn't give absolute paths, we can read/upload directly or if we are local desktop, ask for native dialog
    // We register paths if available or warn
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
        message: "Por favor utiliza la aplicación de escritorio para poder procesar archivos pesados del sistema operativo de forma ultra rápida en caché."
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

  const handleDownloadSingle = (file) => {
    const url = `${API_BASE}/api/compress/download/${file.id}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.compressed_path ? `comprimido_${file.filename}` : file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
        
        // Use native Save As if available
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '28px 40px', background: 'radial-gradient(circle at top right, #131824 0%, #0b0d11 100%)' }}>
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
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            Optimización y Compresión para Google Drive
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Reduce el peso de tus documentos PDF por debajo del límite de 25 MB de Drive y adjuntos sin sacrificar la legibilidad de textos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={handleSelectFiles} 
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            <FolderOpen size={18} />
            Seleccionar Documentos PDF
          </button>
        </div>
      </div>

      {/* Profile Selector & Metrics Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sliders size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Perfil de Reducción:</span>
          <select 
            value={globalMode} 
            onChange={(e) => setGlobalMode(e.target.value)}
            style={{ minWidth: '280px', fontWeight: 600 }}
          >
            <option value="drive_25mb">Optimización Inteligente Drive (Objetivo menor a 25 MB)</option>
            <option value="medium">Compresión Media Balanceada (JPEG 75% Archivo)</option>
            <option value="extreme">Compresión Extrema Ligera (Web y Correo Electrónico)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Peso Original Total</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{totalOriginalMb} MB</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Peso Final Optimizado</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>{totalFinalMb} MB</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Alerta Drive (mayor a 25MB)</span>
            <strong style={{ fontSize: '1.05rem', color: exceedsCount > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
              {exceedsCount} {exceedsCount === 1 ? 'documento excede' : 'documentos exceden'}
            </strong>
          </div>
          {files.length > 0 && (
            <button 
              onClick={() => handleCompress(files.map(f => f.id))} 
              disabled={compressing}
              className="btn btn-amber"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              {compressing ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" /> Comprimiendo...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Comprimir Todos
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Files Grid / Table */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {files.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '60px' }}>
            <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              No hay documentos PDF seleccionados en este momento
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', textAlign: 'center', margin: '0 0 24px 0' }}>
              Añade tus archivos PDF para verificar cuánto peso ocupan y comprimirlos en grupo para que quepan en Google Drive o correo.
            </p>
            <button onClick={handleSelectFiles} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
              <FolderOpen size={16} /> Abrir Documentos PDF
            </button>
          </div>
        ) : (
          files.map((file) => {
            const isCompressed = file.status === "compressed" && file.compressed_size_mb;
            const currentMb = isCompressed ? file.compressed_size_mb : file.original_size_mb;
            const exceeds = currentMb > 25.0;
            const reductionPct = isCompressed ? Math.round((1 - file.compressed_size_bytes / file.original_size_bytes) * 100) : 0;

            return (
              <div key={file.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} color="var(--accent-cyan)" />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {file.filename}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Original: {file.original_size_mb} MB</span>
                      {isCompressed && (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          Final: {file.compressed_size_mb} MB ({reductionPct}% reducido)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {exceeds ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      <AlertTriangle size={14} /> Mayor a 25 MB (Drive)
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--accent-green)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Apto para Drive (&lt; 25 MB)
                    </span>
                  )}

                  {/* Individual Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => handleCompress([file.id])}
                      disabled={compressing}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      title="Comprimir solo este documento"
                    >
                      <Sparkles size={14} /> {isCompressed ? 'Re-comprimir' : 'Comprimir'}
                    </button>

                    <button 
                      onClick={() => handleDownloadSingle(file)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      title="Descargar PDF"
                    >
                      <Download size={14} /> Descargar PDF
                    </button>

                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="btn btn-secondary"
                      style={{ padding: '8px', color: 'var(--accent-danger)' }}
                      title="Quitar de la lista"
                    >
                      <Trash2 size={16} />
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
        <div className="glass-panel" style={{ marginTop: '20px', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(11, 13, 17, 0.94)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Archive size={22} color="var(--accent-cyan)" />
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', color: 'var(--text-primary)' }}>
                Paquete Consolidado .ZIP
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Descarga en un solo archivo todos los documentos PDF optimizados para subir o enviar juntos.
              </span>
            </div>
          </div>

          <button 
            onClick={handleDownloadZip}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1rem' }}
          >
            <Archive size={18} />
            Descargar Archivo .ZIP ({files.length} {files.length === 1 ? 'doc' : 'docs'})
          </button>
        </div>
      )}
    </div>
  );
}
