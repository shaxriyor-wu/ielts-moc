import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import Loader from '../../components/Loader';
import { showToast } from '../../components/Toast';
import { FileText, Headphones, Image as ImageIcon } from 'lucide-react';
import QuestionRenderer from '../../components/QuestionRenderer';

const VariantPreviewModal = ({ sectionType, sectionName, filename, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [variantData, setVariantData] = useState(null);

  useEffect(() => {
    loadVariantData();
  }, [sectionType, sectionName, filename]);

  const loadVariantData = async () => {
    try {
      const response = await adminApi.getVariantPreview(sectionType, sectionName, filename);
      setVariantData(response.data);
    } catch (error) {
      showToast('Failed to load variant preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderListeningPreview = () => {
    if (!variantData) return null;

    return (
      <div className="space-y-6 bg-white dark:bg-gray-900 p-6">
        {/* Section Title */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {variantData.title || 'Section 1: Questions 1-10'}
          </h2>
          {variantData.context && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {variantData.context}
            </p>
          )}
        </div>

        {/* Audio Reference */}
        {(variantData.audio_url || variantData.audio_file) && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Audio File</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {variantData.audio_url || variantData.audio_file}
              </p>
            </div>
          </div>
        )}

        {/* Questions - Student View Style */}
        {variantData.questions && variantData.questions.length > 0 && (
          <div className="space-y-6">
            {variantData.questions.map((q, idx) => (
              <div key={idx} className="space-y-2">
                <QuestionRenderer
                  question={q}
                  answer=""
                  onAnswerChange={() => {}}
                  disabled={true}
                  allAnswers={{}}
                />
              </div>
            ))}
          </div>
        )}

        {/* Preview Notice */}
        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Preview Mode:</strong> This is how students will see this variant. Answers are disabled in preview.
          </p>
        </div>
      </div>
    );
  };

  const renderReadingPreview = () => {
    if (!variantData) return null;

    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">
            {variantData.title || 'Reading Passage'}
          </h3>
          <div className="mt-2 flex gap-4 text-sm text-green-700 dark:text-green-300">
            <span>Word Count: {variantData.word_count || 0}</span>
            <span>Difficulty: {variantData.difficulty || 'N/A'}</span>
          </div>
        </div>

        {variantData.images && variantData.images.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Images:</h4>
            <div className="flex gap-2 flex-wrap">
              {variantData.images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{img.path}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {variantData.text && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Passage Text:</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded max-h-60 overflow-y-auto">
              {variantData.text}
            </div>
          </div>
        )}

        {variantData.questions && variantData.questions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Questions ({variantData.questions.length}):
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {variantData.questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Q{q.question_number || idx + 1}: {q.question_text}
                  </p>
                  {q.correct_answer && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Answer: {q.correct_answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWritingPreview = () => {
    if (!variantData) return null;

    return (
      <div className="space-y-4">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
            {variantData.title || 'Writing Task'}
          </h3>
          <div className="mt-2 flex gap-4 text-sm text-purple-700 dark:text-purple-300">
            <span>Min Words: {variantData.minimum_words || 0}</span>
            <span>Difficulty: {variantData.difficulty || 'N/A'}</span>
          </div>
        </div>

        {variantData.image && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{variantData.image}</span>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Instructions:</h4>
          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded whitespace-pre-wrap">
            {variantData.instructions || 'No instructions provided'}
          </div>
        </div>

        {variantData.key_features && variantData.key_features.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {variantData.key_features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderSpeakingPreview = () => {
    if (!variantData) return null;

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">
            {variantData.title || 'Speaking Part'}
          </h3>
          <div className="mt-2 flex gap-4 text-sm text-orange-700 dark:text-orange-300">
            <span>Duration: {variantData.duration_minutes || 0} min</span>
            <span>Difficulty: {variantData.difficulty || 'N/A'}</span>
          </div>
        </div>

        {variantData.topic && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Topic:</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
              {variantData.topic}
            </p>
          </div>
        )}

        {variantData.questions && variantData.questions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Questions:</h4>
            <div className="space-y-2">
              {variantData.questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {variantData.cue_card && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Cue Card:</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">{variantData.cue_card.topic}</p>
              {variantData.cue_card.points && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {variantData.cue_card.points.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {sectionType === 'listening' && renderListeningPreview()}
      {sectionType === 'reading' && renderReadingPreview()}
      {sectionType === 'writing' && renderWritingPreview()}
      {sectionType === 'speaking' && renderSpeakingPreview()}
    </div>
  );
};

export default VariantPreviewModal;
