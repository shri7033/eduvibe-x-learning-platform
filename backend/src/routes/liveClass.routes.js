const express = require('express');
const LiveClassController = require('../controllers/liveClass.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create a new live class
router.post('/',
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('courseId').notEmpty().withMessage('Course ID is required'),
        body('scheduledStartTime')
            .notEmpty()
            .withMessage('Scheduled start time is required')
            .isISO8601()
            .withMessage('Invalid date format'),
        body('settings')
            .optional()
            .isObject()
            .withMessage('Settings must be an object'),
        body('settings.chatEnabled')
            .optional()
            .isBoolean()
            .withMessage('chatEnabled must be a boolean'),
        body('settings.handRaiseEnabled')
            .optional()
            .isBoolean()
            .withMessage('handRaiseEnabled must be a boolean'),
        body('settings.pollsEnabled')
            .optional()
            .isBoolean()
            .withMessage('pollsEnabled must be a boolean'),
        body('settings.recordingEnabled')
            .optional()
            .isBoolean()
            .withMessage('recordingEnabled must be a boolean'),
        body('settings.participantLimit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('participantLimit must be between 1 and 1000')
    ],
    validate,
    LiveClassController.createLiveClass
);

// Start a live class
router.post('/:classId/start',
    [
        param('classId').notEmpty().withMessage('Class ID is required')
    ],
    validate,
    LiveClassController.startLiveClass
);

// End a live class
router.post('/:classId/end',
    [
        param('classId').notEmpty().withMessage('Class ID is required')
    ],
    validate,
    LiveClassController.endLiveClass
);

// Join a live class
router.post('/:classId/join',
    [
        param('classId').notEmpty().withMessage('Class ID is required')
    ],
    validate,
    LiveClassController.joinLiveClass
);

// Create a poll
router.post('/:classId/polls',
    [
        param('classId').notEmpty().withMessage('Class ID is required'),
        body('question').trim().notEmpty().withMessage('Poll question is required'),
        body('options')
            .isArray({ min: 2 })
            .withMessage('At least 2 options are required'),
        body('options.*')
            .trim()
            .notEmpty()
            .withMessage('Poll options cannot be empty')
    ],
    validate,
    LiveClassController.createPoll
);

// Submit poll vote
router.post('/:classId/polls/:pollId/vote',
    [
        param('classId').notEmpty().withMessage('Class ID is required'),
        param('pollId').notEmpty().withMessage('Poll ID is required'),
        body('optionIndex')
            .isInt({ min: 0 })
            .withMessage('Invalid option index')
    ],
    validate,
    LiveClassController.submitPollVote
);

// Toggle hand raise
router.post('/:classId/hand-raise',
    [
        param('classId').notEmpty().withMessage('Class ID is required')
    ],
    validate,
    LiveClassController.toggleHandRaise
);

// Get live class details
router.get('/:classId',
    [
        param('classId').notEmpty().withMessage('Class ID is required')
    ],
    validate,
    LiveClassController.getLiveClassDetails
);

module.exports = router;
