import React, { useState } from 'react';
import { X, Check, Stamp } from 'lucide-react';

interface StampModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStamp: (dataUrl: string) => void;
}

const STAMP_COLORS = [
  { name: 'Green', hex: '#2B5329' },
  { name: 'Blue', hex: '#2B4B8D' },
  { name: 'Red', hex: '#C41E3A' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Purple', hex: '#4B0082' },
  { name: 'Black', hex: '#000000' },
];

export const StampModal: React.FC<StampModalProps> = ({
  isOpen,
  onClose,
  onSaveStamp,
}) => {
  const [subject, setSubject] = useState('APPROVED');
  const [author, setAuthor] = useState('Alex Appleseed');
  const [selectedColor, setSelectedColor] = useState(STAMP_COLORS[0].hex);
  const [showDateTime, setShowDateTime] = useState(true);

  if (!isOpen) return null;

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleSave = () => {
    // Generate clean SVG stamp data URL
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="110" viewBox="0 0 400 110">
        <rect x="5" y="5" width="390" height="100" rx="15" ry="15" fill="none" stroke="${selectedColor}" stroke-width="3.5" />
        <text x="200" y="50" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="900" fill="${selectedColor}" text-anchor="middle" letter-spacing="2">${subject.toUpperCase()}</text>
        ${
          showDateTime
            ? `<text x="200" y="85" font-family="Helvetica, Arial, sans-serif" font-size="14" font-weight="600" fill="${selectedColor}" text-anchor="middle">By ${author} on ${currentDateStr}</text>`
            : ''
        }
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    onSaveStamp(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stamp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 text-base">Create Stamp</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              {STAMP_COLORS.map((col) => (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(col.hex)}
                  style={{ backgroundColor: col.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === col.hex ? 'scale-125 border-gray-900 ring-2 ring-gray-300' : 'border-transparent'
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          {/* Date toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="stampDate"
              checked={showDateTime}
              onChange={(e) => setShowDateTime(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="stampDate" className="text-xs text-gray-700 font-medium cursor-pointer">
              Include Author Name and Timestamp
            </label>
          </div>

          {/* Live Preview */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Live Stamp Preview
            </label>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
              <div
                className="border-[3px] rounded-xl px-8 py-3 text-center max-w-sm w-full"
                style={{ borderColor: selectedColor }}
              >
                <div
                  className="font-black text-2xl tracking-widest uppercase"
                  style={{ color: selectedColor }}
                >
                  {subject || 'STAMP'}
                </div>
                {showDateTime && (
                  <div
                    className="text-xs font-semibold mt-1"
                    style={{ color: selectedColor }}
                  >
                    By {author} on {currentDateStr}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#00BB88] hover:bg-[#009e73] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Place Stamp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
