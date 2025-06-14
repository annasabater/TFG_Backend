// src/controllers/drone_controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Drone from '../models/drone_models.js';
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
import { getCommentsByDrone, } from '../service/comment_service.js';
import { createOrder, getConversations, getMessages, getUserOrders, getUserPayments, processPayment, sendMessage } from '../service/message_service.js';
import { chatNsp } from '../server.js';

/* ---------- Tipus auxiliars ---------- */

/** Request amb arxius de Multer ja tipats */
interface MulterRequest extends Request {
	files?: Express.Multer.File[];
}

/** Camps bàsics que fem servir del document de Dron */
interface DroneDoc {
	_id: mongoose.Types.ObjectId;
	model: string;
	createdAt: Date;
	averageRating?: number;
	ratings: Array<{ userId: mongoose.Types.ObjectId; rating: number; comment: string }>;
	toObject: () => Record<string, unknown>;
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
		const {
			ownerId,
			model,
			price,
			category,
			description,
			location,
			...rest
		} = req.body as Record<string, unknown>;

		const files = (req as MulterRequest).files;
		let images: string[] | undefined;
		if (files?.length) {
			images = files.map((f) => `http://localhost:9000/uploads/${f.filename}`);
		}

		// Ensure all required fields are present and of correct type
		if (
			typeof ownerId !== 'string' ||
			typeof model !== 'string' ||
			typeof price !== 'number' ||
			typeof category !== 'string' ||
			typeof description !== 'string' ||
			typeof location !== 'string'
		) {
			return res.status(400).json({ message: 'Faltan campos obligatorios o son inválidos' });
		}

		// Ensure category is either "venta" or "alquiler"
		const validCategories = ["venta", "alquiler"];
		if (!validCategories.includes(category)) {
			return res.status(400).json({ message: 'La categoría debe ser "venta" o "alquiler"' });
		}

		const droneInput = {
			ownerId,
			model,
			price,
			category: category as "venta" | "alquiler",
			description,
			location,
			images,
			condition: req.body.condition, // Add the required 'condition' property
			...rest,
		};

		const drone = await createDrone(droneInput);
		res.status(201).json(drone);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al crear el dron';
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

		drones = drones.sort(
			(a: DroneDoc, b: DroneDoc) => b.createdAt.getTime() - a.createdAt.getTime()
		);

		const result = drones.map((d: DroneDoc) => ({
			...d.toObject(),
			averageRating: d.averageRating,
		}));

		res.status(200).json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al obtener drones';
		res.status(500).json({ message });
	}
};

/* --- Favoritos --- */

const addFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await addFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al agregar favorito';
		res.status(500).json({ message });
	}
};

const removeFavoriteHandler = async (req: Request, res: Response) => {
	try {
		const favs = await removeFavorite(req.params.userId, req.params.droneId);
		res.status(200).json(favs);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al eliminar favorito';
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
		const message =
			error instanceof Error ? error.message : 'Error al obtener favoritos';
		res.status(500).json({ message });
	}
};

/* --- Lectura d’un dron --- */

const getDroneByIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const drone = mongoose.Types.ObjectId.isValid(id)
			? await getDroneById(id)
			: null;

		if (!drone) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}

		const comments = await getCommentsByDrone(drone._id.toString());
		res.status(200).json({ ...drone.toObject(), comments });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al obtener el dron';
		res.status(500).json({ message });
	}
};

const getOwnerByDroneIdHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const user = mongoose.Types.ObjectId.isValid(id)
			? await getOwnerByDroneId(id)
			: null;

		if (!user) {
			return res.status(404).json({ message: 'Drone no encontrado' });
		}
		res.status(200).json(user);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al obtener el dron';
		res.status(500).json({ message });
	}
};

/* --- Actualització --- */

const updateDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone = mongoose.Types.ObjectId.isValid(id)
			? await getDroneById(id)
			: await Drone.findOne({ id });

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		const files = (req as MulterRequest).files;
		if (files?.length) {
			const images = files.map((f) => `/uploads/${f.filename}`);
			(req.body as { images?: string[] }).images = images;
		}

		const updated = await updateDrone(drone._id.toString(), req.body);
		res.status(200).json(updated);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al actualizar el dron';
		res.status(500).json({ message });
	}
};

