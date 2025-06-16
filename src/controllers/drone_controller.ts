import { Request, Response } from 'express';
import Drone from '../models/drone_models.js';
import { getMyDrones } from '../service/drone_service.js';
import mongoose from 'mongoose';
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
	purchaseDroneWithBalance,
	getDroneWithConvertedPrice,
	purchaseMultipleDrones,
	getUserPurchaseHistory,
	getUserSalesHistory
} from '../service/drone_service.js';
import { getCommentsByDrone } from '../service/comment_service.js';

// Tipos auxiliares
interface UploadedFile {
	filename: string;
}
interface CommentDoc {
	rating?: number;
	parentCommentId?: string | null;
	[key: string]: unknown;
}

export const createDroneHandler = async (req: Request, res: Response) => {
	try {
		const {
			_id,
			status,
			createdAt,
			ratings,
			isSold,
			isService,
			...droneData
		} = req.body;

		// Validar y forzar stock
		let stock = 1;
		if (typeof droneData.stock !== 'undefined') {
			stock = parseInt(droneData.stock);
			if (isNaN(stock) || stock < 0) stock = 1;
		}
		droneData.stock = stock;

		// Manejar imágenes subidas
		let images: string[] = [];
		if ((req as unknown as { files?: UploadedFile[] }).files && Array.isArray((req as unknown as { files?: UploadedFile[] }).files)) {
			images = ((req as unknown as { files: UploadedFile[] }).files).map((file: UploadedFile) => 'https://ea2-api.upc.edu/uploads/' + file.filename);
		}
		if (images.length > 0) {
			droneData.images = images;
		}

		const drone = await createDrone(droneData);
		res.status(201).json(drone);
	} catch (error: unknown) {
		console.error('ERROR createDrone:', error);
		res.status(500).json({ message: (error as Error).message || 'Error al crear el dron' });
	}
};

  

// Get all drones with pagination
export const getDronesHandler = async (req: Request, res: Response) => {
	try {
		const page  = parseInt(req.query.page as string) || 1;
		let limit = parseInt(req.query.limit as string) || 10;
		if (limit > 20) limit = 20;

		const filters: Record<string, unknown> = {
			q: req.query.q,
			category: req.query.category,
			condition: req.query.condition,
			location: req.query.location,
			name: req.query.name,
			model: req.query.model
		};
		// El filtro minRating se aplica después de la consulta
		const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
		const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
		const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

		// Traer los drones solo con los filtros que no dependen del precio
		let drones = await getDrones(undefined, undefined, filters);
		// Filtrar por name y model (búsqueda parcial, case-insensitive)
		if (filters.name) {
			drones = drones.filter((d: { model?: string }) => typeof d.model === 'string' && d.model.toLowerCase().includes((filters.name as string).toLowerCase()));
		}
		if (filters.model) {
			drones = drones.filter((d: { model?: string }) => typeof d.model === 'string' && d.model.toLowerCase().includes((filters.model as string).toLowerCase()));
		}

		// Calcular averageRating de comentarios raíz para cada dron
		const dronesWithRatings = await Promise.all(
			drones.map(async (d: { _id: mongoose.Types.ObjectId; toObject: () => Record<string, unknown> }) => {
				const comments = await getCommentsByDrone(d._id.toString());
				const rootRatings = (comments as unknown as CommentDoc[])
					.filter((c: CommentDoc) => typeof c.rating === 'number' && (!c.parentCommentId || c.parentCommentId === null))
					.map((c: CommentDoc) => c.rating as number);
				let averageRating: number | null = null;
				if (rootRatings.length > 0) {
					averageRating = rootRatings.reduce((a: number, b: number) => a + b, 0) / rootRatings.length;
					averageRating = Math.round(averageRating * 10) / 10;
				}
				return { ...d.toObject(), averageRating };
			})
		);

		// --- NUEVO: conversión de divisa antes de filtrar por precio ---
		const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'];
		const targetCurrency = req.query.currency as string;
		if (!targetCurrency || !allowedCurrencies.includes(targetCurrency)) {
			return res.status(400).json({ message: 'currency es requerido y debe ser una de: ' + allowedCurrencies.join(', ') });
		}
		// Convertir precios
		const convertedDrones = await Promise.all(
			dronesWithRatings.map(async (d: Record<string, unknown>) => {
				let price = d.price as number;
				let currency = d.currency as string;
				if (d.currency !== targetCurrency) {
					const { getExchangeRate } = await import('../utils/exchangeRates.js');
					const rate = await getExchangeRate(currency, targetCurrency);
					price = Math.round((price * rate) * 100) / 100;
					currency = targetCurrency;
				}
				return {
					...d,
					price,
					currency
				};
			})
		);

		// Filtrar por minPrice y maxPrice usando el precio convertido
		let filteredDrones = convertedDrones;
		if (minPrice !== undefined) {
			filteredDrones = filteredDrones.filter((d: Record<string, unknown>) => Number(d.price) >= minPrice);
		}
		if (maxPrice !== undefined) {
			filteredDrones = filteredDrones.filter((d: Record<string, unknown>) => Number(d.price) <= maxPrice);
		}

		// Filtrar por minRating usando el nuevo averageRating
		if (minRating) {
			filteredDrones = filteredDrones.filter((d: Record<string, unknown>) => (d.averageRating as number || 0) >= minRating);
		}
		// Ordenar por fecha de creación descendente
		filteredDrones = filteredDrones.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());

		// Aplicar paginación después de todos los filtros
		const start = (page - 1) * limit;
		const end = start + limit;
		const paginatedDrones = filteredDrones.slice(start, end);

		res.status(200).json(paginatedDrones);
	} catch (error: unknown) {
		res.status(500).json({ message: (error as Error).message || 'Error al obtener los drones' });
	}
};
  
