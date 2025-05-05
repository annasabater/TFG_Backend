import { body, param } from 'express-validator';

export const validateDronePrice = [
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo.')
];

export const validateDroneModel = [
  body('model').isString().notEmpty().withMessage('El modelo del dron es obligatorio.')
    .isLength({ max: 100 }).withMessage('El modelo del dron no puede exceder los 100 caracteres.')
];

export const validateDroneCategoryCondition = [
  body('category').optional().isIn(['venta', 'alquiler']).withMessage('La categoría debe ser "venta" o "alquiler".'),
  body('condition').optional().isIn(['nuevo', 'usado']).withMessage('La condición debe ser "nuevo" o "usado".')
];