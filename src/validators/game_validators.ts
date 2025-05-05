import { body, param } from 'express-validator';

export const validateGameName = [
  body('name').isString().notEmpty().withMessage('El nombre del juego es obligatorio.')
    .isLength({ max: 50 }).withMessage('El nombre del juego no puede exceder los 50 caracteres.')
];

export const validateGameType = [
  body('type').isIn(['carreras', 'competencia', 'obstaculos']).withMessage('El tipo de juego no es válido.')
];

export const validateMaxPlayers = [
  body('maxPlayers').optional().isInt({ min: 1, max: 100 }).withMessage('El número máximo de jugadores debe estar entre 1 y 100.')
];