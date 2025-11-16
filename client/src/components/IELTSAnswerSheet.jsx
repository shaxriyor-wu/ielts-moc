import { useState } from 'react';
import Card from './Card';

const IELTSAnswerSheet = ({ section, answers, onAnswerChange, className = '' }) => {
  const [localAnswers, setLocalAnswers] = useState(answers || {});

  const handleChange = (questionNum, value) => {
    const upperValue = value.toUpperCase().slice(0, 1);
    const newAnswers = { ...localAnswers, [questionNum]: upperValue };
    setLocalAnswers(newAnswers);
    if (onAnswerChange) {
      onAnswerChange(newAnswers);
    }
  };

  // IELTS Answer Sheet Layout - Official Format
  const renderAnswerSheet = () => {
    return (
      <div className={`bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
            {section === 'listening' ? 'LISTENING' : 'READING'} ANSWER SHEET
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            Write your answers in the spaces provided below
          </div>
        </div>

        {/* Answer Grid - 40 questions in IELTS format */}
        <div className="space-y-3">
          {/* Questions 1-10 */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((qNum) => (
              <div key={qNum} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                  {qNum}
                </span>
                <input
                  type="text"
                  value={localAnswers[qNum] || ''}
                  onChange={(e) => handleChange(qNum, e.target.value)}
                  className="w-12 h-10 text-center text-lg font-semibold border-2 border-gray-400 dark:border-gray-500 rounded focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 uppercase dark:bg-gray-700 dark:text-white"
                  maxLength="1"
                  placeholder=""
                />
              </div>
            ))}
          </div>

          {/* Questions 11-20 */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 11).map((qNum) => (
              <div key={qNum} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                  {qNum}
                </span>
                <input
                  type="text"
                  value={localAnswers[qNum] || ''}
                  onChange={(e) => handleChange(qNum, e.target.value)}
                  className="w-12 h-10 text-center text-lg font-semibold border-2 border-gray-400 dark:border-gray-500 rounded focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 uppercase dark:bg-gray-700 dark:text-white"
                  maxLength="1"
                  placeholder=""
                />
              </div>
            ))}
          </div>

          {/* Questions 21-30 */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 21).map((qNum) => (
              <div key={qNum} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                  {qNum}
                </span>
                <input
                  type="text"
                  value={localAnswers[qNum] || ''}
                  onChange={(e) => handleChange(qNum, e.target.value)}
                  className="w-12 h-10 text-center text-lg font-semibold border-2 border-gray-400 dark:border-gray-500 rounded focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 uppercase dark:bg-gray-700 dark:text-white"
                  maxLength="1"
                  placeholder=""
                />
              </div>
            ))}
          </div>

          {/* Questions 31-40 */}
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 31).map((qNum) => (
              <div key={qNum} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6">
                  {qNum}
                </span>
                <input
                  type="text"
                  value={localAnswers[qNum] || ''}
                  onChange={(e) => handleChange(qNum, e.target.value)}
                  className="w-12 h-10 text-center text-lg font-semibold border-2 border-gray-400 dark:border-gray-500 rounded focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 uppercase dark:bg-gray-700 dark:text-white"
                  maxLength="1"
                  placeholder=""
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Please write your answers clearly. Each answer should be a single letter (A, B, C, D) or word.
          </p>
        </div>
      </div>
    );
  };

  return renderAnswerSheet();
};

export default IELTSAnswerSheet;

