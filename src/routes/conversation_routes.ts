import express from 'express';
import { generalRateLimiter } from '../middleware/rateLimiter.js';
import {
  openConversationHandler,
  getConversationsHandler
} from '../controllers/conversation_controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Conversations
 *   description: Hilos de mensajería entre usuarios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversationInput:
 *       type: object
 *       properties:
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array con [currentUserId, peerId]
 *       required:
 *         - members
 */

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Crea o recupera una conversación entre dos usuarios
 *     tags: [Conversations]
 *     requestBody:
 *       description: IDs de los dos participantes
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationInput'
 *     responses:
 *       200:
 *         description: Conversación existente encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 members:
 *                   type: array
 *                   items: { type: string }
 *       201:
 *         description: Nueva conversación creada
 *       400:
 *         description: Petición inválida
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/conversations',
  generalRateLimiter,
  openConversationHandler
);

/**
 * @swagger
 * /api/conversations/{userId}:
 *   get:
 *     summary: Lista de conversaciones de un usuario
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Conversaciones con último mensaje y timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   members:
 *                     type: array
 *                     items: { type: string }
 *                   lastMessage:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error al cargar
 */
router.get(
  '/conversations/:userId',
  generalRateLimiter,
  getConversationsHandler
);

export default router;
