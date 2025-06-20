import express from 'express';
import {
	createDroneHandler,
	getDronesHandler,
	getDroneByIdHandler,
	updateDroneHandler,
	deleteDroneHandler,
	addDroneReviewHandler,
	getDronesByCategoryHandler,
	getDronesByPriceRangeHandler,
	sendMessageHandler,
	getMessagesHandler,
	getConversationsHandler,
	createOrderHandler,
	getUserOrdersHandler,
	processPaymentHandler,
	getUserPaymentsHandler,
} from '../controllers/message_controller.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Drones
 *   description: Gestión de drones
 */

/**
 * @swagger
 * /api/drones:
 *   get:
 *     summary: Obtener todos los drones
 *     tags: [Drones]
 *     responses:
 *       200:
 *         description: Lista de drones
 */
router.get('/drones', generalRateLimiter, getDronesHandler);

/**
 * @swagger
 * /api/drones/{id}:
 *   get:
 *     summary: Obtener un dron por ID
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del dron
 *       404:
 *         description: Dron no encontrado
 */
router.get('/drones/:id', generalRateLimiter, getDroneByIdHandler);

/**
 * @swagger
 * /api/drones:
 *   post:
 *     summary: Crear un nuevo dron
 *     tags: [Drones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Drone'
 *     responses:
 *       201:
 *         description: Dron creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/drones', generalRateLimiter, createDroneHandler);

/**
 * @swagger
 * /api/drones/{id}:
 *   put:
 *     summary: Actualizar un dron
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DroneUpdate'
 *     responses:
 *       200:
 *         description: Dron actualizado
 *       404:
 *         description: Dron no encontrado
 */
router.put('/drones/:id', generalRateLimiter, updateDroneHandler);

/**
 * @swagger
 * /api/drones/{id}:
 *   delete:
 *     summary: Eliminar un dron
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dron eliminado
 *       404:
 *         description: Dron no encontrado
 */
router.delete('/drones/:id', generalRateLimiter, deleteDroneHandler);

/**
 * @swagger
 * /api/drones/{id}/review:
 *   post:
 *     summary: Agregar reseña a un dron
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       200:
 *         description: Reseña agregada
 *       404:
 *         description: Dron o usuario no encontrado
 */
router.post('/drones/:id/review', generalRateLimiter, addDroneReviewHandler);

/**
 * @swagger
 * /api/drones/category/{category}:
 *   get:
 *     summary: Obtener drones por categoría
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de drones en la categoría
 */
router.get('/drones/category/:category', generalRateLimiter, getDronesByCategoryHandler);

/**
 * @swagger
 * /api/drones/price:
 *   get:
 *     summary: Obtener drones por rango de precio
 *     tags: [Drones]
 *     parameters:
 *       - in: query
 *         name: min
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: max
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Drones encontrados en el rango
 *       400:
 *         description: Parámetros inválidos
 */
router.get('/drones/price', generalRateLimiter, getDronesByPriceRangeHandler);

/**
 * @swagger
 * components:
 *   schemas:
 *     MessageInput:
 *       type: object
 *       properties:
 *         senderId:
 *           type: string
 *         receiverId:
 *           type: string
 *         content:
 *           type: string
 *       required:
 *         - senderId
 *         - receiverId
 *         - content
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Enviar un mensaje
 *     tags: [Messages]
 *     requestBody:
 *       description: Datos del mensaje a enviar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageInput'
 *     responses:
 *       201:
 *         description: Mensaje creado y emitido por WS
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageInput'
 *       500:
 *         description: Error al enviar mensaje
 */
router.post('/messages', generalRateLimiter, sendMessageHandler);


/**
 * @swagger
 * /api/messages/{userId}/{contactId}:
 *   get:
 *     summary: Obtener historial de mensajes entre dos usuarios
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario autenticado
 *       - in: path
 *         name: contactId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del otro usuario
 *     responses:
 *       200:
 *         description: Lista de mensajes ordenada cronológicamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   senderId:
 *                     type: string
 *                   receiverId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error al obtener mensajes
 */
router.get('/messages/:userId/:contactId', generalRateLimiter, getMessagesHandler);



/**
 * @swagger
 * /api/conversations/{userId}:
 *   get:
 *     summary: Obtener conversaciones de un usuario
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de conversaciones con último mensaje
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   members:
 *                     type: array
 *                     items:
 *                       type: string
 *                   lastMessage:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error cargando conversaciones
 */
router.get('/conversations/:userId', generalRateLimiter, getConversationsHandler);


/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Pedidos de compra
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Pedido creado
 *       500:
 *         description: Error al crear pedido
 */
router.post('/orders', generalRateLimiter, createOrderHandler);

/**
 * @swagger
 * /api/orders/{userId}:
 *   get:
 *     summary: Obtener pedidos de un usuario
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       500:
 *         description: Error al obtener pedidos
 */
router.get('/orders/:userId', generalRateLimiter, getUserOrdersHandler);


/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Pagos relacionados a pedidos
 */

/**
 * @openapi
 * /api/payments:
 *   post:
 *     summary: Registrar un pago
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *             required:
 *               - userId
 *               - orderId
 *               - amount
 *     responses:
 *       201:
 *         description: Pago registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payment:
 *                   type: object
 *       500:
 *         description: Error al procesar pago
 */

/**
 * @openapi
 * /api/payments/{userId}:
 *   get:
 *     summary: Obtener pagos de un usuario
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de pagos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   orderId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   paymentMethod:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error al obtener pagos
 */

router.post('/payments', generalRateLimiter, processPaymentHandler);
router.get('/payments/:userId', generalRateLimiter, getUserPaymentsHandler);

export default router;