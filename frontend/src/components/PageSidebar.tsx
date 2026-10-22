import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  FileText,
} from 'lucide-react';
import { PageConfig } from '../types';
import { getPageThumbUrl } from '../api';

interface PageSidebarProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  pageSequence: PageConfig[];
  currentPage: number;
  onSelectPage: (pageNum: number) => void;
  onRotatePage: (pageNum: number) => void;
  onDeletePage: (pageNum: number) => void;
  onMovePage: (fromPage: number, toPage: number) => void;
  onAddBlankPage: (insertAt: number) => void;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  sessionId,
  isOpen,
  onClose,
  pageSequence,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onMovePage,
  onAddBlankPage,
}) => {
  const [inputPage, setInputPage] = useState<string>(String(currentPage));

  if (!isOpen) return null;

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= pageSequence.length) {
      onSelectPage(p);
    } else {
      setInputPage(String(currentPage));
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-7rem)] sticky top-28 z-20 shadow-md transition-all select-none">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
          <span>Page</span>
          <input
            type="text"
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onBlur={() => setInputPage(String(currentPage))}
            className="w-10 text-center border border-gray-300 rounded px-1 py-0.5 bg-white font-semibold"
          />
          <span className="text-gray-500">/ {pageSequence.length}</span>
        </form>

        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded transition-colors"
          title="Close Navigation Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {pageSequence.map((pcfg, idx) => {
          const displayPageNum = idx + 1;
          const isSelected = displayPageNum === currentPage;
          const origPage = pcfg.original_page;
          const rot = pcfg.rotation;

          return (
            <div
              key={idx}
              onClick={() => {
                onSelectPage(displayPageNum);
                setInputPage(String(displayPageNum));
              }}
              className={`group relative border-2 rounded-lg p-2 transition-all cursor-pointer bg-white ${
                isSelected
                  ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Thumbnail Header */}
              <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Page {displayPageNum}</span>
                  {rot !== 0 && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">
                      {rot}°
                    </span>
                  )}
                </span>

                {/* Quick actions on thumbnail */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(displayPageNum);
                    }}
                    className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    disabled={displayPageNum <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(displayPageNum, displayPageNum - 1);
                    }}
                    className="p-1 hover:bg-gray-100 text-gray-600 rounded disabled:opacity-30"
                    title="Move up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    disabled={displayPageNum >= pageSequence.length}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(displayPageNum, displayPageNum + 1);
                    }}
                    className="p-1 hover:bg-gray-100 text-gray-600 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    disabled={pageSequence.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(displayPageNum);
                    }}
                    className="p-1 hover:bg-red-50 text-red-500 rounded disabled:opacity-30"
                    title="Delete page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Canvas Preview */}
              <div
                className="w-full bg-gray-50 border border-gray-100 rounded flex items-center justify-center overflow-hidden aspect-[8.5/11]"
                style={{ transform: `rotate(${rot}deg)`, transition: 'transform 0.2s ease' }}
              >
                {origPage ? (
                  <img
                    src={getPageThumbUrl(sessionId, origPage)}
                    alt={`Page ${displayPageNum}`}
                    className="w-full h-full object-contain pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center gap-1 text-[10px]">
                    <FileText className="w-6 h-6 stroke-1" />
                    <span>Blank Page</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Blank Page Button */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/50">
        <button
          onClick={() => onAddBlankPage(pageSequence.length)}
          className="w-full py-2 px-3 border border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-gray-600 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert Blank Page</span>
        </button>
      </div>
    </aside>
  );
};
