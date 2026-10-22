import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ToolType,
  ShapeType,
  EditorElement,
  TextElement,
  TextEditElement,
  ImageElement,
  SignatureElement,
  WhiteoutElement,
  ShapeElement,
  DrawElement,
  HighlightElement,
  PageMeta,
} from '../types';
import { FloatingToolbar } from './FloatingToolbar';
import { GripVertical } from 'lucide-react';

interface InteractiveOverlayProps {
  pageNum: number;
  width: number;       // PDF points
  height: number;      // PDF points
  zoom: number;
  rotation: number;
  activeTool: ToolType;
  selectedShape: ShapeType;
  selectedColor: string;
  elements: EditorElement[];
  onAddElement: (el: EditorElement) => void;
  onUpdateElement: (el: EditorElement) => void;
  onUpdateElementLive: (el: EditorElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (el: EditorElement) => void;
  selectedElementId: string | null;
  onSelectElementId: (id: string | null) => void;
  pageMeta?: PageMeta;
  activeSignatureData: string | null;
}

const getFontFamily = (font?: string) => {
  if (!font) return 'Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif';
  const fl = font.toLowerCase();
  if (fl.includes('times') || fl.includes('roman') || fl.includes('serif')) {
    return '"Times New Roman", Times, "Liberation Serif", serif';
  }
  if (fl.includes('courier') || fl.includes('mono')) {
    return '"Courier New", Courier, monospace';
  }
  if (fl.includes('georgia')) {
    return 'Georgia, serif';
  }
  return `"${font}", Helvetica, Arial, sans-serif`;
};

/** Inline editable text component for text/text_edit elements */
const EditableTextBox: React.FC<{
  element: TextElement | TextEditElement;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onUpdateLive: (el: EditorElement) => void;
  onUpdateCommit: (el: EditorElement) => void;
  onStartMove: (e: React.MouseEvent) => void;
}> = ({ element, isSelected, zoom, onSelect, onUpdateLive, onUpdateCommit, onStartMove }) => {
  const editRef = useRef<HTMLDivElement>(null);
  const isExistingEdit = element.type === 'text_edit';
  const isFocusedRef = useRef(false);
  const lastCommittedTextRef = useRef(element.text);

  // Synchronize DOM text from props only when NOT actively typing or focused in this box
  useEffect(() => {
    if (editRef.current) {
      if (document.activeElement !== editRef.current && editRef.current.innerText !== element.text) {
        editRef.current.innerText = element.text;
        lastCommittedTextRef.current = element.text;
      }
    }
  }, [element.text, element.id]);

  // When selected, auto-focus and position caret at end if not already focused
  useEffect(() => {
    if (isSelected && editRef.current) {
      if (document.activeElement !== editRef.current) {
        editRef.current.focus();
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        } catch (_) {}
      }
      isFocusedRef.current = true;
    } else if (!isSelected) {
      isFocusedRef.current = false;
    }
  }, [isSelected]);

  const handleInput = () => {
    if (editRef.current) {
      const newText = editRef.current.innerText || '';
      onUpdateLive({
        ...element,
        text: newText,
      });
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (editRef.current) {
      const finalText = editRef.current.innerText || '';
      if (finalText !== lastCommittedTextRef.current) {
        lastCommittedTextRef.current = finalText;
        onUpdateCommit({
          ...element,
          text: finalText,
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      editRef.current?.blur();
    }
  };

  // Dimensions: exact tight bounds, ZERO vertical overflow, ZERO rounding
  const bboxW = isExistingEdit
    ? (element as TextEditElement).width
    : element.width || Math.max(40, element.text.length * element.size * 0.55);
  const bboxH = isExistingEdit
    ? (element as TextEditElement).height
    : element.height || element.size * 1.15;

  // Sejda-grade exact baseline matching:
  // In PDF font metrics, origin_y is the baseline. With CSS line-height: 1,
  // fontBaselineOffset = size * ascender. We calculate the exact paddingTop
  // so the HTML text sits at the identical pixel baseline as the PDF background.
  const textEditEl = isExistingEdit ? (element as TextEditElement) : null;
  const ascender = textEditEl?.ascender ?? 0.8;
  const originalBaselineY = textEditEl?.origin ? textEditEl.origin[1] : (element.y + element.size * ascender);
  const targetBaselineOffset = (originalBaselineY - element.y) * zoom;
  const fontBaselineOffset = element.size * ascender * zoom;
  const paddingTop = isExistingEdit ? Math.max(0, targetBaselineOffset - fontBaselineOffset) : 0;

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`interactive-element absolute select-text z-20 ${
        isExistingEdit ? 'bg-white' : ''
      }`}
      style={{
        left: `${element.x * zoom}px`,
        top: `${element.y * zoom}px`,
        minWidth: `${bboxW * zoom}px`,
        height: `${bboxH * zoom}px`,
        // Completely flat and seamless: NO rounded corners, NO shadows, NO thick borders
        borderRadius: '0px',
        boxShadow: 'none',
        outline: isSelected ? '1px dashed #2563eb' : 'none',
        outlineOffset: '0px',
        padding: '0px',
        margin: '0px',
      }}
    >
      {/* Discreet reposition handle on the left margin, NEVER overlapping adjacent lines */}
      {isSelected && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartMove(e);
          }}
          className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xs flex items-center justify-center cursor-move shadow-xs z-30 transition-colors"
          title="Drag to reposition text"
        >
          <GripVertical className="w-2.5 h-2.5" />
        </div>
      )}

