import { Router } from 'express';
import { addCommentHandler, getCommentsByDroneHandler } from '../controllers/comment_controller.js';
import { checkJwt } from '../middleware/session.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @openapi
 * /api/comments:
 *   post:
 *     summary: Añadir comentario o respuesta a un dron
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - droneId
 *               - userId
 *               - text
 *             properties:
 *               droneId:
 *                 type: string
 *                 description: ID del dron
 *               userId:
 *                 type: string
 *                 description: ID del usuario
 *               text:
 *                 type: string
 *                 description: Texto del comentario
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (solo permitido en comentarios raíz)
 *               parentCommentId:
 *                 type: string
 *                 description: ID del comentario padre (si es respuesta)
 *     responses:
 *       201:
 *         description: Comentario creado correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */

// Añadir comentario o respuesta a un dron
router.post('/comments', generalRateLimiter, checkJwt, addCommentHandler);

/**
 * @openapi
 * /api/comments/{droneId}:
 *   get:
 *     summary: Obtener todos los comentarios (y respuestas) de un dron
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: droneId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron
 *     responses:
 *       200:
 *         description: Lista de comentarios y respuestas
 *       500:
 *         description: Error interno del servidor
 */

// Obtener todos los comentarios (y respuestas) de un dron
router.get('/comments/:droneId', generalRateLimiter, getCommentsByDroneHandler);

export default router;
