import os
import uuid
import time
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from icanscan import scanner_wia, image_processor, pdf_compressor, pdf_tools

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("icanscan")

app = FastAPI(title="Doc Scan PDF Scanner API", version="1.0.0")

# Enable CORS for local desktop interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup local scans cache directory
CACHE_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", ".scans_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Mount static directory to serve preview images directly
app.mount("/cache", StaticFiles(directory=CACHE_DIR), name="cache")

# Models
class ScanRequest(BaseModel):
    device_id: str = "virtual-scanner-sim"
    dpi: int = 300
    color_mode: str = "Color"
    paper_size: str = "Letter"
    page_num: int = 1

class AdjustRequest(BaseModel):
    rotation: int = 0
    brightness: float = 0.0
    contrast: float = 0.0
    bw_filter: bool = False

class DeleteRequest(BaseModel):
    page_ids: List[str]

class ExportRequest(BaseModel):
    page_ids: List[str]
    quality_mode: str = "lossless"

class ExtractImagesRequest(BaseModel):
    pdf_path: str
    page_range: str = "todas"
    format_type: str = "PNG"
    dpi: int = 300

class ImagesToPdfRequest(BaseModel):
    image_paths: List[str]
    output_filename: str = "Documento_Unido.pdf"

class SplitPdfRequest(BaseModel):
    pdf_path: str
    range_spec: str = "1"

class PdfInfoRequest(BaseModel):
    pdf_path: str

@app.get("/api/scanners")
def get_scanners():
    return {"scanners": scanner_wia.list_scanners()}

@app.post("/api/scan")
def trigger_scan(request: ScanRequest):
    logger.info(f"Triggering scan for device: {request.device_id}, DPI: {request.dpi}")
    try:
        img = scanner_wia.scan_page(
            device_id=request.device_id,
            dpi=request.dpi,
            color_mode=request.color_mode,
            paper_size=request.paper_size,
            page_num=request.page_num
        )
        
        page_id = uuid.uuid4().hex[:8]
        orig_filename = f"{page_id}_original.png"
        proc_filename = f"{page_id}_processed.png"
        
        orig_path = os.path.join(CACHE_DIR, orig_filename)
        proc_path = os.path.join(CACHE_DIR, proc_filename)
        
        # Save both original and processed (initially identical)
        img.save(orig_path, format="PNG", optimize=False)
        img.save(proc_path, format="PNG", optimize=False)
        
        file_size_bytes = os.path.getsize(proc_path)
        
        return {
            "id": page_id,
            "original_url": f"/cache/{orig_filename}",
            "preview_url": f"/cache/{proc_filename}?t={int(time.time()*1000)}",
            "dpi": request.dpi,
            "width": img.width,
            "height": img.height,
            "size_kb": round(file_size_bytes / 1024, 1),
            "rotation": 0,
            "brightness": 0.0,
            "contrast": 0.0,
            "bw_filter": False
        }
    except Exception as e:
        logger.error(f"Scan error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error durante el escaneo: {str(e)}")

@app.post("/api/pages/{page_id}/adjust")
def adjust_page(page_id: str, request: AdjustRequest):
    orig_path = os.path.join(CACHE_DIR, f"{page_id}_original.png")
    proc_path = os.path.join(CACHE_DIR, f"{page_id}_processed.png")
    
    if not os.path.exists(orig_path):
        raise HTTPException(status_code=404, detail="Página original no encontrada en caché")
        
    try:
        image_processor.apply_adjustments(
            original_path=orig_path,
            output_path=proc_path,
            rotation=request.rotation,
            brightness=request.brightness,
            contrast=request.contrast,
            bw_filter=request.bw_filter
        )
        file_size_bytes = os.path.getsize(proc_path)
        return {
            "id": page_id,
            "preview_url": f"/cache/{page_id}_processed.png?t={int(time.time()*1000)}",
            "rotation": request.rotation,
            "brightness": request.brightness,
            "contrast": request.contrast,
            "bw_filter": request.bw_filter,
            "size_kb": round(file_size_bytes / 1024, 1)
        }
    except Exception as e:
        logger.error(f"Adjustment error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error ajustando la imagen: {str(e)}")

