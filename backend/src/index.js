require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const videoRoutes = require('./routes/video.routes');
const liveClassRoutes = require('./routes/liveClass.routes');
const testRoutes = require('./routes/test.routes');
const doubtRoutes = require('./routes/doubt.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/videos', videoRoutes); // Video routes already have auth middleware applied in routes file
app.use('/api/live-classes', liveClassRoutes); // Live class routes have auth middleware applied in routes file
app.use('/api/tests', authMiddleware, testRoutes);
app.use('/api/doubts', authMiddleware, doubtRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

// Error handling
app.use(errorHandler);

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    let currentRoom = null;
    let userId = null;

    // Authenticate socket connection
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
            socket.emit('authenticated');
            logger.info(`Socket authenticated for user: ${userId}`);
        } catch (error) {
            logger.error('Socket authentication failed:', error);
            socket.emit('auth_error', 'Authentication failed');
        }
    });

    // Handle joining a live class room
    socket.on('join-class', async (classId) => {
        if (!userId) {
            socket.emit('error', 'Authentication required');
            return;
        }

        try {
            // Leave current room if any
            if (currentRoom) {
                await socket.leave(currentRoom);
            }

            await socket.join(classId);
            currentRoom = classId;

            // Update participant count
            const roomSize = io.sockets.adapter.rooms.get(classId)?.size || 0;
            io.to(classId).emit('viewer-count', roomSize);

            logger.info(`Client ${socket.id} (User: ${userId}) joined class: ${classId}`);
        } catch (error) {
            logger.error('Error joining class:', error);
            socket.emit('error', 'Failed to join class');
        }
    });

    // Handle chat messages
    socket.on('chat-message', async (data) => {
        if (!userId || !currentRoom) {
            socket.emit('error', 'Not authorized or not in a class');
            return;
        }

        try {
            const message = {
                userId,
                content: data.content,
                timestamp: new Date(),
                username: data.username
            };

            io.to(currentRoom).emit('chat-message', message);
            logger.info(`Chat message in ${currentRoom} from ${userId}`);
        } catch (error) {
            logger.error('Error handling chat message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle hand raise events
    socket.on('hand-raise', async (data) => {
        if (!userId || !currentRoom) {
            socket.emit('error', 'Not authorized or not in a class');
            return;
        }

        try {
            io.to(currentRoom).emit('hand-raise', {
                userId,
                username: data.username,
                raised: data.raised
            });
            logger.info(`Hand raise in ${currentRoom} from ${userId}: ${data.raised}`);
        } catch (error) {
            logger.error('Error handling hand raise:', error);
            socket.emit('error', 'Failed to process hand raise');
        }
    });

    // Handle poll votes
    socket.on('poll-vote', async (data) => {
        if (!userId || !currentRoom) {
            socket.emit('error', 'Not authorized or not in a class');
            return;
        }

        try {
            // In a real implementation, save vote to database
            io.to(currentRoom).emit('poll-update', {
                pollId: data.pollId,
                optionIndex: data.optionIndex,
                userId
            });
            logger.info(`Poll vote in ${currentRoom} from ${userId}`);
        } catch (error) {
            logger.error('Error handling poll vote:', error);
            socket.emit('error', 'Failed to process vote');
        }
    });

    // Handle leaving a class
    socket.on('leave-class', async () => {
        if (currentRoom) {
            await socket.leave(currentRoom);
            const roomSize = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
            io.to(currentRoom).emit('viewer-count', roomSize);
            logger.info(`Client ${socket.id} left class: ${currentRoom}`);
            currentRoom = null;
        }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
        if (currentRoom) {
            const roomSize = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
            io.to(currentRoom).emit('viewer-count', roomSize);
        }
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eduvibex', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    logger.info('Connected to MongoDB');
})
.catch((error) => {
    logger.error('MongoDB connection error:', error);
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection:', error);
    process.exit(1);
});

module.exports = app;
