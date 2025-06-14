// src/controllers/drone_controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Drone, { IDrone } from '../models/drone_models.js';
import {
	createDrone,
	getDrones,
	getDroneById,
	updateDrone,
	deleteDrone,
	getOwnerByDroneId,
	addFavorite,
	removeFavorite,
	getFavorites,
	getMyDrones,
	markDroneSold,
} from '../service/drone_service.js';
import { getCommentsByDrone } from '../service/comment_service.js';

/* ---------- Tipus auxiliars ---------- */

interface MulterRequest extends Request {
	files?: Express.Multer.File[];
}

interface DroneDoc {
	_id: mongoose.Types.ObjectId;
	model: string;
	createdAt: Date;
	averageRating?: number;
	ratings: Array<{ userId: mongoose.Types.ObjectId; rating: number; comment: string }>;
	toObject(): Record<string, unknown>;
}

interface DroneFilters {
	q?: string;
	category?: string;
	condition?: string;
	location?: string;
	priceMin?: number;
	priceMax?: number;
	name?: string;
	model?: string;
}

type DroneStatus = 'pending' | 'sold';

/* ---------- Handlers ---------- */

const createDroneHandler = async (req: Request, res: Response) => {
	try {
		/** Tipus exactes que espera createDrone */
		type CreateDroneInput = Parameters<typeof createDrone>[0];

		const droneData: CreateDroneInput = { ...(req.body as CreateDroneInput) };

		const files = (req as MulterRequest).files;
		if (files?.length) {
			droneData.images = files.map((f) => `http://localhost:9000/uploads/${f.filename}`);
		}

		const drone = await createDrone(droneData);
		res.status(201).json(drone);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al crear el dron';
		res.status(500).json({ message });
	}
};

const getDronesHandler = async (req: Request, res: Response) => {
	try {
		const page = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 10;
		if (limit > 20) limit = 20;

		const filters: DroneFilters = {
			q: req.query.q as string | undefined,
			category: req.query.category as string | undefined,
			condition: req.query.condition as string | undefined,
			location: req.query.location as string | undefined,
			priceMin: req.query.minPrice ? Number(req.query.minPrice) : undefined,
			priceMax: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
			name: req.query.name as string | undefined,
			model: req.query.model as string | undefined,
		};

		const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
		let drones = await getDrones(page, limit, filters);

		if (filters.name) {
			const needle = filters.name.toLowerCase();
			drones = drones.filter((d: DroneDoc) => d.model.toLowerCase().includes(needle));
		}
		if (filters.model) {
			const needle = filters.model.toLowerCase();
			drones = drones.filter((d: DroneDoc) => d.model.toLowerCase().includes(needle));
		}
		if (minRating !== undefined) {
			drones = drones.filter((d: DroneDoc) => (d.averageRating ?? 0) >= minRating);
		}

		drones.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		const result = drones.map((d: DroneDoc) => ({
			...d.toObject(),
			averageRating: d.averageRating,
		}));

		res.status(200).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al obtener drones';
		res.status(500).json({ message });
	}
};

/* --- Favoritos --- */

const addFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await addFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al agregar favorito';
		res.status(500).json({ message });
	}
};

const removeFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await removeFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al eliminar favorito';
		res.status(500).json({ message });
	}
};

const getFavoritesHandler = async (req: Request, res: Response) => {
	try {
		const page = Number(req.query.page) || 1;
		const limit = Number(req.query.limit) || 10;
		const favs = await getFavorites(req.params.userId, page, limit);
		res.status(200).json(favs);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al obtener favoritos';
		res.status(500).json({ message });
	}
};

/* --- Lectura d’un dron --- */

const getDroneByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const drone = mongoose.Types.ObjectId.isValid(id) ? await getDroneById(id) : null;

		if (!drone) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}

		const comments = await getCommentsByDrone(drone._id.toString());
		res.status(200).json({ ...drone.toObject(), comments });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al obtener el dron';
		res.status(500).json({ message });
	}
};

const getOwnerByDroneIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const user = mongoose.Types.ObjectId.isValid(id) ? await getOwnerByDroneId(id) : null;

		if (!user) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}

		res.status(200).json(user);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al obtener el dron';
		res.status(500).json({ message });
	}
};

/* --- Actualització --- */

const updateDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone = mongoose.Types.ObjectId.isValid(id) ? await getDroneById(id) : await Drone.findOne({ id });

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		const files = (req as MulterRequest).files;
		if (files?.length) {
			(req.body as Partial<IDrone>).images = files.map((f) => `/uploads/${f.filename}`);
		}

		const updated = await updateDrone(drone._id.toString(), req.body as Partial<IDrone>);
		res.status(200).json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al actualizar el dron';
		res.status(500).json({ message });
	}
};

/* --- Eliminació --- */

const deleteDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone = mongoose.Types.ObjectId.isValid(id) ? await getDroneById(id) : await Drone.findOne({ id });

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		await deleteDrone(drone._id.toString());
		res.status(200).json({ message: 'Dron eliminado exitosamente' });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al eliminar el dron';
		res.status(500).json({ message });
	}
};

/* --- Llistats addicionals --- */

const getDronesByCategoryHandler = async (req: Request, res: Response) => {
	try {
		const { category } = req.params;
		if (!category) {
			return res.status(400).json({ message: 'Debe proporcionar una categoría válida' });
		}

		const drones = await Drone.find({ category });
		if (!drones.length) {
			return res.status(404).json({ message: 'No hay drones en esta categoría' });
		}
		res.status(200).json(drones);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al obtener drones por categoría';
		res.status(500).json({ message });
	}
};

const getDronesByPriceRangeHandler = async (req: Request, res: Response) => {
	try {
		const min = Number(req.query.min);
		const max = Number(req.query.max);
		if (Number.isNaN(min) || Number.isNaN(max)) {
			return res.status(400).json({ message: 'min y max deben ser números' });
		}

		const drones = await Drone.find({ price: { $gte: min, $lte: max } });
		res.status(200).json(drones);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: 'Error al obtener drones en el rango de precios';
		res.status(500).json({ message });
	}
};

/* --- Ressenyes --- */

const addDroneReviewHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { userId, rating, comment } = req.body as {
			userId: string;
			rating: number;
			comment: string;
		};

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: 'userId no es válido' });
		}
		if (rating < 1 || rating > 5) {
			return res.status(400).json({ message: 'El rating debe estar entre 1 y 5' });
		}

		let drone = mongoose.Types.ObjectId.isValid(id) ? await getDroneById(id) : await Drone.findOne({ id });
		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		drone.ratings.push({
			userId: new mongoose.Types.ObjectId(userId),
			rating,
			comment,
		});
		await drone.save();

		res.status(200).json({ message: 'Reseña agregada exitosamente', drone });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al agregar reseña';
		res.status(500).json({ message });
	}
};

/* --- Els meus drones --- */

const getMyDronesHandler = async (req: Request, res: Response) => {
	try {
		const statusParam = req.query.status as DroneStatus | undefined;
		const list = await getMyDrones(req.params.userId, statusParam);
		res.status(200).json(list);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al obtener mis drones';
		res.status(500).json({ message });
	}
};

/* --- Compra --- */

const purchaseDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const updated = await markDroneSold(id);
		res.status(200).json(updated);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Error al comprar dron';
		res.status(500).json({ message });
	}
};

/* ---------- Exportacions ---------- */

export {
	createDroneHandler,
	getDronesHandler,
	getDroneByIdHandler,
	updateDroneHandler,
	deleteDroneHandler,
	getDronesByCategoryHandler,
	getDronesByPriceRangeHandler,
	addDroneReviewHandler,
	addFavoriteHandler,
	removeFavoriteHandler,
	getFavoritesHandler,
	getMyDronesHandler,
	purchaseDroneHandler,
	getOwnerByDroneIdHandler,
};