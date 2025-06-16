/**
 * Custom API Error class for handling API-specific errors
 * @extends Error
 */
class ApiError extends Error {
    /**
     * Create an API error
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Object} [errors] - Additional error details
     * @param {boolean} [isOperational=true] - Whether the error is operational
     * @param {string} [stack] - Error stack trace
     */
    constructor(
        statusCode,
        message,
        errors = null,
        isOperational = true,
        stack = ''
    ) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Create a 400 Bad Request error
     * @param {string} message - Error message
     * @param {Object} [errors] - Additional error details
     * @returns {ApiError}
     */
    static badRequest(message, errors = null) {
        return new ApiError(400, message, errors);
    }

    /**
     * Create a 401 Unauthorized error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static unauthorized(message = 'Unauthorized') {
        return new ApiError(401, message);
    }

    /**
     * Create a 403 Forbidden error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static forbidden(message = 'Forbidden') {
        return new ApiError(403, message);
    }

    /**
     * Create a 404 Not Found error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static notFound(message = 'Resource not found') {
        return new ApiError(404, message);
    }

    /**
     * Create a 409 Conflict error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static conflict(message) {
        return new ApiError(409, message);
    }

    /**
     * Create a 422 Unprocessable Entity error
     * @param {string} message - Error message
     * @param {Object} errors - Validation errors
     * @returns {ApiError}
     */
    static validationError(message = 'Validation Error', errors = null) {
        return new ApiError(422, message, errors);
    }

    /**
     * Create a 429 Too Many Requests error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static tooManyRequests(message = 'Too many requests') {
        return new ApiError(429, message);
    }

    /**
     * Create a 500 Internal Server Error
     * @param {string} message - Error message
     * @param {boolean} [isOperational=false] - Whether the error is operational
     * @returns {ApiError}
     */
    static internal(message = 'Internal server error', isOperational = false) {
        return new ApiError(500, message, null, isOperational);
    }

    /**
     * Create a 503 Service Unavailable error
     * @param {string} message - Error message
     * @returns {ApiError}
     */
    static serviceUnavailable(message = 'Service unavailable') {
        return new ApiError(503, message);
    }

    /**
     * Check if error is an API error
     * @param {Error} error - Error to check
     * @returns {boolean}
     */
    static isApiError(error) {
        return error instanceof ApiError;
    }

    /**
     * Convert error to API error
     * @param {Error} error - Error to convert
     * @returns {ApiError}
     */
    static fromError(error) {
        if (ApiError.isApiError(error)) {
            return error;
        }

        const apiError = new ApiError(
            500,
            error.message || 'Internal server error',
            null,
            false,
            error.stack
        );

        return apiError;
    }

    /**
     * Get error response object
     * @returns {Object} Error response
     */
    toJSON() {
        const response = {
            status: this.status,
            statusCode: this.statusCode,
            message: this.message
        };

        if (this.errors) {
            response.errors = this.errors;
        }

        if (process.env.NODE_ENV === 'development') {
            response.stack = this.stack;
        }

        return response;
    }

    /**
     * Check if error is operational
     * @returns {boolean}
     */
    isOperationalError() {
        return this.isOperational;
    }

    /**
     * Get error name
     * @returns {string}
     */
    getName() {
        return this.constructor.name;
    }

    /**
     * Get error code
     * @returns {number}
     */
    getCode() {
        return this.statusCode;
    }

    /**
     * Get error details
     * @returns {Object|null}
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Get error status
     * @returns {string}
     */
    getStatus() {
        return this.status;
    }
}

module.exports = ApiError;
