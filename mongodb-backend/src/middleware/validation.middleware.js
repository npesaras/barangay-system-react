const Joi = require('joi');

/**
 * Request Validation Middleware
 * Validates request data against defined schemas
 */

// Resident validation schema
const residentSchema = Joi.object({
  firstName: Joi.string().required(),
  middleName: Joi.string().allow(''),
  lastName: Joi.string().required(),
  alias: Joi.string().allow(''),
  birthplace: Joi.string().required(),
  birthdate: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
  age: Joi.number().integer().min(0).required(),
  civilStatus: Joi.string().valid('Single', 'Married', 'Widowed', 'Divorced').required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  purok: Joi.string().required(),
  votersStatus: Joi.string().valid('Registered', 'Not-Registered').required(),
  identifiedAs: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  contactNumber: Joi.string().pattern(/^[0-9+\-\s()]*$/).allow(''),
  occupation: Joi.string().allow(''),
  citizenship: Joi.string().default('Filipino'),
  householdNo: Joi.string().allow(''),
  address: Joi.string().required(),
  precinctNo: Joi.string().allow(''),
  profileImage: Joi.any()  // Allow any value for profileImage since it's handled separately
}).unknown(true);  // Allow unknown keys to handle additional fields like createdAt, updatedAt

// Student validation schema
const studentSchema = Joi.object({
  studentId: Joi.string().pattern(/^\d+$/).required(),
  firstName: Joi.string().required(),
  middleName: Joi.string().allow(''),
  lastName: Joi.string().required(),
  gradeLevel: Joi.string().required(),
  section: Joi.string().required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  birthdate: Joi.date().required(),
  age: Joi.number().integer().min(0).required(),
  address: Joi.string().required(),
  guardianName: Joi.string().required(),
  contactNumber: Joi.string().pattern(/^[0-9+\-\s()]*$/).allow('')
});

// User validation schema
const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  adminCode: Joi.string().when('role', {
    is: 'admin',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  role: Joi.string().valid('admin', 'user').default('user')
});

// Validation schemas
const schemas = {
  registerAdmin: Joi.object({
    username: Joi.string().min(3).max(30).required()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      }),
    adminCode: Joi.string().required()
      .messages({
        'any.required': 'Admin registration code is required'
      })
  }),

  registerUser: Joi.object({
    username: Joi.string().min(3).max(30).required()
      .messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    username: Joi.string().required()
      .messages({
        'any.required': 'Username is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Export validation middlewares
module.exports = {
  validateResident: validate(residentSchema),
  validateStudent: validate(studentSchema),
  validateUser: validate(userSchema),
  validateRegisterAdmin: validate(schemas.registerAdmin),
  validateRegisterUser: validate(schemas.registerUser),
  validateLogin: validate(schemas.login)
}; 