/**
 * LocalStorage utilities for autosave and draft management
 */

const STORAGE_PREFIX = 'ielts_cd_mock_'

export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  },
}

/**
 * Get autosave data for a test
 */
export function getAutosave(testId) {
  return storage.get(`autosave_${testId}`)
}

/**
 * Save autosave data for a test
 */
export function saveAutosave(testId, data) {
  storage.set(`autosave_${testId}`, {
    ...data,
    timestamp: Date.now(),
  })
}

/**
 * Clear autosave for a test
 */
export function clearAutosave(testId) {
  storage.remove(`autosave_${testId}`)
}

