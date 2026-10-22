"""
Generates comprehensive test PDFs for verifying Sejda Reverse-Engineered Editor.
Contains:
1. normal_multi_page.pdf: Multi-page document with text headings, paragraphs, and tables.
2. mixed_dimensions_rotated.pdf: Pages with different dimensions (Letter, A4, Landscape) and rotations (90°, 270°).
3. document_with_images.pdf: Document containing embedded graphics, forms, and image blocks.
"""

import os
import fitz

def generate_test_pdfs(output_dir: str = "test_data"):
    os.makedirs(output_dir, exist_ok=True)

    # 1. Standard Multi-page Document
    doc1 = fitz.open()
    # Page 1
    p1 = doc1.new_page(width=612, height=792)  # US Letter
    p1.insert_text(fitz.Point(72, 80), "CONFIDENTIAL AGREEMENT", fontsize=20, fontname="hebo", color=(0.1, 0.2, 0.5))
    p1.insert_text(fitz.Point(72, 115), "This is Page 1 of our multi-page test PDF document.", fontsize=12, fontname="helv", color=(0, 0, 0))
    p1.insert_text(fitz.Point(72, 135), "It contains normal paragraph text and confidentiality clauses.", fontsize=11, fontname="helv", color=(0.2, 0.2, 0.2))
    
    # Draw a table grid on page 1
    table_y = 200
    p1.draw_rect(fitz.Rect(72, table_y, 540, table_y + 120), color=(0.7, 0.7, 0.7), width=1)
    p1.draw_line(fitz.Point(72, table_y + 30), fitz.Point(540, table_y + 30), color=(0.7, 0.7, 0.7), width=1)
    p1.draw_line(fitz.Point(250, table_y), fitz.Point(250, table_y + 120), color=(0.7, 0.7, 0.7), width=1)
    p1.insert_text(fitz.Point(85, table_y + 20), "Item Description", fontsize=11, fontname="hebo", color=(0, 0, 0))
    p1.insert_text(fitz.Point(265, table_y + 20), "Specification & Notes", fontsize=11, fontname="hebo", color=(0, 0, 0))
    p1.insert_text(fitz.Point(85, table_y + 55), "Contract Term", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    p1.insert_text(fitz.Point(265, table_y + 55), "12 Months Initial Duration", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    p1.insert_text(fitz.Point(85, table_y + 90), "Status", fontsize=10, fontname="helv", color=(0.1, 0.1, 0.1))
    p1.insert_text(fitz.Point(265, table_y + 90), "Pending Signature & Approval", fontsize=10, fontname="helv", color=(0.8, 0.2, 0.2))

    # Page 2
    p2 = doc1.new_page(width=612, height=792)
    p2.insert_text(fitz.Point(72, 80), "SECTION 2: TERMS AND CONDITIONS", fontsize=18, fontname="hebo", color=(0.1, 0.2, 0.5))
    p2.insert_text(fitz.Point(72, 115), "Notice: All material contained herein is marked confidential.", fontsize=12, fontname="helv", color=(0, 0, 0))
    p2.insert_text(fitz.Point(72, 140), "Signature Block required at bottom of this page.", fontsize=11, fontname="heit", color=(0.3, 0.3, 0.3))
    p2.draw_rect(fitz.Rect(72, 600, 300, 680), color=(0.8, 0.8, 0.8), fill=(0.96, 0.96, 0.96), width=1)
    p2.insert_text(fitz.Point(85, 625), "Authorized Signature:", fontsize=10, fontname="hebo", color=(0.5, 0.5, 0.5))

    # Page 3
    p3 = doc1.new_page(width=612, height=792)
    p3.insert_text(fitz.Point(72, 80), "SECTION 3: APPENDIX AND SIGN-OFF", fontsize=18, fontname="hebo", color=(0.1, 0.2, 0.5))
    p3.insert_text(fitz.Point(72, 120), "This is the final page of document 1.", fontsize=12, fontname="helv", color=(0, 0, 0))

    f1 = os.path.join(output_dir, "normal_multi_page.pdf")
    doc1.save(f1)
    doc1.close()

    # 2. Mixed Dimensions and Rotated Pages
    doc2 = fitz.open()
    # Page 1: Standard A4 Portrait (595.28 x 841.89)
    p2_1 = doc2.new_page(width=595.28, height=841.89)
    p2_1.insert_text(fitz.Point(50, 70), "Mixed Document — Page 1: A4 Portrait", fontsize=16, fontname="hebo")
    
    # Page 2: Landscape US Letter (792 x 612)
    p2_2 = doc2.new_page(width=792, height=612)
    p2_2.insert_text(fitz.Point(60, 60), "Page 2: US Letter Landscape", fontsize=16, fontname="hebo")

    # Page 3: Pre-rotated 90 degrees
    p2_3 = doc2.new_page(width=612, height=792)
    p2_3.insert_text(fitz.Point(70, 70), "Page 3: Native 90 Degree Rotation", fontsize=16, fontname="hebo")
    p2_3.set_rotation(90)

    f2 = os.path.join(output_dir, "mixed_dimensions_rotated.pdf")
    doc2.save(f2)
    doc2.close()

    print(f"Generated test PDFs in {output_dir}:")
    print(f" - {f1} ({os.path.getsize(f1)} bytes)")
    print(f" - {f2} ({os.path.getsize(f2)} bytes)")

if __name__ == "__main__":
    generate_test_pdfs()
