import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, X, FileCheck, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  downloadUrl: string;
  sizeBytes: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filename,
  downloadUrl,
  sizeBytes,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setIsDownloading(false);
      // Fire celebratory confetti!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00BB88', '#2B4EA1', '#FFD500', '#FF3366'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formattedSize =
    sizeBytes < 1024 * 1024
      ? `${(sizeBytes / 1024).toFixed(1)} KB`
      : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

  let humanFilename =
    filename.includes('_') ? filename.split('_').slice(1).join('_') : filename;
  
  // Ensure .pdf extension
  if (!humanFilename.toLowerCase().endsWith('.pdf')) {
    humanFilename += '.pdf';
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded PDF file is empty');
      }

      // Create a same-origin Blob URL so browser strictly honors download filename
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = humanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL after delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err: any) {
      console.error('Blob download failed, falling back to direct URL navigation:', err);
      setErrorMsg('Direct browser download initiated');
      // Fallback: direct window.open
      window.open(downloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 text-center space-y-4">
          {/* Animated success circle */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="font-bold text-gray-900 text-lg">Your Document is Ready!</h3>
            <p className="text-xs text-gray-500 mt-1">
              All edits, signatures, shapes, and annotations have been compiled into your PDF.
            </p>
          </div>

          {/* File Card */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold text-gray-800 truncate" title={humanFilename}>
                {humanFilename}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{formattedSize} • PDF Document</div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-amber-600">{errorMsg}</p>
          )}

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-2.5 px-4 bg-[#00BB88] hover:bg-[#009e73] active:bg-[#008964] disabled:opacity-75 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Download...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
