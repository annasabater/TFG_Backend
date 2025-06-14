// src/service/drone_service.ts
import mongoose, { Types } from 'mongoose';
import Drone, { IDrone }   from '../models/drone_models.js';
import User                from '../models/user_models.js';
import { getExchangeRate } from '../utils/exchangeRates.js';

/* ---------- Tipus auxiliars ---------- */

interface DroneFilters {
	q?: string;
	category?: string;
	condition?: string;
	location?: string;
	priceMin?: number;
	priceMax?: number;
}

type MongoQuery = Record<string, unknown>;

interface SoftDeletable {
	isDeleted?: boolean;
}

interface UserWithFav extends mongoose.Document {
	favorites?: Types.ObjectId[];
}

// Tipos auxiliars per a compres múltiples
interface DroneToUpdate {
	drone: mongoose.Document;
	quantity: number;
	price: number;
}

/* ---------- Helpers ---------- */

const validateUserNotDeleted = async (userId: string): Promise<void> => {
	const user = await User.findById(userId);
	if (!user || (user as SoftDeletable).isDeleted) {
		throw new Error('Usuario no encontrado o eliminado');
	}
};

const buildQuery = (filters: DroneFilters): MongoQuery => {
	const query: MongoQuery = {};

	if (filters.category)  query.category  = filters.category;
	if (filters.condition) query.condition = filters.condition;
	if (filters.location) {
		query.location = { $regex: filters.location, $options: 'i' };
	}

	if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
		const price: { $gte?: number; $lte?: number } = {};
		if (filters.priceMin !== undefined) price.$gte = filters.priceMin;
		if (filters.priceMax !== undefined) price.$lte = filters.priceMax;
		query.price = price;
	}

	if (filters.q) {
		const regex = { $regex: filters.q, $options: 'i' };
		query.$or = [{ model: regex }, { details: regex }];
	}

	return query;
};

/* ---------- CRUD principal ---------- */

export const createDrone = async (droneData: IDrone) => {
	await validateUserNotDeleted(droneData.ownerId);
	if (!droneData.location) throw new Error('La ubicació és obligatòria');
	const drone = new Drone(droneData);
	await drone.save();
	return drone;
};

export const getDrones = async (
	page?: number,
	limit?: number,
	filters: Record<string, unknown> = {}
) => {
	const query = buildQuery(filters as DroneFilters);
	let cursor = Drone.find(query);
	if (typeof page === 'number' && typeof limit === 'number') {
		const skip = (page - 1) * limit;
		cursor = cursor.skip(skip).limit(limit);
	}
	return await cursor;
};

export const getDroneById       = (id: string) => Drone.findById(id);
export const getOwnerByDroneId  = (id: string) =>
	Drone.findById(id).populate('ownerId', 'name email');

export const updateDrone = (id: string, data: Partial<IDrone>) =>
	Drone.findByIdAndUpdate(id, data, { new: true });

export const deleteDrone = (id: string) => Drone.findByIdAndDelete(id);

/* ---------- Llistes curtes ---------- */

export const getDronesByCategory   = (category: string) =>
	Drone.find({ category });

export const getDronesByPriceRange = (min: number, max: number) =>
	Drone.find({ price: { $gte: min, $lte: max } });

/* ---------- Reviews ---------- */

export const addReviewToDrone = async (
	droneId: string,
	userId: string,
	rating: number,
	comment: string,
) => {
	const drone = await Drone.findById(droneId);
	if (!drone) return null;

	await validateUserNotDeleted(userId);

	drone.ratings.push({ userId, rating, comment });
	await drone.save();
	return drone;
};

/* ---------- Favorits ---------- */

export const addFavorite = async (userId: string, droneId: string) => {
	await validateUserNotDeleted(userId);

	const user = (await User.findById(userId)) as UserWithFav | null;
	if (!user) throw new Error('Usuario no encontrado');

	const alreadyFav = user.favorites?.some(
		(id) => id.toString() === droneId,
	) ?? false;

	if (!alreadyFav) {
		(user.favorites ??= []).push(new Types.ObjectId(droneId));
		await user.save();
	}
	return user.favorites;
};

