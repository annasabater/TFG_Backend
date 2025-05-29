import mongoose, { Document, Schema, Types } from 'mongoose';

const commentSchema = new Schema(
  {
    author : { type: Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

export interface IComment extends Document {
  _id:       Types.ObjectId;
  author:    Types.ObjectId;
  content:   string;
  createdAt: Date;
  updatedAt: Date;
}

export const Comment =
  (mongoose.models.Comment as mongoose.Model<IComment>) ||
  mongoose.model<IComment>('Comment', commentSchema);

const postSchema = new Schema(
  {
    author     : { type: Types.ObjectId, ref: 'User', required: true },
    mediaUrl   : { type: String, required: true },
    mediaType  : { type: String, enum: ['image', 'video'], required: true },
    description: { type: String, maxlength: 2200 },
    location   : { type: String, maxlength: 200 },
    tags       : [{ type: Types.ObjectId, ref: 'User' }],
    likes      : [{ type: Types.ObjectId, ref: 'User' }],
    comments   : [commentSchema],
  },
  {
    timestamps: true,
    toJSON   : { virtuals: true },
    toObject : { virtuals: true },
  }
);

postSchema.virtual('id').get(function (this: IPost) {
  return this._id.toString();
});

export interface IPost extends Document {
  _id:         Types.ObjectId;
  id:          string;            
  author:      Types.ObjectId;
  mediaUrl:    string;
  mediaType:  'image' | 'video';
  description?: string;
  location?:   string;
  tags:        Types.ObjectId[];
  likes:       Types.ObjectId[];
  comments:    IComment[];
  createdAt:   Date;
  updatedAt:   Date;
}


export const Post =
  (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>('Post', postSchema);
