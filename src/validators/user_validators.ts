import { body, param } from 'express-validator';

export const validateUniqueEmail = [
  body('email').isEmail().withMessage('El correo electrónico no es válido.')
    .custom(async (email) => {
      // Aquí se validaría si el correo ya existe en la base de datos
      const userExists = false; // Reemplazar con lógica real
      if (userExists) {
        throw new Error('El correo electrónico ya está en uso.');
      }
    })
];

export const validatePasswordStrength = [
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula.')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula.')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número.')
    .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial.')
];