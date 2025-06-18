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
import User from '../models/user_models.js';

// Tipos auxiliares
interface UploadedFile {
	filename: string;
}

function normalizeIds(rec: any) {
  const obj = { ...rec };
  ['_id', 'ownerId', 'sellerId'].forEach((k) => {
    if (obj[k] && typeof obj[k] !== 'string') {
      obj[k] = obj[k].toString();
    }
  });
  return obj;
}

// controllers/drone_controller.ts
export const createDroneHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;       
    const {
      _id, status, createdAt, ratings, isSold, isService, ...rest
    } = req.body;

    const stock = Math.max(1, parseInt(rest.stock ?? '1', 10) || 1);

    const drone = await Drone.create({
      ...rest,
      stock,
      ownerId : userId,      
      sellerId: userId,        
    });

    res.status(201).json(drone);
  } catch (e) {
    res.status(500).json({ message: (e as Error).message });
  }
};


export const getDroneByIdHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validar el ObjectId de Mongo
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de dron inválido' });
    }

    // Buscar el dron
    const drone = await getDroneById(id);
    if (!drone) {
      return res.status(404).json({ message: 'Dron no encontrado' });
    }

    // Garantizar que sellerId / ownerId llega como string
    const obj = drone.toObject() as any;
    if (obj.sellerId && typeof obj.sellerId !== 'string') {
      obj.sellerId = (obj.sellerId as mongoose.Types.ObjectId).toString();
    }

    return res.status(200).json(obj);
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : 'Error al obtener el dron',
    });
  }
};

  

// Get all drones with pagination
// Get all drones with pagination
export const getDronesHandler = async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		let limit = parseInt(req.query.limit as string) || 10;
		if (limit > 20) limit = 20;
		const skip = (page - 1) * limit;

		// Soporte para _id directo
		if (req.query._id && mongoose.Types.ObjectId.isValid(req.query._id.toString())) {
			const drone = await Drone.findById(req.query._id.toString());
			if (!drone) return res.status(404).json({ drones: [], pages: 0 });
			return res.status(200).json({ drones: [drone], pages: 1 });
		}

		const filters: Record<string, string | undefined> = {
			q: req.query.q as string,
			category: req.query.category as string,
			condition: req.query.condition as string,
			location: req.query.location as string,
			name: req.query.name as string,
			model: req.query.model as string
		};

		const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
		const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
		const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;

		let drones = await getDrones(undefined, undefined, filters);

		if (filters.name) {
			drones = drones.filter(d => typeof d.model === 'string' && d.model.toLowerCase().includes(filters.name!.toLowerCase()));
		}
		if (filters.model) {
			drones = drones.filter(d => typeof d.model === 'string' && d.model.toLowerCase().includes(filters.model!.toLowerCase()));
		}

		const dronesWithRatings = await Promise.all(
			drones.map(async (d) => {
				const comments = await getCommentsByDrone(d._id.toString());
				const rootRatings = comments
					.filter(c =>
						typeof c.rating === 'number' &&
						(!c.parentCommentId || c.parentCommentId === null)
					)
					.map(c => c.rating as number);

				const averageRating = rootRatings.length
					? Math.round(rootRatings.reduce((a, b) => a + b, 0) / rootRatings.length * 10) / 10
					: null;

				return { ...d.toObject(), averageRating };
			})
		);

		// Conversión de divisa antes de filtrar por precio 
		const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'];
		const targetCurrency = req.query.currency as string;
		if (!targetCurrency || !allowedCurrencies.includes(targetCurrency)) {
			return res.status(400).json({ message: 'currency es requerido y debe ser una de: ' + allowedCurrencies.join(', ') });
		}

		const { getExchangeRate } = await import('../utils/exchangeRates.js');
		const convertedDrones = await Promise.all(
			dronesWithRatings.map(async (d) => {
				let price = d.price as number;
				let currency = d.currency as string;
				if (currency !== targetCurrency) {
					const rate = await getExchangeRate(currency, targetCurrency);
					price = Math.round(price * rate * 100) / 100;
					currency = targetCurrency;
				}
				return { ...d, price, currency };
			})
		);

		let filteredDrones = convertedDrones;
		if (minPrice !== undefined) {
			filteredDrones = filteredDrones.filter(d => Number(d.price) >= minPrice);
		}
		if (maxPrice !== undefined) {
			filteredDrones = filteredDrones.filter(d => Number(d.price) <= maxPrice);
		}
		if (minRating !== undefined) {
			filteredDrones = filteredDrones.filter(d => (d.averageRating ?? 0) >= minRating);
		}

		filteredDrones = filteredDrones.sort((a, b) => {
			const dateA = new Date(a.createdAt as unknown as string).getTime();
			const dateB = new Date(b.createdAt as unknown as string).getTime();
			return dateB - dateA;
		});

const total = await Drone.countDocuments();
const pages = Math.ceil(total / limit);
const paginatedDrones = filteredDrones.slice(skip, skip + limit);

res.status(200).json({
  drones: paginatedDrones.map(normalizeIds),
  pages
});
} catch (error) {
  res.status(500).json({ message: (error as Error).message || 'Error al obtener los drones' });
}
};
  
// Favoritos
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
export const getUserByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de usuario inválido' });
  }
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error obteniendo usuario', error: err });
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
