// src/controllers/follow_controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user_models.js';
import { pushNotification } from '../service/notification_service.js';
import { getFollowingUsers } from '../service/user_service.js';

// 1. Definimos un tipo que incluye user.id en Request
interface AuthenticatedRequest extends Request {
	user: {
		id: string;
	};
}

export const followUser = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.id;
		const targetId = req.params.userId;

		if (userId === targetId) {
			return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
		}

		const targetObjectId = new mongoose.Types.ObjectId(targetId);
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		if (!user.following.some(id => id.equals(targetObjectId))) {
			user.following.push(targetObjectId);
			await user.save();

			// Notificación de FOLLOW
			await pushNotification({
				to: targetId,
				from: userId,
				type: 'follow',
			});
		}

		res.status(200).json({ message: 'Seguido correctamente' });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		res.status(500).json({ message });
	}
};

export const unfollowUser = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.id;
		const targetId = req.params.userId;
		const targetObjectId = new mongoose.Types.ObjectId(targetId);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		user.following = user.following.filter(id => !id.equals(targetObjectId));
		await user.save();

		res.status(200).json({ message: 'Dejaste de seguir al usuario' });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		res.status(500).json({ message });
	}
};

export const getMyFollowingHandler = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user.id;
		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 10);

		const following = await getFollowingUsers(userId, page, limit);
		res.json({ following });
	} catch (err: unknown) {
		if (err instanceof Error && err.message === 'Usuario no encontrado') {
			return res.status(404).json({ message: err.message });
		}
		const message = err instanceof Error ? err.message : String(err);
		res.status(500).json({ message });
	}
};
