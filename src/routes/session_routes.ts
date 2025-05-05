import express from 'express';
import {
  createSessionHandler,
  joinLobbyHandler,
  listPendingHandler,
  acceptPlayersHandler
} from '../controllers/session_controller.js';
import { Session } from '../models/session_models.js';
import { checkJwt, checkRole } from '../middleware/session.js';
const router = express.Router();

/**
 * @openapi
 * /api/sessions:
 *   post:
 *     summary: Crear una nueva sesión (lobby) de juego
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scenario, mode]
 *             properties:
 *               scenario:
 *                 type: string
 *               mode:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Sesión creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       '401':
 *         description: No autorizado
 */
router.post('/sessions', checkJwt, checkRole(['Usuario', 'Administrador']), createSessionHandler);


/**
 * @openapi
 * /api/sessions/open:
 *   get:
 *     summary: Listar todas las sesiones abiertas (estado WAITING)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de sesiones abiertas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   scenario:
 *                     type: string
 *                   host:
 *                     type: string
 *       '401':
 *         description: No autorizado
 */
router.get('/sessions/open', checkJwt, async (_req, res) => {
  const open = await Session.find({ state: 'WAITING' })
    .select('_id scenario host')
    .lean();
  res.json(open);
});


/**
 * @openapi
 * /api/sessions/{id}/join:
 *   post:
 *     summary: Unirse al lobby de una sesión
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la sesión
 *     responses:
 *       '200':
 *         description: Usuario añadido al lobby
 *       '404':
 *         description: Sesión no existe
 *       '401':
 *         description: No autorizado
 */
router.post('/sessions/:id/join', checkJwt, checkRole(['Usuario', 'Administrador']), joinLobbyHandler);


/**
 * @openapi
 * /api/sessions/pending:
 *   get:
 *     summary: Listar sesiones con participantes pendientes (solo host)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de sesiones en estado WAITING con sus participantes PENDING
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 *       '401':
 *         description: No autorizado
 */
router.get('/sessions/pending', checkJwt, checkRole(['Administrador']), listPendingHandler);


/**
 * @openapi
 * /api/sessions/{id}/accept:
 *   post:
 *     summary: Aceptar jugadores y empezar partida
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: Partida iniciada y sesión actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       '404':
 *         description: Sesión no encontrada
 *       '401':
 *         description: No autorizado
 */
router.post('/sessions/:id/accept', checkJwt, checkRole(['Administrador']), acceptPlayersHandler);

export default router;
