import { Request, Response } from 'express';
import {
  createPost,
  getFeed,
  getPostsByUser,
  toggleLike,
  addComment,
} from '../service/social_service.js';

/* Crear post */
export const createPostHandler = async (req: Request, res: Response) => {
  try {
    const { mediaUrl, mediaType, description, location, tags } = req.body;
    const newPost = await createPost({
      author: (req as any).userId,
      mediaUrl,
      mediaType,
      description,
      location,
      tags,
    });
    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* Feed público */
export const getFeedHandler = async (req: Request, res: Response) => {
  try {
    const page  = Number(req.query.page  ?? 1);
    const limit = Number(req.query.limit ?? 10);
    res.json(await getFeed(page, limit));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
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
