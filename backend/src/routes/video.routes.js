const express = require('express');
const VideoController = require('../controllers/video.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get available video qualities
router.get('/:videoId/qualities', VideoController.getVideoQualities);

// Stream video with specific quality
router.get('/:videoId/stream/:quality', VideoController.streamVideo);

// Download video with specific quality
router.get('/:videoId/download/:quality', VideoController.downloadVideo);

// Update watch progress
router.post('/:videoId/progress', VideoController.updateWatchProgress);

module.exports = router;
