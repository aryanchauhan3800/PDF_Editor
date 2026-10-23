import { DocumentInfo, PageConfig, EditorElement } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

export async function uploadPDF(file: File): Promise<{ session_id: string; filename: string; info: DocumentInfo }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/pdf/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload PDF' }));
    throw new Error(err.detail || 'Upload failed');
  }

  return res.json();
}

export async function createBlankPDF(pages = 1): Promise<{ session_id: string; filename: string; info: DocumentInfo }> {
  const res = await fetch(`${API_BASE}/pdf/blank?pages=${pages}`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to create blank PDF');
  }

  return res.json();
}

export function getPageImageUrl(sessionId: string, pageNum: number, scale = 2.5, version = 1): string {
  return `${API_BASE}/pdf/${sessionId}/page/${pageNum}.png?scale=${scale}&v=${version}`;
}

export function getPageThumbUrl(sessionId: string, pageNum: number, width = 180): string {
  return `${API_BASE}/pdf/${sessionId}/page/${pageNum}/thumb.png?width=${width}`;
}

export async function exportPDF(payload: {
  session_id: string;
  export_filename?: string;
  page_sequence: PageConfig[];
  elements: EditorElement[];
}): Promise<{
  success: boolean;
  filename: string;
  download_url: string;
  size_bytes: number;
  verification: {
    valid: boolean;
    num_pages: number;
    error: string | null;
  };
}> {
  const res = await fetch(`${API_BASE}/pdf/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to export PDF' }));
    throw new Error(err.detail || 'Export failed');
  }

  return res.json();
}

export async function sendAICommand(payload: {
  session_id: string;
  command: string;
  page_sequence: PageConfig[];
  elements: EditorElement[];
  default_signature?: string;
}): Promise<{
  success: boolean;
  message: string;
  should_export: boolean;
  execution_log: string[];
  verification: {
    valid: boolean;
    page_count: number;
    elements_count: number;
  };
  updated_page_sequence: PageConfig[];
  updated_elements: EditorElement[];
}> {
  const res = await fetch(`${API_BASE}/ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI command failed' }));
    throw new Error(err.detail || 'Command processing failed');
  }

  return res.json();
}
