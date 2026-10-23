"""
PDF Operation Engine for Sejda Reverse-Engineered PDF Editor.
Handles coordinate transformation, page manipulation, text editing,
vector drawing, signatures, images, whiteout, annotations, and export validation.
"""

import os
import io
import re
import base64
import uuid
from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
from PIL import Image

def normalize_pdf_font(raw_font_name: str, flags: int = 0) -> Tuple[str, bool, bool, float]:
    """
    Cleans PDF font names (e.g. 'ABCDEF+Impact', 'Times New Roman,Bold', 'LiberationSerif-Italic', 'Calibri')
    and extracts normalized font family, is_bold, is_italic, and ascender ratio.
    """
    if not raw_font_name:
        return "Helvetica", False, False, 0.72

    cleaned = re.sub(r'^[A-Z]{6}\+', '', raw_font_name).strip()
    fn_low = cleaned.lower()

    # PyMuPDF dict flags: bit 0: super, bit 1: italic, bit 2: serif, bit 3: mono, bit 4: bold
    is_bold = bool(flags & 16) or any(w in fn_low for w in ["bold", "black", "heavy", "semibold", "bolder"])
    is_italic = bool(flags & 2) or any(w in fn_low for w in ["italic", "oblique", "slanted"])
    is_mono = bool(flags & 8) or any(w in fn_low for w in ["mono", "courier", "consolas", "typewriter"])
    is_serif = bool(flags & 4) or any(w in fn_low for w in ["serif", "times", "roman", "georgia", "cambria", "palatino", "garamond"])

    if "impact" in fn_low:
        family = "Impact"
        ascender = 0.85
    elif "times" in fn_low or "roman" in fn_low or "nimbus" in fn_low:
        family = "Times New Roman"
        ascender = 0.75
    elif "georgia" in fn_low:
        family = "Georgia"
        ascender = 0.76
    elif "cambria" in fn_low:
        family = "Cambria"
        ascender = 0.75
    elif "garamond" in fn_low:
        family = "Garamond"
        ascender = 0.74
    elif "palatino" in fn_low or "antiqua" in fn_low:
        family = "Palatino"
        ascender = 0.75
    elif "calibri" in fn_low or "carlito" in fn_low:
        family = "Calibri"
        ascender = 0.75
    elif "courier" in fn_low or is_mono:
        family = "Courier New"
        ascender = 0.71
    elif "consolas" in fn_low:
        family = "Consolas"
        ascender = 0.72
    elif "verdana" in fn_low:
        family = "Verdana"
        ascender = 0.74
    elif "trebuchet" in fn_low:
        family = "Trebuchet MS"
        ascender = 0.74
    elif "tahoma" in fn_low:
        family = "Tahoma"
        ascender = 0.74
    elif "roboto" in fn_low:
        family = "Roboto"
        ascender = 0.75
    elif "open sans" in fn_low or "opensans" in fn_low:
        family = "Open Sans"
        ascender = 0.75
    elif "lato" in fn_low:
        family = "Lato"
        ascender = 0.75
    elif "arial" in fn_low or "liberationsans" in fn_low:
        family = "Arial"
        ascender = 0.73
    elif "helvetica" in fn_low:
        family = "Helvetica"
        ascender = 0.72
    elif is_serif:
        family = "Times New Roman"
        ascender = 0.75
    else:
        base_name = cleaned.split(",")[0].split("-")[0].strip()
        family = base_name if len(base_name) > 2 else "Arial"
        ascender = 0.73

    return family, is_bold, is_italic, ascender

