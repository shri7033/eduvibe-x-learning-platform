const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    // Add timestamp
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Add errors stack trace
    winston.format.errors({ stack: true }),
    // Add colorization
    winston.format.colorize({ all: true }),
    // Define the format of the message showing the timestamp, the level and the message
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
    )
);

// Define which transports the logger must use to print out messages
const transports = [
    // Allow the use the console to print the messages
    new winston.transports.Console(),
    // Allow to print all the error level messages inside the error.log file
    new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        format: winston.format.uncolorize()
    }),
    // Allow to print all the messages inside the combined.log file
    new winston.transports.File({ 
        filename: path.join('logs', 'combined.log'),
        format: winston.format.uncolorize()
    })
];

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
    write: (message) => logger.http(message.trim())
};

// Custom logging methods
logger.successRoute = (req) => {
    logger.info(`${req.method} ${req.originalUrl} - Success`);
};

logger.failureRoute = (req, error) => {
    logger.error(`${req.method} ${req.originalUrl} - Failed: ${error.message}`);
};

logger.apiRequest = (req) => {
    logger.http(`Incoming ${req.method} request to ${req.originalUrl}`);
};

logger.dbQuery = (operation, collection) => {
    logger.debug(`DB ${operation} operation on ${collection} collection`);
};

logger.authAttempt = (userId, success) => {
    if (success) {
        logger.info(`Successful authentication for user ${userId}`);
    } else {
        logger.warn(`Failed authentication attempt for user ${userId}`);
    }
};

logger.errorDetail = (error, context = '') => {
    const errorMessage = error.stack || error.message || error;
    logger.error(`${context ? context + ': ' : ''}${errorMessage}`);
};

// Performance logging
logger.performance = {
    start: (label) => {
        const start = process.hrtime();
        return () => {
            const [seconds, nanoseconds] = process.hrtime(start);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            logger.debug(`${label} took ${duration.toFixed(2)}ms`);
        };
    }
};

// Security logging
logger.security = {
    accessDenied: (req, reason) => {
        logger.warn(`Access denied to ${req.originalUrl}: ${reason}`);
    },
    suspicious: (activity, details) => {
        logger.warn(`Suspicious activity detected - ${activity}: ${details}`);
    }
};

// System logging
logger.system = {
    startup: () => {
        logger.info(`Server started in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
    },
    shutdown: () => {
        logger.info('Server is shutting down');
    },
    dbConnection: (success) => {
        if (success) {
            logger.info('Database connection established successfully');
        } else {
            logger.error('Database connection failed');
        }
    }
};

// Cleanup old logs (keep last 30 days)
const cleanupOldLogs = () => {
    const fs = require('fs');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    fs.readdir(path.join('logs'), (err, files) => {
        if (err) {
            logger.error('Error reading logs directory:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join('logs', file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    logger.error(`Error getting stats for file ${file}:`, err);
                    return;
                }

                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            logger.error(`Error deleting old log file ${file}:`, err);
                        } else {
                            logger.debug(`Deleted old log file: ${file}`);
                        }
                    });
                }
            });
        });
    });
};

// Run cleanup every day at midnight
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

module.exports = logger;
