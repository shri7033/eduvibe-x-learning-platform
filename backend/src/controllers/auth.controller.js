const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const { sendSMS } = require('../services/sms.service');
const { sendEmail } = require('../services/email.service');
const { verifyAadharWithGovt } = require('../services/aadhar.service');
const { generateOTP, verifyOTP } = require('../utils/otp.util');
const { createJWT, verifyJWT } = require('../utils/jwt.util');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

class AuthController {
    // User Signup
    async signup(req, res, next) {
        try {
            const {
                fullName,
                phone,
                email,
                dob,
                aadharNumber,
                userType,
                parentName,
                parentPhone
            } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ phone }, { email }]
            });

            if (existingUser) {
                throw new ApiError(400, 'User already exists with this phone number or email');
            }

            // Verify Aadhar number
            const aadharVerified = await verifyAadharWithGovt(aadharNumber, fullName, dob);
            if (!aadharVerified) {
                throw new ApiError(400, 'Aadhar verification failed');
            }

            // Generate OTP for both phone and email
            const phoneOTP = generateOTP();
            const emailOTP = generateOTP();

            // Save OTPs
            await OTP.create({
                identifier: phone,
                otp: phoneOTP,
                type: 'phone',
                expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
            });

            await OTP.create({
                identifier: email,
                otp: emailOTP,
                type: 'email',
                expiresAt: Date.now() + 10 * 60 * 1000
            });

            // Send OTPs
            await Promise.all([
                sendSMS(phone, `Your EDUVIBE-X verification code is: ${phoneOTP}`),
                sendEmail(email, 'EDUVIBE-X Verification Code', 
                    `Your verification code is: ${emailOTP}`)
            ]);

            // Create user (but mark as unverified)
            const user = await User.create({
                fullName,
                phone,
                email,
                dob,
                aadharNumber,
                userType,
                parentName: userType === 'student' ? parentName : undefined,
                parentPhone: userType === 'student' ? parentPhone : undefined,
                isPhoneVerified: false,
                isEmailVerified: false,
                isAadharVerified: true
            });

            // Create session token
            const token = createJWT({ userId: user._id, type: 'signup' });

            res.status(201).json({
                status: 'success',
                message: 'OTP sent to phone and email',
                data: {
                    token,
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        phone: user.phone,
                        email: user.email,
                        userType: user.userType
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // User Login
    async login(req, res, next) {
        try {
            const { identifier, userType } = req.body;

            // Find user by phone or email
            const user = await User.findOne({
                $or: [
                    { phone: identifier },
                    { email: identifier }
                ],
                userType
            });

            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            // Generate OTP
            const otp = generateOTP();
            
            // Save OTP
            await OTP.create({
                identifier: identifier,
                otp: otp,
                type: identifier.includes('@') ? 'email' : 'phone',
                expiresAt: Date.now() + 10 * 60 * 1000
            });

            // Send OTP
            if (identifier.includes('@')) {
                await sendEmail(identifier, 'EDUVIBE-X Login Code', 
                    `Your login code is: ${otp}`);
            } else {
                await sendSMS(identifier, `Your EDUVIBE-X login code is: ${otp}`);
            }

            // Create temporary token
            const token = createJWT({ userId: user._id, type: 'login' });

            res.status(200).json({
                status: 'success',
                message: 'OTP sent successfully',
                data: { token }
            });

        } catch (error) {
            next(error);
        }
    }

    // Verify OTP
    async verifyOtp(req, res, next) {
        try {
            const { identifier, otp, userType } = req.body;

            // Verify OTP
            const isValid = await verifyOTP(identifier, otp);
            if (!isValid) {
                throw new ApiError(400, 'Invalid or expired OTP');
            }

            // Find and update user
            const user = await User.findOne({
                $or: [
                    { phone: identifier },
                    { email: identifier }
                ],
                userType
            });

            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            // Update verification status
            if (identifier.includes('@')) {
                user.isEmailVerified = true;
            } else {
                user.isPhoneVerified = true;
            }
            await user.save();

            // Create access token
            const accessToken = createJWT({ 
                userId: user._id, 
                type: 'access',
                userType: user.userType
            });

            // Create refresh token
            const refreshToken = createJWT({ 
                userId: user._id, 
                type: 'refresh',
                userType: user.userType
            });

            res.status(200).json({
                status: 'success',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user._id,
                        fullName: user.fullName,
                        phone: user.phone,
                        email: user.email,
                        userType: user.userType,
                        isPhoneVerified: user.isPhoneVerified,
                        isEmailVerified: user.isEmailVerified
                    }
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Resend OTP
    async resendOtp(req, res, next) {
        try {
            const { identifier } = req.body;

            // Generate new OTP
            const otp = generateOTP();

            // Save new OTP
            await OTP.create({
                identifier,
                otp,
                type: identifier.includes('@') ? 'email' : 'phone',
                expiresAt: Date.now() + 10 * 60 * 1000
            });

            // Send new OTP
            if (identifier.includes('@')) {
                await sendEmail(identifier, 'EDUVIBE-X Verification Code', 
                    `Your new verification code is: ${otp}`);
            } else {
                await sendSMS(identifier, `Your new EDUVIBE-X verification code is: ${otp}`);
            }

            res.status(200).json({
                status: 'success',
                message: 'New OTP sent successfully'
            });

        } catch (error) {
            next(error);
        }
    }

    // Verify Aadhar
    async verifyAadhar(req, res, next) {
        try {
            const { aadharNumber } = req.body;
            const isValid = await verifyAadharWithGovt(aadharNumber);

            res.status(200).json({
                status: 'success',
                data: { isValid }
            });

        } catch (error) {
            next(error);
        }
    }

    // Logout
    async logout(req, res, next) {
        try {
            // Add token to blacklist if using token-based auth
            // or clear session if using session-based auth
            
            res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });

        } catch (error) {
            next(error);
        }
    }

    // Refresh Token
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = verifyJWT(refreshToken);
            if (!decoded || decoded.type !== 'refresh') {
                throw new ApiError(401, 'Invalid refresh token');
            }

            // Find user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            // Generate new access token
            const newAccessToken = createJWT({ 
                userId: user._id, 
                type: 'access',
                userType: user.userType
            });

            res.status(200).json({
                status: 'success',
                data: { accessToken: newAccessToken }
            });

        } catch (error) {
            next(error);
        }
    }

    // Get Verification Status
    async getVerificationStatus(req, res, next) {
        try {
            const { userId } = req.user;

            const user = await User.findById(userId);
            if (!user) {
                throw new ApiError(404, 'User not found');
            }

            res.status(200).json({
                status: 'success',
                data: {
                    isPhoneVerified: user.isPhoneVerified,
                    isEmailVerified: user.isEmailVerified,
                    isAadharVerified: user.isAadharVerified
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
