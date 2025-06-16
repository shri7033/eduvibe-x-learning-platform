const LiveClass = require('../models/liveClass.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class LiveClassController {
    /**
     * Create a new live class session
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async createLiveClass(req, res, next) {
        try {
            const { title, description, courseId, scheduledStartTime, settings } = req.body;
            const teacherId = req.user.id;

            const liveClass = new LiveClass({
                title,
                description,
                courseId,
                teacherId,
                scheduledStartTime,
                settings
            });

            await liveClass.save();

            res.status(201).json({
                success: true,
                data: liveClass
            });
        } catch (error) {
            logger.error('Error creating live class:', error);
            next(new ApiError(500, 'Failed to create live class'));
        }
    }

    /**
     * Start a scheduled live class
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async startLiveClass(req, res, next) {
        try {
            const { classId } = req.params;
            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            if (liveClass.teacherId.toString() !== req.user.id) {
                return next(new ApiError(403, 'Only the teacher can start the class'));
            }

            await liveClass.startClass();

            // Notify connected users via Socket.IO
            req.app.get('io').to(classId).emit('class-started', {
                classId,
                startTime: liveClass.actualStartTime
            });

            res.json({
                success: true,
                data: liveClass
            });
        } catch (error) {
            logger.error('Error starting live class:', error);
            next(new ApiError(500, 'Failed to start live class'));
        }
    }

    /**
     * End an ongoing live class
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async endLiveClass(req, res, next) {
        try {
            const { classId } = req.params;
            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            if (liveClass.teacherId.toString() !== req.user.id) {
                return next(new ApiError(403, 'Only the teacher can end the class'));
            }

            await liveClass.endClass();

            // Notify connected users
            req.app.get('io').to(classId).emit('class-ended', {
                classId,
                endTime: liveClass.endTime
            });

            res.json({
                success: true,
                data: liveClass
            });
        } catch (error) {
            logger.error('Error ending live class:', error);
            next(new ApiError(500, 'Failed to end live class'));
        }
    }

    /**
     * Join a live class session
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async joinLiveClass(req, res, next) {
        try {
            const { classId } = req.params;
            const userId = req.user.id;

            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            await liveClass.addParticipant(userId);

            // Notify other participants
            req.app.get('io').to(classId).emit('participant-joined', {
                userId,
                username: req.user.name
            });

            res.json({
                success: true,
                data: {
                    streamUrl: liveClass.streamUrl,
                    settings: liveClass.settings
                }
            });
        } catch (error) {
            logger.error('Error joining live class:', error);
            next(new ApiError(500, 'Failed to join live class'));
        }
    }

    /**
     * Create a new poll in the live class
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async createPoll(req, res, next) {
        try {
            const { classId } = req.params;
            const { question, options } = req.body;

            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            if (liveClass.teacherId.toString() !== req.user.id) {
                return next(new ApiError(403, 'Only the teacher can create polls'));
            }

            await liveClass.createPoll(question, options);

            // Notify participants about new poll
            req.app.get('io').to(classId).emit('new-poll', {
                question,
                options: options.map(text => ({ text, votes: 0 }))
            });

            res.json({
                success: true,
                data: liveClass.polls[liveClass.polls.length - 1]
            });
        } catch (error) {
            logger.error('Error creating poll:', error);
            next(new ApiError(500, 'Failed to create poll'));
        }
    }

    /**
     * Submit a vote for a poll
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async submitPollVote(req, res, next) {
        try {
            const { classId, pollId } = req.params;
            const { optionIndex } = req.body;
            const userId = req.user.id;

            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            const poll = liveClass.polls.id(pollId);
            if (!poll) {
                return next(new ApiError(404, 'Poll not found'));
            }

            if (!poll.isActive) {
                return next(new ApiError(400, 'Poll is no longer active'));
            }

            if (poll.options[optionIndex].voters.includes(userId)) {
                return next(new ApiError(400, 'Already voted on this poll'));
            }

            // Add vote
            poll.options[optionIndex].votes += 1;
            poll.options[optionIndex].voters.push(userId);
            await liveClass.save();

            // Calculate and broadcast updated results
            const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
            const results = poll.options.map(opt => ({
                text: opt.text,
                votes: Math.round((opt.votes / totalVotes) * 100)
            }));

            req.app.get('io').to(classId).emit('poll-results', {
                pollId,
                results
            });

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            logger.error('Error submitting poll vote:', error);
            next(new ApiError(500, 'Failed to submit vote'));
        }
    }

    /**
     * Toggle hand raise status
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async toggleHandRaise(req, res, next) {
        try {
            const { classId } = req.params;
            const userId = req.user.id;

            const liveClass = await LiveClass.findById(classId);

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            if (!liveClass.settings.handRaiseEnabled) {
                return next(new ApiError(400, 'Hand raising is disabled for this class'));
            }

            const handRaise = {
                userId,
                timestamp: new Date()
            };

            liveClass.handRaises.push(handRaise);
            await liveClass.save();

            // Notify teacher and other participants
            req.app.get('io').to(classId).emit('hand-raise', {
                userId,
                username: req.user.name,
                timestamp: handRaise.timestamp
            });

            res.json({
                success: true,
                data: handRaise
            });
        } catch (error) {
            logger.error('Error toggling hand raise:', error);
            next(new ApiError(500, 'Failed to toggle hand raise'));
        }
    }

    /**
     * Get live class details
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    static async getLiveClassDetails(req, res, next) {
        try {
            const { classId } = req.params;
            const liveClass = await LiveClass.findById(classId)
                .populate('teacherId', 'name email')
                .populate('participants.userId', 'name email');

            if (!liveClass) {
                return next(new ApiError(404, 'Live class not found'));
            }

            res.json({
                success: true,
                data: liveClass
            });
        } catch (error) {
            logger.error('Error fetching live class details:', error);
            next(new ApiError(500, 'Failed to fetch live class details'));
        }
    }
}

module.exports = LiveClassController;