/* --- Eliminació --- */

const deleteDroneHandler = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		let drone = mongoose.Types.ObjectId.isValid(id)
			? await getDroneById(id)
			: await Drone.findOne({ id });

		if (!drone) {
			return res.status(404).json({ message: 'Dron no encontrado' });
		}

		await deleteDrone(drone._id.toString());
		res.status(200).json({ message: 'Dron eliminado exitosamente' });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Error al eliminar el dron';
		res.status(500).json({ message });
	}
};

/* --- Llistats addicionals --- */

const getDronesByCategoryHandler = async (req: Request, res: Response) => {
	try {
		const { category } = req.params;
		if (!category) {
			return res
				.status(400)
				.json({ message: 'Debe proporcionar una categoría válida' });
		}

		const drones = await Drone.find({ category });
		if (!drones.length) {
			return res
				.status(404)
				.json({ message: 'No hay drones en esta categoría' });
		}
		res.status(200).json(drones);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: 'Error al obtener drones por categoría';
		res.status(500).json({ message });
	}
};

const getDronesByPriceRangeHandler = async (req: Request, res: Response) => {
	try {
		const min = Number(req.query.min);
		const max = Number(req.query.max);
		if (Number.isNaN(min) || Number.isNaN(max)) {
			return res
				.status(400)
				.json({ message: 'min y max deben ser números' });
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
			return res
				.status(400)
				.json({ message: 'El rating debe estar entre 1 y 5' });
		}

		let drone = mongoose.Types.ObjectId.isValid(id)
			? await getDroneById(id)
			: await Drone.findOne({ id });

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
		const message =
			error instanceof Error ? error.message : 'Error al agregar reseña';
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
		const message =
			error instanceof Error ? error.message : 'Error al obtener mis drones';
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
		const message =
			error instanceof Error ? error.message : 'Error al comprar dron';
		res.status(500).json({ message });
	}
};


export async function sendMessageHandler(req: Request, res: Response) {
	try {
		const { senderId, receiverId, content } = req.body;
		const msg = await sendMessage(senderId, receiverId, content);

		const payload = msg.toObject();
		payload.senderId = payload.senderId.toString();
		payload.receiverId = payload.receiverId.toString();

		chatNsp.to(payload.receiverId).emit('new_message', payload);
		chatNsp.to(payload.senderId).emit('new_message', payload);

		return res.status(201).json(payload);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al enviar mensaje';
		return res.status(500).json({ message });
	}
}


export async function getMessagesHandler(req: Request, res: Response) {
	try {
		const msgs = await getMessages(req.params.userId, req.params.contactId);
		return res.status(200).json(msgs);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al obtener mensajes';
		return res.status(500).json({ message });
	}
}

export async function getConversationsHandler(req: Request, res: Response) {
	try {
		const convs = await getConversations(req.params.userId);
		return res.status(200).json(convs);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al obtener conversaciones';
		return res.status(500).json({ message });
	}
}

export async function createOrderHandler(req: Request, res: Response) {
	try {
		const order = await createOrder(
			req.body.droneId,
			req.body.buyerId,
			req.body.sellerId
		);
		return res.status(201).json(order);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al crear pedido';
		return res.status(500).json({ message });
	}
}

export async function getUserOrdersHandler(req: Request, res: Response) {
	try {
		const orders = await getUserOrders(req.params.userId);
		return res.status(200).json(orders);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al obtener pedidos';
		return res.status(500).json({ message });
	}
}

export async function processPaymentHandler(req: Request, res: Response) {
	try {
		const payment = await processPayment(
			req.body.orderId,
			req.body.userId,
			req.body.amount
		);
		return res.status(201).json(payment);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al procesar pago';
		return res.status(500).json({ message });
	}
}

export async function getUserPaymentsHandler(req: Request, res: Response) {
	try {
		const pays = await getUserPayments(req.params.userId);
		return res.status(200).json(pays);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Error al obtener pagos';
		return res.status(500).json({ message });
	}
}
/* ---------- Exports ---------- */

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