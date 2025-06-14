import { Router } from 'express';
import { ensureOwner } from '../middleware/isOwner.js';
import { checkJwt } from '../middleware/session.js';
import {
  createDroneHandler,
  deleteDroneHandler,
  getDronesHandler,
  getDroneByIdHandler,
  updateDroneHandler,
  addDroneReviewHandler,
  getDronesByCategoryHandler,
  getDronesByPriceRangeHandler,
  addFavoriteHandler,
  removeFavoriteHandler,
  getFavoritesHandler,
  getMyDronesHandler,
  purchaseDroneHandler,
  purchaseMultipleDronesHandler, // <--- añadido
  getDroneConvertedPriceHandler,
  getUserPurchaseHistoryHandler,
  getUserSalesHistoryHandler,
} from '../controllers/drone_controller.js';
import { uploadImages, validateMinImages } from '../middleware/upload.js';

import { generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Drones
 *   description: Gestión de drones
 */

/**
 * @openapi
 * /api/drones:
 *   get:
 *     summary: Obtener todos los drones (conversión de divisa incluida)
 *     tags: [Drones]
 *     parameters:
 *       - in: query
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, HKD, NZD]
 *         description: Divisa solicitada para el precio
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página de resultados (empezando en 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados por página (máx 20)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por nombre (case-insensitive)
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Modelo del dron
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [venta, alquiler]
 *         description: Categoría
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum: [nuevo, usado]
 *         description: Condición
 *     responses:
 *       200:
 *         description: Lista de drones con precio convertido
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   model:
 *                     type: string
 *                   price:
 *                     type: number
 *                   currency:
 *                     type: string
 *                   averageRating:
 *                     type: number
 *       400:
 *         description: currency es requerido o no soportado
 *
 *   post:
 *     summary: Crear un nuevo dron (anuncio)
 *     tags: [Drones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, HKD, NZD]
 *                 description: Divisa del anuncio
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - model
 *               - price
 *               - currency
 *               - category
 *               - condition
 *               - location
 *     responses:
 *       201:
 *         description: Dron creado correctamente
 *       400:
 *         description: Error en la creación del dron
 *       500:
 *         description: Error interno del servidor
 */
router.get('/drones', generalRateLimiter, getDronesHandler);

/**
 * @openapi
 * /api/drones/{id}:
 *   get:
 *     summary: Obtener un dron por ID
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del dron
 *     responses:
 *       200:
 *         description: Datos del dron
 *       404:
 *         description: Dron no encontrado
 */
router.get('/drones/:id',generalRateLimiter, getDroneByIdHandler);

/**
 * @openapi
 * /api/drones:
 *   post:
 *     summary: Crear un nuevo dron
 *     description: Crea un nuevo dron con los datos proporcionados.
 *     tags:
 *       - Drones
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerId:
 *                 type: string
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             ownerId: "string"
 *             model: "string"
 *             price: 0
 *             details: "string"
 *             category: "venta"
 *             condition: "nuevo"
 *             location: "string"
 *             contact: "string"
 *             images:
 *               - "string"
 *     responses:
 *       201:
 *         description: Dron creado correctamente
 *       400:
 *         description: Error en la creación del dron
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/drones',
  generalRateLimiter,
  checkJwt,
  uploadImages,
  validateMinImages,
  createDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}:
 *   put:
 *     summary: Actualizar un dron existente
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *               price:
 *                 type: number
 *               details:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [venta, alquiler]
 *               condition:
 *                 type: string
 *                 enum: [nuevo, usado]
 *               location:
 *                 type: string
 *               contact:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 minItems: 1
 *                 maxItems: 4
 *               status:
 *                 type: string
 *                 enum: [actiu, venut]
 *           encoding:
 *             images:
 *               style: form
 *               explode: false
 *           example:
 *             model: "DJI Mini 3"
 *             price: 500
 *             details: "Dron en perfecto estado, poco uso."
 *             category: "venta"
 *             condition: "usado"
 *             location: "Barcelona"
 *             contact: "email@ejemplo.com"
 *             status: "actiu"
 *     responses:
 *       200:
 *         description: Dron actualizado correctamente
 *       404:
 *         description: Dron no encontrado
 */
router.put(
  '/drones/:id',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  uploadImages,
  validateMinImages,
  updateDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}:
 *   delete:
 *     summary: Eliminar un dron
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Dron eliminado correctamente }
 *       404: { description: Dron no encontrado }
 */
router.delete(
  '/drones/:id',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  deleteDroneHandler
);

/**
 * @openapi
 * /api/drones/{id}/review:
 *   post:
 *     summary: Agregar reseña a un dron
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a reseñar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - rating
 *               - comment
 *             properties:
 *               userId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reseña agregada correctamente
 *       404:
 *         description: Dron o usuario no encontrado
 */
router.post('/drones/:id/review',generalRateLimiter, addDroneReviewHandler);

/**
 * @openapi
 * /api/drones/category/{category}:
 *   get:
 *     summary: Obtener drones por categoría
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Categoría de los drones a buscar
 *     responses:
 *       200:
 *         description: Lista de drones en la categoría especificada
 */
