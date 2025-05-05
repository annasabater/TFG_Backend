import { body } from 'express-validator';

export const validateForumName = [
  body('name').isString().notEmpty().withMessage('El nombre del foro es obligatorio.')
    .isLength({ max: 100 }).withMessage('El nombre del foro no puede exceder los 100 caracteres.')
];

export const validateForumComment = [
  body('comment').isString().notEmpty().withMessage('El comentario es obligatorio.')
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder los 500 caracteres.')
];