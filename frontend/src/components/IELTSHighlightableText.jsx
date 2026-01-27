import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Highlighter, X } from 'lucide-react';

const IELTSHighlightableText = ({ content, highlights = [], onHighlight, className = '' }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const contentRef = useRef(null);

  // Helper: Get all text nodes within an element
  const getAllTextNodes = (element) => {
    const textNodes = [];
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walk.nextNode())) {
      textNodes.push(node);
    }
    return textNodes;
  };

  // Helper: Calculate global start/end offset for a standard DOM Range relative to a container
  const getGlobalRange = (range, container) => {
    const textNodes = getAllTextNodes(container);
    let startOffset = 0;
    let endOffset = 0;
    let foundStart = false;
    let foundEnd = false;

    // Calculate start offset
    for (const node of textNodes) {
      if (node === range.startContainer) {
        startOffset += range.startOffset;
        foundStart = true;
      } else if (!foundStart) {
        startOffset += node.nodeValue.length;
      }

      if (node === range.endContainer) {
        endOffset += range.endOffset;
        foundEnd = true;
      } else if (!foundEnd) {
        endOffset += node.nodeValue.length;
      }

      if (foundStart && foundEnd) break;
    }

    return { start: startOffset, end: endOffset, text: range.toString() };
  };

  // Helper: Create a DOM Range from global offsets
  const createRangeFromGlobalOffsets = (start, end, container) => {
    const textNodes = getAllTextNodes(container);
    const range = document.createRange();
    let currentPos = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    for (const node of textNodes) {
      const nodeLength = node.nodeValue.length;

      // Find start node
      if (!startNode && start >= currentPos && start < currentPos + nodeLength) {
        startNode = node;
        startOffset = start - currentPos;
      }

      // Find end node
      if (!endNode && end > currentPos && end <= currentPos + nodeLength) {
        endNode = node;
        endOffset = end - currentPos;
      }

      currentPos += nodeLength;
    }

    // Edge case: End is exactly at the end of the last node
    if (!endNode && end === currentPos && textNodes.length > 0) {
      endNode = textNodes[textNodes.length - 1];
      endOffset = endNode.nodeValue.length;
    }

    if (startNode && endNode) {
      try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
      } catch (err) {
        console.error('Error creating range:', err);
        return null;
      }
    }
    return null;
  };

  // Render content and apply highlights
  useEffect(() => {
    if (!contentRef.current) return;

    // Reset content to raw HTML first to remove old marks
    contentRef.current.innerHTML = content;

    if (!highlights || highlights.length === 0) return;

    // Sort highlights to apply from end to start (sometimes helps with integrity, though Range API handles it)
    // Actually for DOM manipulation, we can do any order if we use Range carefully, 
    // but sorting by start position is good for processing.
    const validHighlights = highlights.filter(h => h.start !== undefined && h.end !== undefined);

    // Sort reverse to avoid messing up offsets when wrapping (though surroundContents usually safeguards if we don't change text length, but splitting nodes changes structure)
    // HOWEVER, standard practice with Range wrappers:
    // If we wrap "foo" in <b>foo</b>, the text offset usually remains same if we just count text, BUT text nodes are split.
    // So we MUST calculate ranges for ALL highlights FIRST, then apply them.
    // Because applying one highlight splits text nodes, invalidating future text node refs.

    const rangesToHighlight = [];

    // 1. Calculate all Ranges first
    validHighlights.forEach(h => {
      const range = createRangeFromGlobalOffsets(h.start, h.end, contentRef.current);
      if (range) {
        rangesToHighlight.push({ range, color: h.color });
      }
    });

    // 2. Identify LEGACY highlights (missing start/end or invalid) and try to match them by text
    const legacyHighlights = highlights.filter(h => h.start === undefined || h.end === undefined);
    if (legacyHighlights.length > 0) {
      // Create a walker to find text
      const fullText = contentRef.current.textContent;
      legacyHighlights.forEach(h => {
        if (h.text) {
          // Find first occurrence of text (simple fallback)
          const index = fullText.indexOf(h.text);
          if (index !== -1) {
            const range = createRangeFromGlobalOffsets(index, index + h.text.length, contentRef.current);
            if (range) {
              rangesToHighlight.push({ range, color: h.color });
            }
          }
        }
      });
    }

    // 3. Apply highlights
    // We must apply them. Note: overlapping highlights are tricky. 
    // `surroundContents` fails if range partially intersects a non-text node. 
    // For this implementation, we assume highlights are mostly within paragraphs.
    // We reverse them so we mess up the DOM tree from bottom up? 
    // Actually, splitting text nodes invalidates the "Range" objects if they point to those nodes.
    // So we CANNOT calculate all ranges first and then apply. We must do it dynamically OR handle node splitting.
    // 
    // Correct approach to avoid complex node tracking:
    // Re-calculate range for each highlight? No, that's expensive.
    // 
    // BETTER APPROACH: "Highlight.js" style
    // Use the stored offsets. Apply one by one. But since applying one changes the DOM tree (splits nodes), 
    // the subsequent `createRangeFromGlobalOffsets` calls will work FINE because they re-traverse the **current** tree 
    // and count text characters (which don't change).
    // So: Loop highlights -> calculate range -> apply -> Loop next.
    // 
    // IMPORTANT: `createRangeFromGlobalOffsets` relies on `getAllTextNodes`.
    // If we modify DOM, `getAllTextNodes` returns new set of split nodes. 
    // Logic `currentPos` will still track correctly through the split nodes.

    validHighlights.forEach(h => {
      const range = createRangeFromGlobalOffsets(h.start, h.end, contentRef.current);
      if (range) {
        wrapRange(range, h.color, h.id || Math.random());
      }
    });

    // Legacy fallback (Apply these too)
    legacyHighlights.forEach(h => {
      if (h.text) {
        // We find matches again because DOM might have changed
        const currentText = contentRef.current.textContent; // Text content remains same
        // But finding exact match index is better done on original string if possible? 
        // No, relying on current text content is safest.

        // Simple first match strategy
        const index = currentText.indexOf(h.text);
        if (index !== -1) {
          const range = createRangeFromGlobalOffsets(index, index + h.text.length, contentRef.current);
          if (range) {
            wrapRange(range, h.color, Math.random());
          }
        }
      }
    });

  }, [content, highlights]);

  const wrapRange = (range, color, id) => {
    try {
      const mark = document.createElement('mark');
      const colorClass = color === 'green' ? 'bg-green-300 dark:bg-green-700' : 'bg-yellow-300 dark:bg-yellow-700';
      mark.className = `${colorClass} px-0.5 rounded cursor-pointer`; // px-0.5 for slight breathing room
      mark.dataset.highlightId = id; // Store ID if needed

      // surroundContents fails if range crosses block boundaries.
      // Fallback: extractContents -> append to mark -> insert mark
      // But extracting removes it.
      // Better: Recursive wrapper if robust, but for now try surroundContents.
      // If it fails (e.g. selection across <p>), we might need a more complex strategy 
      // or just ignore bad selections.

      // Check if range is valid for surroundContents
      // It throws if range splits a non-text node partially.

      range.surroundContents(mark);
    } catch (e) {
      console.warn('Could not highlight range (likely spans across block elements):', e);
      // Advanced: If spanning blocks, ideally we split the range into multiple ranges (one per block)
      // But for this fix, we'll accept that users should highlight within blocks mostly.
    }
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();

    if (text.length > 0 && contentRef.current.contains(range.commonAncestorContainer)) {
      const rect = range.getBoundingClientRect();
      const globalOffsets = getGlobalRange(range, contentRef.current);

      setSelectedText(text);
      setSelectionRange(globalOffsets);

      // Center toolbar above selection
      // Calculate relative to viewport, handling scroll
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + (rect.width / 2)
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  const applyHighlight = (color) => {
    if (selectedText && selectionRange && onHighlight) {
      // Add new highlight
      // Note: We use the range we calculated earlier
      const newHighlight = {
        start: selectionRange.start,
        end: selectionRange.end,
        text: selectedText,
        color: color,
        id: Date.now() // Unique ID
      };

      onHighlight([...highlights, newHighlight]);

      // Cleanup
      setSelectedText('');
      setSelectionRange(null);
      setShowToolbar(false);
      window.getSelection().removeAllRanges();
    }
  };

  const removeHighlight = (highlightId) => {
    // This is tricky: We don't have IDs on the highlights input usually?
    // If we added an ID in wrapRange, we can track it.
    // But props `highlights` is array of objects.
    // We need to map the DOM click back to the highlight object.
    // With global offsets, we can find which highlight covers this range?
    // OR: We give each highlight a unique ID if it doesn't have one when saving.

    // For now, if we don't have persistent IDs, we can't reliably delete by ID from the parent.
    // We'll rely on index or start/end.
    // Let's pass the index in dataset if possible? 
    // Re-rendering clears DOM so dataset index relies on render order.

    // Better: when rendering, we can assign temporary IDs or use index.
    // Update: render loop below.
  };

  // Click handler to remove
  // We need to know WHICH highlight triggers this.
  // In the render loop, we match highlights to DOM elements.
  // We can attach the INDEX to the dataset.
  const handleTextClick = (e) => {
    // Find closest mark
    const mark = e.target.closest('mark');
    if (mark) {
      // Get the index from dataset
      const index = parseInt(mark.dataset.index);
      if (!isNaN(index) && onHighlight) {
        // Remove highlight at index
        const newHighlights = highlights.filter((_, i) => i !== index);
        onHighlight(newHighlights);
      }
    }
  };

  return (
    <div className={`${className} relative`}>
      {/* Content Area */}
      <div
        ref={contentRef}
        className="select-text cursor-text leading-relaxed prose prose-lg max-w-none dark:prose-invert"
        style={{
          fontFamily: "'Times New Roman', 'Times', serif",
          fontSize: 'inherit',
          lineHeight: 'inherit',
        }}
        onMouseUp={handleMouseUp}
        onClick={handleTextClick}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Floating Highlight Toolbar */}
      {showToolbar && selectedText && toolbarPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          style={{
            position: 'fixed',
            top: toolbarPosition.top,
            left: toolbarPosition.left,
            transform: 'translateX(-50%)',
            zIndex: 1000,
          }}
          className="flex flex-col items-center"
        >
          <div className="flex gap-1 p-1 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 items-center">
            <button
              onClick={() => applyHighlight('yellow')}
              className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center transition-colors group relative"
              title="Yellow Highlight"
            >
              <div className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-200"></div>
            </button>
            <button
              onClick={() => applyHighlight('green')}
              className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center transition-colors group"
              title="Green Highlight"
            >
              <div className="w-4 h-4 rounded-full bg-green-400 border border-green-200"></div>
            </button>
            <div className="w-px h-5 bg-gray-700 mx-1"></div>
            <button
              onClick={() => {
                setSelectedText('');
                setSelectionRange(null);
                setShowToolbar(false);
                window.getSelection().removeAllRanges();
              }}
              className="w-8 h-8 rounded hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Arrow */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 mt-[-1px]"></div>
        </motion.div>
      )}
    </div>
  );
};

export default IELTSHighlightableText;
