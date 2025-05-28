import { Request, Response } from 'express';
import {
  createPost,
  getFeed,
  getPostsByUser,
  getFollowingFeed,
  toggleLike,
  addComment,
  getPostById,
  updatePost,
  deletePost
} from '../service/social_service.js';
import User from '../models/user_models.js';

export const createPostHandler = async (req: Request, res: Response) => {
  try {
    const file = (req as Request & { file: Express.Multer.File }).file;
    if (!file) return res.status(400).json({ message: 'Imagen requerida' });

    const { mediaType, description, location, tags = '[]' } = req.body;
    if (!['image', 'video'].includes(mediaType))
      return res.status(422).json({ message: 'mediaType inválido' });

    const newPost = await createPost({
      author: (req as any).user.id as string,
      mediaUrl: `/uploads/${file.filename}`,
      mediaType,
      description,
      location,
      tags: Array.isArray(tags) ? tags : JSON.parse(tags),
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
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const feed = await getFeed(page, limit);
    res.json(feed);
  } catch (err) {
    console.error('getFeed error', err);
    res.status(500).json({ message: 'Error obteniendo feed' });
  }
};

/* Posts de un usuario */
export const getUserPostsHandler = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    res.json(await getPostsByUser(req.params.userId, page, limit));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* Like / Unlike */
export const likePostHandler = async (req: Request, res: Response) => {
  try {
    const likes = await toggleLike(
      req.params.postId,
      (req as any).user.id as string
    );
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
    const c = await addComment(
      req.params.postId,
      (req as any).user.id as string,
      content
    );
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

/* Obtener post */
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

/* Feed de seguidos */
export const getFollowingFeedHandler = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const userId = (req as any).user.id as string;

    const feed = await getFollowingFeed(userId, page, limit);
    res.json(feed);
  } catch (err: any) {
    console.error('getFollowingFeed error', err);
    if (err.message === 'Usuario no encontrado') {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error en feed de seguidos' });
  }
};

/* Editar post */
export const updatePostHandler = async (req: Request, res: Response) => {
  try {
    const post = await updatePost(
      req.params.postId,
      (req as any).user.id as string,
      req.body.description ?? ''
    );
    return res.json(post);
  } catch (err: any) {
    if (err.message === 'Post no encontrado')
      return res.status(404).json({ message: err.message });
    if (err.message === 'No autorizado')
      return res.status(403).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

/* Borrar post */
export const deletePostHandler = async (req: Request, res: Response) => {
  try {
    const out = await deletePost(
      req.params.postId,
      (req as any).user.id as string
    );
    res.json(out);
  } catch (err: any) {
    if (err.message === 'Post no encontrado')
      return res.status(404).json({ message: err.message });
    if (err.message === 'No autorizado')
      return res.status(403).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

/* Perfil de usuario ajeno */
export const getUserProfileHandler = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const viewerId = (req as any).user.id as string;
    const user = await User.findById(userId).select(
      'userName email following'
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const posts = await getPostsByUser(userId, 1, 50);
    const following = viewerId
      ? user.following.map(String).includes(viewerId)
      : false;

    res.json({ user, posts, following });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
