//src/models/post_model.ts

import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

export interface IComment extends mongoose.Document {
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new mongoose.Schema(
  {
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl:   { type: String, required: true },
    mediaType:  { type: String, enum: ['image', 'video'], required: true },
    description:{ type: String, maxlength: 2200 },
    location:   { type: String, maxlength: 200 },
    tags:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments:   [commentSchema],
  },
  { timestamps: true }
);

export interface IPost extends mongoose.Document {
  author:      mongoose.Types.ObjectId;
  mediaUrl:    string;
  mediaType:   'image' | 'video';
  description?:string;
  location?:   string;
  tags:        mongoose.Types.ObjectId[];
  likes:       mongoose.Types.ObjectId[];
  comments:    IComment[];
  createdAt:   Date;
  updatedAt:   Date;
}

export const Post = mongoose.model<IPost>('Post', postSchema);

