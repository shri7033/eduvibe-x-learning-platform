const OTP = require('../models/otp.model');
const logger = require('./logger');
const crypto = require('crypto');

class OTPUtil {
    /**
     * Generate a random 6-digit OTP
     * @returns {string} 6-digit OTP
     */
    static generateOTP() {
        // Generate a cryptographically secure 6-digit number
        const min = 100000;
        const max = 999999;
        const randomBytes = crypto.randomBytes(4);
        const randomNumber = parseInt(randomBytes.toString('hex'), 16);
        return String(Math.floor(randomNumber % (max - min + 1)) + min);
    }

    /**
     * Verify an OTP for a given identifier
     * @param {string} identifier - Phone number or email
     * @param {string} otp - OTP to verify
     * @param {string} type - Type of OTP (phone/email)
     * @returns {Promise<boolean>} - Whether OTP is valid
     */
    static async verifyOTP(identifier, otp, type = 'phone') {
        try {
            // Find the latest valid OTP for this identifier
            const otpDoc = await OTP.findValidOTP(identifier, type);

            if (!otpDoc) {
                logger.warn(`No valid OTP found for ${identifier}`);
                return false;
            }

            // Check if OTP matches
            if (otpDoc.otp !== otp) {
                await otpDoc.incrementAttempts();
                logger.warn(`Invalid OTP attempt for ${identifier}`);
                return false;
            }

            // Check if OTP has expired
            if (otpDoc.isExpired()) {
                logger.warn(`OTP expired for ${identifier}`);
                return false;
            }

            // Mark OTP as verified
            otpDoc.verified = true;
            await otpDoc.save();

            // Remove all other OTPs for this identifier
            await OTP.removeAllUserOTPs(identifier);

            return true;
        } catch (error) {
            logger.error('OTP verification error:', error);
            return false;
        }
    }

    /**
     * Create a new OTP record
     * @param {string} identifier - Phone number or email
     * @param {string} type - Type of OTP (phone/email)
     * @param {string} purpose - Purpose of OTP (signup/login/reset)
     * @returns {Promise<{otp: string, expiresAt: Date}>}
     */
    static async createOTP(identifier, type = 'phone', purpose = 'login') {
        try {
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            await OTP.create({
                identifier,
                otp,
                type,
                purpose,
                expiresAt
            });

            return { otp, expiresAt };
        } catch (error) {
            logger.error('OTP creation error:', error);
            throw error;
        }
    }

    /**
     * Check if user has exceeded maximum OTP requests
     * @param {string} identifier - Phone number or email
     * @param {string} type - Type of OTP (phone/email)
     * @returns {Promise<boolean>}
     */
    static async hasExceededMaxAttempts(identifier, type = 'phone') {
        try {
            // Count OTP requests in the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const count = await OTP.countDocuments({
                identifier,
                type,
                createdAt: { $gte: oneHourAgo }
            });

            // Maximum 5 OTP requests per hour
            return count >= 5;
        } catch (error) {
            logger.error('OTP attempt check error:', error);
            return true; // Fail safe
        }
    }

    /**
     * Get remaining time for OTP expiry
     * @param {string} identifier - Phone number or email
     * @param {string} type - Type of OTP (phone/email)
     * @returns {Promise<number>} Remaining time in seconds
     */
    static async getRemainingTime(identifier, type = 'phone') {
        try {
            const otpDoc = await OTP.findValidOTP(identifier, type);
            if (!otpDoc) return 0;

            const remainingTime = otpDoc.expiresAt.getTime() - Date.now();
            return Math.max(0, Math.floor(remainingTime / 1000));
        } catch (error) {
            logger.error('OTP remaining time check error:', error);
            return 0;
        }
    }

    /**
     * Invalidate all OTPs for a user
     * @param {string} identifier - Phone number or email
     * @returns {Promise<void>}
     */
    static async invalidateAllOTPs(identifier) {
        try {
            await OTP.removeAllUserOTPs(identifier);
        } catch (error) {
            logger.error('OTP invalidation error:', error);
            throw error;
        }
    }

    /**
     * Format OTP message
     * @param {string} otp - The OTP
     * @param {string} purpose - Purpose of OTP (signup/login/reset)
     * @returns {string} Formatted message
     */
    static formatOTPMessage(otp, purpose = 'login') {
        const messages = {
            signup: `Welcome to EDUVIBE-X! Your verification code is: ${otp}. Valid for 10 minutes.`,
            login: `Your EDUVIBE-X login code is: ${otp}. Valid for 10 minutes.`,
            reset: `Your EDUVIBE-X password reset code is: ${otp}. Valid for 10 minutes.`
        };

        return messages[purpose] || messages.login;
    }
}

module.exports = OTPUtil;
