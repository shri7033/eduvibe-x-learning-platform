const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');

// Validation schemas
const signupValidation = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/).withMessage('Invalid phone number format'),
    body('email').trim().isEmail().withMessage('Invalid email format'),
    body('dob').isISO8601().withMessage('Invalid date format'),
    body('aadharNumber').trim().notEmpty().withMessage('Aadhar number is required')
        .matches(/^[0-9]{12}$/).withMessage('Invalid Aadhar number format'),
    body('userType').isIn(['student', 'teacher', 'parent']).withMessage('Invalid user type'),
    // Parent details validation (required for student signup)
    body('parentName').if(body('userType').equals('student'))
        .trim().notEmpty().withMessage('Parent name is required for students'),
    body('parentPhone').if(body('userType').equals('student'))
        .trim().matches(/^[0-9]{10}$/).withMessage('Invalid parent phone number format')
];

const loginValidation = [
    body('identifier').trim().notEmpty().withMessage('Phone number or email is required'),
    body('userType').isIn(['student', 'teacher', 'parent']).withMessage('Invalid user type')
];

const verifyOtpValidation = [
    body('identifier').trim().notEmpty().withMessage('Phone number or email is required'),
    body('otp').trim().matches(/^[0-9]{6}$/).withMessage('Invalid OTP format'),
    body('userType').isIn(['student', 'teacher', 'parent']).withMessage('Invalid user type')
];

// Routes
router.post('/signup', signupValidation, validate, authController.signup);
router.post('/login', loginValidation, validate, authController.login);
router.post('/verify-otp', verifyOtpValidation, validate, authController.verifyOtp);
router.post('/resend-otp', loginValidation, validate, authController.resendOtp);

// Aadhar verification
router.post('/verify-aadhar', 
    [body('aadharNumber').trim().matches(/^[0-9]{12}$/).withMessage('Invalid Aadhar number format')],
    validate,
    authController.verifyAadhar
);

// Password reset (in case needed as backup)
router.post('/forgot-password',
    [body('email').isEmail().withMessage('Invalid email format')],
    validate,
    authController.forgotPassword
);

router.post('/reset-password',
    [
        body('token').trim().notEmpty().withMessage('Reset token is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    ],
    validate,
    authController.resetPassword
);

// Session management
router.post('/logout', authController.logout);
router.get('/refresh-token', authController.refreshToken);

// User verification status
router.get('/verification-status', authController.getVerificationStatus);

module.exports = router;
