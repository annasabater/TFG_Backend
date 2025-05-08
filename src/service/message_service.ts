//src/service/message_service.ts
import mongoose from 'mongoose';
import Drone, { IDrone } from '../models/drone_models.js';
import User from '../models/user_models.js';
import { Message, Order, Payment } from '../models/message_models.js';

// DRONE SERVICES
export async function createDrone(droneData: IDrone) {
  const drone = new Drone(droneData);
  await drone.save();
  return drone;
}

export async function getDrones() {
  return await Drone.find();
}

export async function getDroneById(id: string) {
  return await Drone.findById(id).populate('sellerId', 'name email');
}

export async function updateDrone(id: string, updateData: Partial<IDrone>) {
  return await Drone.findByIdAndUpdate(id, updateData, { new: true });
}

export async function deleteDrone(id: string) {
  return await Drone.findByIdAndDelete(id);
}

export async function getDronesByCategory(category: string) {
  return await Drone.find({ category });
}

export async function getDronesByPriceRange(min: number, max: number) {
  return await Drone.find({ price: { $gte: min, $lte: max } });
}

export async function addReviewToDrone(
  droneId: string,
  userId: string,
  rating: number,
  comment: string
) {
  const drone = await Drone.findById(droneId);
  if (!drone) return null;
  const user = await User.findById(userId);
  if (!user) return null;
  drone.ratings.push({ userId, rating, comment });
  await drone.save();
  return drone;
}

// MESSAGE SERVICES
async function validateUserNotDeleted(userId: string) {
  const user = await User.findById(userId);
  if (!user || (user as any).isDeleted) {
    throw new Error('Usuario no encontrado o eliminado');
  }
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
) {
  await validateUserNotDeleted(senderId);
  await validateUserNotDeleted(receiverId);
  const message = new Message({ senderId, receiverId, content });
  return await message.save();
}

export async function getMessages(
  userId: string,
  contactId: string
) {
  return await Message.find({
    $or: [
      { senderId: userId, receiverId: contactId },
      { senderId: contactId, receiverId: userId }
    ]
  }).sort({ createdAt: 1 });
}

// ORDER & PAYMENT SERVICES
export async function createOrder(
  droneId: string,
  buyerId: string,
  sellerId: string
) {
  await validateUserNotDeleted(buyerId);
  await validateUserNotDeleted(sellerId);
  const order = new Order({ droneId, buyerId, sellerId });
  return await order.save();
}

export async function getUserOrders(userId: string) {
  return await Order.find({ buyerId: userId }).populate(
    'droneId sellerId',
    'name email'
  );
}

export async function processPayment(
  orderId: string,
  userId: string,
  amount: number
) {
  const payment = new Payment({ orderId, userId, amount });
  return await payment.save();
}

export async function getUserPayments(userId: string) {
  return await Payment.find({ userId });
}

// CONVERSATION AGGREGATOR
export async function getConversations(userId: string) {
  const oid = new mongoose.Types.ObjectId(userId);
  return await Message.aggregate([
    { $match: { $or: [{ senderId: oid }, { receiverId: oid }] } },
    { $project: {
        partnerId: {
          $cond: [ { $eq: ['$senderId', oid] }, '$receiverId', '$senderId' ]
        },
        content:   '$content',
        timestamp: '$createdAt'
      }
    },
    { $sort: { timestamp: -1 } },
    { $group: {
        _id: '$partnerId',
        lastMessage: { $first: '$content' },
        timestamp:   { $first: '$timestamp' }
      }
    },
    { $project: {
        _id:        0,
        partnerId:  '$_id',
        lastMessage:1,
        timestamp:  1
      }
    },
    { $sort: { timestamp: -1 } }
  ]);
}
