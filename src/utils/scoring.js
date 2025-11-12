/**
 * IELTS Band Score Conversion Utilities
 * 
 * Note: This is a client-side implementation for demo purposes.
 * In production, scoring should be verified and performed on the backend.
 */

/**
 * Convert raw Listening/Reading scores to IELTS band
 * @param {number} rawScore - Raw score out of 40
 * @returns {number} Band score (0-9)
 */
export function convertToBand(rawScore) {
  // Standard IELTS conversion table
  // This should match the official IELTS conversion chart
  const conversionTable = {
    40: 9.0,
    39: 8.5,
    38: 8.5,
    37: 8.0,
    36: 8.0,
    35: 8.0,
    34: 7.5,
    33: 7.5,
    32: 7.0,
    31: 7.0,
    30: 7.0,
    29: 6.5,
    28: 6.5,
    27: 6.5,
    26: 6.0,
    25: 6.0,
    24: 6.0,
    23: 5.5,
    22: 5.5,
    21: 5.5,
    20: 5.0,
    19: 5.0,
    18: 5.0,
    17: 4.5,
    16: 4.5,
    15: 4.5,
    14: 4.0,
    13: 4.0,
    12: 4.0,
    11: 3.5,
    10: 3.5,
    9: 3.5,
    8: 3.0,
    7: 3.0,
    6: 3.0,
    5: 2.5,
    4: 2.5,
    3: 2.5,
    2: 2.0,
    1: 2.0,
    0: 1.0,
  }

  return conversionTable[rawScore] || 0
}

/**
 * Calculate overall band from component scores
 * @param {Object} scores - { listening, reading, writing, speaking }
 * @returns {number} Overall band (average rounded to nearest 0.5)
 */
export function calculateOverallBand(scores) {
  const { listening, reading, writing, speaking } = scores
  if (!listening || !reading || !writing || !speaking) {
    return null
  }

  const average = (listening + reading + writing + speaking) / 4
  // Round to nearest 0.5
  return Math.round(average * 2) / 2
}

/**
 * Auto-grade Listening/Reading answers
 * @param {Array} userAnswers - User's answers
 * @param {Array} correctAnswers - Correct answer key
 * @returns {number} Raw score
 */
export function autoGradeAnswers(userAnswers, correctAnswers) {
  let score = 0
  const maxLength = Math.max(userAnswers.length, correctAnswers.length)

  for (let i = 0; i < maxLength; i++) {
    const userAnswer = userAnswers[i]?.toString().trim().toLowerCase()
    const correctAnswer = correctAnswers[i]?.toString().trim().toLowerCase()

    if (userAnswer === correctAnswer) {
      score++
    }
  }

  return score
}

/**
 * Validate Writing word count
 * @param {string} text - Writing text
 * @param {number} minWords - Minimum required words
 * @returns {Object} { valid, wordCount, message }
 */
export function validateWordCount(text, minWords) {
  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length
  const valid = wordCount >= minWords

  return {
    valid,
    wordCount,
    message: valid
      ? `${wordCount} words`
      : `Minimum ${minWords} words required. Current: ${wordCount}`,
  }
}

