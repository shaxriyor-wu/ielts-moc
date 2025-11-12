import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * Renders different question types
 * @param {Object} question - Question object
 * @param {*} value - Current answer value
 * @param {Function} onChange - Change handler
 */
export default function QuestionRenderer({ question, value, onChange }) {
  const [selectedChoices, setSelectedChoices] = useState(
    value && Array.isArray(value) ? value : value ? [value] : []
  )

  const handleChange = (newValue) => {
    if (question.type === 'multiple_choice') {
      onChange(newValue)
    } else if (question.type === 'multiple_select') {
      const updated = selectedChoices.includes(newValue)
        ? selectedChoices.filter((c) => c !== newValue)
        : [...selectedChoices, newValue]
      setSelectedChoices(updated)
      onChange(updated)
    } else {
      onChange(newValue)
    }
  }

  switch (question.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-2" role="radiogroup" aria-label={question.text}>
          {question.choices?.map((choice, idx) => (
            <motion.label
              key={idx}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                value === choice
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice}
                checked={value === choice}
                onChange={() => handleChange(choice)}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                aria-label={choice}
              />
              <span>{choice}</span>
            </motion.label>
          ))}
        </div>
      )

    case 'multiple_select':
      return (
        <div className="space-y-2" role="group" aria-label={question.text}>
          {question.choices?.map((choice, idx) => (
            <motion.label
              key={idx}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedChoices.includes(choice)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="checkbox"
                value={choice}
                checked={selectedChoices.includes(choice)}
                onChange={() => handleChange(choice)}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                aria-label={choice}
              />
              <span>{choice}</span>
            </motion.label>
          ))}
        </div>
      )

    case 'short_answer':
    case 'fill_gap':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="input-field"
          placeholder="Type your answer..."
          aria-label={question.text}
        />
      )

    case 'true_false_not_given':
      return (
        <div className="space-y-2" role="radiogroup" aria-label={question.text}>
          {['True', 'False', 'Not Given'].map((option) => (
            <motion.label
              key={option}
              whileHover={{ scale: 1.02 }}
              className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                value === option
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={value === option}
                onChange={() => handleChange(option)}
                className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                aria-label={option}
              />
              <span>{option}</span>
            </motion.label>
          ))}
        </div>
      )

    case 'matching_headings':
      return (
        <div className="space-y-2" role="group" aria-label={question.text}>
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="input-field"
            aria-label={question.text}
          >
            <option value="">Select a heading...</option>
            {question.headings?.map((heading, idx) => (
              <option key={idx} value={heading}>
                {heading}
              </option>
            ))}
          </select>
        </div>
      )

    default:
      return (
        <textarea
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="input-field min-h-[100px]"
          placeholder="Type your answer..."
          aria-label={question.text}
        />
      )
  }
}

