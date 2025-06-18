//src/routes/user_routes.ts
import express from 'express';
import {
	saveMethodHandler,
	getAllUsersHandler,
	getUserByIdHandler,
	updateUserHandler,
	deleteUserHandler,
	getUserBalanceHandler,
	addUserBalanceHandler
} from '../controllers/user_controller.js';
import { checkJwt } from '../middleware/session.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

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
router.get('/main',generalRateLimiter,checkJwt, saveMethodHandler);

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
 *     summary: Obtiene todos los usuarios con filtros y paginación
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página actual
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número de resultados por página
 *       - in: query
 *         name: userName
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de usuario (parcial)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filtrar por email (parcial)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Administrador, Usuario, Empresa, Gobierno]
 *         description: Filtrar por rol exacto
 *     responses:
 *       200:
 *         description: Lista de usuarios con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pages:
 *                   type: integer
 */
router.get('/users',generalRateLimiter, checkJwt, getAllUsersHandler);

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
router.get('/users/:id',generalRateLimiter, checkJwt, getUserByIdHandler);

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
router.put('/users/:id',generalRateLimiter,checkJwt, updateUserHandler);

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
router.delete('/users/:id',generalRateLimiter,checkJwt, deleteUserHandler);

/**
 * @openapi
 * /api/users/{id}/balance:
 *   get:
 *     summary: Obtiene el saldo de un usuario por ID
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
router.get('/users/:id/balance', getUserBalanceHandler);

/**
 * @openapi
 * /api/users/{id}/balance:
 *   post:
 *     summary: Añade saldo multidivisa a un usuario por ID
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
 *               currency:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Saldo añadido exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/users/:id/balance', addUserBalanceHandler);

// Mantener las rutas de balance y cualquier otra relacionada con la tienda

export default router;
