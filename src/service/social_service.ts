import { Post, IPost } from '../models/post_model.js';
import mongoose from 'mongoose';

/* ───────── Crear post ───────── */
interface CreatePostDTO {
  author: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  description?: string;
  location?: string;
  tags?: string[];
}

export const createPost = async (data: CreatePostDTO) => {
  const payload: Partial<IPost> = {
    author:     new mongoose.Types.ObjectId(data.author),
    mediaUrl:   data.mediaUrl,
    mediaType:  data.mediaType,
    description:data.description,
    location:   data.location,
    tags:       (data.tags ?? []).map(id => new mongoose.Types.ObjectId(id)),
  };
  return await Post.create(payload);
};

/* ───────── Feed público ───────── */
export const getFeed = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return await Post.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'userName email')
    .populate('tags',    'userName');
};

/* ───────── Posts por usuario ───────── */
export const getPostsByUser = async (userId: string, page = 1, limit = 15) => {
  const skip = (page - 1) * limit;
  return await Post.find({ author: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'userName');
};

/* ───────── Like / Unlike ───────── */
export const toggleLike = async (postId: string, userId: string) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error('Post not found');

  const uid = new mongoose.Types.ObjectId(userId);
  const idx = post.likes.findIndex(l => l.equals(uid));
  idx >= 0 ? post.likes.splice(idx, 1) : post.likes.push(uid);
  await post.save();
  return post.likes.length;
};

/* ───────── Añadir comentario ───────── */
export const addComment = async (postId: string, userId: string, content: string) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error('Post not found');

  post.comments.push({
    author:  new mongoose.Types.ObjectId(userId),
    content,
  } as any);          // cast para saltar timestamps en TS

  await post.save();
  return post.comments.at(-1);
};

export const getPostById = async (
  postId: string
): Promise<(IPost & mongoose.Document) | null> => {
  // Busca el post, popula author y comentarios.author
  return await Post.findById(postId)
    .populate('author', 'userName')
    .populate('comments.author', 'userName')
    .exec();
};
