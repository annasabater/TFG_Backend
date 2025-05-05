// src/routes/game_routes.ts
import express from 'express';
import { createGameHandler, getAllGamesHandler, getGameByIdHandler, joinGameHandler, getGamePlayersHandler, addScoreHandler, getGameScoresHandler } from '../controllers/game_controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/games:
 *   post:
 *     summary: Crear un nuevo juego
 *     tags: [Juegos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - maxPlayers
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [carreras, competencia, obstaculos]
 *               maxPlayers:
 *                 type: number
 *     responses:
 *       201:
 *         description: Juego creado exitosamente
 */
router.post('/games', createGameHandler);

/**
 * @swagger
 * /api/games:
 *   get:
 *     summary: Obtener todos los juegos
 *     tags: [Juegos]
 *     responses:
 *       200:
 *         description: Lista de juegos
 */
router.get('/games', getAllGamesHandler);

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Obtener detalles de un juego específico
 *     tags: [Juegos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del juego
 *       404:
 *         description: Juego no encontrado
 */
router.get('/games/:id', getGameByIdHandler);

/**
 * @swagger
 * /api/games/{id}/join:
 *   post:
 *     summary: Unirse a un juego
 *     tags: [Juegos]
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
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario añadido al juego
 *       400:
 *         description: Juego lleno o usuario ya está en el juego
 */
router.post('/games/:id/join', joinGameHandler);

/**
 * @swagger
 * /api/games/{id}/players:
 *   get:
 *     summary: Obtener jugadores de un juego
 *     tags: [Juegos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de jugadores en el juego
 */
router.get('/games/:id/players', getGamePlayersHandler);

/**
 * @swagger
 * /api/games/{id}/score:
 *   post:
 *     summary: Registrar puntuación en un juego
 *     tags: [Juegos]
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
 *             required:
 *               - userId
 *               - score
 *             properties:
 *               userId:
 *                 type: string
 *               score:
 *                 type: number
 *     responses:
 *       200:
 *         description: Puntuación registrada
 */
router.post('/games/:id/score', addScoreHandler);

/**
 * @swagger
 * /api/games/{id}/scores:
 *   get:
 *     summary: Obtener ranking de un juego
 *     tags: [Juegos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de puntuaciones del juego
 */
router.get('/games/:id/scores', getGameScoresHandler);

export default router;