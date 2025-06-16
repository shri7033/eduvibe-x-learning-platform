const express = require('express');
const CourseController = require('../controllers/course.controller');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public route to get list of courses
router.get('/', CourseController.getCourses);

// Public route to get course details by ID
router.get('/:id', CourseController.getCourseById);

module.exports = router;
