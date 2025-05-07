//src/models/forum_models.ts
import mongoose from 'mongoose';

const forumSchema = new mongoose.Schema({
    name: {type: String,required: true},
    comment: { type: String, required: true}
});

export interface IForum {
    name: string;
    comment: string;
}

const Forum = mongoose.model('Forum', forumSchema);
export default Forum;
