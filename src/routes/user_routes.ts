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
