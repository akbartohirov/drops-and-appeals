import { body, param, query, validationResult } from 'express-validator';

export const validate = (rules) => [
    ...rules,
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
        next();
    }
];

export const loginRules = () => validate([
    body('username').trim().notEmpty().withMessage('username kerak'),
    body('password').isLength({ min: 6 }).withMessage('parol kamida 6 belgi')
]);

export const createUserRules = () => validate([
    body('username').trim().notEmpty().withMessage('username kerak'),
    body('password').isLength({ min: 6 }).withMessage('parol kamida 6 belgi'),
    body('is_admin').optional().isBoolean().withMessage('is_admin boolean bo‘lsin')
]);

export const changePasswordRules = () => validate([
    param('id').isInt().withMessage('id noto‘g‘ri'),
    body('password').isLength({ min: 6 }).withMessage('parol kamida 6 belgi')
]);

export const appealCreateRules = () => validate([
    body('applicant_name').notEmpty().withMessage('Murojaatchi nomi kerak'),
    body('appeal_date').notEmpty().withMessage('Murojaat sanasi kerak')
]);

export const appealIdRule = () => validate([param('id').isInt().withMessage('id noto‘g‘ri')]);

export const dropCreateRules = () => validate([
    body('card_number').notEmpty().withMessage('Karta raqami kerak'),
    body('blocked_at').notEmpty().withMessage('Bloklangan sana kerak')
]);

export const dropIdRule = () => validate([param('id').isInt().withMessage('id noto‘g‘ri')]);

export const paginationRules = () => validate([
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('q').optional().isString()
]);