def get_font_file_or_builtin(family: str, is_bold: bool, is_italic: bool) -> Tuple[Optional[str], Optional[str]]:
    """Resolves font family to high-fidelity macOS system fontfile if present, or standard 14 PDF builtin."""
    supp = "/System/Library/Fonts/Supplemental"
    fam_low = family.lower()

    fontfile = None
    if "impact" in fam_low:
        p = f"{supp}/Impact.ttf"
        if os.path.exists(p):
            fontfile = p
    elif "times" in fam_low:
        if is_bold and is_italic:
            p = f"{supp}/Times New Roman Bold Italic.ttf"
        elif is_bold:
            p = f"{supp}/Times New Roman Bold.ttf"
        elif is_italic:
            p = f"{supp}/Times New Roman Italic.ttf"
        else:
            p = f"{supp}/Times New Roman.ttf"
        if os.path.exists(p):
            fontfile = p
    elif "arial" in fam_low:
        if is_bold and is_italic:
            p = f"{supp}/Arial Bold Italic.ttf"
        elif is_bold:
            p = f"{supp}/Arial Bold.ttf"
        elif is_italic:
            p = f"{supp}/Arial Italic.ttf"
        else:
            p = f"{supp}/Arial.ttf"
        if os.path.exists(p):
            fontfile = p
    elif "georgia" in fam_low:
        if is_bold and is_italic:
            p = f"{supp}/Georgia Bold Italic.ttf"
        elif is_bold:
            p = f"{supp}/Georgia Bold.ttf"
        elif is_italic:
            p = f"{supp}/Georgia Italic.ttf"
        else:
            p = f"{supp}/Georgia.ttf"
        if os.path.exists(p):
            fontfile = p
    elif "verdana" in fam_low:
        if is_bold and is_italic:
            p = f"{supp}/Verdana Bold Italic.ttf"
        elif is_bold:
            p = f"{supp}/Verdana Bold.ttf"
        elif is_italic:
            p = f"{supp}/Verdana Italic.ttf"
        else:
            p = f"{supp}/Verdana.ttf"
        if os.path.exists(p):
            fontfile = p
    elif "courier" in fam_low:
        if is_bold and is_italic:
            p = f"{supp}/Courier New Bold Italic.ttf"
        elif is_bold:
            p = f"{supp}/Courier New Bold.ttf"
        elif is_italic:
            p = f"{supp}/Courier New Italic.ttf"
        else:
            p = f"{supp}/Courier New.ttf"
        if os.path.exists(p):
            fontfile = p

    if fontfile:
        return fontfile, None

    # Fallback to standard 14 PDF fonts
    if "times" in fam_low or "georgia" in fam_low or "roman" in fam_low or "serif" in fam_low:
        builtin = "tibi" if is_bold and is_italic else ("tibo" if is_bold else ("tiit" if is_italic else "tiro"))
    elif "courier" in fam_low or "mono" in fam_low:
        builtin = "cobi" if is_bold and is_italic else ("cobo" if is_bold else ("coit" if is_italic else "cour"))
    else:
        builtin = "hebi" if is_bold and is_italic else ("hebo" if is_bold else ("heit" if is_italic else "helv"))
    return None, builtin

