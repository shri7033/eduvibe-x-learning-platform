const JWTUtil = require('../utils/jwt.util');
const ApiError = require('../utils/apiError');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * @param {Object} options - Authentication options
 * @returns {Function} Middleware function
 */
const auth = (options = {}) => {
    const {
        roles = [],
        requireVerified = true,
        requireActive = true
    } = options;

    return async (req, res, next) => {
        try {
            // Get token from header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw ApiError.unauthorized('No token provided');
            }

            // Extract and verify token
            const token = JWTUtil.extractTokenFromHeader(authHeader);
            if (!token) {
                throw ApiError.unauthorized('Invalid token format');
            }

            // Validate token and get user data
            const decoded = JWTUtil.validateAndExtractUser(token, 'access');
            if (!decoded || !decoded.userId) {
                throw ApiError.unauthorized('Invalid token');
            }

            // Get user from database
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw ApiError.unauthorized('User not found');
            }

            // Check if user is active
            if (requireActive && !user.isActive) {
                throw ApiError.forbidden('Account is inactive');
            }

            // Check if user is verified
            if (requireVerified && (!user.isPhoneVerified || !user.isEmailVerified)) {
                throw ApiError.forbidden('Account is not fully verified');
            }

            // Check user role
            if (roles.length > 0 && !roles.includes(user.userType)) {
                throw ApiError.forbidden('Insufficient permissions');
            }

            // Update last active timestamp
            user.lastActive = new Date();
            await user.save();

            // Attach user to request
            req.user = {
                id: user._id,
                userType: user.userType,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                isPhoneVerified: user.isPhoneVerified,
                isEmailVerified: user.isEmailVerified
            };

            // Log successful authentication
            logger.authAttempt(user._id, true);

            next();
        } catch (error) {
            // Log failed authentication
            logger.authAttempt(error.message, false);
            next(error);
        }
    };
};

/**
 * Role-based authentication middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
const requireRoles = (...roles) => {
    return auth({ roles });
};

/**
 * Student authentication middleware
 * @returns {Function} Middleware function
 */
const requireStudent = () => {
    return auth({ roles: ['student'] });
};

/**
 * Teacher authentication middleware
 * @returns {Function} Middleware function
 */
const requireTeacher = () => {
    return auth({ roles: ['teacher'] });
};

/**
 * Parent authentication middleware
 * @returns {Function} Middleware function
 */
const requireParent = () => {
    return auth({ roles: ['parent'] });
};

/**
 * Admin authentication middleware
 * @returns {Function} Middleware function
 */
const requireAdmin = () => {
    return auth({ roles: ['admin'] });
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 * @returns {Function} Middleware function
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = JWTUtil.extractTokenFromHeader(authHeader);
        if (!token) {
            return next();
        }

        const decoded = JWTUtil.validateAndExtractUser(token, 'access');
        if (!decoded || !decoded.userId) {
            return next();
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return next();
        }

        req.user = {
            id: user._id,
            userType: user.userType,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone
        };

        next();
    } catch (error) {
        // Don't throw error for optional auth
        next();
    }
};

/**
 * Verify user ownership middleware
 * Checks if authenticated user owns the requested resource
 * @param {string} paramId - Parameter name containing resource ID
 * @param {Function} getOwnerId - Function to get owner ID from resource
 * @returns {Function} Middleware function
 */
const verifyOwnership = (paramId, getOwnerId) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[paramId];
            if (!resourceId) {
                throw ApiError.badRequest('Resource ID not provided');
            }

            const ownerId = await getOwnerId(resourceId);
            if (!ownerId) {
                throw ApiError.notFound('Resource not found');
            }

            if (ownerId.toString() !== req.user.id.toString()) {
                throw ApiError.forbidden('You do not own this resource');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    auth,
    requireRoles,
    requireStudent,
    requireTeacher,
    requireParent,
    requireAdmin,
    optionalAuth,
    verifyOwnership
};
