import { Request, Response } from 'express';
import {
  createPost,
  getFeed,
  getPostsByUser,
  toggleLike,
  addComment,
  getPostById, 
  getFollowingFeed,
} from '../service/social_service.js';
import type { Multer } from 'multer'; 

/* Crear post */
export const createPostHandler = async (req: Request, res: Response) => {
  try {
    const file = (req as Request & { file: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ message: 'Imagen requerida' });

    const { mediaType, description, location, tags = '[]' } = req.body;
    if (!['image', 'video'].includes(mediaType))
      return res.status(422).json({ message: 'mediaType inválido' });

    const newPost = await createPost({
      author : (req as any).userId,
      mediaUrl   : `/uploads/${file.filename}`,
      mediaType,
      description,
      location,
      tags       : Array.isArray(tags) ? tags : JSON.parse(tags),
    });

    res.status(201).json(newPost);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
};

/* Feed público */
export const getFeedHandler = async (req: Request, res: Response) => {
  try {
    const page  = Number(req.query.page  ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const feed  = await getFeed(page, limit);
    res.json(feed);
  } catch (err) {
    console.error('getFeed error', err);
    res.status(500).json({ message: 'Error obteniendo feed' });
  }
};

/* Posts de un usuario */
export const getUserPostsHandler = async (req: Request, res: Response) => {
  try {
    const page  = Number(req.query.page  ?? 1);
    const limit = Number(req.query.limit ?? 15);
    res.json(await getPostsByUser(req.params.userId, page, limit));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* Like / Unlike */
export const likePostHandler = async (req: Request, res: Response) => {
  try {
    const likes = await toggleLike(req.params.postId, (req as any).userId);
    res.json({ likes });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* Comentar */
export const commentPostHandler = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required' });
    const c = await addComment(req.params.postId, (req as any).userId, content);
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostHandler = async (req: Request, res: Response) => {
  try {
    const post = await getPostById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' });
    }
    res.json(post);
  } catch (err) {
    console.error('getPost error', err);
    res.status(500).json({ message: 'Error interno al obtener post' });
  }
};

export const getFollowingFeedHandler = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const userId = (req as any).userId;

    const feed = await getFollowingFeed(userId, page, limit);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ message: 'Error en feed de seguidos' });
  }
};

