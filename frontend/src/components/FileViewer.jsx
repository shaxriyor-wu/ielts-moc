import { useState, useEffect, useRef } from 'react';
import { FileText, Loader as LoaderIcon, Download, ExternalLink } from 'lucide-react';
import Loader from './Loader';
import { showToast } from './Toast';

const FileViewer = ({ fileUrl, fileType, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState('');
  const [iframeError, setIframeError] = useState(false);
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
        setIframeError(false);

        if (fileType === 'pdf') {
          // For PDF, use iframe with PDF.js or direct PDF viewer
          // Set a timeout to detect if PDF fails to load
          const timeout = setTimeout(() => {
            if (loading) {
              setIframeError(true);
              setLoading(false);
            }
          }, 10000); // 10 second timeout

          // Check if file is accessible
          try {
            const response = await fetch(fileUrl, { method: 'HEAD' });
            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('File not found. Please contact administrator.');
              }
              throw new Error(`HTTP ${response.status}`);
            }
            clearTimeout(timeout);
            setLoading(false);
          } catch (err) {
            clearTimeout(timeout);
            if (err.message.includes('404') || err.message.includes('not found')) {
              setError('PDF file not found. The file may not have been uploaded yet.');
            } else {
              setError(`Failed to access PDF file: ${err.message}`);
            }
            setLoading(false);
          }
        } else if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
          // For Images
          setLoading(false);
        } else if (fileType === 'docx' || fileType === 'doc') {
          // For DOCX, we'll need to convert or use a viewer
          // For now, show a message that DOCX viewing needs implementation
          setError('DOCX file viewing requires additional setup. Please download the file to view it.');
          setLoading(false);
        } else {
          // Try to fetch as text
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const text = await response.text();
          setContent(text);
          setLoading(false);
        }
      } catch (err) {
        setError(`Failed to load file: ${err.message}`);
        setLoading(false);
      }
    };

    loadFile();
  }, [fileUrl, fileType]);

  const handleIframeLoad = () => {
    setLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
    setLoading(false);
    setError('Failed to load PDF in viewer. Please try downloading the file.');
  };

  if (loading && !iframeError) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 ${className}`}>
        <LoaderIcon className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
      </div>
    );
  }

  if (error || iframeError) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 dark:text-red-300 font-medium mb-2">
              {error || 'Failed to load document'}
            </p>
            <div className="flex gap-2 mt-3">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </a>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fileType === 'pdf') {
    // Use multiple fallback methods for PDF viewing
    const pdfUrl = `${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-width`;

    return (
      <div className={`w-full ${className}`}>
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>PDF Document Viewer</span>
          <div className="flex gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
            <a
              href={fileUrl}
              download
              className="inline-flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Download className="w-3 h-3" />
              Download
            </a>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white"
          style={{
            minHeight: '800px',
            height: 'calc(100vh - 200px)',
            maxHeight: '1200px'
          }}
          title="PDF Viewer"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="fullscreen"
        />
        {/* Fallback embed using object tag */}
        {iframeError && (
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white"
            style={{
              minHeight: '800px',
              height: 'calc(100vh - 200px)',
              maxHeight: '1200px'
            }}
          >
            <p className="p-4 text-center text-gray-600 dark:text-gray-400">
              Your browser does not support PDF viewing.
              <a href={fileUrl} download className="text-primary-600 dark:text-primary-400 underline ml-1">
                Download the PDF
              </a>
            </p>
          </object>
        )}
      </div>
    );
  }

  if (fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg') {
    return (
      <div className={`w-full flex justify-center ${className}`}>
        <img
          src={fileUrl}
          alt="Task Reference"
          className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          style={{ maxHeight: '800px' }}
        />
      </div>
    )
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

