/**
 * Utility functions for error handling and navigation to error pages
 */

/**
 * Navigate to an error page based on status code
 * @param {number} statusCode - HTTP status code
 * @param {Function} navigate - React Router navigate function
 */
export const navigateToErrorPage = (statusCode, navigate) => {
  if (statusCode === 400) {
    navigate('/error/400');
  } else if (statusCode === 404) {
    navigate('/error/404');
  } else if (statusCode >= 500) {
    navigate('/error/500');
  } else {
    // Default to 500 for unknown errors
    navigate('/error/500');
  }
};

/**
 * Get error message from API error response
 * @param {Error} error - Axios error object
 * @returns {string} - Error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors[0].msg || errors[0];
    }
    if (typeof errors === 'object') {
      const firstKey = Object.keys(errors)[0];
      const firstError = errors[firstKey];
      if (Array.isArray(firstError)) {
        return firstError[0];
      }
      return firstError;
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Check if error should redirect to error page
 * @param {Error} error - Axios error object
 * @returns {boolean} - Whether to redirect
 */
export const shouldRedirectToErrorPage = (error) => {
  const status = error.response?.status;
  
  // Don't redirect for client errors that should be handled in forms
  if (status === 400 || status === 422) {
    return false;
  }
  
  // Don't redirect for 401 (handled by auth interceptor)
  if (status === 401) {
    return false;
  }
  
  // Don't redirect for 403 (permission errors, show in UI)
  if (status === 403) {
    return false;
  }
  
  // Redirect for 404 (resource not found) and 500+ (server errors)
  return status === 404 || status >= 500;
};

