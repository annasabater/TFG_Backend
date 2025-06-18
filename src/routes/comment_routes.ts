import { Router } from 'express';
import { addCommentHandler, deleteCommentHandler, getAllCommentsHandler, getCommentsByDroneHandler, updateCommentHandler } from '../controllers/comment_controller.js';
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

/**
 * @openapi
 * /api/comments:
 *   get:
 *     summary: Obtener todos los comentarios con paginación y filtro
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página
 *       - in: query
 *         name: droneId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: text
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista paginada de comentarios
 */
router.get('/comments', generalRateLimiter, getAllCommentsHandler);

/**
 * @openapi
 * /api/comments/{id}:
 *   put:
 *     summary: Actualizar comentario
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               text:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Comentario actualizado
 */
router.put('/comments/:id', generalRateLimiter, checkJwt, updateCommentHandler);

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     summary: Eliminar comentario (soft delete)
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comentario marcado como eliminado
 */
router.delete('/comments/:id', generalRateLimiter, checkJwt, deleteCommentHandler);

export default router;
