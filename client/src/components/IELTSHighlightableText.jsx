import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Highlighter, X } from 'lucide-react';

const IELTSHighlightableText = ({ content, highlights = [], onHighlight, className = '' }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedColor, setSelectedColor] = useState('yellow');
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && highlights.length > 0) {
      let html = content;
      // Sort highlights by position to avoid overlapping issues
      const sortedHighlights = [...highlights].sort((a, b) => {
        const aStart = a.start || 0;
        const bStart = b.start || 0;
        return aStart - bStart;
      });

      sortedHighlights.forEach((highlight, index) => {
        if (highlight.text) {
          const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const colorClass = highlight.color === 'green' ? 'bg-green-300 dark:bg-green-700' : 'bg-yellow-300 dark:bg-yellow-700';
          const regex = new RegExp(`(${escapedText})`, 'gi');
          html = html.replace(regex, `<mark class="${colorClass} px-1 rounded cursor-pointer" data-highlight-id="${index}" data-color="${highlight.color}">$1</mark>`);
        }
      });
      contentRef.current.innerHTML = html;
    } else if (contentRef.current) {
      contentRef.current.innerHTML = content;
    }
  }, [highlights, content]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length > 0 && !text.match(/<mark/)) {
      setSelectedText(text);
      const range = selection.getRangeAt(0);
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset,
        text: text,
        container: range.commonAncestorContainer
      });
      setShowToolbar(true);
    }
  };

  const applyHighlight = (color) => {
    if (selectedText && selectionRange && onHighlight) {
      const newHighlight = {
        ...selectionRange,
        color: color,
        text: selectedText
      };
      onHighlight([...highlights, newHighlight]);
      setSelectedText('');
      setSelectionRange(null);
      setShowToolbar(false);
      window.getSelection().removeAllRanges();
    }
  };

  const removeHighlight = (index) => {
    if (onHighlight) {
      const newHighlights = highlights.filter((_, i) => i !== index);
      onHighlight(newHighlights);
    }
  };

  const handleTextClick = (e) => {
    if (e.target.tagName === 'MARK') {
      const highlightId = parseInt(e.target.dataset.highlightId);
      if (highlightId !== undefined) {
        // Option to remove highlight on click
        removeHighlight(highlightId);
      }
    }
  };

  return (
    <div className={className}>
      {/* Highlighting Toolbar */}
      <div className="mb-4 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Highlighter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Highlight:</span>
        <button
          onClick={() => setSelectedColor('yellow')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            selectedColor === 'yellow'
              ? 'bg-yellow-300 dark:bg-yellow-700 text-gray-900 dark:text-white'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-gray-700 dark:text-gray-300 hover:bg-yellow-200 dark:hover:bg-yellow-800'
          }`}
        >
          Yellow
        </button>
        <button
          onClick={() => setSelectedColor('green')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            selectedColor === 'green'
              ? 'bg-green-300 dark:bg-green-700 text-gray-900 dark:text-white'
              : 'bg-green-100 dark:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:bg-green-200 dark:hover:bg-green-800'
          }`}
        >
          Green
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          Select text and click color to highlight
        </span>
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        className="select-text cursor-text leading-relaxed text-gray-800 dark:text-gray-200 prose prose-lg max-w-none dark:prose-invert"
        style={{
          fontFamily: "'Times New Roman', 'Times', serif",
          fontSize: '16px',
          lineHeight: '1.8',
        }}
        onMouseUp={handleMouseUp}
        onClick={handleTextClick}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      
      {/* Highlight Confirmation Toolbar */}
      {showToolbar && selectedText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex gap-2 items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">Highlight "{selectedText.substring(0, 30)}..." as:</span>
          <button
            onClick={() => applyHighlight('yellow')}
            className="px-3 py-1.5 bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-900 dark:hover:bg-yellow-800 rounded text-sm font-medium transition-colors"
          >
            Yellow
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
              setShowToolbar(false);
              window.getSelection().removeAllRanges();
            }}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default IELTSHighlightableText;