export const removeFavorite = async (userId: string, droneId: string) => {
	await validateUserNotDeleted(userId);

	const user = (await User.findById(userId)) as UserWithFav | null;
	if (!user) throw new Error('Usuario no encontrado');

	user.favorites = user.favorites?.filter(
		(id) => id.toString() !== droneId,
	) ?? [];
	await user.save();
	return user.favorites;
};

export const getFavorites = async (userId: string, page = 1, limit = 10) => {
	await validateUserNotDeleted(userId);

	const skip = (page - 1) * limit;
	const user = (await User.findById(userId).populate({
		path   : 'favorites',
		options: { skip, limit },
	})) as UserWithFav | null;

	return user?.favorites ?? [];
};

/* ---------- Estat de venda ---------- */

export const markDroneSold = async (droneId: string) =>
	await Drone.findByIdAndUpdate(droneId, { status: 'venut' }, { new: true });
  
/* --- Llistar anuncis propis --- */
export const getMyDrones = async (ownerId: string, status?: 'pending' | 'sold') => {
	const query: Record<string, unknown> = { ownerId };
	if (status === 'pending') query.status = 'actiu';
	if (status === 'sold')    query.status = 'venut';
	return await Drone.find(query).sort({ createdAt: -1 });
};

export const purchaseDroneWithBalance = async (droneId: string, userId: string, payWithCurrency?: string) => {
	const drone = await Drone.findById(droneId);
	if (!drone) throw new Error('Dron no encontrado');
	if (drone.status === 'venut') throw new Error('Dron ya vendido');
	const user = await User.findById(userId);
	if (!user) throw new Error('Usuario no encontrado');
	if (!user.balance) user.balance = new Map();

	// Solo permitir pagar en la divisa indicada
	if (!payWithCurrency) throw new Error('Debes indicar la divisa con la que quieres pagar (payWithCurrency)');
	if (!user.balance.has(payWithCurrency)) throw new Error('No tienes saldo en la divisa seleccionada');

	// Calcular el precio en la divisa seleccionada
	let price = drone.price;
	if (drone.currency !== payWithCurrency) {
		const rate = await getExchangeRate(drone.currency, payWithCurrency);
		price = Math.round((drone.price / rate) * 100) / 100;
	}
	const userBalance = user.balance.get(payWithCurrency) || 0;
	if (userBalance < price) throw new Error('Saldo insuficiente en la divisa seleccionada');

	// Descontar saldo
	user.balance.set(payWithCurrency, userBalance - price);
	await user.save();
	drone.status = 'venut';
	drone.buyerId = new mongoose.Types.ObjectId(userId);
	await drone.save();

	// Guardar historial de compra y venta
	const seller = await User.findById(drone.ownerId);
	const purchaseEntry = {
		droneId: drone._id,
		model: drone.model,
		price: price,
		currency: payWithCurrency,
		images: drone.images,
		details: drone.details,
		category: drone.category,
		condition: drone.condition,
		location: drone.location,
		contact: drone.contact,
		date: new Date()
	};
	if (user) {
		user.purchases = user.purchases || [];
		user.purchases.push(purchaseEntry);
		await user.save();
	}
	if (seller) {
		seller.sales = seller.sales || [];
		seller.sales.push(purchaseEntry);
		await seller.save();
	}

	return { drone, user: { ...user.toObject(), balance: Object.fromEntries(user.balance) } };
};

// Devuelve el dron con el precio convertido a la divisa solicitada
export const getDroneWithConvertedPrice = async (droneId: string, targetCurrency: string) => {
	const allowedCurrencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'HKD', 'NZD'];
	const drone = await Drone.findById(droneId);
	if (!drone) throw new Error('Dron no encontrado');
	if (!allowedCurrencies.includes(targetCurrency)) throw new Error('Divisa no soportada');
	let convertedPrice = drone.price;
	if (drone.currency !== targetCurrency) {
		const rate = await getExchangeRate(drone.currency, targetCurrency);
		convertedPrice = Math.round(drone.price * rate * 100) / 100;
	}
	return {
		...drone.toObject(),
		price: convertedPrice,
		currency: targetCurrency,
		originalPrice: drone.price,
		originalCurrency: drone.currency
	};
};

