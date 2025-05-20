// src/routes/social_routes.ts
import express from 'express';
import {
  createPostHandler,
  getFeedHandler,
  getUserPostsHandler,
  likePostHandler,
  commentPostHandler,
} from '../controllers/social_controller.js';
import { checkJwt } from '../middleware/session.js';
import { upload } from '../middleware/upload.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/* ───────────────────────────────── TAG GLOBAL ───────────────────────────────── */
/**
 * @openapi
 * tags:
 *   - name: Social
 *     description: Endpoints de la red social (posts, likes, comentarios)
 */

/* ───────────────────────────────── FEED PÚBLICO ─────────────────────────────── */
/**
 * @openapi
 * /api/feed:
 *   get:
 *     summary: Obtener feed público (posts más recientes)
 *     tags: [Social]
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
 *         description: Lista de posts paginados
 */
router.get('/feed', generalRateLimiter, getFeedHandler);

/* ───────────────────────────── POSTS DE UN USUARIO ──────────────────────────── */
/**
 * @openapi
 * /api/users/{userId}/posts:
 *   get:
 *     summary: Posts de un usuario concreto
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: Lista de posts del usuario
 */
router.get('/users/:userId/posts', generalRateLimiter, getUserPostsHandler);

/* ───────────────────────────────── CREAR POST ───────────────────────────────── */
/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Crear un nuevo post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - mediaType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: JSON array como texto o varios campos `tags[]`
 *     responses:
 *       201:
 *         description: Post creado
 *       401:
 *         description: No autorizado
 */
router.post(
  '/posts',
  generalRateLimiter,
  checkJwt,
  upload.single('file'),
  createPostHandler,
);

/* ───────────────────────────────── LIKE / UNLIKE ────────────────────────────── */
/**
 * @openapi
 * /api/posts/{postId}/like:
 *   post:
 *     summary: Dar o quitar like a un post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Número total de likes
 */
router.post(
  '/posts/:postId/like',
  generalRateLimiter,
  checkJwt,
  likePostHandler,
);

/* ───────────────────────────────── COMENTARIOS ──────────────────────────────── */
/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Añadir comentario a un post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Comentario creado
 */
router.post(
  '/posts/:postId/comments',
  generalRateLimiter,
  checkJwt,
  commentPostHandler,
);

export default router;
