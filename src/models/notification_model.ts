// src/models/notification_model.ts

import mongoose from 'mongoose';

export interface INotification {
  to:        mongoose.Types.ObjectId;
  from:      mongoose.Types.ObjectId;
  type:      'like' | 'comment' | 'follow' | 'new_post';   
  post?:     mongoose.Types.ObjectId;
  read:      boolean;
  createdAt: Date;
}

const schema = new mongoose.Schema<INotification>({
	to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: { type: String, enum: ['like','comment','follow','new_post'], required: true },
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
	read: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', schema);
