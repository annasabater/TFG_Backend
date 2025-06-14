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
	getUserPaymentsHandler
} from '../controllers/message_controller.js';
import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ----------------- DRONES -----------------
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

// ----------------- MESSAGES -----------------
/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Mensajería entre usuarios
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Enviar un mensaje
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageInput'
 *     responses:
 *       201:
 *         description: Mensaje creado y emitido por WS
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
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario autenticado
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del otro usuario
 *     responses:
 *       200:
 *         description: Lista de mensajes ordenada cronológicamente
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
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de conversaciones con último mensaje
 *       500:
 *         description: Error cargando conversaciones
 */
router.get('/conversations/:userId', generalRateLimiter, getConversationsHandler);

// ----------------- ORDERS -----------------
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

// ----------------- PAYMENTS -----------------
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Pagos relacionados a pedidos
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Registrar un pago
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentInput'
 *     responses:
 *       201:
 *         description: Pago registrado
 *       500:
 *         description: Error al procesar pago
 */
router.post('/payments', generalRateLimiter, processPaymentHandler);

/**
 * @swagger
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
 *       500:
 *         description: Error al obtener pagos
 */
router.get('/payments/:userId', generalRateLimiter, getUserPaymentsHandler);

export default router;