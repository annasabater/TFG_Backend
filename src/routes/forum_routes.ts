import express from 'express';
import { createEntryHandler,
	deleteEntryHandler,
	getAllForumHandler,
	getEntryByIdHandler,
	updateEntryHandler } from '../controllers/forum_controller.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';
import { checkJwt } from '../middleware/session.js';

const router = express.Router();

/**
 * @openapi
 * /api/forum:
 *   post:
 *     summary: Crea una nueva entrada en el foro
 *     description: Añade una nueva entrada al foro.
 *     tags:
 *       - Forum
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entrada creada exitosamente
 */
router.post('/forum',generalRateLimiter, createEntryHandler);

/**
 * @openapi
 * /api/forum:
 *   get:
 *     summary: Obtiene todas las entradas del foro
 *     description: Retorna una lista de todas las entradas del foro.
 *     tags:
 *       - Forum
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of forums per page
 *     responses:
 *       200:
 *         description: List of all forums
 */
router.get('/forum',generalRateLimiter,checkJwt, getAllForumHandler);

/**
 * @openapi
 * /api/forum/{id}:
 *   get:
 *     summary: Obtiene una entrada del foro por ID
 *     description: Retorna los detalles de una entrada específica del foro.
 *     tags:
 *       - Forum
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 comment:
 *                   type: string
 *       404:
 *         description: Entrada no encontrada
 */
router.get('/forum/:id',generalRateLimiter, getEntryByIdHandler);

/**
 * @openapi
 * /api/forum/{id}:
 *   put:
 *     summary: Actualiza una entrada del foro por ID
 *     description: Modifica los detalles de una entrada específica del foro.
 *     tags:
 *       - Forum
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
 *               name:
 *                 type: string
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entrada actualizada exitosamente
 *       404:
 *         description: Entrada no encontrada
 */
router.put('/forum/:id',generalRateLimiter, updateEntryHandler);

/**
 * @openapi
 * /api/forum/{id}:
 *   delete:
 *     summary: Elimina una entrada del foro por ID
 *     description: Elimina una entrada específica del foro.
 *     tags:
 *       - Forum
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entrada eliminada exitosamente
 *       404:
 *         description: Entrada no encontrada
 */
router.delete('/forum/:id',generalRateLimiter, deleteEntryHandler);

export default router;
