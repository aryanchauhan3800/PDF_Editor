"""
Comprehensive automated test suite for Sejda Reverse-Engineered PDF Editor.
Verifies Phase 5 coordinate accuracy, Phase 6 operations, and Phase 7 AI Assistant tools.
"""

import os
import pytest
import fitz
from pdf_engine import PDFEngine
from ai_agent import AIAssistantEngine, StructuredPDFTools
from create_test_pdfs import generate_test_pdfs

@pytest.fixture(scope="module")
def setup_environment():
    test_dir = "test_artifacts"
    os.makedirs(test_dir, exist_ok=True)
    generate_test_pdfs(output_dir=test_dir)
    engine = PDFEngine(storage_dir=os.path.join(test_dir, "engine_storage"))
    ai = AIAssistantEngine()
    return {
        "test_dir": test_dir,
        "engine": engine,
        "ai": ai,
        "doc1": os.path.join(test_dir, "normal_multi_page.pdf"),
        "doc2": os.path.join(test_dir, "mixed_dimensions_rotated.pdf")
    }

def test_document_info_and_rendering(setup_environment):
    env = setup_environment
    engine: PDFEngine = env["engine"]
    doc1_path = env["doc1"]

    info = engine.get_document_info(doc1_path)
    assert info["num_pages"] == 3
    assert len(info["pages"]) == 3
    assert info["pages"][0]["width"] == 612
    assert info["pages"][0]["height"] == 792
    assert len(info["pages"][0]["text_blocks"]) > 0

    # Test page image rendering
    img_bytes = engine.render_page_image(doc1_path, page_num=1, scale=1.0)
    assert len(img_bytes) > 1000
    assert img_bytes.startswith(b"\x89PNG")

    # Test thumbnail rendering
    thumb_bytes = engine.render_page_thumbnail(doc1_path, page_num=1, width=150)
    assert len(thumb_bytes) > 500
    assert thumb_bytes.startswith(b"\x89PNG")

def test_text_and_whiteout_export(setup_environment):
    env = setup_environment
    engine: PDFEngine = env["engine"]
    doc1_path = env["doc1"]

    page_sequence = [
        {"original_page": 1, "rotation": 0},
        {"original_page": 2, "rotation": 0},
        {"original_page": 3, "rotation": 0}
    ]

    elements = [
        # Whiteout over the confidential title
        {"type": "whiteout", "page": 1, "x": 70, "y": 60, "width": 300, "height": 30},
        # Add replacement text
        {"type": "text", "page": 1, "x": 72, "y": 65, "text": "AMENDED CONTRACT (APPROVED)", "size": 16, "bold": True, "color": "#00AA66"},
        # Add text on page 2
        {"type": "text", "page": 2, "x": 100, "y": 640, "text": "John Doe, Legal Counsel", "size": 12, "bold": False, "color": "#0000FF"}
    ]

    out_path, size_bytes = engine.apply_modifications_and_export(
        source_filepath=doc1_path,
        export_filename="test_text_whiteout_output.pdf",
        page_sequence=page_sequence,
        elements=elements
    )

    assert os.path.exists(out_path)
    assert size_bytes > 0

    # Verify content in exported PDF
    res_doc = fitz.open(out_path)
    assert len(res_doc) == 3
    page1_text = res_doc[0].get_text()
    assert "AMENDED CONTRACT (APPROVED)" in page1_text
    page2_text = res_doc[1].get_text()
    assert "John Doe, Legal Counsel" in page2_text
    res_doc.close()