/* --- Favorits --- */
export const addFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await addFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (e: unknown) {
		res.status(500).json({ message: (e as Error).message });
	}
};
  
export const removeFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await removeFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (e: unknown) {
		res.status(500).json({ message: (e as Error).message });
	}
};
  
export const getFavoritesHandler = async (req: Request, res: Response) => {
	try {
		const page  = parseInt(req.query.page  as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const favs  = await getFavorites(req.params.userId, page, limit);
		res.status(200).json(favs);
	} catch (e: unknown) {
		res.status(500).json({ message: (e as Error).message });
	}
};
  

// Obtener un dron por ID
export const getDroneByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone: mongoose.Document | null = null;

		if (mongoose.Types.ObjectId.isValid(id)) {
			drone = await getDroneById(id);
		}

		if (!drone) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}

		// Obtener comentarios anidados
		const comments = await getCommentsByDrone((drone._id as mongoose.Types.ObjectId).toString());

		res.status(200).json({ ...drone.toObject(), comments });
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : "Error al obtener el dron";
		res.status(500).json({ message: errMsg });
	}
};

export const getOwnerByDroneIdHandler = async (req:Request,res: Response) => {
	try {
		const { id } = req.params;
		let user = null;

		if (mongoose.Types.ObjectId.isValid(id)) {
			user = await getOwnerByDroneId(id);
		}

		if (!user) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}

		res.status(200).json(user);
	} catch (error: unknown) {
		const errMsg = error instanceof Error ? error.message : "Error al obtener el dron";
		res.status(500).json({ message: errMsg });
	}
};


// Actualizar un dron
export const updateDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone: mongoose.Document | null = null;

		if (mongoose.Types.ObjectId.isValid(id)) {
			drone = await getDroneById(id);
		}

		if (!drone) {
			drone = await Drone.findOne({ id });
		}

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		// Manejar imágenes subidas
		let images: string[] = [];
		if ((req as { files?: UploadedFile[] }).files && Array.isArray((req as { files?: UploadedFile[] }).files)) {
			images = ((req as { files: UploadedFile[] }).files).map((file: UploadedFile) => 'https://ea2-api.upc.edu/uploads/' + file.filename);
		}
		const updateData: Record<string, unknown> = { ...req.body };
		if (images.length > 0) {
			updateData.images = images;
		}

		// Validar y forzar stock
		if (typeof updateData.stock !== 'undefined') {
			let stock = parseInt(updateData.stock as string);
			if (isNaN(stock) || stock < 0) stock = 1;
			updateData.stock = stock;
		}

		// Parsear ratings si viene como string
		if (typeof updateData.ratings === 'string') {
			try {
				updateData.ratings = JSON.parse(updateData.ratings as string);
			} catch (err) {
				updateData.ratings = [];
			}
		}

		const updatedDrone = await updateDrone((drone._id as mongoose.Types.ObjectId).toString(), updateData);

		res.status(200).json(updatedDrone);
	} catch (error) {
		res.status(500).json({ message: (error as Error).message || "Error al actualizar el dron" });
	}
};


// Eliminar un dron
export const deleteDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone: mongoose.Document | null = null;

		if (mongoose.Types.ObjectId.isValid(id)) {
			drone = await getDroneById(id);
		}

		if (!drone) {
			drone = await Drone.findOne({ id });
		}

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		await deleteDrone((drone._id as mongoose.Types.ObjectId).toString());

		res.status(200).json({ message: "Dron eliminado exitosamente" });
	} catch (error) {
		res.status(500).json({ message: (error as Error).message || "Error al eliminar el dron" });
	}
};

