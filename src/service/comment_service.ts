import Comment, { IComment } from '../models/comment_models.js';
import mongoose from 'mongoose';

interface PopulatedUser {
	name: string;
	email: string;
}

type CommentLean = Omit<IComment, 'userId'> & {
	_id: mongoose.Types.ObjectId;
	userId: PopulatedUser;
};

export interface ICommentWithReplies extends CommentLean {
	replies: ICommentWithReplies[];
}
export const addComment = async (data: IComment) => {
	const comment = new Comment(data);
	await comment.save();
	return comment;
};

export const getCommentsByDrone = async (
	droneId: string
): Promise<ICommentWithReplies[]> => {

	const roots = (await Comment.find({ droneId, parentCommentId: null })
		.populate('userId', 'name email')
		.sort({ createdAt: -1 })
		.lean<CommentLean>()) as unknown as CommentLean[];

	async function attachReplies(
		node: CommentLean
	): Promise<ICommentWithReplies> {
		const children = (await Comment.find({ parentCommentId: node._id })
			.populate('userId', 'name email')
			.sort({ createdAt: 1 })
			.lean<CommentLean>()) as unknown as CommentLean[];

		const replies = await Promise.all(children.map(attachReplies));
		return { ...node, replies };
	}
	return Promise.all(roots.map(attachReplies));
};

export const updateComment = async (id: string, data: Partial<IComment>) => {
	return Comment.findByIdAndUpdate(id, data, { new: true }).lean();
};

export const softDeleteComment = async (id: string) => {
	return Comment.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
};
