import os
import uuid
import zipfile
import fitz  # PyMuPDF
from PIL import Image
import io
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

COMPRESS_DIR = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", ".compress_cache")
os.makedirs(COMPRESS_DIR, exist_ok=True)

# In-memory registry of uploaded/compressed files during the session
COMPRESS_REGISTRY: Dict[str, Dict[str, Any]] = {}

def get_file_info(file_path: str, original_filename: str = "") -> Dict[str, Any]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    size_bytes = os.path.getsize(file_path)
    size_mb = round(size_bytes / (1024 * 1024), 2)
    
    page_count = 0
    try:
        doc = fitz.open(file_path)
        page_count = len(doc)
        doc.close()
    except Exception as e:
        logger.warning(f"Could not get page count for {file_path}: {e}")
    
    file_id = uuid.uuid4().hex[:8]
    filename = original_filename or os.path.basename(file_path)
    
    info = {
        "id": file_id,
        "filename": filename,
        "original_path": file_path,
        "original_size_bytes": size_bytes,
        "original_size_mb": size_mb,
        "exceeds_drive_25mb": size_mb > 25.0,
        "page_count": page_count,
        "compressed_path": None,
        "compressed_size_bytes": None,
        "compressed_size_mb": None,
        "status": "ready"  # ready, compressing, compressed, error
    }
    COMPRESS_REGISTRY[file_id] = info
    return info

def compress_pdf(file_id: str, mode: str = "drive_25mb") -> Dict[str, Any]:
    """
    Compresses the PDF identified by file_id using PyMuPDF.
    Modes:
      - 'drive_25mb': Targets reduction below 25 MB with structural cleanup and adaptive image recompression.
      - 'medium': Balanced quality and size reduction.
      - 'extreme': High compression for web sharing and light email attachments.
    """
    if file_id not in COMPRESS_REGISTRY:
        raise KeyError(f"File ID {file_id} not found in registry")
        
    info = COMPRESS_REGISTRY[file_id]
    input_path = info["original_path"]
    if not os.path.exists(input_path):
        raise FileNotFoundError("Original PDF file missing on disk")
        
    compressed_filename = f"{info['id']}_compressed_{info['filename']}"
    output_path = os.path.join(COMPRESS_DIR, compressed_filename)
    
    logger.info(f"Compressing {info['filename']} (Mode: {mode})...")
    info["status"] = "compressing"
    
    try:
        doc = fitz.open(input_path)
        
        # Determine target JPEG quality and downsample DPI based on mode and initial size
        jpg_quality = 85
        max_dimension = 2500
        
        if mode == "extreme":
            jpg_quality = 60
            max_dimension = 1500
        elif mode == "medium":
            jpg_quality = 75
            max_dimension = 2000
        elif mode == "drive_25mb":
            if info["original_size_mb"] > 50:
                jpg_quality = 65
                max_dimension = 1600
            elif info["original_size_mb"] > 25:
                jpg_quality = 75
                max_dimension = 1900
            else:
                jpg_quality = 82
                max_dimension = 2200

        # Step 1: Re-encode heavy raster images inside the document if mode requires or exceeds limit
        if mode in ["extreme", "medium", "drive_25mb"]:
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                for img_info in image_list:
                    xref = img_info[0]
                    try:
                        base_img = doc.extract_image(xref)
                        if not base_img:
                            continue
                        image_bytes = base_img["image"]
                        
                        # Open with PIL
                        pil_img = Image.open(io.BytesIO(image_bytes))
                        w, h = pil_img.size
                        
                        # Downscale if larger than max_dimension
                        if w > max_dimension or h > max_dimension:
                            ratio = min(max_dimension / w, max_dimension / h)
                            new_w, new_h = int(w * ratio), int(h * ratio)
                            pil_img = pil_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        
                        # Convert to RGB if needed and re-encode to JPEG
                        if pil_img.mode in ("RGBA", "P"):
                            pil_img = pil_img.convert("RGB")
                            
                        out_buf = io.BytesIO()
                        pil_img.save(out_buf, format="JPEG", quality=jpg_quality, optimize=True)
                        compressed_img_bytes = out_buf.getvalue()
                        
                        # Only replace if new bytes are smaller than original bytes
                        if len(compressed_img_bytes) < len(image_bytes):
                            page.replace_image(xref, stream=compressed_img_bytes)
                    except Exception as img_err:
                        logger.warning(f"Could not recompress image xref {xref} on page {page_num}: {img_err}")

        # Step 2: Save with garbage collection and deflation
        doc.save(
            output_path,
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=True
        )
        doc.close()
        
        # Verify size
        if os.path.exists(output_path):
            comp_bytes = os.path.getsize(output_path)
            comp_mb = round(comp_bytes / (1024 * 1024), 2)
            
            info["compressed_path"] = output_path
            info["compressed_size_bytes"] = comp_bytes
            info["compressed_size_mb"] = comp_mb
            info["status"] = "compressed"
            logger.info(f"Compressed {info['filename']}: {info['original_size_mb']} MB -> {comp_mb} MB")
            return info
        else:
            raise RuntimeError("Output file was not generated by PyMuPDF")
            
    except Exception as e:
        logger.error(f"Compression failed for {info['filename']}: {e}", exc_info=True)
        info["status"] = "error"
        raise

def create_zip_archive(file_ids: List[str], archive_name: str = "Documentos_Comprimidos.zip") -> str:
    """
    Creates a ZIP archive containing all compressed PDFs for the provided file IDs.
    Returns the absolute path to the ZIP file.
    """
    if not file_ids:
        raise ValueError("No file IDs provided for ZIP creation")
        
    zip_path = os.path.join(COMPRESS_DIR, archive_name)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fid in file_ids:
            if fid in COMPRESS_REGISTRY:
                info = COMPRESS_REGISTRY[fid]
                target_file = info.get("compressed_path") or info.get("original_path")
                if target_file and os.path.exists(target_file):
                    # Use clean filename inside ZIP
                    arcname = f"comprimido_{info['filename']}" if info.get("compressed_path") else info['filename']
                    zf.write(target_file, arcname)
                    
    if os.path.exists(zip_path):
        return zip_path
    raise RuntimeError("Failed to generate ZIP archive")