def test_shapes_drawing_and_highlight(setup_environment):
    env = setup_environment
    engine: PDFEngine = env["engine"]
    doc1_path = env["doc1"]

    page_sequence = [{"original_page": 1, "rotation": 0}]
    elements = [
        # Shapes
        {"type": "shape", "shape_type": "rectangle", "page": 1, "x": 50, "y": 400, "width": 150, "height": 80, "stroke_color": "#FF0000", "stroke_width": 2, "fill_color": None},
        {"type": "shape", "shape_type": "ellipse", "page": 1, "x": 220, "y": 400, "width": 100, "height": 80, "stroke_color": "#0088FF", "stroke_width": 3, "fill_color": None},
        {"type": "shape", "shape_type": "arrow", "page": 1, "x": 350, "y": 420, "width": 100, "height": 40, "stroke_color": "#00AA66", "stroke_width": 2},
        # Freehand draw
        {"type": "draw", "page": 1, "points": [[100, 500], [120, 520], [150, 490], [180, 530]], "color": "#990099", "stroke_width": 3},
        # Highlight annotation
        {"type": "highlight", "page": 1, "rects": [[72, 115, 300, 130]], "color": "#FFD500"}
    ]

    out_path, _ = engine.apply_modifications_and_export(
        source_filepath=doc1_path,
        export_filename="test_shapes_output.pdf",
        page_sequence=page_sequence,
        elements=elements
    )

    integrity = engine.verify_pdf_integrity(out_path)
    assert integrity["valid"] is True
    assert integrity["num_pages"] == 1

def test_page_manipulation_reorder_delete_rotate(setup_environment):
    env = setup_environment
    engine: PDFEngine = env["engine"]
    doc1_path = env["doc1"]

    # Reorder: original page 3 first, then page 1 rotated 90°, delete page 2
    page_sequence = [
        {"original_page": 3, "rotation": 0},
        {"original_page": 1, "rotation": 90}
    ]

    out_path, _ = engine.apply_modifications_and_export(
        source_filepath=doc1_path,
        export_filename="test_reorder_rotate_output.pdf",
        page_sequence=page_sequence,
        elements=[]
    )

    res_doc = fitz.open(out_path)
    assert len(res_doc) == 2
    # First page was original page 3 (Section 3: Appendix)
    assert "SECTION 3" in res_doc[0].get_text()
    # Second page was original page 1 with 90° rotation
    assert "CONFIDENTIAL AGREEMENT" in res_doc[1].get_text()
    assert res_doc[1].rotation == 90
    res_doc.close()

def test_ai_assistant_commands(setup_environment):
    env = setup_environment
    ai: AIAssistantEngine = env["ai"]
    engine: PDFEngine = env["engine"]
    doc1_path = env["doc1"]

    info = engine.get_document_info(doc1_path)
    initial_pages = [
        {"original_page": 1, "rotation": 0},
        {"original_page": 2, "rotation": 0},
        {"original_page": 3, "rotation": 0}
    ]
    initial_elements = []

    # Command 1: "Delete page 3."
    res1 = ai.execute_command(
        command="Delete page 3.",
        doc_info=info,
        page_sequence=initial_pages,
        elements=initial_elements
    )
    assert res1["success"] is True
    assert len(res1["updated_page_sequence"]) == 2
    assert "Deleted page 3" in res1["message"]

    # Command 2: "Rotate page 1 clockwise."
    res2 = ai.execute_command(
        command="Rotate page 1 clockwise.",
        doc_info=info,
        page_sequence=res1["updated_page_sequence"],
        elements=res1["updated_elements"]
    )
    assert res2["success"] is True
    assert res2["updated_page_sequence"][0]["rotation"] == 90
    assert "Rotated page 1" in res2["message"]

    # Command 3: "Add Approved to the top-right corner of page 2."
    res3 = ai.execute_command(
        command="Add Approved to the top-right corner of page 2.",
        doc_info=info,
        page_sequence=res2["updated_page_sequence"],
        elements=res2["updated_elements"]
    )
    assert res3["success"] is True
    elements_p2 = [e for e in res3["updated_elements"] if e.get("page") == 2 and e.get("text") == "Approved"]
    assert len(elements_p2) == 1
    assert elements_p2[0]["x"] == 450
    assert elements_p2[0]["y"] == 40
    assert "Added 'Approved' badge" in res3["message"]

    # Command 4: "Highlight all occurrences of 'confidential'."
    res4 = ai.execute_command(
        command="Highlight all occurrences of 'confidential'.",
        doc_info=info,
        page_sequence=res3["updated_page_sequence"],
        elements=res3["updated_elements"]
    )
    assert res4["success"] is True
    hl_elements = [e for e in res4["updated_elements"] if e.get("type") == "highlight"]
    assert len(hl_elements) >= 1
    assert "Highlighted all occurrences" in res4["message"]

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_suite.py"])
