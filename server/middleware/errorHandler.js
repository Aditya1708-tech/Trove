const AppError = require('../utils/AppError');

/**
 * Handle Mongoose CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

/**
 * Handle Mongoose duplicate key error (code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `Duplicate value for field "${field}": "${value}". Please use a different value.`,
    409
  );
};

/**
 * Handle Mongoose ValidationError
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => ({
    field: el.path,
    message: el.message,
  }));
  return new AppError('Validation failed', 400, errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Session expired. Please log in again.', 401);

/**
 * Send detailed error in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
    error: err,
  });
};

/**
 * Send minimal error in production (don't leak internals)
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Operational (trusted) error — safe to send to client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Programming or unknown error — don't leak details
    console.error('💥 UNHANDLED ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again.',
    });
  }
};

/**
 * Global error handling middleware
 * Must be the last middleware registered in the Express app
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    if (err.name === 'CastError')             error = handleCastErrorDB(error);
    if (err.code === 11000)                    error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError')        error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError')      error = handleJWTError();
    if (err.name === 'TokenExpiredError')      error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;
