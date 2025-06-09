import express from 'express';
import { checkJwt } from '../middleware/session.js';
import { Notification } from '../models/notification_model.js';

const router = express.Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Obtenir notificacions de l'usuari (últimes 30)
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Llista de notificacions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID de la notificació
 *                   type:
 *                     type: string
 *                     enum: [like, comment, follow, new_post]
 *                     description: Tipus de notificació
 *                   to:
 *                     type: string
 *                     description: ID de l'usuari receptor
 *                   from:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       userName:
 *                         type: string
 *                     description: Usuari emissor
 *                   post:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       _id:
 *                         type: string
 *                       mediaUrl:
 *                         type: string
 *                     description: Post relacionat (si s'escau)
 *                   read:
 *                     type: boolean
 *                     description: Si la notificació ja ha estat llegida
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Timestamp de creació
 */
router.get(
  '/notifications',
  checkJwt,
  async (req, res) => {
    const uid = (req as any).user.id as string;
    const notis = await Notification
      .find({ to: uid })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('from', 'userName')
      .populate('post', 'mediaUrl');
    res.json(notis);
  }
);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar una notificació com a llegida
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notificació
 *     responses:
 *       200:
 *         description: Operació correcta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
router.patch(
  '/notifications/:id/read',
  checkJwt,
  async (req, res) => {
    await Notification.updateOne(
      { _id: req.params.id, to: (req as any).user.id },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  }
);

export default router;
