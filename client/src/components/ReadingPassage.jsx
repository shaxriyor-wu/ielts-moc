const ReadingPassage = ({ content, highlights = [], onHighlight }) => {
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      onHighlight && onHighlight({
        text,
        start: range.startOffset,
        end: range.endOffset,
      });
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6 max-h-96 overflow-y-auto">
      <div
        className="text-gray-800 leading-relaxed select-text"
        onMouseUp={handleMouseUp}
      >
        {content}
      </div>
      {highlights.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Highlights:</h4>
          <div className="space-y-1">
            {highlights.map((h, idx) => (
              <div key={idx} className="text-sm bg-yellow-100 p-2 rounded">
                {h.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPassage;