@app.post("/api/pages/delete")
def delete_pages(request: DeleteRequest):
    deleted = []
    for pid in request.page_ids:
        for ext in ["_original.png", "_processed.png"]:
            path = os.path.join(CACHE_DIR, f"{pid}{ext}")
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as e:
                    logger.warning(f"Failed to delete {path}: {e}")
        deleted.append(pid)
    return {"success": True, "deleted": deleted}

@app.post("/api/export/pdf")
def export_pdf(request: ExportRequest):
    if not request.page_ids:
        raise HTTPException(status_code=400, detail="No se seleccionaron hojas para exportar")
        
    page_paths = [os.path.join(CACHE_DIR, f"{pid}_processed.png") for pid in request.page_ids]
    missing = [p for p in page_paths if not os.path.exists(p)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Faltan imágenes en caché: {missing}")
        
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_filename = f"DocScan_{timestamp}.pdf"
    output_path = os.path.join(CACHE_DIR, output_filename)
    
    try:
        image_processor.export_to_pdf(
            page_paths=page_paths,
            output_pdf_path=output_path,
            quality_mode=request.quality_mode
        )
        return FileResponse(
            path=output_path,
            filename=output_filename,
            media_type="application/pdf"
        )
    except Exception as e:
        logger.error(f"PDF export error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {str(e)}")

@app.post("/api/session/clear")
def clear_session():
    count = 0
    for file in os.listdir(CACHE_DIR):
        if file.endswith(".png") or file.endswith(".pdf"):
            try:
                os.remove(os.path.join(CACHE_DIR, file))
                count += 1
            except Exception:
                pass
    return {"success": True, "cleared_files": count}

class SaveToPathRequest(BaseModel):
    page_ids: List[str]
    quality_mode: str = "lossless"
    target_path: str

@app.post("/api/export/save-to-path")
def export_pdf_to_path(request: SaveToPathRequest):
    if not request.page_ids:
        raise HTTPException(status_code=400, detail="No se seleccionaron hojas para exportar")
    if not request.target_path:
        raise HTTPException(status_code=400, detail="Rata de destino inválida")
        
    page_paths = [os.path.join(CACHE_DIR, f"{pid}_processed.png") for pid in request.page_ids]
    missing = [p for p in page_paths if not os.path.exists(p)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Faltan imágenes en caché: {missing}")
        
    try:
        image_processor.export_to_pdf(
            page_paths=page_paths,
            output_pdf_path=request.target_path,
            quality_mode=request.quality_mode
        )
        return {"success": True, "saved_to": request.target_path}
    except Exception as e:
        logger.error(f"PDF save-to-path error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error guardando PDF: {str(e)}")

# Compression Models & Routes
class CompressRegisterRequest(BaseModel):
    file_paths: List[str]

class CompressProcessRequest(BaseModel):
    file_ids: List[str]
    mode: str = "drive_25mb"

class CompressZipRequest(BaseModel):
    file_ids: List[str]

@app.post("/api/compress/register")
def register_pdfs_for_compression(request: CompressRegisterRequest):
    registered = []
    for path_str in request.file_paths:
        try:
            info = pdf_compressor.get_file_info(path_str)
            registered.append(info)
        except Exception as e:
            logger.warning(f"Could not register file {path_str}: {e}")
    return {"files": list(pdf_compressor.COMPRESS_REGISTRY.values()), "newly_registered": registered}

@app.get("/api/compress/files")
def get_compress_files():
    return {"files": list(pdf_compressor.COMPRESS_REGISTRY.values())}

@app.delete("/api/compress/files/{file_id}")
def delete_compress_file(file_id: str):
    if file_id in pdf_compressor.COMPRESS_REGISTRY:
        del pdf_compressor.COMPRESS_REGISTRY[file_id]
    return {"files": list(pdf_compressor.COMPRESS_REGISTRY.values())}

@app.post("/api/compress/process")
def process_pdf_compression(request: CompressProcessRequest):
    results = []
    for fid in request.file_ids:
        try:
            info = pdf_compressor.compress_pdf(fid, mode=request.mode)
            results.append(info)
        except Exception as e:
            logger.error(f"Error compressing {fid}: {e}")
    return {"files": list(pdf_compressor.COMPRESS_REGISTRY.values())}

@app.get("/api/compress/download/{file_id}")
def download_compressed_pdf(file_id: str):
    if file_id not in pdf_compressor.COMPRESS_REGISTRY:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    info = pdf_compressor.COMPRESS_REGISTRY[file_id]
    path_to_send = info.get("compressed_path") or info.get("original_path")
    if not path_to_send or not os.path.exists(path_to_send):
        raise HTTPException(status_code=404, detail="Archivo no disponible en disco")
    filename = f"comprimido_{info['filename']}" if info.get("compressed_path") else info['filename']
    return FileResponse(path=path_to_send, media_type="application/pdf", filename=filename)

@app.post("/api/compress/download-zip")
def download_compressed_zip(request: CompressZipRequest):
    try:
        zip_path = pdf_compressor.create_zip_archive(request.file_ids)
        return FileResponse(path=zip_path, media_type="application/zip", filename="Documentos_Comprimidos_Drive.zip")
    except Exception as e:
        logger.error(f"Error creating ZIP: {e}")
        raise HTTPException(status_code=500, detail=f"Error al generar ZIP: {str(e)}")

@app.post("/api/tools/pdf-info")
def get_pdf_info(request: PdfInfoRequest):
    try:
        import fitz
        if not os.path.exists(request.pdf_path):
            raise HTTPException(status_code=404, detail="Archivo PDF no encontrado en el servidor")
        doc = fitz.open(request.pdf_path)
        info = {
            "page_count": len(doc),
            "filename": os.path.basename(request.pdf_path),
            "size_kb": round(os.path.getsize(request.pdf_path) / 1024, 1)
        }
        doc.close()
        return {"success": True, "info": info}
    except Exception as e:
        logger.error(f"Error getting PDF info: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/tools/upload-temp")
async def upload_temp_files(files: List[UploadFile] = File(...)):
    """Receives uploaded files via web input when absolute filesystem paths are not accessible."""
    try:
        import shutil
        import fitz
        upload_dir = os.path.join(CACHE_DIR, "tools", "uploads", str(uuid.uuid4()))
        os.makedirs(upload_dir, exist_ok=True)
        paths = []
        info_dict = {}
        for file in files:
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            paths.append(file_path)
            if file.filename.lower().endswith(".pdf"):
                try:
                    doc = fitz.open(file_path)
                    info_dict[file_path] = {
                        "page_count": len(doc),
                        "filename": file.filename,
                        "size_kb": round(os.path.getsize(file_path) / 1024, 1)
                    }
                    doc.close()
                except Exception as ex:
                    logger.error(f"Error reading uploaded pdf info: {ex}")
        return {"success": True, "paths": paths, "info_dict": info_dict}
    except Exception as e:
        logger.error(f"Error uploading temp files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/extract-images")
def extract_images_from_pdf(request: ExtractImagesRequest):
    try:
        items, zip_path, task_id = pdf_tools.extract_pdf_pages_to_images(
            pdf_path=request.pdf_path,
            range_spec=request.page_range,
            format_type=request.format_type,
            dpi=request.dpi
        )
        zip_url = f"/cache/tools/{task_id}/{os.path.basename(zip_path)}"
        return {"success": True, "items": items, "zip_url": zip_url, "task_id": task_id}
    except Exception as e:
        logger.error(f"Error extracting images: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/images-to-pdf")
def convert_images_to_pdf(request: ImagesToPdfRequest):
    try:
        output_path, url, size_mb = pdf_tools.images_to_pdf(
            image_paths=request.image_paths,
            output_filename=request.output_filename
        )
        return {"success": True, "url": url, "size_mb": size_mb, "filename": os.path.basename(output_path)}
    except Exception as e:
        logger.error(f"Error converting images to PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tools/split-pdf")
def split_pdf_multi_ranges(request: SplitPdfRequest):
    try:
        items, zip_path, task_id = pdf_tools.split_or_extract_pdf_ranges(
            pdf_path=request.pdf_path,
            range_spec=request.range_spec
        )
        zip_url = f"/cache/tools/{task_id}/{os.path.basename(zip_path)}"
        return {"success": True, "items": items, "zip_url": zip_url, "task_id": task_id}
    except Exception as e:
        logger.error(f"Error splitting PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools/download/{task_id}/{filename}")
def download_tool_file(task_id: str, filename: str):
    file_path = os.path.join(pdf_tools._get_tools_cache_dir(), task_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado en servidor")
    return FileResponse(path=file_path, filename=filename)

# Mount built React frontend static distribution if built
FRONTEND_DIST = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

class DesktopApi:
    def __init__(self):
        self.window = None

    def save_pdf_dialog(self, suggested_filename: str = "DocScan.pdf") -> str:
        """Opens native Windows Save As dialog and returns the selected filepath."""
        if not self.window:
            return ""
        try:
            import webview
            result = self.window.create_file_dialog(
                webview.SAVE_DIALOG,
                directory=os.path.expanduser("~"),
                save_filename=suggested_filename,
                file_types=("Documento PDF (*.pdf)", "Todos los archivos (*.*)")
            )
            if result and len(result) > 0:
                if isinstance(result, (list, tuple)):
                    return str(result[0])
                return str(result)
        except Exception as e:
            logger.error(f"Error opening pywebview save dialog: {e}")
        return ""

    def open_pdf_dialog(self) -> List[str]:
        """Opens native Windows Open File dialog for multiple PDFs and returns filepaths."""
        if not self.window:
            return []
        try:
            import webview
            result = self.window.create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=True,
                directory=os.path.expanduser("~"),
                file_types=("Documentos PDF (*.pdf)", "Todos los archivos (*.*)")
            )
            if result and len(result) > 0:
                if isinstance(result, (list, tuple)):
                    return [str(p) for p in result]
                return [str(result)]
        except Exception as e:
            logger.error(f"Error opening pywebview open dialog: {e}")
        return []

    def open_image_dialog(self) -> List[str]:
        """Opens native Windows Open File dialog for multiple images (PNG/JPG)."""
        if not self.window:
            return []
        try:
            import webview
            result = self.window.create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=True,
                directory=os.path.expanduser("~"),
                file_types=("Archivos de imagen (*.png;*.jpg;*.jpeg)", "Todos los archivos (*.*)")
            )
            if result and len(result) > 0:
                if isinstance(result, (list, tuple)):
                    return [str(p) for p in result]
                return [str(result)]
        except Exception as e:
            logger.error(f"Error opening pywebview image dialog: {e}")
        return []

desktop_api = DesktopApi()

def start_server():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def main():
    import sys
    if "--server-only" in sys.argv:
        import uvicorn
        logger.info("Starting Doc Scan API Server on http://127.0.0.1:8000")
        uvicorn.run("icanscan.main:app", host="127.0.0.1", port=8000, reload=False)
        return

    import threading
    import webview

    logger.info("Starting background FastAPI server thread...")
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give server 1.5 seconds to bind port cleanly
    time.sleep(1.5)
    
    logger.info("Launching Native Windows Desktop App Window (pywebview)...")
    window = webview.create_window(
        'Doc Scan PDF Scanner - Studio',
        'http://127.0.0.1:8000',
        width=1400,
        height=900,
        min_size=(1050, 650),
        background_color='#0b0d11',
        js_api=desktop_api
    )
    desktop_api.window = window
    webview.start()

if __name__ == "__main__":
    main()
