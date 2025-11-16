import { useState, useEffect, useRef } from 'react';
import { FileText, Loader as LoaderIcon } from 'lucide-react';
import Loader from './Loader';

const FileViewer = ({ fileUrl, fileType, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (fileType === 'pdf') {
          // For PDF, use iframe with PDF.js or direct PDF viewer
          setLoading(false);
        } else if (fileType === 'docx' || fileType === 'doc') {
          // For DOCX, we'll need to convert or use a viewer
          // For now, show a message that DOCX viewing needs implementation
          setError('DOCX file viewing requires additional setup. Please ensure the file is accessible.');
          setLoading(false);
        } else {
          // Try to fetch as text
          const response = await fetch(fileUrl);
          const text = await response.text();
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load file');
        setLoading(false);
      }
    };

    loadFile();
  }, [fileUrl, fileType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <LoaderIcon className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <p className="text-red-800 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (fileType === 'pdf') {
    return (
      <div className={`w-full ${className}`}>
        <iframe
          ref={iframeRef}
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white"
          style={{ 
            minHeight: '800px',
            height: '100vh',
            maxHeight: '1200px'
          }}
          title="PDF Viewer"
          onLoad={() => setLoading(false)}
        />
      </div>
    );
  }

  // For text content or HTML
  return (
    <div
      className={`prose prose-lg max-w-none dark:prose-invert ${className}`}
      style={{
        fontFamily: "'Times New Roman', 'Times', serif",
        fontSize: '16px',
        lineHeight: '1.8',
        color: '#1f2937',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default FileViewer;

