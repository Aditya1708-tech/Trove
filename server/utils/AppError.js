/**
 * Custom application error class
 * All intentional errors should be instances of AppError
 * so the global error handler can format them correctly.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (e.g. 400, 401, 404, 500)
   * @param {object} [errors] - Optional field-level validation errors
   */
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // operational errors are sent to the client
    this.errors = errors;      // for validation error details

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
