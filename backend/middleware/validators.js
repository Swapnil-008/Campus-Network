import { body, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// Auth validators
export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').trim().isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
    body('department').if(body('role').isIn(['student', 'teacher']))
        .notEmpty().withMessage('Department is required'),
    validate
];

export const loginValidation = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

export const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate
];

// Group validators
export const createGroupValidation = [
    body('name').trim().notEmpty().withMessage('Group name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
    body('type').isIn(['academic', 'club', 'department', 'other']).withMessage('Invalid group type'),
    validate
];

// Message validators
export const messageValidation = [
    body('content').optional().trim().isLength({ max: 5000 }).withMessage('Message too long (max 5000 chars)'),
    validate
];
