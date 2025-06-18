import { Request, Response } from 'express';
import { addComment, getCommentsByDrone, softDeleteComment, updateComment } from '../service/comment_service.js';
import mongoose from 'mongoose';
import Comment from '../models/comment_models.js';

export const addCommentHandler = async (req: Request, res: Response) => {
	try {
		const { droneId, userId, text, rating, parentCommentId } = req.body;
		if (!droneId || !userId || !text) {
			return res.status(400).json({ message: 'Faltan datos obligatorios' });
		}
		if (rating && (rating < 1 || rating > 5)) {
			return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
		}
		const comment = await addComment({ droneId, userId, text, rating, parentCommentId });
		res.status(201).json(comment);
	} catch (err: unknown) {
		if (err instanceof Error) {
			res.status(500).json({ message: err.message });
		} else {
			res.status(500).json({ message: String(err) });
		}
	}
};

export const getCommentsByDroneHandler = async (req: Request, res: Response) => {
	try {
		const { droneId } = req.params;
		const comments = await getCommentsByDrone(droneId);
		res.status(200).json(comments);
	} catch (err: unknown) {
		if (err instanceof Error) {
			res.status(500).json({ message: err.message });
		} else {
			res.status(500).json({ message: String(err) });
		}
	}
};

export const getAllCommentsHandler = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		let limit = parseInt(req.query.limit as string) || 10;
		if (limit > 50) limit = 50;

		const filters: Record<string, string> = {};
		for (const key of ['droneId', 'userId', 'text', '_id']) {
			if (req.query[key]) filters[key] = req.query[key] as string;
		}

		const query = Object.entries(filters).reduce((acc, [key, value]) => {
			if (key === '_id') {
				acc._id = new mongoose.Types.ObjectId(value);
			} else if (key === 'text') {
				acc[key] = { $regex: value, $options: 'i' };
			} else {
				acc[key] = value;
			}
			return acc;
		}, {} as Record<string, unknown>);

		const total = await Comment.countDocuments();
		const comments = await Comment.find(query)
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean();

		res.status(200).json({
			comments,
			pages: Math.ceil(total / limit),
		});
	} catch (err) {
		res.status(500).json({ message: (err as Error).message });
	}
};

export const updateCommentHandler = async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const updated = await updateComment(id, req.body);
		if (!updated) {
			return res.status(404).json({ message: 'Comentario no encontrado' });
		}
		res.status(200).json(updated);
	} catch (err: unknown) {
		res.status(500).json({ message: (err as Error).message });
	}
};

export const deleteCommentHandler = async (req: Request, res: Response) => {
	try {
		const id = req.params.id;
		const deleted = await softDeleteComment(id);
		if (!deleted) {
			return res.status(404).json({ message: 'Comentario no encontrado' });
		}
		res.status(200).json({ message: 'Comentario marcado como eliminado', deleted });
	} catch (err: unknown) {
		res.status(500).json({ message: (err as Error).message });
	}
};
