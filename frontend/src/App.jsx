import React, { useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import ScannerControls from './components/ScannerControls';
import PageGrid from './components/PageGrid';
import PreviewStudioModal from './components/PreviewStudioModal';
import ExportBar from './components/ExportBar';
import CustomModal from './components/CustomModal';
import PdfCompressorView from './components/PdfCompressorView';
import { Layers, Archive } from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function App() {
  const [scanners, setScanners] = useState([
    { id: 'virtual-scanner-sim', name: 'Escáner Virtual Simulación (300 DPI - Alta Fidelidad)', type: 'virtual' }
  ]);
  const [selectedDevice, setSelectedDevice] = useState('virtual-scanner-sim');
  const [dpi, setDpi] = useState(300);
  const [colorMode, setColorMode] = useState('Color');
  const [paperSize, setPaperSize] = useState('Letter');
  
  const [pages, setPages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [inspectingPage, setInspectingPage] = useState(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportQuality, setExportQuality] = useState('lossless');

  // Top navigation tabs
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'compressor'

  // Custom modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: null
  });

  const showModal = ({ title, message, type = 'alert', onConfirm = null }) => {
    setModalState({ isOpen: true, title, message, type, onConfirm });
  };

  // Fetch available hardware scanners
  const fetchScanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scanners`);
      if (res.ok) {
        const data = await res.json();
        const devices = data.scanners || [];
        setScanners([
          ...devices.map(d => ({ ...d, type: 'hardware' })),
          { id: 'virtual-scanner-sim', name: 'Escáner Virtual Simulación (300 DPI - Alta Fidelidad)', type: 'virtual' }
        ]);
        if (devices.length > 0 && selectedDevice === 'virtual-scanner-sim') {
          setSelectedDevice(devices[0].id);
        }
      }
    } catch (err) {
      console.warn("Could not reach backend API for scanners, using virtual simulation:", err);
    }
  };

  useEffect(() => {
    fetchScanners();
  }, []);

  // Trigger a scan
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: selectedDevice,
          dpi: dpi,
          color_mode: colorMode,
          paper_size: paperSize,
          page_num: pages.length + 1
        })
      });
      if (res.ok) {
        const newPage = await res.json();
        setPages(prev => [...prev, newPage]);
      } else {
        const err = await res.json();
        showModal({
          title: "Error al Escanear",
          message: err.detail || "Fallo durante la captura óptica."
        });
      }
    } catch (err) {
      showModal({
        title: "Servidor Backend Desconectado",
        message: "No se pudo conectar con el servidor backend en http://127.0.0.1:8000. Asegúrate de que el backend de Python esté corriendo correctamente."
      });
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  // Drag & drop Pick and Drop reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(pages.map(p => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Deletion handlers
  const handleDeleteSelected = () => {
    setPages(prev => prev.filter(p => !selectedIds.includes(p.id)));
    setSelectedIds([]);
  };

  const handleDeleteSingle = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(item => item !== id));
    if (inspectingPage?.id === id) {
      setInspectingPage(null);
    }
  };

  // Update single page attributes in state (after live adjustments in modal)
  const handleUpdatePage = (id, updates) => {
    setPages(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    if (inspectingPage?.id === id) {
      setInspectingPage(prev => ({ ...prev, ...updates }));
    }
  };

  // Export PDF with exact page order or selected pages
  const handleExportPdf = async (targetPageIds = null) => {
    if (pages.length === 0) return;
    const idsToExport = (targetPageIds && Array.isArray(targetPageIds) && targetPageIds.length > 0)
      ? targetPageIds
      : (selectedIds.length > 0 ? selectedIds : pages.map(p => p.id));

    setIsExporting(true);
    try {
      const defaultFilename = `DocScan_${new Date().toISOString().slice(0,19).replace(/[:-]/g,"_")}.pdf`;

      // 1. Check if running inside our Electron or pywebview Native Windows Desktop Application!
      if (
        (window.electronAPI && window.electronAPI.saveFileDialog) ||
        (window.pywebview && window.pywebview.api && window.pywebview.api.save_pdf_dialog)
      ) {
        const dialogFn = window.electronAPI?.saveFileDialog || window.pywebview?.api?.save_pdf_dialog;
        const chosenPath = await dialogFn(defaultFilename);
        if (!chosenPath) {
          setIsExporting(false);
          return; // User canceled native Windows Save As dialog
        }

        const resPath = await fetch(`${API_BASE}/api/export/save-to-path`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_ids: idsToExport,
            quality_mode: exportQuality,
            target_path: chosenPath
          })
        });

        if (resPath.ok) {
          showModal({
            title: "Exportación Completada",
            message: `El documento PDF de alta calidad con ${idsToExport.length} hoja(s) ha sido guardado exitosamente en:\n${chosenPath}`
          });
        } else {
          const err = await resPath.json();
          showModal({
            title: "Error de Exportación",
            message: err.detail || "Fallo durante la escritura del archivo PDF."
          });
        }
        return;
      }

      // 2. Otherwise fall back to browser download stream / showSaveFilePicker
      const res = await fetch(`${API_BASE}/api/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_ids: idsToExport,
          quality_mode: exportQuality
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const filename = res.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || defaultFilename;
        
        // Use File System Access API if available to ALWAYS prompt the user for exact folder and filename
        if ('showSaveFilePicker' in window) {
          try {
            const fileHandle = await window.showSaveFilePicker({
              suggestedName: filename,
              types: [{
                description: 'Documento PDF de Alta Calidad',
                accept: { 'application/pdf': ['.pdf'] },
              }],
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
          } catch (pickerErr) {
            if (pickerErr.name === 'AbortError') return;
            console.warn("SaveFilePicker fallback:", pickerErr);
          }
        }

        // Fallback standard anchor download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await res.json();
        showModal({
          title: "Error al Generar PDF",
          message: err.detail || "Hubo un fallo durante la creación del archivo de salida."
        });
      }
    } catch (err) {
      showModal({
        title: "Error en la Descarga",
        message: "No se pudo procesar la descarga del documento PDF."
      });
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Clear entire session
  const handleClearSession = () => {
    if (pages.length === 0) return;
    showModal({
      title: "Limpiar Sesión Activa",
      message: "¿Estás seguro de que deseas limpiar todas las hojas y comenzar un nuevo reporte digital desde cero?",
      type: "confirm",
      onConfirm: async () => {
        setPages([]);
        setSelectedIds([]);
        setInspectingPage(null);
        try {
          await fetch(`${API_BASE}/api/session/clear`, { method: 'POST' });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Application Header / Navigation Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '64px',
        background: 'rgba(11, 13, 17, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #0099ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
          }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#0b0d11' }}>iS</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
              iCanScan <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.12)', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>STUDIO</span>
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', height: '100%' }}>
          <button 
            onClick={() => setActiveTab('studio')}
            className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
          >
            <Layers size={18} />
            Estudio de Escaneo y Ordenamiento
          </button>
          <button 
            onClick={() => setActiveTab('compressor')}
            className={`tab-btn ${activeTab === 'compressor' ? 'active' : ''}`}
          >
            <Archive size={18} />
            Compresión de Peso Drive (25 MB)
          </button>
        </nav>
      </header>

      {/* Main Content Area based on activeTab */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'studio' ? (
          <>
            {/* Left Sidebar - Scanner Parameters */}
            <ScannerControls 
              scanners={scanners}
              selectedDevice={selectedDevice}
              setSelectedDevice={setSelectedDevice}
              dpi={dpi}
              setDpi={setDpi}
              colorMode={colorMode}
              setColorMode={setColorMode}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
              onScan={handleScan}
              isScanning={isScanning}
              onRefreshScanners={fetchScanners}
            />

            {/* Main Workspace Grid - Pick and Drop */}
            <PageGrid 
              pages={pages}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDeleteSelected={handleDeleteSelected}
              onDeleteSingle={handleDeleteSingle}
              onInspect={(page) => setInspectingPage(page)}
              onDragEnd={handleDragEnd}
            />

            {/* Preview Studio Modal */}
            {inspectingPage && (
              <PreviewStudioModal 
                page={inspectingPage}
                pageIndex={pages.findIndex(p => p.id === inspectingPage.id)}
                totalCount={pages.length}
                onNavigate={(newIndex) => {
                  if (newIndex >= 0 && newIndex < pages.length) {
                    setInspectingPage(pages[newIndex]);
                  }
                }}
                onClose={() => setInspectingPage(null)}
                onUpdatePage={handleUpdatePage}
              />
            )}

            {/* Bottom Export Bar */}
            <ExportBar 
              pages={pages}
              selectedIds={selectedIds}
              exportQuality={exportQuality}
              setExportQuality={setExportQuality}
              onExport={handleExportPdf}
              isExporting={isExporting}
              onClearSession={handleClearSession}
            />
          </>
        ) : (
          <PdfCompressorView onShowModal={showModal} />
        )}
      </div>

      {/* Global Custom Notification / Confirmation Modal */}
      <CustomModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
    </div>
  );
}
