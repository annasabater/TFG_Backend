// src/routes/social_routes.ts

import express from 'express';
import {
  createPostHandler,
  getFeedHandler,
  getUserPostsHandler,
  likePostHandler,
  commentPostHandler,
  getPostHandler,
  getFollowingFeedHandler,
  updatePostHandler,
  deletePostHandler,
  getUserProfileHandler
} from '../controllers/social_controller.js';
import { checkJwt } from '../middleware/session.js';
import { upload } from '../middleware/upload.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';
import { followUser, unfollowUser } from '../controllers/follow_controller.js';

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Social
 *     description: Endpoints de la red social (posts, likes, comentarios)
 */

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
  createPostHandler
);

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
  likePostHandler
);

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
  commentPostHandler
);

/**
 * @openapi
 * /api/posts/following:
 *   get:
 *     summary: Feed con publicaciones de usuarios seguidos
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
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
 *         description: Lista de publicaciones de seguidos
 */
router.get(
  '/posts/following',
  generalRateLimiter,
  checkJwt,
  getFollowingFeedHandler
);

/**
 * @openapi
 * /api/posts/{postId}:
 *   get:
 *     summary: Obtener un post por ID
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         description: ID del post a recuperar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del post
 *       404:
 *         description: Post no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/posts/:postId',
  generalRateLimiter,
  getPostHandler
);

/**
 * @openapi
 * /api/users/{userId}/follow:
 *   post:
 *     summary: Seguir a un usuario
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario a seguir
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario seguido correctamente
 *       400:
 *         description: No puedes seguirte a ti mismo
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/users/:userId/follow', checkJwt, followUser);

/**
 * @openapi
 * /api/users/{userId}/unfollow:
 *   post:
 *     summary: Dejar de seguir a un usuario
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID del usuario a dejar de seguir
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Has dejado de seguir al usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/users/:userId/unfollow', checkJwt, unfollowUser);

/** PUT /api/posts/:postId → editar descripción */
router.put(
  '/posts/:postId',
  generalRateLimiter,
  checkJwt,
  updatePostHandler
);

/** DELETE /api/posts/:postId → borrar post */
router.delete(
  '/posts/:postId',
  generalRateLimiter,
  checkJwt,
  deletePostHandler
);

/** GET /api/users/:userId/profile → perfil + posts + follow? */
router.get(
  '/users/:userId/profile',
  generalRateLimiter,
  checkJwt,
  getUserProfileHandler
);

export default router;
