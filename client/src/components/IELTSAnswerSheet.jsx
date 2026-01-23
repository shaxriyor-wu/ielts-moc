import { useState } from 'react';
import Card from './Card';

const IELTSAnswerSheet = ({ section, answers, onAnswerChange, className = '' }) => {
  const [localAnswers, setLocalAnswers] = useState(answers || {});

  const handleChange = (questionNum, value) => {
    // Allow unlimited text, no restrictions
    const newAnswers = { ...localAnswers, [questionNum]: value };
    setLocalAnswers(newAnswers);
    if (onAnswerChange) {
      onAnswerChange(newAnswers);
    }
  };

  // IELTS Answer Sheet Layout - 2 Column Format
  const renderAnswerSheet = () => {
    return (
      <div className={`bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
            {section === 'listening' ? 'LISTENING' : 'READING'} ANSWER SHEET
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
            Write your answers in the spaces provided below (you can write letters, words, numbers, or phrases)
          </div>
        </div>

        {/* Answer Grid - 40 questions in 2 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((qNum) => (
            <div key={qNum} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[2rem]">
                {qNum}.
              </span>
              <input
                type="text"
                value={localAnswers[qNum] || ''}
                onChange={(e) => handleChange(qNum, e.target.value)}
                className="flex-1 px-3 py-2 text-base border-2 border-gray-400 dark:border-gray-500 rounded focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 dark:bg-gray-700 dark:text-white"
                placeholder="Your answer"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Write your answers clearly. You can write letters (A, B, C, D), numbers, words, or short phrases.
          </p>
        </div>
      </div>
    );
  };

  return renderAnswerSheet();
};

export default IELTSAnswerSheet;

