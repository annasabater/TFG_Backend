// src/service/social_service.ts

import { Post, IPost }      from '../models/post_model.js';
import mongoose             from 'mongoose';
import User                 from '../models/user_models.js';
import { pushNotification } from './notification_service.js';


interface CreatePostDTO {
  author:      string;
  mediaUrl:    string;
  mediaType:   'image' | 'video';
  description?:string;
  location?:   string;
  tags?:       string[];
}

/* -------- Crear post -------- */
const createPost = async (data: CreatePostDTO) => {
	const payload: Partial<IPost> = {
		author     : new mongoose.Types.ObjectId(data.author),
		mediaUrl   : data.mediaUrl,
		mediaType  : data.mediaType,
		description: data.description,
		location   : data.location,
		tags       : (data.tags ?? []).map(id => new mongoose.Types.ObjectId(id)),
	};

	const newPost = await Post.create(payload) as IPost & mongoose.Document;

	// Notificar seguidors 
	const author    = await User.findById(data.author).select('following');
	const followers = author?.following.map(id => id.toString()) ?? [];

	await Promise.all(
		followers.map(fid =>
			pushNotification({
				to  : fid,
				from: data.author,
				type: 'new_post',
				post: newPost._id.toString(),
			})
		)
	);

	return newPost;
};

/* -------- Feed públic -------- */
const getFeed = async (page = 1, limit = 10) => {
	const skip = (page - 1) * limit;

	return Post.find()
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.populate('author', 'userName email')
		.populate('tags', 'userName');
};

/* -------- Feed de seguits -------- */
const getFollowingFeed = async (userId: string, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const user = await User.findById(userId).select('following');
	if (!user) throw new Error('Usuario no encontrado');

	const followed = [...user.following, user._id];

	return Post.find({ author: { $in: followed } })
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.populate('author', 'userName email')
		.populate('tags', 'userName');
};

/* -------- Posts d’un usuari -------- */
const getUserPosts = async (userId: string, page = 1, limit = 15) => {
	const skip = (page - 1) * limit;

	return Post.find({ author: new mongoose.Types.ObjectId(userId) })
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit)
		.populate('author', 'userName');
};

/* -------- Like / Unlike -------- */
const toggleLike = async (postId: string, userId: string) => {
	const post = await Post.findById(postId);
	if (!post) throw new Error('Post not found');

	const uid = new mongoose.Types.ObjectId(userId);
	const idx = post.likes.findIndex(l => l.equals(uid));

	if (idx < 0) {
		post.likes.push(uid);
		await post.save();
		await pushNotification({
			to  : post.author.toString(),
			from: userId,
			type: 'like',
			post: postId,
		});
	} else {
		post.likes.splice(idx, 1);
		await post.save();
	}

	return post.likes.length;
};

/* -------- Comentari -------- */
const addComment = async (postId: string, userId: string, content: string) => {
	const post = await Post.findById(postId);
	if (!post) throw new Error('Post not found');

	post.comments.push({ author: new mongoose.Types.ObjectId(userId), content } as any);
	await post.save();

	await pushNotification({
		to  : post.author.toString(),
		from: userId,
		type: 'comment',
		post: postId,
	});

	return post.comments.at(-1);
};

/* -------- Obtenir post per ID -------- */
const getPostById = async (postId: string) => {
	return Post.findById(postId)
		.populate('author', 'userName')
		.populate('comments.author', 'userName')
		.exec();
};

/* -------- Editar post -------- */
const updatePost = async (postId: string, userId: string, description: string) => {
	const post = await Post.findById(postId);
	if (!post) throw new Error('Post no encontrado');
	if (!post.author.equals(userId)) throw new Error('No autorizado');

	post.description = description;
	await post.save();
	return post;
};

/* -------- Eliminar post -------- */
const deletePost = async (postId: string, userId: string) => {
	const post = await Post.findById(postId);
	if (!post) throw new Error('Post no encontrado');
	if (!post.author.equals(userId)) throw new Error('No autorizado');

	await post.deleteOne();
	return { message: 'Post eliminado' };
};

/* -------- Eliminar comentari -------- */
const removeComment = async (
	postId   : string,
	commentId: string,
	userId   : string
) => {

	if (!mongoose.isValidObjectId(commentId))
	{throw new Error('ID de comentari invàlida');}

	const res = await Post.updateOne(
		{
			_id               : postId,
			'comments._id'    : commentId,
			'comments.author' : userId       
		},
		{ $pull: { comments: { _id: commentId } } }
	);

	if (res.modifiedCount === 0)
	{throw new Error('Comentari no trobat o no autoritzat');}
};

export {
	createPost,
	getFeed,
	getFollowingFeed,
	getUserPosts,
	toggleLike,
	addComment,
	getPostById,
	updatePost,
	deletePost,
	removeComment
};