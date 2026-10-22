"""
FastAPI Server for Aryan Editor.
Connects frontend UI, PyMuPDF engine, and the Aryan AI Assistant.
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from pdf_engine import PDFEngine
from ai_agent import AIAssistantEngine

app = FastAPI(title="Aryan Editor — Precision Clean-Room PDF Engine", version="1.0.0")

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = PDFEngine(storage_dir="backend_storage")
ai_assistant = AIAssistantEngine()

# In-memory session store: session_id -> { filepath, filename, info }
sessions: Dict[str, Dict[str, Any]] = {}

class ExportRequest(BaseModel):
    session_id: str
    export_filename: Optional[str] = "edited_document.pdf"
    page_sequence: List[Dict[str, Any]]
    elements: List[Dict[str, Any]]

class AICommandRequest(BaseModel):
    session_id: str
    command: str
    page_sequence: List[Dict[str, Any]]
    elements: List[Dict[str, Any]]
    default_signature: Optional[str] = None

@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "PyMuPDF", "version": "1.0.0"}

@app.post("/api/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Receives and indexes an uploaded PDF document."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    contents = await file.read()
    session_id, filepath = engine.save_uploaded_file(contents, file.filename)
    
    try:
        info = engine.get_document_info(filepath)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    
    sessions[session_id] = {
        "filepath": filepath,
        "filename": file.filename,
        "info": info
    }
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "info": info
    }

@app.post("/api/pdf/blank")
def create_blank(pages: int = 1):
    """Generates a fresh blank PDF document."""
    session_id, filepath = engine.create_blank_pdf(pages=pages)
    info = engine.get_document_info(filepath)
    
    sessions[session_id] = {
        "filepath": filepath,
        "filename": "Blank Document.pdf",
        "info": info
    }
    
    return {
        "session_id": session_id,
        "filename": "Blank Document.pdf",
        "info": info
    }

@app.get("/api/pdf/{session_id}/info")
def get_info(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]["info"]

@app.get("/api/pdf/{session_id}/page/{page_num}.png")
def render_page(session_id: str, page_num: int, scale: float = 2.5):
    """Renders page raster image at high definition (default 2.5x scale for Retina clarity)."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    filepath = sessions[session_id]["filepath"]
    try:
        img_bytes = engine.render_page_image(filepath, page_num, scale=scale)
        return Response(
            content=img_bytes,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=3600, immutable"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/pdf/{session_id}/page/{page_num}/thumb.png")
def render_thumb(session_id: str, page_num: int, width: int = 180):
    """Renders fast thumbnail for page sidebar."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    filepath = sessions[session_id]["filepath"]
    try:
        img_bytes = engine.render_page_thumbnail(filepath, page_num, width=width)
        return Response(content=img_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/pdf/export")
def export_pdf(payload: ExportRequest):
    """Applies all declarative modifications and compiles the finalized PDF."""
    if payload.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    source_filepath = sessions[payload.session_id]["filepath"]
    filename = payload.export_filename or "edited_document.pdf"
    
    try:
        out_filepath, size_bytes = engine.apply_modifications_and_export(
            source_filepath=source_filepath,
            export_filename=filename,
            page_sequence=payload.page_sequence,
            elements=payload.elements
        )
        
        # Verify compiled PDF
        verification = engine.verify_pdf_integrity(out_filepath)
        
        export_basename = os.path.basename(out_filepath)
        return {
            "success": True,
            "filename": export_basename,
            "download_url": f"/api/pdf/download/{export_basename}",
            "size_bytes": size_bytes,
            "verification": verification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.get("/api/pdf/download/{filename}")
def download_pdf(filename: str):
    """Streams exported PDF with attachment header."""
    clean_name = os.path.basename(filename)
    filepath = os.path.join(engine.exports_dir, clean_name)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # Human-readable download name
    download_name = clean_name.split("_", 1)[-1] if "_" in clean_name else clean_name
    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=download_name
    )

@app.post("/api/ai/command")
def process_ai_command(payload: AICommandRequest):
    """Executes natural language commands via structured AI tool dispatcher."""
    if payload.session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    doc_info = sessions[payload.session_id]["info"]
    result = ai_assistant.execute_command(
        command=payload.command,
        doc_info=doc_info,
        page_sequence=payload.page_sequence,
        elements=payload.elements,
        default_signature_data=payload.default_signature
    )
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
