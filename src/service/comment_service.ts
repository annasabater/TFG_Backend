import Comment, { IComment } from '../models/comment_models.js';
import User from '../models/user_models.js';

export const addComment = async (data: IComment) => {
  const comment = new Comment(data);
  await comment.save();
  return comment;
};

export const getCommentsByDrone = async (droneId: string) => {
  // Obtener comentarios raíz y sus respuestas anidadas
  const comments = await Comment.find({ droneId, parentCommentId: null })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  for (const comment of comments) {
    (comment as any).replies = await Comment.find({ parentCommentId: comment._id })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 })
      .lean();
  }
  return comments;
};
