import Comment, { IComment } from '../models/comment_models.js';

interface PopulatedUser {
	name: string;
	email: string;
}

type CommentLean = Omit<IComment, 'userId'> & {
  userId: PopulatedUser;
};

// 2) Ahora definimos el tipo final con replies anidados
export interface ICommentWithReplies extends CommentLean {
  replies: ICommentWithReplies[];
}


export const getCommentsByDrone = async (
	droneId: string
): Promise<ICommentWithReplies[]> => {
	// Comentarios raíz, con userId poblado
	const roots = await Comment.find({ droneId, parentCommentId: null })
		.populate('userId', 'name email')
		.sort({ createdAt: -1 })
		.lean<unknown>(); // usamos unknown para luego castear de forma segura

	// Construimos el nuevo array añadiendo `replies`
	const commentsWithReplies: ICommentWithReplies[] = await Promise.all(
		(roots as any[]).map(async (root) => {
			const replies = await Comment.find({ parentCommentId: root._id })
				.populate('userId', 'name email')
				.sort({ createdAt: 1 })
				.lean<unknown>();

			return {
				// root originalmente tenía userId como objeto { name, email }
				...(root as Omit<ICommentWithReplies, 'replies'>),
				replies: replies as PopulatedUser[] & ICommentWithReplies[],
			};
		})
	);

	return commentsWithReplies;
};
