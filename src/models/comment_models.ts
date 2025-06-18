import mongoose from 'mongoose';

export interface IComment {
  droneId: string;
  userId: string;
  text: string;
  rating?: number;
  parentCommentId?: string;
  createdAt?: Date;
  idDeleted?:boolean;
}

const commentSchema = new mongoose.Schema({
	droneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Drone', required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	text: { type: String, required: true },
	rating: { type: Number, min: 1, max: 5 },
	parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
	createdAt: { type: Date, default: Date.now },
	isDeleted: {type: Boolean, default: false}
});

// Validación: solo comentarios raíz pueden tener rating
commentSchema.pre('save', function (next) {
	if (this.parentCommentId && this.rating) {
		return next(new Error('Solo los comentarios raíz pueden tener rating.'));
	}
	next();
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
