import os
import uuid
import zipfile
from typing import List, Tuple, Dict, Any
import fitz  # PyMuPDF
from PIL import Image
import img2pdf

def _get_tools_cache_dir() -> str:
    base = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", ".scans_cache", "tools")
    os.makedirs(base, exist_ok=True)
    return base

def parse_page_range(range_spec: str, total_pages: int) -> List[int]:
    """
    Parses a string like '1-3, 5, 7-10' or 'all'/'todas' into a sorted list of 1-indexed page numbers.
    """
    spec = (range_spec or "").strip().lower()
    if not spec or spec in ["all", "todas", "todo", "*"]:
        return list(range(1, total_pages + 1))
        
    pages = set()
    parts = spec.split(",")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            bounds = part.split("-")
            if len(bounds) == 2:
                try:
                    start = max(1, int(bounds[0].strip()))
                    end = min(total_pages, int(bounds[1].strip()))
                    if start <= end:
                        for p in range(start, end + 1):
                            pages.add(p)
                except ValueError:
                    continue
        else:
            try:
                p = int(part)
                if 1 <= p <= total_pages:
                    pages.add(p)
            except ValueError:
                continue
    return sorted(list(pages))

def parse_multi_ranges(range_spec: str, total_pages: int) -> List[Tuple[str, List[int]]]:
    """
    Parses a string like '1-3, 4, 5-10' into distinct range groups:
    [('1-3', [1, 2, 3]), ('4', [4]), ('5-10', [5, 6, 7, 8, 9, 10])]
    """
    spec = (range_spec or "").strip()
    if not spec:
        return [("1-" + str(total_pages), list(range(1, total_pages + 1)))]
        
    results = []
    parts = spec.split(",")
    for part in parts:
        part_clean = part.strip()
        if not part_clean:
            continue
        if "-" in part_clean:
            bounds = part_clean.split("-")
            if len(bounds) == 2:
                try:
                    start = max(1, int(bounds[0].strip()))
                    end = min(total_pages, int(bounds[1].strip()))
                    if start <= end:
                        pages = list(range(start, end + 1))
                        results.append((f"{start}-{end}", pages))
                except ValueError:
                    continue
        else:
            try:
                p = int(part_clean)
                if 1 <= p <= total_pages:
                    results.append((str(p), [p]))
            except ValueError:
                continue
    return results

