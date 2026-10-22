import React, { useState, useRef } from 'react';
import {
  Type,
  Link as LinkIcon,
  CheckSquare,
  Image as ImageIcon,
  PenTool,
  Eraser,
  Highlighter,
  Shapes,
  Undo2,
  Redo2,
  Search,
  Check,
  X,
  Circle,
  Square,
  Minus,
  MoveRight,
  Stamp,
  Plus,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { ToolType, ShapeType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
  onOpenSignatureModal: () => void;
  onOpenStampModal: () => void;
  onOpenFindReplaceModal: () => void;
  onImageFileSelected: (file: File) => void;
  savedSignatures: string[];
  onSelectSavedSignature: (dataUrl: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedShape,
  onSelectShape,
  onOpenSignatureModal,
  onOpenStampModal,
  onOpenFindReplaceModal,
  onImageFileSelected,
  savedSignatures,
  onSelectSavedSignature,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedColor,
  onSelectColor,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeDropdowns = () => setOpenDropdown(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageFileSelected(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-1.5 flex items-center justify-between sticky top-14 z-20 shadow-2xs select-none overflow-x-auto">
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-max mx-auto">
        {/* Tool 1: Text */}
        <div className="relative">
          <div className="flex items-center rounded-lg border border-transparent hover:border-gray-200">
            <button
              onClick={() => {
                onSelectTool('text');
                closeDropdowns();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-l-lg transition-all ${
                activeTool === 'text'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              onClick={() => toggleDropdown('text')}
              className="px-1 py-1.5 text-gray-500 hover:bg-gray-100 rounded-r-lg"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {openDropdown === 'text' && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  onSelectTool('text');
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Type className="w-4 h-4 text-emerald-600" />
                <span>Add / Edit Text</span>
              </button>
              <button
                onClick={() => {
                  onOpenFindReplaceModal();
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <Search className="w-4 h-4 text-gray-500" />
                <span>Find & Replace</span>
              </button>
            </div>
          )}
        </div>

        {/* Tool 2: Links */}
        <button
          onClick={() => {
            onSelectTool('link');
            closeDropdowns();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTool === 'link'
              ? 'bg-emerald-50 text-emerald-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Create or edit hyperlink"
        >
          <LinkIcon className="w-4 h-4" />
          <span>Links</span>
        </button>

        {/* Tool 3: Forms */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('form')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'form'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Forms</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openDropdown === 'form' && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Symbols & Checks
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                  onClick={() => {
                    onSelectTool('text');
                    closeDropdowns();
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-center text-xs flex flex-col items-center"
                  title="Checkmark"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] text-gray-500">Check</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTool('text');
                    closeDropdowns();
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-center text-xs flex flex-col items-center"
                  title="Cross Mark"
                >
                  <X className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] text-gray-500">Cross</span>
                </button>
                <button
                  onClick={() => {
                    onSelectTool('text');
                    closeDropdowns();
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded text-center text-xs flex flex-col items-center"
                  title="Radio bullet"
                >
                  <Circle className="w-3.5 h-3.5 fill-black" />
                  <span className="text-[10px] text-gray-500">Dot</span>
                </button>
              </div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 border-t border-gray-100 pt-1.5">
                Fillable Fields
              </div>
              <button
                onClick={() => {
                  onSelectTool('text');
                  closeDropdowns();
                }}
                className="w-full text-left px-2 py-1.5 hover:bg-gray-50 text-xs text-gray-700 rounded flex items-center gap-2"
              >
                <Square className="w-3.5 h-3.5 text-blue-500" />
                <span>Text Field</span>
              </button>
            </div>
          )}
        </div>

        {/* Tool 4: Images & Stamps */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('images')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'image' || activeTool === 'stamp'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Images</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openDropdown === 'images' && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>New Image...</span>
              </button>
              <button
                onClick={() => {
                  onOpenStampModal();
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
              >
                <Stamp className="w-4 h-4 text-blue-600" />
                <span>Create Stamp</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Tool 5: Sign */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('sign')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'sign'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Sign</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openDropdown === 'sign' && (
            <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              {savedSignatures.length > 0 && (
                <div className="px-2 py-1 max-h-40 overflow-y-auto">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Saved Signatures
                  </div>
                  {savedSignatures.map((sig, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectSavedSignature(sig);
                        closeDropdowns();
                      }}
                      className="p-1 hover:bg-gray-50 border border-gray-100 rounded mb-1 cursor-pointer flex items-center justify-center bg-gray-50/50"
                    >
                      <img src={sig} alt="signature" className="max-h-8 object-contain" />
                    </div>
                  ))}
                  <div className="border-t border-gray-100 my-1" />
                </div>
              )}
              <button
                onClick={() => {
                  onOpenSignatureModal();
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>New Signature</span>
              </button>
            </div>
          )}
        </div>

        {/* Tool 6: Whiteout */}
        <button
          onClick={() => {
            onSelectTool('whiteout');
            closeDropdowns();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTool === 'whiteout'
              ? 'bg-emerald-50 text-emerald-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Cover part of page with white rectangle"
        >
          <Eraser className="w-4 h-4" />
          <span>Whiteout</span>
        </button>

        {/* Tool 7: Annotate (Highlight, Underline, Freehand) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('annotate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              ['highlight', 'underline', 'strikeout', 'draw', 'draw_highlight'].includes(activeTool)
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Highlighter className="w-4 h-4" />
            <span>Annotate</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openDropdown === 'annotate' && (
            <div className="absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                Text Markup
              </div>
              <button
                onClick={() => {
                  onSelectTool('highlight');
                  closeDropdowns();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                  <span>Highlight</span>
                </span>
                <span className="w-3 h-3 rounded-full bg-[#FFD500]" />
              </button>
              <button
                onClick={() => {
                  onSelectTool('underline');
                  closeDropdowns();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-red-500" />
                  <span>Underline</span>
                </span>
                <span className="w-3 h-3 rounded-full bg-red-500" />
              </button>

              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1 border-t border-gray-100 mt-1">
                Freehand Drawing
              </div>
              <button
                onClick={() => {
                  onSelectTool('draw');
                  closeDropdowns();
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-purple-600" />
                  <span>Draw Pen</span>
                </span>
                <span className="w-3 h-3 rounded-full bg-purple-600" />
              </button>
            </div>
          )}
        </div>

        {/* Tool 8: Shapes */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('shapes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTool === 'shape'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Shapes className="w-4 h-4" />
            <span>Shapes</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openDropdown === 'shapes' && (
            <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  onSelectShape('rectangle');
                  onSelectTool('shape');
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => {
                  onSelectShape('ellipse');
                  onSelectTool('shape');
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Circle className="w-4 h-4" />
                <span>Ellipse / Circle</span>
              </button>
              <button
                onClick={() => {
                  onSelectShape('line');
                  onSelectTool('shape');
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                <span>Line</span>
              </button>
              <button
                onClick={() => {
                  onSelectShape('arrow');
                  onSelectTool('shape');
                  closeDropdowns();
                }}
                className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <MoveRight className="w-4 h-4" />
                <span>Arrow</span>
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-gray-100 text-gray-700 rounded disabled:opacity-30 transition-all"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-gray-100 text-gray-700 rounded disabled:opacity-30 transition-all"
            title="Redo (Ctrl+Y / Cmd+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
