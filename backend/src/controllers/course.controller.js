const Course = require('../models/course.model');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

class CourseController {
  /**
   * Get list of courses with optional filters and pagination
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  static async getCourses(req, res, next) {
    try {
      const { category, search, page = 1, limit = 10 } = req.query;

      const filter = {};
      if (category) {
        filter.category = category;
      }
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      const skip = (page - 1) * limit;

      const courses = await Course.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Course.countDocuments(filter);

      res.json({
        success: true,
        data: courses,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('Error fetching courses:', error);
      next(new ApiError(500, 'Failed to fetch courses'));
    }
  }

  /**
   * Get course details by ID
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  static async getCourseById(req, res, next) {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);

      if (!course) {
        return next(new ApiError(404, 'Course not found'));
      }

      res.json({
        success: true,
        data: course,
      });
    } catch (error) {
      logger.error('Error fetching course by ID:', error);
      next(new ApiError(500, 'Failed to fetch course details'));
    }
  }
}

module.exports = CourseController;
