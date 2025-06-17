// src/service/message_service.ts

import mongoose from 'mongoose';
import Drone, { IDrone } from '../models/drone_models.js';
import User from '../models/user_models.js';
import { Message, Order, Payment } from '../models/message_models.js';

interface DroneFilters {
	min?: number;
	max?: number;
	minRating?: number;
	category?: string;
	condition?: string;
	location?: string;
}

type PriceFilter = { $gte?: number; $lte?: number };

type RatingLean = { rating: number };

type DroneLean = Omit<IDrone, 'ratings'> & {
	_id: mongoose.Types.ObjectId;
	ratings?: RatingLean[];
	averageRating?: number;
};

interface SoftDeletable {
	isDeleted?: boolean;
}

export async function createDrone(droneData: IDrone) {
	const drone = new Drone(droneData);
	await drone.save();
	return drone;
}

export async function getDrones(filters: DroneFilters = {}) {
	const priceFilter: PriceFilter = {};
	if (filters.min !== undefined) priceFilter.$gte = Number(filters.min);
	if (filters.max !== undefined) priceFilter.$lte = Number(filters.max);

	const query: Record<string, unknown> = {};
	if (Object.keys(priceFilter).length) query.price = priceFilter;
	if (filters.category) query.category = filters.category;
	if (filters.condition) query.condition = filters.condition;
	if (filters.location){
		query.location = { $regex: filters.location, $options: 'i' };
	}

	const drones = await Drone.find<DroneLean>(query).lean();

	const dronesWithAvg = drones.map((d) => {
		const ratings   = d.ratings?.map((r) => r.rating) ?? [];
		const total     = ratings.reduce((sum, n) => sum + n, 0);
		const avgRating = ratings.length ? total / ratings.length : 0;
		return { ...d, averageRating: avgRating };
	});

	if (filters.minRating !== undefined) {
		return dronesWithAvg.filter(
			(d) => d.averageRating >= filters.minRating!,
		);
	}
	return dronesWithAvg;
}

export function getDroneById(id: string) {
	return Drone.findById(id).populate('sellerId', 'name email');
}

export function updateDrone(id: string, updateData: Partial<IDrone>) {
	return Drone.findByIdAndUpdate(id, updateData, { new: true });
}

export function deleteDrone(id: string) {
	return Drone.findByIdAndDelete(id);
}

export function getDronesByCategory(category: string) {
	return Drone.find({ category });
}

export function getDronesByPriceRange(min: number, max: number) {
	return Drone.find({ price: { $gte: min, $lte: max } });
}

export async function addReviewToDrone(
	droneId: string,
	userId: string,
	rating: number,
	comment: string,
) {
	const drone = await Drone.findById(droneId);
	if (!drone) return null;

	const user = await User.findById(userId);
	if (!user) return null;

	drone.ratings.push({ userId: new mongoose.Types.ObjectId(userId), rating, comment });
	await drone.save();
	return drone;
}

async function validateUserNotDeleted(userId: string) {
	const user = await User.findById(userId);
	if (!user || (user as SoftDeletable).isDeleted) {
		throw new Error('Usuario no encontrado o eliminado');
	}
}

export async function sendMessage(
	senderId: string,
	receiverId: string,
	content: string,
) {
	await validateUserNotDeleted(senderId);
	await validateUserNotDeleted(receiverId);
	const message = new Message({ senderId, receiverId, content });
	return message.save();
}

export function getMessages(userId: string, contactId: string) {
	return Message.find({
		$or: [
			{ senderId: userId, receiverId: contactId },
			{ senderId: contactId, receiverId: userId },
		],
	}).sort({ createdAt: 1 });
}

export async function createOrder(
	droneId: string,
	buyerId: string,
	sellerId: string,
) {
	await validateUserNotDeleted(buyerId);
	await validateUserNotDeleted(sellerId);

	if (buyerId === sellerId) throw new Error('No pots comprar el teu propi producte');

	const drone = await Drone.findById(droneId);
	if (!drone) throw new Error('Dron no encontrado');

	const order = new Order({ droneId, buyerId, sellerId });
	await order.save();

	if (drone.category === 'venta') {
		await Drone.findByIdAndUpdate(droneId, { status: 'venut' });
	}

	return order;
}

export function getUserOrders(userId: string) {
	return Order.find({ buyerId: userId }).populate(
		'droneId sellerId',
		'name email',
	);
}

export function processPayment(orderId: string, userId: string, amount: number) {
	const payment = new Payment({ orderId, userId, amount });
	return payment.save();
}

export function getUserPayments(userId: string) {
	return Payment.find({ userId });
}

export function getConversations(userId: string) {
	const oid = new mongoose.Types.ObjectId(userId);

	return Message.aggregate([
		{
			$match: {
				$or: [{ senderId: oid }, { receiverId: oid }],
			},
		},
		{
			$project: {
				partnerId: {
					$cond: [{ $eq: ['$senderId', oid] }, '$receiverId', '$senderId'],
				},
				content: '$content',
				timestamp: '$createdAt',
			},
		},
		{ $sort: { timestamp: -1 } },
		{
			$group: {
				_id: '$partnerId',
				lastMessage: { $first: '$content' },
				timestamp: { $first: '$timestamp' },
			},
		},
		{
			$project: {
				_id: 0,
				partnerId: '$_id',
				lastMessage: 1,
				timestamp: 1,
			},
		},
		{ $sort: { timestamp: -1 } },
	]);
}