def extract_pdf_pages_to_images(pdf_path: str, range_spec: str, format_type: str = "PNG", dpi: int = 300) -> Tuple[List[Dict[str, Any]], str, str]:
    """
    Extracts specified pages from a PDF as PNG/JPG images.
    Returns: (list_of_image_info, zip_path, task_id)
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
    task_id = uuid.uuid4().hex[:8]
    task_dir = os.path.join(_get_tools_cache_dir(), task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    page_nums = parse_page_range(range_spec, total_pages)
    
    if not page_nums:
        doc.close()
        raise ValueError("No se encontraron páginas válidas en el rango especificado.")
        
    ext = format_type.lower()
    if ext == "jpg":
        ext = "jpeg"
        
    extracted_items = []
    zip_path = os.path.join(task_dir, f"imagenes_extraidas_{task_id}.zip")
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for pnum in page_nums:
            page = doc.load_page(pnum - 1)
            # 300 DPI scaling factor (base is 72 pt)
            scale = dpi / 72.0
            matrix = fitz.Matrix(scale, scale)
            pix = page.get_pixmap(matrix=matrix, alpha=(ext == "png"))
            
            filename = f"pagina_{pnum}.{format_type.lower()}"
            filepath = os.path.join(task_dir, filename)
            
            if ext == "jpeg":
                # Convert to PIL to ensure clean RGB saving without alpha for JPEG
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                img.save(filepath, "JPEG", quality=95)
            else:
                pix.save(filepath)
                
            size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)
            extracted_items.append({
                "page_num": pnum,
                "filename": filename,
                "url": f"/cache/tools/{task_id}/{filename}",
                "size_mb": size_mb,
                "size_kb": round(os.path.getsize(filepath) / 1024, 1),
                "width": pix.width,
                "height": pix.height
            })
            zf.write(filepath, arcname=filename)
            
    doc.close()
    return extracted_items, zip_path, task_id

def images_to_pdf(image_paths: List[str], output_filename: str = "Imagenes_Unidas.pdf") -> Tuple[str, str, float]:
    """
    Concatenates multiple image files (PNG/JPG) into a single PDF.
    Returns: (output_pdf_path, url, size_mb)
    """
    if not image_paths:
        raise ValueError("No se proporcionaron imágenes para convertir a PDF.")
        
    task_id = uuid.uuid4().hex[:8]
    task_dir = os.path.join(_get_tools_cache_dir(), task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    if not output_filename.endswith(".pdf"):
        output_filename += ".pdf"
    output_path = os.path.join(task_dir, output_filename)
    
    # Try img2pdf first for lossless conversion
    try:
        # Check and convert any alpha/palette PNGs if img2pdf complains, or feed directly
        clean_paths = []
        for p in image_paths:
            if not os.path.exists(p):
                continue
            try:
                with Image.open(p) as img:
                    if img.mode in ("RGBA", "LA", "P"):
                        # Convert to RGB so img2pdf doesn't fail on alpha channel
                        rgb_img = img.convert("RGB")
                        clean_p = os.path.join(task_dir, f"clean_{os.path.basename(p)}.jpg")
                        rgb_img.save(clean_p, "JPEG", quality=95)
                        clean_paths.append(clean_p)
                    else:
                        clean_paths.append(p)
            except Exception:
                clean_paths.append(p)
                
        if clean_paths:
            with open(output_path, "wb") as f:
                f.write(img2pdf.convert(clean_paths))
    except Exception:
        # Fallback to PyMuPDF (fitz) or PIL if img2pdf fails
        doc = fitz.open()
        for p in image_paths:
            if not os.path.exists(p):
                continue
            with Image.open(p) as img:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                temp_jpg = os.path.join(task_dir, f"temp_{uuid.uuid4().hex[:6]}.jpg")
                img.save(temp_jpg, "JPEG", quality=95)
                
                img_doc = fitz.open(temp_jpg)
                pdf_bytes = img_doc.convert_to_pdf()
                img_doc.close()
                
                temp_pdf = fitz.open("pdf", pdf_bytes)
                doc.insert_pdf(temp_pdf)
                temp_pdf.close()
                if os.path.exists(temp_jpg):
                    os.remove(temp_jpg)
        doc.save(output_path)
        doc.close()
        
    size_mb = round(os.path.getsize(output_path) / (1024 * 1024), 2)
    url = f"/cache/tools/{task_id}/{output_filename}"
    return output_path, url, size_mb

def split_or_extract_pdf_ranges(pdf_path: str, range_spec: str) -> Tuple[List[Dict[str, Any]], str, str]:
    """
    Splits a PDF into multiple PDFs based on range specifications like '1-3, 4, 5-10'.
    Returns: (list_of_pdf_info, zip_path, task_id)
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
    task_id = uuid.uuid4().hex[:8]
    task_dir = os.path.join(_get_tools_cache_dir(), task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    range_groups = parse_multi_ranges(range_spec, total_pages)
    
    if not range_groups:
        doc.close()
        raise ValueError("No se especificaron rangos válidos para extraer.")
        
    extracted_pdfs = []
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    zip_path = os.path.join(task_dir, f"Extractos_{task_id}.zip")
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for label, page_nums in range_groups:
            if not page_nums:
                continue
            new_doc = fitz.open()
            for pnum in page_nums:
                new_doc.insert_pdf(doc, from_page=pnum - 1, to_page=pnum - 1)
                
            filename = f"{base_name}_paginas_{label}.pdf"
            filepath = os.path.join(task_dir, filename)
            new_doc.save(filepath)
            new_doc.close()
            
            size_mb = round(os.path.getsize(filepath) / (1024 * 1024), 2)
            extracted_pdfs.append({
                "label": f"Páginas {label}",
                "filename": filename,
                "url": f"/cache/tools/{task_id}/{filename}",
                "size_mb": size_mb,
                "size_kb": round(os.path.getsize(filepath) / 1024, 1),
                "page_count": len(page_nums)
            })
            zf.write(filepath, arcname=filename)
            
    doc.close()
    return extracted_pdfs, zip_path, task_id
