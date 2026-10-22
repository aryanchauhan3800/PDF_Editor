export type ToolType =
  | 'select'
  | 'text'
  | 'link'
  | 'form'
  | 'image'
  | 'sign'
  | 'whiteout'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'draw'
  | 'draw_highlight'
  | 'shape'
  | 'stamp';

export type ShapeType = 'rectangle' | 'ellipse' | 'line' | 'arrow';

export interface PageMeta {
  page_num: number;
  width: number;
  height: number;
  rotation: number;
  text_blocks: Array<{
    id: string;
    bbox: [number, number, number, number];
    origin?: [number, number];
    ascender?: number;
    descender?: number;
    text: string;
    size?: number;
    font?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
  }>;
}

export interface DocumentInfo {
  num_pages: number;
  title: string;
  author: string;
  is_encrypted: boolean;
  pages: PageMeta[];
}

export interface PageConfig {
  original_page: number | null;
  rotation: number;
  is_new_blank?: boolean;
  width: number;
  height: number;
}

export interface BaseElement {
  id: string;
  type: string;
  page: number; // 1-indexed
  x: number;    // PDF points
  y: number;    // PDF points
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  size: number;
  font: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  line_height?: number;
  letter_spacing?: number;
  opacity?: number;
  background_color?: string;
  width?: number;
  height?: number;
}

export interface TextEditElement extends BaseElement {
  type: 'text_edit';
  original_bbox: [number, number, number, number];
  original_block_id?: string;
  origin?: [number, number];
  ascender?: number;
  descender?: number;
  text: string;
  size: number;
  font: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  line_height?: number;
  letter_spacing?: number;
  opacity?: number;
  background_color?: string;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: 'image' | 'stamp';
  width: number;
  height: number;
  data_url: string;
}

export interface SignatureElement extends BaseElement {
  type: 'signature';
  width: number;
  height: number;
  data_url: string;
  stroke_color: string;
}

export interface WhiteoutElement extends BaseElement {
  type: 'whiteout';
  width: number;
  height: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape_type: ShapeType;
  width: number;
  height: number;
  stroke_color: string;
  stroke_width: number;
  fill_color: string | null;
}

export interface DrawElement extends BaseElement {
  type: 'draw';
  points: Array<[number, number]>;
  color: string;
  stroke_width: number;
}

export interface HighlightElement extends BaseElement {
  type: 'highlight' | 'underline' | 'strikeout';
  rects: Array<[number, number, number, number]>;
  color: string;
  width?: number;
  height?: number;
}

export type EditorElement =
  | TextElement
  | TextEditElement
  | ImageElement
  | SignatureElement
  | WhiteoutElement
  | ShapeElement
  | DrawElement
  | HighlightElement;

export interface HistorySnapshot {
  page_sequence: PageConfig[];
  elements: EditorElement[];
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  execution_log?: string[];
  verification?: {
    valid: boolean;
    page_count: number;
    elements_count: number;
  };
}
