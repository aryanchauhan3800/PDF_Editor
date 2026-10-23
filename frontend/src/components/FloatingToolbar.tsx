import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Minus,
  Plus,
  Palette,
  ChevronsUpDown,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
} from 'lucide-react';
import { EditorElement, TextElement, TextEditElement } from '../types';

interface FloatingToolbarProps {
  element: EditorElement;
  onUpdateElement: (updated: EditorElement) => void;
  onDuplicateElement: (el: EditorElement) => void;
  onDeleteElement: (id: string) => void;
  zoom: number;
}

const COLOR_PALETTE = [
  '#000000',
  '#334155',
  '#1d4ed8',
  '#b91c1c',
  '#047857',
  '#b45309',
  '#7e22ce',
  '#ffffff',
];

const FONT_FAMILIES = [
  'Times New Roman',
  'Impact',
  'Arial',
  'Helvetica',
  'Calibri',
  'Cambria',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Garamond',
  'Palatino',
  'Roboto',
  'Open Sans',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 21.12, 24, 28, 32, 36, 48, 72];

const LINE_SPACINGS = [
  { label: 'Compact', value: 1.0 },
  { label: 'Normal', value: 1.15 },
  { label: 'Relaxed', value: 1.35 },
  { label: 'Loose', value: 1.5 },
  { label: 'Double', value: 2.0 },
];

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  element,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  zoom,
}) => {
  const isTextLike = element.type === 'text' || element.type === 'text_edit';
  const textEl = isTextLike ? (element as TextElement | TextEditElement) : null;
  const [sizeInput, setSizeInput] = useState<string>(textEl ? String(textEl.size) : '14');

  const availableFonts = textEl?.font && !FONT_FAMILIES.includes(textEl.font)
    ? [textEl.font, ...FONT_FAMILIES]
    : FONT_FAMILIES;

  const handleSizeChange = (valStr: string) => {
    setSizeInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 4 && parsed <= 144 && textEl) {
      onUpdateElement({
        ...textEl,
        size: parsed,
      });
    }
  };

  return (
    <div
      className="absolute bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl shadow-xl px-2.5 py-1.5 flex items-center gap-1.5 z-40 select-none text-xs transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{
        left: `${element.x * zoom}px`,
        top: `${Math.max(0, element.y * zoom - 48)}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Little downward pointer pip */}
      <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45 pointer-events-none" />

      {textEl && (
        <>
          {/* 1. Font Family Dropdown */}
          <div className="relative flex items-center">
            <select
              value={textEl.font || 'Helvetica'}
              onChange={(e) => onUpdateElement({ ...textEl, font: e.target.value })}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-gray-50/80 hover:bg-white focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer max-w-[125px] truncate"
              title="Font Family"
            >
              {availableFonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Precision Font Size Input & Stepper */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/80 overflow-hidden shadow-2xs">
            <button
              onClick={() => {
                const newSize = Math.max(6, Math.round((textEl.size - 1) * 2) / 2);
                setSizeInput(String(newSize));
                onUpdateElement({ ...textEl, size: newSize });
              }}
              className="px-1.5 py-1 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              title="Decrease size (-0.5pt)"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              value={sizeInput}
              onChange={(e) => handleSizeChange(e.target.value)}
              onBlur={() => setSizeInput(String(textEl.size))}
              className="w-8 text-center text-xs font-bold text-gray-800 bg-transparent outline-none border-x border-gray-200/80 py-0.5"
              title="Exact font size in points (type or choose preset)"
            />

            <button
              onClick={() => {
                const newSize = Math.min(96, Math.round((textEl.size + 1) * 2) / 2);
                setSizeInput(String(newSize));
                onUpdateElement({ ...textEl, size: newSize });
              }}
              className="px-1.5 py-1 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              title="Increase size (+0.5pt)"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Preset size picker */}
          <select
            value={FONT_SIZES.includes(textEl.size) ? textEl.size : ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (val) {
                setSizeInput(String(val));
                onUpdateElement({ ...textEl, size: val });
              }
            }}
            className="w-5 px-0 py-1 text-gray-400 bg-transparent border-0 cursor-pointer"
            title="Font Size Presets"
          >
            <option value="" disabled>
              ▼
            </option>
            {FONT_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz}pt
              </option>
            ))}
          </select>

          {/* 3. Style Toggles: Bold, Italic, Underline, Strikethrough */}
          <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5">
            <button
              onClick={() => onUpdateElement({ ...textEl, bold: !textEl.bold })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.bold ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateElement({ ...textEl, italic: !textEl.italic })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.italic ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateElement({ ...textEl, underline: !textEl.underline })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.underline ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateElement({ ...textEl, strikethrough: !textEl.strikethrough })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.strikethrough ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. Text Alignment */}
          <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5">
            <button
              onClick={() => onUpdateElement({ ...textEl, align: 'left' })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                (!textEl.align || textEl.align === 'left')
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateElement({ ...textEl, align: 'center' })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.align === 'center'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onUpdateElement({ ...textEl, align: 'right' })}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                textEl.align === 'right'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5. Line Spacing Picker */}
          <div className="flex items-center border-l border-gray-200 pl-1.5">
            <select
              value={textEl.line_height || 1.15}
              onChange={(e) =>
                onUpdateElement({
                  ...textEl,
                  line_height: parseFloat(e.target.value),
                })
              }
              className="text-[11px] text-gray-600 bg-gray-50 hover:bg-white border border-gray-200 rounded px-1.5 py-0.5 cursor-pointer"
              title="Line Spacing"
            >
              {LINE_SPACINGS.map((ls) => (
                <option key={ls.value} value={ls.value}>
                  {ls.label} ({ls.value}x)
                </option>
              ))}
            </select>
          </div>

          {/* 6. Color Palette + Custom Hex Color Input */}
          <div className="flex items-center gap-1 border-l border-gray-200 pl-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => onUpdateElement({ ...textEl, color: c })}
                style={{ backgroundColor: c }}
                className={`w-3.5 h-3.5 rounded-full border transition-transform cursor-pointer ${
                  textEl.color?.toLowerCase() === c.toLowerCase()
                    ? 'scale-125 border-gray-900 ring-2 ring-emerald-500'
                    : 'border-gray-300 hover:scale-115'
                }`}
                title={`Color: ${c}`}
              />
            ))}

            {/* Custom native color picker */}
            <label className="relative w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center cursor-pointer hover:scale-115 overflow-hidden ml-0.5 bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-500" title="Custom color picker">
              <input
                type="color"
                value={textEl.color || '#000000'}
                onChange={(e) => onUpdateElement({ ...textEl, color: e.target.value })}
                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>

          {/* 7. Sub-pixel Precision Position Nudge (0.5pt) */}
          <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5" title="Precision Nudge (0.5pt steps)">
            <button
              onClick={() => onUpdateElement({ ...element, y: Math.round((element.y - 0.5) * 10) / 10 })}
              className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded cursor-pointer transition-colors"
              title="Nudge Up 0.5pt"
            >
              <MoveUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...element, y: Math.round((element.y + 0.5) * 10) / 10 })}
              className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded cursor-pointer transition-colors"
              title="Nudge Down 0.5pt"
            >
              <MoveDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...element, x: Math.round((element.x - 0.5) * 10) / 10 })}
              className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded cursor-pointer transition-colors"
              title="Nudge Left 0.5pt"
            >
              <MoveLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => onUpdateElement({ ...element, x: Math.round((element.x + 0.5) * 10) / 10 })}
              className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded cursor-pointer transition-colors"
              title="Nudge Right 0.5pt"
            >
              <MoveRight className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {/* Duplicate & Delete for all elements */}
      <div className="flex items-center gap-0.5 border-l border-gray-200 pl-1.5">
        <button
          onClick={() => onDuplicateElement(element)}
          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-md transition-colors cursor-pointer"
          title="Duplicate Element"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDeleteElement(element.id)}
          className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors cursor-pointer"
          title="Delete Element"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
