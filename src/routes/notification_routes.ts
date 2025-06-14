// src/routes/notifications.ts
import express, { Request, Response } from 'express';
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
 *                 # … (mismo schema de antes)
 */
router.get(
	'/notifications',
	checkJwt,
	async (req: Request, res: Response) => {
		// Aquí hacemos un assertion puntual, sin usar `any`
		const uid = (req as Request & { user: { id: string } }).user.id;

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
	async (req: Request, res: Response) => {
		const uid = (req as Request & { user: { id: string } }).user.id;

		await Notification.updateOne(
			{ _id: req.params.id, to: uid },
			{ $set: { read: true } }
		);

		res.json({ ok: true });
	}
);

export default router;