// Obtener drones por categoría
export const getDronesByCategoryHandler = async (req: Request, res: Response) => {
	try {
		const { category } = req.params;

		if (!category || typeof category !== "string") {
			return res.status(400).json({ message: "Debe proporcionar una categoría válida" });
		}

		const drones = await Drone.find({ category });

		if (drones.length === 0) {
			return res.status(404).json({ message: "No hay drones en esta categoría" });
		}

		res.status(200).json(drones);
	} catch (error) {
		res.status(500).json({ message: (error as Error).message || "Error al obtener drones por categoría" });
	}
};



// Obtener drones en un rango de precios
export const getDronesByPriceRangeHandler = async (req: Request, res: Response) => {
	try {
		const { min, max } = req.query;

		const minPrice = Number(min);
		const maxPrice = Number(max);

		if (isNaN(minPrice) || isNaN(maxPrice)) {
			return res.status(400).json({ message: "Parámetros inválidos, min y max deben ser números" });
		}

		const drones = await Drone.find({ price: { $gte: minPrice, $lte: maxPrice } });

		if (drones.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(drones);
	} catch (error) {
		res.status(500).json({ message: (error as Error).message || "Error al obtener drones en el rango de precios" });
	}
};



// Agregar una reseña a un dron
export const addDroneReviewHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { userId, rating, comment } = req.body;
		let drone: mongoose.Document & { ratings?: Array<{ userId: mongoose.Types.ObjectId; rating: number; comment: string }> } | null = null;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ message: "userId no es válido" });
		}

		if (typeof rating !== "number" || rating < 1 || rating > 5) {
			return res.status(400).json({ message: "El rating debe estar entre 1 y 5" });
		}

		if (mongoose.Types.ObjectId.isValid(id)) {
			drone = await getDroneById(id);
		}

		if (!drone) {
			drone = await Drone.findOne({ id });
		}

		if (!drone) {
			return res.status(404).json({ message: "Dron no encontrado" });
		}

		if (!drone.ratings) drone.ratings = [];
		drone.ratings.push({ userId: new mongoose.Types.ObjectId(userId), rating, comment });
		await drone.save();

		res.status(200).json({ message: "Reseña agregada exitosamente", drone });
	} catch (error) {
		res.status(500).json({ message: (error as Error).message || "Error al agregar reseña" });
	}
};


export const getMyDronesHandler = async (req: Request, res: Response) => {
	try {
		const statusParam = req.query.status as 'pending' | 'sold' | undefined;
		const list = await getMyDrones(req.params.userId, statusParam);
		res.status(200).json(list);
	} catch (e: unknown) {
		res.status(500).json({ message: (e as Error).message });
	}
};

export const purchaseDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { userId, payWithCurrency } = req.body;
		if (!userId || !payWithCurrency) {
			return res.status(400).json({ message: 'userId y payWithCurrency son requeridos' });
		}
		const result = await purchaseDroneWithBalance(id, userId, payWithCurrency);
		res.status(200).json(result);
	} catch (err: unknown) {
		res.status(400).json({ message: (err as Error).message });
	}
};

export const purchaseMultipleDronesHandler = async (req: Request, res: Response) => {
	try {
		const { userId, items, payWithCurrency } = req.body;
		if (!userId || !Array.isArray(items) || !payWithCurrency) {
			return res.status(400).json({ message: 'userId, items y payWithCurrency son requeridos' });
		}
		const result = await purchaseMultipleDrones(userId, items, payWithCurrency);
		res.status(200).json(result);
	} catch (err: unknown) {
		res.status(400).json({ message: (err as Error).message });
	}
};

export const getDroneConvertedPriceHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { currency } = req.query;
		if (!currency) return res.status(400).json({ message: 'currency es requerido' });
		const drone = await getDroneWithConvertedPrice(id, currency as string);
		res.status(200).json(drone);
	} catch (err: unknown) {
		res.status(400).json({ message: (err as Error).message });
	}
};

export const getUserPurchaseHistoryHandler = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const purchases = await getUserPurchaseHistory(userId);
		res.status(200).json(purchases);
	} catch (error: unknown) {
		res.status(500).json({ message: (error as Error).message });
	}
};

export const getUserSalesHistoryHandler = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const sales = await getUserSalesHistory(userId);
		res.status(200).json(sales);
	} catch (error: unknown) {
		res.status(500).json({ message: (error as Error).message });
	}
};
