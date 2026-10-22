import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Sparkles,
  ChevronRight,
  PanelLeft,
  FileCheck,
  Loader2,
} from 'lucide-react';

interface HeaderProps {
  documentTitle: string;
  onTitleChange: (newTitle: string) => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  currentPage: number;
  totalPages: number;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleAIAssistant: () => void;
  isAIAssistantOpen: boolean;
  onApplyChanges: () => void;
  isExporting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  onTitleChange,
  zoom,
  onZoomChange,
  currentPage,
  totalPages,
  onToggleSidebar,
  isSidebarOpen,
  onToggleAIAssistant,
  isAIAssistantOpen,
  onApplyChanges,
  isExporting,
}) => {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-30 select-none shadow-xs sticky top-0">
      {/* Left: Brand logo & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${
            isSidebarOpen ? 'bg-gray-100 text-emerald-600' : 'text-gray-600'
          }`}
          title="Toggle Page Navigation Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Aryan Editor Brand Badge */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-sm ring-1 ring-emerald-600/20">
            A
          </div>
          <span className="font-bold text-gray-900 text-base hidden sm:inline tracking-tight">
            Aryan <span className="text-emerald-600 font-semibold text-sm">Editor</span>
          </span>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

        {/* Editable Title */}
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded px-2 py-1 outline-hidden max-w-[160px] sm:max-w-[260px] truncate"
          title="Click to rename document"
        />
      </div>

      {/* Middle: Page counter & Zoom controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Page counter */}
        <div className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-medium hidden md:flex items-center gap-1">
          <span>Page</span>
          <span className="font-semibold text-gray-900">{currentPage}</span>
          <span>of</span>
          <span className="font-semibold text-gray-900">{totalPages}</span>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
          <button
            onClick={() => onZoomChange(Math.max(0.5, Math.round((zoom - 0.1) * 10) / 10))}
            disabled={zoom <= 0.5}
            className="p-1 hover:bg-white text-gray-600 hover:text-gray-900 rounded disabled:opacity-30 transition-all"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-700 px-2 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, Math.round((zoom + 0.1) * 10) / 10))}
            disabled={zoom >= 2.5}
            className="p-1 hover:bg-white text-gray-600 hover:text-gray-900 rounded disabled:opacity-30 transition-all"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: AI Assistant toggle & Apply Changes button */}
      <div className="flex items-center gap-2.5">
        {/* AI Assistant Button */}
        <button
          onClick={onToggleAIAssistant}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            isAIAssistantOpen
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          }`}
          title="Open AI Reverse Engineering Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Agent</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-pulse" />
        </button>

        {/* Apply changes / Export button */}
        <button
          onClick={onApplyChanges}
          disabled={isExporting}
          className="bg-[#00BB88] hover:bg-[#009e73] active:bg-[#008964] text-white px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling...</span>
            </>
          ) : (
            <>
              <span>Apply changes</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </header>
  );
};
