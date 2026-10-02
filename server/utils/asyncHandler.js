/**
 * Wraps an async route handler so we don't need try/catch in every controller.
 * Any rejected promise is forwarded to Express's next(error) handler.
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
