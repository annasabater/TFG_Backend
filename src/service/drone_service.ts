// src/service/drone_service.ts
import mongoose, { Types } from 'mongoose';
import Drone, { IDrone }   from '../models/drone_models.js';
import User                from '../models/user_models.js';

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
	page = 1,
	limit = 10,
	filters: DroneFilters = {},
) => {
	const skip  = (page - 1) * limit;
	const query = buildQuery(filters);
	return Drone.find(query).skip(skip).limit(limit);
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

export const markDroneSold = (droneId: string) =>
	Drone.findByIdAndUpdate(droneId, { status: 'venut' }, { new: true });

/* ---------- Llistat dels meus anuncis ---------- */

export const getMyDrones = (
	ownerId: string,
	status?: 'pending' | 'sold',
) => {
	const query: MongoQuery = { ownerId };
	if (status === 'pending') query.status = 'actiu';
	if (status === 'sold')    query.status = 'venut';

	return Drone.find(query).sort({ createdAt: -1 });
};