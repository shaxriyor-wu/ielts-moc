import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { showToast } from '../../components/Toast';
import { FileText, Headphones, BookOpen, PenTool, Mic, Eye, Plus, Trash2 } from 'lucide-react';
import VariantPreviewModal from './VariantPreviewModal';

const Variants = () => {
  const [activeTab, setActiveTab] = useState('listening');
  const [variants, setVariants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewVariant, setPreviewVariant] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const response = await adminApi.getAvailableVariants();
      setVariants(response.data.counts);
    } catch (error) {
      showToast('Failed to load variants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (sectionType, sectionName, filename) => {
    setPreviewVariant({ sectionType, sectionName, filename });
    setShowPreview(true);
  };

  const tabs = [
    { id: 'listening', label: 'Listening', icon: Headphones },
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'writing', label: 'Writing', icon: PenTool },
    { id: 'speaking', label: 'Speaking', icon: Mic },
  ];

  const renderListeningSection = () => {
    if (!variants?.listening) return null;

    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((sectionNum) => {
          const sectionKey = `section${sectionNum}`;
          const sectionData = variants.listening[sectionKey];
          const count = sectionData?.count || 0;
          const files = sectionData?.files || [];

          return (
            <Card key={sectionNum} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Section {sectionNum}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {count} variant{count !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {/* TODO: Add variant */}}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((filename, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {filename}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handlePreview('listening', sectionKey, filename)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete */}}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No variants available for Section {sectionNum}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderReadingSection = () => {
    if (!variants?.reading) return null;

    return (
      <div className="space-y-4">
        {[1, 2, 3].map((passageNum) => {
          const passageKey = `passage${passageNum}`;
          const passageData = variants.reading[passageKey];
          const count = passageData?.count || 0;
          const files = passageData?.files || [];

          return (
            <Card key={passageNum} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Passage {passageNum}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {count} variant{count !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {/* TODO: Add variant */}}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((filename, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {filename}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handlePreview('reading', passageKey, filename)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete */}}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No variants available for Passage {passageNum}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderWritingSection = () => {
    if (!variants?.writing) return null;

    return (
      <div className="space-y-4">
        {[1, 2].map((taskNum) => {
          const taskKey = `task${taskNum}`;
          const taskData = variants.writing[taskKey];
          const count = taskData?.count || 0;
          const files = taskData?.files || [];

          return (
            <Card key={taskNum} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Task {taskNum}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {count} variant{count !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {/* TODO: Add variant */}}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((filename, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {filename}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handlePreview('writing', taskKey, filename)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete */}}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No variants available for Task {taskNum}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderSpeakingSection = () => {
    if (!variants?.speaking) return null;

    return (
      <div className="space-y-4">
        {[1, 2, 3].map((partNum) => {
          const partKey = `part${partNum}`;
          const partData = variants.speaking[partKey];
          const count = partData?.count || 0;
          const files = partData?.files || [];

          return (
            <Card key={partNum} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Mic className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Part {partNum}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {count} variant{count !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {/* TODO: Add variant */}}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {files.map((filename, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {filename}
                          </span>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handlePreview('speaking', partKey, filename)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete */}}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No variants available for Part {partNum}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Variants Library
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and preview all test variants for each section
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'listening' && renderListeningSection()}
        {activeTab === 'reading' && renderReadingSection()}
        {activeTab === 'writing' && renderWritingSection()}
        {activeTab === 'speaking' && renderSpeakingSection()}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Variant Preview"
        size="2xl"
      >
        {previewVariant && (
          <VariantPreviewModal
            sectionType={previewVariant.sectionType}
            sectionName={previewVariant.sectionName}
            filename={previewVariant.filename}
            onClose={() => setShowPreview(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Variants;
