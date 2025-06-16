const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Middleware to validate request using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validate = (req, res, next) => {
    try {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            // Format validation errors
            const formattedErrors = errors.array().reduce((acc, error) => {
                const field = error.path || error.param;
                if (!acc[field]) {
                    acc[field] = [];
                }
                acc[field].push(error.msg);
                return acc;
            }, {});

            // Log validation errors
            logger.warn('Validation failed', {
                path: req.path,
                method: req.method,
                errors: formattedErrors
            });

            // Throw validation error
            throw ApiError.validationError(
                'Validation failed',
                formattedErrors
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Create a validation chain with custom options
 * @param {Array} validations - Array of validation chains
 * @param {Object} options - Validation options
 * @returns {Array} Middleware array
 */
const createValidation = (validations, options = {}) => {
    return [
        ...validations,
        (req, res, next) => {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                const formattedErrors = errors.array().reduce((acc, error) => {
                    const field = error.path || error.param;
                    if (!acc[field]) {
                        acc[field] = [];
                    }
                    acc[field].push(error.msg);
                    return acc;
                }, {});

                // Log validation errors with custom options
                logger.warn('Validation failed', {
                    path: req.path,
                    method: req.method,
                    errors: formattedErrors,
                    ...options
                });

                throw ApiError.validationError(
                    options.message || 'Validation failed',
                    formattedErrors
                );
            }

            next();
        }
    ];
};

/**
 * Sanitize request body
 * @param {Object} req - Express request object
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (req) => {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(req.body)) {
        // Remove any HTML tags
        if (typeof value === 'string') {
            sanitized[key] = value.replace(/<[^>]*>/g, '');
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
};

/**
 * Middleware to sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sanitize = (req, res, next) => {
    req.body = sanitizeBody(req);
    next();
};

/**
 * Custom validation middleware creator
 * @param {Function} validator - Validation function
 * @param {string} message - Error message
 * @returns {Function} Middleware function
 */
const customValidation = (validator, message) => {
    return async (req, res, next) => {
        try {
            await validator(req);
            next();
        } catch (error) {
            next(ApiError.validationError(message || error.message));
        }
    };
};

/**
 * Validate file upload
 * @param {Object} options - File validation options
 * @returns {Function} Middleware function
 */
const validateFile = (options = {}) => {
    const {
        required = true,
        allowedTypes = [],
        maxSize = 5 * 1024 * 1024, // 5MB
        fieldName = 'file'
    } = options;

    return (req, res, next) => {
        try {
            const file = req.file || req.files?.[fieldName];

            if (required && !file) {
                throw ApiError.validationError('File is required');
            }

            if (file) {
                // Check file type
                if (allowedTypes.length && !allowedTypes.includes(file.mimetype)) {
                    throw ApiError.validationError(
                        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
                    );
                }

                // Check file size
                if (file.size > maxSize) {
                    throw ApiError.validationError(
                        `File size should not exceed ${maxSize / (1024 * 1024)}MB`
                    );
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validate,
    createValidation,
    sanitize,
    customValidation,
    validateFile
};
