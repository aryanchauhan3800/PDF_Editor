import React, { useState } from 'react';
import { X, Search, Replace } from 'lucide-react';
import { EditorElement, TextElement, TextEditElement } from '../types';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: EditorElement[];
  onUpdateElements: (updated: EditorElement[]) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  elements,
  onUpdateElements,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleReplaceAll = () => {
    if (!findText) {
      setStatusMessage('Please enter text to find');
      return;
    }

    let replacedCount = 0;
    const newElements = elements.map((el) => {
      if (el.type === 'text' || el.type === 'text_edit') {
        const textEl = el as TextElement | TextEditElement;
        const currentText = textEl.text;
        const flags = matchCase ? 'g' : 'gi';
        const regex = new RegExp(findText, flags);
        if (regex.test(currentText)) {
          const updated = currentText.replace(regex, replaceText);
          replacedCount++;
          return { ...textEl, text: updated };
        }
      }
      return el;
    });

    if (replacedCount > 0) {
      onUpdateElements(newElements);
      setStatusMessage(`Replaced text in ${replacedCount} element(s).`);
    } else {
      setStatusMessage(`No matches found for "${findText}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Find & Replace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Find</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Enter text to find..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Replace With</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="matchCase"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="matchCase" className="text-xs text-gray-600 cursor-pointer">
              Match case
            </label>
          </div>

          {statusMessage && (
            <div className="text-xs font-medium text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700"
          >
            Close
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-4 py-1.5 bg-[#00BB88] hover:bg-[#009e73] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Replace className="w-4 h-4" />
            <span>Replace All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
