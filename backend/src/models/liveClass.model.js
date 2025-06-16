const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    votes: {
        type: Number,
        default: 0
    },
    voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [pollOptionSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    }
});

const chatMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const handRaiseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const liveClassSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledStartTime: {
        type: Date,
        required: true
    },
    actualStartTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'],
        default: 'SCHEDULED'
    },
    streamUrl: {
        type: String
    },
    recordingUrl: {
        type: String
    },
    maxQuality: {
        type: String,
        enum: ['360p', '480p', '720p', '1080p'],
        default: '720p'
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: {
            type: Date
        },
        role: {
            type: String,
            enum: ['TEACHER', 'STUDENT', 'MODERATOR'],
            default: 'STUDENT'
        }
    }],
    polls: [pollSchema],
    chatMessages: [chatMessageSchema],
    handRaises: [handRaiseSchema],
    settings: {
        chatEnabled: {
            type: Boolean,
            default: true
        },
        handRaiseEnabled: {
            type: Boolean,
            default: true
        },
        pollsEnabled: {
            type: Boolean,
            default: true
        },
        recordingEnabled: {
            type: Boolean,
            default: true
        },
        participantLimit: {
            type: Number,
            default: 100
        }
    }
}, {
    timestamps: true
});

// Indexes
liveClassSchema.index({ courseId: 1, scheduledStartTime: 1 });
liveClassSchema.index({ teacherId: 1, status: 1 });
liveClassSchema.index({ status: 1, scheduledStartTime: 1 });

// Methods
liveClassSchema.methods.startClass = async function() {
    if (this.status !== 'SCHEDULED') {
        throw new Error('Class can only be started from SCHEDULED state');
    }
    this.status = 'LIVE';
    this.actualStartTime = new Date();
    return this.save();
};

liveClassSchema.methods.endClass = async function() {
    if (this.status !== 'LIVE') {
        throw new Error('Can only end a LIVE class');
    }
    this.status = 'ENDED';
    this.endTime = new Date();
    return this.save();
};

liveClassSchema.methods.addParticipant = async function(userId, role = 'STUDENT') {
    if (this.status !== 'LIVE') {
        throw new Error('Can only join a LIVE class');
    }
    
    const existingParticipant = this.participants.find(p => 
        p.userId.toString() === userId.toString() && !p.leftAt
    );
    
    if (existingParticipant) {
        throw new Error('User is already in the class');
    }

    this.participants.push({
        userId,
        role,
        joinedAt: new Date()
    });
    
    return this.save();
};

liveClassSchema.methods.removeParticipant = async function(userId) {
    const participant = this.participants.find(p => 
        p.userId.toString() === userId.toString() && !p.leftAt
    );
    
    if (participant) {
        participant.leftAt = new Date();
        return this.save();
    }
};

liveClassSchema.methods.createPoll = async function(question, options) {
    if (!this.settings.pollsEnabled) {
        throw new Error('Polls are disabled for this class');
    }

    const poll = {
        question,
        options: options.map(text => ({ text })),
        isActive: true,
        createdAt: new Date()
    };

    this.polls.push(poll);
    return this.save();
};

const LiveClass = mongoose.model('LiveClass', liveClassSchema);

module.exports = LiveClass;