class PDFEngine:
    def __init__(self, storage_dir: str = "storage"):
        self.storage_dir = storage_dir
        self.uploads_dir = os.path.join(storage_dir, "uploads")
        self.exports_dir = os.path.join(storage_dir, "exports")
        self.renders_dir = os.path.join(storage_dir, "renders")
        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.exports_dir, exist_ok=True)
        os.makedirs(self.renders_dir, exist_ok=True)

    def save_uploaded_file(self, file_bytes: bytes, filename: str) -> Tuple[str, str]:
        """Saves uploaded PDF bytes and returns (session_id, filepath)."""
        session_id = str(uuid.uuid4())
        safe_name = f"{session_id}_{filename}"
        filepath = os.path.join(self.uploads_dir, safe_name)
        with open(filepath, "wb") as f:
            f.write(file_bytes)
        return session_id, filepath

    def create_blank_pdf(self, pages: int = 1, width: float = 612, height: float = 792) -> Tuple[str, str]:
        """Creates a new blank PDF document (default US Letter 612x792 pt)."""
        session_id = str(uuid.uuid4())
        filepath = os.path.join(self.uploads_dir, f"{session_id}_blank.pdf")
        doc = fitz.open()
        for _ in range(pages):
            doc.new_page(width=width, height=height)
        doc.save(filepath)
        doc.close()
        return session_id, filepath

    def get_document_info(self, filepath: str) -> Dict[str, Any]:
        """Extracts comprehensive metadata, page dimensions, text spans with exact typography, and structure."""
        doc = fitz.open(filepath)
        pages_info = []
        for i, page in enumerate(doc):
            rect = page.rect
            text_dict = page.get_text("dict")
            spans = []
            span_counter = 0

            for b in text_dict.get("blocks", []):
                if "lines" in b:
                    for l in b["lines"]:
                        spans_in_line = l.get("spans", [])
                        if not spans_in_line:
                            continue

                        current_cluster = None
                        line_clusters = []

                        for s in spans_in_line:
                            text = s.get("text", "")
                            if not text:
                                continue

                            font_name = s.get("font", "Helvetica")
                            flags = s.get("flags", 0)
                            mapped_font, is_bold, is_italic, norm_ascent = normalize_pdf_font(font_name, flags)

                            int_c = s.get("color", 0)
                            r = (int_c >> 16) & 255
                            g = (int_c >> 8) & 255
                            b_c = int_c & 255
                            hex_c = f"#{r:02x}{g:02x}{b_c:02x}"
                            size = round(s.get("size", 12), 2)
                            origin = s.get("origin", (s["bbox"][0], s["bbox"][3]))
                            s_bbox = [round(x, 2) for x in s["bbox"]]
                            exact_ascent = norm_ascent
                            exact_descent = round((s_bbox[3] - origin[1]) / max(1.0, size), 4) if size > 0 else 0.2

                            style_key = (mapped_font, size, is_bold, is_italic, hex_c)

                            if current_cluster is None:
                                current_cluster = {
                                    "text": text,
                                    "font": mapped_font,
                                    "size": size,
                                    "bold": is_bold,
                                    "italic": is_italic,
                                    "color": hex_c,
                                    "bbox": s_bbox,
                                    "origin": [round(origin[0], 2), round(origin[1], 2)],
                                    "ascender": exact_ascent,
                                    "descender": exact_descent,
                                    "style_key": style_key,
                                }
                            else:
                                prev_x1 = current_cluster["bbox"][2]
                                curr_x0 = s_bbox[0]
                                curr_baseline = origin[1]
                                prev_baseline = current_cluster["origin"][1]

                                can_merge = (
                                    current_cluster["style_key"] == style_key and
                                    abs(curr_baseline - prev_baseline) < 1.0 and
                                    curr_x0 >= prev_x1 - 1.5 and
                                    (curr_x0 - prev_x1) < (size * 1.5)
                                )

                                if can_merge:
                                    current_cluster["text"] += text
                                    current_cluster["bbox"][2] = max(current_cluster["bbox"][2], s_bbox[2])
                                    current_cluster["bbox"][3] = max(current_cluster["bbox"][3], s_bbox[3])
                                    current_cluster["bbox"][1] = min(current_cluster["bbox"][1], s_bbox[1])
                                else:
                                    line_clusters.append(current_cluster)
                                    current_cluster = {
                                        "text": text,
                                        "font": mapped_font,
                                        "size": size,
                                        "bold": is_bold,
                                        "italic": is_italic,
                                        "color": hex_c,
                                        "bbox": s_bbox,
                                        "origin": [round(origin[0], 2), round(origin[1], 2)],
                                        "ascender": exact_ascent,
                                        "descender": exact_descent,
                                        "style_key": style_key,
                                    }

                        if current_cluster:
                            line_clusters.append(current_cluster)

                        for cl in line_clusters:
                            txt = cl["text"]
                            if not txt.strip():
                                continue
                            spans.append({
                                "id": f"sp_{i}_{span_counter}",
                                "bbox": cl["bbox"],
                                "origin": cl["origin"],
                                "ascender": cl["ascender"],
                                "descender": cl["descender"],
                                "text": txt,
                                "size": cl["size"],
                                "font": cl["font"],
                                "color": cl["color"],
                                "bold": cl["bold"],
                                "italic": cl["italic"],
                            })
                            span_counter += 1

            pages_info.append({
                "page_num": i + 1,
                "width": round(rect.width, 2),
                "height": round(rect.height, 2),
                "rotation": page.rotation,
                "text_blocks": spans[:2000]  # Rich span-level text elements
            })

        info = {
            "num_pages": len(doc),
            "title": doc.metadata.get("title", "") or os.path.basename(filepath),
            "author": doc.metadata.get("author", ""),
            "is_encrypted": doc.is_encrypted,
            "pages": pages_info
        }
        doc.close()
        return info

    def render_page_image(self, filepath: str, page_num: int, scale: float = 1.5) -> bytes:
        """Renders a PDF page to sharp PNG bytes."""
        doc = fitz.open(filepath)
        if page_num < 1 or page_num > len(doc):
            doc.close()
            raise ValueError(f"Page {page_num} out of bounds (1-{len(doc)})")
        
        page = doc[page_num - 1]
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes

    def render_page_thumbnail(self, filepath: str, page_num: int, width: int = 180) -> bytes:
        """Renders a quick low-overhead thumbnail for navigation drawer."""
        doc = fitz.open(filepath)
        page = doc[page_num - 1]
        scale = width / page.rect.width
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes

    @staticmethod
    def parse_hex_color(color_str: str) -> Tuple[float, float, float]:
        """Converts '#RRGGBB' or rgb() to normalized (r, g, b) floats in [0, 1]."""
        if not color_str:
            return (0.0, 0.0, 0.0)
        c = color_str.strip()
        if c.startswith("#"):
            c = c.lstrip("#")
            if len(c) == 3:
                c = "".join([x*2 for x in c])
            if len(c) >= 6:
                r = int(c[0:2], 16) / 255.0
                g = int(c[2:4], 16) / 255.0
                b = int(c[4:6], 16) / 255.0
                return (r, g, b)
        return (0.0, 0.0, 0.0)

    def apply_modifications_and_export(
        self,
        source_filepath: str,
        export_filename: str,
        page_sequence: List[Dict[str, Any]],
        elements: List[Dict[str, Any]]
    ) -> Tuple[str, int]:
        """
        Core PDF compilation pipeline.
        Applies page reordering, deletions, rotations, and renders all delta elements:
        - Text insertion & editing
        - Images & Stamps
        - Signatures (vector or raster)
        - Shapes (Rectangles, Ellipses, Lines, Arrows)
        - Whiteout
        - Annotations (Highlight, Underline, Strikeout)
        - Freehand vector drawing
        """
        source_doc = fitz.open(source_filepath)
        out_doc = fitz.open()

        # Step 1: Reconstruct page sequence and rotations
        # page_sequence: [{'original_page': 1, 'rotation': 0, 'is_new_blank': False, 'width': 612, 'height': 792}, ...]
        page_mapping = {}  # new_page_index -> config

        for new_idx, pcfg in enumerate(page_sequence):
            orig_p = pcfg.get("original_page")
            rot = pcfg.get("rotation", 0)
            is_blank = pcfg.get("is_new_blank", False)

            if is_blank or orig_p is None or orig_p < 1 or orig_p > len(source_doc):
                w = pcfg.get("width", 612)
                h = pcfg.get("height", 792)
                out_page = out_doc.new_page(width=w, height=h)
            else:
                out_doc.insert_pdf(source_doc, from_page=orig_p - 1, to_page=orig_p - 1)
                out_page = out_doc[new_idx]

            if rot != 0:
                out_page.set_rotation((out_page.rotation + rot) % 360)
            
            page_mapping[new_idx + 1] = pcfg

        source_doc.close()

        # Step 2: Apply overlay elements grouped by target page
        elements_by_page: Dict[int, List[Dict[str, Any]]] = {}
        for el in elements:
            p = el.get("page", 1)
            elements_by_page.setdefault(p, []).append(el)

        for p_num, page_elements in elements_by_page.items():
            if p_num < 1 or p_num > len(out_doc):
                continue
            
            page = out_doc[p_num - 1]
            page_w = page.rect.width
            page_h = page.rect.height

            for el in page_elements:
                el_type = el.get("type", "")
                
                # --- 1. WHITEOUT ---
                if el_type == "whiteout":
                    x = float(el.get("x", 0))
                    y = float(el.get("y", 0))
                    w = float(el.get("width", 0))
                    h = float(el.get("height", 0))
                    rect = fitz.Rect(x, y, x + w, y + h)
                    page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)

                # --- 2. TEXT EDITING (EXISTING TEXT) ---
                elif el_type == "text_edit":
                    bbox = el.get("original_bbox", [el.get("x", 0), el.get("y", 0), el.get("x", 0) + el.get("width", 100), el.get("y", 0) + el.get("height", 20)])
                    # True PDF Redaction: permanently strips original text stream characters and fills with white
                    whiteout_rect = fitz.Rect(bbox[0] - 0.5, bbox[1] - 0.5, bbox[2] + 0.5, bbox[3] + 0.5)
                    page.add_redact_annot(whiteout_rect, fill=(1, 1, 1))
                    page.apply_redactions()
                    
                    # Insert replacement text if non-empty
                    text = el.get("text", "")
                    if text.strip():
                        size = float(el.get("size", 12))
                        color = self.parse_hex_color(el.get("color", "#000000"))
                        font_family = el.get("font", "Helvetica")
                        is_bold = bool(el.get("bold"))
                        is_italic = bool(el.get("italic"))
                        fontfile, builtin_fontname = get_font_file_or_builtin(font_family, is_bold, is_italic)

                        if fontfile:
                            try:
                                font_obj = fitz.Font(fontfile=fontfile)
                            except Exception:
                                font_obj = fitz.Font(builtin_fontname or "helv")
                                fontfile = None
                        else:
                            font_obj = fitz.Font(builtin_fontname or "helv")

                        x = float(el.get("x", bbox[0]))
                        target_w = float(el.get("width", bbox[2] - bbox[0]))
                        orig_origin = el.get("origin")
                        if orig_origin and len(orig_origin) >= 2:
                            baseline_y = float(orig_origin[1])
                        else:
                            baseline_y = y + size * 0.82
                        align = el.get("align", "left")
                        line_height_mult = float(el.get("line_height", 1.15))
                        has_underline = bool(el.get("underline"))
                        has_strike = bool(el.get("strikethrough"))
                        
                        # Handle multiline text replacement cleanly
                        lines = text.split("\n")
                        for l_idx, line_str in enumerate(lines):
                            if not line_str:
                                continue
                            line_w = font_obj.text_length(line_str, fontsize=size)
                            if align == "center":
                                line_x = x + max(0, (target_w - line_w) / 2)
                            elif align == "right":
                                line_x = x + max(0, target_w - line_w)
                            else:
                                line_x = x

                            curr_baseline_y = baseline_y + (l_idx * size * line_height_mult)
                            point = fitz.Point(line_x, curr_baseline_y)
                            if fontfile:
                                page.insert_text(point, line_str, fontsize=size, fontfile=fontfile, color=color, overlay=True)
                            else:
                                page.insert_text(point, line_str, fontsize=size, fontname=builtin_fontname or "helv", color=color, overlay=True)

                            if has_underline:
                                page.draw_line(
                                    fitz.Point(line_x, curr_baseline_y + 2),
                                    fitz.Point(line_x + line_w, curr_baseline_y + 2),
                                    color=color,
                                    width=max(1.0, size / 14),
                                    overlay=True
                                )
                            if has_strike:
                                page.draw_line(
                                    fitz.Point(line_x, curr_baseline_y - (size * 0.3)),
                                    fitz.Point(line_x + line_w, curr_baseline_y - (size * 0.3)),
                                    color=color,
                                    width=max(1.0, size / 14),
                                    overlay=True
                                )

                # --- 3. ADD NEW TEXT ---
                elif el_type == "text":
                    text = el.get("text", "")
                    if not text.strip():
                        continue
                    x = float(el.get("x", 0))
                    y = float(el.get("y", 0))
                    target_w = float(el.get("width", 0)) or 150
                    size = float(el.get("size", 14))
                    color = self.parse_hex_color(el.get("color", "#000000"))
                    font_family = el.get("font", "Helvetica")
                    is_bold = bool(el.get("bold"))
                    is_italic = bool(el.get("italic"))
                    fontfile, builtin_fontname = get_font_file_or_builtin(font_family, is_bold, is_italic)

                    if fontfile:
                        try:
                            font_obj = fitz.Font(fontfile=fontfile)
                        except Exception:
                            font_obj = fitz.Font(builtin_fontname or "helv")
                            fontfile = None
                    else:
                        font_obj = fitz.Font(builtin_fontname or "helv")

                    baseline_y = y + size * 0.85
                    align = el.get("align", "left")
                    line_height_mult = float(el.get("line_height", 1.15))
                    has_underline = bool(el.get("underline"))
                    has_strike = bool(el.get("strikethrough"))

                    lines = text.split("\n")
                    for l_idx, line_str in enumerate(lines):
                        if not line_str:
                            continue
                        line_w = font_obj.text_length(line_str, fontsize=size)
                        if align == "center":
                            line_x = x + max(0, (target_w - line_w) / 2)
                        elif align == "right":
                            line_x = x + max(0, target_w - line_w)
                        else:
                            line_x = x

                        curr_baseline_y = baseline_y + (l_idx * size * line_height_mult)
                        point = fitz.Point(line_x, curr_baseline_y)
                        if fontfile:
                            page.insert_text(point, line_str, fontsize=size, fontfile=fontfile, color=color, overlay=True)
                        else:
                            page.insert_text(point, line_str, fontsize=size, fontname=builtin_fontname or "helv", color=color, overlay=True)

                        if has_underline:
                            page.draw_line(
                                fitz.Point(line_x, curr_baseline_y + 2),
                                fitz.Point(line_x + line_w, curr_baseline_y + 2),
                                color=color,
                                width=max(1.0, size / 14),
                                overlay=True
                            )
                        if has_strike:
                            page.draw_line(
                                fitz.Point(line_x, curr_baseline_y - (size * 0.3)),
                                fitz.Point(line_x + line_w, curr_baseline_y - (size * 0.3)),
                                color=color,
                                width=max(1.0, size / 14),
                                overlay=True
                            )

                # --- 4. IMAGE INSERTION & STAMPS ---
                elif el_type in ["image", "stamp"]:
                    data_url = el.get("data_url", "")
                    if data_url and "," in data_url:
                        header, b64_data = data_url.split(",", 1)
                        img_bytes = base64.b64decode(b64_data)
                        x = float(el.get("x", 0))
                        y = float(el.get("y", 0))
                        w = float(el.get("width", 150))
                        h = float(el.get("height", 100))
                        rect = fitz.Rect(x, y, x + w, y + h)
                        page.insert_image(rect, stream=img_bytes, overlay=True)

                # --- 5. SIGNATURE ---
                elif el_type == "signature":
                    data_url = el.get("data_url", "")
                    if data_url and "," in data_url:
                        header, b64_data = data_url.split(",", 1)
                        img_bytes = base64.b64decode(b64_data)
                        x = float(el.get("x", 0))
                        y = float(el.get("y", 0))
                        w = float(el.get("width", 160))
                        h = float(el.get("height", 60))
                        rect = fitz.Rect(x, y, x + w, y + h)
                        page.insert_image(rect, stream=img_bytes, overlay=True)

                # --- 6. SHAPES (RECTANGLE, ELLIPSE, LINE, ARROW) ---
                elif el_type == "shape":
                    shape_kind = el.get("shape_type", "rectangle")
                    x = float(el.get("x", 0))
                    y = float(el.get("y", 0))
                    w = float(el.get("width", 100))
                    h = float(el.get("height", 60))
                    stroke_color = self.parse_hex_color(el.get("stroke_color", "#000000"))
                    fill_hex = el.get("fill_color")
                    fill_color = self.parse_hex_color(fill_hex) if fill_hex and fill_hex != "transparent" else None
                    stroke_w = float(el.get("stroke_width", 2))

                    rect = fitz.Rect(x, y, x + w, y + h)
                    
                    if shape_kind == "rectangle":
                        page.draw_rect(rect, color=stroke_color, fill=fill_color, width=stroke_w, overlay=True)
                    elif shape_kind == "ellipse":
                        page.draw_oval(rect, color=stroke_color, fill=fill_color, width=stroke_w, overlay=True)
                    elif shape_kind == "line":
                        p1 = fitz.Point(x, y)
                        p2 = fitz.Point(x + w, y + h)
                        page.draw_line(p1, p2, color=stroke_color, width=stroke_w, overlay=True)
                    elif shape_kind == "arrow":
                        p1 = fitz.Point(x, y)
                        p2 = fitz.Point(x + w, y + h)
                        page.draw_line(p1, p2, color=stroke_color, width=stroke_w, overlay=True)
                        # Draw arrowhead at p2
                        import math
                        angle = math.atan2(h, w)
                        arrow_len = 10
                        arrow_angle = math.pi / 6
                        p_left = fitz.Point(p2.x - arrow_len * math.cos(angle - arrow_angle), p2.y - arrow_len * math.sin(angle - arrow_angle))
                        p_right = fitz.Point(p2.x - arrow_len * math.cos(angle + arrow_angle), p2.y - arrow_len * math.sin(angle + arrow_angle))
                        page.draw_line(p2, p_left, color=stroke_color, width=stroke_w, overlay=True)
                        page.draw_line(p2, p_right, color=stroke_color, width=stroke_w, overlay=True)

                # --- 7. FREEHAND DRAWING ---
                elif el_type == "draw":
                    points = el.get("points", [])
                    if len(points) >= 2:
                        color = self.parse_hex_color(el.get("color", "#000000"))
                        stroke_w = float(el.get("stroke_width", 2))
                        shape = page.new_shape()
                        fitz_points = [fitz.Point(pt[0], pt[1]) for pt in points]
                        shape.draw_polyline(fitz_points)
                        shape.finish(color=color, width=stroke_w, stroke_opacity=1.0)
                        shape.commit(overlay=True)

                # --- 8. ANNOTATIONS: HIGHLIGHT, UNDERLINE, STRIKETHROUGH ---
                elif el_type in ["highlight", "underline", "strikeout"]:
                    rects = el.get("rects", [])
                    color = self.parse_hex_color(el.get("color", "#FFD500"))
                    
                    if not rects:
                        # Fallback to bounding box
                        x = float(el.get("x", 0))
                        y = float(el.get("y", 0))
                        w = float(el.get("width", 100))
                        h = float(el.get("height", 15))
                        rects = [[x, y, x + w, y + h]]

                    for r in rects:
                        frect = fitz.Rect(r[0], r[1], r[2], r[3])
                        if el_type == "highlight":
                            annot = page.add_highlight_annot(frect)
                            annot.set_colors(stroke=color)
                            annot.update()
                        elif el_type == "underline":
                            annot = page.add_underline_annot(frect)
                            annot.set_colors(stroke=color)
                            annot.update()
                        elif el_type == "strikeout":
                            annot = page.add_strikeout_annot(frect)
                            annot.set_colors(stroke=color)
                            annot.update()

        # Save to output file
        export_id = str(uuid.uuid4())
        safe_export_name = f"{export_id}_{export_filename}"
        if not safe_export_name.lower().endswith(".pdf"):
            safe_export_name += ".pdf"
        out_filepath = os.path.join(self.exports_dir, safe_export_name)
        out_doc.save(out_filepath, garbage=3, deflate=True)
        size_bytes = os.path.getsize(out_filepath)
        out_doc.close()

        return out_filepath, size_bytes

    def verify_pdf_integrity(self, filepath: str) -> Dict[str, Any]:
        """Validates that a generated PDF is readable, healthy, and not corrupted."""
        try:
            doc = fitz.open(filepath)
            num_pages = len(doc)
            is_valid = num_pages > 0 and not doc.is_closed
            
            # Verify each page loads pixmap without segfault or error
            pages_status = []
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=36)
                pages_status.append({
                    "page": i + 1,
                    "width": page.rect.width,
                    "height": page.rect.height,
                    "rotation": page.rotation,
                    "rendered_ok": pix.width > 0 and pix.height > 0
                })
            doc.close()
            return {
                "valid": is_valid,
                "num_pages": num_pages,
                "pages": pages_status,
                "file_size": os.path.getsize(filepath),
                "error": None
            }
        except Exception as e:
            return {
                "valid": False,
                "num_pages": 0,
                "pages": [],
                "file_size": 0,
                "error": str(e)
            }
