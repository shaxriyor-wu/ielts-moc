import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';

const QuestionCard = ({ 
  question, 
  answer, 
  onChange, 
  isMarked, 
  onMark, 
  questionNumber,
  options = [],
  type = 'text',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 mb-4 ${
        isMarked 
          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">Question {questionNumber}</span>
          {isMarked && (
            <span className="text-xs bg-yellow-400 dark:bg-yellow-600 px-2 py-1 rounded">Marked</span>
          )}
        </div>
        <button
          onClick={onMark}
          className={`p-1.5 rounded transition-colors ${
            isMarked 
              ? 'bg-yellow-400 text-yellow-900' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-4">{question}</p>
      
      {type === 'multiple-choice' && options.length > 0 ? (
        <div className="space-y-2">
          {options.map((option, idx) => {
            const optionLabel = String.fromCharCode(65 + idx);
            const isSelected = answer === optionLabel || answer === idx;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onChange(optionLabel)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800'
                }`}
              >
                <span className="font-medium">{optionLabel}.</span> {option}
              </motion.button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
          placeholder="Enter your answer"
        />
      )}
    </motion.div>
  );
};

export default QuestionCard;
