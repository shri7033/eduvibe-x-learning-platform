const jwt = require('jsonwebtoken');
const logger = require('./logger');

class JWTUtil {
    static JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    static ACCESS_TOKEN_EXPIRY = '1h';
    static REFRESH_TOKEN_EXPIRY = '7d';
    static SIGNUP_TOKEN_EXPIRY = '1h';

    /**
     * Create a JWT token
     * @param {Object} payload - Data to be encoded in the token
     * @param {string} type - Type of token (access/refresh/signup)
     * @returns {string} JWT token
     */
    static createToken(payload, type = 'access') {
        try {
            const expiresIn = this._getTokenExpiry(type);
            const token = jwt.sign(
                { ...payload, type },
                this.JWT_SECRET,
                { expiresIn }
            );
            return token;
        } catch (error) {
            logger.error('JWT creation error:', error);
            throw new Error('Error creating token');
        }
    }

    /**
     * Verify a JWT token
     * @param {string} token - Token to verify
     * @returns {Object} Decoded token payload
     */
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            return decoded;
        } catch (error) {
            logger.error('JWT verification error:', error);
            throw new Error('Invalid token');
        }
    }

    /**
     * Create an access token
     * @param {Object} payload - User data
     * @returns {string} Access token
     */
    static createAccessToken(payload) {
        return this.createToken(payload, 'access');
    }

    /**
     * Create a refresh token
     * @param {Object} payload - User data
     * @returns {string} Refresh token
     */
    static createRefreshToken(payload) {
        return this.createToken(payload, 'refresh');
    }

    /**
     * Create a signup token
     * @param {Object} payload - User data
     * @returns {string} Signup token
     */
    static createSignupToken(payload) {
        return this.createToken(payload, 'signup');
    }

    /**
     * Get token expiry based on type
     * @param {string} type - Token type
     * @returns {string} Token expiry
     * @private
     */
    static _getTokenExpiry(type) {
        const expiryMap = {
            access: this.ACCESS_TOKEN_EXPIRY,
            refresh: this.REFRESH_TOKEN_EXPIRY,
            signup: this.SIGNUP_TOKEN_EXPIRY
        };
        return expiryMap[type] || this.ACCESS_TOKEN_EXPIRY;
    }

    /**
     * Extract token from authorization header
     * @param {string} authHeader - Authorization header
     * @returns {string|null} Token or null
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }

    /**
     * Check if a token is expired
     * @param {string} token - Token to check
     * @returns {boolean} Whether token is expired
     */
    static isTokenExpired(token) {
        try {
            const decoded = this.verifyToken(token);
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    /**
     * Get time until token expiry
     * @param {string} token - Token to check
     * @returns {number} Seconds until expiry
     */
    static getTimeUntilExpiry(token) {
        try {
            const decoded = this.verifyToken(token);
            const currentTime = Math.floor(Date.now() / 1000);
            return Math.max(0, decoded.exp - currentTime);
        } catch (error) {
            return 0;
        }
    }

    /**
     * Create both access and refresh tokens
     * @param {Object} payload - User data
     * @returns {Object} Object containing both tokens
     */
    static createTokenPair(payload) {
        return {
            accessToken: this.createAccessToken(payload),
            refreshToken: this.createRefreshToken(payload)
        };
    }

    /**
     * Decode token without verification
     * @param {string} token - Token to decode
     * @returns {Object|null} Decoded token payload or null
     */
    static decodeToken(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            logger.error('JWT decode error:', error);
            return null;
        }
    }

    /**
     * Refresh an access token using a refresh token
     * @param {string} refreshToken - Refresh token
     * @returns {string} New access token
     */
    static refreshAccessToken(refreshToken) {
        try {
            const decoded = this.verifyToken(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            // Create new access token without refresh token specific fields
            const { type, iat, exp, ...payload } = decoded;
            return this.createAccessToken(payload);
        } catch (error) {
            logger.error('Token refresh error:', error);
            throw new Error('Error refreshing token');
        }
    }

    /**
     * Validate token and extract user data
     * @param {string} token - Token to validate
     * @param {string} expectedType - Expected token type
     * @returns {Object} User data from token
     */
    static validateAndExtractUser(token, expectedType = 'access') {
        try {
            const decoded = this.verifyToken(token);
            
            if (decoded.type !== expectedType) {
                throw new Error(`Invalid token type. Expected ${expectedType}`);
            }

            const { type, iat, exp, ...userData } = decoded;
            return userData;
        } catch (error) {
            logger.error('Token validation error:', error);
            throw new Error('Invalid or expired token');
        }
    }
}

module.exports = JWTUtil;
