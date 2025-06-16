const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: 'Please enter a valid 10-digit phone number'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
    dob: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    aadharNumber: {
        type: String,
        required: [true, 'Aadhar number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{12}$/.test(v);
            },
            message: 'Please enter a valid 12-digit Aadhar number'
        }
    },
    userType: {
        type: String,
        required: [true, 'User type is required'],
        enum: ['student', 'teacher', 'parent'],
        default: 'student'
    },
    // Parent details (required for students)
    parentName: {
        type: String,
        required: function() {
            return this.userType === 'student';
        }
    },
    parentPhone: {
        type: String,
        required: function() {
            return this.userType === 'student';
        },
        validate: {
            validator: function(v) {
                if (this.userType === 'student') {
                    return /^[0-9]{10}$/.test(v);
                }
                return true;
            },
            message: 'Please enter a valid parent phone number'
        }
    },
    // Verification status
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isAadharVerified: {
        type: Boolean,
        default: false
    },
    // For students
    selectedGoal: {
        type: String,
        enum: ['NEET', 'IIT-JEE', 'SCHOOL_EXAMS'],
        required: function() {
            return this.userType === 'student';
        }
    },
    selectedClass: {
        type: String,
        enum: ['11', '12', 'DROPPER'],
        required: function() {
            return this.userType === 'student';
        }
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    completedLectures: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        },
        lectureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lecture'
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    testScores: [{
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test'
        },
        score: Number,
        maxScore: Number,
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // For teachers
    specialization: {
        type: String,
        required: function() {
            return this.userType === 'teacher';
        }
    },
    qualifications: [{
        degree: String,
        institution: String,
        year: Number
    }],
    teachingExperience: {
        type: Number,
        required: function() {
            return this.userType === 'teacher';
        }
    },
    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    // Common fields
    profilePicture: {
        type: String,
        default: 'default-profile.png'
    },
    wallet: {
        balance: {
            type: Number,
            default: 0
        },
        transactions: [{
            type: {
                type: String,
                enum: ['CREDIT', 'DEBIT']
            },
            amount: Number,
            description: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    },
    notifications: [{
        title: String,
        message: String,
        type: {
            type: String,
            enum: ['COURSE', 'TEST', 'PAYMENT', 'SYSTEM']
        },
        isRead: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    deviceTokens: [{
        token: String,
        device: String,
        lastUsed: {
            type: Date,
            default: Date.now
        }
    }],
    lastActive: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ email: 1 });
userSchema.index({ aadharNumber: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'wallet.transactions.timestamp': -1 });
userSchema.index({ createdAt: -1 });

// Virtual field for age
userSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
});

// Virtual field for full profile completion
userSchema.virtual('isProfileComplete').get(function() {
    if (this.userType === 'student') {
        return !!(this.fullName && this.phone && this.email && this.dob && 
                 this.aadharNumber && this.parentName && this.parentPhone && 
                 this.selectedGoal && this.selectedClass);
    }
    if (this.userType === 'teacher') {
        return !!(this.fullName && this.phone && this.email && this.dob && 
                 this.aadharNumber && this.specialization && 
                 this.qualifications.length > 0);
    }
    return !!(this.fullName && this.phone && this.email && this.dob && 
             this.aadharNumber);
});

// Methods
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.aadharNumber;
    delete obj.deviceTokens;
    return obj;
};

// Static methods
userSchema.statics.findByCredentials = async function(identifier) {
    const user = await this.findOne({
        $or: [
            { phone: identifier },
            { email: identifier }
        ]
    });
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
