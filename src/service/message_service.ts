import Drone, { IDrone } from '../models/drone_models.js';
import User from '../models/user_models.js';
import { Message, Order, Payment } from '../models/message_models.js';

// Permite que los usuarios publiquen drones en venta o alquiler
export const createDrone = async (droneData: IDrone) => {
    const drone = new Drone(droneData);
    await drone.save();
    return drone;
};

// Lista todos los drones disponibles
export const getDrones = async () => {
    return await Drone.find();
};

// Obtiene la información detallada de un dron, incluyendo el vendedor
export const getDroneById = async (id: string) => {
    return await Drone.findById(id).populate('sellerId', 'name email');
};

// Permite que los vendedores editen su publicación
export const updateDrone = async (id: string, updateData: Partial<IDrone>) => {
    return await Drone.findByIdAndUpdate(id, updateData, { new: true });
};

// Permite que los vendedores eliminen su publicación
export const deleteDrone = async (id: string) => {
    return await Drone.findByIdAndDelete(id);
};

// Filtra drones en un rango de precios
export const getDronesByCategory = async (category: string) => {
    return await Drone.find({ category });
};

// Obtener drones dentro de un rango de precios
export const getDronesByPriceRange = async (min: number, max: number) => {
    return await Drone.find({ price: { $gte: min, $lte: max } });
};

// Agregar una reseña a un dron. Los compradores pueden calificar y comentar sobre drones que han adquirido
export const addReviewToDrone = async (droneId: string, userId: string, rating: number, comment: string) => {
    const drone = await Drone.findById(droneId);
    if (!drone) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    drone.ratings.push({ userId, rating, comment });
    await drone.save();
    return drone;
};

// Validar que el usuario no esté eliminado
const validateUserNotDeleted = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
        throw new Error('Usuario no encontrado o eliminado');
    }
};

// Permite que compradores y vendedores se contacten
export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    await validateUserNotDeleted(senderId);
    await validateUserNotDeleted(receiverId);
    const message = new Message({ senderId, receiverId, content });
    return await message.save();
};

// Permite ver el historial de mensajes entre dos usuarios
export const getMessages = async (userId: string, contactId: string) => {
    return await Message.find({
        $or: [
            { senderId: userId, receiverId: contactId },
            { senderId: contactId, receiverId: userId }
        ]
    }).sort({ timestamp: 1 });
};

// Crea una orden de compra
export const createOrder = async (droneId: string, buyerId: string, sellerId: string) => {
    await validateUserNotDeleted(buyerId);
    await validateUserNotDeleted(sellerId);
    const order = new Order({ droneId, buyerId, sellerId });
    return await order.save();
};

// Muestra el historial de compras de un usuario
export const getUserOrders = async (userId: string) => {
    return await Order.find({ buyerId: userId }).populate('droneId sellerId', 'name email');
};

// Permite cambiar el estado de una compra
export const updateOrderStatus = async (orderId: string, status: 'pendiente' | 'enviado' | 'entregado') => {
    return await Order.findByIdAndUpdate(orderId, { status }, { new: true });
};

// Registra un pago
export const processPayment = async (orderId: string, userId: string, amount: number) => {
    const payment = new Payment({ orderId, userId, amount });
    return await payment.save();
};

// Lista los pagos realizados por un usuario
export const getUserPayments = async (userId: string) => {
    return await Payment.find({ userId });
};