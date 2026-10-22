import React, { useRef, useState } from 'react';
import {
  Upload,
  FilePlus,
  FileText,
  Shield,
  Sparkles,
  Type,
  PenTool,
  Eraser,
  Highlighter,
  ChevronDown,
} from 'lucide-react';

interface LandingDropzoneProps {
  onFileUpload: (file: File) => void;
  onStartBlank: () => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export const LandingDropzone: React.FC<LandingDropzoneProps> = ({
  onFileUpload,
  onStartBlank,
  onLoadSample,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Brand & Hero Title */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Aryan Editor • High-Precision PDF Suite</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Precision PDF Editing, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Reinvented</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-gray-600">
          Edit PDF text directly with pixel-perfect typography. Fill & sign documents, add whiteout, shapes, stamps, and execute AI commands.
        </p>
      </div>

      {/* Main Upload Dropzone Card */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-xl rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all bg-white shadow-xl ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/30 scale-[1.01]'
            : 'border-gray-200 hover:border-emerald-400'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-[#00BB88] hover:bg-[#009e73] active:bg-[#008964] text-white px-6 py-3 rounded-xl font-semibold text-sm sm:text-base shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                <span>Upload PDF file</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">or drag and drop files here</p>
          </div>

          {/* Blank doc or sample doc triggers */}
          <div className="flex items-center gap-4 text-xs font-medium pt-2">
            <button
              onClick={onStartBlank}
              disabled={isLoading}
              className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>or start with a blank document</span>
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={onLoadSample}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load sample agreement PDF</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>
      </div>

      {/* Security & Feature Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Files stay private and encrypted</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Type className="w-4 h-4 text-blue-600" />
          <span>Direct Text Editing</span>
        </span>
        <span className="flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-purple-600" />
          <span>Vector Signatures</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Eraser className="w-4 h-4 text-amber-600" />
          <span>Whiteout Masking</span>
        </span>
      </div>
    </div>
  );
};
