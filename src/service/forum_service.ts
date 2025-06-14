import Forum, { IForum } from '../models/forum_models.js';

export const createEntry = async (forumData: IForum) => {
	const user = new Forum(forumData);
	return await user.save();
};

// Get all forums with pagination
export const getAllForum = async (page: number, limit: number) => {
	const skip = (page - 1) * limit;
	return await Forum.find().skip(skip).limit(limit);
};

export const getEntryById = async (id: string) => {
	return await Forum.findById(id);
};

export const updateEntry = async (id: string, updateData: Partial<IForum>) => {
	return await Forum.updateOne({ _id: id }, { $set: updateData });
};

export const deleteEntry = async (id: string) => {
	return await Forum.deleteOne({ _id: id });
};
