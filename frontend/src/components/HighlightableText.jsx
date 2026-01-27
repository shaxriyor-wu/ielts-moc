import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const HighlightableText = ({ content, highlights = [], onHighlight, className = '' }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && highlights.length > 0) {
      let html = content;
      highlights.forEach((highlight, index) => {
        if (highlight.text) {
          const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const colorClass = `highlight-${highlight.color || 'yellow'}`;
          const regex = new RegExp(`(${escapedText})`, 'gi');
          html = html.replace(regex, `<mark class="${colorClass} px-1 rounded" data-highlight-id="${index}">$1</mark>`);
        }
      });
      contentRef.current.innerHTML = html;
    }
  }, [highlights, content]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset,
        text: text
      });
      setShowColorPicker(true);
    }
  };

  const applyHighlight = (color) => {
    if (selectedText && selectionRange && onHighlight) {
      onHighlight({
        ...selectionRange,
        color: color,
        text: selectedText
      });
      setSelectedText('');
      setSelectionRange(null);
      setShowColorPicker(false);
      window.getSelection().removeAllRanges();
    }
  };

  const removeHighlight = (index) => {
    if (onHighlight) {
      const newHighlights = highlights.filter((_, i) => i !== index);
      onHighlight(newHighlights);
    }
  };

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="select-text cursor-text leading-relaxed text-gray-800 dark:text-gray-200"
        onMouseUp={handleMouseUp}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      {showColorPicker && selectedText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex gap-2 items-center"
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">Highlight as:</span>
          <button
            onClick={() => applyHighlight('yellow')}
            className="px-3 py-1.5 bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-900 dark:hover:bg-yellow-800 rounded text-sm font-medium transition-colors"
          >
            Yellow
          </button>
          <button
            onClick={() => applyHighlight('blue')}
            className="px-3 py-1.5 bg-blue-200 hover:bg-blue-300 dark:bg-blue-900 dark:hover:bg-blue-800 rounded text-sm font-medium transition-colors"
          >
            Blue
          </button>
          <button
            onClick={() => applyHighlight('green')}
            className="px-3 py-1.5 bg-green-200 hover:bg-green-300 dark:bg-green-900 dark:hover:bg-green-800 rounded text-sm font-medium transition-colors"
          >
            Green
          </button>
          <button
            onClick={() => {
              setSelectedText('');
              setSelectionRange(null);
              setShowColorPicker(false);
              window.getSelection().removeAllRanges();
            }}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {highlights.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Highlights:</p>
          <div className="space-y-1">
            {highlights.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded highlight-${h.color || 'yellow'}`}>
                  {h.text}
                </span>
                <button
                  onClick={() => removeHighlight(idx)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightableText;