export interface DronePurchaseItem {
  droneId: string;
  quantity: number;
}

export const purchaseMultipleDrones = async (
	userId: string,
	items: DronePurchaseItem[],
	payWithCurrency: string
) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('Usuario no encontrado');
	if (!user.balance) user.balance = new Map();
	if (!payWithCurrency) throw new Error('Debes indicar la divisa con la que quieres pagar (payWithCurrency)');
	if (!user.balance.has(payWithCurrency)) throw new Error('No tienes saldo en la divisa seleccionada');

	let total = 0;
	const dronesToUpdate: DroneToUpdate[] = [];
	const purchaseEntries: Record<string, unknown>[] = [];
	for (const item of items) {
		const droneDoc = await Drone.findById(item.droneId);
		if (!droneDoc) throw new Error(`Dron ${item.droneId} no encontrado`);
		const ownerId = droneDoc.get('ownerId');
		if (ownerId.toString() === userId.toString()) throw new Error('No puedes comprar tu propio dron');
		if (droneDoc.get('status') === 'venut') throw new Error(`Dron ${droneDoc.get('model')} ya vendido`);
		if (typeof droneDoc.get('stock') !== 'number' || droneDoc.get('stock') < item.quantity) throw new Error(`Stock insuficiente para el dron ${droneDoc.get('model')}`);
		// Calcular precio en la divisa seleccionada
		let price = droneDoc.get('price');
		if (droneDoc.get('currency') !== payWithCurrency) {
			const rate = await getExchangeRate(droneDoc.get('currency'), payWithCurrency);
			price = Math.round((droneDoc.get('price') / rate) * 100) / 100;
		}
		total += price * item.quantity;
		dronesToUpdate.push({ drone: droneDoc, quantity: item.quantity, price });
		purchaseEntries.push({
			droneId: droneDoc.get('_id'),
			model: droneDoc.get('model'),
			price: price,
			currency: payWithCurrency,
			images: droneDoc.get('images'),
			details: droneDoc.get('details'),
			category: droneDoc.get('category'),
			condition: droneDoc.get('condition'),
			location: droneDoc.get('location'),
			contact: droneDoc.get('contact'),
			date: new Date()
		});
	}
	const userBalance = user.balance.get(payWithCurrency) || 0;
	if (userBalance < total) throw new Error('Saldo insuficiente en la divisa seleccionada');
	// Descontar saldo
	user.balance.set(payWithCurrency, userBalance - total);
	await user.save();
	// Actualizar stock y marcar vendidos si corresponde
	for (const { drone, quantity } of dronesToUpdate) {
		const stock = drone.get('stock');
		if (typeof stock === 'number') {
			drone.set('stock', stock - quantity);
			if (stock - quantity === 0) {
				drone.set('status', 'venut');
				drone.set('buyerId', userId);
			}
			await drone.save();
		}
	}
	// Guardar historial de compra y venta
	user.purchases = user.purchases || [];
	user.purchases.push(...purchaseEntries);
	await user.save();
	for (const { drone } of dronesToUpdate) {
		const ownerId = drone.get('ownerId');
		const seller = await User.findById(ownerId);
		if (seller) {
			seller.sales = seller.sales || [];
			seller.sales.push({
				droneId: drone.get('_id'),
				model: drone.get('model'),
				price: drone.get('price'),
				currency: drone.get('currency'),
				images: drone.get('images'),
				details: drone.get('details'),
				category: drone.get('category'),
				condition: drone.get('condition'),
				location: drone.get('location'),
				contact: drone.get('contact'),
				date: new Date()
			});
			await seller.save();
		}
	}
	return { success: true, total, currency: payWithCurrency, user: { ...user.toObject(), balance: Object.fromEntries(user.balance) } };
};

export const getUserPurchaseHistory = async (userId: string) => {
	const user = await User.findById(userId);
	return user?.purchases || [];
};

export const getUserSalesHistory = async (userId: string) => {
	const user = await User.findById(userId);
	return user?.sales || [];
};
