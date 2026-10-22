import React from 'react';
import { RotateCw, Trash2, Plus } from 'lucide-react';
import {
  PageConfig,
  EditorElement,
  ToolType,
  ShapeType,
  DocumentInfo,
} from '../types';
import { InteractiveOverlay } from './InteractiveOverlay';
import { getPageImageUrl } from '../api';

interface PDFWorkspaceProps {
  sessionId: string;
  docInfo: DocumentInfo | null;
  pageSequence: PageConfig[];
  elements: EditorElement[];
  zoom: number;
  activeTool: ToolType;
  selectedShape: ShapeType;
  selectedColor: string;
  selectedElementId: string | null;
  onSelectElementId: (id: string | null) => void;
  onAddElement: (el: EditorElement) => void;
  onUpdateElement: (el: EditorElement) => void;
  onUpdateElementLive: (el: EditorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: EditorElement) => void;
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
  onAddBlankPage: (insertAt: number) => void;
  activeSignatureData: string | null;
}

export const PDFWorkspace: React.FC<PDFWorkspaceProps> = ({
  sessionId,
  docInfo,
  pageSequence,
  elements,
  zoom,
  activeTool,
  selectedShape,
  selectedColor,
  selectedElementId,
  onSelectElementId,
  onAddElement,
  onUpdateElement,
  onUpdateElementLive,
  onDeleteElement,
  onDuplicateElement,
  onRotatePage,
  onDeletePage,
  onAddBlankPage,
  activeSignatureData,
}) => {
  return (
    <main
      className="flex-1 workspace-grid overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 min-h-full"
      onClick={() => onSelectElementId(null)}
    >
      {pageSequence.map((pcfg, idx) => {
        const displayPageNum = idx + 1;
        const origPageNum = pcfg.original_page;
        const rot = pcfg.rotation;
        const pageW = pcfg.width || 612;
        const pageH = pcfg.height || 792;
        const pageMeta =
          origPageNum && docInfo?.pages
            ? docInfo.pages.find((p) => p.page_num === origPageNum)
            : undefined;

        return (
          <div
            key={idx}
            className="flex flex-col items-center group/page"
            style={{ width: `${pageW * zoom}px` }}
          >
            {/* Page Header Bar */}
            <div className="w-full flex items-center justify-between pb-1.5 px-1 text-xs text-gray-500 font-medium select-none">
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-700">
                  Page {displayPageNum}
                </span>
                <span className="text-gray-400">of {pageSequence.length}</span>
                {rot !== 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">
                    {rot}°
                  </span>
                )}
              </span>

              {/* Per-page quick actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRotatePage(displayPageNum);
                  }}
                  className="p-1 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                  title="Rotate page 90° clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={pageSequence.length <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage(displayPageNum);
                  }}
                  className="p-1 hover:bg-red-50 text-red-500 rounded disabled:opacity-30 transition-colors"
                  title="Delete page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddBlankPage(displayPageNum);
                  }}
                  className="p-1 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                  title="Insert page after this"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Page Canvas & Overlay Container */}
            <div
              className="relative bg-white shadow-lg border border-gray-300 transition-transform duration-200"
              style={{
                width: `${pageW * zoom}px`,
                height: `${pageH * zoom}px`,
                transform: `rotate(${rot}deg)`,
              }}
            >
              {/* Raster / Vector Background Render */}
              {origPageNum ? (
                <img
                  src={getPageImageUrl(sessionId, origPageNum, 2.5, rot)}
                  alt={`PDF Page ${displayPageNum}`}
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center text-gray-300 select-none text-sm font-medium">
                  Blank Canvas
                </div>
              )}

              {/* Interactive Editing Overlay */}
              <InteractiveOverlay
                pageNum={displayPageNum}
                width={pageW}
                height={pageH}
                zoom={zoom}
                rotation={rot}
                activeTool={activeTool}
                selectedShape={selectedShape}
                selectedColor={selectedColor}
                elements={elements}
                onAddElement={onAddElement}
                onUpdateElement={onUpdateElement}
                onUpdateElementLive={onUpdateElementLive}
                onDeleteElement={onDeleteElement}
                onDuplicateElement={onDuplicateElement}
                selectedElementId={selectedElementId}
                onSelectElementId={onSelectElementId}
                pageMeta={pageMeta}
                activeSignatureData={activeSignatureData}
              />
            </div>
          </div>
        );
      })}
    </main>
  );
};
