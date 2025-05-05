import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    saveMethodHandler,
    createUserHandler,
    getAllUsersHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler
} from '../controllers/user_controller.js';
import { checkJwt, verifyRole } from '../middleware/session.js';

const router = express.Router();

/**
 * @openapi
 * /api/main:
 *   get:
 *     summary: Página de bienvenida
 *     tags:
 *       - Main
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bienvenido a la API
 */
router.get('/main',checkJwt, saveMethodHandler);

//To delete this routes later
// /**
//  * @openapi
//  * /api/users/signup:
//  *   post:
//  *     summary: Crea un nuevo usuario
//  *     description: Añade los detalles de un nuevo usuario comprobando si existe un usuario primero con ese email.
//  *     tags:
//  *       - Users
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               userName:
//  *                 type: string
//  *               email:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *                 items:
//  *                   type: string
//  *               role:
//  *                 type: string
//  *                 enum: [Administrador, Usuario, Empresa, Gobierno]
//  *     responses:
//  *       201:
//  *         description: Usuario creado exitosamente
//  */
// router.post('/users/signup', createUserHandler);

// /**
//  * @openapi
//  * /api/users/login:
//  *   post:
//  *     summary: Ruta para loguearse con un usuario
//  *     description: Loguea al usuario.
//  *     tags:
//  *       - Users
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               email:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *     responses:
//  *       201:
//  *         description: Usuario creado exitosamente
//  */

// router.post('/users/login', logInHandler);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Éxito
 */
router.get('/users', checkJwt, getAllUsersHandler);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/users/:id', checkJwt, getUserByIdHandler);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un usuario por ID
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/users/:id',checkJwt, updateUserHandler);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     tags:
 *       - Users
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/users/:id',checkJwt, deleteUserHandler);

export default router;
