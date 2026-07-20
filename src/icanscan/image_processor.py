import os
import io
import logging
from typing import List, Dict, Any, Optional
from PIL import Image, ImageEnhance
import img2pdf

logger = logging.getLogger(__name__)

def apply_adjustments(
    original_path: str,
    output_path: str,
    rotation: int = 0,
    brightness: float = 0.0,
    contrast: float = 0.0,
    bw_filter: bool = False
) -> str:
    """
    Applies non-destructive visual adjustments to the original scan image
    and saves the processed preview image.
    """
    if not os.path.exists(original_path):
        raise FileNotFoundError(f"Original image not found: {original_path}")
        
    img = Image.open(original_path).convert("RGB")
    
    # 1. Rotation (expand=True ensures no cropping during 90/180/270 rotations)
    if rotation % 360 != 0:
        # PIL rotate goes counter-clockwise for positive values, or clockwise for negative.
        # Standard UI rotation controls usually rotate clockwise: 90 CW = -90 in PIL
        img = img.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC)
        
    # 2. Brightness (-100 to +100 -> factor 0.0 to 2.0 where 1.0 is original)
    if brightness != 0.0:
        factor = max(0.0, min(3.0, 1.0 + (brightness / 100.0)))
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(factor)
        
    # 3. Contrast (-100 to +100 -> factor 0.0 to 2.0 where 1.0 is original)
    if contrast != 0.0:
        factor = max(0.0, min(3.0, 1.0 + (contrast / 100.0)))
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(factor)
        
    # 4. B&W Threshold filter (Ultra sharp black and white text document mode)
    if bw_filter:
        gray = img.convert("L")
        # Threshold at 140 for crisp document typography
        threshold = 140
        img = gray.point(lambda x: 255 if x > threshold else 0, mode="1").convert("RGB")
        
    # Save processed image with high quality PNG
    img.save(output_path, format="PNG", optimize=False)
    return output_path

def export_to_pdf(page_paths: List[str], output_pdf_path: str, quality_mode: str = "lossless", dpis: Optional[List[int]] = None) -> str:
    """
    Export an ordered list of image file paths into a multi-page PDF document.
    Uses img2pdf for exact lossless embedding or optimized JPEG conversion.
    """
    if not page_paths:
        raise ValueError("No pages provided for PDF export")
        
    valid_paths = [p for p in page_paths if os.path.exists(p)]
    if not valid_paths:
        raise ValueError("None of the specified page image paths exist on disk")
        
    os.makedirs(os.path.dirname(os.path.abspath(output_pdf_path)), exist_ok=True)
    
    if quality_mode == "lossless":
        logger.info(f"Generating Lossless PDF with {len(valid_paths)} pages using img2pdf...")
        # img2pdf embeds PNG/JPEG directly without loss
        with open(output_pdf_path, "wb") as f_out:
            f_out.write(img2pdf.convert(valid_paths))
    else:
        logger.info(f"Generating High Quality (Optimized) PDF with {len(valid_paths)} pages...")
        # For optimized mode, convert PNGs to high-quality JPEGs in memory before converting with img2pdf
        jpeg_buffers = []
        for p in valid_paths:
            img = Image.open(p).convert("RGB")
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=92, optimize=True)
            buf.seek(0)
            jpeg_buffers.append(buf.read())
            
        with open(output_pdf_path, "wb") as f_out:
            f_out.write(img2pdf.convert(jpeg_buffers))
            
    return output_pdf_path
