//src/controllers/message_controller.ts
import { Request, Response } from 'express';
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
  getUserPayments,
  getConversations
} from '../service/message_service.js';

import { chatNsp } from '../server.js';

export async function createDroneHandler(req: Request, res: Response) {
  try {
    const drone = await createDrone(req.body);
    return res.status(201).json(drone);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getDronesHandler(req: Request, res: Response) {
  try {
    const drones = await getDrones();
    return res.status(200).json(drones);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getDroneByIdHandler(req: Request, res: Response) {
  try {
    const drone = await getDroneById(req.params.id);
    if (!drone) return res.status(404).json({ message: 'Dron no encontrado' });
    return res.status(200).json(drone);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function updateDroneHandler(req: Request, res: Response) {
  try {
    const updated = await updateDrone(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Dron no encontrado' });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteDroneHandler(req: Request, res: Response) {
  try {
    const deleted = await deleteDrone(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Dron no encontrado' });
    return res.status(200).json({ message: 'Dron eliminado' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function addDroneReviewHandler(req: Request, res: Response) {
  try {
    const { rating, comment, userId } = req.body;
    const drone = await addReviewToDrone(req.params.id, userId, rating, comment);
    if (!drone) return res.status(404).json({ message: 'Dron o usuario no encontrado' });
    return res.status(200).json(drone);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getDronesByCategoryHandler(req: Request, res: Response) {
  try {
    const drones = await getDronesByCategory(req.params.category);
    return res.status(200).json(drones);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getDronesByPriceRangeHandler(req: Request, res: Response) {
  try {
    const min = Number(req.query.min);
    const max = Number(req.query.max);
    if (isNaN(min) || isNaN(max)) {
      return res.status(400).json({ message: 'Parámetros inválidos' });
    }
    const drones = await getDronesByPriceRange(min, max);
    return res.status(200).json(drones);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}


export async function sendMessageHandler(req: Request, res: Response) {
  try {
    const { senderId, receiverId, content } = req.body;
    const msg = await sendMessage(senderId, receiverId, content);

    const payload = msg.toObject();
    payload.senderId   = payload.senderId.toString();
    payload.receiverId = payload.receiverId.toString();

    chatNsp.to(payload.receiverId).emit('new_message', payload);
    chatNsp.to(payload.senderId).emit('new_message', payload);

    return res.status(201).json(payload);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}


export async function getMessagesHandler(req: Request, res: Response) {
  try {
    const msgs = await getMessages(req.params.userId, req.params.contactId);
    return res.status(200).json(msgs);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getConversationsHandler(req: Request, res: Response) {
  try {
    const convs = await getConversations(req.params.userId);
    return res.status(200).json(convs);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getUserOrdersHandler(req: Request, res: Response) {
  try {
    const orders = await getUserOrders(req.params.userId);
    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getUserPaymentsHandler(req: Request, res: Response) {
  try {
    const pays = await getUserPayments(req.params.userId);
    return res.status(200).json(pays);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}