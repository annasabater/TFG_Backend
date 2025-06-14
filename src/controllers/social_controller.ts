// src/controllers/social_controller.ts

import { Request, Response } from 'express';
import {
	createPost,
	getFeed,
	getUserPosts,
	getFollowingFeed,
	toggleLike,
	addComment,
	getPostById,
	updatePost,
	deletePost,
	removeComment
} from '../service/social_service.js';
import User from '../models/user_models.js';

/**
 * Request tipado con user.id inyectado por tu middleware de sesión.
 */
type ReqWithUser = Request & {
	user: { id: string };
};

/**
 * Para el endpoint de subida de fichero, añadimos también `file`.
 */
type ReqWithUserAndFile = ReqWithUser & {
	file?: Express.Multer.File;
};

export const createPostHandler = async (
	req: ReqWithUserAndFile,
	res: Response
) => {
	try {
		const file = req.file;
		if (!file) {
			return res.status(400).json({ message: 'Imagen requerida' });
		}

		const { mediaType, description, location, tags = '[]' } = req.body;
		if (!['image', 'video'].includes(mediaType)) {
			return res.status(422).json({ message: 'mediaType inválido' });
		}

		const newPost = await createPost({
			author: req.user.id,
			mediaUrl: `/uploads/${file.filename}`,
			mediaType,
			description,
			location,
			tags: Array.isArray(tags) ? tags : JSON.parse(tags),
		});

		res.status(201).json(newPost);
	} catch (err: unknown) {
		console.error(err);
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const getFeedHandler = async (req: Request, res: Response) => {
	try {
		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 10);
		const feed = await getFeed(page, limit);
		res.json(feed);
	} catch (err: unknown) {
		console.error('getFeed error', err);
		res.status(500).json({ message: 'Error obteniendo feed' });
	}
};

export const getUserPostsHandler = async (req: Request, res: Response) => {
	try {
		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 15);
		const posts = await getUserPosts(req.params.userId, page, limit);
		res.json(posts);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const likePostHandler = async (req: ReqWithUser, res: Response) => {
	try {
		const likes = await toggleLike(req.params.postId, req.user.id);
		res.json({ likes });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const commentPostHandler = async (req: ReqWithUser, res: Response) => {
	try {
		const { content } = req.body;
		if (!content) {
			return res.status(400).json({ message: 'Content required' });
		}
		const comment = await addComment(
			req.params.postId,
			req.user.id,
			content
		);
		res.status(201).json(comment);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const getPostHandler = async (req: Request, res: Response) => {
	try {
		const post = await getPostById(req.params.postId);
		if (!post) {
			return res.status(404).json({ message: 'Post no encontrado' });
		}
		res.json(post);
	} catch (err: unknown) {
		console.error('getPost error', err);
		res.status(500).json({ message: 'Error interno al obtener post' });
	}
};

export const getFollowingFeedHandler = async (
	req: ReqWithUser,
	res: Response
) => {
	try {
		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 10);
		const feed = await getFollowingFeed(req.user.id, page, limit);
		res.json(feed);
	} catch (err: unknown) {
		console.error('getFollowingFeed error', err);
		if (err instanceof Error && err.message === 'Usuario no encontrado') {
			return res.status(404).json({ message: err.message });
		}
		res.status(500).json({ message: 'Error en feed de seguidos' });
	}
};

export const updatePostHandler = async (req: ReqWithUser, res: Response) => {
	try {
		const post = await updatePost(
			req.params.postId,
			req.user.id,
			req.body.description ?? ''
		);
		res.json(post);
	} catch (err: unknown) {
		if (err instanceof Error) {
			if (err.message === 'Post no encontrado') {
				return res.status(404).json({ message: err.message });
			}
			if (err.message === 'No autorizado') {
				return res.status(403).json({ message: err.message });
			}
		}
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const deletePostHandler = async (req: ReqWithUser, res: Response) => {
	try {
		const result = await deletePost(req.params.postId, req.user.id);
		res.json(result);
	} catch (err: unknown) {
		if (err instanceof Error) {
			if (err.message === 'Post no encontrado') {
				return res.status(404).json({ message: err.message });
			}
			if (err.message === 'No autorizado') {
				return res.status(403).json({ message: err.message });
			}
		}
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const getUserProfileHandler = async (req: ReqWithUser, res: Response) => {
	try {
		const { userId } = req.params;
		const viewerId = req.user.id;
		const user = await User.findById(userId).select(
			'userName email following'
		);
		if (!user) {
			return res.status(404).json({ message: 'Usuario no encontrado' });
		}

		const posts = await getUserPosts(userId, 1, 50);
		const following = user.following.map(String).includes(viewerId);

		res.json({ user, posts, following });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};

export const deleteCommentHandler = async (req: ReqWithUser, res: Response) => {
	try {
		await removeComment(
			req.params.postId,
			req.params.commentId,
			req.user.id
		);
		res.json({ ok: true });
	} catch (err: unknown) {
		if (err instanceof Error) {
			if (err.message === 'Comentari no trobat') {
				return res.status(404).json({ message: err.message });
			}
			if (err.message === 'No autoritzat') {
				return res.status(403).json({ message: err.message });
			}
		}
		const message = err instanceof Error ? err.message : 'Error interno';
		res.status(500).json({ message });
	}
};
