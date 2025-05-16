// src/routes/session_routes.ts

import { Router, Request, Response } from 'express';
import {
  createSessionHandler,
  joinLobbyHandler,
  listPendingHandler,
  acceptPlayersHandler,
  getScenarioHandler
} from '../controllers/session_controller.js';
import { checkJwt, verifyRole } from '../middleware/session.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Session:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         host:
 *           type: string
 *         scenario:
 *           type: string
 *         mode:
 *           type: string
 *         state:
 *           type: string
 *         participants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               status:
 *                 type: string
 */

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
router.post(
  '/sessions',
  generalRateLimiter,
  checkJwt,
  createSessionHandler
);

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
 *                 $ref: '#/components/schemas/Session'
 *       '401':
 *         description: No autorizado
 */
router.get(
  '/sessions/open',
  generalRateLimiter,
  checkJwt,
  listPendingHandler  // si quieres otro handler, crea uno específico
);

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
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     responses:
 *       '200':
 *         description: Usuario añadido al lobby
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       '404':
 *         description: Sesión no existe
 *       '401':
 *         description: No autorizado
 */
router.post(
  '/sessions/:id/join',
  generalRateLimiter,
  checkJwt,
  joinLobbyHandler
);

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
router.get(
  '/sessions/pending',
  generalRateLimiter,
  checkJwt,
  listPendingHandler
);

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
 *         required: true
 *         schema:
 *           type: string
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
router.post(
  '/sessions/:id/accept',
  generalRateLimiter,
  checkJwt,
  acceptPlayersHandler
);

/**
 * @openapi
 * /api/sessions/{id}/scenario:
 *   get:
 *     summary: Obtener el escenario completo de una sesión
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *     responses:
 *       '200':
 *         description: JSON con los escenarios de la sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scenario:
 *                   type: array
 *                   items:
 *                     type: object
 *       '404':
 *         description: Sesión no encontrada
 *       '401':
 *         description: No autorizado
 */
router.get(
  '/sessions/:id/scenario',
  generalRateLimiter,
  checkJwt,
  getScenarioHandler
);

export default router;
