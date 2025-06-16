const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.errorDetail(err, `${req.method} ${req.path}`);

    // Default error
    let error = err;

    // Convert non-ApiError to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, null, false, error.stack);
    }

    // Specific error handling
    if (error.name === 'ValidationError') {
        // Mongoose validation error
        error = ApiError.validationError(
            'Validation Error',
            Object.values(error.errors).map(err => err.message)
        );
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        // MongoDB error
        if (error.code === 11000) {
            // Duplicate key error
            const field = Object.keys(error.keyValue)[0];
            error = ApiError.conflict(`${field} already exists`);
        } else {
            error = ApiError.internal('Database error');
        }
    } else if (error.name === 'JsonWebTokenError') {
        // JWT error
        error = ApiError.unauthorized('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
        // JWT expired
        error = ApiError.unauthorized('Token expired');
    } else if (error.name === 'MulterError') {
        // File upload error
        error = ApiError.badRequest(error.message);
    }

    // Prepare response
    const response = {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message
    };

    // Add validation errors if present
    if (error.errors) {
        response.errors = error.errors;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    // Send response
    res.status(error.statusCode).json(response);

    // Track error metrics (if needed)
    trackError(error, req);
};

/**
 * Track error metrics
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 */
const trackError = (error, req) => {
    // Add error tracking logic here (e.g., Sentry, New Relic, etc.)
    const errorMetrics = {
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        statusCode: error.statusCode,
        message: error.message,
        type: error.name,
        userId: req.user?.id,
        userType: req.user?.userType,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    // Log error metrics
    logger.error('Error metrics:', errorMetrics);
};

/**
 * Not found error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFound = (req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Rate limit error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rateLimitHandler = (req, res) => {
    throw ApiError.tooManyRequests('Too many requests. Please try again later.');
};

/**
 * Validation error handler
 * @param {Object} error - Validation error object
 * @returns {ApiError} API error
 */
const validationErrorHandler = (error) => {
    const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
    }, {});

    return ApiError.validationError('Validation failed', errors);
};

/**
 * Database error handler
 * @param {Object} error - Database error object
 * @returns {ApiError} API error
 */
const databaseErrorHandler = (error) => {
    logger.error('Database Error:', error);
    return ApiError.internal('Database operation failed');
};

/**
 * File upload error handler
 * @param {Object} error - File upload error object
 * @returns {ApiError} API error
 */
const fileUploadErrorHandler = (error) => {
    const message = error.code === 'LIMIT_FILE_SIZE' 
        ? 'File size too large'
        : 'File upload failed';
    return ApiError.badRequest(message);
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    rateLimitHandler,
    validationErrorHandler,
    databaseErrorHandler,
    fileUploadErrorHandler
};