      {/* ContentEditable area - seamless inline text matching exact PDF font baseline */}
      <div
        ref={editRef}
        contentEditable={true}
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => {
          isFocusedRef.current = true;
          onSelect();
        }}
        onBlur={handleBlur}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${element.size * zoom}px`,
          fontFamily: getFontFamily(element.font),
          color: element.color,
          fontWeight: element.bold ? 700 : 400,
          fontStyle: element.italic ? 'italic' : 'normal',
          textDecoration: `${element.underline ? 'underline' : ''} ${element.strikethrough ? 'line-through' : ''}`.trim() || 'none',
          textAlign: element.align || 'left',
          lineHeight: isExistingEdit ? 1 : 1.2,
          paddingTop: `${paddingTop}px`,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          letterSpacing: element.letter_spacing ? `${element.letter_spacing * zoom}px` : 'normal',
          opacity: element.opacity !== undefined ? element.opacity : 1,
          margin: 0,
          width: '100%',
          height: '100%',
          outline: 'none',
          border: 'none',
          background: 'transparent',
          cursor: 'text',
          whiteSpace: 'pre',
          wordBreak: 'normal',
          caretColor: '#2563eb',
        }}
        className="focus:outline-none"
      />

      {/* Placeholder for empty new text */}
      {element.type === 'text' && !element.text.trim() && !isSelected && (
        <div
          className="absolute inset-0 flex items-center text-gray-400 pointer-events-none italic select-none"
          style={{ fontSize: `${element.size * zoom}px`, lineHeight: `${bboxH * zoom}px` }}
        >
          Type text...
        </div>
      )}
    </div>
  );
};

export const InteractiveOverlay: React.FC<InteractiveOverlayProps> = ({
  pageNum,
  width,
  height,
  zoom,
  rotation,
  activeTool,
  selectedShape,
  selectedColor,
  elements,
  onAddElement,
  onUpdateElement,
  onUpdateElementLive,
  onDeleteElement,
  onDuplicateElement,
  selectedElementId,
  onSelectElementId,
  pageMeta,
  activeSignatureData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging / Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<Array<[number, number]>>([]);

  // Moving existing element
  const [movingElementId, setMovingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Resizing state
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Track which text block IDs are being hovered
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const getPdfCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: screenX / zoom,
      y: screenY / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicked on an existing element, that element's handler handles it
    if ((e.target as HTMLElement).closest('.interactive-element')) {
      return;
    }
    // If clicked on a text block overlay, let its handler run
    if ((e.target as HTMLElement).closest('.text-block-overlay')) {
      return;
    }

    const { x, y } = getPdfCoordinates(e);

    // 1. Tool: Add Text
    if (activeTool === 'text') {
      const newEl: TextElement = {
        id: `txt_${Date.now()}`,
        type: 'text',
        page: pageNum,
        x,
        y,
        text: '',
        size: 14,
        font: 'Helvetica',
        color: '#000000',
        bold: false,
        italic: false,
      };
      onAddElement(newEl);
      onSelectElementId(newEl.id);
      return;
    }

    // 2. Tool: Place Signature
    if (activeTool === 'sign' && activeSignatureData) {
      const newEl: SignatureElement = {
        id: `sig_${Date.now()}`,
        type: 'signature',
        page: pageNum,
        x: x - 80,
        y: y - 30,
        width: 160,
        height: 60,
        data_url: activeSignatureData,
        stroke_color: '#000000',
      };
      onAddElement(newEl);
      onSelectElementId(newEl.id);
      return;
    }

    // 3. Start drag for Whiteout, Shapes, Annotations, or Freehand
    if (['whiteout', 'shape', 'draw', 'highlight', 'underline'].includes(activeTool)) {
      setIsDrawing(true);
      setStartPoint({ x, y });
      setCurrentPoint({ x, y });
      if (activeTool === 'draw') {
        setCurrentPath([[x, y]]);
      }
    } else {
      onSelectElementId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getPdfCoordinates(e);

    // Moving element
    if (movingElementId) {
      const el = elements.find((item) => item.id === movingElementId);
      if (el) {
        onUpdateElement({
          ...el,
          x: Math.max(0, x - dragOffset.x),
          y: Math.max(0, y - dragOffset.y),
        });
      }
      return;
    }

    // Resizing element
    if (resizingElementId && resizeHandle) {
      const el = elements.find((item) => item.id === resizingElementId);
      if (el && 'width' in el && 'height' in el) {
        const newW = Math.max(20, x - el.x);
        const newH = Math.max(20, y - el.y);
        onUpdateElement({
          ...el,
          width: newW,
          height: newH,
        } as EditorElement);
      }
      return;
    }

    // Drawing new shape/whiteout/path
    if (isDrawing && startPoint) {
      setCurrentPoint({ x, y });
      if (activeTool === 'draw') {
        setCurrentPath((prev) => [...prev, [x, y]]);
      }
    }
  };

  const handleMouseUp = () => {
    if (movingElementId) {
      setMovingElementId(null);
    }

    if (resizingElementId) {
      setResizingElementId(null);
      setResizeHandle(null);
    }

    if (isDrawing && startPoint && currentPoint) {
      const minX = Math.min(startPoint.x, currentPoint.x);
      const minY = Math.min(startPoint.y, currentPoint.y);
      const w = Math.abs(currentPoint.x - startPoint.x);
      const h = Math.abs(currentPoint.y - startPoint.y);

      if (activeTool === 'whiteout' && w > 5 && h > 5) {
        const newEl: WhiteoutElement = {
          id: `wo_${Date.now()}`,
          type: 'whiteout',
          page: pageNum,
          x: minX,
          y: minY,
          width: w,
          height: h,
        };
        onAddElement(newEl);
        onSelectElementId(newEl.id);
      } else if (activeTool === 'shape' && w > 5 && h > 5) {
        const newEl: ShapeElement = {
          id: `shp_${Date.now()}`,
          type: 'shape',
          shape_type: selectedShape,
          page: pageNum,
          x: minX,
          y: minY,
          width: w,
          height: h,
          stroke_color: selectedColor || '#000000',
          stroke_width: 2,
          fill_color: null,
        };
        onAddElement(newEl);
        onSelectElementId(newEl.id);
      } else if (activeTool === 'draw' && currentPath.length > 1) {
        const newEl: DrawElement = {
          id: `drw_${Date.now()}`,
          type: 'draw',
          page: pageNum,
          x: 0,
          y: 0,
          points: currentPath,
          color: selectedColor || '#000000',
          stroke_width: 2.5,
        };
        onAddElement(newEl);
        onSelectElementId(newEl.id);
      } else if (activeTool === 'highlight' && w > 5 && h > 3) {
        const newEl: HighlightElement = {
          id: `hl_${Date.now()}`,
          type: 'highlight',
          page: pageNum,
          x: minX,
          y: minY,
          width: w,
          height: h,
          rects: [[minX, minY, minX + w, minY + h]],
          color: '#FFD500',
        };
        onAddElement(newEl);
        onSelectElementId(newEl.id);
      } else if (activeTool === 'underline' && w > 5) {
        const newEl: HighlightElement = {
          id: `ul_${Date.now()}`,
          type: 'underline',
          page: pageNum,
          x: minX,
          y: minY,
          width: w,
          height: 10,
          rects: [[minX, minY, minX + w, minY + 10]],
          color: '#EF4444',
        };
        onAddElement(newEl);
        onSelectElementId(newEl.id);
      }

      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      setCurrentPath([]);
    }
  };

  /** Convert a PDF text block to an editable text_edit element */
  const handleEditTextBlock = (block: PageMeta['text_blocks'][0]) => {
    // Check if this block is already converted to an editable element
    const existing = elements.find(
      (el) =>
        el.page === pageNum &&
        el.type === 'text_edit' &&
        ((el as TextEditElement).original_block_id === block.id ||
          ((el as TextEditElement).original_bbox &&
            Math.abs((el as TextEditElement).original_bbox[0] - block.bbox[0]) < 3 &&
            Math.abs((el as TextEditElement).original_bbox[1] - block.bbox[1]) < 3))
    );
    if (existing) {
      onSelectElementId(existing.id);
      return;
    }

    const b = block.bbox;
    const blockW = b[2] - b[0];
    const blockH = b[3] - b[1];

    const newEl: TextEditElement = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'text_edit',
      page: pageNum,
      x: b[0],
      y: b[1],
      width: blockW,
      height: blockH,
      original_bbox: [b[0], b[1], b[2], b[3]],
      original_block_id: block.id,
      origin: block.origin,
      ascender: block.ascender,
      descender: block.descender,
      text: block.text,
      size: block.size || Math.round(blockH * 0.8) || 12,
      font: block.font || 'Helvetica',
      color: block.color || '#000000',
      bold: block.bold || false,
      italic: block.italic || false,
    };
    onAddElement(newEl);
    onSelectElementId(newEl.id);
  };

  const pageElements = elements.filter((el) => el.page === pageNum);
  const selectedElement = pageElements.find((el) => el.id === selectedElementId);

  // Check if a text block is already being edited
  const isBlockAlreadyEdited = (block: PageMeta['text_blocks'][0]) => {
    return pageElements.some(
      (el) =>
        el.type === 'text_edit' &&
        ((el as TextEditElement).original_block_id === block.id ||
          ((el as TextEditElement).original_bbox &&
            Math.abs((el as TextEditElement).original_bbox[0] - block.bbox[0]) < 3 &&
            Math.abs((el as TextEditElement).original_bbox[1] - block.bbox[1]) < 3))
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`absolute inset-0 z-10 ${
        activeTool === 'text'
          ? 'cursor-text'
          : ['whiteout', 'shape', 'highlight', 'underline'].includes(activeTool)
          ? 'cursor-crosshair'
          : activeTool === 'draw'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
      style={{
        width: `${width * zoom}px`,
        height: `${height * zoom}px`,
      }}
    >
      {/* ═══════════════════════════════════════════════════════ */}
      {/* Existing PDF text blocks — click to edit like Sejda    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {(activeTool === 'text' || activeTool === 'select') &&
        pageMeta?.text_blocks?.map((block) => {
          if (isBlockAlreadyEdited(block)) return null;

          const isHovered = hoveredBlockId === block.id;
          const blockW = block.bbox[2] - block.bbox[0];
          const blockH = block.bbox[3] - block.bbox[1];

          return (
            <div
              key={block.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleEditTextBlock(block);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => setHoveredBlockId(block.id)}
              onMouseLeave={() => setHoveredBlockId(null)}
              className="text-block-overlay absolute cursor-text z-15 select-none"
              style={{
                left: `${block.bbox[0] * zoom}px`,
                top: `${block.bbox[1] * zoom}px`,
                width: `${blockW * zoom}px`,
                height: `${blockH * zoom}px`,
                borderRadius: '0px',
                outline: isHovered ? '1px dashed #3b82f6' : 'none',
                outlineOffset: '0px',
                background: isHovered ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              }}
              title={`Click to edit: "${block.text.substring(0, 50)}${block.text.length > 50 ? '...' : ''}"`}
            >
              {/* Invisible text for native browser text selection/copying */}
              <span className="opacity-0 select-text pointer-events-none text-transparent text-[1px] absolute">
                {block.text}
              </span>
            </div>
          );
        })}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Render Page Elements                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      {pageElements.map((el) => {
        const isSelected = el.id === selectedElementId;

        // --- 1. Text & Existing Text Edit ---
        if (el.type === 'text' || el.type === 'text_edit') {
          const textEl = el as TextElement | TextEditElement;

          return (
            <EditableTextBox
              key={el.id}
              element={textEl}
              isSelected={isSelected}
              zoom={zoom}
              onSelect={() => onSelectElementId(el.id)}
              onUpdateLive={onUpdateElementLive}
              onUpdateCommit={onUpdateElement}
              onStartMove={(e) => {
                setMovingElementId(el.id);
                const { x, y } = getPdfCoordinates(e);
                setDragOffset({ x: x - el.x, y: y - el.y });
              }}
            />
          );
        }

        // --- 2. Whiteout ---
        if (el.type === 'whiteout') {
          const wo = el as WhiteoutElement;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
                setMovingElementId(el.id);
                const { x, y } = getPdfCoordinates(e);
                setDragOffset({ x: x - el.x, y: y - el.y });
              }}
              className={`interactive-element absolute bg-white cursor-move ${
                isSelected ? 'border border-dashed border-gray-500 shadow-xs' : 'border border-transparent'
              }`}
              style={{
                left: `${wo.x * zoom}px`,
                top: `${wo.y * zoom}px`,
                width: `${wo.width * zoom}px`,
                height: `${wo.height * zoom}px`,
              }}
            >
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingElementId(el.id);
                    setResizeHandle('se');
                  }}
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-se-resize -mb-1 -mr-1"
                />
              )}
            </div>
          );
        }

        // --- 3. Image & Stamp ---
        if (el.type === 'image' || el.type === 'stamp') {
          const imgEl = el as ImageElement;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
                setMovingElementId(el.id);
                const { x, y } = getPdfCoordinates(e);
                setDragOffset({ x: x - el.x, y: y - el.y });
              }}
              className={`interactive-element absolute cursor-move group ${
                isSelected ? 'border border-blue-500 shadow-sm' : 'hover:border hover:border-gray-300'
              }`}
              style={{
                left: `${imgEl.x * zoom}px`,
                top: `${imgEl.y * zoom}px`,
                width: `${imgEl.width * zoom}px`,
                height: `${imgEl.height * zoom}px`,
              }}
            >
              <img
                src={imgEl.data_url}
                alt="inserted"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingElementId(el.id);
                    setResizeHandle('se');
                  }}
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-se-resize -mb-1 -mr-1"
                />
              )}
            </div>
          );
        }

        // --- 4. Signature ---
        if (el.type === 'signature') {
          const sigEl = el as SignatureElement;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
                setMovingElementId(el.id);
                const { x, y } = getPdfCoordinates(e);
                setDragOffset({ x: x - el.x, y: y - el.y });
              }}
              className={`interactive-element absolute cursor-move ${
                isSelected ? 'border border-blue-500 shadow-sm' : 'hover:border hover:border-gray-300'
              }`}
              style={{
                left: `${sigEl.x * zoom}px`,
                top: `${sigEl.y * zoom}px`,
                width: `${sigEl.width * zoom}px`,
                height: `${sigEl.height * zoom}px`,
              }}
            >
              <img
                src={sigEl.data_url}
                alt="signature"
                className="w-full h-full object-contain pointer-events-none select-none"
              />
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingElementId(el.id);
                    setResizeHandle('se');
                  }}
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-se-resize -mb-1 -mr-1"
                />
              )}
            </div>
          );
        }

        // --- 5. Shape ---
        if (el.type === 'shape') {
          const shp = el as ShapeElement;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
                setMovingElementId(el.id);
                const { x, y } = getPdfCoordinates(e);
                setDragOffset({ x: x - el.x, y: y - el.y });
              }}
              className={`interactive-element absolute cursor-move ${
                isSelected ? 'ring-1 ring-blue-500' : ''
              }`}
              style={{
                left: `${shp.x * zoom}px`,
                top: `${shp.y * zoom}px`,
                width: `${shp.width * zoom}px`,
                height: `${shp.height * zoom}px`,
              }}
            >
              <svg className="w-full h-full overflow-visible">
                {shp.shape_type === 'rectangle' && (
                  <rect
                    x="0"
                    y="0"
                    width={shp.width * zoom}
                    height={shp.height * zoom}
                    stroke={shp.stroke_color}
                    strokeWidth={shp.stroke_width * zoom}
                    fill={shp.fill_color || 'transparent'}
                  />
                )}
                {shp.shape_type === 'ellipse' && (
                  <ellipse
                    cx={(shp.width * zoom) / 2}
                    cy={(shp.height * zoom) / 2}
                    rx={(shp.width * zoom) / 2}
                    ry={(shp.height * zoom) / 2}
                    stroke={shp.stroke_color}
                    strokeWidth={shp.stroke_width * zoom}
                    fill={shp.fill_color || 'transparent'}
                  />
                )}
                {shp.shape_type === 'line' && (
                  <line
                    x1="0"
                    y1="0"
                    x2={shp.width * zoom}
                    y2={shp.height * zoom}
                    stroke={shp.stroke_color}
                    strokeWidth={shp.stroke_width * zoom}
                  />
                )}
                {shp.shape_type === 'arrow' && (
                  <>
                    <defs>
                      <marker
                        id={`arrow_${el.id}`}
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={shp.stroke_color} />
                      </marker>
                    </defs>
                    <line
                      x1="0"
                      y1="0"
                      x2={shp.width * zoom}
                      y2={shp.height * zoom}
                      stroke={shp.stroke_color}
                      strokeWidth={shp.stroke_width * zoom}
                      markerEnd={`url(#arrow_${el.id})`}
                    />
                  </>
                )}
              </svg>
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingElementId(el.id);
                    setResizeHandle('se');
                  }}
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full cursor-se-resize -mb-1 -mr-1"
                />
              )}
            </div>
          );
        }

        // --- 6. Freehand Draw ---
        if (el.type === 'draw') {
          const drw = el as DrawElement;
          const svgPath = drw.points
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0] * zoom} ${p[1] * zoom}`)
            .join(' ');

          return (
            <svg
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              className="interactive-element absolute inset-0 w-full h-full pointer-events-stroke cursor-pointer"
            >
              <path
                d={svgPath}
                stroke={drw.color}
                strokeWidth={drw.stroke_width * zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isSelected ? 'filter drop-shadow-sm' : ''}
              />
            </svg>
          );
        }

        // --- 7. Highlight / Underline ---
        if (el.type === 'highlight' || el.type === 'underline') {
          const hl = el as HighlightElement;
          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElementId(el.id);
              }}
              className={`interactive-element absolute cursor-pointer ${
                el.type === 'highlight'
                  ? 'bg-amber-300/40 mix-blend-multiply'
                  : 'border-b-2 border-red-500'
              } ${isSelected ? 'ring-1 ring-blue-500' : ''}`}
              style={{
                left: `${el.x * zoom}px`,
                top: `${el.y * zoom}px`,
                width: `${(hl.width || 100) * zoom}px`,
                height: `${(hl.height || 16) * zoom}px`,
              }}
            />
          );
        }

        return null;
      })}

      {/* Floating Toolbar above selected element */}
      {selectedElement && (
        <FloatingToolbar
          element={selectedElement}
          onUpdateElement={onUpdateElement}
          onDuplicateElement={onDuplicateElement}
          onDeleteElement={onDeleteElement}
          zoom={zoom}
        />
      )}

      {/* Live Drawing / Dragging Preview Box */}
      {isDrawing && startPoint && currentPoint && (
        <>
          {activeTool === 'draw' ? (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d={currentPath
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0] * zoom} ${p[1] * zoom}`)
                  .join(' ')}
                stroke={selectedColor || '#000000'}
                strokeWidth={2.5 * zoom}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div
              className={`absolute pointer-events-none ${
                activeTool === 'whiteout'
                  ? 'bg-white border border-gray-400'
                  : activeTool === 'highlight'
                  ? 'bg-amber-300/40 border border-amber-400'
                  : 'border-2 border-emerald-500 border-dashed'
              }`}
              style={{
                left: `${Math.min(startPoint.x, currentPoint.x) * zoom}px`,
                top: `${Math.min(startPoint.y, currentPoint.y) * zoom}px`,
                width: `${Math.abs(currentPoint.x - startPoint.x) * zoom}px`,
                height: `${Math.abs(currentPoint.y - startPoint.y) * zoom}px`,
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
