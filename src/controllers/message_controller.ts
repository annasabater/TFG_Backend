//src/controllers/message_controller.ts
import { Request, Response } from 'express';
import {
	sendMessage,
	getMessages,
	createOrder,
	getUserOrders,
	processPayment,
	getUserPayments,
	getConversations
} from '../service/message_service.js';
import { chatNsp } from '../server.js';

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
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
	}
}


export async function getMessagesHandler(req: Request, res: Response) {
	try {
		const msgs = await getMessages(req.params.userId, req.params.contactId);
		return res.status(200).json(msgs);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
	}
}

export async function getConversationsHandler(req: Request, res: Response) {
	try {
		const convs = await getConversations(req.params.userId);
		return res.status(200).json(convs);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
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
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
	}
}

export async function getUserOrdersHandler(req: Request, res: Response) {
	try {
		const orders = await getUserOrders(req.params.userId);
		return res.status(200).json(orders);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
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
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
	}
}

export async function getUserPaymentsHandler(req: Request, res: Response) {
	try {
		const pays = await getUserPayments(req.params.userId);
		return res.status(200).json(pays);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return res.status(500).json({ message: error.message });
		} else {
			return res.status(500).json({ message: String(error) });
		}
	}
}