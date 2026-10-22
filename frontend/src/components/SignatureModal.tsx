import React, { useState, useRef, useEffect } from 'react';
import {
  Keyboard,
  PenTool,
  Upload,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string, saveToHistory: boolean) => void;
}

const SIGNATURE_FONTS = [
  { name: 'Stalemate', class: 'font-stalemate' },
  { name: 'Caveat', class: 'font-caveat' },
  { name: 'Cedarville Cursive', class: 'font-cedarville' },
  { name: 'Dancing Script', class: 'font-dancing' },
  { name: 'Give You Glory', class: 'font-giveyouglory' },
  { name: 'Kristi', class: 'font-kristi' },
  { name: 'Mr De Haviland', class: 'font-mrdehaviland' },
  { name: 'Norican', class: 'font-norican' },
  { name: 'Reenie Beanie', class: 'font-reenie' },
  { name: 'Satisfy', class: 'font-satisfy' },
  { name: 'Zeyada', class: 'font-zeyada' },
];

const SIGN_COLORS = [
  '#000000',
  '#2B4EA1',
  '#0000FF',
  '#333333',
  '#4D6DE6',
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'type' | 'draw' | 'upload'>('type');
  const [typedName, setTypedName] = useState('Alex Appleseed');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name);
  const [selectedColor, setSelectedColor] = useState(SIGN_COLORS[0]);
  const [saveToHistory, setSaveToHistory] = useState(true);

  // Drawing Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Uploaded image
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = selectedColor;
      }
    }
  }, [activeTab, selectedColor]);

  if (!isOpen) return null;

  // Clear drawing canvas
  const handleClearDraw = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasDrawn(false);
      }
    }
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  // Upload image handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedImageUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (activeTab === 'type') {
      // Render text into an offscreen canvas to export as transparent PNG
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = 120;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.font = `48px '${selectedFont}', cursive`;
        ctx.fillStyle = selectedColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName || 'Signature', c.width / 2, c.height / 2);
        const dataUrl = c.toDataURL('image/png');
        onSaveSignature(dataUrl, saveToHistory);
      }
    } else if (activeTab === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSignature(dataUrl, saveToHistory);
    } else if (activeTab === 'upload' && uploadedImageUrl) {
      onSaveSignature(uploadedImageUrl, saveToHistory);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-base">Create Signature</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50 px-4">
          <button
            onClick={() => setActiveTab('type')}
            className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'type'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Type</span>
          </button>
          <button
            onClick={() => setActiveTab('draw')}
            className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'draw'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Draw</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Tab 1: Type */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />

              {/* Color options */}
              <div className="flex items-center justify-center gap-2 py-1">
                {SIGN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === c ? 'scale-125 border-gray-900 ring-2 ring-gray-300' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Handwriting font preview cards */}
              <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                {SIGNATURE_FONTS.map((font) => (
                  <div
                    key={font.name}
                    onClick={() => setSelectedFont(font.name)}
                    className={`border-2 rounded-lg p-3 text-center cursor-pointer transition-all ${
                      selectedFont === font.name
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`text-2xl truncate ${font.class}`}
                      style={{ color: selectedColor }}
                    >
                      {typedName || 'Signature'}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{font.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Draw */}
          {activeTab === 'draw' && (
            <div className="space-y-3 flex flex-col items-center">
              <div className="flex items-center justify-between w-full max-w-md px-1">
                <span className="text-xs text-gray-500">Sign with mouse or touchpad</span>
                <div className="flex items-center gap-1.5">
                  {SIGN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-4 h-4 rounded-full border ${
                        selectedColor === c ? 'scale-125 border-black' : 'border-transparent'
                      }`}
                    />
                  ))}
                  <button
                    onClick={handleClearDraw}
                    className="ml-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1 p-1 hover:bg-red-50 rounded"
                    title="Clear canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner checker-bg">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={180}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  className="cursor-crosshair bg-white/90"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Upload Image */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center">
              <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors block">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-xs font-semibold text-gray-700">
                  Click to select signature image
                </span>
                <span className="text-[11px] text-gray-400">PNG, JPG, or WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {uploadedImageUrl && (
                <div className="p-3 border border-gray-200 rounded-lg flex items-center justify-center checker-bg max-h-36">
                  <img
                    src={uploadedImageUrl}
                    alt="uploaded signature"
                    className="max-h-28 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Save to history checkbox */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
            <input
              type="checkbox"
              id="saveSig"
              checked={saveToHistory}
              onChange={(e) => setSaveToHistory(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="saveSig" className="text-xs text-gray-600 cursor-pointer">
              Save signature for future documents
            </label>
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
            <span>Save & Place</span>
          </button>
        </div>
      </div>
    </div>
  );
};
