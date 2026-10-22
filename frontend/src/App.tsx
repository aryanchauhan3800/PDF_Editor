import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ToolType,
  ShapeType,
  DocumentInfo,
  PageConfig,
  EditorElement,
  HistorySnapshot,
  AIMessage,
} from './types';
import {
  uploadPDF,
  createBlankPDF,
  exportPDF,
  sendAICommand,
} from './api';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { PageSidebar } from './components/PageSidebar';
import { PDFWorkspace } from './components/PDFWorkspace';
import { LandingDropzone } from './components/LandingDropzone';
import { SignatureModal } from './components/SignatureModal';
import { StampModal } from './components/StampModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { ExportModal } from './components/ExportModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

export function App() {
  // Session & Document State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('Untitled Document.pdf');
  const [docInfo, setDocInfo] = useState<DocumentInfo | null>(null);
  const [pageSequence, setPageSequence] = useState<PageConfig[]>([]);
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Viewport & Tools State
  const [zoom, setZoom] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTool, setActiveTool] = useState<ToolType>('text');
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Signatures
  const [savedSignatures, setSavedSignatures] = useState<string[]>([]);
  const [activeSignatureData, setActiveSignatureData] = useState<string | null>(null);

  // Drawers & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isStampModalOpen, setIsStampModalOpen] = useState(false);
  const [isFindReplaceModalOpen, setIsFindReplaceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // AI Assistant State
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: "Hello! I am your AI Reverse Engineering Assistant. I can manipulate pages, highlight text, add stamps, insert signatures, or export the PDF. Try typing: 'Highlight all occurrences of confidential' or 'Delete page 3'.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    filename: string;
    downloadUrl: string;
    sizeBytes: number;
  } | null>(null);

  // Keep live references to state to prevent stale closure race conditions
  const elementsRef = useRef<EditorElement[]>(elements);
  elementsRef.current = elements;

  const pageSequenceRef = useRef<PageConfig[]>(pageSequence);
  pageSequenceRef.current = pageSequence;

  const historyIndexRef = useRef<number>(historyIndex);
  historyIndexRef.current = historyIndex;

  // Push State to History (atomic)
  const pushHistory = useCallback(
    (newPages: PageConfig[], newElements: EditorElement[]) => {
      const snapshot: HistorySnapshot = {
        page_sequence: JSON.parse(JSON.stringify(newPages)),
        elements: JSON.parse(JSON.stringify(newElements)),
      };
      setHistory((prev) => {
        const currentIdx = historyIndexRef.current;
        const newHist = [...prev.slice(0, currentIdx + 1), snapshot];
        historyIndexRef.current = newHist.length - 1;
        setHistoryIndex(newHist.length - 1);
        return newHist;
      });
    },
    []
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      setHistory((prevHist) => {
        const targetIdx = historyIndexRef.current - 1;
        const prevSnap = prevHist[targetIdx];
        if (prevSnap) {
          setPageSequence(JSON.parse(JSON.stringify(prevSnap.page_sequence)));
          setElements(JSON.parse(JSON.stringify(prevSnap.elements)));
          historyIndexRef.current = targetIdx;
          setHistoryIndex(targetIdx);
          setSelectedElementId(null);
        }
        return prevHist;
      });
    }
  }, []);

  const handleRedo = useCallback(() => {
    setHistory((prevHist) => {
      if (historyIndexRef.current < prevHist.length - 1) {
        const targetIdx = historyIndexRef.current + 1;
        const nextSnap = prevHist[targetIdx];
        if (nextSnap) {
          setPageSequence(JSON.parse(JSON.stringify(nextSnap.page_sequence)));
          setElements(JSON.parse(JSON.stringify(nextSnap.elements)));
          historyIndexRef.current = targetIdx;
          setHistoryIndex(targetIdx);
          setSelectedElementId(null);
        }
      }
      return prevHist;
    });
  }, []);

  // Global Keyboard Shortcuts (Cmd/Ctrl+Z for Undo, Cmd/Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if the user is actively typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"]'))
      ) {
        if (e.key === 'Escape') {
          (target as HTMLElement).blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setActiveTool('select');
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Initialize document when upload succeeds
  const initializeDocument = (
    newSessionId: string,
    filename: string,
    info: DocumentInfo
  ) => {
    setSessionId(newSessionId);
    setDocumentTitle(filename);
    setDocInfo(info);

    const initialPages: PageConfig[] = info.pages.map((p) => ({
      original_page: p.page_num,
      rotation: p.rotation,
      width: p.width,
      height: p.height,
    }));

    setPageSequence(initialPages);
    setElements([]);
    setHistory([{ page_sequence: initialPages, elements: [] }]);
    setHistoryIndex(0);
    setCurrentPage(1);
    setSelectedElementId(null);
    setActiveTool('text');
  };

  // Upload handler
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      const res = await uploadPDF(file);
      initializeDocument(res.session_id, res.filename, res.info);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Blank document generator
  const handleStartBlank = async () => {
    try {
      setIsLoading(true);
      const res = await createBlankPDF(1);
      initializeDocument(res.session_id, res.filename, res.info);
    } catch (err: any) {
      alert(`Error creating blank PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample agreement document
  const handleLoadSample = async () => {
    try {
      setIsLoading(true);
      // Fetch test file generated by backend
      const response = await fetch('/test_artifacts/normal_multi_page.pdf');
      const blob = await response.blob();
      const file = new File([blob], 'Sample_Confidential_Agreement.pdf', {
        type: 'application/pdf',
      });
      await handleFileUpload(file);
    } catch (err) {
      // Fallback: create blank
      await handleStartBlank();
    } finally {
      setIsLoading(false);
    }
  };

  // Element Actions (Atomic & Ref-synchronized to prevent blur race conditions)
  const handleAddElement = useCallback((newEl: EditorElement) => {
    setElements((prev) => {
      if (prev.some((e) => e.id === newEl.id)) return prev;
      const updated = [...prev, newEl];
      elementsRef.current = updated;
      pushHistory(pageSequenceRef.current, updated);
      return updated;
    });
  }, [pushHistory]);

  // Live update without pushing to history (used during active typing)
  const handleUpdateElementLive = useCallback((updatedEl: EditorElement) => {
    setElements((prev) => {
      const updated = prev.map((el) => (el.id === updatedEl.id ? updatedEl : el));
      elementsRef.current = updated;
      return updated;
    });
  }, []);

  // Final committed update that pushes to undo history
  const handleUpdateElement = useCallback((updatedEl: EditorElement) => {
    setElements((prev) => {
      const existing = prev.find((el) => el.id === updatedEl.id);
      // Avoid redundant re-renders and history bloat if unchanged
      if (existing && JSON.stringify(existing) === JSON.stringify(updatedEl)) {
        return prev;
      }
      const updated = prev.map((el) => (el.id === updatedEl.id ? updatedEl : el));
      elementsRef.current = updated;
      pushHistory(pageSequenceRef.current, updated);
      return updated;
    });
  }, [pushHistory]);

  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => {
      const updated = prev.filter((el) => el.id !== id);
      elementsRef.current = updated;
      pushHistory(pageSequenceRef.current, updated);
      return updated;
    });
    setSelectedElementId(null);
  }, [pushHistory]);

  const handleDuplicateElement = useCallback((el: EditorElement) => {
    const dup: EditorElement = {
      ...el,
      id: `${el.type}_${Date.now()}`,
      x: el.x + 20,
      y: el.y + 20,
    };
    setElements((prev) => {
      const updated = [...prev, dup];
      elementsRef.current = updated;
      pushHistory(pageSequenceRef.current, updated);
      return updated;
    });
    setSelectedElementId(dup.id);
  }, [pushHistory]);

  // Page Actions
  const handleRotatePage = (pageNum: number) => {
    const updated = pageSequence.map((p, idx) => {
      if (idx + 1 === pageNum) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    });
    setPageSequence(updated);
    pushHistory(updated, elements);
  };

  const handleDeletePage = (pageNum: number) => {
    if (pageSequence.length <= 1) return;
    const updated = pageSequence.filter((_, idx) => idx + 1 !== pageNum);
    setPageSequence(updated);
    if (currentPage > updated.length) {
      setCurrentPage(updated.length);
    }
    pushHistory(updated, elements);
  };

  const handleMovePage = (fromPage: number, toPage: number) => {
    if (
      fromPage < 1 ||
      fromPage > pageSequence.length ||
      toPage < 1 ||
      toPage > pageSequence.length
    )
      return;
    const newSeq = [...pageSequence];
    const [moved] = newSeq.splice(fromPage - 1, 1);
    newSeq.splice(toPage - 1, 0, moved);
    setPageSequence(newSeq);
    setCurrentPage(toPage);
    pushHistory(newSeq, elements);
  };

  const handleAddBlankPage = (insertAt: number) => {
    const newSeq = [...pageSequence];
    const newBlank: PageConfig = {
      original_page: null,
      rotation: 0,
      is_new_blank: true,
      width: 612,
      height: 792,
    };
    newSeq.splice(insertAt, 0, newBlank);
    setPageSequence(newSeq);
    setCurrentPage(insertAt + 1);
    pushHistory(newSeq, elements);
  };

  // Signature actions
  const handleSaveSignature = (dataUrl: string, saveToHistory: boolean) => {
    setActiveSignatureData(dataUrl);
    if (saveToHistory) {
      setSavedSignatures((prev) => [dataUrl, ...prev.slice(0, 5)]);
    }
    setActiveTool('sign');
  };

  // Apply Changes / Export
  const handleApplyChanges = async () => {
    if (!sessionId) return;
    try {
      setIsExporting(true);
      const res = await exportPDF({
        session_id: sessionId,
        export_filename: documentTitle,
        page_sequence: pageSequence,
        elements,
      });

      setExportResult({
        filename: res.filename,
        downloadUrl: res.download_url,
        sizeBytes: res.size_bytes,
      });
      setIsExportModalOpen(true);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // AI Assistant command execution
  const handleSendAIMessage = async (commandText: string) => {
    if (!sessionId) return;
    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: commandText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    setIsAIProcessing(true);

    try {
      const res = await sendAICommand({
        session_id: sessionId,
        command: commandText,
        page_sequence: pageSequence,
        elements,
        default_signature: activeSignatureData || savedSignatures[0],
      });

      // Update state delta returned by AI
      setPageSequence(res.updated_page_sequence);
      setElements(res.updated_elements);
      pushHistory(res.updated_page_sequence, res.updated_elements);

      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: res.message,
        timestamp: new Date().toLocaleTimeString(),
        execution_log: res.execution_log,
        verification: res.verification,
      };
      setAiMessages((prev) => [...prev, aiMsg]);

      // If command requested export
      if (res.should_export) {
        handleApplyChanges();
      }
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error executing command: ${err.message}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAIProcessing(false);
    }
  };

  // If no document is open, show Landing Dropzone
  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="h-14 border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-sm ring-1 ring-emerald-600/20">
              A
            </div>
            <span className="font-bold text-gray-900 text-lg">Aryan <span className="text-emerald-600">Editor</span></span>
          </div>
        </header>

        <LandingDropzone
          onFileUpload={handleFileUpload}
          onStartBlank={handleStartBlank}
          onLoadSample={handleLoadSample}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F2F5]">
      {/* Top Main Navigation Header */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        zoom={zoom}
        onZoomChange={setZoom}
        currentPage={currentPage}
        totalPages={pageSequence.length}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        isAIAssistantOpen={isAIAssistantOpen}
        onApplyChanges={handleApplyChanges}
        isExporting={isExporting}
      />

      {/* Main Editing Tools Bar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        selectedShape={selectedShape}
        onSelectShape={setSelectedShape}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        onOpenStampModal={() => setIsStampModalOpen(true)}
        onOpenFindReplaceModal={() => setIsFindReplaceModalOpen(true)}
        onImageFileSelected={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              const newEl: EditorElement = {
                id: `img_${Date.now()}`,
                type: 'image',
                page: currentPage,
                x: 100,
                y: 100,
                width: 180,
                height: 120,
                data_url: e.target.result as string,
              };
              handleAddElement(newEl);
              setSelectedElementId(newEl.id);
            }
          };
          reader.readAsDataURL(file);
        }}
        savedSignatures={savedSignatures}
        onSelectSavedSignature={(sigUrl) => {
          setActiveSignatureData(sigUrl);
          setActiveTool('sign');
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />

      {/* Center Layout: Sidebar + Canvas Viewport + AI Assistant */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnail Drawer */}
        <PageSidebar
          sessionId={sessionId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pageSequence={pageSequence}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onAddBlankPage={handleAddBlankPage}
        />

        {/* Center Multi-page PDF Workspace */}
        <PDFWorkspace
          sessionId={sessionId}
          docInfo={docInfo}
          pageSequence={pageSequence}
          elements={elements}
          zoom={zoom}
          activeTool={activeTool}
          selectedShape={selectedShape}
          selectedColor={selectedColor}
          selectedElementId={selectedElementId}
          onSelectElementId={setSelectedElementId}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onUpdateElementLive={handleUpdateElementLive}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePage}
          onAddBlankPage={handleAddBlankPage}
          activeSignatureData={activeSignatureData}
        />

        {/* Right AI Assistant Drawer */}
        <AIAssistantDrawer
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          messages={aiMessages}
          onSendMessage={handleSendAIMessage}
          isProcessing={isAIProcessing}
        />
      </div>

      {/* Modals */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      <StampModal
        isOpen={isStampModalOpen}
        onClose={() => setIsStampModalOpen(false)}
        onSaveStamp={(stampDataUrl) => {
          const newEl: EditorElement = {
            id: `stamp_${Date.now()}`,
            type: 'stamp',
            page: currentPage,
            x: 100,
            y: 100,
            width: 200,
            height: 60,
            data_url: stampDataUrl,
          };
          handleAddElement(newEl);
          setSelectedElementId(newEl.id);
        }}
      />

      <FindReplaceModal
        isOpen={isFindReplaceModalOpen}
        onClose={() => setIsFindReplaceModalOpen(false)}
        elements={elements}
        onUpdateElements={(updated) => {
          setElements(updated);
          pushHistory(pageSequence, updated);
        }}
      />

      {exportResult && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          filename={exportResult.filename}
          downloadUrl={exportResult.downloadUrl}
          sizeBytes={exportResult.sizeBytes}
        />
      )}
    </div>
  );
}

export default App;

