
import Forum from '../models/forum_models.js';
import { createEntry, deleteEntry, getEntryById, updateEntry } from '../service/forum_service.js';
import { Request, Response } from 'express';

export const createEntryHandler = async (req: Request, res: Response) => {
	try {
		const { _id, ...data } = req.body; 
		const entry = await createEntry(data);
		res.status(201).json(entry);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};

export const getAllForumHandler = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;

		const skip = (page - 1) * limit;

		// Filtrar los que NO estén eliminados
		const query = { isDeleted: { $ne: true } };

		const forums = await Forum.find(query).skip(skip).limit(limit);
		const total = await Forum.countDocuments(query);
		const pages = Math.ceil(total / limit);

		res.status(200).json({ forums, pages });
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ message });
	}
};

export const getEntryByIdHandler = async (req: Request, res: Response) => {
	try {
		const data = await getEntryById(req.params.id);
		res.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};
export const updateEntryHandler = async (req: Request, res: Response) => {
	try {
		const data = await updateEntry(req.params.id, req.body);
		res.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};
export const deleteEntryHandler = async (req: Request, res: Response) => {
	try {
		const data = await deleteEntry(req.params.id);
		res.json(data);
	} catch (error: unknown) {
		if (error instanceof Error) {
			res.status(500).json({ message: error.message });
		} else {
			res.status(500).json({ message: String(error) });
		}
	}
};
