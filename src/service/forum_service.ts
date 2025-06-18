import Forum, { IForum } from '../models/forum_models.js';

export const createEntry = async (forumData: IForum) => {
	const user = new Forum(forumData);
	return await user.save();
};

// Get all forums with pagination
export const getAllForum = async (page: number, limit: number) => {
	const skip = (page - 1) * limit;
	const total = await Forum.countDocuments({ isDeleted: false });
	const forums = await Forum.find({ isDeleted: false }).skip(skip).limit(limit).lean();
	const pages = Math.ceil(total / limit);
	return { forums, pages };
};


export const getEntryById = async (id: string) => {
	return await Forum.findById(id);
};

export const updateEntry = async (id: string, updateData: Partial<IForum>) => {
	return await Forum.findOneAndUpdate(
		{ _id: id, isDeleted: false },
		{ $set: updateData },
		{ new: true }
	).lean();
};


export const deleteEntry = async (id: string) => {
	return await Forum.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
};
