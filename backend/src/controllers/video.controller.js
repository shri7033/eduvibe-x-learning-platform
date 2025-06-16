const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class VideoController {
    /**
     * Stream video content with quality selection
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async streamVideo(req, res, next) {
        try {
            const { videoId, quality } = req.params;
            
            // In production, you would get this from your database/storage
            const videoPath = path.resolve(__dirname, `../../videos/${videoId}_${quality}.mp4`);
            
            // Verify file exists
            if (!fs.existsSync(videoPath)) {
                logger.error(`Video file not found: ${videoPath}`);
                return next(new ApiError(404, 'Video not found'));
            }

            // Get video stats
            const stat = fs.statSync(videoPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                // Parse range
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(videoPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };

                res.writeHead(200, head);
                fs.createReadStream(videoPath).pipe(res);
            }
        } catch (error) {
            logger.error('Error streaming video:', error);
            next(new ApiError(500, 'Error streaming video'));
        }
    }

    /**
     * Download video (secure, in-app only)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async downloadVideo(req, res, next) {
        try {
            const { videoId, quality } = req.params;
            
            // In production, verify user's permissions to download this video
            // Example: Check if user has purchased the course, etc.
            
            const videoPath = path.resolve(__dirname, `../../videos/${videoId}_${quality}.mp4`);
            
            if (!fs.existsSync(videoPath)) {
                logger.error(`Video file not found: ${videoPath}`);
                return next(new ApiError(404, 'Video not found'));
            }

            // Set headers to force download
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
            
            // Additional security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.setHeader('Expires', '0');
            res.setHeader('Pragma', 'no-cache');

            // Stream the file
            const fileStream = fs.createReadStream(videoPath);
            fileStream.pipe(res);

            // Handle errors during streaming
            fileStream.on('error', (error) => {
                logger.error('Error downloading video:', error);
                next(new ApiError(500, 'Error downloading video'));
            });
        } catch (error) {
            logger.error('Error initiating video download:', error);
            next(new ApiError(500, 'Error downloading video'));
        }
    }

    /**
     * Get available video qualities
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async getVideoQualities(req, res, next) {
        try {
            const { videoId } = req.params;
            
            // In production, fetch this from your database
            // Here's a mock response
            const qualities = [
                { quality: '360p', size: '50MB' },
                { quality: '480p', size: '100MB' },
                { quality: '720p', size: '200MB' },
                { quality: '1080p', size: '500MB' }
            ];

            res.json({
                success: true,
                data: qualities
            });
        } catch (error) {
            logger.error('Error fetching video qualities:', error);
            next(new ApiError(500, 'Error fetching video qualities'));
        }
    }

    /**
     * Update video watch progress
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async updateWatchProgress(req, res, next) {
        try {
            const { videoId } = req.params;
            const { timestamp, duration } = req.body;
            
            // In production, save this to your database
            // Example: Update user's watch history, progress, etc.
            
            logger.info(`Updating watch progress for video ${videoId}: ${timestamp}/${duration}`);

            res.json({
                success: true,
                message: 'Watch progress updated successfully'
            });
        } catch (error) {
            logger.error('Error updating watch progress:', error);
            next(new ApiError(500, 'Error updating watch progress'));
        }
    }
}

module.exports = VideoController;
