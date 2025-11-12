import { convertToBand, calculateOverallBand, autoGradeAnswers, validateWordCount } from '../scoring'

describe('scoring utilities', () => {
  describe('convertToBand', () => {
    it('converts raw score to correct band', () => {
      expect(convertToBand(40)).toBe(9.0)
      expect(convertToBand(30)).toBe(7.0)
      expect(convertToBand(20)).toBe(5.0)
      expect(convertToBand(10)).toBe(3.5)
      expect(convertToBand(0)).toBe(1.0)
    })
  })

  describe('calculateOverallBand', () => {
    it('calculates average band correctly', () => {
      const scores = {
        listening: 7.5,
        reading: 7.0,
        writing: 6.5,
        speaking: 7.0,
      }
      expect(calculateOverallBand(scores)).toBe(7.0)
    })

    it('returns null if any score is missing', () => {
      const scores = {
        listening: 7.5,
        reading: 7.0,
        writing: null,
        speaking: 7.0,
      }
      expect(calculateOverallBand(scores)).toBeNull()
    })
  })

  describe('autoGradeAnswers', () => {
    it('grades answers correctly', () => {
      const userAnswers = ['A', 'B', 'C', 'D']
      const correctAnswers = ['A', 'B', 'C', 'D']
      expect(autoGradeAnswers(userAnswers, correctAnswers)).toBe(4)
    })

    it('handles case-insensitive matching', () => {
      const userAnswers = ['a', 'B', 'c']
      const correctAnswers = ['A', 'B', 'C']
      expect(autoGradeAnswers(userAnswers, correctAnswers)).toBe(3)
    })

    it('handles mismatched lengths', () => {
      const userAnswers = ['A', 'B']
      const correctAnswers = ['A', 'B', 'C', 'D']
      expect(autoGradeAnswers(userAnswers, correctAnswers)).toBe(2)
    })
  })

  describe('validateWordCount', () => {
    it('validates word count correctly', () => {
      const text = 'This is a test sentence with ten words total here now'
      const result = validateWordCount(text, 10)
      expect(result.valid).toBe(true)
      expect(result.wordCount).toBe(10)
    })

    it('fails validation when word count is below minimum', () => {
      const text = 'Short text'
      const result = validateWordCount(text, 20)
      expect(result.valid).toBe(false)
      expect(result.wordCount).toBe(2)
    })
  })
})

