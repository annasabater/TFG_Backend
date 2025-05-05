import { body, param } from 'express-validator';

export const validateMessageContent = [
  body('content').isString().notEmpty().withMessage('El contenido del mensaje no puede estar vacío.')
    .isLength({ max: 500 }).withMessage('El contenido del mensaje no puede exceder los 500 caracteres.')
];

export const validateMessageSenderReceiver = [
  body('senderId').isMongoId().withMessage('El ID del remitente no es válido.'),
  body('receiverId').isMongoId().withMessage('El ID del receptor no es válido.')
];