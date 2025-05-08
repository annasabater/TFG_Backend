import { Request, Response } from 'express';
import { chatNsp } from '../server.js';
import Drone from '../models/message_models.js';
import mongoose from 'mongoose';
import {
  createDrone,
  getDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
  getDronesByCategory,
  getDronesByPriceRange,
  addReviewToDrone,
  sendMessage,
  getMessages,
  createOrder,
  getUserOrders,
  processPayment,
  getUserPayments
} from '../service/message_service.js';

// Crear un nuevo dron
export const createDroneHandler = async (req: Request, res: Response) => {
  try {
    const droneData = { ...req.body }; // sin req.user
    const drone = await createDrone(droneData);
    res.status(201).json(drone);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al crear el dron' });
  }
};

// Obtener todos los drones
export const getDronesHandler = async (req: Request, res: Response) => {
  try {
    const drones = await getDrones();
    res.status(200).json(drones);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener drones' });
  }
};

// Obtener un dron por ID
export const getDroneByIdHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let drone = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            drone = await Drone.findOne({ id }); 
        }

        if (!drone) {
            return res.status(404).json({ message: 'Drone no encontrado' });
        }

        res.status(200).json(drone);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al obtener el dron" });
    }
};


// Actualizar un dron
export const updateDroneHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        let drone = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            drone = await getDroneById(id);
        }

        if (!drone) {
            drone = await Drone.findOne({ id });
        }

        if (!drone) {
            return res.status(404).json({ message: 'Dron no encontrado' });
        }

        const updatedDrone = await updateDrone(drone._id.toString(), req.body);

        res.status(200).json(updatedDrone);
    } catch (error: any) {
        res.status(500).json({ message: error.message || "Error al actualizar el dron" });
    }
};


// Eliminar un dron
export const deleteDroneHandler = async (req: Request, res: Response) => {
  try {
    const drone = await getDroneById(req.params.id);
    if (!drone) return res.status(404).json({ message: 'Dron no encontrado' });

    await deleteDrone(req.params.id);
    res.status(200).json({ message: 'Dron eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al eliminar el dron' });
  }
};

// Obtener drones por categoría
export const getDronesByCategoryHandler = async (req: Request, res: Response) => {
  try {
    const drones = await getDronesByCategory(req.params.category);
    res.status(200).json(drones);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener drones por categoría' });
  }
};

// Obtener drones en un rango de precios
export const getDronesByPriceRangeHandler = async (req: Request, res: Response) => {
  try {
    const { min, max } = req.query;
    if (!min || !max || isNaN(Number(min)) || isNaN(Number(max))) {
      return res.status(400).json({ message: 'Parámetros inválidos' });
    }

    const drones = await getDronesByPriceRange(Number(min), Number(max));
    res.status(200).json(drones);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener drones en el rango de precios' });
  }
};

// Agregar una reseña a un dron
export const addDroneReviewHandler = async (req: Request, res: Response) => {
  try {
    const { rating, comment, userId } = req.body;
    const drone = await addReviewToDrone(req.params.id, userId, rating, comment);

    if (!drone) return res.status(404).json({ message: 'Dron o usuario no encontrado' });

    res.status(200).json(drone);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al agregar reseña' });
  }
};

// Enviar mensaje
export const sendMessageHandler = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId, content } = req.body;
    // Guarda en BD
    const message = await sendMessage(senderId, receiverId, content);

    // Emite al receptor y al propio emisor
    chatNsp.to(receiverId).emit('new_message', message);
    chatNsp.to(senderId).emit('new_message', message);

    // Devuelve la respuesta HTTP
    res.status(201).json(message);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al enviar mensaje' });
  }
};


// Obtener historial de mensajes
export const getMessagesHandler = async (req: Request, res: Response) => {
  try {
    const messages = await getMessages(req.params.userId, req.params.contactId);
    res.status(200).json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener mensajes' });
  }
};

// Crear un pedido
export const createOrderHandler = async (req: Request, res: Response) => {
  try {
    const { droneId, buyerId, sellerId } = req.body;
    const order = await createOrder(droneId, buyerId, sellerId);
    res.status(201).json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al crear pedido' });
  }
};

// Obtener pedidos de un usuario
export const getUserOrdersHandler = async (req: Request, res: Response) => {
  try {
    const orders = await getUserOrders(req.params.userId);
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener pedidos' });
  }
};

// Procesar pago
export const processPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { orderId, userId, amount } = req.body;
    const payment = await processPayment(orderId, userId, amount);
    res.status(201).json(payment);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al procesar pago' });
  }
};

// Obtener pagos de un usuario
export const getUserPaymentsHandler = async (req: Request, res: Response) => {
  try {
    const payments = await getUserPayments(req.params.userId);
    res.status(200).json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error al obtener pagos' });
  }
};