router.get('/drones/category/:category',generalRateLimiter, getDronesByCategoryHandler);

/**
 * @openapi
 * /api/drones/price:
 *   get:
 *     summary: Obtener drones por rango de precio
 *     tags:
 *       - Drones
 *     parameters:
 *       - in: query
 *         name: min
 *         required: true
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: max
 *         required: true
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Drones encontrados en el rango de precio
 *       400:
 *         description: Parámetros de precio inválidos
 */
router.get('/drones/price',generalRateLimiter, getDronesByPriceRangeHandler);

/**
 * @openapi
 * /api/users/{userId}/favourites/{droneId}:
 *   post:
 *     summary: Añadir un dron a favoritos
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: droneId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista actualizada de favoritos }
 *   delete:
 *     summary: Eliminar un dron de favoritos
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: droneId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista actualizada de favoritos }
 *
 * /api/users/{userId}/favourites:
 *   get:
 *     summary: Obtener lista de favoritos de un usuario
 *     tags: [Favourites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Lista paginada de favoritos }
 */
router.post(
  '/users/:userId/favourites/:droneId',
  generalRateLimiter,
  checkJwt,            
  addFavoriteHandler
);

router.delete(
  '/users/:userId/favourites/:droneId',
  generalRateLimiter,
  checkJwt,            
  removeFavoriteHandler
);

router.get(
  '/users/:userId/favourites',
  generalRateLimiter,
  checkJwt,            
  getFavoritesHandler
);

/**
 * @openapi
 * /api/users/{userId}/my-drones:
 *   get:
 *     summary: Llistar anuncis propis
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, sold] }
 *         description: Filtra per pendents o venuts
 *     responses:
 *       200: { description: Llista d’anuncis }
 */
router.get(
  '/users/:userId/my-drones',
  generalRateLimiter,
  checkJwt,            
  getMyDronesHandler
);


/**
 * @openapi
 * /api/drones/{id}/purchase:
 *   post:
 *     summary: Comprar un dron (solo descuenta en la divisa indicada)
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a comprar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID del usuario comprador
 *               payWithCurrency:
 *                 type: string
 *                 enum: [EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, HKD, NZD]
 *                 description: Divisa con la que el usuario quiere pagar
 *             required:
 *               - userId
 *               - payWithCurrency
 *     responses:
 *       200:
 *         description: Compra realizada correctamente
 *       400:
 *         description: Saldo insuficiente en la divisa seleccionada o error de parámetros
 *       404:
 *         description: Dron no encontrado
 */
router.post(
  '/drones/:id/purchase',
  generalRateLimiter,
  checkJwt,
  purchaseDroneHandler
);

/**
 * @openapi
 * /api/drones/purchase-multiple:
 *   post:
 *     summary: Comprar múltiples drones
 *     tags: [Drones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               droneIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               payWithCurrency:
 *                 type: string
 *                 enum: [EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, HKD, NZD]
 *             required:
 *               - userId
 *               - droneIds
 *               - payWithCurrency
 *     responses:
 *       200:
 *         description: Compra múltiple realizada correctamente
 *       400:
 *         description: Saldo insuficiente en la divisa seleccionada o error de parámetros
 *       404:
 *         description: Uno o más drones no encontrados
 */
router.post(
  '/drones/purchase-multiple',
  generalRateLimiter,
  checkJwt,
  purchaseMultipleDronesHandler
);

/**
 * @openapi
 * /api/drones/{id}/sold:
 *   put:
 *     summary: Marcar un dron com venut
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron a marcar com venut
 *     responses:
 *       200:
 *         description: Dron marcat com venut
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Drone'
 *       404:
 *         description: Dron no trobat
 *       500:
 *         description: Error intern del servidor
 */
router.put(
  '/drones/:id/sold',
  generalRateLimiter,
  checkJwt,
  ensureOwner,
  purchaseDroneHandler
);

router.get('/drones/:id/converted-price', getDroneConvertedPriceHandler);

/**
 * @openapi
 * /api/drones/{id}/converted-price:
 *   get:
 *     summary: Obtener el dron con el precio convertido a la divisa solicitada
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del dron
 *       - in: query
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [EUR, USD, GBP, JPY, CHF, CAD, AUD, CNY, HKD, NZD]
 *         description: Divisa solicitada para el precio
 *     responses:
 *       200:
 *         description: Dron con precio convertido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 model:
 *                   type: string
 *                 price:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 originalPrice:
 *                   type: number
 *                 originalCurrency:
 *                   type: string
 *       400:
 *         description: Error de parámetros o divisa no soportada
 *       404:
 *         description: Dron no encontrado
 */

/**
 * @openapi
 * /api/users/{userId}/purchase-history:
 *   get:
 *     summary: Obtener historial de compras de drones de un usuario
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Historial de compras
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error interno
 */
router.get('/users/:userId/purchase-history', getUserPurchaseHistoryHandler);

/**
 * @openapi
 * /api/users/{userId}/sales-history:
 *   get:
 *     summary: Obtener historial de ventas de drones de un usuario
 *     tags: [Drones]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Historial de ventas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Error interno
 */
router.get('/users/:userId/sales-history', getUserSalesHistoryHandler);

export default router;
