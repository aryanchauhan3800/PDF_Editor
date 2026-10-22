# Sejda PDF Editor — Independent Clean-Room Implementation & REA Architecture

A high-performance, reverse-engineered implementation of the **Sejda PDF Editor** ([https://www.sejda.com/pdf-editor](https://www.sejda.com/pdf-editor)).
Built with **React, TypeScript, Tailwind CSS** on the frontend, and **Python FastAPI with PyMuPDF (fitz)** on the backend, alongside an autonomous **AI Reverse Engineering Assistant**.

---

## 🏗️ Architecture Overview

The system employs a client-server document pipeline that ensures sub-millisecond responsive interaction on the canvas while compiling exact vector primitives to the exported PDF:

```
[ User Input / Drag & Drop ]
            ↓
┌─────────────────────────────────────────────────────────────┐
│ React + TypeScript Editor Application                      │
│ - Sticky Main Toolbar (Text, Link, Forms, Sign, Annotate)  │
│ - Collapsible Page Thumbnail Sidebar (Reorder, Rotate, Del) │
│ - Interactive Editing Overlay (DOM <-> PDF coordinate map) │
│ - Floating Contextual Properties Bar                       │
│ - Immutable Undo / Redo History Stack                      │
│ - Autonomous REA AI Assistant (Conversational Commands)    │
└─────────────────────────────────────────────────────────────┘
            ↓  (Delta State Model: mutations + page order)
┌─────────────────────────────────────────────────────────────┐
│ FastAPI Backend Server (Port 8000)                         │
│ - /api/pdf/upload: Document indexing & text block extraction│
│ - /api/pdf/blank: Blank PDF generator                      │
│ - /api/pdf/{session}/page/{p}.png: Raster / Retina renders  │
│ - /api/pdf/export: Native PyMuPDF PDF Stream Compiler      │
│ - /api/ai/command: Structured Tool NLP Dispatcher           │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│ PyMuPDF (fitz) PDF Operation Engine                        │
│ - True Vector Text & Font Descriptors                      │
│ - Non-destructive Whiteout Masking                         │
│ - Transparent Signatures (Type, Draw, Upload)              │
│ - Native PDF Annotations (Highlight, Underline, Strikeout) │
│ - Geometric Shape Primitives (Rect, Ellipse, Line, Arrow)  │
│ - Page Dictionary Tree Restructuring (Rotate, Reorder)     │
└─────────────────────────────────────────────────────────────┘
            ↓
[ High-Fidelity Final PDF Export & Verification ]
```

---

## 📁 Project Folder Structure

```
sedja/
├── backend/
│   ├── venv/                     # Python 3 virtual environment
│   ├── main.py                   # FastAPI REST API & session manager
│   ├── pdf_engine.py             # PyMuPDF compilation & coordinate math engine
│   ├── ai_agent.py               # AI Assistant structured tools & execution loop
│   ├── test_suite.py             # Automated test suite (5 passing test suites)
│   └── create_test_pdfs.py       # Multi-page, rotated, and tabular test PDF generator
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx            # Brand bar, title, zoom, export button
│   │   │   ├── Toolbar.tsx           # Sejda top editing tools & dropdowns
│   │   │   ├── PageSidebar.tsx       # Live thumbnail drawer & page mutations
│   │   │   ├── PDFWorkspace.tsx      # Multi-page scrollable viewport
│   │   │   ├── InteractiveOverlay.tsx# Mouse coordinate mapping & element layer
│   │   │   ├── FloatingToolbar.tsx   # Contextual font, size, and styling bar
│   │   │   ├── SignatureModal.tsx    # 3-tab signature creator (Type, Draw, Upload)
│   │   │   ├── StampModal.tsx        # Vector stamp creator with live SVG preview
│   │   │   ├── FindReplaceModal.tsx  # Search & replace throughout document text
│   │   │   ├── ExportModal.tsx       # Download dialog with confetti celebration
│   │   │   ├── AIAssistantDrawer.tsx # Conversational AI agent drawer & execution log
│   │   │   └── LandingDropzone.tsx   # File dropzone & blank doc generator
│   │   ├── types.ts              # Declarative TypeScript document and tool models
│   │   ├── api.ts                # REST API client for backend communication
│   │   ├── App.tsx               # Central application coordinator & state manager
│   │   ├── index.css             # Tailwind CSS & 12 Google cursive signature fonts
│   │   └── main.tsx              # React DOM root entry
│   ├── public/
│   │   └── test_artifacts/       # Sample agreement PDFs for one-click demo
│   ├── package.json
│   ├── vite.config.ts            # Vite config with Tailwind & /api proxy to 8000
│   └── tsconfig.app.json
├── test_artifacts/               # Generated test PDF files
├── README.md                     # Comprehensive documentation
└── sejda_reverse_engineering_report.md # Reverse engineering artifact
```

---

## 📐 Mathematical Coordinate System

| Space | Origin | Positive $Y$ Direction | Unit |
| :--- | :--- | :--- | :--- |
| **Screen / Viewport** | Top-Left | Downwards | CSS Pixels |
| **Canvas / DOM Overlay** | Top-Left | Downwards | Scale-adjusted Pixels |
| **Standard PDF Point Space** | Bottom-Left | Upwards | Typography Points ($1\text{ pt} = 1/72\text{ in}$) |
| **PyMuPDF Drawing API** | Top-Left | Downwards | Typography Points |

### Screen to PDF Points Conversion
Given DOM pointer coordinates $(x_{screen}, y_{screen})$ and display zoom level $Z$:
$$X_{pdf} = \frac{x_{screen}}{Z}, \quad Y_{pdf} = \frac{y_{screen}}{Z}$$

### Typography Baseline Offset
For true vector text insertion at $(X_{pdf}, Y_{pdf})$ with font size $F$:
$$Y_{baseline} = Y_{pdf} + (F \times 0.85)$$
`page.insert_text(fitz.Point(X_pdf, Y_baseline), text, fontsize=F, fontname=font, color=color)`

---

## 🤖 Phase 7: AI Reverse Engineering Assistant (Structured Tools)

The AI assistant operates strictly on high-level declarative state and never writes raw PDF bytes directly. It implements the following structured tool registry:

1. `get_pdf_info()`: Inspects metadata, page count, and dimensions.
2. `get_page_count()`: Returns integer page count.
3. `delete_page(page: int)`: Deletes specified page (1-indexed).
4. `rotate_page(page: int, degrees: int)`: Rotates page clockwise by 90°, 180°, or 270°.
5. `reorder_pages(from_page: int, to_page: int)`: Moves a page to a new index.
6. `add_text(page: int, text: str, x: float, y: float, options: dict)`: Inserts styled text.
7. `edit_text(element_id: str, text: str)`: Modifies existing text elements.
8. `add_image(page: int, image_url: str, x: float, y: float, options: dict)`: Places image.
9. `draw(page: int, path: list, color: str, width: float)`: Draws freehand vector polyline.
10. `highlight(page: int, text: str, color: str)`: Searches and highlights text across pages.
11. `add_signature(page: int, signature: str, x: float, y: float)`: Embeds signature.
12. `whiteout(page: int, x: float, y: float, width: float, height: float)`: Masks region with opaque white patch.
13. `export_pdf()`: Triggers backend compilation.
14. `verify_pdf()`: Validates document integrity and element counts.

---

## 🚀 Setup & Running Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 2. Backend Setup & Startup
```bash
# Navigate to project root
cd /Users/aryanchauhan/Developer/sedja

# Activate Python virtual environment
source backend/venv/bin/activate

# Install dependencies (if not already installed)
pip install pymupdf fastapi uvicorn python-multipart pydantic requests pytest reportlab

# Launch FastAPI server
uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```
Backend will be available at: `http://127.0.0.1:8000` (Health check: `/api/health`).

### 3. Frontend Setup & Startup
```bash
# In a separate terminal, navigate to frontend
cd /Users/aryanchauhan/Developer/sedja/frontend

# Install dependencies
npm install

# Start development server
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at: **`http://127.0.0.1:5173/`**

### 4. Running the Test Suite
```bash
backend/venv/bin/pytest -v backend/test_suite.py
```
All 5 automated test suites pass with 100% success.
# PDF_Editor
