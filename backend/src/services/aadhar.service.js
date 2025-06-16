const axios = require('axios');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class AadharService {
    constructor() {
        this.apiKey = process.env.AADHAR_API_KEY;
        this.apiUrl = process.env.AADHAR_API_URL;
        
        // Initialize axios instance with default config
        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 seconds
        });
    }

    /**
     * Verify Aadhar number with government API
     * @param {string} aadharNumber - Aadhar number to verify
     * @param {string} name - User's name
     * @param {string} dob - User's date of birth
     * @returns {Promise<boolean>} Verification result
     */
    async verifyAadhar(aadharNumber, name, dob) {
        try {
            // In development environment, simulate verification
            if (process.env.NODE_ENV === 'development') {
                return this._simulateVerification(aadharNumber);
            }

            // Real API call in production
            const response = await this.client.post('/verify', {
                aadharNumber,
                name,
                dob
            });

            logger.info('Aadhar verification response:', {
                aadharNumber: this._maskAadhar(aadharNumber),
                status: response.data.status
            });

            return response.data.verified === true;
        } catch (error) {
            logger.error('Aadhar verification failed:', error);
            throw new ApiError(500, 'Aadhar verification failed');
        }
    }

    /**
     * Get Aadhar details
     * @param {string} aadharNumber - Aadhar number
     * @returns {Promise<Object>} Aadhar details
     */
    async getAadharDetails(aadharNumber) {
        try {
            // In development environment, return simulated data
            if (process.env.NODE_ENV === 'development') {
                return this._simulateAadharDetails(aadharNumber);
            }

            // Real API call in production
            const response = await this.client.get(`/details/${aadharNumber}`);

            // Mask sensitive data before logging
            logger.info('Aadhar details retrieved:', {
                aadharNumber: this._maskAadhar(aadharNumber)
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to get Aadhar details:', error);
            throw new ApiError(500, 'Failed to get Aadhar details');
        }
    }

    /**
     * Validate Aadhar number format
     * @param {string} aadharNumber - Aadhar number to validate
     * @returns {boolean} Whether format is valid
     */
    validateAadharFormat(aadharNumber) {
        // Check if it's exactly 12 digits
        const aadharRegex = /^\d{12}$/;
        return aadharRegex.test(aadharNumber);
    }

    /**
     * Mask Aadhar number for logging
     * @param {string} aadharNumber - Aadhar number to mask
     * @returns {string} Masked Aadhar number
     * @private
     */
    _maskAadhar(aadharNumber) {
        return `XXXX-XXXX-${aadharNumber.slice(-4)}`;
    }

    /**
     * Simulate Aadhar verification in development
     * @param {string} aadharNumber - Aadhar number to verify
     * @returns {boolean} Simulated verification result
     * @private
     */
    _simulateVerification(aadharNumber) {
        // Validate format
        if (!this.validateAadharFormat(aadharNumber)) {
            throw new ApiError(400, 'Invalid Aadhar number format');
        }

        // Simulate API latency
        return new Promise((resolve) => {
            setTimeout(() => {
                // In development, consider all valid format Aadhar numbers as verified
                resolve(true);
            }, 1000);
        });
    }

    /**
     * Simulate getting Aadhar details in development
     * @param {string} aadharNumber - Aadhar number
     * @returns {Object} Simulated Aadhar details
     * @private
     */
    _simulateAadharDetails(aadharNumber) {
        // Validate format
        if (!this.validateAadharFormat(aadharNumber)) {
            throw new ApiError(400, 'Invalid Aadhar number format');
        }

        // Return simulated data
        return {
            verified: true,
            lastVerified: new Date().toISOString(),
            verificationMethod: 'development'
        };
    }

    /**
     * Check if Aadhar API is available
     * @returns {Promise<boolean>} API status
     */
    async checkApiStatus() {
        try {
            const response = await this.client.get('/status');
            return response.data.status === 'up';
        } catch (error) {
            logger.error('Aadhar API status check failed:', error);
            return false;
        }
    }

    /**
     * Get verification history for an Aadhar number
     * @param {string} aadharNumber - Aadhar number
     * @returns {Promise<Array>} Verification history
     */
    async getVerificationHistory(aadharNumber) {
        try {
            // In development environment, return simulated history
            if (process.env.NODE_ENV === 'development') {
                return [{
                    timestamp: new Date().toISOString(),
                    status: 'verified',
                    method: 'development'
                }];
            }

            const response = await this.client.get(`/history/${aadharNumber}`);
            return response.data.history;
        } catch (error) {
            logger.error('Failed to get verification history:', error);
            throw new ApiError(500, 'Failed to get verification history');
        }
    }

    /**
     * Request OTP verification for Aadhar
     * @param {string} aadharNumber - Aadhar number
     * @returns {Promise<Object>} OTP request response
     */
    async requestOTPVerification(aadharNumber) {
        try {
            // In development environment, simulate OTP request
            if (process.env.NODE_ENV === 'development') {
                return {
                    success: true,
                    message: 'OTP sent successfully',
                    requestId: 'DEV-' + Date.now()
                };
            }

            const response = await this.client.post('/request-otp', {
                aadharNumber
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to request Aadhar OTP:', error);
            throw new ApiError(500, 'Failed to request Aadhar verification OTP');
        }
    }

    /**
     * Verify Aadhar OTP
     * @param {string} requestId - OTP request ID
     * @param {string} otp - OTP to verify
     * @returns {Promise<Object>} Verification response
     */
    async verifyAadharOTP(requestId, otp) {
        try {
            // In development environment, simulate OTP verification
            if (process.env.NODE_ENV === 'development') {
                return {
                    success: true,
                    verified: true,
                    message: 'OTP verified successfully'
                };
            }

            const response = await this.client.post('/verify-otp', {
                requestId,
                otp
            });

            return response.data;
        } catch (error) {
            logger.error('Failed to verify Aadhar OTP:', error);
            throw new ApiError(500, 'Failed to verify Aadhar OTP');
        }
    }
}

// Create singleton instance
const aadharService = new AadharService();

module.exports = aadharService;
